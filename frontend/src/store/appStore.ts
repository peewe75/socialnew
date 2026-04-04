import { create } from 'zustand';

export interface News {
  id: string;
  title: string;
  summary: string;
  source: string;
  link: string;
  date: string;
}

export interface Post {
  id: string;
  platform: string;
  content: string;
  hashtags: string[];
  mediaUrls?: string[];
}

export interface AppState {
  // News
  news: News[];
  setNews: (news: News[]) => void;
  addNews: (news: News) => void;

  // Posts
  posts: Post[];
  setPosts: (posts: Post[]) => void;
  addPost: (post: Post) => void;
  updatePost: (id: string, post: Partial<Post>) => void;

  // Loading
  loading: boolean;
  setLoading: (loading: boolean) => void;

  // Error
  error: string | null;
  setError: (error: string | null) => void;

  // Current selection
  currentNewsId: string | null;
  setCurrentNewsId: (id: string | null) => void;

  currentPlatform: string;
  setCurrentPlatform: (platform: string) => void;

  // Filters
  filterStatus: 'all' | 'approved' | 'rejected' | 'pending';
  setFilterStatus: (status: 'all' | 'approved' | 'rejected' | 'pending') => void;
}

export const useAppStore = create<AppState>((set) => ({
  // News
  news: [],
  setNews: (news) => set({ news }),
  addNews: (news) => set((state) => ({ news: [...state.news, news] })),

  // Posts
  posts: [],
  setPosts: (posts) => set({ posts }),
  addPost: (post) => set((state) => ({ posts: [...state.posts, post] })),
  updatePost: (id, post) =>
    set((state) => ({
      posts: state.posts.map((p) => (p.id === id ? { ...p, ...post } : p)),
    })),

  // Loading
  loading: false,
  setLoading: (loading) => set({ loading }),

  // Error
  error: null,
  setError: (error) => set({ error }),

  // Current selection
  currentNewsId: null,
  setCurrentNewsId: (id) => set({ currentNewsId: id }),

  currentPlatform: 'linkedin',
  setCurrentPlatform: (platform) => set({ currentPlatform: platform }),

  // Filters
  filterStatus: 'all',
  setFilterStatus: (status) => set({ filterStatus: status }),
}));