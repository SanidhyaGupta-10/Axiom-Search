import { groq } from '@ai-sdk/groq';
import { streamText } from 'ai';

export interface AgentStreamOptions {
    prompt?: string;
    system?: string;
    messages?: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>;
    model?: string;
}

/**
 * Groq AI Agent for ultra-fast LPU inference
 */
export function streamGroqAgent(options: AgentStreamOptions) {
    const selectedModel = options.model || 'llama-3.3-70b-versatile';

    if (options.messages && options.messages.length > 0) {
        return streamText({
            model: groq(selectedModel),
            system: options.system,
            messages: options.messages as any,
        });
    }

    return streamText({
        model: groq(selectedModel),
        prompt: options.prompt || '',
        system: options.system,
    });
}
