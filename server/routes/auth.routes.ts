import { Router } from 'express';
import * as authController from '../controllers/auth.controller';
import { requireAdmin } from '../middleware/auth.middleware';
import type { Request, Response, NextFunction } from 'express';
import type { AuthenticatedRequest } from '../middleware/auth.middleware';

const router = Router();

router.post('/login', authController.login);
router.post('/logout', requireAdmin as any, (req: Request, res: Response, next: NextFunction) => {
  authController.logout(req as AuthenticatedRequest, res);
});
router.get('/check', requireAdmin as any, (req: Request, res: Response, next: NextFunction) => {
  authController.checkSession(req as AuthenticatedRequest, res);
});

export default router;
