import { Request, Response } from 'express';
import { BlotatoService } from '../services/blotato.service';

const blotatoService = new BlotatoService();

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

    // Filter posts by platform
    const postsToPublish = generatedPosts?.filter((p: any) =>
      ['linkedin', 'facebook', 'instagram'].includes(p.platform.toLowerCase())
    ) || [];

    if (postsToPublish.length === 0) {
      return res.status(400).json({
        error: 'No valid platforms selected for publishing',
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

    res.json({
      success: true,
      message: 'Posts published via Blotato',
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