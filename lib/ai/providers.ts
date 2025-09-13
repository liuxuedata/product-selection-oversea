export type ProviderConfig = {
  baseUrl: string;
  apiKeyEnv: string;
  models: string[];
};

export const providers: Record<string, ProviderConfig> = {
  openai: {
    baseUrl: process.env.OPENAI_API_BASE || "https://api.openai.com/v1",
    apiKeyEnv: "OPENAI_API_KEY",
    models: ["gpt-5.0", "gpt-4.0"],
  },
};

export type Provider = keyof typeof providers;
