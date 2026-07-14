import 'dotenv/config';
import crypto from 'crypto';
import type { AdminSession } from '../../src/types';

// ─── In-memory session store ──────────────────────────────────────────────────
// NOTE: In Vercel Serverless each invocation may be a fresh instance.
// For production-grade persistence, store sessions in Supabase or Redis.
const sessions = new Map<string, AdminSession>();

const SESSION_TTL_MS = 4 * 60 * 60 * 1000; // 4 hours

// ─── Lazy env readers (ensures dotenv has loaded) ─────────────────────────────
const getAdminEmail    = () => (process.env.ADMIN_EMAIL    ?? 'admin@arabstore.com').trim().toLowerCase();
const getAdminPassword = () => (process.env.ADMIN_PASSWORD ?? 'change_me_in_env').trim();

/** Returns the configured admin email (for display in config status) */
export const ADMIN_EMAIL = () => getAdminEmail();

// ─── Create session ───────────────────────────────────────────────────────────
export function createSession(email: string): string {
  const token = crypto.randomBytes(32).toString('hex');
  sessions.set(token, { token, email, expiresAt: Date.now() + SESSION_TTL_MS });
  return token;
}

// ─── Verify session ───────────────────────────────────────────────────────────
export function verifySession(token: string): AdminSession | null {
  const session = sessions.get(token);
  if (!session) return null;
  if (session.expiresAt < Date.now()) {
    sessions.delete(token);
    return null;
  }
  return session;
}

// ─── Destroy session ──────────────────────────────────────────────────────────
export function destroySession(token: string): void {
  sessions.delete(token);
}

// ─── Validate credentials ─────────────────────────────────────────────────────
export function validateCredentials(email: string, password: string): boolean {
  return (
    email.trim().toLowerCase() === getAdminEmail() &&
    password.trim()            === getAdminPassword()
  );
}
