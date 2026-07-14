/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import {
  Plus,
  Trash2,
  Edit3,
  Upload,
  ArrowUp,
  ArrowDown,
  Search,
  CheckCircle,
  AlertCircle,
  Database,
  CloudLightning,
  Sparkles,
  RefreshCw,
  LogOut,
  AppWindow,
  Gamepad2,
  Loader2,
  ListRestart
} from "lucide-react";
import {
  fetchGames,
  createGame,
  updateGame,
  deleteGame,
  saveReorderedGames,
  uploadImage,
  fetchConfigStatus
} from "../api";
import { Game, ConfigStatus } from "../types";

interface AdminPanelProps {
  onLogout: () => void;
  adminEmail: string;
  onGamesChanged?: () => void;
}

export default function AdminPanel({ onLogout, adminEmail, onGamesChanged }: AdminPanelProps) {
  const [games, setGames] = useState<Game[]>([]);
  const [loadingGames, setLoadingGames] = useState(true);
  const [config, setConfig] = useState<ConfigStatus | null>(null);

  // Form states
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [version, setVersion] = useState("");
  const [size, setSize] = useState("");
  const [category, setCategory] = useState<"games" | "apps">("games");
  const [subCategory, setSubCategory] = useState("ألعاب");
  const [description, setDescription] = useState("");
  const [downloadUrl, setDownloadUrl] = useState("");
  const [imageUrl, setImageUrl] = useState("");

  // UI state
  const [searchTerm, setSearchTerm] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [sqlCopied, setSqlCopied] = useState(false);

  // Custom confirmation modal states
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deleteConfirmName, setDeleteConfirmName] = useState("");
  const [deletingGame, setDeletingGame] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadGames();
    loadConfig();
  }, []);

  const loadGames = async () => {
    setLoadingGames(true);
    try {
      const data = await fetchGames();
      setGames(data);
    } catch (err: any) {
      setErrorMsg("حدث خطأ أثناء تحميل الألعاب: " + err.message);
    } finally {
      setLoadingGames(false);
    }
  };

  const loadConfig = async () => {
    try {
      const status = await fetchConfigStatus();
      setConfig(status);
    } catch (e) {
      console.error(e);
    }
  };

  const resetForm = () => {
    setIsEditing(false);
    setEditingId(null);
    setName("");
    setVersion("");
    setSize("");
    setCategory("games");
    setSubCategory("ألعاب أكشن");
    setDescription("");
    setDownloadUrl("");
    setImageUrl("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    setErrorMsg(null);
    try {
      const uploadedUrl = await uploadImage(file);
      setImageUrl(uploadedUrl);
      setSuccessMsg("تم رفع الصورة وتوليد الرابط بنجاح!");
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setErrorMsg("فشل رفع الصورة: " + err.message);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!name || !version || !size || !description || !downloadUrl || !imageUrl) {
      setErrorMsg("يرجى ملء جميع الحقول ورفع صورة اللعبة.");
      return;
    }

    setFormLoading(true);

    const gameData = {
      name,
      image_url: imageUrl,
      version,
      description,
      size,
      category,
      sub_category: subCategory,
      download_url: downloadUrl,
    };

    try {
      if (isEditing && editingId) {
        await updateGame(editingId, gameData);
        setSuccessMsg(`تم تحديث بيانات اللعبة "${name}" بنجاح!`);
      } else {
        await createGame(gameData);
        setSuccessMsg(`تمت إضافة اللعبة "${name}" ونشرها بنجاح!`);
      }
      resetForm();
      await loadGames();
      onGamesChanged?.();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setErrorMsg("حدث خطأ أثناء الحفظ: " + err.message);
    } finally {
      setFormLoading(false);
    }
  };

  const handleEditClick = (game: Game) => {
    setIsEditing(true);
    setEditingId(game.id);
    setName(game.name);
    setVersion(game.version);
    setSize(game.size);
    setCategory(game.category);
    setSubCategory(game.sub_category || "");
    setDescription(game.description);
    setDownloadUrl(game.download_url);
    setImageUrl(game.image_url);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDeleteClick = (gameId: string, gameName: string) => {
    setDeleteConfirmId(gameId);
    setDeleteConfirmName(gameName);
  };

  const executeDeleteGame = async () => {
    if (!deleteConfirmId) return;
    setErrorMsg(null);
    setSuccessMsg(null);
    setDeletingGame(true);
    try {
      await deleteGame(deleteConfirmId);
      setSuccessMsg(`تم حذف اللعبة "${deleteConfirmName}" بنجاح.`);
      setDeleteConfirmId(null);
      setDeleteConfirmName("");
      await loadGames();
      onGamesChanged?.();
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setErrorMsg("حدث خطأ أثناء حذف اللعبة: " + err.message);
    } finally {
      setDeletingGame(false);
    }
  };

  // Reordering handlers
  const moveGame = async (index: number, direction: "up" | "down") => {
    const newGames = [...games];
    const targetIndex = direction === "up" ? index - 1 : index + 1;

    if (targetIndex < 0 || targetIndex >= newGames.length) return;

    // Swap
    const temp = newGames[index];
    newGames[index] = newGames[targetIndex];
    newGames[targetIndex] = temp;

    setGames(newGames);

    try {
      await saveReorderedGames(newGames);
      onGamesChanged?.();
    } catch (err: any) {
      setErrorMsg("فشل حفظ الترتيب الجديد: " + err.message);
    }
  };

  // Filter games based on search
  const filteredGames = games.filter((game) =>
    game.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (game.sub_category && game.sub_category.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-8" id="admin-panel-root">
      {/* Top Welcome Panel with Credentials State */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-800/80 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className={`h-2.5 w-2.5 rounded-full ${config?.isTableMissing ? "bg-amber-500 animate-pulse" : "bg-emerald-500 animate-ping"}`} />
            <h1 className="text-xl md:text-2xl font-black text-slate-900 dark:text-slate-100">
              مرحباً بك في لوحة الإدارة العامة 👋
            </h1>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            أنت مسجل الدخول بصفتك أدمن بموجب الحساب: <strong className="text-slate-700 dark:text-slate-300">{adminEmail}</strong>
          </p>
        </div>

        {/* Configurations Health Checklist */}
        <div className="flex flex-wrap items-center gap-3">
          <div className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 ${
            config?.isSupabaseConnected 
              ? config?.isTableMissing
                ? "bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 border border-amber-100 dark:border-amber-900/30"
                : "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/40" 
              : "bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 border border-amber-100 dark:border-amber-900/30"
          }`}>
            <Database className="w-4 h-4" />
            <span>
              قاعدة البيانات: {
                config?.isSupabaseConnected 
                  ? config?.isTableMissing
                    ? "Supabase متصل (جدول ناقص)"
                    : "Supabase متصل" 
                  : "محاكاة محلية نشطة"
              }
            </span>
          </div>

          <div className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 ${config?.isCloudinaryConnected ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/40" : "bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 border border-amber-100 dark:border-amber-900/30"}`}>
            <CloudLightning className="w-4 h-4" />
            <span>رفع الصور: {config?.isCloudinaryConnected ? "Cloudinary نشط" : "تخزين محلي نشط"}</span>
          </div>

          <button
            onClick={onLogout}
            className="px-4 py-2 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/20 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400 font-bold rounded-xl text-xs transition-colors flex items-center gap-1.5"
          >
            <LogOut className="w-4 h-4" />
            تسجيل الخروج
          </button>
        </div>
      </div>

      {/* Messages */}
      {successMsg && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 rounded-2xl text-emerald-800 dark:text-emerald-400 text-sm flex items-center gap-2">
          <CheckCircle className="w-5 h-5 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/40 rounded-2xl text-rose-800 dark:text-rose-400 text-sm flex items-start gap-2">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Supabase Missing Table Setup Helper Card */}
      {config?.isSupabaseConnected && config?.isTableMissing && (
        <div className="p-6 bg-amber-50/50 dark:bg-slate-900/50 border border-amber-200 dark:border-amber-900/40 rounded-3xl space-y-4 animate-fade-in">
          <div className="flex items-center gap-2.5 text-amber-800 dark:text-amber-400">
            <Database className="w-5.5 h-5.5" />
            <h3 className="font-extrabold text-base">⚠️ تهيئة جدول قاعدة بيانات Supabase مطلوبة</h3>
          </div>
          <div className="text-xs text-amber-900 dark:text-amber-300 leading-relaxed space-y-2 font-sans">
            <p>
              لقد تم الاتصال بـ <strong>Supabase</strong> بنجاح بموجب بيانات البيئة الخاصة بك، ولكن جدول تخزين الألعاب والتطبيقات <code>games</code> غير موجود حالياً في قاعدة البيانات.
            </p>
            <p>
              يقوم التطبيق حالياً بتفعيل <strong>التخزين والمحاكاة المحلية (Local Storage)</strong> تلقائياً لتمكين تصفح وإضافة الألعاب مباشرة دون توقف! لربط البيانات دائمًا في سوبابيس، يرجى تشغيل كود SQL التالي:
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-gray-500 font-mono">schema.sql</span>
              <button
                onClick={() => {
                  const sqlCode = `CREATE TABLE IF NOT EXISTS games (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  image_url TEXT NOT NULL,
  version TEXT NOT NULL,
  description TEXT NOT NULL,
  size TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('games', 'apps')),
  sub_category TEXT,
  download_url TEXT NOT NULL,
  rating NUMERIC,
  downloads_count BIGINT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- تمكين سياسات الوصول والحماية للجميع لقراءة وتعديل البيانات
ALTER TABLE games ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "الوصول العام للقراءة" ON games;
DROP POLICY IF EXISTS "الوصول العام للإضافة" ON games;
DROP POLICY IF EXISTS "الوصول العام للتعديل" ON games;
DROP POLICY IF EXISTS "الوصول العام للحذف" ON games;

CREATE POLICY "الوصول العام للقراءة" ON games FOR SELECT USING (true);
CREATE POLICY "الوصول العام للإضافة" ON games FOR INSERT WITH CHECK (true);
CREATE POLICY "الوصول العام للتعديل" ON games FOR UPDATE USING (true);
CREATE POLICY "الوصول العام للحذف" ON games FOR DELETE USING (true);`;

                  navigator.clipboard.writeText(sqlCode);
                  setSqlCopied(true);
                  setTimeout(() => setSqlCopied(false), 3000);
                }}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[10px] font-bold transition-all shadow-sm flex items-center gap-1 cursor-pointer"
              >
                {sqlCopied ? "تم النسخ! ✓" : "نسخ كود SQL"}
              </button>
            </div>

            <pre className="p-4 bg-slate-900 text-slate-100 rounded-2xl text-[11px] font-mono overflow-x-auto text-left leading-normal border border-slate-800 shadow-inner-sm max-h-48 scrollbar">
{`CREATE TABLE IF NOT EXISTS games (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  image_url TEXT NOT NULL,
  version TEXT NOT NULL,
  description TEXT NOT NULL,
  size TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('games', 'apps')),
  sub_category TEXT,
  download_url TEXT NOT NULL,
  rating NUMERIC,
  downloads_count BIGINT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE games ENABLE ROW LEVEL SECURITY;
CREATE POLICY "الوصول العام للقراءة" ON games FOR SELECT USING (true);
CREATE POLICY "الوصول العام للإضافة" ON games FOR INSERT WITH CHECK (true);
CREATE POLICY "الوصول العام للتعديل" ON games FOR UPDATE USING (true);
CREATE POLICY "الوصول العام للحذف" ON games FOR DELETE USING (true);`}
            </pre>
          </div>

          <div className="text-[11px] text-amber-800/80 dark:text-amber-400/80 leading-normal font-sans pr-4 border-r-2 border-amber-300">
            <strong>طريقة التفعيل:</strong> اذهب إلى لوحة تحكم سوبابيس (Supabase Dashboard) &gt; اذهب إلى <strong>SQL Editor</strong> &gt; الصق الكود السابق &gt; انقر على <strong>Run</strong>. ثم اضغط على زر "تحديث المعرض" أو قم بتحديث الصفحة وسيعمل الاتصال السحابي مباشرة!
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Side Column: Form for Add/Edit Game */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-800/80">
            <h2 className="text-lg font-extrabold text-slate-900 dark:text-slate-100 mb-6 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-blue-500" />
              {isEditing ? "تعديل بيانات اللعبة" : "نشر لعبة/تطبيق جديد"}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Game Name */}
              <div className="space-y-1.5">
                <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300">اسم اللعبة / التطبيق</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="مثال: صب واي سورفرز النسخة العربية"
                  className="w-full px-4 py-2.5 text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:focus:ring-blue-400/20 focus:outline-none dark:text-slate-100 transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Version */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300">الإصدار</label>
                  <input
                    type="text"
                    required
                    value={version}
                    onChange={(e) => setVersion(e.target.value)}
                    placeholder="مثال: 1.2.4"
                    className="w-full px-4 py-2.5 text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:focus:ring-blue-400/20 focus:outline-none dark:text-slate-100 transition-all"
                  />
                </div>

                {/* Size */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300">الحجم</label>
                  <input
                    type="text"
                    required
                    value={size}
                    onChange={(e) => setSize(e.target.value)}
                    placeholder="مثال: 120 MB"
                    className="w-full px-4 py-2.5 text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:focus:ring-blue-400/20 focus:outline-none dark:text-slate-100 transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Category selection */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300">التصنيف الرئيسي</label>
                  <select
                    value={category}
                    onChange={(e) => {
                      const val = e.target.value as "games" | "apps";
                      setCategory(val);
                      setSubCategory(val === "games" ? "ألعاب أكشن" : "تطبيقات تواصل");
                    }}
                    className="w-full px-4 py-2.5 text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none dark:text-slate-100 transition-all"
                  >
                    <option value="games">ألعاب (Games)</option>
                    <option value="apps">تطبيقات (Apps)</option>
                  </select>
                </div>

                {/* Sub category */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300">النوع الفرعي</label>
                  <input
                    type="text"
                    required
                    value={subCategory}
                    onChange={(e) => setSubCategory(e.target.value)}
                    placeholder="مثال: أكشن، استراتيجية، أدوات"
                    className="w-full px-4 py-2.5 text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:focus:ring-blue-400/20 focus:outline-none dark:text-slate-100 transition-all"
                  />
                </div>
              </div>

              {/* Download URL */}
              <div className="space-y-1.5">
                <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300">رابط تحميل اللعبة / التطبيق</label>
                <input
                  type="url"
                  required
                  value={downloadUrl}
                  onChange={(e) => setDownloadUrl(e.target.value)}
                  placeholder="https://example.com/download"
                  className="w-full px-4 py-2.5 text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:focus:ring-blue-400/20 focus:outline-none dark:text-slate-100 transition-all"
                />
              </div>

              {/* Game Cover Image upload / URL */}
              <div className="space-y-2">
                <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300">أيقونة وصورة اللعبة</label>
                
                {/* Real drag-and-drop or file upload zone */}
                <div className="border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-400 rounded-2xl p-4 text-center cursor-pointer bg-slate-50 dark:bg-slate-800/40 relative transition-all duration-300 group">
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    onChange={handleImageFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    disabled={uploadingImage}
                  />
                  <div className="flex flex-col items-center justify-center gap-1.5">
                    {uploadingImage ? (
                      <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                    ) : (
                      <Upload className="w-8 h-8 text-slate-400 group-hover:text-blue-500 transition-colors" />
                    )}
                    <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                      {uploadingImage ? "جاري الرفع والمعالجة..." : "انقر لاختيار ملف صورة للرفع"}
                    </span>
                    <span className="text-[10px] text-slate-400 leading-normal">
                      PNG, JPG, WEBP (بحد أقصى 5 ميجابايت)
                    </span>
                  </div>
                </div>

                {/* Direct image link manual or auto populated */}
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-400">أو يمكنك وضع رابط الصورة يدوياً هنا:</span>
                  <input
                    type="text"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="https://example.com/image.png"
                    className="w-full px-4 py-2 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none dark:text-slate-100 font-mono"
                  />
                </div>

                {/* Icon preview inside the form */}
                {imageUrl && (
                  <div className="flex items-center gap-3 p-2 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800">
                    <img src={imageUrl} alt="الأيقونة" className="w-12 h-12 rounded-xl object-cover shrink-0" referrerPolicy="no-referrer" />
                    <span className="text-[11px] text-slate-500 truncate">{imageUrl}</span>
                  </div>
                )}
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300">الوصف الكامل والمميزات</label>
                <textarea
                  required
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="اكتب وصفاً مفصلاً ومميزات اللعبة أو التطبيق..."
                  className="w-full px-4 py-2.5 text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:focus:ring-blue-400/20 focus:outline-none dark:text-slate-100 transition-all resize-none"
                />
              </div>

              {/* Form Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={formLoading || uploadingImage}
                  className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 disabled:bg-blue-400 text-white font-bold rounded-xl text-sm transition-colors shadow-md hover:shadow-lg hover:shadow-blue-500/10 flex items-center justify-center gap-2"
                >
                  {formLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Plus className="w-4 h-4" />
                  )}
                  {isEditing ? "حفظ التعديلات" : "نشر الآن في المتجر"}
                </button>
                
                {(isEditing || name || imageUrl || description) && (
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-4 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-xl text-sm transition-colors"
                  >
                    إلغاء
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>

        {/* Right Side Column: Manage Games list with Reordering & search */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-800/80">
            {/* List Header controls */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
              <div className="space-y-1">
                <h2 className="text-lg font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <ListRestart className="w-5 h-5 text-blue-500" />
                  إدارة وترتيب الألعاب والتطبيقات
                </h2>
                <p className="text-xs text-slate-400">
                  يمكنك استخدام الأسهم لإعادة ترتيب الألعاب والتحكم بأولويات ظهورها في واجهة المستخدم.
                </p>
              </div>

              {/* Local search engine */}
              <div className="relative max-w-xs w-full">
                <span className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400">
                  <Search className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  placeholder="ابحث عن لعبة أو تصنيف..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-4 pr-10 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none dark:text-slate-100"
                />
              </div>
            </div>

            {/* List of elements */}
            {loadingGames ? (
              <div className="py-20 text-center flex flex-col items-center justify-center gap-3">
                <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
                <span className="text-sm text-slate-400">جاري تحميل قائمة الألعاب...</span>
              </div>
            ) : filteredGames.length === 0 ? (
              <div className="py-16 text-center border-2 border-dashed border-slate-100 dark:border-slate-800/80 rounded-2xl flex flex-col items-center justify-center gap-3 text-slate-400">
                <AppWindow className="w-12 h-12 opacity-40" />
                <span className="text-sm font-bold">لا توجد ألعاب متوفرة مطابقة للبحث أو معلنة حالياً.</span>
                <button onClick={resetForm} className="text-xs text-blue-500 font-bold hover:underline">
                  إعادة تهيئة النموذج ونشر لعبة جديدة
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredGames.map((game, index) => (
                  <div
                    key={game.id}
                    className="flex items-center justify-between p-4 bg-slate-50/50 dark:bg-slate-800/30 hover:bg-slate-50 dark:hover:bg-slate-800/50 border border-slate-100 dark:border-slate-800/80 rounded-2xl transition-all duration-200"
                  >
                    {/* Game cover & Title info */}
                    <div className="flex items-center gap-4 min-w-0 flex-1">
                      <div className="w-14 h-14 rounded-xl overflow-hidden bg-slate-100 shrink-0 border border-slate-200/50 dark:border-slate-700">
                        <img src={game.image_url} alt={game.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      </div>
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                            {game.name}
                          </h4>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${game.category === "games" ? "bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400" : "bg-sky-50 dark:bg-sky-950/30 text-sky-600 dark:text-sky-400"}`}>
                            {game.category === "games" ? "لعبة" : "تطبيق"}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-3 flex-wrap">
                          <span>الإصدار: <span className="font-semibold font-mono">{game.version}</span></span>
                          <span>الحجم: <span className="font-semibold font-mono">{game.size}</span></span>
                          {game.sub_category && <span>النوع: <span className="font-semibold">{game.sub_category}</span></span>}
                        </p>
                      </div>
                    </div>

                    {/* Controls (Edit, Delete, Reorder) */}
                    <div className="flex items-center gap-2 mr-4 shrink-0">
                      {/* Reorder controls */}
                      <div className="flex flex-col gap-1 pr-2 border-r border-slate-200 dark:border-slate-800 ml-2">
                        <button
                          type="button"
                          disabled={index === 0}
                          onClick={() => moveGame(index, "up")}
                          className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 rounded text-slate-500 dark:text-slate-400 transition-colors"
                          title="نقل لأعلى"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          disabled={index === games.length - 1}
                          onClick={() => moveGame(index, "down")}
                          className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 rounded text-slate-500 dark:text-slate-400 transition-colors"
                          title="نقل لأسفل"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Edit controls */}
                      <button
                        onClick={() => handleEditClick(game)}
                        className="p-2 hover:bg-blue-50 dark:hover:bg-blue-950/40 text-blue-500 dark:text-blue-400 rounded-xl transition-colors"
                        title="تعديل"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>

                      {/* Delete controls */}
                      <button
                        onClick={() => handleDeleteClick(game.id, game.name)}
                        className="p-2 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-500 dark:text-rose-400 rounded-xl transition-colors"
                        title="حذف"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-6 text-right" dir="rtl">
            <div className="flex items-center gap-3 text-rose-500 dark:text-rose-400">
              <div className="p-3 bg-rose-50 dark:bg-rose-950/40 rounded-2xl">
                <Trash2 className="w-6 h-6" />
              </div>
              <div className="space-y-0.5">
                <h3 className="text-lg font-black text-slate-900 dark:text-slate-50">تأكيد حذف اللعبة</h3>
                <p className="text-xs text-slate-400 dark:text-slate-500">هذه العملية غير قابلة للتراجع</p>
              </div>
            </div>

            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              هل أنت متأكد من رغبتك في حذف اللعبة <strong className="text-slate-900 dark:text-slate-100">"{deleteConfirmName}"</strong> نهائياً؟ سيتم إزالة كافة البيانات المرتبطة بها وصورتها المرفوعة على السحابة.
            </p>

            <div className="flex gap-3 pt-2">
              <button
                onClick={executeDeleteGame}
                disabled={deletingGame}
                className="flex-1 py-3 bg-rose-600 hover:bg-rose-700 dark:bg-rose-500 dark:hover:bg-rose-600 disabled:bg-rose-400 text-white font-bold rounded-2xl text-sm transition-all shadow-md hover:shadow-lg hover:shadow-rose-500/15 flex items-center justify-center gap-2"
              >
                {deletingGame ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                <span>تأكيد الحذف</span>
              </button>
              <button
                onClick={() => {
                  setDeleteConfirmId(null);
                  setDeleteConfirmName("");
                }}
                disabled={deletingGame}
                className="px-5 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-2xl text-sm transition-all"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
