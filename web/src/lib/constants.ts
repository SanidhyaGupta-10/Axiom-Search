import type { AIModelConfig } from './types';

// ─── Available Multi-Agent Models ───
export const AVAILABLE_MODELS: AIModelConfig[] = [
  {
    id: "groq-quicksilver",
    name: "⚡ QuickSilver (8B Instant · 750 tps)",
    provider: "groq",
    model: "llama-3.1-8b-instant",
    badge: "⚡",
  },
  {
    id: "groq-llama-70b",
    name: "Fast Groq Llama 3.3 70B",
    provider: "groq",
    model: "llama-3.3-70b-versatile",
    badge: "⚡",
  },
  {
    id: "openrouter-deepseek-r1",
    name: "Reasoning DeepSeek R1",
    provider: "openrouter",
    model: "deepseek/deepseek-r1:free",
    badge: "🧠",
  },
  {
    id: "openrouter-gemini-flash",
    name: "Smart Gemini 2.0 Flash",
    provider: "openrouter",
    model: "google/gemini-2.0-flash-exp:free",
    badge: "✨",
  },
  {
    id: "openrouter-llama-3-3",
    name: "Open Llama 3.3 Free",
    provider: "openrouter",
    model: "meta-llama/llama-3.3-70b-instruct:free",
    badge: "🦙",
  },
];

// ─── Preset Exploration Suggestions ───
export const SUGGESTIONS: string[] = [
  "What are the best resources to learn Rust programming?",
  "How does Groq LPU architecture differ from Nvidia GPUs?",
  "Explain quantum entanglement like I’m 15",
  "Compare Bun vs Node.js vs Deno in 2026",
];

// ─── Domain extraction helper ───
export const getDomain = (url: string): string => {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "source";
  }
};
