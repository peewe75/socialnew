import axios from 'axios';
import { WebhookPayload } from '../types';

export class WebhookHandlerService {
  /**
   * Invia il payload al tuo webhook per approvazione
   */
  async sendApprovalRequest(payload: WebhookPayload): Promise<void> {
    const webhookUrl = process.env.APPROVAL_WEBHOOK_URL;

    if (!webhookUrl) {
      console.warn('⚠️  APPROVAL_WEBHOOK_URL not configured - payload not sent');
      return;
    }

    try {
      console.log(`📨 Sending webhook to: ${webhookUrl}`);

      await axios.post(webhookUrl, payload, {
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Secret': process.env.WEBHOOK_SECRET || '',
          'X-Request-ID': `${Date.now()}`,
        },
        timeout: 10000,
      });

      console.log(`✅ Webhook sent successfully for news: ${payload.newsId}`);
    } catch (error: any) {
      console.error('❌ Webhook send error:', error.message);
      // Non lanciamo errore, così il processo continua
    }
  }
}