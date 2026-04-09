import axios from 'axios';
import { NewsItem } from '../types';

export class PerplexityService {
  private apiKey: string;
  private baseUrl = 'https://openrouter.ai/api/v1';
  private model = process.env.NEWS_COLLECTION_MODEL || 'perplexity/sonar';

  constructor(apiKey: string = process.env.AI_API_KEY!) {
    this.apiKey = apiKey;
    if (!this.apiKey) {
      throw new Error('AI_API_KEY not configured for OpenRouter news collection');
    }
  }

  /**
   * Raccoglie news su un topic specifico
   */
  async collectNews(topic: string, limit: number = 5): Promise<NewsItem[]> {
    try {
      console.log(`🔍 Collecting news on: ${topic}`);

      const query = `
Dammi le ultime news su: "${topic}".
Per ogni news dammi:
- titolo (max 100 chars)
- sommario (2-3 frasi)
- fonte
- link se disponibile
- data pubblicazione

Rispondi in formato JSON array.
Esempio:
[
  {
    "title": "...",
    "summary": "...",
    "source": "...",
    "link": "...",
    "date": "2024-04-03"
  }
]
      `;

      const response = await axios.post(
        `${this.baseUrl}/chat/completions`,
        {
          model: this.model,
          messages: [
            {
              role: 'user',
              content: query,
            },
          ],
          temperature: 0.7,
          top_p: 0.9,
          return_citations: true,
        },
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://news-to-social.app',
            'X-Title': 'News to Social Automation',
          },
          timeout: 30000,
        }
      );

      const content = response.data.choices[0].message.content;
      const newsItems = this.parseNewsResponse(content);

      console.log(`✅ Collected ${newsItems.length} news items`);
      return newsItems.slice(0, limit);
    } catch (error: any) {
      console.error('❌ Perplexity API error:', error.message);
      throw error;
    }
  }

  /**
   * Parse the response from Perplexity
   */
  private parseNewsResponse(content: string): NewsItem[] {
    try {
      // Tenta il parsing JSON
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return Array.isArray(parsed) ? parsed : [parsed];
      }

      // Fallback: parsing manuale
      return [
        {
          title: 'News estratta',
          summary: content.substring(0, 500),
          source: 'Perplexity',
          link: '',
          date: new Date().toISOString().split('T')[0],
        },
      ];
    } catch (error) {
      console.error('Parse error:', error);
      return [];
    }
  }
}
