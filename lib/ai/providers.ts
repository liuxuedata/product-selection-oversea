export type ProviderConfig = {
  name: string;
  baseUrl: string;
  apiKey?: string;
  models: string[];
};

export const providers: Record<string, ProviderConfig> = {
  openai: {
    name: "OpenAI",
    // Support both new OPENAI_* vars and legacy AI_* vars for compatibility
    baseUrl:
      process.env.OPENAI_API_BASE ||
      process.env.AI_API_BASE ||
      "https://api.openai.com/v1",
    apiKey: process.env.OPENAI_API_KEY || process.env.AI_API_KEY,
    // Default to real OpenAI models so API calls succeed out of the box
    models: ["gpt-4o-mini", "gpt-4o"],
  },
};
