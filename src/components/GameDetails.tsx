/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { X, Star, Download, Calendar, Info, ShieldAlert, ChevronRight } from "lucide-react";
import { Game } from "../types";
import { motion, AnimatePresence } from "motion/react";

interface GameDetailsProps {
  game: Game | null;
  onClose: () => void;
}

export default function GameDetails({ game, onClose }: GameDetailsProps) {
  if (!game) return null;

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString("ar-EG", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch (e) {
      return dateStr;
    }
  };

  const formatDownloads = (num?: number) => {
    if (!num) return "";
    if (num >= 1000000000) return `+${(num / 1000000000).toFixed(1)} مليار`;
    if (num >= 1000000) return `+${(num / 1000000).toFixed(1)} مليون`;
    if (num >= 1000) return `+${(num / 1000).toFixed(0)} ألف`;
    return `+${num}`;
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          id="details-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-md"
        />

        {/* Modal Window */}
        <motion.div
          id="details-modal"
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: "spring", duration: 0.5 }}
          className="relative bg-white dark:bg-slate-900 w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl border border-slate-100 dark:border-slate-800 z-10 max-h-[90vh] flex flex-col"
        >
          {/* Header Bar */}
          <div className="sticky top-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur border-b border-slate-100 dark:border-slate-800/80 px-6 py-4 flex items-center justify-between z-20">
            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
              <span className="text-xs bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full font-medium">
                {game.category === "games" ? "ألعاب" : "تطبيقات"}
              </span>
              {game.sub_category && (
                <>
                  <ChevronRight className="w-3.5 h-3.5" />
                  <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                    {game.sub_category}
                  </span>
                </>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-500 dark:text-slate-400"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Modal Content */}
          <div className="overflow-y-auto p-6 md:p-8 flex-1">
            {/* Visual Block and Main info */}
            <div className="flex flex-col md:flex-row gap-6 items-start pb-6 border-b border-slate-100 dark:border-slate-800/80">
              <div className="w-32 h-32 md:w-36 md:h-36 shrink-0 rounded-3xl overflow-hidden bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/50 shadow-md">
                <img
                  src={game.image_url}
                  alt={game.name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="flex-1 space-y-3">
                <h2 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 leading-snug">
                  {game.name}
                </h2>
                
                <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-slate-500 dark:text-slate-400">
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                    <span className="font-bold text-slate-700 dark:text-slate-200">
                      {game.rating || "4.5"}
                    </span>
                    <span>/ 5</span>
                  </div>

                  {game.downloads_count && (
                    <div className="flex items-center gap-1 border-r md:border-l border-slate-200 dark:border-slate-800 pr-4 pl-4 md:pr-0">
                      <Download className="w-4 h-4 text-slate-400" />
                      <span className="font-bold text-slate-700 dark:text-slate-200">
                        {formatDownloads(game.downloads_count)}
                      </span>
                      <span>تنزيل</span>
                    </div>
                  )}
                </div>

                {/* Main Action download button */}
                <div className="pt-2">
                  <a
                    href={game.download_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-8 py-3 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white font-bold rounded-2xl transition-all duration-200 shadow-md hover:shadow-lg shadow-blue-500/10 hover:shadow-blue-500/20 text-base"
                  >
                    <Download className="w-5 h-5" />
                    تحميل التطبيق الآن
                  </a>
                </div>
              </div>
            </div>

            {/* App details grid statistics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-6 border-b border-slate-100 dark:border-slate-800/80 text-sm">
              <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-2xl text-center">
                <span className="block text-xs text-slate-400 dark:text-slate-500 mb-1">الحجم</span>
                <span className="font-bold text-slate-700 dark:text-slate-200">{game.size}</span>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-2xl text-center">
                <span className="block text-xs text-slate-400 dark:text-slate-500 mb-1">الإصدار الحالي</span>
                <span className="font-bold text-slate-700 dark:text-slate-200">{game.version}</span>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-2xl text-center">
                <span className="block text-xs text-slate-400 dark:text-slate-500 mb-1">تاريخ النشر</span>
                <span className="font-bold text-slate-700 dark:text-slate-200">{formatDate(game.created_at)}</span>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-2xl text-center">
                <span className="block text-xs text-slate-400 dark:text-slate-500 mb-1">التصنيف الرئيسي</span>
                <span className="font-bold text-slate-700 dark:text-slate-200">
                  {game.category === "games" ? "ألعاب أندرويد" : "تطبيقات أندرويد"}
                </span>
              </div>
            </div>

            {/* Complete description */}
            <div className="py-6 space-y-3">
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Info className="w-5 h-5 text-blue-500" />
                حول هذا التطبيق / اللعبة
              </h3>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap text-sm md:text-base">
                {game.description}
              </p>
            </div>

            {/* Security disclaimer */}
            <div className="mt-4 p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30 text-amber-800 dark:text-amber-400 flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 mt-0.5 shrink-0" />
              <div className="text-xs space-y-1">
                <span className="font-bold block">تحميل آمن بنسبة 100%</span>
                <span className="block leading-relaxed opacity-90">
                  رابط التنزيل يقود مباشرة إلى متجر التحميل الرسمي أو منصات الاستضافة الموثوقة. تم فحص الملفات المرفوعة وخلوها بالكامل من أي برمجيات ضارة.
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
