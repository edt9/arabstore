import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Game } from '../../src/types';

// ─── Seed Data (Arabic) ──────────────────────────────────────────────────────
export const seedGames: Game[] = [
  {
    id: 'g1', name: 'كلاش أوف كلانس (Clash of Clans)',
    image_url: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=300&q=80',
    version: '16.100.12',
    description: 'انضم إلى ملايين اللاعبين حول العالم! ابنِ قريتك، وأنشئ قبيلة، وشارك في حروب قبائل ملحمية.',
    size: '342 MB', category: 'games', sub_category: 'استراتيجية',
    download_url: 'https://play.google.com/store/apps/details?id=com.supercell.clashofclans',
    rating: 4.5, downloads_count: 500000000,
    created_at: new Date(Date.now() - 15 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 15 * 86400000).toISOString(),
  },
  {
    id: 'g2', name: 'ببجي موبايل (PUBG Mobile)',
    image_url: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=300&q=80',
    version: '3.1.0',
    description: 'لعبة البقاء والأكشن الأكثر شعبية على الهواتف الذكية. اهبط في جزر واسعة وابحث عن الأسلحة.',
    size: '1.2 GB', category: 'games', sub_category: 'أكشن',
    download_url: 'https://play.google.com/store/apps/details?id=com.tencent.ig',
    rating: 4.6, downloads_count: 1000000000,
    created_at: new Date(Date.now() - 8 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 8 * 86400000).toISOString(),
  },
  {
    id: 'g3', name: 'سبواي سورفرز (Subway Surfers)',
    image_url: 'https://images.unsplash.com/photo-1551103782-8ab07afd45c1?auto=format&fit=crop&w=300&q=80',
    version: '3.26.1',
    description: 'اركض بأقصى سرعتك وتفادى القطارات القادمة! اجمع العملات الذهبية وسجل أعلى النقاط.',
    size: '156 MB', category: 'games', sub_category: 'مغامرة',
    download_url: 'https://play.google.com/store/apps/details?id=com.kiloo.subwaysurf',
    rating: 4.4, downloads_count: 1000000000,
    created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 30 * 86400000).toISOString(),
  },
  {
    id: 'g4', name: 'واتساب ماسنجر (WhatsApp)',
    image_url: 'https://images.unsplash.com/photo-1614741118887-7a4ee193a5fa?auto=format&fit=crop&w=300&q=80',
    version: '2.24.8',
    description: 'برنامج المحادثة الفورية والاتصال الصوتي والمرئي المجاني. تواصل مع عائلتك وأصدقائك.',
    size: '48 MB', category: 'apps', sub_category: 'تواصل اجتماعي',
    download_url: 'https://play.google.com/store/apps/details?id=com.whatsapp',
    rating: 4.3, downloads_count: 5000000000,
    created_at: new Date(Date.now() - 40 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 40 * 86400000).toISOString(),
  },
  {
    id: 'g5', name: 'تطبيق التصميم كانفا (Canva)',
    image_url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=300&q=80',
    version: '2.258.0',
    description: 'أداة التصميم الجرافيكي الشاملة. صمم بوستات سوشيال ميديا وعروض تقديمية احترافية.',
    size: '35 MB', category: 'apps', sub_category: 'أدوات',
    download_url: 'https://play.google.com/store/apps/details?id=com.canva.editor',
    rating: 4.7, downloads_count: 100000000,
    created_at: new Date(Date.now() - 5 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 5 * 86400000).toISOString(),
  },
  {
    id: 'g6', name: 'ماين كرافت (Minecraft)',
    image_url: 'https://images.unsplash.com/photo-1605899435973-ca2d1a8861cf?auto=format&fit=crop&w=300&q=80',
    version: '1.20.80',
    description: 'استكشف عوالم لا نهائية وابنِ كل شيء. العب في وضع الإبداع أو احفر في وضع البقاء.',
    size: '650 MB', category: 'games', sub_category: 'محاكاة',
    download_url: 'https://play.google.com/store/apps/details?id=com.mojang.minecraftpe',
    rating: 4.7, downloads_count: 50000000,
    created_at: new Date(Date.now() - 12 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 12 * 86400000).toISOString(),
  },
  {
    id: 'g7', name: 'نوشن (Notion)',
    image_url: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=300&q=80',
    version: '0.22.4',
    description: 'مساحة العمل المتكاملة لكتابة الملاحظات وتنظيم المهام وبناء قواعد البيانات.',
    size: '24 MB', category: 'apps', sub_category: 'إنتاجية',
    download_url: 'https://play.google.com/store/apps/details?id=notion.id',
    rating: 4.6, downloads_count: 10000000,
    created_at: new Date(Date.now() - 22 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 22 * 86400000).toISOString(),
  },
  {
    id: 'g8', name: 'تطبيق التركيز (Focus Plan)',
    image_url: 'https://images.unsplash.com/photo-1508962914676-134849a727f0?auto=format&fit=crop&w=300&q=80',
    version: '1.4.2',
    description: 'ضاعف إنتاجيتك بفضل تقنية الطماطم (Pomodoro). ساعة تركيز مدمجة وأصوات طبيعية مهدئة.',
    size: '18 MB', category: 'apps', sub_category: 'أدوات',
    download_url: 'https://play.google.com/store/apps/details?id=com.focusplan.pomodoro',
    rating: 4.8, downloads_count: 5000000,
    created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
];

