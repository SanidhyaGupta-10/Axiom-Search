import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { streamText } from 'ai';
import type { AgentStreamOptions } from './groq';

const openrouter = createOpenRouter({
    apiKey: process.env.OPENROUTER_API_KEY,
});

/**
 * OpenRouter AI Agent supporting DeepSeek R1, Llama, Gemini, Claude, etc.
 */
export function streamOpenRouterAgent(options: AgentStreamOptions) {
    // Default to DeepSeek Chat or Llama 3.3
    const selectedModel = options.model || 'deepseek/deepseek-chat:free';

    if (options.messages && options.messages.length > 0) {
        return streamText({
            model: openrouter(selectedModel),
            system: options.system,
            messages: options.messages as any,
        });
    }

    return streamText({
        model: openrouter(selectedModel),
        prompt: options.prompt || '',
        system: options.system,
    });
}
