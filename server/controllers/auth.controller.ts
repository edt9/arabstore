import type { Request, Response } from 'express';
import { createSession, validateCredentials, destroySession } from '../services/auth.service';
import type { AuthenticatedRequest } from '../middleware/auth.middleware';

export const login = (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ error: 'Email and password are required' });
    return;
  }

  if (validateCredentials(email, password)) {
    const token = createSession(email);
    res.json({ token, email });
  } else {
    res.status(401).json({ error: 'Invalid credentials' });
  }
};

export const logout = (req: AuthenticatedRequest, res: Response) => {
  if (req.user?.token) {
    destroySession(req.user.token);
  }
  res.json({ success: true });
};

export const checkSession = (req: AuthenticatedRequest, res: Response) => {
  // If this route is reached, the auth middleware already validated the session
  res.json({ valid: true, user: req.user });
};
