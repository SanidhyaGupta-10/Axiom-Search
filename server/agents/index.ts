import { streamGroqAgent, type AgentStreamOptions } from './groq';
import { streamOpenRouterAgent } from './openrouter';

export type AIProvider = 'groq' | 'openrouter';

export interface ExecuteAgentOptions extends AgentStreamOptions {
    provider?: AIProvider;
}

/**
 * Universal Agent Router
 * Routes prompt/messages to Groq or OpenRouter dynamically based on request
 */
export function streamAgent(options: ExecuteAgentOptions) {
    const provider = options.provider || 'groq';

    if (provider === 'openrouter') {
        return streamOpenRouterAgent(options);
    }

    return streamGroqAgent(options);
}

export * from './groq';
export * from './openrouter';
