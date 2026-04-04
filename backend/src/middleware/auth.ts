import { Request, Response, NextFunction } from 'express';
import axios from 'axios';

/**
 * Middleware di autenticazione Clerk per il backend.
 * Verifica il JWT token di Clerk inviato nell'header Authorization.
 *
 * Se CLERK_SECRET_KEY non e' configurato, il middleware viene saltato (dev mode).
 */
export const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
  const clerkSecretKey = process.env.CLERK_SECRET_KEY;

  // Se Clerk non e' configurato, salta l'auth (dev mode)
  if (!clerkSecretKey) {
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

  try {
    // Verifica il token con Clerk Backend API
    const response = await axios.get('https://api.clerk.com/v1/sessions/verify', {
      headers: {
        Authorization: `Bearer ${clerkSecretKey}`,
        'Content-Type': 'application/json',
      },
      params: { token },
    });

    // Aggiungi i dati dell'utente alla request
    (req as any).auth = {
      userId: response.data.user_id,
      sessionId: response.data.id,
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
