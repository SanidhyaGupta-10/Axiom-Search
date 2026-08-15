import express from 'express';
import { tavily } from '@tavily/core';
import { streamText } from 'ai';
import { groq } from '@ai-sdk/groq';
import { SYSTEM_PROMPT, PROMPT_TEMPLATE } from './prompt';
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

// ──────────── LLM / Search ────────────

// Fresh search + LLM stream (no history)
app.post('/perplexity-ask', middleware, async (req, res) => {
    try {
        const query = req.body.query;
        if (!query) return res.status(400).json({ error: 'query is required' });

        // Web search
        const { results: webSearchResults } = await tavilyClient.search(query, { searchDepth: 'advanced' });

        // Build prompt
        const prompt = PROMPT_TEMPLATE
            .replace('{{WEB_SEARCH_RESULTS}}', JSON.stringify(webSearchResults))
            .replace('{{USER_QUERY}}', query);

        // Stream LLM response
        const result = streamText({
            model: groq('llama-3.3-70b-versatile'),
            prompt,
            system: SYSTEM_PROMPT,
        });

        for await (const textPart of result.textStream) {
            res.write(textPart);
        }

        res.write('\n------SOURCES-------\n');
        webSearchResults.forEach(r => res.write(JSON.stringify(r.url)));
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
        const { conversationId, query } = req.body;
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

        const result = streamText({
            model: groq('llama-3.3-70b-versatile'),
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
