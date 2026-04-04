import compression from 'compression';
import helmet from 'helmet';

export const setupPerformance = (app) => {
  // Compression
  app.use(compression());

  // Caching
  app.use((req, res, next) => {
    if (req.method === 'GET') {
      res.set('Cache-Control', 'public, max-age=300');
    } else {
      res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    }
    next();
  });

  // Database query optimization
  // Use indexes on frequently queried columns
  // Implement pagination for large queries
};