import React, { useState } from 'react';
import { Lock, User, AlertCircle, CheckCircle2, ChevronRight, RefreshCw, Shield, MapPin, Zap } from 'lucide-react';
import { login } from '../services/authService.js';
import wsService from '../services/wsService.js';

export function LoginPage({ onLoginSuccess }) {
  const [loginInput, setLoginInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!loginInput.trim() || !passwordInput.trim()) {
      setError('Пожалуйста, введите логин и пароль');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const authData = await login(loginInput.trim(), passwordInput.trim());
      setSuccess(true);

      // Connect WS immediately with the received session
      setTimeout(() => {
        wsService.connect();
        if (onLoginSuccess) onLoginSuccess(authData);
      }, 500);
    } catch (err) {
      setError(err.message || 'Ошибка авторизации. Проверьте логин и пароль.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-screen bg-[#f0f4f8] flex items-center justify-center p-4 overflow-hidden select-none font-sans">

      {/* SVG Geometric Hexagonal Grid Pattern Background */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none opacity-45"
        xmlns="http://www.w3.org/2000/svg"
        width="100%"
        height="100%"
      >
        <defs>
          <pattern
            id="hex-grid-pattern"
            width="56"
            height="96.99"
            patternUnits="userSpaceOnUse"
            patternTransform="scale(1)"
          >
            <path
              d="M28 0 L56 16.16 L56 48.49 L28 64.65 L0 48.49 L0 16.16 Z M28 96.99 L56 80.83 L56 48.49 L28 64.65 L0 48.49 L0 80.83 Z"
              fill="none"
              stroke="#2563eb"
              strokeWidth="0.85"
              strokeOpacity="0.16"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#hex-grid-pattern)" />
      </svg>

      {/* Atmospheric Soft Light Blue & Orange Gradient Orbs */}
      <div className="absolute top-1/6 -left-20 w-[450px] h-[450px] bg-blue-400/20 rounded-full blur-3xl pointer-events-none animate-pulse" />
      <div className="absolute bottom-1/6 -right-20 w-[450px] h-[450px] bg-sky-400/25 rounded-full blur-3xl pointer-events-none animate-pulse delay-500" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-blue-600/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-10 left-1/3 w-80 h-80 bg-orange-400/10 rounded-full blur-3xl pointer-events-none" />

      {/* Center White Glassmorphic Auth Card */}
      <div className="relative z-10 w-full max-w-md bg-white/95 border border-slate-200/90 backdrop-blur-2xl rounded-3xl shadow-[0_20px_50px_rgba(15,23,42,0.08),0_0_0_1px_rgba(37,99,235,0.06)] p-8 text-slate-800 animate-in fade-in zoom-in-95 duration-300">

        {/* Brand Header with Zilant Dragon & Runner Silhouette */}
        <div className="text-center mb-7">
          <div className="relative inline-flex items-center justify-center mb-3.5">
            {/* Glowing Blue/Orange Aura */}
            <div className="absolute -inset-2 rounded-2xl bg-gradient-to-br from-blue-500 via-sky-400 to-orange-500 opacity-40 blur-md animate-pulse" />

            <div className="relative w-16 h-16 rounded-2xl bg-white border border-blue-100 p-2.5 shadow-xl flex items-center justify-center">
              <img
                src="/app_icon_stylized_run_svg.svg"
                alt="Run Uram"
                className="w-full h-full object-contain filter drop-shadow(0 2px 8px rgba(37,99,235,0.25))"
              />
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-blue-600 rounded-full border-2 border-white" />
            </div>
          </div>

          <div className="flex items-center justify-center gap-2 mb-1">
            <h1 className="text-2xl font-black tracking-tight text-slate-900 font-heading">
              RUN URAM
            </h1>
            <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-blue-50 text-blue-600 border border-blue-200">
              KAZAN
            </span>
          </div>

          <p className="text-xs text-slate-500 font-medium mt-1">
            Тактическая карта и аналитика контроля районов города
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs leading-relaxed animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-500" />
              <div>{error}</div>
            </div>
          )}

          {success && (
            <div className="flex items-center gap-2.5 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>Авторизация успешна! Вход в систему...</span>
            </div>
          )}

          {/* Login Field */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-blue-600" />
              Логин
            </label>
            <input
              type="text"
              value={loginInput}
              onChange={(e) => setLoginInput(e.target.value)}
              placeholder="Введите ваш логин"
              required
              autoFocus
              className="w-full px-4 py-3 rounded-xl bg-slate-50/70 border border-slate-300 text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 transition shadow-inner"
            />
          </div>

          {/* Password Field */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-blue-600" />
              Пароль
            </label>
            <input
              type="password"
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full px-4 py-3 rounded-xl bg-slate-50/70 border border-slate-300 text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 transition shadow-inner"
            />
          </div>

          {/* Primary Action Button (Blue / Cyan Cyber Gradient) */}
          <button
            type="submit"
            disabled={loading || success}
            className="w-full mt-6 flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 hover:from-blue-500 hover:to-indigo-600 active:scale-[0.99] text-white font-heading font-bold text-sm tracking-wide shadow-lg shadow-blue-600/30 disabled:opacity-50 transition cursor-pointer"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-white" />
                <span>Авторизация...</span>
              </>
            ) : (
              <>
                <span>Войти</span>
                <ChevronRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Tactical Light Footer */}
        <div className="mt-7 pt-4 border-t border-slate-200/80 flex items-center justify-between text-[11px] text-slate-500 font-mono">
          <span>
            v0.0.1
          </span>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;


