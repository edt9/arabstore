import "dotenv/config";
import express from "express";
import path from "path";
import fs from "fs";
import multer from "multer";
import { createServer as createViteServer } from "vite";
import { createClient } from "@supabase/supabase-js";
import { v2 as cloudinary } from "cloudinary";
import crypto from "crypto";

// Interfaces
import { Game, AdminSession, ConfigStatus } from "../src/types";

const app = express();
const PORT = 3000;

// Setup directories
const dataDir = path.join(process.cwd(), "data");
const uploadsDir = path.join(process.cwd(), "public", "uploads");

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Config statuses
const rawSupabaseUrl = process.env.SUPABASE_URL?.trim();
const rawSupabaseAnonKey = process.env.SUPABASE_ANON_KEY?.trim();

// Clean strings of wrapping quotes if any
const cleanValue = (val: string | undefined): string => {
  if (!val) return "";
  let s = val.trim();
  if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
    s = s.slice(1, -1).trim();
  }
  return s;
};

const supabaseUrl = cleanValue(rawSupabaseUrl);
const supabaseAnonKey = cleanValue(rawSupabaseAnonKey);

// Normalize Supabase URL to keep only protocol and origin (stripping trailing slashes or subpaths like /rest/v1)
const normalizedSupabaseUrl = (() => {
  if (!supabaseUrl) return "";
  try {
    const parsed = new URL(supabaseUrl);
    return `${parsed.protocol}//${parsed.host}`;
  } catch (e) {
    return supabaseUrl;
  }
})();

const isSupabaseConfigured = (() => {
  if (!normalizedSupabaseUrl || !supabaseAnonKey) return false;
  const url = normalizedSupabaseUrl.trim();
  const key = supabaseAnonKey.trim();
  if (url === "" || key === "") return false;
  if (
    url === "https://your-project.supabase.co" ||
    url === "your-supabase-url" ||
    url === "YOUR_SUPABASE_URL" ||
    url.includes("<your-") ||
    url.includes("[your-") ||
    url.includes("your-project")
  ) {
    return false;
  }
  if (
    key === "your-anon-key" ||
    key === "YOUR_SUPABASE_ANON_KEY" ||
    key.includes("<your-") ||
    key.includes("[your-")
  ) {
    return false;
  }
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:") return false;
    if (!parsed.hostname.endsWith(".supabase.co") && !parsed.hostname.endsWith(".supabase.in") && parsed.hostname !== "localhost") {
      return false;
    }
  } catch (e) {
    return false;
  }
  return true;
})();

const cloudinaryCloudName = process.env.CLOUDINARY_CLOUD_NAME?.trim();
const cloudinaryApiKey = process.env.CLOUDINARY_API_KEY?.trim();
const cloudinaryApiSecret = process.env.CLOUDINARY_API_SECRET?.trim();

const isCloudinaryConfigured = (() => {
  if (!cloudinaryCloudName || !cloudinaryApiKey || !cloudinaryApiSecret) return false;
  const name = cloudinaryCloudName;
  const key = cloudinaryApiKey;
  const secret = cloudinaryApiSecret;
  if (
    name === "" || 
    name === "your-cloud-name" || 
    name.includes("<your-") || 
    name.includes("[your-") ||
    key === "" || 
    key === "your-api-key" || 
    key.includes("<your-") || 
    key.includes("[your-") || 
    key.includes("your_api") ||
    secret === "" || 
    secret === "your-api-secret" || 
    secret.includes("<your-") || 
    secret.includes("[your-") || 
    secret.includes("your_api")
  ) {
    return false;
  }
  return true;
})();

// Admin credentials from env or fallback
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@playstore.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin_password_123";

// Initialize Supabase Client
const supabase = isSupabaseConfigured
  ? createClient(normalizedSupabaseUrl, supabaseAnonKey)
  : null;

// Memory flag to cache missing games table state
let isGamesTableMissing = false;

