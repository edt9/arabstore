import { Router } from 'express';
import * as gamesController from '../controllers/games.controller';
import { requireAdmin } from '../middleware/auth.middleware';
import { upload } from '../middleware/upload.middleware';

const router = Router();

// Public routes
router.get('/', gamesController.getGames);
router.get('/:id', gamesController.getGameById);

// Protected routes (Admin only)
router.post('/', requireAdmin, upload.single('image_file'), gamesController.addGame);
router.put('/reorder', requireAdmin, gamesController.reorderGames);
router.put('/:id', requireAdmin, upload.single('image_file'), gamesController.updateGame);
router.delete('/:id', requireAdmin, gamesController.deleteGame);

export default router;
