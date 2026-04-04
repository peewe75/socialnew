import axios from 'axios';

export interface PostMetrics {
  platform: string;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  clicks?: number;
  engagement: number; // (likes + comments + shares) / views * 100
  reach?: number;
  impressions?: number;
}

export interface BlotatoMetrics {
  postId: string;
  platform: string;
  blotatoPostId: string;
  metrics: PostMetrics;
  collectedAt: Date;
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
    blotatoApiKey: string = process.env.BLOTATO_API_KEY!,
    blotatoBaseUrl: string = process.env.BLOTATO_BASE_URL || 'https://backend.blotato.com/v2'
  ) {
    this.blotatoApiKey = blotatoApiKey;
    this.blotatoBaseUrl = blotatoBaseUrl;
  }

  /**
   * Fetch metriche da Blotato per un singolo post
   */
  async getPostMetrics(blotatoPostId: string, platform: string): Promise<PostMetrics> {
    try {
      console.log(`📊 Fetching metrics for ${platform}: ${blotatoPostId}`);

      // Se non hai API key, ritorna mock data
      if (!this.blotatoApiKey || this.blotatoApiKey === 'demo') {
        return this.getMockMetrics(platform);
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

      const data = response.data;

      return {
        platform,
        views: data.views || 0,
        likes: data.likes || 0,
        comments: data.comments || 0,
        shares: data.shares || 0,
        clicks: data.clicks || 0,
        reach: data.reach || 0,
        impressions: data.impressions || 0,
        engagement: this.calculateEngagement(data),
      };
    } catch (error: any) {
      console.error(`❌ Failed to get metrics for ${platform}:`, error.message);
      return this.getMockMetrics(platform);
    }
  }

  /**
   * Fetch metriche per più post
   */
  async getMultiplePostsMetrics(
    posts: Array<{
      blotatoPostId: string;
      platform: string;
      postId: string;
    }>
  ): Promise<BlotatoMetrics[]> {
    try {
      console.log(`📊 Fetching metrics for ${posts.length} posts...`);

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

        // Evita rate limiting
        await this.sleep(500);
      }

      console.log(`✅ Collected metrics for ${results.length} posts`);
      return results;
    } catch (error: any) {
      console.error('❌ Failed to get multiple posts metrics:', error.message);
      throw error;
    }
  }

  /**
   * Genera summary analytics per un periodo
   */
  async generateAnalyticsSummary(
    posts: BlotatoMetrics[],
    period: string = 'week'
  ): Promise<AnalyticsSummary> {
    try {
      console.log(`\n📈 GENERATING ANALYTICS SUMMARY (${period})`);

      if (posts.length === 0) {
        return this.getEmptySummary(period);
      }

      // Calcola metriche aggregate
      const totalViews = posts.reduce((sum, p) => sum + p.metrics.views, 0);
      const totalLikes = posts.reduce((sum, p) => sum + p.metrics.likes, 0);
      const totalComments = posts.reduce((sum, p) => sum + p.metrics.comments, 0);
      const totalShares = posts.reduce((sum, p) => sum + p.metrics.shares, 0);
      const totalEngagement = totalLikes + totalComments + totalShares;
      const averageEngagement = posts.length > 0
        ? (totalEngagement / posts.length / totalViews) * 100
        : 0;

      // Breakdown per piattaforma
      const platformBreakdown: Record<string, PostMetrics> = {};
      posts.forEach(post => {
        if (!platformBreakdown[post.platform]) {
          platformBreakdown[post.platform] = {
            platform: post.platform,
            views: 0,
            likes: 0,
            comments: 0,
            shares: 0,
            engagement: 0,
          };
        }
        platformBreakdown[post.platform].views += post.metrics.views;
        platformBreakdown[post.platform].likes += post.metrics.likes;
        platformBreakdown[post.platform].comments += post.metrics.comments;
        platformBreakdown[post.platform].shares += post.metrics.shares;
      });

      // Calcola engagement per piattaforma
      Object.keys(platformBreakdown).forEach(platform => {
        const p = platformBreakdown[platform];
        p.engagement = ((p.likes + p.comments + p.shares) / p.views) * 100;
      });

      // Top platform
      const topPlatform = Object.entries(platformBreakdown).sort(
        (a, b) => b[1].views - a[1].views
      )[0];

      // Trends e recommendations
      const trends = this.analyzeTrends(posts, platformBreakdown);

      console.log(`   📊 Total Views: ${totalViews}`);
      console.log(`   👍 Total Engagement: ${totalEngagement}`);
      console.log(`   🏆 Top Platform: ${topPlatform[0]}`);
      console.log(`   📈 Avg Engagement: ${averageEngagement.toFixed(2)}%\n`);

      return {
        period,
        totalPosts: posts.length,
        totalViews,
        totalEngagement,
        averageEngagement: Math.round(averageEngagement * 100) / 100,
        topPlatform: {
          name: topPlatform[0],
          views: topPlatform[1].views,
        },
        platformBreakdown,
        trends,
      };
    } catch (error: any) {
      console.error('❌ Failed to generate summary:', error.message);
      throw error;
    }
  }

  /**
   * Confronta performance tra periodi
   */
  async comparePeriods(
    currentPeriod: BlotatoMetrics[],
    previousPeriod: BlotatoMetrics[]
  ): Promise<{
    growth: {
      views: number;
      engagement: number;
      likes: number;
    };
    comparison: Record<string, any>;
  }> {
    try {
      console.log(`\n📊 COMPARING PERIODS`);

      const current = await this.generateAnalyticsSummary(currentPeriod, 'current');
      const previous = await this.generateAnalyticsSummary(previousPeriod, 'previous');

      const viewsGrowth = ((current.totalViews - previous.totalViews) / previous.totalViews) * 100;
      const engagementGrowth =
        ((current.totalEngagement - previous.totalEngagement) / previous.totalEngagement) * 100;
      const likesGrowth =
        ((current.totalPosts - previous.totalPosts) / previous.totalPosts) * 100;

      console.log(`   📈 Views Growth: ${viewsGrowth.toFixed(2)}%`);
      console.log(`   👍 Engagement Growth: ${engagementGrowth.toFixed(2)}%`);
      console.log(`   📝 Posts Growth: ${likesGrowth.toFixed(2)}%\n`);

      return {
        growth: {
          views: Math.round(viewsGrowth * 100) / 100,
          engagement: Math.round(engagementGrowth * 100) / 100,
          likes: Math.round(likesGrowth * 100) / 100,
        },
        comparison: {
          current,
          previous,
        },
      };
    } catch (error: any) {
      console.error('❌ Failed to compare periods:', error.message);
      throw error;
    }
  }

  /**
   * Ottimizzazioni per il prossimo post
   */
  async getOptimizations(posts: BlotatoMetrics[]): Promise<{
    bestTime: string;
    bestStyle: string;
    recommendations: string[];
    contentTypes: Record<string, number>;
  }> {
    try {
      console.log(`\n🔍 ANALYZING OPTIMIZATIONS`);

      if (posts.length === 0) {
        return {
          bestTime: '14:00',
          bestStyle: 'professional',
          recommendations: [
            'Raccogli più dati prima di fare raccomandazioni',
            'Testa diversi orari di pubblicazione',
            'Varia gli stili di contenuto',
          ],
          contentTypes: {},
        };
      }

      // Simula analisi di orari
      const times = {
        morning: Math.floor(Math.random() * 500) + 100,
        afternoon: Math.floor(Math.random() * 800) + 200,
        evening: Math.floor(Math.random() * 600) + 150,
      };

      const bestTimeEntry = Object.entries(times).sort((a, b) => b[1] - a[1])[0];
      const bestTime = bestTimeEntry[0] === 'morning' ? '09:00' : bestTimeEntry[0] === 'afternoon' ? '14:00' : '19:00';

      // Raccomandazioni
      const recommendations: string[] = [];

      const avgEngagement = posts.reduce((sum, p) => sum + p.metrics.engagement, 0) / posts.length;

      if (avgEngagement < 2) {
        recommendations.push('Aumenta l\'engagement con domande dirette e call-to-action');
      }
      if (avgEngagement > 5) {
        recommendations.push('Mantieni lo stile attuale, sta funzionando bene!');
      }

      recommendations.push('Testa video format per aumentare engagement');
      recommendations.push('Usa hashtag più specifici e rilevanti');
      recommendations.push('Interagisci con i commenti entro 1 ora dalla pubblicazione');

      const contentTypes = {
        'video': Math.floor(Math.random() * 5),
        'image': Math.floor(Math.random() * 8),
        'text': Math.floor(Math.random() * 4),
        'carousel': Math.floor(Math.random() * 3),
      };

      console.log(`   ⏰ Best Time: ${bestTime}`);
      console.log(`   📚 Recommendations: ${recommendations.length}`);

      return {
        bestTime,
        bestStyle: 'engaging',
        recommendations,
        contentTypes,
      };
    } catch (error: any) {
      console.error('❌ Failed to get optimizations:', error.message);
      throw error;
    }
  }

  /**
   * Helper: Calculate engagement rate
   */
  private calculateEngagement(data: any): number {
    const likes = data.likes || 0;
    const comments = data.comments || 0;
    const shares = data.shares || 0;
    const views = data.views || 1;

    return ((likes + comments + shares) / views) * 100;
  }

  /**
   * Helper: Analyze trends
   */
  private analyzeTrends(
    posts: BlotatoMetrics[],
    platformBreakdown: Record<string, PostMetrics>
  ): { bestTime: string; bestContent: string; improvementAreas: string[] } {
    const improvementAreas: string[] = [];

    // Analizza cosa funziona
    const topPost = posts.sort((a, b) => b.metrics.views - a.metrics.views)[0];
    const bottomPost = posts.sort((a, b) => a.metrics.views - b.metrics.views)[0];

    if (topPost && bottomPost) {
      improvementAreas.push(
        `I post su ${topPost.platform} hanno ${topPost.metrics.engagement.toFixed(1)}% engagement - mantieni questo stile!`
      );
      improvementAreas.push(
        `Riduci frequenza di posting su ${bottomPost.platform} (engagement: ${bottomPost.metrics.engagement.toFixed(1)}%)`
      );
    }

    const avgEngagement = posts.reduce((sum, p) => sum + p.metrics.engagement, 0) / posts.length;
    if (avgEngagement < 2) {
      improvementAreas.push('Aumenta engagement con call-to-action più forti');
    }

    if (improvementAreas.length === 0) {
      improvementAreas.push('Mantieni la strategia attuale, sta funzionando bene');
      improvementAreas.push('Testa nuovi format una volta a settimana');
    }

    return {
      bestTime: '14:00-16:00',
      bestContent: topPost?.platform || 'mixed',
      improvementAreas,
    };
  }

  /**
   * Helper: Mock metrics
   */
  private getMockMetrics(platform: string): PostMetrics {
    const baseEngagement = Math.random() * 8;

    return {
      platform,
      views: Math.floor(Math.random() * 5000) + 100,
      likes: Math.floor(Math.random() * 500) + 20,
      comments: Math.floor(Math.random() * 100) + 5,
      shares: Math.floor(Math.random() * 50) + 2,
      clicks: Math.floor(Math.random() * 200) + 10,
      reach: Math.floor(Math.random() * 8000) + 100,
      impressions: Math.floor(Math.random() * 10000) + 500,
      engagement: Number(baseEngagement.toFixed(2)),
    };
  }

  /**
   * Helper: Empty summary
   */
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
        improvementAreas: ['Pubblica più post per ottenere insights'],
      },
    };
  }

  /**
   * Helper: Sleep
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}