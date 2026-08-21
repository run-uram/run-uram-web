import React, { useEffect, useState } from 'react';
import { X, Trophy, Users, User, Zap } from 'lucide-react';
import { getLeaderboard } from '../services/api.js';

export function LeaderboardPanel({ onClose, onSelectRunnerHexes }) {
  const [activeTab, setActiveTab] = useState('runners');
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getLeaderboard(10, activeTab)
      .then((res) => {
        setLeaderboardData(res.leaders || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching leaderboard:', err);
        setLoading(false);
      });
  }, [activeTab]);

  return (
    <div className="absolute top-20 left-6 z-30 w-full max-w-sm panel-industrial rounded-2xl border border-zinc-800 shadow-2xl overflow-hidden animate-in slide-in-from-left-4 duration-200">
      {/* Panel Header */}
      <div className="p-3.5 bg-zinc-900/90 border-b border-zinc-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Trophy className="w-4 h-4 text-orange-400" />
          <h3 className="font-heading font-semibold text-zinc-100 text-sm">Топ Казани</h3>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-lg hover:bg-zinc-800 text-zinc-500 hover:text-zinc-200 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Segmented Tab Controls */}
      <div className="p-1.5 bg-zinc-950/80 border-b border-zinc-800 grid grid-cols-2 gap-1 text-xs">
        <button
          onClick={() => setActiveTab('runners')}
          className={`py-1.5 px-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-1.5 ${
            activeTab === 'runners'
              ? 'bg-zinc-800 text-zinc-100 border border-zinc-700 font-semibold'
              : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          <User className="w-3.5 h-3.5" />
          Бегуны
        </button>
        <button
          onClick={() => setActiveTab('clubs')}
          className={`py-1.5 px-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-1.5 ${
            activeTab === 'clubs'
              ? 'bg-zinc-800 text-zinc-100 border border-zinc-700 font-semibold'
              : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          Клубы
        </button>
      </div>

      {/* Leaderboard List */}
      <div className="p-3 space-y-1.5 max-h-[calc(75vh-130px)] overflow-y-auto font-sans">
        {loading ? (
          <div className="p-8 text-center space-y-2">
            <div className="w-5 h-5 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-xs font-mono text-zinc-500">Loading standings...</p>
          </div>
        ) : activeTab === 'runners' ? (
          leaderboardData.map((runner) => (
            <div
              key={runner.id}
              onClick={() => onSelectRunnerHexes && onSelectRunnerHexes(runner)}
              className="p-2.5 rounded-xl bg-zinc-900/60 hover:bg-zinc-900 border border-zinc-800/80 hover:border-zinc-700 transition-colors flex items-center justify-between cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <span className="w-5 font-mono text-xs text-zinc-500 font-bold text-center">
                  #{runner.rank}
                </span>

                <img
                  src={runner.avatar}
                  alt={runner.name}
                  className="w-8 h-8 rounded-lg object-cover border border-zinc-700"
                />

                <div>
                  <div className="font-heading font-semibold text-zinc-200 text-xs leading-snug">
                    {runner.name}
                  </div>
                  <div className="text-[10px] font-mono text-zinc-500 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: runner.club_color }}></span>
                    <span>{runner.club}</span>
                  </div>
                </div>
              </div>

              <div className="text-right font-mono">
                <div className="text-xs font-bold text-orange-400">{runner.hex_count} H3</div>
                <div className="text-[10px] text-zinc-500">{runner.total_distance_km} км</div>
              </div>
            </div>
          ))
        ) : (
          leaderboardData.map((club) => (
            <div
              key={club.id}
              className="p-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800/80 flex items-center justify-between"
            >
              <div className="flex items-center gap-2.5">
                <span className="w-5 font-mono text-xs text-zinc-500 font-bold text-center">
                  #{club.rank}
                </span>

                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold"
                  style={{ backgroundColor: `${club.color}20`, color: club.color, border: `1px solid ${club.color}40` }}
                >
                  {club.badge}
                </div>

                <div>
                  <div className="font-heading font-semibold text-zinc-200 text-xs">
                    {club.name}
                  </div>
                  <div className="text-[10px] font-mono text-zinc-500">
                    {club.members_count} участников
                  </div>
                </div>
              </div>

              <div className="text-right font-mono">
                <div className="text-xs font-bold text-zinc-200">{club.hex_count} H3</div>
                <div className="text-[10px] text-zinc-500">{club.total_distance_km} км</div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
