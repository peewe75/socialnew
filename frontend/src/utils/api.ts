import axios from 'axios';
import { getPreferredAppOrigin } from '../config/runtime';

// In produzione usa l'alias stabile. I preview Vercel possono essere protetti e bloccare le chiamate API.
const API_BASE_URL =
  (import.meta.env.VITE_API_URL as string) ||
  (import.meta.env.PROD ? `${getPreferredAppOrigin()}/api` : 'http://localhost:3001/api');

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor per aggiungere il token Clerk alle richieste
api.interceptors.request.use(async (config) => {
  if (typeof window !== 'undefined') {
    try {
      const clerkSession =
        (window as any).Clerk?.session ||
        (window as any).__clerk_session;
      const token = await clerkSession?.getToken?.();

      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch {
      // Clerk non configurato, continua senza auth
    }
  }
  return config;
});

// News API
export const newsAPI = {
  collect: (topics: string, limit: number = 3) =>
    api.post('/news/collect', { topics, limit }),

  list: () =>
    api.get('/news/list'),

  generate: (newsItems: any[]) =>
    api.post('/news/generate', { newsItems }),
};

// n8n Pipeline API
export const n8nAPI = {
  trigger: (topics: string, limit: number = 3) =>
    api.post('/n8n/trigger', { topics, limit }),

  send: (newsItems: any[]) =>
    api.post('/n8n/send', { newsItems }),

  health: () =>
    api.get('/n8n/health'),

  config: () =>
    api.get('/n8n/config'),
};

// Publishing API
export const publishAPI = {
  getAccounts: () =>
    api.get('/publish/accounts'),

  approve: (data: any) =>
    api.post('/publish/approve', data),

  getStatus: (postId: string) =>
    api.get(`/publish/status/${postId}`),
};

// Approval API
export const approvalAPI = {
  submit: (data: any) =>
    api.post('/approval/submit', data),

  resume: (data: { resumeUrl: string; approved: boolean; reason?: string }) =>
    api.post('/approval/resume', data),

  getStatus: (newsId: string) =>
    api.get(`/approval/status/${newsId}`),
};

// Media API
export const mediaAPI = {
  generateImage: (newsTitle: string, newsContent: string, style: string, platform: string) =>
    api.post('/media/generate-image', { newsTitle, newsContent, style, platform }),

  generateVideoScript: (newsTitle: string, newsContent: string, style: string) =>
    api.post('/media/generate-video-script', { newsTitle, newsContent, style }),

  test: () =>
    api.get('/media/test'),
};

// Avatar API
export const avatarAPI = {
  listAvatars: () =>
    api.get('/avatar/avatars'),

  listVoices: () =>
    api.get('/avatar/voices'),

  generateVideo: (data: any) =>
    api.post('/avatar/generate', data),

  generateFromNews: (newsTitle: string, newsContent: string, avatarId: string, voiceId: string) =>
    api.post('/avatar/generate-from-news', { newsTitle, newsContent, avatarId, voiceId }),

  getStatus: (videoId: string) =>
    api.get(`/avatar/status/${videoId}`),

  test: () =>
    api.get('/avatar/test'),
};

// Analytics API
export const analyticsAPI = {
  getPostMetrics: (blotatoPostId: string, platform: string) =>
    api.get(`/analytics/post/${blotatoPostId}?platform=${platform}`),

  getMultiple: (posts: any[]) =>
    api.post('/analytics/multiple', { posts }),

  getSummary: (posts: any[], period: string = 'week') =>
    api.post('/analytics/summary', { posts, period }),

  compare: (currentPeriod: any[], previousPeriod: any[]) =>
    api.post('/analytics/compare', { currentPeriod, previousPeriod }),

  getOptimizations: (posts: any[]) =>
    api.post('/analytics/optimizations', { posts }),

  getDashboard: () =>
    api.get('/analytics/dashboard'),

  sync: () =>
    api.post('/analytics/sync'),

  test: () =>
    api.get('/analytics/test'),
};

export default api;
