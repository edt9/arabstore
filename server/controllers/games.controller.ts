import type { Request, Response, NextFunction } from 'express';
import * as db from '../services/supabase.service';
import { uploadImageToCloudinary, deleteImageFromCloudinary } from '../services/cloudinary.service';
import crypto from 'crypto';

export const getGames = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const games = await db.dbGetGames();
    res.json(games);
  } catch (err) {
    next(err);
  }
};

export const getGameById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const game = await db.dbGetGameById(req.params.id);
    if (!game) {
      res.status(404).json({ error: 'Game not found' });
      return;
    }
    res.json(game);
  } catch (err) {
    next(err);
  }
};

export const addGame = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const gameData = req.body;
    let imageUrl = gameData.image_url;

    // Handle file upload
    if (req.file) {
      imageUrl = await uploadImageToCloudinary(req.file.buffer);
    }

    if (!imageUrl) {
      res.status(400).json({ error: 'Image is required (either file or URL)' });
      return;
    }

    const newGame = {
      ...gameData,
      id: crypto.randomBytes(8).toString('hex'),
      image_url: imageUrl,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      rating: 0,
      downloads_count: 0
    };

    const savedGame = await db.dbAddGame(newGame);
    res.status(201).json(savedGame);
  } catch (err) {
    next(err);
  }
};

export const updateGame = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const gameId = req.params.id;
    const updateData = req.body;
    
    // Check if game exists
    const existingGame = await db.dbGetGameById(gameId);
    if (!existingGame) {
      res.status(404).json({ error: 'Game not found' });
      return;
    }

    let imageUrl = updateData.image_url || existingGame.image_url;

    // Handle new file upload
    if (req.file) {
      imageUrl = await uploadImageToCloudinary(req.file.buffer);
      // Delete old image if it's on Cloudinary
      if (existingGame.image_url && existingGame.image_url.includes('res.cloudinary.com')) {
        await deleteImageFromCloudinary(existingGame.image_url);
      }
    }

    const updated = await db.dbUpdateGame(gameId, {
      ...updateData,
      image_url: imageUrl,
      updated_at: new Date().toISOString()
    });

    res.json(updated);
  } catch (err) {
    next(err);
  }
};

export const deleteGame = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const gameId = req.params.id;
    
    const existingGame = await db.dbGetGameById(gameId);
    if (!existingGame) {
      res.status(404).json({ error: 'Game not found' });
      return;
    }

    // Try to delete image from Cloudinary
    if (existingGame.image_url && existingGame.image_url.includes('res.cloudinary.com')) {
      await deleteImageFromCloudinary(existingGame.image_url);
    }

    const success = await db.dbDeleteGame(gameId);
    if (success) {
      res.json({ success: true, message: 'Game deleted successfully' });
    } else {
      res.status(500).json({ error: 'Failed to delete game' });
    }
  } catch (err) {
    next(err);
  }
};

export const reorderGames = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { games } = req.body;
    if (!Array.isArray(games)) {
      res.status(400).json({ error: 'Expected an array of games' });
      return;
    }
    await db.dbReorderGames(games);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
};
