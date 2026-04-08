export type AIProvider = 'openai' | 'openrouter' | 'anthropic';

export interface AIConfig {
  provider: AIProvider;
  apiKey: string;
  model: string;
  baseUrl?: string;
  temperature: number;
  maxTokens: number;
}

export function getAIConfig(): AIConfig {
  const provider = (process.env.AI_PROVIDER || 'openrouter') as AIProvider;
  const apiKey = process.env.AI_API_KEY;
  const modelOverride = process.env.AI_MODEL;

  if (!apiKey) {
    throw new Error(`${provider.toUpperCase()}_API_KEY not configured`);
  }

  const configs: Record<AIProvider, AIConfig> = {
    openai: {
      provider: 'openai',
      apiKey,
      model: modelOverride || 'gpt-4-turbo',
      baseUrl: 'https://api.openai.com/v1',
      temperature: 0.7,
      maxTokens: 1500,
    },
    openrouter: {
      provider: 'openrouter',
      apiKey,
      model: modelOverride || 'meta-llama/llama-3.3-70b-instruct:free',
      baseUrl: 'https://openrouter.ai/api/v1',
      temperature: 0.7,
      maxTokens: 1500,
    },
    anthropic: {
      provider: 'anthropic',
      apiKey,
      model: modelOverride || 'claude-3-sonnet-20240229',
      baseUrl: 'https://api.anthropic.com/v1',
      temperature: 0.7,
      maxTokens: 1500,
    },
  };

  return configs[provider];
}
