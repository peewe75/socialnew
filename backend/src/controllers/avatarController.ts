import { Request, Response } from 'express';
import { AvatarHygenService, VideoGenerationRequest } from '../services/avatarHygen.service';
import { MediaHandlerService } from '../services/mediaHandler.service';

const createAvatarService = () => new AvatarHygenService();
const createMediaService = () => new MediaHandlerService();

/**
 * GET /api/avatar/avatars
 * Lista gli avatar disponibili
 */
export const listAvatars = async (req: Request, res: Response) => {
  try {
    const avatarService = createAvatarService();
    console.log(`\n👤 AVATAR LISTING`);

    const avatars = await avatarService.listAvatars();

    res.json({
      success: true,
      count: avatars.length,
      avatars,
    });
  } catch (error: any) {
    console.error('❌ List avatars error:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * GET /api/avatar/voices
 * Lista le voci disponibili
 */
export const listVoices = async (req: Request, res: Response) => {
  try {
    const avatarService = createAvatarService();
    console.log(`\n🎙️  VOICES LISTING`);

    const voices = await avatarService.listVoices();

    res.json({
      success: true,
      count: voices.length,
      voices,
    });
  } catch (error: any) {
    console.error('❌ List voices error:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * POST /api/avatar/generate
 * Genera un video con Avatar Hygen
 */
export const generateVideo = async (req: Request, res: Response) => {
  try {
    const avatarService = createAvatarService();
    const {
      script,
      voiceText,
      avatarId,
      voiceId,
      language = 'it-IT',
      newsTitle,
      newsContent,
      style = 'casual',
      downloadVideo = true,
    } = req.body;

    if (!script || !voiceText || !avatarId || !voiceId) {
      return res.status(400).json({
        error: 'script, voiceText, avatarId, voiceId sono obbligatori',
      });
    }

    console.log(`\n🎬 VIDEO GENERATION (Avatar Hygen)`);
    console.log(`   Avatar: ${avatarId}`);
    console.log(`   Voice: ${voiceId} (${language})`);
    console.log(`   Script length: ${script.length} chars\n`);

    const videoRequest: VideoGenerationRequest = {
      script,
      voiceText,
      avatarId,
      voiceId,
      language,
      style: style as any,
    };

    let result;

    if (downloadVideo) {
      // Genera, aspetta, scarica - all in one
      result = await avatarService.generateAndDownloadVideo(videoRequest);
      console.log(`✅ Video generated and downloaded`);
    } else {
      // Solo genera (async)
      result = await avatarService.generateVideo(videoRequest);
      console.log(`✅ Video generation started`);
    }

    const localUrl = 'localUrl' in result ? result.localUrl : undefined;

    res.json({
      success: true,
      videoId: result.videoId,
      status: result.status,
      localUrl,
      newsTitle,
      timestamp: new Date().toISOString(),
      downloadVideo,
    });
  } catch (error: any) {
    console.error('❌ Video generation error:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * GET /api/avatar/status/:videoId
 * Controlla lo stato di un video
 */
export const getVideoStatus = async (req: Request, res: Response) => {
  try {
    const avatarService = createAvatarService();
    const { videoId } = req.params;

    console.log(`\n🔍 Checking video status: ${videoId}`);

    const status = await avatarService.getVideoStatus(videoId);

    res.json({
      success: true,
      videoId,
      status: status.status,
      progress: status.progress,
      videoUrl: status.videoUrl,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('❌ Status check error:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * POST /api/avatar/download/:videoId
 * Scarica un video completato
 */
export const downloadGeneratedVideo = async (req: Request, res: Response) => {
  try {
    const avatarService = createAvatarService();
    const { videoId } = req.params;
    const { videoUrl } = req.body;

    if (!videoUrl) {
      return res.status(400).json({ error: 'videoUrl required' });
    }

    console.log(`\n📥 Downloading video: ${videoId}`);

    const localUrl = await avatarService.downloadVideo(videoId, videoUrl);

    res.json({
      success: true,
      videoId,
      localUrl,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('❌ Download error:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * POST /api/avatar/generate-from-news
 * Genera video completo da una news (end-to-end)
 */
export const generateVideoFromNews = async (req: Request, res: Response) => {
  try {
    const avatarService = createAvatarService();
    const mediaService = createMediaService();
    const {
      newsTitle,
      newsContent,
      avatarId = 'avatar_1',
      voiceId = 'voice_it_1',
      language = 'it-IT',
      style = 'casual',
    } = req.body;

    if (!newsTitle || !newsContent) {
      return res.status(400).json({
        error: 'newsTitle e newsContent sono obbligatori',
      });
    }

    console.log(`\n🎬 COMPLETE VIDEO GENERATION FROM NEWS`);
    console.log(`   Title: ${newsTitle}`);
    console.log(`   Avatar: ${avatarId}`);
    console.log(`   Voice: ${voiceId}\n`);

    // Step 1: Genera script video
    const videoScript = await mediaService.generateVideoScript({
      type: 'video',
      newsTitle,
      newsContent,
      style: style as any,
      platform: 'tiktok',
    });

    console.log(`✅ Video script generated`);

    // Step 2: Genera il video
    const videoRequest: VideoGenerationRequest = {
      script: videoScript.script,
      voiceText: videoScript.voicePrompt,
      avatarId,
      voiceId,
      language,
      style: style as any,
      duration: videoScript.duration,
    };

    const result = await avatarService.generateAndDownloadVideo(videoRequest, 300000);

    console.log(`✅ Complete video generation finished`);

    res.json({
      success: true,
      videoId: result.videoId,
      status: result.status,
      localUrl: result.localUrl,
      newsTitle,
      videoScript: videoScript.script,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('❌ Complete generation error:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * GET /api/avatar/test
 * Test rapido con demo data
 */
export const testAvatarGeneration = async (req: Request, res: Response) => {
  try {
    const avatarService = createAvatarService();
    console.log(`\n🧪 AVATAR GENERATION TEST`);

    // Step 1: Fetch avatars e voices
    const avatars = await avatarService.listAvatars();
    const voices = await avatarService.listVoices();

    console.log(`   Avatars: ${avatars.length}`);
    console.log(`   Voices: ${voices.length}`);

    // Step 2: Testa con default
    const testScript = `
SCENE 1 (10 sec):
"Ciao! Ho una notizia importante per te."

SCENE 2 (15 sec):
"OpenAI ha appena rilasciato GPT-5, un modello di IA rivoluzionario!"

SCENE 3 (5 sec):
"Scopri di più nel nostro blog. Arrivederci!"
    `;

    const videoRequest: VideoGenerationRequest = {
      script: testScript,
      voiceText: 'Ciao! Ho una notizia importante per te. OpenAI ha appena rilasciato GPT-5!',
      avatarId: avatars[0]?.id || 'avatar_1',
      voiceId: voices[0]?.id || 'voice_it_1',
      language: 'it-IT',
      style: 'casual',
      duration: 30,
    };

    const result = await avatarService.generateVideo(videoRequest);

    res.json({
      success: true,
      test: 'completed',
      avatarsAvailable: avatars.length,
      voicesAvailable: voices.length,
      videoId: result.videoId,
      status: result.status,
      progress: result.progress,
      firstAvatar: avatars[0],
      firstVoice: voices[0],
      timestamp: new Date().toISOString(),
      note: 'Use GET /api/avatar/status/:videoId to check progress',
    });
  } catch (error: any) {
    console.error('❌ Test error:', error);
    res.status(500).json({ error: error.message });
  }
};
