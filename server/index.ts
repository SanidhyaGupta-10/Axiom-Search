import express from 'express';
import { tavily } from '@tavily/core';

const app = express();
const client = tavily({ apiKey: process.env.TAVILY_API_KEY })

app.use(express.json());

app.post('/perplexity-ask', async (req, res) => {
    // get the query from the user
    const query = req.body.query;

    // make sure that user has access/credits to hit the endpoint

    // check it we have web search for a similar query

    // web search to gather sources ( Step-4)
    const webSearchResponse = await client.search(query, {
        searchDepth: "advanced"
    })

    const webSearchResults = webSearchResponse.results;

    // do some context engineering on the prompt + web search responses

    // hit the LLM and stream back the response

    // also follow up response - (streaming)
});

app.listen(3000);