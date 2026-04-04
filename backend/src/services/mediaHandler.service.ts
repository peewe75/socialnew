import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';

export type MediaProvider = 'local' | 's3' | 'cloudinary';

export interface MediaUploadResult {
  url: string;
  provider: MediaProvider;
  mediaId: string;
  filename: string;
}

export interface MediaGenerationRequest {
  type: 'image' | 'video';
  newsTitle: string;
  newsContent: string;
  style?: 'minimalist' | 'vibrant' | 'professional' | 'modern';
  platform?: 'instagram' | 'facebook' | 'tiktok' | 'linkedin' | 'blog';
}

export class MediaHandlerService {
  private provider: MediaProvider;
  private storageDir: string;

  constructor(provider: MediaProvider = (process.env.MEDIA_STORAGE || 'local') as MediaProvider) {
    this.provider = provider;
    this.storageDir = path.join(process.cwd(), 'public', 'media');

    // Crea la cartella se non esiste
    if (!fs.existsSync(this.storageDir)) {
      fs.mkdirSync(this.storageDir, { recursive: true });
    }
  }

  /**
   * Genera immagine usando Pollinations AI (gratuito)
   */
  async generateImage(request: MediaGenerationRequest): Promise<string> {
    try {
      console.log(`🖼️  Generating image for: ${request.newsTitle}`);

      const prompt = this.buildImagePrompt(request);
      const imageUrl = await this.callPollinations(prompt);

      // Scarica e salva localmente
      const localUrl = await this.downloadAndSave(imageUrl, 'image');

      console.log(`✅ Image generated and saved: ${localUrl}`);
      return localUrl;
    } catch (error: any) {
      console.error('❌ Image generation error:', error.message);
      throw error;
    }
  }

  /**
   * Genera video script per Avatar Hygen
   */
  async generateVideoScript(request: MediaGenerationRequest): Promise<{
    script: string;
    voicePrompt: string;
    duration: number;
  }> {
    try {
      console.log(`🎬 Generating video script for: ${request.newsTitle}`);

      const prompt = `
Crea uno script per un video di 30 secondi basato su questa news:

Titolo: ${request.newsTitle}
Contenuto: ${request.newsContent}

Requisiti:
- Script breve e impattante (max 150 parole)
- Dividi in 3 scene (intro, corpo, conclusione)
- Include gesti/movimenti suggeriti
- Tone: ${request.style || 'professional'}
- Linguaggio: Italiano

Formato JSON:
{
  "scenes": [
    {
      "duration": 10,
      "text": "...",
      "gestures": ["gesto1", "gesto2"],
      "background": "descrizione sfondo"
    }
  ],
  "voiceNotes": "...",
  "cta": "call-to-action"
}
      `;

      // Per ora, ritorna uno script template
      return {
        script: `
🎬 VIDEO SCRIPT: ${request.newsTitle}

SCENE 1 (10 sec):
"Hai sentito la notizia? ${request.newsTitle}"
[Gesto: sorpresa]

SCENE 2 (15 sec):
"${request.newsContent.substring(0, 100)}..."
[Gesto: spiegazione]

SCENE 3 (5 sec):
"Scopri di più nel nostro blog!"
[Gesto: invito azione]
        `,
        voicePrompt: `Leggi con entusiasmo e chiarezza: ${request.newsTitle}`,
        duration: 30,
      };
    } catch (error: any) {
      console.error('❌ Video script generation error:', error.message);
      throw error;
    }
  }

  /**
   * Carica media su Blotato (per poi usarli nei post)
   */
  async uploadMediaToBlotato(
    mediaUrl: string,
    filename: string
  ): Promise<{ success: boolean; blotatoMediaId: string }> {
    try {
      console.log(`📤 Uploading to Blotato: ${filename}`);

      // Placeholder - implementazione reale richiede API Blotato
      return {
        success: true,
        blotatoMediaId: `media_${Date.now()}`,
      };
    } catch (error: any) {
      console.error('❌ Blotato upload error:', error.message);
      throw error;
    }
  }

  /**
   * Supporta Pollinations AI (gratuito, no API key richiesta)
   */
  private async callPollinations(prompt: string): Promise<string> {
    try {
      // Pollinations genera URL direttamente
      const encodedPrompt = encodeURIComponent(prompt);
      const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}`;

      console.log(`   Pollinations prompt: ${prompt.substring(0, 50)}...`);

      // Testa se l'URL è valido
      const response = await axios.head(imageUrl, { timeout: 5000 });
      if (response.status === 200) {
        return imageUrl;
      }

      throw new Error('Failed to generate image URL');
    } catch (error: any) {
      console.error('❌ Pollinations error:', error.message);
      throw error;
    }
  }

  /**
   * Scarica immagine e salva localmente
   */
  private async downloadAndSave(imageUrl: string, type: string): Promise<string> {
    try {
      const response = await axios.get(imageUrl, {
        responseType: 'arraybuffer',
        timeout: 15000,
      });

      const filename = `${type}_${Date.now()}.jpg`;
      const filepath = path.join(this.storageDir, filename);

      fs.writeFileSync(filepath, response.data);

      // Ritorna URL relativo
      const localUrl = `/media/${filename}`;
      console.log(`   Saved: ${localUrl}`);

      return localUrl;
    } catch (error: any) {
      console.error('❌ Download error:', error.message);
      throw error;
    }
  }

  /**
   * Costruisci prompt per Pollinations based su platform/style
   */
  private buildImagePrompt(request: MediaGenerationRequest): string {
    const styles: Record<string, string> = {
      minimalist: 'minimalist design, clean lines, white space, professional',
      vibrant: 'vibrant colors, dynamic composition, energetic, modern',
      professional: 'corporate design, business aesthetic, clean, trustworthy',
      modern: 'contemporary art, trendy, sleek, innovative',
    };

    const platformGuides: Record<string, string> = {
      instagram: '1080x1080px, square format, eye-catching, storytelling',
      facebook: '1200x628px, landscape, engaging, clear message',
      tiktok: '1080x1920px, vertical, fast-paced, trendy',
      linkedin: '1200x627px, professional, business-focused',
      blog: '1200x800px, landscape, detailed, informative',
    };

    const style = styles[request.style || 'professional'];
    const platform = platformGuides[request.platform || 'instagram'];

    return `
High quality image for: "${request.newsTitle}"
Content: ${request.newsContent.substring(0, 100)}
Style: ${style}
Format: ${platform}
Language: Italian theme
Composition: balanced, professional, engaging
Color scheme: modern, contrasting, eye-catching
Text overlay: minimal, readable
Resolution: 300 DPI
    `.trim();
  }
}