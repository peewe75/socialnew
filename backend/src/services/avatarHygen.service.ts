import axios from 'axios';
import fs from 'fs';
import path from 'path';

export interface AvatarHygenConfig {
  apiKey: string;
  baseUrl: string;
}

export interface VideoGenerationRequest {
  script: string;
  voiceText: string;
  avatarId: string; // ID dell'avatar
  voiceId: string; // ID della voce
  language: string; // 'it-IT', 'en-US', etc
  duration?: number;
  style?: 'formal' | 'casual' | 'energetic';
}

export interface VideoGenerationResponse {
  videoId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  videoUrl?: string;
  progress?: number;
  estimatedTime?: number;
}

export class AvatarHygenService {
  private apiKey: string;
  private baseUrl: string;

  constructor(
    apiKey: string = process.env.AVATAR_HYGEN_API_KEY!,
    baseUrl: string = process.env.AVATAR_HYGEN_BASE_URL || 'https://api.avatarhygen.com/v1'
  ) {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
  }

  /**
   * Crea un video con Avatar Hygen
   */
  async generateVideo(request: VideoGenerationRequest): Promise<VideoGenerationResponse> {
    try {
      console.log(`🎬 Avatar Hygen: Creating video...`);
      console.log(`   Script length: ${request.script.length} chars`);
      console.log(`   Voice: ${request.language}`);
      console.log(`   Avatar: ${request.avatarId}\n`);

      // Se non hai API key, ritorna un mock response
      if (!this.apiKey || this.apiKey === 'demo') {
        console.log(`   ⚠️  Demo mode: Returning mock video response`);
        return this.getMockVideoResponse();
      }

      // Real API call
      const response = await axios.post(
        `${this.baseUrl}/videos/generate`,
        {
          script: request.script,
          voice_text: request.voiceText,
          avatar_id: request.avatarId,
          voice_id: request.voiceId,
          language: request.language,
          duration: request.duration || 30,
          style: request.style || 'casual',
        },
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
          timeout: 30000,
        }
      );

      console.log(`✅ Video generation started: ${response.data.video_id}`);

      return {
        videoId: response.data.video_id,
        status: response.data.status,
        videoUrl: response.data.video_url,
        progress: response.data.progress || 0,
        estimatedTime: response.data.estimated_time,
      };
    } catch (error: any) {
      console.error('❌ Avatar Hygen generation error:', error.message);
      throw error;
    }
  }

  /**
   * Controlla lo stato di un video in generazione
   */
  async getVideoStatus(videoId: string): Promise<VideoGenerationResponse> {
    try {
      console.log(`🔍 Checking video status: ${videoId}`);

      if (!this.apiKey || this.apiKey === 'demo') {
        return this.getMockVideoResponse(videoId, 'completed');
      }

      const response = await axios.get(
        `${this.baseUrl}/videos/${videoId}`,
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
          },
        }
      );

      return {
        videoId: response.data.id,
        status: response.data.status,
        videoUrl: response.data.video_url,
        progress: response.data.progress,
      };
    } catch (error: any) {
      console.error('❌ Failed to get video status:', error.message);
      throw error;
    }
  }

  /**
   * Lista gli avatar disponibili
   */
  async listAvatars(): Promise<Array<{
    id: string;
    name: string;
    language: string;
    thumbnail?: string;
  }>> {
    try {
      console.log(`👤 Fetching available avatars...`);

      if (!this.apiKey || this.apiKey === 'demo') {
        return this.getMockAvatarsList();
      }

      const response = await axios.get(
        `${this.baseUrl}/avatars`,
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
          },
        }
      );

      return response.data.avatars;
    } catch (error: any) {
      console.error('❌ Failed to list avatars:', error.message);
      return this.getMockAvatarsList(); // Fallback
    }
  }

  /**
   * Lista le voci disponibili
   */
  async listVoices(): Promise<Array<{
    id: string;
    name: string;
    language: string;
    gender: string;
  }>> {
    try {
      console.log(`🎙️  Fetching available voices...`);

      if (!this.apiKey || this.apiKey === 'demo') {
        return this.getMockVoicesList();
      }

      const response = await axios.get(
        `${this.baseUrl}/voices`,
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
          },
        }
      );

      return response.data.voices;
    } catch (error: any) {
      console.error('❌ Failed to list voices:', error.message);
      return this.getMockVoicesList(); // Fallback
    }
  }

  /**
   * Scarica il video generato
   */
  async downloadVideo(videoId: string, videoUrl: string): Promise<string> {
    try {
      console.log(`📥 Downloading video: ${videoId}`);

      const response = await axios.get(videoUrl, {
        responseType: 'arraybuffer',
        timeout: 60000,
      });

      const videosDir = path.join(process.cwd(), 'public', 'videos');
      if (!fs.existsSync(videosDir)) {
        fs.mkdirSync(videosDir, { recursive: true });
      }

      const filename = `avatar_${videoId}_${Date.now()}.mp4`;
      const filepath = path.join(videosDir, filename);

      fs.writeFileSync(filepath, response.data);

      const localUrl = `/videos/${filename}`;
      console.log(`✅ Video saved: ${localUrl}`);

      return localUrl;
    } catch (error: any) {
      console.error('❌ Download error:', error.message);
      throw error;
    }
  }

  /**
   * End-to-end: Genera, aspetta, scarica
   */
  async generateAndDownloadVideo(
    request: VideoGenerationRequest,
    maxWaitTime: number = 300000 // 5 min
  ): Promise<{
    videoId: string;
    status: string;
    localUrl?: string;
  }> {
    try {
      // Step 1: Genera video
      const generation = await this.generateVideo(request);

      console.log(`⏳ Waiting for video generation...`);

      // Step 2: Poll status finché non è completato
      const startTime = Date.now();
      let videoStatus = generation;

      while (videoStatus.status === 'pending' || videoStatus.status === 'processing') {
        if (Date.now() - startTime > maxWaitTime) {
          throw new Error('Video generation timeout');
        }

        await this.sleep(5000); // Aspetta 5 secondi
        videoStatus = await this.getVideoStatus(generation.videoId);

        console.log(`   Status: ${videoStatus.status} (${videoStatus.progress || 0}%)`);
      }

      if (videoStatus.status === 'failed') {
        throw new Error('Video generation failed');
      }

      // Step 3: Scarica il video completato
      let localUrl: string | undefined;
      if (videoStatus.videoUrl) {
        localUrl = await this.downloadVideo(generation.videoId, videoStatus.videoUrl);
      }

      console.log(`✅ Video completed: ${generation.videoId}`);

      return {
        videoId: generation.videoId,
        status: videoStatus.status,
        localUrl,
      };
    } catch (error: any) {
      console.error('❌ Generate and download error:', error.message);
      throw error;
    }
  }

  /**
   * Helper: Sleep
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Mock response per testing senza API key
   */
  private getMockVideoResponse(
    videoId?: string,
    status: string = 'pending'
  ): VideoGenerationResponse {
    return {
      videoId: videoId || `video_${Date.now()}`,
      status: status as any,
      videoUrl: status === 'completed' 
        ? `https://storage.avatarhygen.com/videos/demo_${Date.now()}.mp4`
        : undefined,
      progress: status === 'completed' ? 100 : Math.floor(Math.random() * 80),
      estimatedTime: 45,
    };
  }

  /**
   * Mock avatars list
   */
  private getMockAvatarsList(): Array<any> {
    return [
      {
        id: 'avatar_1',
        name: 'Marco - Professional',
        language: 'it-IT',
        thumbnail: 'https://...',
      },
      {
        id: 'avatar_2',
        name: 'Sofia - Casual',
        language: 'it-IT',
        thumbnail: 'https://...',
      },
      {
        id: 'avatar_3',
        name: 'Alex - Energetic',
        language: 'it-IT',
        thumbnail: 'https://...',
      },
      {
        id: 'avatar_4',
        name: 'James - Business',
        language: 'en-US',
        thumbnail: 'https://...',
      },
    ];
  }

  /**
   * Mock voices list
   */
  private getMockVoicesList(): Array<any> {
    return [
      {
        id: 'voice_it_1',
        name: 'Marco',
        language: 'it-IT',
        gender: 'male',
      },
      {
        id: 'voice_it_2',
        name: 'Sofia',
        language: 'it-IT',
        gender: 'female',
      },
      {
        id: 'voice_it_3',
        name: 'Antonio',
        language: 'it-IT',
        gender: 'male',
      },
      {
        id: 'voice_en_1',
        name: 'James',
        language: 'en-US',
        gender: 'male',
      },
      {
        id: 'voice_en_2',
        name: 'Sarah',
        language: 'en-US',
        gender: 'female',
      },
    ];
  }
}