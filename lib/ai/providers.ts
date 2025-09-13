export type ProviderConfig = {
  name: string;
  baseUrl: string;
  apiKey?: string;
  models: string[];
};

export const providers: Record<string, ProviderConfig> = {
  openai: {
    name: "OpenAI",
    baseUrl: process.env.OPENAI_API_BASE || "https://api.openai.com/v1",
    apiKey: process.env.OPENAI_API_KEY,
    models: ["gpt-5.0", "gpt-4o"],
  },
};
