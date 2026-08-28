import React from 'react';
import { Award, Flame, Navigation, Clock, X, LogOut, MapPin, Shield, Users } from 'lucide-react';
import { clearSession, getStoredUser } from '../services/authService.js';
import wsService from '../services/wsService.js';

export function UserProfileModal({ isOpen, onClose, profileData, onLogout }) {
  if (!isOpen) return null;

  const user = getStoredUser() || {};
  const data = profileData || {
    username: user.username || 'smayflks',
    email: user.login ? `${user.login}@uram.ru` : 'runner@runuram.kzn',
    player_color_hex: '#2563eb',
    avatar_url: '/app_icon_stylized_run_svg.svg',
    team_name: 'Zilant Cyber-Runners',
    team_tag: 'ZLT',
    team_color_hex: '#fe4a09',
    team_avatar_url: '',
    total_distance_meters: 184600,
    total_duration_seconds: 54200,
    total_runs: 16,
    total_uram_points: 3380,
    current_held_hexagons: 42
  };

  const distanceKm = ((data.total_distance_meters || 184600) / 1000).toFixed(2);
  const totalMinutes = Math.floor((data.total_duration_seconds || 54200) / 60);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in select-none">
      <div
        className="relative w-full max-w-lg bg-white/95 border border-slate-200/90 rounded-3xl shadow-[0_25px_60px_rgba(15,23,42,0.14)] overflow-hidden text-slate-800"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Banner with Team & Player Gradient */}
        <div
          className="relative h-32 w-full p-5 flex items-end justify-between overflow-hidden"
          style={{
            background: `linear-gradient(135deg, ${data.team_color_hex || '#fe4a09'} 0%, #2563eb 100%)`
          }}
        >
          <div className="absolute top-3 left-4 flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-white p-0.5 flex items-center justify-center shadow">
              <img src="/app_icon_stylized_run_svg.svg" alt="RunUram" className="w-full h-full object-contain" />
            </div>
            <span className="text-[11px] font-heading font-black tracking-tight text-white">RUN URAM KAZAN</span>
          </div>

          <div className="absolute top-3 right-3 flex items-center gap-2">
            <button
              onClick={onClose}
              className="p-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Avatar and Main Info */}
          <div className="flex items-center gap-3.5 z-10 translate-y-4">
            <div className="relative">
              {data.avatar_url ? (
                <img 
                  src={data.avatar_url} 
                  alt={data.username}
                  className="w-16 h-16 rounded-2xl border-2 border-white shadow-xl object-cover bg-white p-1"
                />
              ) : (
                <div
                  className="w-16 h-16 rounded-2xl border-2 border-white flex items-center justify-center shadow-xl text-white font-black text-2xl uppercase"
                  style={{ backgroundColor: data.player_color_hex || '#2563eb' }}
                >
                  {data.username ? data.username[0] : 'R'}
                </div>
              )}
              <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white shadow" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-black text-white tracking-tight">{data.username || 'Атлет'}</h3>
                {(data.team_tag || data.team_name) && (
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider bg-white/25 text-white backdrop-blur-md border border-white/30">
                    [{data.team_tag || 'ZLT'}]
                  </span>
                )}
              </div>
              <p className="text-xs text-white/90 font-medium">
                {data.team_name || 'Zilant Cyber-Runners'}
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="pt-8 px-6 pb-6 space-y-5">
          {/* Main Key Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {/* Distance */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
              <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
                <Navigation className="w-3.5 h-3.5 text-blue-600" />
                <span>Дистанция</span>
              </div>
              <div className="text-lg font-black text-slate-900 font-mono">
                {distanceKm} <span className="text-xs font-normal text-slate-500">км</span>
              </div>
            </div>

            {/* Total Duration */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
              <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
                <Clock className="w-3.5 h-3.5 text-indigo-600" />
                <span>Время бега</span>
              </div>
              <div className="text-lg font-bold text-slate-900 font-mono">{timeFormatted}</div>
            </div>

            {/* Total Runs */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
              <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
                <Flame className="w-3.5 h-3.5 text-orange-500" />
                <span>Забегов</span>
              </div>
              <div className="text-lg font-bold text-slate-900 font-mono">{data.total_runs || 16}</div>
            </div>

            {/* Held Hexagons */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
              <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
                <MapPin className="w-3.5 h-3.5 text-blue-600" />
                <span>Гексагонов</span>
              </div>
              <div className="text-lg font-bold text-blue-600 font-mono">
                {data.current_held_hexagons || 42} <span className="text-xs font-normal text-slate-500">сот</span>
              </div>
            </div>

            {/* Uram Points */}
            <div className="p-3.5 rounded-2xl bg-orange-50/70 border border-orange-200 col-span-2 sm:col-span-2">
              <div className="flex items-center gap-1.5 text-xs text-orange-700 mb-1 font-semibold">
                <Award className="w-3.5 h-3.5 text-orange-600" />
                <span>Очки URAM Points</span>
              </div>
              <div className="text-xl font-black text-orange-600 font-mono">
                {data.total_uram_points || 3380} <span className="text-xs font-normal text-orange-500">pts</span>
              </div>
            </div>
          </div>

          {/* Connection & Team Info Card */}
          <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200 text-xs space-y-2.5">
            <div className="flex items-center justify-between text-slate-600">
              <span>Команда атлета:</span>
              <div className="flex items-center gap-1.5 font-bold text-slate-900">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: data.team_color_hex || '#fe4a09' }} />
                <span>{data.team_name || 'Zilant Cyber-Runners'}</span>
              </div>
            </div>
            <div className="flex items-center justify-between text-slate-600">
              <span>Протокол связи:</span>
              <span className="font-mono text-blue-600 font-semibold">WebSocket + Protobuf (history.proto)</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={handleRefreshProfile}
              className="flex-1 py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer"
            >
              🔄 Обновить профиль
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 text-xs font-bold transition cursor-pointer"
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
