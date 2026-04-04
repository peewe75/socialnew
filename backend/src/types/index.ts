export interface NewsItem {
  id?: string;
  title: string;
  summary: string;
  source: string;
  link: string;
  date: string;
}

export interface GeneratedPost {
  platform: 'linkedin' | 'facebook' | 'instagram' | 'tiktok' | 'blog';
  content: string;
  hashtags: string[];
  mediaPrompt?: string;
}

export interface WebhookPayload {
  newsId: string;
  title: string;
  summary: string;
  source: string;
  link: string;
  generatedPosts: GeneratedPost[];
  blogPostMarkdown: string;
  timestamp: string;
  approvalUrl: string;
}

export interface ApprovalRequest {
  newsId: string;
  approved: boolean;
  edits?: Array<{
    platform: string;
    newContent: string;
  }>;
  scheduleTime?: string;
  platforms?: string[];
}

export interface BlotatoAccount {
  id: string;
  type: string;
  pageId?: string;
}

export interface BlotatoPost {
  platform: 'twitter' | 'facebook' | 'instagram' | 'linkedin' | 'tiktok';
  content: string;
  mediaUrls?: string[];
  scheduledTime?: string;
}