export type ProviderConfig = {
  name: string;
  baseUrl: string;
  apiKey?: string;
  models: string[];
};

export const providers: Record<string, ProviderConfig> = {
  openai: {
    name: "OpenAI",
    baseUrl: process.env.AI_API_BASE || "https://api.openai.com/v1",
    apiKey: process.env.AI_API_KEY,
    models: [process.env.AI_MODEL || "gpt-5.0", "gpt-4o"],
  },
};
