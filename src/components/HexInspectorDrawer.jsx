import React from 'react';
import { 
  X, 
  Trophy, 
  Crown, 
  Clock, 
  Flame, 
  Shield, 
  MapPin, 
  Zap, 
  TrendingUp, 
  Users,
  Timer
} from 'lucide-react';
import { h3Uint64ToHexString } from '../services/protoService.js';

export function HexInspectorDrawer({ 
  h3Index, 
  onClose, 
  detailsData,
  onFlyToHex
}) {
  const displayHexStr = typeof h3Index === 'string' 
    ? h3Index 
    : h3Uint64ToHexString(h3Index);

  const isLoaded = Boolean(detailsData);
  const state = detailsData?.state;
  const leaderboard = detailsData?.leaderboard || [];

  const rawOwner = state?.owner_username || 'Не захвачен';
  const isCaptured = Boolean(state?.owner_username || (state?.owner_user_id && state?.owner_user_id !== '0'));
  const ownerColor = state?.owner_color_hex || (isCaptured ? '#fe4a09' : '#94a3b8');
  const topScore = state?.top_score || 0;

  // Determine faction styling based on color or name
  let factionName = 'Нейтральная зона';
  let factionIcon = '⚪';
  let factionBadgeClass = 'bg-slate-100 text-slate-500 border-slate-200';

  if (ownerColor === '#fe4a09' || ownerColor === '#f97316') {
    factionName = 'Zilant Cyber-Runners';
    factionIcon = '🐉';
    factionBadgeClass = 'bg-orange-50 text-orange-600 border-orange-200';
  } else if (ownerColor === '#00e5ff' || ownerColor === '#06b6d4' || ownerColor === '#3b82f6' || ownerColor === '#0284c7' || ownerColor === '#2563eb') {
    factionName = 'Volga Rapids';
    factionIcon = '🌊';
    factionBadgeClass = 'bg-blue-50 text-blue-600 border-blue-200';
  } else if (ownerColor === '#10b981') {
    factionName = 'Kremlin Shields';
    factionIcon = '🛡️';
    factionBadgeClass = 'bg-emerald-50 text-emerald-600 border-emerald-200';
  } else if (ownerColor === '#a855f7' || ownerColor === '#8b5cf6' || ownerColor === '#7c3aed') {
    factionName = 'Nomad Raiders';
    factionIcon = '🐺';
    factionBadgeClass = 'bg-purple-50 text-purple-600 border-purple-200';
  }

  // Format pace or calculate mock record pace
  const recordPace = isCaptured ? '03:48 мин/км' : '—';
  const decayHours = isCaptured ? '28ч 14м' : '—';

  return (
    <aside 
      className="absolute right-0 top-0 bottom-0 w-96 max-w-full z-40 flex flex-col border-l border-slate-200/90 bg-white/95 backdrop-blur-xl shadow-2xl transition-transform duration-300 animate-in slide-in-from-right select-none text-slate-800"
    >
      {/* Header */}
      <div className="p-4 border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div 
            className="w-3.5 h-3.5 rounded-full animate-pulse shadow-xs"
            style={{ backgroundColor: ownerColor }}
          />
          <div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold">ТАКТИЧЕСКИЙ СЕКТОР</span>
            <div className="text-xs font-mono font-bold text-slate-900 flex items-center gap-1.5">
              <span>#{displayHexStr?.substring(0, 10)}...</span>
              <span className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded-md border ${factionBadgeClass}`}>
                {isCaptured ? 'CONTROLLED' : 'OPEN'}
              </span>
            </div>
          </div>
        </div>

        <button 
          onClick={onClose}
          className="p-1.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-500 hover:text-slate-900 transition cursor-pointer"
        >
          <X size={16} />
        </button>
      </div>

      {/* Main Body */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
        {/* Territory Status Card */}
        <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/70 flex flex-col gap-3 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="text-2xl">{factionIcon}</span>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-slate-900">{factionName}</span>
                <span className="text-[11px] text-slate-500 font-medium">
                  {isCaptured ? `Владелец: ${rawOwner}` : 'Нейтральная территория'}
                </span>
              </div>
            </div>
            {isCaptured && (
              <span className="text-xs font-mono font-black text-orange-600">
                +{topScore} PTS
              </span>
            )}
          </div>

          {/* Crown Holder / Record */}
          <div className="pt-3 border-t border-slate-200/80 grid grid-cols-2 gap-3">
            <div className="flex flex-col">
              <span className="text-[10px] text-slate-500 flex items-center gap-1 font-medium">
                <Crown size={12} className="text-amber-500" /> Рекорд темпа
              </span>
              <span className="text-sm font-mono font-bold text-slate-900">{recordPace}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] text-slate-500 flex items-center gap-1 font-medium">
                <Timer size={12} className="text-blue-600" /> До сброса
              </span>
              <span className="text-sm font-mono font-bold text-slate-900">{decayHours}</span>
            </div>
          </div>
        </div>

        {/* Tactical Telemetry Metrics */}
        <div className="grid grid-cols-2 gap-2">
          <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col">
            <span className="text-[10px] text-slate-500">Разрешение H3</span>
            <span className="text-xs font-mono font-bold text-slate-800">Res 9 (~174m)</span>
          </div>
          <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col">
            <span className="text-[10px] text-slate-500">Стабильность</span>
            <span className="text-xs font-mono font-bold text-emerald-600">92% Защита</span>
          </div>
        </div>

        {/* Top 5 Zone Runners Leaderboard */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold font-heading text-slate-900 flex items-center gap-1.5">
              <Trophy size={14} className="text-amber-500" /> ТОП БЕГУНОВ В СЕКТОРЕ
            </span>
            <span className="text-[10px] font-mono font-bold text-slate-400">
              {leaderboard.length} АТЛЕТОВ
            </span>
          </div>

          <div className="flex flex-col gap-1.5">
            {leaderboard.length > 0 ? (
              leaderboard.slice(0, 5).map((runner, idx) => (
                <div 
                  key={runner.user_id || idx}
                  className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200 bg-white hover:border-blue-300 transition-colors shadow-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-5 text-center font-mono font-bold text-xs text-slate-400">
                      {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`}
                    </span>
                    <div 
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: runner.player_color_hex || '#2563eb' }}
                    />
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-slate-900 truncate max-w-[120px]">
                        {runner.username || `Атлет #${runner.user_id}`}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {runner.club_name || 'URAM Team'}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col items-end">
                    <span className="text-xs font-mono font-bold text-blue-600">
                      {runner.uram_points || 0} pts
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {runner.best_pace || '04:12'}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-4 rounded-2xl border border-dashed border-slate-200 text-center flex flex-col items-center gap-1">
                <Users size={20} className="text-slate-400" />
                <span className="text-xs font-semibold text-slate-600">Сектор свободен</span>
                <span className="text-[10px] text-slate-400">Пробегите через этот гексагон первым!</span>
              </div>
            )}
          </div>
        </div>

        {/* Tactical Defense Log */}
        <div className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50/70 flex flex-col gap-1.5">
          <span className="text-[11px] font-bold text-slate-800 flex items-center gap-1.5">
            <Shield size={13} className="text-blue-600" /> Правила контроля сектора
          </span>
          <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
            Для захвата гексагона пробегите маршрут внутри его границ со средним темпом быстрее текущего рекорда.
          </p>
        </div>
      </div>

      {/* Footer CTA */}
      <div className="p-4 border-t border-slate-200">
        <button 
          onClick={onClose}
          className="w-full py-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-xs font-bold text-slate-700 transition cursor-pointer"
        >
          Закрыть инспектор
        </button>
      </div>
    </aside>
  );
}

export default HexInspectorDrawer;
