import { GeneratedPost, NewsItem } from '../types';
import { AIService } from './ai.service';

/** Estrae il primo oggetto JSON da una stringa (anche con testo intorno) */
function extractJSON(text: string): any {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error(`No JSON found in AI response: ${text.slice(0, 100)}`);
  return JSON.parse(match[0]);
}

export class ContentGeneratorService {
  private aiService = new AIService();

  /**
   * Genera post LinkedIn
   */
  async generateLinkedInPost(newsItem: NewsItem): Promise<GeneratedPost> {
    const prompt = `
Genera un post professionale per LinkedIn basato su questa news:

Titolo: ${newsItem.title}
Sommario: ${newsItem.summary}
Fonte: ${newsItem.source}

Requisiti:
- Tone professionale e engageable
- 150-200 caratteri
- Includi un call-to-action
- Aggiungi emoji appropriati (max 3)
- Generami anche 5 hashtag pertinenti in italiano

Rispondi SOLO in questo formato JSON (no markdown):
{
  "content": "...",
  "hashtags": ["#hashtag1", "#hashtag2", ...]
}
    `;

    try {
      const response = await this.aiService.chat([
        { role: 'user', content: prompt },
      ]);

      const result = extractJSON(response);

      return {
        platform: 'linkedin',
        content: result.content,
        hashtags: result.hashtags || [],
      };
    } catch (error: any) {
      console.error('❌ LinkedIn generation error:', error.message);
      throw error;
    }
  }

  /**
   * Genera post Facebook
   */
  async generateFacebookPost(newsItem: NewsItem): Promise<GeneratedPost> {
    const prompt = `
Genera un post conversazionale per Facebook su questa news:

Titolo: ${newsItem.title}
Sommario: ${newsItem.summary}

Requisiti:
- Tone amichevole e conversazionale
- 200-300 caratteri
- Incoraggia i commenti
- Aggiungi 3-5 emoji
- Generami 3 hashtag

Rispondi SOLO in JSON:
{
  "content": "...",
  "hashtags": ["#hashtag1", ...]
}
    `;

    try {
      const response = await this.aiService.chat([
        { role: 'user', content: prompt },
      ]);

      const result = extractJSON(response);

      return {
        platform: 'facebook',
        content: result.content,
        hashtags: result.hashtags || [],
      };
    } catch (error: any) {
      console.error('❌ Facebook generation error:', error.message);
      throw error;
    }
  }

  /**
   * Genera Instagram caption
   */
  async generateInstagramCaption(newsItem: NewsItem): Promise<GeneratedPost> {
    const prompt = `
Genera una caption Instagram da questa news:

Titolo: ${newsItem.title}
Sommario: ${newsItem.summary}

Requisiti:
- Story-telling style
- 150-200 caratteri max
- Emoji pertinenti (5-7)
- 10-15 hashtag trending in italiano
- Include CTA (like, comment, share)

JSON:
{
  "content": "...",
  "hashtags": ["#hashtag1", ...]
}
    `;

    try {
      const response = await this.aiService.chat([
        { role: 'user', content: prompt },
      ]);

      const result = extractJSON(response);

      return {
        platform: 'instagram',
        content: result.content,
        hashtags: result.hashtags || [],
      };
    } catch (error: any) {
      console.error('❌ Instagram generation error:', error.message);
      throw error;
    }
  }

  /**
   * Genera TikTok script
   */
  async generateTikTokScript(newsItem: NewsItem): Promise<GeneratedPost> {
    const prompt = `
Genera uno script per un TikTok video basato su questa news:

Titolo: ${newsItem.title}
Sommario: ${newsItem.summary}

Requisiti:
- Durata: 15-60 secondi (script)
- Hook interessante nelle prime 2 linee
- Tone divertente e virale
- Include call-to-action
- Max 100 parole
- 5-8 hashtag

JSON:
{
  "content": "...",
  "hashtags": ["#hashtag1", ...]
}
    `;

    try {
      const response = await this.aiService.chat([
        { role: 'user', content: prompt },
      ]);

      const result = extractJSON(response);

      return {
        platform: 'tiktok',
        content: result.content,
        hashtags: result.hashtags || [],
      };
    } catch (error: any) {
      console.error('❌ TikTok generation error:', error.message);
      throw error;
    }
  }

  /**
   * Genera blog post
   */
  async generateBlogPost(newsItem: NewsItem): Promise<string> {
    const prompt = `
Genera un articolo blog completo e SEO-optimizzato da questa news:

Titolo: ${newsItem.title}
Sommario: ${newsItem.summary}
Fonte: ${newsItem.source}
Link: ${newsItem.link}

Struttura richiesta:
1. Meta description (max 160 caratteri)
2. Introduzione (3-4 frasi)
3. 3-4 paragrafi di contenuto approfondito
4. Call-to-action
5. 5-8 keywords rilevanti

Rispondi in Markdown puro, senza triple backtick.
    `;

    try {
      const response = await this.aiService.chat([
        { role: 'user', content: prompt },
      ]);

      return response;
    } catch (error: any) {
      console.error('❌ Blog generation error:', error.message);
      throw error;
    }
  }
}