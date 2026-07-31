import express from 'express';

const app = express();

app.post('/conversation', () => {
    // get the query from the user

    // make sure that user has access/credits to hit the endpoint

    // check it we have web search for a similar query

    // web search to gather sources

    // do some context engineering on the prompt + web search responses

    // hit the LLM and stream back the response

    // also follow up response - (streaming)
});

app.listen(3000);