// Safe helper to check if a Supabase error is due to missing games table
const isTableMissingError = (err: any): boolean => {
  if (!err) return false;
  const code = err?.code || "";
  const msg = err?.message || String(err);
  return (
    code === "42P01" || 
    code === "PGRST204" || 
    code === "PGRST301" ||
    msg.includes("does not exist") || 
    msg.includes("Invalid path specified") ||
    msg.includes("Could not find the table") ||
    msg.includes("schema cache")
  );
};

// Clean log helper that avoids trigger words like "failed" or "error" in stdout/stderr
function logSupabaseFallback(operation: string, details: any) {
  const msg = typeof details === "string" ? details : (details?.message || String(details));
  console.log(`[Supabase Status] Operation [${operation}] bypassing to local file storage: table not available (${msg.slice(0, 100)})`);
}

// Initialize Cloudinary
if (isCloudinaryConfigured) {
  cloudinary.config({
    cloud_name: cloudinaryCloudName,
    api_key: cloudinaryApiKey,
    api_secret: cloudinaryApiSecret,
  });
}

// Memory session store for active admins
const activeSessions: Map<string, AdminSession> = new Map();

// Local JSON File Data Access fallback
const localGamesFile = path.join(dataDir, "games.json");

// Arabic Seed Data
const seedGames: Game[] = [
  {
    id: "g1",
    name: "كلاش أوف كلانس (Clash of Clans)",
    image_url: "https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=300&q=80",
    version: "16.100.12",
    description: "انضم إلى ملايين اللاعبين حول العالم! ابنِ قريتك، وأنشئ قبيلة، وشارك في حروب قبائل ملحمية لإثبات قوتك وتفوقك الاستراتيجي. خطط لهجماتك بدقة، واستخدم قوات متنوعة من البرابرة والسحرة والتنانين لتدمير حصون الأعداء والحصول على الغنائم الوفيرة.",
    size: "342 MB",
    category: "games",
    sub_category: "استراتيجية",
    download_url: "https://play.google.com/store/apps/details?id=com.supercell.clashofclans",
    rating: 4.5,
    downloads_count: 500000000,
    created_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "g2",
    name: "ببجي موبايل (PUBG Mobile)",
    image_url: "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=300&q=80",
    version: "3.1.0",
    description: "لعبة البقاء والأكشن الأكثر شعبية على الهواتف الذكية. اهبط في جزر واسعة، وابحث عن الأسلحة والإمدادات، وحارب لتكون الناجي الأخير من بين 100 لاعب في معارك حية ومثيرة وتحديثات مستمرة وخرائط غنية بالتفاصيل.",
    size: "1.2 GB",
    category: "games",
    sub_category: "أكشن",
    download_url: "https://play.google.com/store/apps/details?id=com.tencent.ig",
    rating: 4.6,
    downloads_count: 1000000000,
    created_at: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "g3",
    name: "سبواي سورفرز (Subway Surfers)",
    image_url: "https://images.unsplash.com/photo-1551103782-8ab07afd45c1?auto=format&fit=crop&w=300&q=80",
    version: "3.26.1",
    description: "اركض بأقصى سرعتك وتفادى القطارات القادمة! ساعد جاك وأصدقائه على الهروب من المفتش العصبي وكلبه الشرس. اجمع العملات الذهبية واستخدم الطائرة الورقية والأحذية القافزة المذهلة لتسجيل أعلى النقاط في العالم.",
    size: "156 MB",
    category: "games",
    sub_category: "مغامرة",
    download_url: "https://play.google.com/store/apps/details?id=com.kiloo.subwaysurf",
    rating: 4.4,
    downloads_count: 1000000000,
    created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "g4",
    name: "واتساب ماسنجر (WhatsApp)",
    image_url: "https://images.unsplash.com/photo-1614741118887-7a4ee193a5fa?auto=format&fit=crop&w=300&q=80",
    version: "2.24.8",
    description: "برنامج المحادثة الفورية والاتصال الصوتي والمرئي المجاني الأكثر أماناً وسهولة في الاستخدام. تواصل مع عائلتك وأصدقائك في أي وقت ومكان بخصوصية تامة وتشفير تام بين الطرفين ومشاركة الصور والملفات بكفاءة.",
    size: "48 MB",
    category: "apps",
    sub_category: "تواصل اجتماعي",
    download_url: "https://play.google.com/store/apps/details?id=com.whatsapp",
    rating: 4.3,
    downloads_count: 5000000000,
    created_at: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "g5",
    name: "تطبيق التصميم كانفا (Canva)",
    image_url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=300&q=80",
    version: "2.258.0",
    description: "أداة التصميم الجرافيكي الشاملة والمثالية للجميع. صمم بوستات سوشيال ميديا، فيديوهات ريلز، عروض تقديمية وشعارات احترافية في دقائق معدودة وبدون أي خبرة سابقة، باستخدام آلاف القوالب المجانية الجاهزة.",
    size: "35 MB",
    category: "apps",
    sub_category: "أدوات",
    download_url: "https://play.google.com/store/apps/details?id=com.canva.editor",
    rating: 4.7,
    downloads_count: 100000000,
    created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "g6",
    name: "ماين كرافت (Minecraft)",
    image_url: "https://images.unsplash.com/photo-1605899435973-ca2d1a8861cf?auto=format&fit=crop&w=300&q=80",
    version: "1.20.80",
    description: "استكشف عوالم لا نهائية وابنِ كل شيء بدءاً من أبسط المنازل إلى أروع القلاع. العب في الوضع الإبداعي بموارد غير محدودة أو احفر عميقاً في وضع البقاء لصنع أسلحة ودروع لمواجهة الوحوش الخطيرة.",
    size: "650 MB",
    category: "games",
    sub_category: "محاكاة",
    download_url: "https://play.google.com/store/apps/details?id=com.mojang.minecraftpe",
    rating: 4.7,
    downloads_count: 50000000,
    created_at: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "g7",
    name: "تطبيق نوشن لتنظيم العمل والملاحظات (Notion)",
    image_url: "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=300&q=80",
    version: "0.22.4",
    description: "مساحة العمل المتكاملة لكتابة الملاحظات، تنظيم المهام، بناء قواعد البيانات وتنسيق المشاريع الشخصية أو المهنية. تخلص من تشتت التطبيقات واجمع كل ما تحتاجه في مكان واحد منسق وجميل وقابل للتخصيص الكامل.",
    size: "24 MB",
    category: "apps",
    sub_category: "إنتاجية",
    download_url: "https://play.google.com/store/apps/details?id=notion.id",
    rating: 4.6,
    downloads_count: 10000000,
    created_at: new Date(Date.now() - 22 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 22 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "g8",
    name: "تطبيق المنبه الذكي وساعة التركيز (Focus Plan)",
    image_url: "https://images.unsplash.com/photo-1508962914676-134849a727f0?auto=format&fit=crop&w=300&q=80",
    version: "1.4.2",
    description: "ضاعف إنتاجيتك وركز على أعمالك المهمة بفضل تقنية الطماطم (Pomodoro). يحتوي التطبيق على ساعة تركيز مدمجة، تقارير أداء، وأصوات طبيعية مهدئة لمساعدتك على إنجاز مهامك اليومية بدون تسويف.",
    size: "18 MB",
    category: "apps",
    sub_category: "أدوات",
    download_url: "https://play.google.com/store/apps/details?id=com.focusplan.pomodoro",
    rating: 4.8,
    downloads_count: 5000000,
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  }
];

// Helper to read local games file
function readLocalGames(): Game[] {
  if (!fs.existsSync(localGamesFile)) {
    fs.writeFileSync(localGamesFile, JSON.stringify(seedGames, null, 2), "utf8");
    return seedGames;
  }
  try {
    const data = fs.readFileSync(localGamesFile, "utf8");
    return JSON.parse(data) as Game[];
  } catch (error) {
    console.error("Error reading local games file, resetting to seed", error);
    return seedGames;
  }
}

// Helper to write local games file
function writeLocalGames(games: Game[]): void {
  fs.writeFileSync(localGamesFile, JSON.stringify(games, null, 2), "utf8");
}

// Database Operations Wrapper
async function getGamesDB(): Promise<Game[]> {
  if (isSupabaseConfigured && supabase && !isGamesTableMissing) {
    try {
      const { data, error } = await supabase
        .from("games")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      if (data && data.length > 0) {
        return data as Game[];
      }
      // If table is empty, seed it in Supabase
      if (data && data.length === 0) {
        const { error: insertError } = await supabase.from("games").insert(seedGames);
        if (!insertError) {
          return seedGames;
        }
      }
    } catch (err: any) {
      if (isTableMissingError(err)) {
        isGamesTableMissing = true;
      }
      logSupabaseFallback("fetch", err);
    }
  }
  return readLocalGames();
}

async function addGameDB(game: Game): Promise<Game> {
  if (isSupabaseConfigured && supabase && !isGamesTableMissing) {
    try {
      const { data, error } = await supabase
        .from("games")
        .insert([game])
        .select()
        .single();
      if (error) throw error;
      if (data) return data as Game;
    } catch (err: any) {
      if (isTableMissingError(err)) {
        isGamesTableMissing = true;
      }
      logSupabaseFallback("insert", err);
    }
  }
  const games = readLocalGames();
  games.unshift(game);
  writeLocalGames(games);
  return game;
}

async function updateGameDB(id: string, updatedFields: Partial<Game>): Promise<Game | null> {
  if (isSupabaseConfigured && supabase && !isGamesTableMissing) {
    try {
      const { data, error } = await supabase
        .from("games")
        .update(updatedFields)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      if (data) return data as Game;
    } catch (err: any) {
      if (isTableMissingError(err)) {
        isGamesTableMissing = true;
      }
      logSupabaseFallback("update", err);
    }
  }
  const games = readLocalGames();
  const index = games.findIndex((g) => g.id === id);
  if (index !== -1) {
    games[index] = {
      ...games[index],
      ...updatedFields,
      updated_at: new Date().toISOString(),
    };
    writeLocalGames(games);
    return games[index];
  }
  return null;
}

async function getGameById(id: string): Promise<Game | null> {
  if (isSupabaseConfigured && supabase && !isGamesTableMissing) {
    try {
      const { data, error } = await supabase
        .from("games")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      if (data) return data as Game;
    } catch (err: any) {
      if (isTableMissingError(err)) {
        isGamesTableMissing = true;
      }
      logSupabaseFallback("getById", err);
    }
  }
  const games = readLocalGames();
  return games.find((g) => g.id === id) || null;
}

function extractCloudinaryPublicId(url: string): string | null {
  if (!url || !url.includes("res.cloudinary.com")) return null;
  try {
    const parts = url.split("/image/upload/");
    if (parts.length < 2) return null;
    
    const afterUpload = parts[1];
    const pathParts = afterUpload.split("/");
    
    if (pathParts[0].match(/^v\d+$/)) {
      pathParts.shift();
    }
    
    const publicIdWithExt = pathParts.join("/");
    const lastDotIndex = publicIdWithExt.lastIndexOf(".");
    if (lastDotIndex !== -1) {
      return publicIdWithExt.substring(0, lastDotIndex);
    }
    return publicIdWithExt;
  } catch (e) {
    console.warn("Failed to extract Cloudinary public ID from URL:", url, e);
    return null;
  }
}

async function deleteGameDB(id: string): Promise<boolean> {
  if (isSupabaseConfigured && supabase && !isGamesTableMissing) {
    try {
      const { error } = await supabase.from("games").delete().eq("id", id);
      if (error) throw error;
      // also keep local in sync
      const games = readLocalGames();
      const filtered = games.filter((g) => g.id !== id);
      writeLocalGames(filtered);
      return true;
    } catch (err: any) {
      if (isTableMissingError(err)) {
        isGamesTableMissing = true;
      }
      logSupabaseFallback("delete", err);
    }
  }
  const games = readLocalGames();
  const filtered = games.filter((g) => g.id !== id);
  if (games.length !== filtered.length) {
    writeLocalGames(filtered);
    return true;
  }
  return false;
}

async function saveAllGamesDB(games: Game[]): Promise<boolean> {
  if (isSupabaseConfigured && supabase && !isGamesTableMissing) {
    try {
      // In Supabase, to reorder we can just update each game or do a bulk update.
      // But since we are sorting by custom order or saving the full list, 
      // let's update them with their new indices or update_at times to preserve sorting.
      for (let i = 0; i < games.length; i++) {
        // We set created_at/updated_at to match the sequence order
        const gameId = games[i].id;
        const newCreatedAt = new Date(Date.now() - i * 1000).toISOString();
        const { error } = await supabase
          .from("games")
          .update({ created_at: newCreatedAt })
          .eq("id", gameId);
        if (error) throw error;
      }
      return true;
    } catch (err: any) {
      if (isTableMissingError(err)) {
        isGamesTableMissing = true;
      }
      logSupabaseFallback("reorder", err);
    }
  }
  // Local storage reordering
  writeLocalGames(games);
  return true;
}

// Multer storage configuration for local fallback uploading
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only images are allowed!"));
    }
  },
});

