import type { Request, Response } from 'express';
import { isSupabaseConfigured, getTablesMissingState } from '../services/supabase.service';
import { isCloudinaryConfigured } from '../services/cloudinary.service';
import { ADMIN_EMAIL } from '../services/auth.service';
import type { ConfigStatus } from '../../src/types';

export const getConfigStatus = (req: Request, res: Response) => {
  const isTableMissing = getTablesMissingState();
  const status: ConfigStatus = {
    isSupabaseConnected: isSupabaseConfigured,
    isCloudinaryConnected: isCloudinaryConfigured,
    localModeActive: !isSupabaseConfigured || !isCloudinaryConfigured || isTableMissing,
    adminEmail: ADMIN_EMAIL(),
    isTableMissing: isTableMissing,
  };
  res.json(status);
};
