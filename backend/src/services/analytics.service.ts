import axios from 'axios';

export interface PostMetrics {
  platform: string;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  clicks?: number;
  engagement: number;
  reach?: number;
  impressions?: number;
}

export interface BlotatoMetrics {
  postId: string;
  platform: string;
  blotatoPostId: string;
  metrics: PostMetrics;
  collectedAt: Date;
  status?: string;
  publishedAt?: Date | null;
  title?: string;
}

export interface AnalyticsSummary {
  period: string;
  totalPosts: number;
  totalViews: number;
  totalEngagement: number;
  averageEngagement: number;
  topPlatform: {
    name: string;
    views: number;
  };
  platformBreakdown: Record<string, PostMetrics>;
  trends: {
    bestTime: string;
    bestContent: string;
    improvementAreas: string[];
  };
}

export class AnalyticsService {
  private blotatoApiKey: string;
  private blotatoBaseUrl: string;

  constructor(
    blotatoApiKey: string = process.env.BLOTATO_API_KEY || '',
    blotatoBaseUrl: string = process.env.BLOTATO_BASE_URL || 'https://backend.blotato.com/v2'
  ) {
    this.blotatoApiKey = blotatoApiKey;
    this.blotatoBaseUrl = blotatoBaseUrl;
  }

  async getPostMetrics(blotatoPostId: string, platform: string): Promise<PostMetrics> {
    try {
      console.log(`[analytics] Fetching metrics for ${platform}: ${blotatoPostId}`);

      if (!this.blotatoApiKey || this.blotatoApiKey === 'demo') {
        return this.getEmptyMetrics(platform);
      }

      const response = await axios.get(
        `${this.blotatoBaseUrl}/posts/${blotatoPostId}/analytics`,
        {
          headers: {
            'blotato-api-key': this.blotatoApiKey,
          },
          timeout: 10000,
        }
      );

      const data = response.data || {};

      return {
        platform,
        views: Number(data.views || 0),
        likes: Number(data.likes || 0),
        comments: Number(data.comments || 0),
        shares: Number(data.shares || 0),
        clicks: Number(data.clicks || 0),
        reach: Number(data.reach || 0),
        impressions: Number(data.impressions || 0),
        engagement: this.calculateEngagement(data),
      };
    } catch (error: any) {
      console.error(`[analytics] Failed to get metrics for ${platform}:`, error.message);
      return this.getEmptyMetrics(platform);
    }
  }

  async getMultiplePostsMetrics(
    posts: Array<{
      blotatoPostId: string;
      platform: string;
      postId: string;
    }>
  ): Promise<BlotatoMetrics[]> {
    const results: BlotatoMetrics[] = [];

    for (const post of posts) {
      const metrics = await this.getPostMetrics(post.blotatoPostId, post.platform);

      results.push({
        postId: post.postId,
        platform: post.platform,
        blotatoPostId: post.blotatoPostId,
        metrics,
        collectedAt: new Date(),
      });

      await this.sleep(250);
    }

    return results;
  }

  async generateAnalyticsSummary(
    posts: BlotatoMetrics[],
    period: string = 'week'
  ): Promise<AnalyticsSummary> {
    if (posts.length === 0) {
      return this.getEmptySummary(period);
    }

    const totalViews = posts.reduce((sum, post) => sum + post.metrics.views, 0);
    const totalLikes = posts.reduce((sum, post) => sum + post.metrics.likes, 0);
    const totalComments = posts.reduce((sum, post) => sum + post.metrics.comments, 0);
    const totalShares = posts.reduce((sum, post) => sum + post.metrics.shares, 0);
    const totalEngagement = totalLikes + totalComments + totalShares;

    const platformBreakdown = posts.reduce<Record<string, PostMetrics>>((acc, post) => {
      if (!acc[post.platform]) {
        acc[post.platform] = this.getEmptyMetrics(post.platform);
      }

      acc[post.platform].views += post.metrics.views;
      acc[post.platform].likes += post.metrics.likes;
      acc[post.platform].comments += post.metrics.comments;
      acc[post.platform].shares += post.metrics.shares;
      acc[post.platform].clicks = (acc[post.platform].clicks || 0) + (post.metrics.clicks || 0);
      acc[post.platform].reach = (acc[post.platform].reach || 0) + (post.metrics.reach || 0);
      acc[post.platform].impressions =
        (acc[post.platform].impressions || 0) + (post.metrics.impressions || 0);
      return acc;
    }, {});

    for (const metrics of Object.values(platformBreakdown)) {
      metrics.engagement = metrics.views > 0
        ? Number((((metrics.likes + metrics.comments + metrics.shares) / metrics.views) * 100).toFixed(2))
        : 0;
    }

    const topPlatformEntry = Object.entries(platformBreakdown).sort(
      (a, b) => b[1].views - a[1].views
    )[0];

    const averageEngagement = totalViews > 0
      ? Number(((totalEngagement / totalViews) * 100).toFixed(2))
      : 0;

    return {
      period,
      totalPosts: posts.length,
      totalViews,
      totalEngagement,
      averageEngagement,
      topPlatform: topPlatformEntry
        ? { name: topPlatformEntry[0], views: topPlatformEntry[1].views }
        : { name: 'N/A', views: 0 },
      platformBreakdown,
      trends: this.analyzeTrends(posts),
    };
  }

