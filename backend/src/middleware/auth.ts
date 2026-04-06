import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '@clerk/backend';

/**
 * Middleware di autenticazione Clerk per il backend.
 * Verifica il JWT token di Clerk inviato nell'header Authorization.
 *
 * Se CLERK_SECRET_KEY non e' configurato, il middleware viene saltato (dev mode).
 */
export const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
  const clerkSecretKey = process.env.CLERK_SECRET_KEY;
  const webhookSecret = process.env.WEBHOOK_SECRET;

  // Approval resume links are intentionally handled server-side to avoid
  // Slack/Gmail link scanners consuming n8n's one-time resume URL.
  if (req.path === '/approval/resume' && req.method === 'POST') {
    return next();
  }

  // n8n callback routes don't carry Clerk tokens — they use webhook secret or are public.
  if (req.path.startsWith('/n8n/callback/') && req.method === 'POST') {
    return next();
  }

  // n8n health/config are read-only informational endpoints.
  if (req.path === '/n8n/health' || req.path === '/n8n/config') {
    return next();
  }

  // Se Clerk non e' configurato, salta l'auth (dev mode)
  if (!clerkSecretKey) {
    return next();
  }

  const inboundWebhookSecret = req.headers['x-webhook-secret'];
  if (
    webhookSecret &&
    typeof inboundWebhookSecret === 'string' &&
    inboundWebhookSecret === webhookSecret
  ) {
    (req as any).auth = {
      userId: 'system:n8n',
      sessionId: 'webhook-secret',
    };

    return next();
  }

  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Missing or invalid Authorization header',
    });
  }

  const token = authHeader.split(' ')[1];
  const requestOrigin =
    typeof req.headers.origin === 'string' ? req.headers.origin : undefined;
  const requestHost =
    typeof req.headers.host === 'string' ? `https://${req.headers.host}` : undefined;
  const vercelUrl = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : undefined;

  const authorizedParties = [
    process.env.FRONTEND_URL,
    vercelUrl,
    requestOrigin,
    requestHost,
    'http://localhost:3000',
    'http://localhost:5173',
  ].filter((value, index, all): value is string => Boolean(value) && all.indexOf(value) === index);

  try {
    const payload = await verifyToken(token, {
      secretKey: clerkSecretKey,
      authorizedParties,
    });

    // Aggiungi i dati dell'utente alla request
    (req as any).auth = {
      userId: payload.sub,
      sessionId: payload.sid,
    };

    next();
  } catch (error: any) {
    console.error('Auth verification failed:', error.message);
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid or expired token',
    });
  }
};