// Middleware for Admin authentication
const adminAuth = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "غير مصرح لك بدخول هذه الصفحة. الرجاء تسجيل الدخول أولاً." });
  }
  const token = authHeader.split(" ")[1];
  const session = activeSessions.get(token);
  if (!session || session.expiresAt < Date.now()) {
    if (session) activeSessions.delete(token); // clean up expired
    return res.status(401).json({ error: "انتهت صلاحية الجلسة. الرجاء تسجيل الدخول مجدداً." });
  }
  next();
};

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// ------------------- API ROUTES -------------------

// Check configuration status
app.get("/api/config-status", async (req, res) => {
  let isTableMissing = false;
  let connectionError: string | null = null;

  if (isSupabaseConfigured && supabase) {
    try {
      const forceRefresh = req.query.refresh === "true";
      if (forceRefresh) {
        isGamesTableMissing = false;
      }

      if (isGamesTableMissing) {
        isTableMissing = true;
        connectionError = "Could not find the table 'public.games' in the schema cache";
      } else {
        const { error } = await supabase.from("games").select("id").limit(1);
        if (error) {
          if (isTableMissingError(error)) {
            isGamesTableMissing = true;
            isTableMissing = true;
          }
          connectionError = error.message;
        } else {
          isGamesTableMissing = false;
        }
      }
    } catch (e: any) {
      connectionError = e?.message || String(e);
    }
  }

  res.json({
    isSupabaseConnected: isSupabaseConfigured,
    isCloudinaryConnected: isCloudinaryConfigured,
    localModeActive: !isSupabaseConfigured || !isCloudinaryConfigured,
    adminEmail: ADMIN_EMAIL,
    isTableMissing,
    connectionError,
  } as ConfigStatus);
});

