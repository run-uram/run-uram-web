import React from 'react';
import { LogOut, WifiOff, MapPin, Zap, Shield, Trophy } from 'lucide-react';
import { KAZAN_LANDMARKS } from '../services/mockData.js';

export function Header({
  selectedLandmark,
  onSelectLandmark,
  onOpenProfile,
  onLogout,
  userProfile,
  wsStatus,
  wsLatency,
  stats,
  currentView
}) {
  const getWsBadge = () => {
    switch (wsStatus) {
      case 'connected':
        return (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-mono shadow-xs" title="WebSocket + Protobuf подключен (Heartbeat 20s)">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="font-bold">LIVE TELEMETRY</span>
            {wsLatency !== null && wsLatency !== undefined && (
              <span className="text-[10px] text-emerald-600 font-bold bg-emerald-100/80 px-1 py-0.2 rounded">
                {wsLatency}ms
              </span>
            )}
          </div>
        );
      case 'connecting':
        return (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 text-[11px] font-mono shadow-xs" title="Подключение к WebSocket...">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>
            <span className="font-bold">SYNCING...</span>
          </div>
        );
      default:
        return (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-100 border border-slate-200 text-slate-500 text-[11px] font-mono" title="WebSocket отключен">
            <WifiOff className="w-3 h-3 text-slate-400" />
            <span>OFFLINE</span>
          </div>
        );
    }
  };

  return (
    <header className="px-4 py-2.5 border-b border-slate-200/90 bg-white/95 backdrop-blur-xl flex items-center justify-between gap-4 z-20 shadow-xs select-none">
      {/* Left Area: View Title & Quick Landmarks (if on Map view) */}
      <div className="flex items-center gap-3">
        {currentView === 'map' && (
          <div className="hidden lg:flex items-center gap-1.5">
            <span className="text-[11px] font-mono font-bold text-slate-500 flex items-center gap-1 mr-1">
              <MapPin size={12} className="text-blue-600" /> Сектор:
            </span>
            {KAZAN_LANDMARKS.slice(0, 4).map((landmark) => (
              <button
                key={landmark.id}
                onClick={() => onSelectLandmark(landmark)}
                className={`px-3 py-1 text-xs rounded-xl font-bold transition-all cursor-pointer ${
                  selectedLandmark?.id === landmark.id
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                {landmark.name}
              </button>
            ))}
          </div>
        )}

        {currentView === 'analytics' && (
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-blue-600 font-bold px-2.5 py-0.5 rounded-full bg-blue-50 border border-blue-200">
              KAZAN TACTICAL GRID
            </span>
            <span className="text-xs text-slate-500 font-medium hidden sm:inline">Личные показатели и телеметрия атлета</span>
          </div>
        )}
      </div>

      {/* Right Area: Telemetry Status, Profile & Controls */}
      <div className="flex items-center gap-2.5">
        {getWsBadge()}

        {/* Runner Profile Button */}
        <button
          onClick={onOpenProfile}
          className="flex items-center gap-2.5 pl-1.5 pr-3 py-1 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-800 transition group cursor-pointer shadow-xs"
          title="Открыть профиль и параметры"
        >
          {userProfile?.avatar_url ? (
            <img 
              src={userProfile.avatar_url} 
              alt={userProfile.username || 'Атлет'} 
              className="w-7 h-7 rounded-xl object-cover bg-white p-0.5 border border-slate-200 shadow-xs"
            />
          ) : (
            <div 
              className="w-7 h-7 rounded-xl flex items-center justify-center text-white text-xs font-black shadow-xs"
              style={{ backgroundColor: userProfile?.player_color_hex || '#2563eb' }}
            >
              {userProfile?.username ? userProfile.username[0].toUpperCase() : 'S'}
            </div>
          )}
          <div className="text-left hidden sm:block">
            <div className="text-xs font-bold text-slate-900 leading-tight group-hover:text-blue-600 transition">
              {userProfile?.username || 'Атлет'}
            </div>
            <div className="text-[10px] text-orange-600 font-mono font-bold leading-none">
              {userProfile?.total_uram_points !== undefined ? `${userProfile.total_uram_points} pts` : '0 pts'}
            </div>
          </div>
        </button>

        {/* Logout */}
        <button
          onClick={onLogout}
          className="p-2 rounded-2xl border border-slate-200 hover:border-red-200 hover:bg-red-50 text-slate-500 hover:text-red-600 transition cursor-pointer shadow-xs"
          title="Выйти из системы"
        >
          <LogOut size={15} />
        </button>
      </div>
    </header>
  );
}

export default Header;
