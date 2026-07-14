/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { KeyRound, Mail, AlertCircle, Loader2, ShieldCheck, Eye, EyeOff } from "lucide-react";
import { loginAdmin, fetchConfigStatus } from "../api";
import { ConfigStatus } from "../types";

interface AdminLoginProps {
  onLoginSuccess: (email: string) => void;
}

export default function AdminLogin({ onLoginSuccess }: AdminLoginProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [config, setConfig] = useState<ConfigStatus | null>(null);

  useEffect(() => {
    fetchConfigStatus()
      .then(setConfig)
      .catch((err) => console.error("Could not fetch config status", err));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const data = await loginAdmin(email, password);
      onLoginSuccess(data.email);
    } catch (err: any) {
      setError(err.message || "فشل تسجيل الدخول. يرجى التحقق من بيانات الاعتماد.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="admin-login-container" className="max-w-md w-full mx-auto bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-800 overflow-hidden">
      {/* Visual Header Banner */}
      <div className="bg-gradient-to-br from-blue-600 to-indigo-700 dark:from-blue-700 dark:to-indigo-900 p-8 text-center text-white relative">
        <div className="absolute top-4 right-4 bg-white/10 backdrop-blur-md px-3 py-1 rounded-full text-xs flex items-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>منطقة الإدارة الآمنة</span>
        </div>
        <div className="mx-auto w-16 h-16 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center mb-4">
          <KeyRound className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-extrabold tracking-tight">تسجيل دخول الإدارة</h2>
        <p className="text-blue-100 text-sm mt-1">يرجى تسجيل الدخول للوصول إلى لوحة التحكم وإضافة الألعاب</p>
      </div>

      <div className="p-8">
        {error && (
          <div className="mb-6 p-4 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/40 rounded-2xl text-rose-800 dark:text-rose-400 text-sm flex items-start gap-2">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email field */}
          <div className="space-y-1.5">
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">البريد الإلكتروني</label>
            <div className="relative">
              <span className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400">
                <Mail className="w-5 h-5" />
              </span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@playstore.com"
                className="w-full pl-4 pr-11 py-3 text-slate-800 dark:text-slate-100 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:focus:ring-blue-400/20 transition-all text-sm"
              />
            </div>
          </div>

          {/* Password field */}
          <div className="space-y-1.5">
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">كلمة المرور</label>
            <div className="relative">
              <span className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400">
                <KeyRound className="w-5 h-5" />
              </span>
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-12 pr-11 py-3 text-slate-800 dark:text-slate-100 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:focus:ring-blue-400/20 transition-all text-sm"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white font-bold rounded-2xl shadow-md hover:shadow-lg hover:shadow-blue-500/10 transition-all flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                جاري تسجيل الدخول...
              </>
            ) : (
              "تسجيل الدخول"
            )}
          </button>
        </form>

        {/* Credentials hints (Extremely helpful for local developers/users) */}
        {config && config.localModeActive && (
          <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800/80 space-y-3">
            <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/30 px-3 py-1 rounded-full">
              💡 تلميح التشغيل التجريبي والمحاكاة:
            </span>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              الموقع يعمل الآن في <strong>وضع المحاكاة المحلي الآمن</strong>. يمكنك تسجيل الدخول باستخدام الحساب الافتراضي أدناه لإضافة وتجربة الألعاب:
            </p>
            <div className="bg-slate-50 dark:bg-slate-800/40 p-3.5 rounded-2xl text-xs space-y-1 font-mono text-slate-600 dark:text-slate-300">
              <div className="flex justify-between">
                <span>البريد:</span>
                <span className="font-bold text-slate-800 dark:text-slate-100">{config.adminEmail}</span>
              </div>
              <div className="flex justify-between">
                <span>الرمز:</span>
                <span className="font-bold text-slate-800 dark:text-slate-100">admin_password_123</span>
              </div>
            </div>
            <p className="text-[10px] text-slate-400 leading-normal">
              * بمجرد إعداد مفاتيح Supabase و Cloudinary في لوحة الإعدادات، سيتحول النظام تلقائياً للعمل الفعلي الآمن.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
