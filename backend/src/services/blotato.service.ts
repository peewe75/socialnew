import axios from 'axios';
import { BlotatoAccount, BlotatoPost } from '../types';

export class BlotatoService {
  private apiKey: string;
  private baseUrl: string;
  private accountIds: Map<string, BlotatoAccount> = new Map();

  constructor(
    apiKey: string = process.env.BLOTATO_API_KEY!,
    baseUrl: string = process.env.BLOTATO_BASE_URL || 'https://backend.blotato.com/v2'
  ) {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
  }

  /**
   * Fetch tutti gli account social collegati
   */
  async getConnectedAccounts(): Promise<BlotatoAccount[]> {
    try {
      const response = await axios.get(`${this.baseUrl}/users/me/accounts`, {
        headers: {
          'blotato-api-key': this.apiKey,
          'Content-Type': 'application/json',
        },
      });

      const accounts = response.data.items || response.data.accounts || [];

      // Cache gli account per piattaforma
      for (const account of accounts) {
        const platformKey = String(account.platform || account.type || '').toLowerCase();
        if (platformKey) {
          this.accountIds.set(platformKey, {
            ...account,
            type: account.type || account.platform,
          });
        }
      }

      console.log(`✅ Found ${accounts.length} connected Blotato accounts`);
      return accounts;
    } catch (error: any) {
      console.error('❌ Failed to fetch Blotato accounts:', error.message);
      throw error;
    }
  }

  /**
   * Pubblica su LinkedIn
   */
  async postToLinkedIn(post: BlotatoPost): Promise<{ success: boolean; postId: string }> {
    try {
      const account = this.accountIds.get('linkedin');

      if (!account) {
        throw new Error('LinkedIn account not connected in Blotato');
      }

      const payload = {
        post: {
          accountId: account.id,
          content: {
            text: post.content,
            mediaUrls: post.mediaUrls || [],
            platform: 'linkedin',
          },
          target: {
            targetType: 'linkedin',
          },
        },
        ...(post.scheduledTime && { scheduledTime: post.scheduledTime }),
      };

      const response = await axios.post(`${this.baseUrl}/posts`, payload, {
        headers: {
          'blotato-api-key': this.apiKey,
          'Content-Type': 'application/json',
        },
      });

      console.log(`✅ LinkedIn post created: ${response.data.id}`);
      const postId = this.extractPostSubmissionId(response.data);
      return {
        success: true,
        postId,
      };
    } catch (error: any) {
      console.error('❌ LinkedIn post failed:', error.message);
      throw error;
    }
  }

  /**
   * Pubblica su Facebook
   */
  async postToFacebook(post: BlotatoPost): Promise<{ success: boolean; postId: string }> {
    try {
      const account = this.accountIds.get('facebook');

      if (!account) {
        throw new Error('Facebook account not connected in Blotato');
      }

      const pageId = await this.getFirstFacebookPage(account.id);

      const payload = {
        post: {
          accountId: account.id,
          content: {
            text: post.content,
            mediaUrls: post.mediaUrls || [],
            platform: 'facebook',
          },
          target: {
            targetType: 'facebook',
            pageId: pageId,
          },
        },
        ...(post.scheduledTime && { scheduledTime: post.scheduledTime }),
      };

      const response = await axios.post(`${this.baseUrl}/posts`, payload, {
        headers: {
          'blotato-api-key': this.apiKey,
          'Content-Type': 'application/json',
        },
      });

      console.log(`✅ Facebook post created: ${response.data.id}`);
      const postId = this.extractPostSubmissionId(response.data);
      return {
        success: true,
        postId,
      };
    } catch (error: any) {
      console.error('❌ Facebook post failed:', error.message);
      throw error;
    }
  }

  /**
   * Pubblica su Instagram
   */
  async postToInstagram(post: BlotatoPost): Promise<{ success: boolean; postId: string }> {
    try {
      const account = this.accountIds.get('instagram');

      if (!account) {
        throw new Error('Instagram account not connected in Blotato');
      }

      const payload = {
        post: {
          accountId: account.id,
          content: {
            text: post.content,
            mediaUrls: post.mediaUrls || [],
            platform: 'instagram',
          },
          target: {
            targetType: 'instagram',
          },
        },
        ...(post.scheduledTime && { scheduledTime: post.scheduledTime }),
      };

      const response = await axios.post(`${this.baseUrl}/posts`, payload, {
        headers: {
          'blotato-api-key': this.apiKey,
          'Content-Type': 'application/json',
        },
      });

      console.log(`✅ Instagram post created: ${response.data.id}`);
      const postId = this.extractPostSubmissionId(response.data);
      return {
        success: true,
        postId,
      };
    } catch (error: any) {
      console.error('❌ Instagram post failed:', error.message);
      throw error;
    }
  }

  /**
   * Pubblica su tutte le piattaforme
   */
  async publishToAll(
    posts: Array<{ platform: string; content: string; mediaUrls?: string[] }>,
    scheduledTime?: string
  ): Promise<any> {
    const results = [];

    for (const post of posts) {
      try {
        const blotatoPost: BlotatoPost = {
          platform: post.platform as any,
          content: post.content,
          mediaUrls: post.mediaUrls,
          scheduledTime,
        };

        let result;
        switch (post.platform.toLowerCase()) {
          case 'linkedin':
            result = await this.postToLinkedIn(blotatoPost);
            break;
          case 'facebook':
            result = await this.postToFacebook(blotatoPost);
            break;
          case 'instagram':
            result = await this.postToInstagram(blotatoPost);
            break;
          default:
            throw new Error(`Unsupported platform: ${post.platform}`);
        }

        results.push({ platform: post.platform, ...result });
      } catch (error: any) {
        results.push({
          platform: post.platform,
          success: false,
          error: error.message,
        });
      }
    }

    return {
      total: posts.length,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      results,
    };
  }

  async getPostStatus(postSubmissionId: string): Promise<{
    postSubmissionId: string;
    status: string;
    publicUrl?: string;
    scheduledTime?: string | null;
    errorMessage?: string;
  }> {
    const response = await axios.get(`${this.baseUrl}/posts/${postSubmissionId}`, {
      headers: {
        'blotato-api-key': this.apiKey,
        'Content-Type': 'application/json',
      },
    });

    return {
      postSubmissionId: String(response.data.postSubmissionId || postSubmissionId),
      status: String(response.data.status || 'unknown'),
      publicUrl: response.data.publicUrl,
      scheduledTime: response.data.scheduledTime ?? null,
      errorMessage: response.data.errorMessage,
    };
  }

  /**
   * Helper: Fetch prima Facebook page
   */
  private async getFirstFacebookPage(accountId: string): Promise<string> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/users/me/accounts/${accountId}/subaccounts`,
        {
          headers: {
            'blotato-api-key': this.apiKey,
          },
        }
      );

      const pages = response.data.items || response.data.subaccounts || [];
      if (pages.length === 0) {
        throw new Error('No Facebook pages found');
      }

      return pages[0].id;
    } catch (error: any) {
      console.error('❌ Failed to get Facebook pages:', error.message);
      throw error;
    }
  }

  private extractPostSubmissionId(data: any): string {
    const postId =
      data?.postSubmissionId ||
      data?.id ||
      data?.post?.postSubmissionId ||
      data?.post?.id;

    if (!postId) {
      throw new Error('Blotato did not return a postSubmissionId');
    }

    return String(postId);
  }
}
