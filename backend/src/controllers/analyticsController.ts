import { Request, Response } from 'express';
import { AnalyticsService } from '../services/analytics.service';

const analyticsService = new AnalyticsService();

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

    console.log(`\n📊 FETCHING POST METRICS`);
    console.log(`   Post ID: ${blotatoPostId}`);
    console.log(`   Platform: ${platform}\n`);

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
    console.error('❌ Metrics error:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * POST /api/analytics/multiple
 * Ottieni metriche per più post
 */
export const getMultipleMetrics = async (req: Request, res: Response) => {
  try {
    const { posts } = req.body;

    if (!posts || !Array.isArray(posts)) {
      return res.status(400).json({
        error: 'posts array required',
      });
    }

    console.log(`\n📊 FETCHING MULTIPLE POST METRICS`);
    console.log(`   Posts: ${posts.length}\n`);

    const metrics = await analyticsService.getMultiplePostsMetrics(posts);

    res.json({
      success: true,
      count: metrics.length,
      metrics,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('❌ Multiple metrics error:', error);
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

    console.log(`\n📊 GENERATING ANALYTICS SUMMARY`);
    console.log(`   Period: ${period}`);
    console.log(`   Posts: ${posts.length}\n`);

    const summary = await analyticsService.generateAnalyticsSummary(posts, period);

    res.json({
      success: true,
      summary,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('❌ Summary error:', error);
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

    console.log(`\n📊 COMPARING PERIODS`);
    console.log(`   Current: ${currentPeriod.length} posts`);
    console.log(`   Previous: ${previousPeriod.length} posts\n`);

    const comparison = await analyticsService.comparePeriods(currentPeriod, previousPeriod);

    res.json({
      success: true,
      comparison,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('❌ Comparison error:', error);
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

    console.log(`\n🔍 ANALYZING OPTIMIZATIONS`);
    console.log(`   Posts analyzed: ${posts.length}\n`);

    const optimizations = await analyticsService.getOptimizations(posts);

    res.json({
      success: true,
      optimizations,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('❌ Optimizations error:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * GET /api/analytics/dashboard
 * Dashboard overview completo
 */
export const getDashboard = async (req: Request, res: Response) => {
  try {
    console.log(`\n📊 GENERATING ANALYTICS DASHBOARD`);

    // Mock data - in realtà verrebbe dal database
    const mockPosts = [
      {
        postId: 'post_1',
        platform: 'linkedin',
        blotatoPostId: 'blotato_1',
        metrics: {
          platform: 'linkedin',
          views: 2500,
          likes: 145,
          comments: 32,
          shares: 18,
          engagement: 6.28,
        },
        collectedAt: new Date(),
      },
      {
        postId: 'post_2',
        platform: 'facebook',
        blotatoPostId: 'blotato_2',
        metrics: {
          platform: 'facebook',
          views: 1800,
          likes: 120,
          comments: 45,
          shares: 12,
          engagement: 9.5,
        },
        collectedAt: new Date(),
      },
      {
        postId: 'post_3',
        platform: 'instagram',
        blotatoPostId: 'blotato_3',
        metrics: {
          platform: 'instagram',
          views: 3200,
          likes: 450,
          comments: 78,
          shares: 25,
          engagement: 15.8,
        },
        collectedAt: new Date(),
      },
    ];

    const summary = await analyticsService.generateAnalyticsSummary(mockPosts, 'week');
    const optimizations = await analyticsService.getOptimizations(mockPosts);

    res.json({
      success: true,
      dashboard: {
        period: 'this_week',
        summary,
        optimizations,
        recentPosts: mockPosts,
      },
      timestamp: new Date().toISOString(),
      note: 'Using mock data - integrate with real Blotato analytics',
    });
  } catch (error: any) {
    console.error('❌ Dashboard error:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * GET /api/analytics/test
 * Test analytics con mock data
 */
export const testAnalytics = async (req: Request, res: Response) => {
  try {
    console.log(`\n🧪 ANALYTICS TEST`);

    // Mock posts data
    const mockPosts = Array.from({ length: 5 }, (_, i) => ({
      postId: `post_${i + 1}`,
      platform: ['linkedin', 'facebook', 'instagram'][i % 3],
      blotatoPostId: `blotato_${i + 1}`,
      metrics: {
        platform: ['linkedin', 'facebook', 'instagram'][i % 3],
        views: Math.floor(Math.random() * 5000) + 500,
        likes: Math.floor(Math.random() * 500) + 50,
        comments: Math.floor(Math.random() * 100) + 10,
        shares: Math.floor(Math.random() * 50) + 5,
        engagement: Math.random() * 10,
      },
      collectedAt: new Date(),
    }));

    console.log(`   Generated ${mockPosts.length} mock posts`);

    // Test summary
    const summary = await analyticsService.generateAnalyticsSummary(mockPosts, 'week');
    console.log(`   ✅ Summary generated`);

    // Test optimizations
    const optimizations = await analyticsService.getOptimizations(mockPosts);
    console.log(`   ✅ Optimizations analyzed\n`);

    res.json({
      success: true,
      test: 'completed',
      mockPosts,
      summary,
      optimizations,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('❌ Test error:', error);
    res.status(500).json({ error: error.message });
  }
};