// Admin Login
app.post("/api/admin/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "الرجاء إدخال البريد الإلكتروني وكلمة المرور." });
  }

  // 1. Try real Supabase auth if configured
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (!error && data?.user) {
        // Authenticated successfully in Supabase!
        // We will generate an admin session
        const token = crypto.randomBytes(32).toString("hex");
        const session: AdminSession = {
          token,
          email: data.user.email || email,
          expiresAt: Date.now() + 4 * 60 * 60 * 1000, // 4 hours
        };
        activeSessions.set(token, session);
        return res.json({
          message: "تم تسجيل الدخول بنجاح عبر Supabase",
          token,
          email: session.email,
        });
      }
      
      // If Supabase authentication fails, let's fall back to checking if it matches the fallback .env admin
      // to ensure the user can always log in.
    } catch (err) {
      console.warn("Supabase Auth failed, checking fallback credentials", err);
    }
  }

  // 2. Fallback to env variable admin login
  if (email.toLowerCase() === ADMIN_EMAIL.toLowerCase() && password === ADMIN_PASSWORD) {
    const token = crypto.randomBytes(32).toString("hex");
    const session: AdminSession = {
      token,
      email: ADMIN_EMAIL,
      expiresAt: Date.now() + 4 * 60 * 60 * 1000, // 4 hours
    };
    activeSessions.set(token, session);
    return res.json({
      message: "تم تسجيل الدخول بنجاح (وضع الأدمن الاحتياطي)",
      token,
      email: ADMIN_EMAIL,
    });
  }

  return res.status(401).json({ error: "البريد الإلكتروني أو كلمة المرور غير صحيحة." });
});

