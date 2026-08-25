import React, { useState } from 'react';
import { LogIn, Lock, User, Server, AlertCircle, CheckCircle2, Zap, ChevronRight, RefreshCw } from 'lucide-react';
import { login, getApiBaseUrl, getWsBaseUrl, setCustomUrls } from '../services/authService.js';
import wsService from '../services/wsService.js';

export function LoginPage({ onLoginSuccess }) {
  const [loginInput, setLoginInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const [showConfig, setShowConfig] = useState(false);
  const [apiUrl, setApiUrl] = useState(getApiBaseUrl());
  const [wsUrl, setWsUrl] = useState(getWsBaseUrl());

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!loginInput.trim() || !passwordInput.trim()) {
      setError('Пожалуйста, введите логин и пароль');
      return;
    }

    setLoading(true);
    setError(null);

    // Save custom URLs if modified
    setCustomUrls(apiUrl, wsUrl);

    try {
      const authData = await login(loginInput.trim(), passwordInput.trim());
      setSuccess(true);

      // Connect WS immediately with the received ticket
      setTimeout(() => {
        wsService.connect();
        if (onLoginSuccess) onLoginSuccess(authData);
      }, 500);
    } catch (err) {
      setError(err.message || 'Ошибка авторизации. Проверьте данные и доступность сервера.');
    } finally {
      setLoading(false);
    }
  };

  const handlePreset = (username, pass) => {
    setLoginInput(username);
    setPasswordInput(pass);
  };

  return (
    <div className="relative min-h-screen w-screen bg-zinc-950 flex items-center justify-center p-4 overflow-hidden select-none font-sans">
      {/* Dynamic Background Glowing Blobs */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-orange-600/20 rounded-full blur-3xl pointer-events-none animate-pulse"></div>
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-amber-500/15 rounded-full blur-3xl pointer-events-none animate-pulse delay-700"></div>

      {/* Grid Pattern Background */}
      <div 
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, #ffffff 1px, transparent 0)`,
          backgroundSize: '32px 32px'
        }}
      />

      {/* Center Auth Card */}
      <div className="relative z-10 w-full max-w-md bg-zinc-900/90 border border-zinc-800/90 backdrop-blur-xl rounded-3xl shadow-2xl p-8 text-zinc-100 animate-in fade-in zoom-in-95 duration-300">
        
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-orange-500 to-amber-400 text-zinc-950 shadow-lg shadow-orange-500/25 mb-3.5">
            <Zap className="w-7 h-7 fill-zinc-950" />
          </div>
          <div className="flex items-center justify-center gap-2 mb-1">
            <h1 className="text-2xl font-black tracking-tight text-white font-heading">
              RUN URAM
            </h1>
            <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-orange-500/20 text-orange-400 border border-orange-500/30">
              URAM KZN
            </span>
          </div>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-red-950/60 border border-red-800/80 text-red-300 text-xs leading-relaxed animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
              <div>{error}</div>
            </div>
          )}

          {success && (
            <div className="flex items-center gap-2.5 p-3.5 rounded-xl bg-emerald-950/60 border border-emerald-800/80 text-emerald-300 text-xs animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Вход успешен! Запуск карты и WebSocket...</span>
            </div>
          )}

          {/* Login Field */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-orange-400" />
              Логин
            </label>
            <input
              type="text"
              value={loginInput}
              onChange={(e) => setLoginInput(e.target.value)}
              placeholder="Введите ваш логин"
              required
              autoFocus
              className="w-full px-4 py-3 rounded-xl bg-zinc-950 border border-zinc-800 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition"
            />
          </div>

          {/* Password Field */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-orange-400" />
              Пароль
            </label>
            <input
              type="password"
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full px-4 py-3 rounded-xl bg-zinc-950 border border-zinc-800 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition"
            />
          </div>

          {/* Server Settings Accordion */}
          <div className="pt-2 border-t border-zinc-800/80">
            <button
              type="button"
              onClick={() => setShowConfig(!showConfig)}
              className="flex items-center justify-between w-full text-[11px] text-zinc-400 hover:text-zinc-200 transition py-1"
            >
              <span className="flex items-center gap-1.5">
                <Server className="w-3.5 h-3.5 text-zinc-500" />
                <span>Настройки сервера бэкенда</span>
              </span>
              <span className="text-[10px] text-zinc-500 font-mono">
                {showConfig ? '▲ Скрыть' : '▼ Настроить'}
              </span>
            </button>

            {showConfig && (
              <div className="mt-2.5 p-3 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2.5 animate-in fade-in">
                <div>
                  <label className="text-[10px] text-zinc-400 block mb-1">
                    HTTP API URL (оставьте пустым для встроенного Proxy):
                  </label>
                  <input
                    type="text"
                    value={apiUrl}
                    onChange={(e) => setApiUrl(e.target.value)}
                    placeholder="http://localhost:8081"
                    className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-zinc-700/80 text-xs text-zinc-200 font-mono focus:outline-none focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-zinc-400 block mb-1">
                    WebSocket URL:
                  </label>
                  <input
                    type="text"
                    value={wsUrl}
                    onChange={(e) => setWsUrl(e.target.value)}
                    placeholder="ws://localhost:8081/ws"
                    className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-zinc-700/80 text-xs text-zinc-200 font-mono focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || success}
            className="w-full mt-4 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 active:scale-[0.98] text-zinc-950 font-bold text-sm shadow-lg shadow-orange-500/25 disabled:opacity-50 transition cursor-pointer"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-zinc-950" />
                <span>Авторизация...</span>
              </>
            ) : (
              <>
                <span>Войти в систему</span>
                <ChevronRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Footer Info */}
        <div className="mt-6 pt-4 border-t border-zinc-800/80 text-center text-[11px] text-zinc-500 flex items-center justify-center gap-2">
          <span>Created by ... </span>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
