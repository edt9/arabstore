/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Game {
  id: string;
  name: string;
  image_url: string;
  version: string;
  description: string;
  size: string;
  category: 'games' | 'apps';
  sub_category?: string; // e.g. "أكشن", "استراتيجية", "أدوات", "إنتاجية"
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
