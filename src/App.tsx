/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from "react";
import {
  Search,
  Moon,
  Sun,
  Shield,
  Gamepad2,
  AppWindow,
  Flame,
  Clock,
  Sparkles,
  RefreshCw,
  Loader2,
  Smartphone,
  ChevronLeft,
  LayoutGrid
} from "lucide-react";
import { fetchGames, verifyAdmin, logoutAdmin } from "./api";
import { Game } from "./types";
import { motion, LayoutGroup } from "motion/react";

// Sub-components
import GameCard from "./components/GameCard";
import GameDetails from "./components/GameDetails";
import AdminLogin from "./components/AdminLogin";
import AdminPanel from "./components/AdminPanel";

export default function App() {
  // Theme state
  const [theme, setTheme] = useState<"light" | "dark">((): "light" | "dark" => {
    if (typeof window !== "undefined") {
      const savedTheme = localStorage.getItem("playstore_theme") as "light" | "dark" | null;
      if (savedTheme) {
        document.documentElement.classList.toggle("dark", savedTheme === "dark");
        return savedTheme;
      }
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      document.documentElement.classList.toggle("dark", prefersDark);
      return prefersDark ? "dark" : "light";
    }
    return "light";
  });

  // App state
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);

  // Filter & Search states
  const [activeTab, setActiveTab] = useState<"store" | "admin">("store");
  const [storeCategory, setStoreCategory] = useState<"all" | "games" | "apps">("all");
  const [selectedSubCategory, setSelectedSubCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Admin Auth state
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [adminEmail, setAdminEmail] = useState("");

  // Initial load
  useEffect(() => {
    // Load catalog and session status
    loadCatalog();
    checkAdminSession();
  }, []);

  const loadCatalog = async () => {
    setLoading(true);
    try {
      const data = await fetchGames();
      setGames(data);
    } catch (err) {
      console.error("Error loading games:", err);
    } finally {
      setLoading(false);
    }
  };

  const checkAdminSession = async () => {
    try {
      const session = await verifyAdmin();
      setIsAdminAuthenticated(session.isAuthenticated);
      if (session.isAuthenticated && session.email) {
        setAdminEmail(session.email);
      }
    } catch (e) {
      console.error("Session verification failed", e);
    }
  };

  const toggleTheme = () => {
    const nextTheme = theme === "light" ? "dark" : "light";
    setTheme(nextTheme);
    localStorage.setItem("playstore_theme", nextTheme);
    document.documentElement.classList.toggle("dark", nextTheme === "dark");
  };

  const handleAdminLoginSuccess = (email: string) => {
    setIsAdminAuthenticated(true);
    setAdminEmail(email);
    // Reload games list once authenticated in case admin changes need updates
    loadCatalog();
  };

  const handleAdminLogout = async () => {
    await logoutAdmin();
    setIsAdminAuthenticated(false);
    setAdminEmail("");
    setActiveTab("store");
    loadCatalog();
  };

  // Get unique subcategories based on chosen tab category
  const getSubCategories = () => {
    const relevantGames = storeCategory === "all"
      ? games
      : games.filter((g) => g.category === storeCategory);
    
    const subs = new Set<string>();
    relevantGames.forEach((g) => {
      if (g.sub_category) subs.add(g.sub_category);
    });
    return ["all", ...Array.from(subs)];
  };

  // Filter operations
  const getFilteredGames = () => {
    return games.filter((game) => {
      // 1. Search Query Filter
      const matchesSearch =
        game.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        game.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (game.sub_category && game.sub_category.toLowerCase().includes(searchQuery.toLowerCase()));

      if (!matchesSearch) return false;

      // 2. Main Category Filter
      if (storeCategory !== "all" && game.category !== storeCategory) return false;

      // 3. Sub-Category Filter
      if (selectedSubCategory !== "all" && game.sub_category !== selectedSubCategory) return false;

      return true;
    });
  };

  const filteredGames = getFilteredGames();

  // Categories based subsets for premium dashboard views (when not searching/filtering heavily)
  const lastAddedGames = filteredGames.slice().sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 6);
  const mostDownloadedGames = filteredGames.slice().sort((a, b) => (b.downloads_count || 0) - (a.downloads_count || 0)).slice(0, 6);

  const isBrowsingMode = searchQuery === "" && selectedSubCategory === "all";

  // Dynamic Featured Hero Game or static fallback
  const featuredGame = games.find((g) => (g.rating && parseFloat(g.rating as any) >= 4.5)) || games[0];

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100 flex flex-col transition-colors duration-300">
      
      {/* ----------------- GLOBAL STICKY HEADER ----------------- */}
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-gray-200/80 dark:border-slate-800/80 shadow-sm transition-colors duration-300 h-16 flex items-center shrink-0">
        <div className="max-w-7xl mx-auto px-4 md:px-8 w-full flex items-center justify-between gap-4">
          
          {/* Logo & Brand */}
          <div className="flex items-center gap-8">
            <div
              onClick={() => {
                setActiveTab("store");
                setStoreCategory("all");
                setSelectedSubCategory("all");
                setSearchQuery("");
              }}
              className="flex items-center gap-3 cursor-pointer select-none group"
            >
              {/* Professional Polish Logo Badge */}
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shrink-0 shadow-md shadow-blue-500/10 group-hover:scale-105 transition-transform duration-200">
                <div className="w-4 h-4 bg-white transform rotate-45"></div>
              </div>
              <div>
                <span className="text-lg font-black tracking-tight text-blue-600 dark:text-blue-400 font-sans flex items-center gap-1.5">
                  ArabStore
                </span>
              </div>
            </div>

            {/* Desktop main category navigation tabs */}
            <nav className="hidden lg:flex gap-6 text-sm font-semibold text-gray-500 dark:text-gray-400">
              <button
                onClick={() => {
                  setActiveTab("store");
                  setStoreCategory("games");
                  setSelectedSubCategory("all");
                }}
                className={`transition-colors py-2 border-b-2 hover:text-blue-600 ${
                  activeTab === "store" && storeCategory === "games"
                    ? "text-blue-600 border-blue-600 dark:text-blue-400 dark:border-blue-400"
                    : "border-transparent text-gray-500 hover:text-gray-900 dark:hover:text-white"
                }`}
              >
                الألعاب
              </button>
              <button
                onClick={() => {
                  setActiveTab("store");
                  setStoreCategory("apps");
                  setSelectedSubCategory("all");
                }}
                className={`transition-colors py-2 border-b-2 hover:text-blue-600 ${
                  activeTab === "store" && storeCategory === "apps"
                    ? "text-blue-600 border-blue-600 dark:text-blue-400 dark:border-blue-400"
                    : "border-transparent text-gray-500 hover:text-gray-900 dark:hover:text-white"
                }`}
              >
                التطبيقات
              </button>
              <button
                onClick={() => {
                  setActiveTab("store");
                  setStoreCategory("all");
                  setSelectedSubCategory("all");
                }}
                className={`transition-colors py-2 border-b-2 hover:text-blue-600 ${
                  activeTab === "store" && storeCategory === "all"
                    ? "text-blue-600 border-blue-600 dark:text-blue-400 dark:border-blue-400"
                    : "border-transparent text-gray-500 hover:text-gray-900 dark:hover:text-white"
                }`}
              >
                الكل
              </button>
            </nav>
          </div>

          {/* Central Google Play Search Bar */}
          {activeTab === "store" && (
            <div className="relative flex-1 max-w-xl mx-auto w-full group">
              <span className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-gray-400 dark:text-gray-500 group-focus-within:text-blue-500 transition-colors">
                <Search className="w-5 h-5" />
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setSelectedSubCategory("all");
                }}
                placeholder="ابحث عن ألعاب، برامج وتطبيقات..."
                className="w-full bg-gray-100 hover:bg-gray-200/50 focus:bg-white dark:bg-slate-800/80 dark:hover:bg-slate-800 dark:focus:bg-slate-900 border-none rounded-full py-2 pr-12 pl-10 text-sm text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:outline-none transition-all shadow-sm"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute inset-y-0 left-3 flex items-center text-xs font-bold text-slate-400 hover:text-slate-600 transition-colors"
                >
                  مسح
                </button>
              )}
            </div>
          )}

          {/* Desktop Right navigation / controls */}
          <div className="flex items-center gap-4">
            {/* Quick access tabs for Admin / Store */}
            <div className="hidden sm:flex items-center gap-1.5">
              <button
                onClick={() => setActiveTab(activeTab === "store" ? "admin" : "store")}
                className={`px-4 py-2 rounded-full text-xs font-bold transition-all border ${
                  activeTab === "admin"
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-white dark:bg-slate-800 text-gray-600 dark:text-gray-300 border-gray-200/80 dark:border-slate-800 hover:bg-gray-50"
                }`}
              >
                {activeTab === "admin" ? "العودة للمتجر" : "لوحة الإدارة"}
              </button>
            </div>

            {/* Dark mode toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition-colors"
              title="تغيير المظهر"
            >
              {theme === "light" ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
            </button>

            {/* Simulated user avatar matching template */}
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-600 border-2 border-white dark:border-slate-800 shadow-sm shrink-0 cursor-pointer" onClick={() => setActiveTab("admin")} title={isAdminAuthenticated ? `مسجل كمسؤول: ${adminEmail}` : "بوابة المسؤول"}></div>
          </div>

        </div>
      </header>

      {/* ----------------- MAIN VIEW BODY CONTAINER ----------------- */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 md:px-8 py-8">

        {/* ----------------- 1. STORE VIEW ----------------- */}
        {activeTab === "store" && (
          <div className="space-y-8 animate-fade-in">
            
            {/* Horizontal Categories selector on mobile (always visible for mobile comfort, but hidden when desktop sidebar displays) */}
            <div className="lg:hidden flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-100 dark:border-slate-800/80 pb-4">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setStoreCategory("all");
                    setSelectedSubCategory("all");
                  }}
                  className={`px-4 py-2 rounded-full text-xs font-black transition-all flex items-center gap-1.5 ${
                    storeCategory === "all"
                      ? "bg-blue-600 text-white shadow-md"
                      : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-gray-100 dark:border-slate-800"
                  }`}
                >
                  <LayoutGrid className="w-4 h-4" />
                  الكل
                </button>
                <button
                  onClick={() => {
                    setStoreCategory("games");
                    setSelectedSubCategory("all");
                  }}
                  className={`px-4 py-2 rounded-full text-xs font-black transition-all flex items-center gap-1.5 ${
                    storeCategory === "games"
                      ? "bg-blue-600 text-white shadow-md"
                      : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-gray-100 dark:border-slate-800"
                  }`}
                >
                  <Gamepad2 className="w-4 h-4" />
                  الألعاب
                </button>
                <button
                  onClick={() => {
                    setStoreCategory("apps");
                    setSelectedSubCategory("all");
                  }}
                  className={`px-4 py-2 rounded-full text-xs font-black transition-all flex items-center gap-1.5 ${
                    storeCategory === "apps"
                      ? "bg-blue-600 text-white shadow-md"
                      : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-gray-100 dark:border-slate-800"
                  }`}
                >
                  <AppWindow className="w-4 h-4" />
                  التطبيقات
                </button>
              </div>

              {/* Refresh catalog indicator */}
              <button
                onClick={loadCatalog}
                className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
              >
                {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                تحديث المعرض
              </button>
            </div>

            {/* Mobile Sub-categories scrollbar */}
            {getSubCategories().length > 1 && (
              <div className="lg:hidden flex items-center gap-2 overflow-x-auto py-1 no-scrollbar">
                {getSubCategories().map((sub) => (
                  <button
                    key={sub}
                    onClick={() => setSelectedSubCategory(sub)}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap shrink-0 ${
                      selectedSubCategory === sub
                        ? "bg-slate-800 dark:bg-slate-100 text-white dark:text-slate-900"
                        : "bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 hover:bg-slate-100 border border-gray-100 dark:border-slate-800"
                    }`}
                  >
                    {sub === "all" ? "جميع الأنواع" : sub}
                  </button>
                ))}
              </div>
            )}

            {/* SPLIT SIDEBAR & CONTENT LAYOUT */}
            <div className="flex flex-col lg:flex-row gap-8 items-start">
              
              {/* Desktop Sidebar */}
              <aside className="hidden lg:flex w-60 bg-white dark:bg-slate-900 border border-gray-200/80 dark:border-slate-800 p-6 flex-col gap-2 rounded-3xl shrink-0 sticky top-24 shadow-sm">
                <div className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2 pr-2">الاكتشاف</div>
                <button
                  onClick={() => {
                    setStoreCategory("all");
                    setSelectedSubCategory("all");
                  }}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-xl font-bold text-sm text-right w-full transition-all ${
                    storeCategory === "all" && selectedSubCategory === "all"
                      ? "bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400"
                      : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800/50"
                  }`}
                >
                  <span className="text-lg">🎮</span> الألعاب المميزة
                </button>
                <button
                  onClick={() => {
                    setStoreCategory("games");
                    setSelectedSubCategory("all");
                  }}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-xl font-bold text-sm text-right w-full transition-all ${
                    storeCategory === "games" && selectedSubCategory === "all"
                      ? "bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400"
                      : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800/50"
                  }`}
                >
                  <span className="text-lg">📈</span> الأكثر رواجاً
                </button>
                <button
                  onClick={() => {
                    setStoreCategory("apps");
                    setSelectedSubCategory("all");
                  }}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-xl font-bold text-sm text-right w-full transition-all ${
                    storeCategory === "apps" && selectedSubCategory === "all"
                      ? "bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400"
                      : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800/50"
                  }`}
                >
                  <span className="text-lg">🆕</span> أحدث الإصدارات
                </button>

                <div className="h-px bg-gray-100 dark:bg-slate-800 my-4"></div>
                <div className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2 pr-2">تصفح الفئات</div>
                
                <div className="flex flex-col gap-1 max-h-56 overflow-y-auto pr-1">
                  {getSubCategories().map((sub) => (
                    <button
                      key={sub}
                      onClick={() => setSelectedSubCategory(sub)}
                      className={`text-right px-4 py-2 text-xs font-bold rounded-xl transition-all ${
                        selectedSubCategory === sub
                          ? "bg-blue-50/80 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 font-extrabold"
                          : "text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-800/40"
                      }`}
                    >
                      {sub === "all" ? "جميع الفئات" : sub}
                    </button>
                  ))}
                </div>

                <div className="mt-8 pt-4 border-t border-gray-100 dark:border-slate-800">
                  <button
                    onClick={() => setActiveTab("admin")}
                    className="flex items-center gap-3 px-4 py-2.5 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800 rounded-xl font-medium border border-gray-100 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900 w-full text-right"
                  >
                    <span className="text-lg">⚙️</span> لوحة الإدارة
                  </button>
                </div>
              </aside>

              {/* Main Contents Grid panel */}
              <div className="flex-1 w-full space-y-8">
                
                {/* Featured Hero Section */}
                {isBrowsingMode && (
                  <section className="relative h-64 md:h-72 rounded-3xl overflow-hidden shrink-0 shadow-lg border border-gray-100 dark:border-slate-800">
                    <div className="absolute inset-0 bg-gradient-to-l from-slate-950/90 via-slate-950/50 to-transparent z-10"></div>
                    <div
                      className="absolute inset-0 bg-cover bg-center"
                      style={{
                        backgroundImage: `url('${
                          featuredGame
                            ? featuredGame.image_url
                            : "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&q=80&w=1000"
                        }')`
                      }}
                    ></div>
                    <div className="relative z-20 h-full flex flex-col justify-center px-8 md:px-12 text-white max-w-xl">
                      <span className="bg-blue-600 text-[10px] md:text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full w-fit mb-3">
                        {featuredGame && featuredGame.category === "apps" ? "تطبيق الأسبوع" : "لعبة الأسبوع"}
                      </span>
                      <h1 className="text-2xl md:text-4xl font-black mb-2 text-white leading-tight">
                        {featuredGame ? featuredGame.name : "أسطورة الفضاء: الهجوم الأخير"}
                      </h1>
                      <p className="text-gray-200 text-xs md:text-sm mb-6 leading-relaxed line-clamp-2">
                        {featuredGame ? featuredGame.description : "خض معارك ملحمية في أعماق المجرة. رسومات مذهلة وتجربة لعب غير مسبوقة الآن على جوالك."}
                      </p>
                      <div className="flex gap-4">
                        <button
                          onClick={() => {
                            if (featuredGame) {
                              setSelectedGame(featuredGame);
                            } else {
                              alert("يرجى إضافة ألعاب وتطبيقات من لوحة التحكم لتفعيل المتجر بالكامل!");
                            }
                          }}
                          className="bg-white text-black px-6 py-2.5 rounded-xl text-xs md:text-sm font-bold hover:bg-gray-100 transition-colors shadow-lg"
                        >
                          تثبيت الآن
                        </button>
                        <button
                          onClick={() => {
                            if (featuredGame) {
                              setSelectedGame(featuredGame);
                            }
                          }}
                          className="bg-white/20 backdrop-blur-md text-white px-6 py-2.5 rounded-xl text-xs md:text-sm font-bold hover:bg-white/30 transition-colors border border-white/30"
                        >
                          التفاصيل
                        </button>
                      </div>
                    </div>
                  </section>
                )}

                {/* Display list/grid logic */}
                {loading ? (
                  <div className="py-24 text-center space-y-3">
                    <Loader2 className="w-12 h-12 text-blue-500 animate-spin mx-auto" />
                    <p className="text-slate-500 dark:text-slate-400 font-medium">جاري تحميل التطبيقات والألعاب...</p>
                  </div>
                ) : filteredGames.length === 0 ? (
                  <div className="py-16 text-center bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800/80 rounded-3xl p-8 max-w-xl mx-auto space-y-4">
                    <p className="text-3xl">🔍</p>
                    <h3 className="text-lg font-black text-slate-800 dark:text-slate-100">لا توجد نتائج مطابقة لبحثك</h3>
                    <p className="text-sm text-slate-500 leading-normal">
                      يرجى التحقق من صياغة الكلمات، أو استخدام تصنيفات أخرى للعثور على ما تبحث عنه.
                    </p>
                    <button
                      onClick={() => {
                        setSearchQuery("");
                        setSelectedSubCategory("all");
                        setStoreCategory("all");
                      }}
                      className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl text-xs transition-colors"
                    >
                      إعادة تعيين البحث والفلترة
                    </button>
                  </div>
                ) : (
                  <LayoutGroup>
                    <div className="space-y-10">
                      {/* CASE 1: Standard browsing view */}
                      {isBrowsingMode ? (
                        <>
                          {/* Section 1: Last Added Games */}
                          {lastAddedGames.length > 0 && (
                            <div className="space-y-4">
                              <div className="flex items-center justify-between">
                                <h2 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
                                  <Clock className="w-5 h-5 text-blue-500" />
                                  أحدث الإضافات والتحديثات
                                </h2>
                                <span className="text-xs text-slate-400">مضاف حديثاً</span>
                              </div>

                              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-6">
                                {lastAddedGames.map((game) => (
                                  <GameCard
                                    key={game.id}
                                    game={game}
                                    onClick={() => setSelectedGame(game)}
                                  />
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Section 2: Most Downloaded games */}
                          {mostDownloadedGames.length > 0 && (
                            <div className="space-y-4">
                              <div className="flex items-center justify-between">
                                <h2 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
                                  <Flame className="w-5 h-5 text-amber-500 animate-pulse" />
                                  الأكثر تنزيلاً وشعبية
                                </h2>
                                <span className="text-xs text-slate-400">شائع وموصى به</span>
                              </div>

                              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-6">
                                {mostDownloadedGames.map((game) => (
                                  <GameCard
                                    key={game.id}
                                    game={game}
                                    onClick={() => setSelectedGame(game)}
                                  />
                                ))}
                              </div>
                            </div>
                          )}
                        </>
                      ) : (
                        /* CASE 2: Active searching or category pill filtering */
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <h2 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
                              <Sparkles className="w-5 h-5 text-blue-500" />
                              نتائج التصفية والبحث ({filteredGames.length} نتيجة)
                            </h2>
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-6">
                            {filteredGames.map((game) => (
                              <GameCard
                                key={game.id}
                                game={game}
                                onClick={() => setSelectedGame(game)}
                              />
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Custom Category Chips Section matching prompt */}
                      <section className="flex flex-col gap-4 pt-6 border-t border-gray-100 dark:border-slate-800/80">
                        <h2 className="text-lg font-bold text-gray-800 dark:text-white">تصفح حسب النوع</h2>
                        <div className="flex flex-wrap gap-3">
                          <button
                            onClick={() => {
                              setSelectedSubCategory("ألعاب أكشن");
                              setActiveTab("store");
                            }}
                            className="px-6 py-2 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-full text-xs font-semibold hover:border-blue-500 dark:hover:border-blue-400 hover:text-blue-600 dark:hover:text-blue-400 transition-all shadow-sm cursor-pointer"
                          >
                            ألعاب الأكشن والقتال
                          </button>
                          <button
                            onClick={() => {
                              setSelectedSubCategory("ألعاب ذكاء");
                              setActiveTab("store");
                            }}
                            className="px-6 py-2 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-full text-xs font-semibold hover:border-blue-500 dark:hover:border-blue-400 hover:text-blue-600 dark:hover:text-blue-400 transition-all shadow-sm cursor-pointer"
                          >
                            ألعاب الذكاء والألغاز
                          </button>
                          <button
                            onClick={() => {
                              setSelectedSubCategory("رياضة");
                              setActiveTab("store");
                            }}
                            className="px-6 py-2 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-full text-xs font-semibold hover:border-blue-500 dark:hover:border-blue-400 hover:text-blue-600 dark:hover:text-blue-400 transition-all shadow-sm cursor-pointer"
                          >
                            رياضة وسباق نيترو
                          </button>
                          <button
                            onClick={() => {
                              setSelectedSubCategory("أدوات");
                              setActiveTab("store");
                            }}
                            className="px-6 py-2 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-full text-xs font-semibold hover:border-blue-500 dark:hover:border-blue-400 hover:text-blue-600 dark:hover:text-blue-400 transition-all shadow-sm cursor-pointer"
                          >
                            أدوات وإنتاجية
                          </button>
                          <button
                            onClick={() => {
                              setSelectedSubCategory("ترفيه");
                              setActiveTab("store");
                            }}
                            className="px-6 py-2 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-full text-xs font-semibold hover:border-blue-500 dark:hover:border-blue-400 hover:text-blue-600 dark:hover:text-blue-400 transition-all shadow-sm cursor-pointer"
                          >
                            منصات ترفيه وتواصل
                          </button>
                        </div>
                      </section>

                    </div>
                  </LayoutGroup>
                )}

              </div>

            </div>
          </div>
        )}

        {/* ----------------- 2. ADMIN CONTROL VIEW ----------------- */}
        {activeTab === "admin" && (
          <div className="animate-fade-in max-w-6xl mx-auto w-full">
            {isAdminAuthenticated ? (
              <AdminPanel
                adminEmail={adminEmail}
                onLogout={handleAdminLogout}
                onGamesChanged={loadCatalog}
              />
            ) : (
              <div className="py-12">
                <AdminLogin onLoginSuccess={handleAdminLoginSuccess} />
              </div>
            )}
          </div>
        )}

      </main>

      {/* ----------------- POPUP GAME DETAILS MODAL ----------------- */}
      <GameDetails
        game={selectedGame}
        onClose={() => setSelectedGame(null)}
      />

      {/* ----------------- FOOTER SECTION ----------------- */}
      <footer className="bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800/80 py-8 text-center text-xs text-slate-400 dark:text-slate-500 mt-auto transition-colors">
        <div className="max-w-7xl mx-auto px-4 md:px-8 space-y-3">
          <p className="font-medium text-slate-500 dark:text-slate-400">
            متجر ArabStore متكامل لرفع ومشاركة تطبيقات وألعاب الأندرويد. جميع الحقوق محفوظة لمالكيها المعنيين.
          </p>
          <div className="flex justify-center gap-4 text-slate-400">
            <span className="hover:text-blue-500 cursor-pointer">شروط الاستخدام</span>
            <span>•</span>
            <span className="hover:text-blue-500 cursor-pointer">سياسة الخصوصية</span>
            <span>•</span>
            <span className="hover:text-blue-500 cursor-pointer" onClick={() => setActiveTab("admin")}>بوابة الإدارة العامة</span>
          </div>
          <p className="text-[10px] opacity-70">
            &copy; 2026 ArabStore (نسخة عربية معربة ومطورة بالكامل).
          </p>
        </div>
      </footer>
    </div>
  );
}
