import { Request, Response } from 'express';
import { PerplexityService } from '../services/perplexity.service';
import { ContentGeneratorService } from '../services/contentGenerator.service';
import { WebhookHandlerService } from '../services/webhookHandler.service';
import { NewsItem, WebhookPayload } from '../types';
import { v4 as uuidv4 } from 'uuid';

const webhookService = new WebhookHandlerService();

const isAIProviderError = (error: any) => {
  const status = error?.response?.status;
  const msg = String(error?.message || '');
  // 429 rate limit, 404 model not found, 503 service unavailable
  return status === 429 || status === 404 || status === 503
    || msg.includes('429') || msg.includes('404') || msg.includes('503');
};

/** @deprecated use isAIProviderError */
const isRateLimitedError = isAIProviderError;

const buildFallbackPost = (
  platform: 'linkedin' | 'facebook' | 'instagram' | 'tiktok',
  newsItem: any
) => {
  const title = newsItem.title;
  const summary = newsItem.summary;
  const source = newsItem.source;

  const contentByPlatform = {
    linkedin: `${title}\n\n${summary}\n\nFonte: ${source}\nCosa ne pensi di questo aggiornamento?`,
    facebook: `${title}\n\n${summary}\n\nTu come la vedi? Scrivilo nei commenti.`,
    instagram: `${title}\n\n${summary}\n\nSalva il post per rileggerlo e condividilo con chi segue il tema.`,
    tiktok: `Hook: oggi ti racconto questa notizia.\n${title}\n${summary}\nChiudi con: seguimi per altri aggiornamenti.`,
  };

  return {
    platform,
    content: contentByPlatform[platform],
    hashtags: ['#ai', '#tech', '#innovation', '#news'],
  };
};

const buildFallbackBlogPost = (newsItem: any) => `# ${newsItem.title}

${newsItem.summary}

Fonte: ${newsItem.source}

Link originale: ${newsItem.link}

## Cosa significa

Questa e una bozza fallback generata quando il provider AI era temporaneamente in rate limit. Il contenuto puo essere rifinito prima della pubblicazione finale.
`;

async function withRateLimitFallback<T>(
  label: string,
  task: () => Promise<T>,
  fallback: () => T
): Promise<T> {
  try {
    return await task();
  } catch (error: any) {
    if (isAIProviderError(error)) {
      const status = error?.response?.status ?? 'unknown';
      console.warn(`⚠️ ${label} fallback used (AI provider error: ${status})`);
      return fallback();
    }
    throw error;
  }
}

const coerceNewsItem = (value: any): NewsItem | null => {
  if (!value || typeof value !== 'object') return null;

  const candidate = {
    id: value.id || value.newsId || uuidv4(),
    title: value.title,
    summary: value.summary || value.content || '',
    source: value.source || 'Unknown',
    link: value.link || value.url || '',
    date: value.date || new Date().toISOString().slice(0, 10),
  };

  if (!candidate.title || !candidate.summary) {
    return null;
  }

  return candidate;
};

const normalizeNewsItems = (input: any): NewsItem[] => {
  if (!input) return [];

  if (typeof input === 'string') {
    try {
      return normalizeNewsItems(JSON.parse(input));
    } catch {
      return [];
    }
  }

  if (Array.isArray(input)) {
    return input
      .map((item) => coerceNewsItem(item))
      .filter((item): item is NewsItem => item !== null);
  }

  if (typeof input === 'object') {
    if (Array.isArray(input.newsItems) || typeof input.newsItems === 'string') {
      return normalizeNewsItems(input.newsItems);
    }

    const singleItem = coerceNewsItem(input);
    return singleItem ? [singleItem] : [];
  }

  return [];
};

/**
 * POST /api/news/collect
 * Raccoglie news con Perplexity
 */
export const collectNews = async (req: Request, res: Response) => {
  try {
    const perplexityService = new PerplexityService();
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
    const contentGeneratorService = new ContentGeneratorService();
    const newsItems = normalizeNewsItems(req.body?.newsItems ?? req.body);

    if (!newsItems || !Array.isArray(newsItems) || newsItems.length === 0) {
      return res.status(400).json({ error: 'Invalid or empty newsItems' });
    }

    console.log(`\n📝 STAGE 2: CONTENT GENERATION`);
    console.log(`   Processing ${newsItems.length} news items\n`);

    const generatedContent = [];

    for (const newsItem of newsItems) {
      console.log(`   ▸ Generating for: "${newsItem.title}"`);

      // Genera per tutte le piattaforme
      const linkedinPost = await withRateLimitFallback(
        'LinkedIn generation',
        () => contentGeneratorService.generateLinkedInPost(newsItem),
        () => buildFallbackPost('linkedin', newsItem)
      );
      const facebookPost = await withRateLimitFallback(
        'Facebook generation',
        () => contentGeneratorService.generateFacebookPost(newsItem),
        () => buildFallbackPost('facebook', newsItem)
      );
      const instagramCaption = await withRateLimitFallback(
        'Instagram generation',
        () => contentGeneratorService.generateInstagramCaption(newsItem),
        () => buildFallbackPost('instagram', newsItem)
      );
      const tiktokScript = await withRateLimitFallback(
        'TikTok generation',
        () => contentGeneratorService.generateTikTokScript(newsItem),
        () => buildFallbackPost('tiktok', newsItem)
      );
      const blogPost = await withRateLimitFallback(
        'Blog generation',
        () => contentGeneratorService.generateBlogPost(newsItem),
        () => buildFallbackBlogPost(newsItem)
      );

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
