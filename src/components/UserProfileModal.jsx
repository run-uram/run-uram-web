import React from 'react';
import { Award, Flame, Navigation, Clock, X, LogOut, MapPin } from 'lucide-react';
import { clearSession, getStoredUser } from '../services/authService.js';
import wsService from '../services/wsService.js';

export function UserProfileModal({ isOpen, onClose, profileData, onLogout }) {
  if (!isOpen) return null;

  const user = getStoredUser() || {};
  const data = profileData || {
    username: user.username || 'Атлет',
    email: user.login ? `${user.login}@uram.ru` : 'Атлет URAM',
    player_color_hex: '#f97316',
    team_tag: 'URAM',
    total_distance_meters: 0,
    total_duration_seconds: 0,
    total_runs: 0,
    total_uram_points: 0,
    current_held_hexagons: 0
  };

  const distanceKm = ((data.total_distance_meters || 0) / 1000).toFixed(2);
  const totalMinutes = Math.floor((data.total_duration_seconds || 0) / 60);
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  const timeFormatted = hours > 0 ? `${hours}ч ${mins}м` : `${mins} мин`;

  const handleLogout = () => {
    clearSession();
    wsService.disconnect();
    if (onLogout) onLogout();
    onClose();
  };

  const handleRefreshProfile = () => {
    wsService.requestUserProfile(0);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
      <div
        className="relative w-full max-w-lg bg-zinc-900 border border-zinc-700/70 rounded-3xl shadow-2xl overflow-hidden text-zinc-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Banner with Player Color Glow */}
        <div
          className="relative h-28 w-full p-5 flex items-end justify-between overflow-hidden"
          style={{
            background: `linear-gradient(135deg, ${data.player_color_hex || '#f97316'}44 0%, #18181b 100%)`
          }}
        >
          <div className="absolute top-3 right-3 flex items-center gap-2">
            <button
              onClick={onClose}
              className="p-1.5 rounded-full bg-zinc-900/60 hover:bg-zinc-800 text-zinc-300 hover:text-white transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Avatar and Main Info */}
          <div className="flex items-center gap-3.5 z-10 translate-y-3">
            <div
              className="w-16 h-16 rounded-2xl border-2 flex items-center justify-center shadow-xl text-white font-black text-2xl uppercase"
              style={{
                backgroundColor: data.player_color_hex || '#f97316',
                borderColor: '#27272a'
              }}
            >
              {data.username ? data.username[0] : 'R'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-bold text-white tracking-wide">{data.username}</h3>
                {data.team_tag && (
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider bg-orange-500/20 text-orange-400 border border-orange-500/40">
                    [{data.team_tag}]
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-400">{data.email || 'Верифицированный атлет'}</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="pt-8 px-6 pb-6 space-y-5">
          {/* Main Key Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {/* Distance */}
            <div className="p-3.5 rounded-2xl bg-zinc-950/70 border border-zinc-800/80 hover:border-zinc-700 transition">
              <div className="flex items-center gap-1.5 text-xs text-zinc-400 mb-1">
                <Navigation className="w-3.5 h-3.5 text-blue-400" />
                <span>Дистанция</span>
              </div>
              <div className="text-lg font-bold text-white">
                {distanceKm} <span className="text-xs font-normal text-zinc-400">км</span>
              </div>
            </div>

            {/* Total Duration */}
            <div className="p-3.5 rounded-2xl bg-zinc-950/70 border border-zinc-800/80 hover:border-zinc-700 transition">
              <div className="flex items-center gap-1.5 text-xs text-zinc-400 mb-1">
                <Clock className="w-3.5 h-3.5 text-emerald-400" />
                <span>Время бега</span>
              </div>
              <div className="text-lg font-bold text-white">{timeFormatted}</div>
            </div>

            {/* Total Runs */}
            <div className="p-3.5 rounded-2xl bg-zinc-950/70 border border-zinc-800/80 hover:border-zinc-700 transition">
              <div className="flex items-center gap-1.5 text-xs text-zinc-400 mb-1">
                <Flame className="w-3.5 h-3.5 text-orange-400" />
                <span>Забегов</span>
              </div>
              <div className="text-lg font-bold text-white">{data.total_runs || 0}</div>
            </div>

            {/* Held Hexagons */}
            <div className="p-3.5 rounded-2xl bg-zinc-950/70 border border-zinc-800/80 hover:border-zinc-700 transition">
              <div className="flex items-center gap-1.5 text-xs text-zinc-400 mb-1">
                <MapPin className="w-3.5 h-3.5 text-purple-400" />
                <span>Гексагонов</span>
              </div>
              <div className="text-lg font-bold text-purple-400">
                {data.current_held_hexagons || 0} <span className="text-xs font-normal text-zinc-400">сот</span>
              </div>
            </div>

            {/* Uram Points */}
            <div className="p-3.5 rounded-2xl bg-zinc-950/70 border border-zinc-800/80 hover:border-zinc-700 col-span-2 sm:col-span-2 transition">
              <div className="flex items-center gap-1.5 text-xs text-zinc-400 mb-1">
                <Award className="w-3.5 h-3.5 text-amber-400" />
                <span>Очки URAM Points</span>
              </div>
              <div className="text-xl font-extrabold text-amber-400">
                {data.total_uram_points || 0} <span className="text-xs font-normal text-zinc-400">pts</span>
              </div>
            </div>
          </div>

          {/* Connection and Proto Info */}
          <div className="p-4 rounded-2xl bg-zinc-950/40 border border-zinc-800 text-xs space-y-2">
            <div className="flex items-center justify-between text-zinc-400">
              <span>Связь с бэкендом:</span>
              <span className="font-mono text-zinc-300">WebSocket + Protobuf</span>
            </div>
            <div className="flex items-center justify-between text-zinc-400">
              <span>Цвет маркера на карте:</span>
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded-full border border-zinc-700" style={{ backgroundColor: data.player_color_hex || '#f97316' }} />
                <span className="font-mono text-zinc-300">{data.player_color_hex || '#f97316'}</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={handleRefreshProfile}
              className="flex-1 py-2.5 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-750 border border-zinc-700 text-zinc-200 text-xs font-medium transition"
            >
              🔄 Обновить данные
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-red-950/40 hover:bg-red-900/60 border border-red-800/60 text-red-300 text-xs font-medium transition"
            >
              <LogOut className="w-4 h-4" />
              <span>Выйти</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default UserProfileModal;
