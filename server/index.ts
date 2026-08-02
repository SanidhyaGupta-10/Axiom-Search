import express from 'express';
import { tavily } from '@tavily/core';
import { streamText, Output } from 'ai';
import { groq } from '@ai-sdk/groq';
import { z } from 'zod';
import { SYSTEM_PROMPT, PROMPT_TEMPLATE, formatSearchResults } from './prompt';

const app = express();
const client = tavily({ apiKey: process.env.TAVILY_API_KEY });

app.use(express.json());

app.post('/perplexity-ask', async (req, res) => {
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
    // Format results as indexed sources so the LLM can cite [1], [2], etc.
    const formattedResults = formatSearchResults(webSearchResults);

    const prompt = PROMPT_TEMPLATE
        .replace("{{WEB_SEARCH_RESULTS}}", formattedResults)
        .replace("{{USER_QUERY}}", query);

    // hit the LLM and stream back the response
    const result = streamText({
        model: groq('llama-3.3-70b-versatile'),
        prompt: prompt,
        system: SYSTEM_PROMPT,
        output: Output.object({
            schema: z.object({
                followUps: z.array(z.string()),
                answer: z.string()
            }),
        }),
    });

    for await (const textPart of result.textStream) {
        res.end(textPart)
    }

    res.end('\n------SOURCES-------\n');
    webSearchResults.forEach();
});

app.listen(3000, () => {
    console.log("Server running on http://localhost:3000");
});