// ─── Supabase Client ──────────────────────────────────────────────────────────
function buildSupabaseClient(): SupabaseClient | null {
  const rawUrl = process.env.SUPABASE_URL?.trim() ?? '';
  const rawKey = process.env.SUPABASE_ANON_KEY?.trim() ?? '';

  const clean = (v: string) => v.replace(/^["']|["']$/g, '').trim();
  const url = clean(rawUrl);
  const key = clean(rawKey);

  if (!url || !key) return null;

  const PLACEHOLDERS = ['your-project', 'your-supabase', 'YOUR_SUPABASE', '<your-', '[your-'];
  if (PLACEHOLDERS.some(p => url.includes(p) || key.includes(p))) return null;

  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'https:') return null;
    if (!parsed.hostname.endsWith('.supabase.co') && !parsed.hostname.endsWith('.supabase.in')) return null;

    const normalized = `${parsed.protocol}//${parsed.host}`;
    return createClient(normalized, key);
  } catch {
    return null;
  }
}

export const supabase = buildSupabaseClient();
export const isSupabaseConfigured = supabase !== null;

// ─── Error classifier ─────────────────────────────────────────────────────────
export function isTableMissingError(err: unknown): boolean {
  if (!err) return false;
  const e = err as Record<string, unknown>;
  const code = String(e?.code ?? '');
  const msg  = String(e?.message ?? err);
  return (
    ['42P01', 'PGRST204', 'PGRST301'].includes(code) ||
    msg.includes('does not exist') ||
    msg.includes('Could not find the table') ||
    msg.includes('schema cache')
  );
}

// ─── DB Operations ───────────────────────────────────────────────────────────
let tablesMissing = false;

export async function dbGetGames(): Promise<Game[]> {
  if (supabase && !tablesMissing) {
    try {
      const { data, error } = await supabase
        .from('games')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data && data.length > 0) return data as Game[];

      // Seed if empty
      if (data && data.length === 0) {
        await supabase.from('games').insert(seedGames);
        return seedGames;
      }
    } catch (err) {
      if (isTableMissingError(err)) tablesMissing = true;
      console.warn('[Supabase] dbGetGames fallback:', (err as Error).message?.slice(0, 80));
    }
  }
  return seedGames;
}

export async function dbGetGameById(id: string): Promise<Game | null> {
  if (supabase && !tablesMissing) {
    try {
      const { data, error } = await supabase
        .from('games').select('*').eq('id', id).maybeSingle();
      if (error) throw error;
      if (data) return data as Game;
    } catch (err) {
      if (isTableMissingError(err)) tablesMissing = true;
    }
  }
  return seedGames.find(g => g.id === id) ?? null;
}

export async function dbAddGame(game: Game): Promise<Game> {
  if (supabase && !tablesMissing) {
    try {
      const { data, error } = await supabase
        .from('games').insert([game]).select().single();
      if (error) throw error;
      if (data) return data as Game;
    } catch (err) {
      if (isTableMissingError(err)) tablesMissing = true;
      console.warn('[Supabase] dbAddGame fallback:', (err as Error).message?.slice(0, 80));
    }
  }
  return game;
}

export async function dbUpdateGame(id: string, fields: Partial<Game>): Promise<Game | null> {
  if (supabase && !tablesMissing) {
    try {
      const { data, error } = await supabase
        .from('games').update(fields).eq('id', id).select().single();
      if (error) throw error;
      if (data) return data as Game;
    } catch (err) {
      if (isTableMissingError(err)) tablesMissing = true;
    }
  }
  return null;
}

export async function dbDeleteGame(id: string): Promise<boolean> {
  if (supabase && !tablesMissing) {
    try {
      const { error } = await supabase.from('games').delete().eq('id', id);
      if (error) throw error;
      return true;
    } catch (err) {
      if (isTableMissingError(err)) tablesMissing = true;
    }
  }
  return false;
}

export async function dbReorderGames(games: Game[]): Promise<void> {
  if (!supabase || tablesMissing) return;
  try {
    for (let i = 0; i < games.length; i++) {
      await supabase
        .from('games')
        .update({ created_at: new Date(Date.now() - i * 1000).toISOString() })
        .eq('id', games[i].id);
    }
  } catch (err) {
    if (isTableMissingError(err)) tablesMissing = true;
  }
}

export function getTablesMissingState() { return tablesMissing; }
export function resetTablesMissingState() { tablesMissing = false; }
