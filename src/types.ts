// Shared types used across frontend and backend

export interface Game {
  id: string;
  name: string;
  image_url: string;
  version: string;
  description: string;
  size: string;
  category: 'games' | 'apps';
  sub_category?: string;
  download_url: string;
  rating?: number;
  downloads_count?: number;
  created_at: string;
  updated_at: string;
}

export interface AdminSession {
  token: string;
  email: string;
  expiresAt: number;
}

export interface ConfigStatus {
  isSupabaseConnected: boolean;
  isCloudinaryConnected: boolean;
  localModeActive: boolean;
  adminEmail: string;
  isTableMissing?: boolean;
  connectionError?: string | null;
}

export interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
  message?: string;
}

export type GameCategory = 'games' | 'apps';
export type CreateGameInput = Omit<Game, 'id' | 'created_at' | 'updated_at' | 'rating' | 'downloads_count'>;
export type UpdateGameInput = Partial<CreateGameInput>;
