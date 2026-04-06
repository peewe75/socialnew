import axios from 'axios';
import { WebhookPayload } from '../types';

export class WebhookHandlerService {
  private static readonly DEFAULT_WEBHOOK_URL =
    'https://sbmbcs.app.n8n.cloud/webhook/b049384f-16fc-4d77-a883-364e66280ec1';

  /**
   * Invia il payload al workflow n8n per approvazione HITL
   * Il webhook n8n si aspetta: { title, content, url }
   * Invia anche i dati extra per tracking
   */
  async sendApprovalRequest(payload: WebhookPayload): Promise<void> {
    // Priorità: N8N_WEBHOOK_URL > APPROVAL_WEBHOOK_URL > default n8n cloud
    const webhookUrl =
      process.env.N8N_WEBHOOK_URL ||
      process.env.APPROVAL_WEBHOOK_URL ||
      WebhookHandlerService.DEFAULT_WEBHOOK_URL;

    try {
      console.log(`📨 Sending to n8n webhook: ${webhookUrl}`);

      // Formato compatibile con il workflow n8n esistente
      const n8nPayload = {
        // Campi richiesti dal workflow n8n (Blog News Webhook → Workflow Configuration)
        title: payload.title,
        content: payload.summary,
        url: payload.link,
        // Campi extra per tracking nel backend
        newsId: payload.newsId,
        source: payload.source,
        timestamp: payload.timestamp,
        approvalUrl: payload.approvalUrl,
        // Se ci sono post pre-generati dal backend, li include come fallback
        generatedPosts: payload.generatedPosts,
        blogPostMarkdown: payload.blogPostMarkdown,
      };

      await axios.post(webhookUrl, n8nPayload, {
        headers: {
          'Content-Type': 'application/json',
          ...(process.env.WEBHOOK_SECRET && {
            'X-Webhook-Secret': process.env.WEBHOOK_SECRET,
          }),
          'X-Request-ID': `${Date.now()}`,
        },
        timeout: 15000,
      });

      console.log(`✅ n8n webhook triggered for: ${payload.newsId}`);
    } catch (error: any) {
      console.error('❌ n8n webhook error:', error.message);
      // Non lanciamo errore, così il processo continua
    }
  }
}
