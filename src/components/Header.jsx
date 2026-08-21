import React from 'react';
import { Trophy, Compass, Activity, Code, MapPin, Zap, Flame, SlidersHorizontal } from 'lucide-react';
import { KAZAN_LANDMARKS } from '../services/mockData.js';

export function Header({
  selectedLandmark,
  onSelectLandmark,
  h3Resolution,
  onChangeResolution,
  onToggleLeaderboard,
  onToggleSimulator,
  onToggleApiExplorer,
  stats
}) {
  return (
    <header className="absolute top-4 left-4 right-4 z-30 pointer-events-none flex items-center justify-between gap-3">
      {/* Brand & Status Floating Dock */}
      <div className="pointer-events-auto panel-dock px-3.5 py-2.5 rounded-2xl flex items-center gap-3 border border-zinc-800/90">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-orange-500">
            <Zap className="w-4 h-4 fill-orange-500" />
          </div>
          <div>
            <div className="flex items-center gap-1.5 leading-none">
              <span className="font-heading font-extrabold text-sm text-zinc-100 tracking-tight">RunUram</span>
              <span className="text-[10px] font-mono font-medium px-1.5 py-0.5 rounded bg-zinc-900 text-zinc-400 border border-zinc-800">
                KZN
              </span>
            </div>
            <div className="flex items-center gap-1 text-[11px] text-zinc-500 font-mono mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              <span>LIVE GRID</span>
            </div>
          </div>
        </div>

        <div className="h-4 w-px bg-zinc-800"></div>

        {/* Location Dropdown / Pills */}
        <div className="hidden lg:flex items-center gap-1">
          {KAZAN_LANDMARKS.map((landmark) => (
            <button
              key={landmark.id}
              onClick={() => onSelectLandmark(landmark)}
              className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-all duration-150 ${
                selectedLandmark?.id === landmark.id
                  ? 'bg-zinc-800 text-zinc-100 border border-zinc-700 font-semibold'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60'
              }`}
            >
              {landmark.name}
            </button>
          ))}
        </div>
      </div>

      {/* Center Stats Bar */}
      <div className="hidden xl:flex pointer-events-auto panel-dock px-4 py-2.5 rounded-2xl items-center gap-4 text-xs font-mono border border-zinc-800/90">
        <div className="flex items-center gap-1.5">
          <span className="text-zinc-500">H3-Cells:</span>
          <span className="font-bold text-zinc-200">{stats.hexCount}</span>
        </div>
        <div className="h-3 w-px bg-zinc-800"></div>
        <div className="flex items-center gap-1.5">
          <span className="text-zinc-500">Active:</span>
          <span className="font-bold text-orange-400">{stats.activeRunners}</span>
        </div>
      </div>

      {/* Right Action Floating Controls */}
      <div className="pointer-events-auto panel-dock p-1.5 rounded-2xl flex items-center gap-1.5 border border-zinc-800/90">
        {/* H3 Resolution Switcher */}
        <div className="flex items-center bg-zinc-900/90 p-1 rounded-xl border border-zinc-800/80 mr-1">
          {[8, 9].map((res) => (
            <button
              key={res}
              onClick={() => onChangeResolution(res)}
              className={`px-2.5 py-1 rounded-lg text-xs font-mono font-medium transition-all duration-150 ${
                h3Resolution === res
                  ? 'bg-zinc-800 text-orange-400 border border-zinc-700/80 font-bold'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              H3-{res}
            </button>
          ))}
        </div>

        {/* Primary Action Button: Simulator */}
        <button
          onClick={onToggleSimulator}
          className="px-3 py-1.5 rounded-xl text-xs font-medium bg-orange-500 text-zinc-950 hover:bg-orange-400 font-heading font-semibold transition-all duration-150 shadow-md shadow-orange-500/20 flex items-center gap-1.5"
        >
          <Zap className="w-3.5 h-3.5 fill-zinc-950" />
          <span>Симулятор</span>
        </button>

        {/* Leaderboard */}
        <button
          onClick={onToggleLeaderboard}
          className="px-3 py-1.5 rounded-xl text-xs font-medium bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 transition-all duration-150 flex items-center gap-1.5"
        >
          <Trophy className="w-3.5 h-3.5 text-zinc-400" />
          <span className="hidden sm:inline">Лидерборд</span>
        </button>

        {/* API Spec */}
        <button
          onClick={onToggleApiExplorer}
          className="px-2.5 py-1.5 rounded-xl text-xs font-mono bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 border border-zinc-800 transition-all duration-150 flex items-center gap-1.5"
          title="REST API Spec"
        >
          <Code className="w-3.5 h-3.5 text-zinc-400" />
          <span className="hidden md:inline">API</span>
        </button>
      </div>
    </header>
  );
}
