import { Request, Response } from 'express';
import { BlotatoService } from '../services/blotato.service';
import { getPrismaClient } from '../services/prisma.service';

const blotatoService = new BlotatoService();
const prisma = getPrismaClient();

const getAllowedPublishPlatforms = () =>
  (process.env.PUBLISH_ALLOWED_PLATFORMS || 'linkedin,facebook,instagram,tiktok')
    .split(',')
    .map((platform) => platform.trim().toLowerCase())
    .filter(Boolean);

const truncate = (value: string | undefined, max: number) =>
  (value || '').slice(0, max);

const getPlatformContent = (generatedPosts: any[] = [], platform: string) =>
  generatedPosts.find((post) => String(post.platform).toLowerCase() === platform.toLowerCase());

/**
 * GET /api/publish/accounts
 * Mostra i tuoi account social collegati
 */
export const getConnectedAccounts = async (req: Request, res: Response) => {
  try {
    console.log(`\n📱 Fetching connected Blotato accounts...\n`);

    const accounts = await blotatoService.getConnectedAccounts();

    res.json({
      success: true,
      count: accounts.length,
      accounts,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * POST /api/publish/approve
 * Riceve l'approvazione e pubblica su Blotato
 */
export const approveAndPublish = async (req: Request, res: Response) => {
  try {
    const {
      newsId,
      title,
      summary,
      source,
      link,
      approved,
      platforms,
      generatedPosts,
      scheduledTime,
    } = req.body;

    if (!approved) {
      console.log(`❌ Post ${newsId} rejected`);
      return res.json({ success: true, message: 'Post rejected' });
    }

    console.log(`\n🚀 STAGE 4: MULTI-PLATFORM PUBLISHING`);
    console.log(`   News ID: ${newsId}`);
    console.log(`   Platforms: ${platforms?.join(', ') || 'all'}`);
    console.log(`   Scheduled: ${scheduledTime || 'immediate'}\n`);

    const allowedPlatforms = getAllowedPublishPlatforms();

    // Warm cache AND get connected platforms list
    const connectedAccounts = await blotatoService.getConnectedAccounts();
    const connectedPlatforms = connectedAccounts
      .map((a: any) => String(a.platform || a.type || '').toLowerCase())
      .filter(Boolean);

    // Only publish to platforms that are both allowed AND connected on Blotato
    const postsToPublish = (generatedPosts || []).filter((p: any) => {
      const platform = String(p.platform).toLowerCase();
      return allowedPlatforms.includes(platform) && connectedPlatforms.includes(platform);
    });

    const skippedPosts = (generatedPosts || [])
      .filter((p: any) => !connectedPlatforms.includes(String(p.platform).toLowerCase()))
      .map((p: any) => ({ platform: p.platform, reason: 'not_connected' }));

    if (postsToPublish.length === 0) {
      console.log(`⚠️  No connected platforms to publish to. Skipped: ${skippedPosts.map(s => s.platform).join(', ')}`);
      return res.json({
        success: true,
        message: 'No connected platforms to publish to',
        skipped: skippedPosts,
        results: { total: 0, successful: 0, failed: 0, results: [] },
      });
    }

    // Pubblica su Blotato
    const publishResults = await blotatoService.publishToAll(
      postsToPublish,
      scheduledTime
    );

    console.log(`\n   📊 Results:`);
    console.log(`      Total: ${publishResults.total}`);
    console.log(`      Successful: ${publishResults.successful}`);
    console.log(`      Failed: ${publishResults.failed}\n`);

    const persistedAt = new Date();
    const newsItemId = String(newsId);
    const postId = `post_${newsItemId}`;
    const linkedinPost = getPlatformContent(generatedPosts, 'linkedin');
    const facebookPost = getPlatformContent(generatedPosts, 'facebook');
    const instagramPost = getPlatformContent(generatedPosts, 'instagram');
    const tiktokPost = getPlatformContent(generatedPosts, 'tiktok');

    await prisma.newsItem.upsert({
      where: { id: newsItemId },
      update: {
        title: truncate(title || facebookPost?.content || linkedinPost?.content || instagramPost?.content || tiktokPost?.content || `News ${newsItemId}`, 500),
        summary: truncate(summary || generatedPosts?.[0]?.content || 'Published from workflow', 5000),
        source: truncate(source || 'News to Social workflow', 200),
        link: truncate(link || 'https://news-to-social.vercel.app', 2000),
        publishedAt: persistedAt,
      },
      create: {
        id: newsItemId,
        title: truncate(title || facebookPost?.content || linkedinPost?.content || instagramPost?.content || tiktokPost?.content || `News ${newsItemId}`, 500),
        summary: truncate(summary || generatedPosts?.[0]?.content || 'Published from workflow', 5000),
        source: truncate(source || 'News to Social workflow', 200),
        link: truncate(link || 'https://news-to-social.vercel.app', 2000),
        publishedAt: persistedAt,
      },
    });

    await prisma.post.upsert({
      where: { id: postId },
      update: {
        status: 'PUBLISHED',
        approvedAt: persistedAt,
        publishedAt: persistedAt,
        scheduledFor: scheduledTime ? new Date(scheduledTime) : null,
        linkedinContent: linkedinPost?.content || null,
        facebookContent: facebookPost?.content || null,
        instagramContent: instagramPost?.content || null,
        tiktokContent: tiktokPost?.content || null,
        linkedinHashtags: linkedinPost?.hashtags || [],
        facebookHashtags: facebookPost?.hashtags || [],
        instagramHashtags: instagramPost?.hashtags || [],
        tiktokHashtags: tiktokPost?.hashtags || [],
        linkedinMediaUrls: linkedinPost?.mediaUrls || [],
        facebookMediaUrls: facebookPost?.mediaUrls || [],
        instagramMediaUrls: instagramPost?.mediaUrls || [],
        tiktokMediaUrls: tiktokPost?.mediaUrls || [],
      },
      create: {
        id: postId,
        newsItemId,
        status: 'PUBLISHED',
        approvedAt: persistedAt,
        publishedAt: persistedAt,
        scheduledFor: scheduledTime ? new Date(scheduledTime) : null,
        linkedinContent: linkedinPost?.content || null,
        facebookContent: facebookPost?.content || null,
        instagramContent: instagramPost?.content || null,
        tiktokContent: tiktokPost?.content || null,
        linkedinHashtags: linkedinPost?.hashtags || [],
        facebookHashtags: facebookPost?.hashtags || [],
        instagramHashtags: instagramPost?.hashtags || [],
        tiktokHashtags: tiktokPost?.hashtags || [],
        linkedinMediaUrls: linkedinPost?.mediaUrls || [],
        facebookMediaUrls: facebookPost?.mediaUrls || [],
        instagramMediaUrls: instagramPost?.mediaUrls || [],
        tiktokMediaUrls: tiktokPost?.mediaUrls || [],
      },
    });

    for (const result of publishResults.results || []) {
      const platform = String(result.platform || '').toLowerCase();
      if (!platform) continue;
      const trackingStatus = result.success ? 'pending' : 'failed';
      const trackingPublishedAt = null;

      await prisma.blotatoTracking.upsert({
        where: {
          postId_platform: {
            postId,
            platform,
          },
        },
        update: {
          blotatoPostId: result.postId || `${newsItemId}_${platform}_${persistedAt.getTime()}`,
          status: trackingStatus,
          publishedAt: trackingPublishedAt,
          lastUpdated: persistedAt,
        },
        create: {
          postId,
          platform,
          blotatoPostId: result.postId || `${newsItemId}_${platform}_${persistedAt.getTime()}`,
          status: trackingStatus,
          publishedAt: trackingPublishedAt,
          lastUpdated: persistedAt,
        },
      });
    }

    await prisma.auditLog.create({
      data: {
        action: 'post_published',
        entityType: 'post',
        entityId: postId,
        details: {
          newsId,
          allowedPlatforms,
          results: publishResults.results,
        },
      },
    });

    res.json({
      success: true,
      message: 'Posts published via Blotato',
      skipped: skippedPosts,
      results: publishResults,
    });
  } catch (error: any) {
    console.error('❌ Publishing error:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * GET /api/publish/status/:postId
 * Controlla lo stato di un post
 */
export const getPublishStatus = async (req: Request, res: Response) => {
  try {
    const { postId } = req.params;

    // Placeholder - implementare con Blotato API polling
    res.json({
      success: true,
      postId,
      status: 'published',
      views: 0,
      engagement: 0,
      message: 'Full analytics integration coming soon',
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
