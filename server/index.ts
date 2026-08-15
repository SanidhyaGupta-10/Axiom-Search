import express from 'express';
import { tavily } from '@tavily/core';
import { streamAgent, type AIProvider } from './agents';
import { SYSTEM_PROMPT, PROMPT_TEMPLATE, formatSearchResults } from './prompt';
import prisma from './db';
import { middleware } from './middleware';
import cors from 'cors';

const app = express();
const tavilyClient = tavily({ apiKey: process.env.TAVILY_API_KEY });

app.use(express.json());
app.use(cors({
    origin: 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    exposedHeaders: ['x-conversation-id'],
}));

// ──────────── Conversations ────────────

// List all conversations for the user
app.get('/conversations', middleware, async (req: any, res) => {
    try {
        const conversations = await prisma.conversation.findMany({
            where: { userId: req.userId },
            orderBy: { id: 'desc' },
            include: { messages: { orderBy: { createdAt: 'asc' } } },
        });
        return res.json({ userId: req.userId, conversations });
    } catch (err) {
        console.error('[GET /conversations]', err);
        return res.status(500).json({ error: 'Failed to load conversations' });
    }
});

// Get a single conversation
app.get('/conversations/:conversationId', middleware, async (req: any, res) => {
    try {
        const conversation = await prisma.conversation.findFirst({
            where: { id: req.params.conversationId, userId: req.userId },
            include: { messages: { orderBy: { createdAt: 'asc' } } },
        });

        if (!conversation) return res.status(404).json({ error: 'Not found' });
        return res.json({ conversation });
    } catch (err) {
        console.error('[GET /conversations/:id]', err);
        return res.status(500).json({ error: 'Failed to load conversation' });
    }
});

// Create a new conversation
app.post('/conversations', middleware, async (req: any, res) => {
    try {
        const { title } = req.body;
        if (!title) return res.status(400).json({ error: 'title is required' });

        const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

        const conversation = await prisma.conversation.create({
            data: { title, slug, userId: req.userId },
        });
        return res.json({ conversation });
    } catch (err) {
        console.error('[POST /conversations]', err);
        return res.status(500).json({ error: 'Failed to create conversation' });
    }
});

// Save messages to an existing conversation
app.post('/conversations/:conversationId', middleware, async (req: any, res) => {
    try {
        const { userMessage, assistantMessage } = req.body;

        if (!userMessage || !assistantMessage) {
            return res.status(400).json({ error: 'userMessage and assistantMessage required' });
        }

        const conversation = await prisma.conversation.findFirst({
            where: { id: req.params.conversationId, userId: req.userId },
        });
        if (!conversation) return res.status(404).json({ error: 'Not found' });

        await prisma.$transaction([
            prisma.message.create({ data: { conversationId: conversation.id, role: 'USER', content: userMessage } }),
            prisma.message.create({ data: { conversationId: conversation.id, role: 'ASSISTANT', content: assistantMessage } }),
        ]);

        return res.json({ ok: true });
    } catch (err) {
        console.error('[POST /conversations/:id]', err);
        return res.status(500).json({ error: 'Failed to save messages' });
    }
});

// Delete a conversation
app.delete('/conversations/:conversationId', middleware, async (req: any, res) => {
    try {
        await prisma.conversation.deleteMany({
            where: { id: req.params.conversationId, userId: req.userId },
        });
        return res.json({ ok: true });
    } catch (err) {
        console.error('[DELETE /conversations/:id]', err);
        return res.status(500).json({ error: 'Failed to delete conversation' });
    }
});

// ──────────── LLM / Search ────────────

// Fresh search + LLM stream + save conversation & messages
app.post('/perplexity-ask', middleware, async (req: any, res) => {
    try {
        const { query, provider, model } = req.body as { query?: string; provider?: AIProvider; model?: string };
        if (!query) return res.status(400).json({ error: 'query is required' });

        const userId = req.userId;

        // Create conversation in database
        const slug = query.toLowerCase().slice(0, 50).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'search';
        const conversation = await prisma.conversation.create({
            data: {
                title: query.length > 50 ? query.slice(0, 47) + '...' : query,
                slug,
                userId: userId,
            }
        });

        res.setHeader('x-conversation-id', conversation.id);

        // Web search
        const { results: webSearchResults } = await tavilyClient.search(query, { searchDepth: 'advanced' });

        // Build prompt with indexed citations
        const prompt = PROMPT_TEMPLATE
            .replace('{{WEB_SEARCH_RESULTS}}', formatSearchResults(webSearchResults))
            .replace('{{USER_QUERY}}', query);

        // Stream AI response via requested agent (Groq or OpenRouter)
        const result = streamAgent({
            provider: provider || 'groq',
            model: model,
            prompt,
            system: SYSTEM_PROMPT,
        });

        let fullAssistantAnswer = '';
        for await (const textPart of result.textStream) {
            fullAssistantAnswer += textPart;
            res.write(textPart);
        }

        // Persist messages to DB
        if (fullAssistantAnswer.trim()) {
            await prisma.$transaction([
                prisma.message.create({
                    data: { conversationId: conversation.id, role: 'USER', content: query }
                }),
                prisma.message.create({
                    data: { conversationId: conversation.id, role: 'ASSISTANT', content: fullAssistantAnswer }
                }),
            ]);
        }

        res.write('\n------SOURCES-------\n');
        res.write(JSON.stringify({
            conversationId: conversation.id,
            sources: webSearchResults.map((r, i) => ({
                id: i + 1,
                title: r.title,
                url: r.url,
                content: r.content
            }))
        }));
        res.end();
    } catch (err) {
        console.error('[POST /perplexity-ask]', err);
        if (!res.headersSent) return res.status(500).json({ error: 'Failed to generate answer' });
        res.end();
    }
});

// Follow-up: load history, stream response, save both messages after
app.post('/perplexity_ask/follow_up', middleware, async (req: any, res) => {
    try {
        const { conversationId, query, provider, model } = req.body as {
            conversationId?: string;
            query?: string;
            provider?: AIProvider;
            model?: string;
        };
        if (!conversationId || !query) {
            return res.status(400).json({ error: 'conversationId and query required' });
        }

        const conversation = await prisma.conversation.findFirst({
            where: { id: conversationId, userId: req.userId },
            include: { messages: { orderBy: { createdAt: 'asc' } } },
        });
        if (!conversation) return res.status(404).json({ error: 'Not found' });

        // Build chat history from DB + new user message
        const history = [
            ...conversation.messages.map(m => ({
                role: m.role.toLowerCase() as 'user' | 'assistant',
                content: m.content,
            })),
            { role: 'user' as const, content: query },
        ];

        const result = streamAgent({
            provider: provider || 'groq',
            model: model,
            system: SYSTEM_PROMPT,
            messages: history,
        });

        // Stream and collect the reply
        let assistantReply = '';
        for await (const textPart of result.textStream) {
            assistantReply += textPart;
            res.write(textPart);
        }

        // Save BOTH messages together AFTER successful streaming
        if (assistantReply.trim()) {
            await prisma.$transaction([
                prisma.message.create({ data: { conversationId, role: 'USER', content: query } }),
                prisma.message.create({ data: { conversationId, role: 'ASSISTANT', content: assistantReply } }),
            ]);
        }

        res.end();
    } catch (err) {
        console.error('[POST /perplexity_ask/follow_up]', err);
        if (!res.headersSent) return res.status(500).json({ error: 'Follow-up failed' });
        res.end();
    }
});

// ──────────── Start ────────────

app.listen(3002, () => {
    console.log('Server running on http://localhost:3002');
});
