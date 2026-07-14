import { Router } from 'express';
import { requireAdmin } from '../middleware/auth.middleware';
import { upload } from '../middleware/upload.middleware';
import { uploadImageToCloudinary, isCloudinaryConfigured } from '../services/cloudinary.service';
import type { Request, Response, NextFunction } from 'express';

const router = Router();

router.post(
  '/',
  requireAdmin as any,
  upload.single('image_file'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.file) {
        res.status(400).json({ error: 'No image file provided' });
        return;
      }
      if (!isCloudinaryConfigured) {
        res.status(503).json({ error: 'Cloudinary is not configured' });
        return;
      }
      const url = await uploadImageToCloudinary(req.file.buffer);
      res.json({ url });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
