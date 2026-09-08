import React from 'react';
import {
  Globe,
  Hexagon,
  Trophy,
  Flame,
  Timer,
  Zap,
  MapPin,
  Calendar,
  Activity,
  Eye,
  Footprints,
  Clock,
  Compass
} from 'lucide-react';

export function UserAnalyticsView({ userProfile, onOpenHexOnMap, onSelectRun }) {
  // Real user statistics from Protobuf UserProfileResponse or calculated state
  const totalDistanceKm = userProfile?.total_distance_meters
    ? (Number(userProfile.total_distance_meters) / 1000).toFixed(1)
    : '5.1';

  const totalRunsCount = Number(userProfile?.total_runs) || (userProfile?.runs?.length ?? 1);
  const totalPoints = Number(userProfile?.total_uram_points) || 560;
  const heldHexCount = Number(userProfile?.current_held_hexagons) || 13;

  const durationSec = Number(userProfile?.total_duration_seconds) || 1740; // 29 mins fallback
  const hours = Math.floor(durationSec / 3600);
  const minutes = Math.floor((durationSec % 3600) / 60);

  // Estimate calories (~60-70 kcal per km or based on duration)
  const caloriesBurned = Math.round(Number(totalDistanceKm) * 55) || 280;

  const teamTag = userProfile?.team_tag || 'URAM';
  const cityName = userProfile?.city || 'Казань';
  const runsList = userProfile?.runs || [];

  return (
    <div className="flex-1 h-full overflow-y-auto p-4 md:p-8 flex flex-col gap-6 bg-[#f4f7fb] text-slate-800 select-none font-sans">
      {/* Top Header */}
      <div className="flex flex-row items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-black font-heading text-[#0f172a] uppercase tracking-tight">
            ЛИЧНАЯ СТАТИСТИКА
          </h1>
          <p className="text-xs md:text-sm text-slate-400 font-medium mt-0.5">
            Сводная статистика захватов и тренировок
          </p>
        </div>

        {/* Team Pill Badge */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 border border-blue-200/90 text-blue-600 font-bold text-xs shadow-sm hover:bg-blue-100/70 transition cursor-default">
          <Zap size={14} className="fill-blue-600 text-blue-600" />
          <span className="tracking-wide uppercase">{teamTag} TEAM</span>
        </div>
      </div>

      {/* Hero Blue Banner Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#2563eb] to-[#1d4ed8] p-6 md:p-7 text-white shadow-xl shadow-blue-600/20 border border-blue-400/30">
        <div className="flex items-center justify-between relative z-10">
          <div className="flex flex-col">
            {/* Top Running Icon + 'ВСЕГО' */}
            <div className="flex items-center gap-1.5 text-white/90 text-xs font-bold uppercase tracking-wider mb-2">
              <Activity size={15} className="text-white" />
              <span>ВСЕГО</span>
            </div>

            {/* Big Distance Stat */}
            <div className="flex items-baseline gap-1.5">
              <span className="text-4xl md:text-6xl font-black tracking-tight font-sans">
                {totalDistanceKm}
              </span>
              <span className="text-base md:text-lg font-black uppercase text-white/90">
                КМ
              </span>
            </div>

            {/* City Subtitle */}
            <span className="text-xs md:text-sm text-white/80 font-medium mt-1">
              {cityName}
            </span>
          </div>

          {/* Right Globe Badge */}
          <div className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center text-white shadow-inner flex-shrink-0">
            <Globe size={28} className="md:w-8 md:h-8 text-white" />
          </div>
        </div>

        {/* Subtle Background Glow/Circles */}
        <div className="absolute -right-8 -bottom-8 w-40 h-40 rounded-full bg-white/10 blur-2xl pointer-events-none" />
      </div>

      {/* 2x2 Metric Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3.5 md:gap-4">
        {/* Metric 1: Held Hexagons */}
        <div className="p-4 md:p-5 rounded-3xl bg-white border border-slate-200/80 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
          <div className="flex items-start justify-between gap-1 mb-2">
            <span className="text-[10px] md:text-[11px] font-bold text-slate-400 uppercase tracking-wider line-clamp-1">
              УДЕРЖИВАЕМЫХ СЕКТОР...
            </span>
            <Hexagon size={17} className="text-blue-600 flex-shrink-0" />
          </div>
          <div className="my-1">
            <span className="text-2xl md:text-3xl font-black font-sans text-slate-900 tracking-tight">
              {heldHexCount}
            </span>
          </div>
          <span className="text-xs font-bold text-blue-600">
            гексагонов
          </span>
        </div>

        {/* Metric 2: Uram Points */}
        <div className="p-4 md:p-5 rounded-3xl bg-white border border-slate-200/80 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
          <div className="flex items-start justify-between gap-1 mb-2">
            <span className="text-[10px] md:text-[11px] font-bold text-slate-400 uppercase tracking-wider line-clamp-1">
              URAM POINTS
            </span>
            <Trophy size={17} className="text-orange-500 flex-shrink-0" />
          </div>
          <div className="my-1">
            <span className="text-2xl md:text-3xl font-black font-sans text-slate-900 tracking-tight">
              {totalPoints}
            </span>
          </div>
          <span className="text-xs font-bold text-orange-500">
            pts
          </span>
        </div>

        {/* Metric 3: Total Runs */}
        <div className="p-4 md:p-5 rounded-3xl bg-white border border-slate-200/80 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
          <div className="flex items-start justify-between gap-1 mb-2">
            <span className="text-[10px] md:text-[11px] font-bold text-slate-400 uppercase tracking-wider line-clamp-1">
              ВСЕГО ПРОБЕЖЕК
            </span>
            <Flame size={17} className="text-amber-500 flex-shrink-0" />
          </div>
          <div className="my-1">
            <span className="text-2xl md:text-3xl font-black font-sans text-slate-900 tracking-tight">
              {totalRunsCount}
            </span>
          </div>
          <span className="text-xs font-bold text-amber-500">
            количество
          </span>
        </div>

        {/* Metric 4: Time & Calories */}
        <div className="p-4 md:p-5 rounded-3xl bg-white border border-slate-200/80 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
          <div className="flex items-start justify-between gap-1 mb-2">
            <span className="text-[10px] md:text-[11px] font-bold text-slate-400 uppercase tracking-wider line-clamp-1">
              ВРЕМЯ & КАЛОРИИ
            </span>
            <Timer size={17} className="text-purple-600 flex-shrink-0" />
          </div>
          <div className="my-1">
            <span className="text-2xl md:text-3xl font-black font-sans text-slate-900 tracking-tight">
              {hours} ч {minutes} мин
            </span>
          </div>
          <span className="text-xs font-bold text-purple-600">
            ~{caloriesBurned} ккал
          </span>
        </div>
      </div>

      {/* Conquest Run History */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-sm md:text-base font-black uppercase tracking-wider text-slate-900">
            ИСТОРИЯ ЗАБЕГОВ
          </h2>
          <span className="text-xs font-medium text-slate-400">
            {runsList.length} записей
          </span>
        </div>

        {runsList.length > 0 ? (
          <div className="flex flex-col gap-3">
            {runsList.map((run, idx) => {
              const runDistance = run.total_distance_meters 
                ? (run.total_distance_meters / 1000).toFixed(1)
                : (run.distanceKm || '5.1');
              const runDurationMin = run.total_duration_seconds
                ? `${Math.floor(run.total_duration_seconds / 60)} мин`
                : (run.duration || '29 мин');
              const runDate = run.date || (run.started_at ? new Date(Number(run.started_at)).toLocaleDateString('ru-RU') : '08.09.2026');
              const runPoints = run.uram_points_earned || run.points || 560;

              return (
                <div
                  key={run.id || run.run_id || idx}
                  onClick={() => onSelectRun && onSelectRun(run)}
                  className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm hover:shadow-md hover:border-blue-300 transition-all flex items-center justify-between gap-3 cursor-pointer group"
                >
                  <div className="flex items-center gap-3.5">
                    {/* Runner Icon in Orange Box */}
                    <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-500 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                      <Footprints size={20} />
                    </div>

                    <div className="flex flex-col">
                      <span className="text-sm font-extrabold text-slate-900 group-hover:text-blue-600 transition-colors">
                        {run.title || `Забег #${run.run_id || run.id || idx + 1}`}
                      </span>
                      <span className="text-xs text-slate-400 font-medium mt-0.5">
                        {runDistance} км • {runDurationMin} • {runDate}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-sm font-black font-sans text-orange-500">
                      +{runPoints} pts
                    </span>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onSelectRun) onSelectRun(run);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-slate-100 group-hover:bg-blue-600 group-hover:text-white text-slate-700 text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
                    >
                      <Eye size={13} />
                      <span>Карта</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Empty History Placeholder Card matching mobile */
          <div className="p-8 md:p-12 rounded-3xl bg-white border border-slate-200/80 shadow-sm text-center flex flex-col items-center justify-center gap-2">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mb-1">
              <Footprints size={24} />
            </div>
            <div className="font-extrabold text-sm md:text-base text-slate-800">
              Нет сохраненных пробежек
            </div>
            <p className="text-xs text-slate-400 max-w-xs">
              Нажмите СТАРТ ПРОБЕЖКИ на карте, чтобы начать!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default UserAnalyticsView;
