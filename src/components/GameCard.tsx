/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { Star, Download } from "lucide-react";
import { Game } from "../types";
import { motion } from "motion/react";

interface GameCardProps {
  key?: string | number;
  game: Game;
  onClick: () => void;
}

export default function GameCard({ game, onClick }: GameCardProps) {
  // Format download numbers to Arabic-friendly text
  const formatDownloads = (num?: number) => {
    if (!num) return "";
    if (num >= 1000000000) return `+${(num / 1000000000).toFixed(0)} مليار`;
    if (num >= 1000000) return `+${(num / 1000000).toFixed(0)} مليون`;
    if (num >= 1000) return `+${(num / 1000).toFixed(0)} ألف`;
    return `+${num}`;
  };

  return (
    <motion.div
      id={`game-card-${game.id}`}
      layoutId={`card-container-${game.id}`}
      onClick={onClick}
      className="group relative cursor-pointer flex flex-col justify-between bg-white dark:bg-slate-800/90 rounded-2xl p-4 shadow-sm hover:shadow-xl border border-slate-100 dark:border-slate-700/50 transition-all duration-300"
      whileHover={{ y: -6 }}
    >
      <div className="flex flex-col gap-3">
        {/* Aspect square rounded image */}
        <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-blue-50 dark:bg-blue-950/20 border border-slate-100/80 dark:border-slate-700/40">
          <img
            src={game.image_url}
            alt={game.name}
            loading="lazy"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          />
          {game.sub_category && (
            <span className="absolute top-2 right-2 px-2.5 py-1 text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-50/95 dark:bg-blue-950/90 rounded-full shadow-sm">
              {game.sub_category}
            </span>
          )}
        </div>

        {/* Content details */}
        <div className="mt-1">
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 line-clamp-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-200">
            {game.name}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex items-center justify-between">
            <span>الإصدار {game.version}</span>
            <span className="font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded text-[10px]">
              {game.size}
            </span>
          </p>
        </div>
      </div>

      {/* Footer statistics (Google Play style) */}
      <div className="mt-4 pt-3 border-t border-slate-50 dark:border-slate-700/40 flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
        <div className="flex items-center gap-1">
          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
          <span className="font-bold text-slate-700 dark:text-slate-300">
            {game.rating || "4.5"}
          </span>
        </div>
        {game.downloads_count && (
          <div className="flex items-center gap-1">
            <Download className="w-3.5 h-3.5 text-blue-500" />
            <span>{formatDownloads(game.downloads_count)} تحميل</span>
          </div>
        )}
      </div>
    </motion.div>
  );
}
