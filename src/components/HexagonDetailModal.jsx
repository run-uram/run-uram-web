import React from 'react';
import { X, Shield, Trophy, Footprints } from 'lucide-react';
import wsService from '../services/wsService.js';

export function HexagonDetailModal({
  h3Index,
  onClose,
  detailsData
}) {
  if (!h3Index) return null;

  const state = detailsData?.state || {};
  const leaderboard = detailsData?.leaderboard || [];

  // Determine true leader / owner
  const topLeader = leaderboard && leaderboard.length > 0 ? leaderboard[0] : null;
  const rawOwnerName = state.owner_username?.trim();
  const hasExplicitOwner = rawOwnerName && rawOwnerName !== 'Атлет' && rawOwnerName !== 'Бегун';

  const ownerUsername = hasExplicitOwner 
    ? rawOwnerName 
    : (topLeader?.username || rawOwnerName || null);

  const isCaptured = Boolean(
    ownerUsername || 
    (state.owner_user_id && state.owner_user_id !== '0') || 
    (leaderboard && leaderboard.length > 0)
  );

  const displayOwnerName = ownerUsername || (isCaptured ? (topLeader?.username || 'Бегун') : null);
  const displayOwnerColor = state.owner_color_hex || topLeader?.player_color_hex || '#f97316';
  const displayScore = state.top_score || topLeader?.uram_points || 0;
  const avatarLetter = displayOwnerName ? displayOwnerName[0].toUpperCase() : 'R';

  return (
    <div className="absolute top-20 right-6 z-30 w-full max-w-sm panel-industrial rounded-3xl border border-zinc-800/90 bg-zinc-900/95 backdrop-blur-xl shadow-2xl overflow-hidden text-zinc-100 animate-in slide-in-from-right-4 duration-200">
      {/* Header */}
      <div className="p-4 bg-zinc-950/60 border-b border-zinc-800/80 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-xl bg-zinc-950 border border-[#fe4a09]/40 p-1 flex items-center justify-center shadow-sm shadow-[#fe4a09]/20">
            <img src="/app_icon_stylized_run_svg.svg" alt="Hexagon" className="w-full h-full object-contain" />
          </div>
          <div>
            <div className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">H3 Hexagon</div>
            <div className="font-mono text-xs text-orange-400 font-bold tracking-tight">
              {h3Index}
            </div>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="p-4 space-y-4 max-h-[calc(80vh-80px)] overflow-y-auto">
        {/* Owner Card */}
        {isCaptured ? (
          <div className="p-4 rounded-2xl bg-zinc-950/70 border border-zinc-800/80 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div 
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-black text-lg uppercase shadow-md transition-transform transform hover:scale-105"
                  style={{ backgroundColor: displayOwnerColor }}
                >
                  {avatarLetter}
                </div>
                <div>
                  <div className="text-xs text-zinc-400 font-mono">Текущий владелец</div>
                  <div className="font-bold text-white text-sm tracking-wide">{displayOwnerName}</div>
                </div>
              </div>

              <div className="text-right font-mono">
                <div className="text-[10px] text-zinc-500 uppercase">Top Score</div>
                <div className="text-sm font-black text-orange-400">
                  {displayScore} <span className="text-[10px] text-zinc-500">pts</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-2xl bg-zinc-950/50 border border-zinc-800/80 text-center space-y-1.5">
            <div className="w-9 h-9 rounded-xl bg-zinc-800/80 text-zinc-400 flex items-center justify-center mx-auto">
              <Shield className="w-4 h-4" />
            </div>
            <h4 className="font-bold text-zinc-200 text-xs">Нейтральный сектор</h4>
            <p className="text-[11px] text-zinc-400">
              Сектор свободен для захвата через трекинг забега.
            </p>
          </div>
        )}

        {/* Hexagon Leaderboard */}
        {leaderboard && leaderboard.length > 0 && (
          <div className="space-y-2">
            <div className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider flex items-center gap-1.5 font-semibold">
              <Trophy className="w-3.5 h-3.5 text-amber-400" />
              <span>Топ бегунов в этом секторе</span>
            </div>

            <div className="space-y-1.5 font-mono text-xs">
              {leaderboard.map((entry, idx) => (
                <div
                  key={entry.user_id || idx}
                  className="p-2.5 rounded-xl bg-zinc-950/60 border border-zinc-800/70 flex items-center justify-between hover:border-zinc-750 transition"
                >
                  <div className="flex items-center gap-2">
                    <span className={`w-5 text-[11px] font-bold ${idx === 0 ? 'text-amber-400' : 'text-zinc-500'}`}>
                      #{idx + 1}
                    </span>
                    <span 
                      className="w-2.5 h-2.5 rounded-full shadow-sm" 
                      style={{ backgroundColor: entry.player_color_hex || '#f97316' }} 
                    />
                    <div>
                      <div className="text-zinc-200 font-semibold">{entry.username}</div>
                      <div className="text-[10px] text-zinc-500 font-sans flex items-center gap-1">
                        <Footprints className="w-2.5 h-2.5" />
                        <span>{entry.visits_count || 1} визитов</span>
                        {entry.total_distance_meters > 0 && (
                          <span>• {(entry.total_distance_meters / 1000).toFixed(1)} км</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right font-bold text-orange-400 text-xs">
                    {entry.uram_points || 0} pts
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Protobuf Details Indicator */}
        <div className="pt-2 text-[10px] font-mono text-zinc-500 flex items-center justify-between border-t border-zinc-800/80">
          <span>Схема: gamemap.HexagonDetails</span>
          <span className="text-emerald-400">● Realtime Sync</span>
        </div>
      </div>
    </div>
  );
}

export default HexagonDetailModal;
