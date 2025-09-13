export type AiProvider = {
  baseUrl: string;
  apiKey: string;
  models: string[];
};

export const providers: Record<string, AiProvider> = {
  openai: {
    baseUrl: process.env.OPENAI_API_BASE || "https://api.openai.com/v1",
    apiKey: process.env.OPENAI_API_KEY || "",
    models: ["gpt-5.0"],
  },
};

export const defaultProvider = "openai";
