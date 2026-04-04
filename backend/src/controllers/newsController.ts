import { Request, Response } from 'express';
import { PerplexityService } from '../services/perplexity.service';
import { ContentGeneratorService } from '../services/contentGenerator.service';
import { WebhookHandlerService } from '../services/webhookHandler.service';
import { WebhookPayload } from '../types';
import { v4 as uuidv4 } from 'uuid';

const perplexityService = new PerplexityService();
const contentGeneratorService = new ContentGeneratorService();
const webhookService = new WebhookHandlerService();

/**
 * POST /api/news/collect
 * Raccoglie news con Perplexity
 */
export const collectNews = async (req: Request, res: Response) => {
  try {
    const { topics = 'tech, AI, innovation', limit = 3 } = req.body;

    console.log(`\n📰 STAGE 1: NEWS COLLECTION`);
    console.log(`   Topics: ${topics}`);
    console.log(`   Limit: ${limit}\n`);

    const newsItems = await perplexityService.collectNews(topics, limit);

    res.json({
      success: true,
      count: newsItems.length,
      data: newsItems,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * POST /api/news/generate
 * Genera post per le piattaforme
 */
export const generatePosts = async (req: Request, res: Response) => {
  try {
    const { newsItems } = req.body;

    if (!newsItems || !Array.isArray(newsItems) || newsItems.length === 0) {
      return res.status(400).json({ error: 'Invalid or empty newsItems' });
    }

    console.log(`\n📝 STAGE 2: CONTENT GENERATION`);
    console.log(`   Processing ${newsItems.length} news items\n`);

    const generatedContent = [];

    for (const newsItem of newsItems) {
      console.log(`   ▸ Generating for: "${newsItem.title}"`);

      // Genera per tutte le piattaforme
      const linkedinPost = await contentGeneratorService.generateLinkedInPost(newsItem);
      const facebookPost = await contentGeneratorService.generateFacebookPost(newsItem);
      const instagramCaption = await contentGeneratorService.generateInstagramCaption(newsItem);
      const tiktokScript = await contentGeneratorService.generateTikTokScript(newsItem);
      const blogPost = await contentGeneratorService.generateBlogPost(newsItem);

      // Prepara webhook payload
      const payload: WebhookPayload = {
        newsId: newsItem.id || uuidv4(),
        title: newsItem.title,
        summary: newsItem.summary,
        source: newsItem.source,
        link: newsItem.link,
        generatedPosts: [
          linkedinPost,
          facebookPost,
          instagramCaption,
          tiktokScript,
        ],
        blogPostMarkdown: blogPost,
        timestamp: new Date().toISOString(),
        approvalUrl: `${process.env.FRONTEND_URL}/approve/${newsItem.id}`,
      };

      // Invia webhook per approvazione
      try {
        await webhookService.sendApprovalRequest(payload);
        console.log(`   ✅ Webhook sent for approval`);
        generatedContent.push({
          newsId: payload.newsId,
          status: 'webhook_sent',
          payload,
        });
      } catch (webhookError) {
        console.error(`   ⚠️  Webhook failed, payload saved locally`);
        generatedContent.push({
          newsId: payload.newsId,
          status: 'webhook_failed',
          payload,
        });
      }
    }

    console.log(`\n   ✅ Generation complete!\n`);

    res.json({
      success: true,
      generated: generatedContent.length,
      data: generatedContent,
    });
  } catch (error: any) {
    console.error('❌ Generation error:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * GET /api/news/list
 * Lista le news raccolte
 */
export const listNews = async (req: Request, res: Response) => {
  try {
    // Placeholder - implementare con database
    res.json({
      success: true,
      message: 'Database integration required',
      data: [],
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};