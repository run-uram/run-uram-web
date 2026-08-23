import React, { useState } from 'react';
import { LogIn, Lock, User, Server, AlertCircle, CheckCircle2, X, RefreshCw } from 'lucide-react';
import { login, getApiBaseUrl, getWsBaseUrl, setCustomUrls } from '../services/authService.js';
import wsService from '../services/wsService.js';

export function AuthModal({ isOpen, onClose, onAuthSuccess }) {
  const [loginInput, setLoginInput] = useState('runner_kazan');
  const [passwordInput, setPasswordInput] = useState('password123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const [showConfig, setShowConfig] = useState(false);
  const [apiUrl, setApiUrl] = useState(getApiBaseUrl());
  const [wsUrl, setWsUrl] = useState(getWsBaseUrl());

  if (!isOpen) return null;

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
        if (onAuthSuccess) onAuthSuccess(authData);
        onClose();
      }, 500);
    } catch (err) {
      setError(err.message || 'Не удалось подключиться к серверу. Проверьте адрес бэкенда.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = (username, pass) => {
    setLoginInput(username);
    setPasswordInput(pass);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
      <div 
        className="relative w-full max-w-md bg-zinc-900 border border-zinc-700/60 rounded-2xl shadow-2xl overflow-hidden text-zinc-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-zinc-800 bg-zinc-900/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500/20 border border-orange-500/40 flex items-center justify-center text-orange-400">
              <LogIn className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-wide">Вход в Running Cup</h2>
              <p className="text-xs text-zinc-400">Авторизация бегуна и подключение к WS</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-red-950/50 border border-red-800/60 text-red-300 text-xs leading-relaxed">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
              <div>{error}</div>
            </div>
          )}

          {success && (
            <div className="flex items-center gap-2.5 p-3.5 rounded-xl bg-emerald-950/50 border border-emerald-800/60 text-emerald-300 text-xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Авторизация успешна! Подключение к WebSocket...</span>
            </div>
          )}

          {/* Login input */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-orange-400" />
              Логин бегуна
            </label>
            <input
              type="text"
              value={loginInput}
              onChange={(e) => setLoginInput(e.target.value)}
              placeholder="runner_login"
              required
              className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-700/70 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition"
            />
          </div>

          {/* Password input */}
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
              className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-700/70 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition"
            />
          </div>

          {/* Quick presets */}
          <div className="pt-1">
            <div className="text-[11px] text-zinc-400 mb-1.5">Быстрый выбор для тестов:</div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => handleDemoLogin('timur_kzn', 'secret123')}
                className="px-2.5 py-1 text-[11px] rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 transition"
              >
                🏃 timur_kzn
              </button>
              <button
                type="button"
                onClick={() => handleDemoLogin('alsu_run', 'secret123')}
                className="px-2.5 py-1 text-[11px] rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 transition"
              >
                ⚡ alsu_run
              </button>
              <button
                type="button"
                onClick={() => handleDemoLogin('artur_ural', 'secret123')}
                className="px-2.5 py-1 text-[11px] rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 transition"
              >
                🐺 artur_ural
              </button>
            </div>
          </div>

          {/* Server Config Accordion */}
          <div className="pt-2 border-t border-zinc-800">
            <button
              type="button"
              onClick={() => setShowConfig(!showConfig)}
              className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-200 transition"
            >
              <Server className="w-3.5 h-3.5 text-zinc-400" />
              <span>{showConfig ? 'Скрыть настройки сервера' : 'Настроить адреса бэкенда (API / WS)'}</span>
            </button>

            {showConfig && (
              <div className="mt-3 p-3 rounded-xl bg-zinc-950 border border-zinc-800 space-y-3 animate-in fade-in">
                <div>
                  <label className="text-[11px] text-zinc-400 block mb-1">HTTP API URL</label>
                  <input
                    type="text"
                    value={apiUrl}
                    onChange={(e) => setApiUrl(e.target.value)}
                    placeholder="http://localhost:8080"
                    className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-zinc-700 text-xs text-zinc-200 focus:outline-none focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-zinc-400 block mb-1">WebSocket URL</label>
                  <input
                    type="text"
                    value={wsUrl}
                    onChange={(e) => setWsUrl(e.target.value)}
                    placeholder="ws://localhost:8080/ws"
                    className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-zinc-700 text-xs text-zinc-200 focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || success}
            className="w-full mt-4 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 active:scale-[0.98] text-white font-medium text-sm shadow-lg shadow-orange-500/20 disabled:opacity-50 transition"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Авторизация...</span>
              </>
            ) : (
              <>
                <LogIn className="w-4 h-4" />
                <span>Войти и подключиться к WS</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

export default AuthModal;
