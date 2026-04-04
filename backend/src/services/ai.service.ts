import axios from 'axios';
import { getAIConfig, AIProvider } from '../config/aiProvider';

export class AIService {
  private config = getAIConfig();

  /**
   * Chiama il provider AI con prompt generico
   */
  async chat(
    messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>,
    options?: { temperature?: number; maxTokens?: number }
  ): Promise<string> {
    const config = { ...this.config, ...options };

    try {
      console.log(`🤖 Calling ${this.config.provider.toUpperCase()} API...`);

      let response;

      if (this.config.provider === 'anthropic') {
        response = await this.callAnthropic(messages, config);
      } else {
        response = await this.callOpenAICompatible(messages, config);
      }

      return response;
    } catch (error: any) {
      console.error(`❌ AI API error (${this.config.provider}):`, error.message);
      throw error;
    }
  }

  /**
   * Supporta OpenAI e OpenRouter (stessa API)
   */
  private async callOpenAICompatible(
    messages: any[],
    config: any
  ): Promise<string> {
    const response = await axios.post(
      `${config.baseUrl}/chat/completions`,
      {
        model: config.model,
        messages,
        temperature: config.temperature,
        max_tokens: config.maxTokens,
      },
      {
        headers: {
          Authorization: `Bearer ${config.apiKey}`,
          'Content-Type': 'application/json',
          ...(config.provider === 'openrouter' && {
            'HTTP-Referer': 'https://news-to-social.app',
            'X-Title': 'News to Social Automation',
          }),
        },
        timeout: 30000,
      }
    );

    return response.data.choices[0].message.content;
  }

  /**
   * Supporta Anthropic Claude
   */
  private async callAnthropic(messages: any[], config: any): Promise<string> {
    const response = await axios.post(
      `${config.baseUrl}/messages`,
      {
        model: config.model,
        max_tokens: config.maxTokens,
        messages: messages.filter(m => m.role !== 'system'),
        system: messages.find(m => m.role === 'system')?.content || '',
      },
      {
        headers: {
          Authorization: `Bearer ${config.apiKey}`,
          'Content-Type': 'application/json',
          'anthropic-version': '2023-06-01',
        },
        timeout: 30000,
      }
    );

    return response.data.content[0].text;
  }
}