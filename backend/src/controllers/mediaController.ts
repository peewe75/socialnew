import { Request, Response } from 'express';
import { MediaHandlerService, MediaGenerationRequest } from '../services/mediaHandler.service';

const mediaService = new MediaHandlerService();

/**
 * POST /api/media/generate-image
 * Genera immagine per un post
 */
export const generateImage = async (req: Request, res: Response) => {
  try {
    const { newsTitle, newsContent, style, platform } = req.body;

    if (!newsTitle || !newsContent) {
      return res.status(400).json({
        error: 'newsTitle e newsContent sono obbligatori',
      });
    }

    console.log(`\n🖼️  MEDIA GENERATION: IMAGE`);
    console.log(`   Platform: ${platform || 'default'}`);
    console.log(`   Style: ${style || 'professional'}\n`);

    const request: MediaGenerationRequest = {
      type: 'image',
      newsTitle,
      newsContent,
      style,
      platform,
    };

    const imageUrl = await mediaService.generateImage(request);

    res.json({
      success: true,
      mediaType: 'image',
      url: imageUrl,
      platform,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('❌ Image generation error:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * POST /api/media/generate-video-script
 * Genera script per video
 */
export const generateVideoScript = async (req: Request, res: Response) => {
  try {
    const { newsTitle, newsContent, style } = req.body;

    if (!newsTitle || !newsContent) {
      return res.status(400).json({
        error: 'newsTitle e newsContent sono obbligatori',
      });
    }

    console.log(`\n🎬 MEDIA GENERATION: VIDEO SCRIPT`);
    console.log(`   Style: ${style || 'professional'}\n`);

    const request: MediaGenerationRequest = {
      type: 'video',
      newsTitle,
      newsContent,
      style,
      platform: 'tiktok',
    };

    const videoScript = await mediaService.generateVideoScript(request);

    res.json({
      success: true,
      mediaType: 'video_script',
      data: videoScript,
      timestamp: new Date().toISOString(),
      note: 'Script ready for Avatar Hygen integration',
    });
  } catch (error: any) {
    console.error('❌ Video script error:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * POST /api/media/upload-to-blotato
 * Carica media su Blotato
 */
export const uploadMediaToBlotato = async (req: Request, res: Response) => {
  try {
    const { mediaUrl, filename } = req.body;

    if (!mediaUrl || !filename) {
      return res.status(400).json({
        error: 'mediaUrl e filename sono obbligatori',
      });
    }

    console.log(`\n📤 Uploading media to Blotato`);

    const result = await mediaService.uploadMediaToBlotato(mediaUrl, filename);

    res.json({
      success: true,
      blotatoMediaId: result.blotatoMediaId,
      filename,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('❌ Upload error:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * GET /api/media/test-generation
 * Test rapido della generazione media
 */
export const testGeneration = async (req: Request, res: Response) => {
  try {
    console.log(`\n🧪 MEDIA GENERATION TEST`);

    const testRequest: MediaGenerationRequest = {
      type: 'image',
      newsTitle: 'OpenAI rilascia GPT-5',
      newsContent: 'Nuova versione con capacità di reasoning rivoluzionarie',
      style: 'vibrant',
      platform: 'instagram',
    };

    const imageUrl = await mediaService.generateImage(testRequest);

    const videoScript = await mediaService.generateVideoScript({
      ...testRequest,
      type: 'video',
    });

    res.json({
      success: true,
      image: {
        url: imageUrl,
        platform: 'instagram',
      },
      videoScript: {
        duration: videoScript.duration,
        scenes: videoScript.script.split('\n\n').length,
      },
      note: 'Test completed successfully',
    });
  } catch (error: any) {
    console.error('❌ Test error:', error);
    res.status(500).json({ error: error.message });
  }
};