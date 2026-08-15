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
    origin: '*',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ---------- helpers ----------

const logError = (route: string, err: unknown) =>
    console.error(`[${route}]`, err);

const findOwnedConversation = async (userId: string, conversationId: string) =>
    prisma.conversation.findFirst({
        where: { id: conversationId, userId },
        include: {
            messages: {
                orderBy: { createdAt: 'asc' },
                select: { id: true, role: true, content: true, createdAt: true },
            },
        },
    });

const createMessage = (conversationId: string, role: 'USER' | 'ASSISTANT', content: string) =>
    prisma.message.create({ data: { conversationId, role, content } });

// ---------- conversation routes ----------

// List every conversation (with messages) for the authenticated user.
app.get('/conversations', middleware, async (req: any, res) => {
    try {
        const conversations = await prisma.conversation.findMany({
            where: { userId: req.userId },
            orderBy: { id: 'desc' },
            select: {
                id: true,
                title: true,
                slug: true,
                messages: {
                    orderBy: { createdAt: 'asc' },
                    select: { id: true, role: true, content: true, createdAt: true },
                },
            },
        });
        return res.json({ userId: req.userId, conversations });
    } catch (err) {
        logError('GET /conversations', err);
        return res.status(500).json({ error: 'Failed to load conversations' });
    }
});

// Fetch one conversation the user owns.
app.get('/conversations/:conversationId', middleware, async (req: any, res) => {
    try {
        const conversation = await findOwnedConversation(req.userId, req.params.conversationId);

        if (!conversation) {
            return res.status(404).json({ error: 'Conversation not found' });
        }

        return res.json({ conversation });
    } catch (err) {
        logError('GET /conversations/:conversationId', err);
        return res.status(500).json({ error: 'Failed to load conversation' });
    }
});

// Persist a completed user + assistant turn to an existing conversation.
app.post('/conversations/:conversationId', middleware, async (req: any, res) => {
    try {
        const { userMessage, assistantMessage } = req.body as {
            userMessage?: string;
            assistantMessage?: string;
        };

        if (!userMessage || !assistantMessage) {
            return res.status(400).json({ error: 'userMessage and assistantMessage are required' });
        }

        const conversation = await findOwnedConversation(req.userId, req.params.conversationId);
        if (!conversation) {
            return res.status(404).json({ error: 'Conversation not found' });
        }

        // Save both messages atomically so the chat can never half-update.
        await prisma.$transaction([
            createMessage(conversation.id, 'USER', userMessage),
            createMessage(conversation.id, 'ASSISTANT', assistantMessage),
        ]);

        return res.json({ ok: true });
    } catch (err) {
        logError('POST /conversations/:conversationId', err);
        return res.status(500).json({ error: 'Failed to save messages' });
    }
});

// ---------- LLM routes ----------

// Stream a fresh answer (web search + LLM, no chat history).
// TODO: enforce credits/usage gating before calling Tavily.
app.post('/perplexity-ask', middleware, async (req, res) => {
    try {
        const query: string = req.body.query;
        if (!query) {
            return res.status(400).json({ error: 'query is required' });
        }

        const webSearchResponse = await tavilyClient.search(query, { searchDepth: 'advanced' });
        const webSearchResults = webSearchResponse.results;

        const prompt = PROMPT_TEMPLATE
            .replace('{{WEB_SEARCH_RESULTS}}', JSON.stringify(webSearchResults))
            .replace('{{USER_QUERY}}', query);

        const result = streamText({
            model: groq('llama-3.3-70b-versatile'),
            prompt,
            system: SYSTEM_PROMPT,
        });

        for await (const textPart of result.textStream) {
            res.write(textPart);
        }

        res.write('\n------SOURCES-------\n');
        webSearchResults.forEach((r) => res.write(JSON.stringify(r.url)));
        res.end();
    } catch (err) {
        logError('POST /perplexity-ask', err);
        if (!res.headersSent) {
            return res.status(500).json({ error: 'Failed to generate answer' });
        }
        res.end();
    }
});

// Continue an existing conversation: load history, stream a follow-up, persist both turns.
app.post('/perplexity_ask/follow_up', middleware, async (req: any, res) => {
    try {
        const { conversationId, query } = req.body as { conversationId?: string; query?: string };
        if (!conversationId || !query) {
            return res.status(400).json({ error: 'conversationId and query are required' });
        }

        const conversation = await findOwnedConversation(req.userId, conversationId);
        if (!conversation) {
            return res.status(404).json({ error: 'Conversation not found' });
        }

        // Save the new user turn first so DB history matches what we send to the LLM.
        await createMessage(conversation.id, 'USER', query);

        const history = [
            ...conversation.messages.map((m) => ({
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

        res.setHeader('Content-Type', 'text/plain; charset=utf-8');

        let assistantReply = '';
        for await (const textPart of result.textStream) {
            assistantReply += textPart;
            res.write(textPart);
        }

        if (assistantReply.trim().length > 0) {
            await createMessage(conversation.id, 'ASSISTANT', assistantReply);
        }

        res.end();
    } catch (err) {
        logError('POST /perplexity_ask/follow_up', err);
        if (!res.headersSent) {
            return res.status(500).json({ error: 'Failed to process follow-up' });
        }
        res.end();
    }
});

// ---------- boot ----------

app.listen(3002, () => {
    console.log('Server running on http://localhost:3002');
});
