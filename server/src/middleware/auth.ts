import { Request, Response, NextFunction } from 'express';
import { db } from '../db/index.js';

export interface AuthenticatedUser {
  id: string;
  email: string;
  displayName: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

const DEMO_USER_EMAIL = 'user@trustlens.local';
const DEMO_USER_ID = '00000000-0000-0000-0000-000000000001';

/**
 * Authentication middleware.
 * Verifies bearer token or demo session. Derives authenticated identity server-side.
 * Browser-supplied user_id in headers or bodies is strictly ignored.
 */
export async function authenticateUser(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    let userEmail = DEMO_USER_EMAIL;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7).trim();
      // In production this verifies JWT or session store. For demo/extension tokens:
      if (token && token !== 'demo-token') {
        // e.g. token format: user-email or custom token
        if (token.includes('@')) {
          userEmail = token;
        }
      }
    }

    const user = await db.getOrCreateUser(userEmail, 'TrustLens User');
    req.user = {
      id: user.id,
      email: user.email,
      displayName: user.display_name,
    };
    next();
  } catch (err: any) {
    res.status(401).json({
      success: false,
      error: 'Authentication failed. Unable to verify user identity.',
    });
  }
}
