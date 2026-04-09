import { Request, Response } from 'express';
import { AnalyticsService } from '../services/analytics.service';
import { BlotatoService } from '../services/blotato.service';
import { getPrismaClient } from '../services/prisma.service';

const analyticsService = new AnalyticsService();
const blotatoService = new BlotatoService();
const prisma = getPrismaClient();

const normalizeTrackingStatus = (status: string | undefined): 'pending' | 'published' | 'failed' => {
  const normalized = String(status || '').toLowerCase();

  if (['published', 'posted', 'success', 'completed', 'complete', 'live'].includes(normalized)) {
    return 'published';
  }

  if (['failed', 'error', 'cancelled', 'rejected'].includes(normalized)) {
    return 'failed';
  }

  return 'pending';
};

const syncTrackedPosts = async (limit: number = 20) => {
  const trackedPosts = await prisma.blotatoTracking.findMany({
    include: {
      post: {
        include: {
          newsItem: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: limit,
  });

  const synced = [];

  for (const entry of trackedPosts) {
    let nextStatus = entry.status;
    let publishedAt = entry.publishedAt;
    let metrics = {
      platform: entry.platform,
      views: entry.views,
      likes: entry.likes,
      comments: entry.comments,
      shares: entry.shares,
      clicks: entry.clicks ?? 0,
      reach: entry.reach ?? 0,
      impressions: entry.impressions ?? 0,
      engagement: entry.engagement,
    };

    try {
      const status = await blotatoService.getPostStatus(entry.blotatoPostId);
      nextStatus = normalizeTrackingStatus(status.status);

      if (nextStatus === 'published' && !publishedAt) {
        publishedAt = new Date();
      }
    } catch (error: any) {
      console.warn(`[analytics] Status sync skipped for ${entry.blotatoPostId}: ${error.message}`);
    }

    if (nextStatus === 'published') {
      const fetchedMetrics = await analyticsService.getPostMetrics(entry.blotatoPostId, entry.platform);
      metrics = {
        platform: fetchedMetrics.platform,
        views: fetchedMetrics.views,
        likes: fetchedMetrics.likes,
        comments: fetchedMetrics.comments,
        shares: fetchedMetrics.shares,
        clicks: fetchedMetrics.clicks ?? 0,
        reach: fetchedMetrics.reach ?? 0,
        impressions: fetchedMetrics.impressions ?? 0,
        engagement: fetchedMetrics.engagement,
      };
    }

    const updated = await prisma.blotatoTracking.update({
      where: { id: entry.id },
      data: {
        status: nextStatus,
        publishedAt,
        views: metrics.views,
        likes: metrics.likes,
        comments: metrics.comments,
        shares: metrics.shares,
        clicks: metrics.clicks || 0,
        reach: metrics.reach || 0,
        impressions: metrics.impressions || 0,
        engagement: metrics.engagement,
        lastUpdated: new Date(),
      },
      include: {
        post: {
          include: {
            newsItem: true,
          },
        },
      },
    });

    if (nextStatus === 'published') {
      const latestSnapshot = await prisma.analytics.findFirst({
        where: {
          postId: updated.postId,
          platform: updated.platform,
        },
        orderBy: {
          recordedAt: 'desc',
        },
      });

      const snapshotUnchanged =
        latestSnapshot &&
        latestSnapshot.views === updated.views &&
        latestSnapshot.likes === updated.likes &&
        latestSnapshot.comments === updated.comments &&
        latestSnapshot.shares === updated.shares &&
        (latestSnapshot.clicks || 0) === updated.clicks &&
        (latestSnapshot.reach || 0) === updated.reach &&
        (latestSnapshot.impressions || 0) === updated.impressions &&
        latestSnapshot.engagement === updated.engagement;

      if (!snapshotUnchanged) {
        await prisma.analytics.create({
          data: {
            postId: updated.postId,
            platform: updated.platform,
            views: updated.views,
            likes: updated.likes,
            comments: updated.comments,
            shares: updated.shares,
            clicks: updated.clicks,
            reach: updated.reach,
            impressions: updated.impressions,
            engagement: updated.engagement,
          },
        });
      }
    }

    synced.push(updated);
  }

  return synced;
};

/**
 * GET /api/analytics/post/:blotatoPostId
 * Ottieni metriche per un singolo post
 */
export const getPostMetrics = async (req: Request, res: Response) => {
  try {
    const { blotatoPostId } = req.params;
    const { platform = 'linkedin' } = req.query;

    if (!blotatoPostId) {
      return res.status(400).json({ error: 'blotatoPostId required' });
    }

    const metrics = await analyticsService.getPostMetrics(
      blotatoPostId,
      platform as string
    );

    res.json({
      success: true,
      blotatoPostId,
      platform,
      metrics,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Metrics error:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * POST /api/analytics/multiple
 * Ottieni metriche per piu post
 */
export const getMultipleMetrics = async (req: Request, res: Response) => {
  try {
    const { posts } = req.body;

    if (!posts || !Array.isArray(posts)) {
      return res.status(400).json({
        error: 'posts array required',
      });
    }

    const metrics = await analyticsService.getMultiplePostsMetrics(posts);

    res.json({
      success: true,
      count: metrics.length,
      metrics,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Multiple metrics error:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * POST /api/analytics/summary
 * Genera analytics summary per un periodo
 */
export const generateSummary = async (req: Request, res: Response) => {
  try {
    const { posts, period = 'week' } = req.body;

    if (!posts || !Array.isArray(posts)) {
      return res.status(400).json({
        error: 'posts array required',
      });
    }

    const summary = await analyticsService.generateAnalyticsSummary(posts, period);

    res.json({
      success: true,
      summary,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Summary error:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * POST /api/analytics/compare
 * Confronta performance tra periodi
 */
export const comparePeriods = async (req: Request, res: Response) => {
  try {
    const { currentPeriod, previousPeriod } = req.body;

    if (!currentPeriod || !previousPeriod) {
      return res.status(400).json({
        error: 'currentPeriod and previousPeriod arrays required',
      });
    }

    const comparison = await analyticsService.comparePeriods(currentPeriod, previousPeriod);

    res.json({
      success: true,
      comparison,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Comparison error:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * POST /api/analytics/optimizations
 * Ottieni raccomandazioni di ottimizzazione
 */
export const getOptimizations = async (req: Request, res: Response) => {
  try {
    const { posts } = req.body;

    if (!posts || !Array.isArray(posts)) {
      return res.status(400).json({
        error: 'posts array required',
      });
    }

    const optimizations = await analyticsService.getOptimizations(posts);

    res.json({
      success: true,
      optimizations,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Optimizations error:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * GET /api/analytics/dashboard
 * Dashboard overview completo
 */
export const getDashboard = async (req: Request, res: Response) => {
  try {
    const trackedPosts = await syncTrackedPosts(20);
    const publishedPosts = trackedPosts.filter((entry) => entry.status === 'published');

    const livePosts = publishedPosts.map((entry) => ({
      postId: entry.postId,
      platform: entry.platform,
      blotatoPostId: entry.blotatoPostId,
      status: entry.status,
      title: entry.post.newsItem?.title || entry.postId,
      publishedAt: entry.publishedAt,
      lastUpdated: entry.lastUpdated,
      metrics: {
        platform: entry.platform,
        views: entry.views,
        likes: entry.likes,
        comments: entry.comments,
        shares: entry.shares,
        clicks: entry.clicks,
        reach: entry.reach,
        impressions: entry.impressions,
        engagement: entry.engagement,
      },
      collectedAt: entry.lastUpdated,
    }));

    const summary = livePosts.length > 0
      ? await analyticsService.generateAnalyticsSummary(livePosts, 'this_week')
      : {
          period: 'this_week',
          totalPosts: 0,
          totalViews: 0,
          totalEngagement: 0,
          averageEngagement: 0,
          topPlatform: { name: 'N/A', views: 0 },
          platformBreakdown: {},
          trends: {
            bestTime: 'N/A',
            bestContent: 'N/A',
            improvementAreas: ['Pubblica il primo contenuto per iniziare a popolare la dashboard'],
          },
        };

    const optimizations = livePosts.length > 0
      ? await analyticsService.getOptimizations(livePosts)
      : {
          bestTime: '14:00',
          bestStyle: 'engaging',
          recommendations: [
            'Pubblica altri contenuti per sbloccare raccomandazioni basate sui dati reali',
            'Collega gli altri social quando vuoi ampliare la distribuzione',
            'Controlla il rendimento dei prossimi post Facebook per ottimizzare il tono',
          ],
        };

    res.json({
      success: true,
      dashboard: {
        period: 'this_week',
        summary,
        optimizations,
        recentPosts: trackedPosts.map((entry) => ({
          postId: entry.postId,
          platform: entry.platform,
          blotatoPostId: entry.blotatoPostId,
          status: entry.status,
          title: entry.post.newsItem?.title || entry.postId,
          publishedAt: entry.publishedAt,
          lastUpdated: entry.lastUpdated,
          metrics: {
            platform: entry.platform,
            views: entry.views,
            likes: entry.likes,
            comments: entry.comments,
            shares: entry.shares,
            clicks: entry.clicks,
            reach: entry.reach,
            impressions: entry.impressions,
            engagement: entry.engagement,
          },
          collectedAt: entry.lastUpdated,
        })),
      },
      timestamp: new Date().toISOString(),
      note: trackedPosts.length > 0
        ? 'Statuses and metrics are synced from Blotato before rendering this dashboard.'
        : 'No published posts tracked yet.',
    });
  } catch (error: any) {
    console.error('Dashboard error:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * POST /api/analytics/sync
 * Forza la sincronizzazione dei post pubblicati/schedulati da Blotato
 */
export const syncAnalytics = async (req: Request, res: Response) => {
  try {
    const synced = await syncTrackedPosts(50);

    res.json({
      success: true,
      synced: synced.length,
      posts: synced.map((entry) => ({
        postId: entry.postId,
        platform: entry.platform,
        status: entry.status,
        blotatoPostId: entry.blotatoPostId,
        lastUpdated: entry.lastUpdated,
      })),
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Sync analytics error:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * GET /api/analytics/test
 * Test analytics con dati sintetici
 */
export const testAnalytics = async (req: Request, res: Response) => {
  try {
    const mockPosts = Array.from({ length: 5 }, (_, i) => ({
      postId: `post_${i + 1}`,
      platform: ['linkedin', 'facebook', 'instagram'][i % 3],
      blotatoPostId: `blotato_${i + 1}`,
      metrics: {
        platform: ['linkedin', 'facebook', 'instagram'][i % 3],
        views: (i + 1) * 100,
        likes: (i + 1) * 20,
        comments: (i + 1) * 5,
        shares: (i + 1) * 2,
        engagement: Number((((i + 1) * 27) / ((i + 1) * 100) * 100).toFixed(2)),
      },
      collectedAt: new Date(),
      title: `Post ${i + 1}`,
    }));

    const summary = await analyticsService.generateAnalyticsSummary(mockPosts, 'week');
    const optimizations = await analyticsService.getOptimizations(mockPosts);

    res.json({
      success: true,
      test: 'completed',
      mockPosts,
      summary,
      optimizations,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Test error:', error);
    res.status(500).json({ error: error.message });
  }
};
