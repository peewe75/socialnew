import { Request, Response } from 'express';
import { N8NService } from '../services/n8n.service';
import { PerplexityService } from '../services/perplexity.service';
import { v4 as uuidv4 } from 'uuid';

const n8nService = new N8NService();

/**
 * POST /api/n8n/trigger
 * Raccoglie news e le invia direttamente al workflow n8n
 * Questo è il punto di ingresso principale: news collection → n8n pipeline
 */
export const triggerPipeline = async (req: Request, res: Response) => {
  try {
    const perplexityService = new PerplexityService();
    const { topics = 'tech, AI, innovation', limit = 3 } = req.body;

    console.log(`\n🚀 N8N PIPELINE TRIGGER`);
    console.log(`   Topics: ${topics}`);
    console.log(`   Limit: ${limit}\n`);

    // Step 1: Raccogli news
    console.log(`📰 Step 1: Collecting news...`);
    const newsItems = await perplexityService.collectNews(topics, limit);

    if (newsItems.length === 0) {
      return res.json({
        success: true,
        message: 'No news collected',
        collected: 0,
        sent: 0,
      });
    }

    // Assegna ID univoci
    for (const item of newsItems) {
      if (!item.id) item.id = uuidv4();
    }

    console.log(`   ✅ Collected ${newsItems.length} news items\n`);

    // Step 2: Invia a n8n
    console.log(`📨 Step 2: Sending to n8n workflow...`);
    const batchResult = await n8nService.triggerBatch(newsItems);

    console.log(`\n📊 Pipeline Results:`);
    console.log(`   Total: ${batchResult.total}`);
    console.log(`   Sent to n8n: ${batchResult.sent}`);
    console.log(`   Failed: ${batchResult.failed}\n`);

    res.json({
      success: true,
      collected: newsItems.length,
      sent: batchResult.sent,
      failed: batchResult.failed,
      results: batchResult.results,
      newsItems,
    });
  } catch (error: any) {
    console.error('❌ Pipeline trigger error:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * POST /api/n8n/send
 * Invia news items già raccolti al workflow n8n
 */
export const sendToN8N = async (req: Request, res: Response) => {
  try {
    const { newsItems } = req.body;

    if (!newsItems || !Array.isArray(newsItems) || newsItems.length === 0) {
      return res.status(400).json({ error: 'newsItems array required' });
    }

    console.log(`\n📨 SENDING ${newsItems.length} NEWS TO N8N\n`);

    const batchResult = await n8nService.triggerBatch(newsItems);

    res.json({
      success: true,
      ...batchResult,
    });
  } catch (error: any) {
    console.error('❌ Send to n8n error:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * POST /api/n8n/callback/published
 * Callback da n8n dopo la pubblicazione — traccia i risultati
 */
export const onPublished = async (req: Request, res: Response) => {
  try {
    const {
      newsId,
      platform,
      postId,
      status,
      publishedAt,
      content,
      error: publishError,
    } = req.body;

    console.log(`\n📥 N8N CALLBACK: POST PUBLISHED`);
    console.log(`   News ID: ${newsId}`);
    console.log(`   Platform: ${platform}`);
    console.log(`   Status: ${status}`);
    console.log(`   Post ID: ${postId || 'N/A'}`);
    if (publishError) console.log(`   Error: ${publishError}`);
    console.log();

    // TODO: Salva nel database quando Prisma schema è pronto
    // await prisma.publishedPost.create({ data: { newsId, platform, postId, status, publishedAt, content } });

    res.json({
      success: true,
      message: `Callback received for ${platform}`,
      tracked: { newsId, platform, postId, status },
    });
  } catch (error: any) {
    console.error('❌ Callback error:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * POST /api/n8n/callback/approval
 * Callback da n8n quando un post viene approvato/rifiutato
 */
export const onApprovalResult = async (req: Request, res: Response) => {
  try {
    const { newsId, approved, approvedBy, approvedAt, platforms, edits } = req.body;

    console.log(`\n📥 N8N CALLBACK: APPROVAL RESULT`);
    console.log(`   News ID: ${newsId}`);
    console.log(`   Approved: ${approved}`);
    console.log(`   By: ${approvedBy || 'unknown'}`);
    console.log(`   Platforms: ${platforms?.join(', ') || 'all'}`);
    if (edits) console.log(`   Edits: ${edits.length} modifications`);
    console.log();

    // TODO: Salva nel database
    // await prisma.approval.create({ data: { newsId, approved, approvedBy, approvedAt, platforms } });

    res.json({
      success: true,
      message: `Approval ${approved ? 'accepted' : 'rejected'} for ${newsId}`,
    });
  } catch (error: any) {
    console.error('❌ Approval callback error:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * GET /api/n8n/health
 * Verifica la connessione con n8n
 */
export const checkHealth = async (req: Request, res: Response) => {
  try {
    const health = await n8nService.healthCheck();

    res.json({
      success: true,
      n8n: health,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * GET /api/n8n/config
 * Restituisce la configurazione n8n attuale (senza segreti)
 */
export const getConfig = async (req: Request, res: Response) => {
  try {
    const health = await n8nService.healthCheck();

    res.json({
      success: true,
      config: {
        webhookUrl: process.env.N8N_WEBHOOK_URL ? '***configured***' : 'using default',
        webhookSecretSet: !!process.env.WEBHOOK_SECRET,
        n8nReachable: health.reachable,
      },
      workflow: {
        name: 'News to Social - HITL Cloud',
        id: 'DEPkXOOGUb0qfLDK',
        trigger: 'POST /webhook/b049384f-16fc-4d77-a883-364e66280ec1',
        platforms: ['instagram', 'facebook', 'twitter', 'linkedin', 'reddit', 'tiktok'],
        features: ['AI Content Generation', 'HITL Approval', 'Slack/Email Notifications', 'Multi-Platform Publishing'],
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
