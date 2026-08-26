import React from 'react';
import { LogOut, WifiOff } from 'lucide-react';
import { KAZAN_LANDMARKS } from '../services/mockData.js';

export function Header({
  selectedLandmark,
  onSelectLandmark,
  currentMapStyle,
  onSelectMapStyle,
  onOpenProfile,
  onLogout,
  userProfile,
  wsStatus,
  stats
}) {
  const getWsBadge = () => {
    switch (wsStatus) {
      case 'connected':
        return (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-950/70 border border-emerald-800/80 text-emerald-400 text-xs font-mono" title="WebSocket + Protobuf подключен">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="font-bold">WS LIVE</span>
          </div>
        );
      case 'connecting':
        return (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-amber-950/70 border border-amber-800/80 text-amber-400 text-xs font-mono" title="Подключение к WebSocket...">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
            <span>WS...</span>
          </div>
        );
      default:
        return (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 text-xs font-mono" title="WebSocket отключен">
            <WifiOff className="w-3.5 h-3.5 text-zinc-500" />
            <span>WS OFF</span>
          </div>
        );
    }
  };

  return (
    <header className="absolute top-4 left-4 right-4 z-30 pointer-events-none flex items-center justify-between gap-3">
      {/* Brand & Status Dock */}
      <div className="pointer-events-auto panel-dock px-4 py-2.5 rounded-2xl flex items-center gap-3 border border-zinc-800/90 bg-zinc-900/90 backdrop-blur-xl">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-zinc-950/90 border border-zinc-800 flex items-center justify-center p-1 shadow-md shadow-[#fe4a09]/15">
            <img 
              src="/app_icon_stylized_run_svg.svg" 
              alt="RunUram" 
              className="w-full h-full object-contain filter drop-shadow(0 1px 4px rgba(254,74,9,0.4))" 
            />
          </div>
          <div>
            <div className="flex items-center gap-1.5 leading-none">
              <span className="font-heading font-black text-sm text-zinc-100 tracking-tight">RUN URAM</span>
              <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-zinc-950 text-orange-400 border border-[#fe4a09]/30">
                PRO BUF
              </span>
            </div>
            <div className="flex items-center gap-1 text-[11px] text-zinc-400 font-mono mt-0.5">
              <span>KAZAN</span>
            </div>
          </div>
        </div>

        <div className="h-5 w-px bg-zinc-800"></div>

        {/* Quick Landmarks */}
        <div className="hidden lg:flex items-center gap-1">
          {KAZAN_LANDMARKS.slice(0, 4).map((landmark) => (
            <button
              key={landmark.id}
              onClick={() => onSelectLandmark(landmark)}
              className={`px-2.5 py-1 text-xs rounded-xl font-medium transition-all ${
                selectedLandmark?.id === landmark.id
                  ? 'bg-zinc-800 text-white border border-zinc-700 font-semibold shadow-inner'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
              }`}
            >
              {landmark.name}
            </button>
          ))}
        </div>
      </div>

      {/* Center WS & Hex Stats Pill */}
      <div className="hidden xl:flex pointer-events-auto panel-dock px-4 py-2.5 rounded-2xl items-center gap-4 text-xs font-mono border border-zinc-800/90 bg-zinc-900/90 backdrop-blur-xl">
        {getWsBadge()}
        <div className="h-4 w-px bg-zinc-800"></div>
        <div className="flex items-center gap-1.5">
          <span className="text-zinc-500">Сот в кадре:</span>
          <span className="font-bold text-zinc-200">{stats.hexCount}</span>
        </div>
        <div className="h-3 w-px bg-zinc-800"></div>
        <div className="flex items-center gap-1.5">
          <span className="text-zinc-500">Захвачено:</span>
          <span className="font-bold text-orange-400">{stats.capturedCount}</span>
        </div>
      </div>

      {/* Right Controls Dock */}
      <div className="pointer-events-auto panel-dock p-1.5 rounded-2xl flex items-center gap-1.5 border border-zinc-800/90 bg-zinc-900/90 backdrop-blur-xl">
        {/* Map Style Selector */}
        <div className="hidden sm:flex items-center bg-zinc-950/80 p-1 rounded-xl border border-zinc-800/80 mr-1">
          {[
            { id: 'voyager', label: '🎨 Яркая' },
            { id: 'dark', label: '🌙 Тёмная' }
          ].map((style) => (
            <button
              key={style.id}
              onClick={() => onSelectMapStyle && onSelectMapStyle(style.id)}
              className={`px-2 py-1 rounded-lg text-xs font-medium transition ${
                currentMapStyle === style.id
                  ? 'bg-zinc-800 text-zinc-100 border border-zinc-700 font-bold'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              {style.label}
            </button>
          ))}
        </div>

        {/* Runner Profile Button */}
        <button
          onClick={onOpenProfile}
          className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl bg-zinc-950/90 hover:bg-zinc-800 border border-zinc-750 hover:border-orange-500/50 text-zinc-200 transition group"
          title="Открыть профиль и статистику"
        >
          <div 
            className="w-6 h-6 rounded-lg flex items-center justify-center text-white text-xs font-black shadow"
            style={{ backgroundColor: userProfile?.player_color_hex || '#f97316' }}
          >
            {userProfile?.username ? userProfile.username[0].toUpperCase() : 'U'}
          </div>
          <div className="text-left hidden md:block">
            <div className="text-xs font-bold text-zinc-200 leading-tight group-hover:text-orange-400 transition">
              {userProfile?.username || 'Бегун'}
            </div>
            <div className="text-[10px] text-orange-400 font-mono leading-none">
              {userProfile?.total_uram_points !== undefined ? `${userProfile.total_uram_points} pts` : '0 pts'}
            </div>
          </div>
        </button>

        {/* Logout Button */}
        <button
          onClick={onLogout}
          className="p-2 rounded-xl bg-zinc-950 hover:bg-red-950/50 border border-zinc-800 hover:border-red-800 text-zinc-400 hover:text-red-400 transition"
          title="Выйти из системы"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}

export default Header;
