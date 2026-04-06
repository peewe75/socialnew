import axios from 'axios';
import { NewsItem } from '../types';

export interface N8NTriggerPayload {
  title: string;
  content: string;
  url: string;
  newsId?: string;
  source?: string;
  date?: string;
  topics?: string;
}

export interface N8NTriggerResult {
  newsId: string;
  status: 'sent' | 'failed';
  n8nResponse?: any;
  error?: string;
}

export class N8NService {
  private static readonly DEFAULT_WEBHOOK_URL =
    'https://sbmbcs.app.n8n.cloud/webhook/b049384f-16fc-4d77-a883-364e66280ec1';

  private webhookUrl: string;
  private webhookSecret: string;

  constructor() {
    this.webhookUrl = process.env.N8N_WEBHOOK_URL || N8NService.DEFAULT_WEBHOOK_URL;
    this.webhookSecret = process.env.WEBHOOK_SECRET || '';
  }

  /**
   * Invia una singola news al workflow n8n per generazione + approvazione + pubblicazione
   */
  async triggerWorkflow(newsItem: NewsItem): Promise<N8NTriggerResult> {
    const payload: N8NTriggerPayload = {
      title: newsItem.title,
      content: newsItem.summary,
      url: newsItem.link,
      newsId: newsItem.id,
      source: newsItem.source,
      date: newsItem.date,
    };

    try {
      console.log(`📨 Sending to n8n: "${newsItem.title}"`);

      const response = await axios.post(this.webhookUrl, payload, {
        headers: {
          'Content-Type': 'application/json',
          ...(this.webhookSecret && { 'X-Webhook-Secret': this.webhookSecret }),
        },
        timeout: 15000,
      });

      console.log(`✅ n8n workflow triggered for: "${newsItem.title}"`);

      return {
        newsId: newsItem.id || '',
        status: 'sent',
        n8nResponse: response.data,
      };
    } catch (error: any) {
      console.error(`❌ n8n trigger failed for "${newsItem.title}":`, error.message);
      return {
        newsId: newsItem.id || '',
        status: 'failed',
        error: error.message,
      };
    }
  }

  /**
   * Invia multiple news al workflow n8n (una alla volta, sequenziale)
   */
  async triggerBatch(newsItems: NewsItem[]): Promise<{
    total: number;
    sent: number;
    failed: number;
    results: N8NTriggerResult[];
  }> {
    const results: N8NTriggerResult[] = [];

    for (const item of newsItems) {
      const result = await this.triggerWorkflow(item);
      results.push(result);

      // Piccolo delay tra i trigger per non sovraccaricare n8n
      if (newsItems.indexOf(item) < newsItems.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    return {
      total: newsItems.length,
      sent: results.filter(r => r.status === 'sent').length,
      failed: results.filter(r => r.status === 'failed').length,
      results,
    };
  }

  /**
   * Verifica che n8n sia raggiungibile
   */
  async healthCheck(): Promise<{ reachable: boolean; url: string; error?: string }> {
    try {
      // Testa con un OPTIONS o HEAD request
      await axios.head(this.webhookUrl, { timeout: 5000 });
      return { reachable: true, url: this.webhookUrl };
    } catch (error: any) {
      // Anche un 404/405 significa che n8n è raggiungibile
      if (error.response) {
        return { reachable: true, url: this.webhookUrl };
      }
      return { reachable: false, url: this.webhookUrl, error: error.message };
    }
  }
}