  async comparePeriods(
    currentPeriod: BlotatoMetrics[],
    previousPeriod: BlotatoMetrics[]
  ): Promise<{
    growth: {
      views: number;
      engagement: number;
      likes: number;
    };
    comparison: Record<string, unknown>;
  }> {
    const current = await this.generateAnalyticsSummary(currentPeriod, 'current');
    const previous = await this.generateAnalyticsSummary(previousPeriod, 'previous');

    return {
      growth: {
        views: this.calculateGrowth(current.totalViews, previous.totalViews),
        engagement: this.calculateGrowth(current.totalEngagement, previous.totalEngagement),
        likes: this.calculateGrowth(current.totalPosts, previous.totalPosts),
      },
      comparison: {
        current,
        previous,
      },
    };
  }

  async getOptimizations(posts: BlotatoMetrics[]): Promise<{
    bestTime: string;
    bestStyle: string;
    recommendations: string[];
    contentTypes: Record<string, number>;
  }> {
    if (posts.length === 0) {
      return {
        bestTime: '14:00',
        bestStyle: 'engaging',
        recommendations: [
          'Pubblica piu contenuti per sbloccare suggerimenti basati sui dati reali.',
          'Mantieni un solo canale attivo finche il flusso di pubblicazione non e stabile.',
          'Raccogli almeno 3-5 publish reali prima di confrontare le performance.',
        ],
        contentTypes: {},
      };
    }

    const platforms = posts.reduce<Record<string, number>>((acc, post) => {
      acc[post.platform] = (acc[post.platform] || 0) + 1;
      return acc;
    }, {});

    const topPerformer = [...posts].sort((a, b) => b.metrics.engagement - a.metrics.engagement)[0];
    const recommendations: string[] = [];

    if (topPerformer) {
      recommendations.push(
        `Il canale migliore al momento e ${topPerformer.platform} con engagement ${topPerformer.metrics.engagement.toFixed(1)}%.`
      );
    }

    if (posts.every((post) => post.metrics.views === 0)) {
      recommendations.push('Blotato non ha ancora restituito metriche di engagement: controlla piu tardi o sincronizza di nuovo.');
    } else {
      recommendations.push('Continua a monitorare i post pubblicati per aggiornare la dashboard con metriche reali.');
    }

    recommendations.push('Usa Facebook come canale primario finche non colleghi anche gli altri account social.');

    return {
      bestTime: '14:00',
      bestStyle: topPerformer?.metrics.engagement && topPerformer.metrics.engagement >= 2 ? 'engaging' : 'informative',
      recommendations,
      contentTypes: platforms,
    };
  }

  getEmptyMetrics(platform: string): PostMetrics {
    return {
      platform,
      views: 0,
      likes: 0,
      comments: 0,
      shares: 0,
      clicks: 0,
      reach: 0,
      impressions: 0,
      engagement: 0,
    };
  }

  private calculateEngagement(data: any): number {
    const likes = Number(data.likes || 0);
    const comments = Number(data.comments || 0);
    const shares = Number(data.shares || 0);
    const views = Number(data.views || 0);

    if (views <= 0) {
      return 0;
    }

    return Number((((likes + comments + shares) / views) * 100).toFixed(2));
  }

  private analyzeTrends(
    posts: BlotatoMetrics[]
  ): { bestTime: string; bestContent: string; improvementAreas: string[] } {
    if (posts.length === 0) {
      return {
        bestTime: 'N/A',
        bestContent: 'N/A',
        improvementAreas: ['Pubblica altri contenuti per ottenere insight affidabili.'],
      };
    }

    const topPost = [...posts].sort((a, b) => b.metrics.engagement - a.metrics.engagement)[0];
    const weakPosts = posts.filter((post) => post.metrics.views === 0);
    const improvementAreas: string[] = [];

    if (topPost) {
      improvementAreas.push(
        `Replica il tono del post migliore su ${topPost.platform}${topPost.title ? `: "${topPost.title}"` : ''}.`
      );
    }

    if (weakPosts.length > 0) {
      improvementAreas.push('Alcuni post non hanno ancora metriche disponibili da Blotato: attendi il prossimo sync prima di confrontarli.');
    }

    if (improvementAreas.length === 0) {
      improvementAreas.push('Il flusso e stabile: continua a pubblicare per arricchire lo storico analytics.');
    }

    return {
      bestTime: '14:00-16:00',
      bestContent: topPost?.platform || 'mixed',
      improvementAreas,
    };
  }

  private getEmptySummary(period: string): AnalyticsSummary {
    return {
      period,
      totalPosts: 0,
      totalViews: 0,
      totalEngagement: 0,
      averageEngagement: 0,
      topPlatform: { name: 'N/A', views: 0 },
      platformBreakdown: {},
      trends: {
        bestTime: 'N/A',
        bestContent: 'N/A',
        improvementAreas: ['Pubblica il primo contenuto per iniziare a raccogliere metriche reali.'],
      },
    };
  }

  private calculateGrowth(current: number, previous: number): number {
    if (previous === 0) {
      return current > 0 ? 100 : 0;
    }

    return Number((((current - previous) / previous) * 100).toFixed(2));
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
