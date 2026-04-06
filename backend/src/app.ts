import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { getPrismaClient, disconnectPrisma } from './services/prisma.service';

// Routes
import newsRoutes from './routes/newsRoutes';
import publishRoutes from './routes/publishRoutes';
import approvalRoutes from './routes/approvalRoutes';
import mediaRoutes from './routes/mediaRoutes';
import avatarRoutes from './routes/avatarRoutes';
import analyticsRoutes from './routes/analyticsRoutes';
import n8nRoutes from './routes/n8nRoutes';

dotenv.config();

const app: Express = express();
const PORT = process.env.PORT || 3001;

// Prisma Client
const prisma = getPrismaClient();

// Middleware
const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:5173',
].filter(Boolean);

const isAllowedVercelPreviewOrigin = (origin?: string) => {
  if (!origin) return false;

  try {
    const hostname = new URL(origin).hostname;
    return hostname.endsWith('.vercel.app') && hostname.includes('news-to-social');
  } catch {
    return false;
  }
};

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin) || isAllowedVercelPreviewOrigin(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Health check
app.get('/health', async (req: Request, res: Response) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      database: 'connected',
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      database: 'disconnected',
    });
  }
});

// Public frontend config used at runtime by the Vite app.
app.get('/api/public-config', (_req: Request, res: Response) => {
  res.json({
    clerkPublishableKey: process.env.VITE_CLERK_PUBLISHABLE_KEY || null,
  });
});

// Auth middleware (skip if CLERK_SECRET_KEY not set)
import { requireAuth } from './middleware/auth';
if (process.env.CLERK_SECRET_KEY) {
  app.use('/api', requireAuth);
}

// Routes
app.use('/api/news', newsRoutes);
app.use('/api/publish', publishRoutes);
app.use('/api/approval', approvalRoutes);
app.use('/api/media', mediaRoutes);
app.use('/api/avatar', avatarRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/n8n', n8nRoutes);

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: 'Not Found',
    path: req.path,
  });
});

// Error handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('❌ Error:', err);
  res.status(500).json({
    error: err.message || 'Internal Server Error',
  });
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n Shutting down gracefully...');
  await disconnectPrisma();
  process.exit(0);
});

// Start server only in non-serverless environments (local dev)
if (process.env.VERCEL !== '1') {
  app.listen(PORT, () => {
    console.log(`
  NEWS TO SOCIAL AUTOMATION BACKEND
  Server running on: http://localhost:${PORT}
  Environment: ${process.env.NODE_ENV || 'development'}
  Database: ${process.env.DATABASE_URL ? 'Connected' : 'Not configured'}
  API Base: http://localhost:${PORT}/api
    `);
  });
}

export default app;
