import { render, screen, waitFor } from '@testing-library/react';
import Dashboard from '../Dashboard';
import { analyticsAPI } from '../../utils/api';

jest.mock('../../utils/api', () => ({
  analyticsAPI: {
    getDashboard: jest.fn(),
  },
}));

describe('Dashboard Page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render dashboard title', () => {
    (analyticsAPI.getDashboard as jest.Mock).mockResolvedValueOnce({
      data: { success: true, dashboard: { summary: { totalPosts: 0, totalViews: 0, totalEngagement: 0, averageEngagement: 0, topPlatform: { name: 'N/A', views: 0 }, platformBreakdown: {}, trends: { bestTime: 'N/A', bestContent: 'N/A', improvementAreas: [] } }, optimizations: { bestTime: '14:00', recommendations: [] }, recentPosts: [] } },
    });
    render(<Dashboard />);
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
  });

  it('should load metrics on mount', async () => {
    const mockData = {
      data: {
        success: true,
        dashboard: {
          summary: {
            totalPosts: 24,
            totalViews: 15200,
            totalEngagement: 1289,
            averageEngagement: 7.3,
            topPlatform: { name: 'instagram', views: 3200 },
            platformBreakdown: {},
            trends: { bestTime: '14:00', bestContent: 'mixed', improvementAreas: [] },
          },
          optimizations: { bestTime: '14:00', recommendations: [] },
          recentPosts: [],
        },
      },
    };

    (analyticsAPI.getDashboard as jest.Mock).mockResolvedValueOnce(mockData);

    render(<Dashboard />);

    await waitFor(() => {
      expect(analyticsAPI.getDashboard).toHaveBeenCalled();
    });
  });

  it('should handle API errors gracefully', async () => {
    (analyticsAPI.getDashboard as jest.Mock).mockRejectedValueOnce(
      new Error('API Error')
    );

    render(<Dashboard />);

    await waitFor(() => {
      expect(analyticsAPI.getDashboard).toHaveBeenCalled();
    });
  });
});
