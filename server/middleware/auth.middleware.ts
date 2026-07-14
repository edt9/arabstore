import type { Request, Response, NextFunction } from 'express';
import { verifySession } from '../services/auth.service';

export interface AuthenticatedRequest extends Request {
  user?: { email: string; token: string };
}

export function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized: Missing or invalid token' });
    return;
  }

  const token = authHeader.split(' ')[1];
  const session = verifySession(token);

  if (!session) {
    res.status(401).json({ error: 'Unauthorized: Invalid or expired session' });
    return;
  }

  req.user = { email: session.email, token: session.token };
  next();
}