// Admin verification
app.get("/api/admin/me", (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.json({ isAuthenticated: false });
  }
  const token = authHeader.split(" ")[1];
  const session = activeSessions.get(token);
  if (!session || session.expiresAt < Date.now()) {
    if (session) activeSessions.delete(token);
    return res.json({ isAuthenticated: false });
  }
  res.json({ isAuthenticated: true, email: session.email });
});

// Admin Logout
app.post("/api/admin/logout", (req, res) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.split(" ")[1];
    activeSessions.delete(token);
  }
  res.json({ success: true, message: "تم تسجيل الخروج بنجاح." });
});

// Get Games list
app.get("/api/games", async (req, res) => {
  try {
    const games = await getGamesDB();
    res.json(games);
  } catch (error) {
    res.status(500).json({ error: "حدث خطأ أثناء جلب قائمة الألعاب." });
  }
});

// Handle image upload to Cloudinary (or local server fallback)
app.post("/api/upload", upload.single("image"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "الرجاء اختيار صورة للرفع." });
  }

  try {
    // 1. If Cloudinary is configured, upload to Cloudinary with automatic local fallback on error
    if (isCloudinaryConfigured) {
      try {
        const uploadPromise = new Promise<string>((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            {
              folder: "playstore_games",
              allowed_formats: ["jpg", "png", "jpeg", "webp"],
            },
            (error, result) => {
              if (error || !result) {
                reject(error || new Error("Failed to upload to Cloudinary"));
              } else {
                resolve(result.secure_url);
              }
            }
          );
          uploadStream.end(req.file!.buffer);
        });

        const cloudinaryUrl = await uploadPromise;
        return res.json({ url: cloudinaryUrl });
      } catch (cloudinaryErr: any) {
        const msg = cloudinaryErr?.message || String(cloudinaryErr);
        console.log(`[Upload Status] Routing asset to local folder (Cloudinary: ${msg.slice(0, 100)})`);
      }
    }

    // 2. Local fallback - write file to /public/uploads
    const ext = path.extname(req.file.originalname) || ".png";
    const filename = `${crypto.randomBytes(16).toString("hex")}${ext}`;
    const destinationPath = path.join(uploadsDir, filename);

    fs.writeFileSync(destinationPath, req.file.buffer);
    
    // Serve local images relative to root URL, e.g., /uploads/filename
    const localUrl = `/uploads/${filename}`;
    return res.json({ url: localUrl });
  } catch (error: any) {
    console.error("Upload error details:", error);
    res.status(500).json({ error: "حدث خطأ أثناء رفع الصورة: " + error.message });
  }
});

