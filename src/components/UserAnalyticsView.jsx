import React from 'react';
import {
  Flame,
  Zap,
  Clock,
  TrendingUp,
  Calendar,
  Layers,
  Eye,
  Award
} from 'lucide-react';

export function UserAnalyticsView({ userProfile, onOpenHexOnMap, onSelectRun }) {
  // Real user statistics from Protobuf UserProfileResponse
  const totalDistanceKm = userProfile?.total_distance_meters
    ? (Number(userProfile.total_distance_meters) / 1000).toFixed(2)
    : '0.00';

  const totalRunsCount = Number(userProfile?.total_runs) || 0;
  const totalPoints = Number(userProfile?.total_uram_points) || 0;
  const heldHexCount = Number(userProfile?.current_held_hexagons) || 0;

  const durationSec = Number(userProfile?.total_duration_seconds) || 0;
  const hours = Math.floor(durationSec / 3600);
  const minutes = Math.floor((durationSec % 3600) / 60);
  const durationFormatted = hours > 0 ? `${hours}ч ${minutes}м` : `${minutes} мин`;

  // Estimate calories based on real distance (approx 65 kcal per km)
  const caloriesBurned = Math.round(Number(totalDistanceKm) * 65);

  const runsList = userProfile?.runs || [];

  return (
    <div className="flex-1 h-full overflow-y-auto p-6 md:p-8 flex flex-col gap-6 bg-[#f0f4f8] text-slate-800 select-none font-sans">
      {/* Top Telemetry Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl md:text-3xl font-black font-heading text-slate-900 tracking-tight">
              Личная статистика
            </h1>
            <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-blue-600 font-bold">
              LIVE PROFILE
            </span>
          </div>
          <p className="text-xs md:text-sm text-slate-500 font-medium mt-0.5">
            Сводная статистика захватов и тренировок
          </p>
        </div>
      </div>

      {/* Hero Metric Cards Deck */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Metric 1: Total Distance */}
        <div className="p-4 rounded-3xl border border-slate-200 bg-white/95 shadow-sm hover:shadow-md transition-all flex flex-col justify-between relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Общая дистанция</span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <TrendingUp size={16} />
            </div>
          </div>
          <div className="my-2">
            <span className="text-2xl md:text-3xl font-black font-mono text-slate-900 tracking-tight">
              {totalDistanceKm}
            </span>
            <span className="text-xs font-mono text-slate-500 ml-1">км</span>
          </div>
          <div className="flex items-center gap-1 text-[11px] font-mono text-slate-500 font-medium">
            <span>Суммарный трек</span>
          </div>
        </div>

        {/* Metric 2: Hexes Conquered */}
        <div className="p-4 rounded-3xl border border-blue-200 bg-blue-50/50 shadow-sm hover:shadow-md transition-all flex flex-col justify-between relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-blue-700">Удерживаемые соты</span>
            <div className="p-2 rounded-xl bg-blue-600 text-white shadow-sm">
              <Layers size={16} />
            </div>
          </div>
          <div className="my-2">
            <span className="text-2xl md:text-3xl font-black font-mono text-blue-700 tracking-tight">
              {heldHexCount}
            </span>
            <span className="text-xs font-mono text-blue-600 ml-1">сот</span>
          </div>
          <div className="flex items-center gap-1 text-[11px] font-mono text-blue-700 font-semibold">
            <Zap size={13} />
            <span>Текущий контроль</span>
          </div>
        </div>

        {/* Metric 3: Total Runs & Points */}
        <div className="p-4 rounded-3xl border border-slate-200 bg-white/95 shadow-sm hover:shadow-md transition-all flex flex-col justify-between relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Очки URAM</span>
            <div className="p-2 rounded-xl bg-orange-50 text-orange-600">
              <Award size={16} />
            </div>
          </div>
          <div className="my-2">
            <span className="text-2xl md:text-3xl font-black font-mono text-orange-600">
              {totalPoints}
            </span>
            <span className="text-xs font-mono text-slate-500 ml-1">pts</span>
          </div>
          <div className="flex items-center gap-1 text-[11px] text-slate-600 font-medium">
            <span>Всего {totalRunsCount} забегов</span>
          </div>
        </div>

        {/* Metric 4: Total Runs Count */}
        <div className="p-4 rounded-3xl border border-slate-200 bg-white/95 shadow-sm hover:shadow-md transition-all flex flex-col justify-between relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Завершенные забеги</span>
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
              <Clock size={16} />
            </div>
          </div>
          <div className="my-2">
            <span className="text-2xl md:text-3xl font-black font-mono text-slate-900 tracking-tight">
              {totalRunsCount}
            </span>
            <span className="text-xs font-mono text-slate-500 ml-1">сессий</span>
          </div>
          <div className="flex items-center gap-1 text-[11px] font-mono text-slate-500">
            <span>Статус: Активен</span>
          </div>
        </div>

        {/* Metric 5: Duration & Calories */}
        <div className="p-4 rounded-3xl border border-slate-200 bg-white/95 shadow-sm hover:shadow-md transition-all flex flex-col justify-between relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Время в движении</span>
            <div className="p-2 rounded-lg bg-amber-50 text-amber-600">
              <Flame size={16} />
            </div>
          </div>
          <div className="my-2">
            <span className="text-2xl md:text-3xl font-black font-mono text-slate-900 tracking-tight">
              {durationFormatted}
            </span>
          </div>
          <div className="flex items-center gap-1 text-[11px] text-slate-500">
            <span>{caloriesBurned.toLocaleString('ru-RU')} ккал сожжено</span>
          </div>
        </div>
      </div>

      {/* Conquest Run History Table */}
      <div className="p-6 rounded-3xl border border-slate-200 bg-white/95 shadow-sm flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold font-heading text-slate-900">
              ИСТОРИЯ ПРОБЕЖЕК И МАРШРУТОВ
            </h2>
            <span className="text-xs text-slate-500">
              Лог сессий и захваченных секторов
            </span>
          </div>
          <span className="text-xs font-mono font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-xl border border-blue-200">
            ВСЕГО: {runsList.length} ЗАБЕГОВ
          </span>
        </div>

        {runsList.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="border-b border-slate-200 text-[11px] font-mono uppercase text-slate-400">
                  <th className="pb-3 font-semibold">Дата и маршрут</th>
                  <th className="pb-3 font-semibold">Дистанция</th>
                  <th className="pb-3 font-semibold">Время</th>
                  <th className="pb-3 font-semibold">Очки</th>
                  <th className="pb-3 font-semibold text-right">Действие</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {runsList.map((run) => (
                  <tr
                    key={run.id || run.run_id}
                    onClick={() => onSelectRun && onSelectRun(run)}
                    className="hover:bg-blue-50/50 transition-colors group cursor-pointer"
                  >
                    <td className="py-4 pr-3">
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors flex items-center gap-1.5">
                          {run.title || `Забег #${run.run_id || run.id}`}
                        </span>
                        <span className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                          <Calendar size={12} className="text-slate-400" /> {run.date || (run.started_at ? new Date(Number(run.started_at)).toLocaleDateString('ru-RU') : 'Недавно')}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 pr-3 font-mono font-black text-slate-900">
                      {run.total_distance_meters ? (run.total_distance_meters / 1000).toFixed(2) : (run.distanceKm || '0')} км
                    </td>
                    <td className="py-4 pr-3 font-mono text-slate-600">
                      {run.duration || (run.total_duration_seconds ? `${Math.floor(run.total_duration_seconds / 60)} мин` : '—')}
                    </td>
                    <td className="py-4 pr-3 font-mono text-orange-600 font-bold">
                      +{run.uram_points_earned || run.points || 0} pts
                    </td>
                    <td className="py-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onSelectRun) onSelectRun(run);
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 group-hover:bg-blue-600 group-hover:text-white text-slate-700 text-xs font-bold transition shadow-sm"
                      >
                        <Eye size={13} />
                        <span>Маршрут</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 rounded-2xl border border-dashed border-slate-200 text-center flex flex-col items-center justify-center gap-2 text-slate-500">
            <Clock size={28} className="text-slate-400" />
            <div className="font-bold text-sm text-slate-700">Нет завершенных забегов</div>
            <p className="text-xs text-slate-400 max-w-sm">
              Совершите пробежку по Казани в мобильном приложении, и ваша телеметрия и захваченные гексагоны отобразятся здесь в реальном времени.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default UserAnalyticsView;
