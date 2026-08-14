import express from 'express';
import { tavily } from '@tavily/core';
import { streamText } from 'ai';
import { groq } from '@ai-sdk/groq';
import { SYSTEM_PROMPT, PROMPT_TEMPLATE } from './prompt';
import prisma from './db';
import { middleware } from './middleware';

const app = express();
const client = tavily({ apiKey: process.env.TAVILY_API_KEY });

app.use(express.json());

app.get('/conversations', middleware ,async () => {
    // get the user
    // 
});

app.post('/conversations', middleware, async () => {
    // create new conversation for the user
});

app.get('/conversations/:conversationId', middleware, async () => {
    // get the conversation
});

app.post('/conversations/:conversationId', middleware, async () => {
    // 
});

app.post('/perplexity-ask', middleware, async (req, res) => {
    // get the query from the user
    const query = req.body.query;

    // make sure that user has access/credits to hit the endpoint

    // check if we have web search for a similar query

    // web search to gather sources ( Step-4)
    const webSearchResponse = await client.search(query, {
        searchDepth: "advanced"
    });

    const webSearchResults = webSearchResponse.results;

    // context engineering on the prompt + web search responses
    const prompt = PROMPT_TEMPLATE
        .replace("{{WEB_SEARCH_RESULTS}}", JSON.stringify(webSearchResults))
        .replace("{{USER_QUERY}}", query);

    // hit the LLM and stream back the response
    const result = streamText({
        model: groq('llama-3.3-70b-versatile'),
        prompt: prompt,
        system: SYSTEM_PROMPT,
    });

    for await (const textPart of result.textStream) {
        res.write(textPart);
    }

    res.write('\n------SOURCES-------\n');
    webSearchResults.forEach(result => res.write(JSON.stringify(result.url)));
    res.end();
});

app.post('/perplexity_ask/follow_up', async (req, res) => {
    // Step1 - get the existing chat from the db,
    // Step2 - Forward the full history to the LLM
    // Step3 - Stream the response back to the user
    // Step4 - Update the chat in db with latest user message + new LLM response
})

app.listen(3002, () => {
    console.log("Server running on http://localhost:3002");
});