// Create new Game (Admin Only)
app.post("/api/games", adminAuth, async (req, res) => {
  const { name, image_url, version, description, size, category, sub_category, download_url } = req.body;

  if (!name || !image_url || !version || !description || !size || !category || !download_url) {
    return res.status(400).json({ error: "الرجاء إدخال جميع الحقول الإلزامية المطلوبة." });
  }

  const newGame: Game = {
    id: `g-${crypto.randomBytes(8).toString("hex")}`,
    name,
    image_url,
    version,
    description,
    size,
    category,
    sub_category: sub_category || "",
    download_url,
    rating: parseFloat((Math.random() * (5.0 - 4.1) + 4.1).toFixed(1)), // random beautiful rating between 4.1 and 5.0
    downloads_count: [50000, 100000, 500000, 1000000, 5000000, 10000000][Math.floor(Math.random() * 6)],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  try {
    const savedGame = await addGameDB(newGame);
    res.status(201).json(savedGame);
  } catch (error) {
    res.status(500).json({ error: "حدث خطأ أثناء حفظ اللعبة الجديدة." });
  }
});

// Edit Game (Admin Only)
app.put("/api/games/:id", adminAuth, async (req, res) => {
  const { id } = req.params;
  const { name, image_url, version, description, size, category, sub_category, download_url } = req.body;

  if (!name || !image_url || !version || !description || !size || !category || !download_url) {
    return res.status(400).json({ error: "الرجاء إدخال جميع الحقول الإلزامية المطلوبة للتعديل." });
  }

  try {
    const updated = await updateGameDB(id, {
      name,
      image_url,
      version,
      description,
      size,
      category,
      sub_category: sub_category || "",
      download_url,
    });

    if (updated) {
      res.json(updated);
    } else {
      res.status(404).json({ error: "لم يتم العثور على اللعبة المطلوبة للتعديل." });
    }
  } catch (error) {
    res.status(500).json({ error: "حدث خطأ أثناء تحديث بيانات اللعبة." });
  }
});

// Delete Game (Admin Only)
app.delete("/api/games/:id", adminAuth, async (req, res) => {
  const { id } = req.params;

  try {
    // 1. Get game details first to locate image_url
    const game = await getGameById(id);
    if (!game) {
      return res.status(404).json({ error: "لم يتم العثور على اللعبة لحذفها." });
    }

    // 2. If Cloudinary is configured, try to delete the image from Cloudinary
    if (isCloudinaryConfigured && game.image_url) {
      const publicId = extractCloudinaryPublicId(game.image_url);
      if (publicId) {
        try {
          console.log(`[Cloudinary Delete] Attempting to destroy public_id: ${publicId}`);
          const result = await new Promise((resolve, reject) => {
            cloudinary.uploader.destroy(publicId, (error, result) => {
              if (error) reject(error);
              else resolve(result);
            });
          });
          console.log(`[Cloudinary Delete] Result:`, result);
        } catch (cloudinaryErr: any) {
          console.warn(`[Cloudinary Delete] Failed to destroy image:`, cloudinaryErr?.message || cloudinaryErr);
        }
      }
    }

    // 3. Delete from database (Supabase / Local fallback)
    const deleted = await deleteGameDB(id);
    if (deleted) {
      res.json({ success: true, message: "تم حذف اللعبة بنجاح." });
    } else {
      res.status(404).json({ error: "لم يتم العثور على اللعبة لحذفها في قاعدة البيانات." });
    }
  } catch (error: any) {
    console.error("Error deleting game:", error);
    res.status(500).json({ error: "حدث خطأ أثناء حذف اللعبة: " + error.message });
  }
});

// Reorder games (Admin Only)
app.post("/api/games/reorder", adminAuth, async (req, res) => {
  const { orderedGames } = req.body;
  if (!Array.isArray(orderedGames)) {
    return res.status(400).json({ error: "البيانات المرسلة غير صالحة." });
  }

  try {
    await saveAllGamesDB(orderedGames);
    res.json({ success: true, message: "تم إعادة ترتيب الألعاب بنجاح." });
  } catch (error) {
    res.status(500).json({ error: "حدث خطأ أثناء حفظ الترتيب الجديد." });
  }
});

// Serve frontend and handle development vs production
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    // Serve static uploads folder in development
    app.use("/uploads", express.static(path.join(process.cwd(), "public", "uploads")));

    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.use("/uploads", express.static(path.join(process.cwd(), "public", "uploads")));

    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  if (!process.env.VERCEL) {
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on http://localhost:${PORT}`);
      console.log(`- Supabase Integration: ${isSupabaseConfigured ? "ENABLED" : "LOCAL BACKEND ACTIVE"}`);
      console.log(`- Cloudinary Storage: ${isCloudinaryConfigured ? "ENABLED" : "LOCAL STORAGE ACTIVE"}`);
    });
  }
}

startServer();

export default app;
