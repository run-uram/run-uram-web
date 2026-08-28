import React, { useState } from 'react';
import { 
  Flame, 
  Trophy, 
  Zap, 
  Clock, 
  MapPin, 
  TrendingUp, 
  ArrowUpRight, 
  ShieldCheck, 
  AlertCircle,
  Calendar,
  Layers,
  ChevronRight,
  Download,
  Navigation,
  Eye,
  Award
} from 'lucide-react';
import { RUNNER_ANALYTICS, FACTIONS, MOCK_RUNS_HISTORY } from '../services/mockData.js';

export function UserAnalyticsView({ userProfile, onOpenHexOnMap, onSelectRun }) {
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const stats = RUNNER_ANALYTICS;
  const userFaction = FACTIONS.find(f => f.isUserFaction) || FACTIONS[0];

  // Derived user statistics from Proto or Fallback
  const totalDistanceKm = userProfile?.total_distance_meters 
    ? (userProfile.total_distance_meters / 1000).toFixed(1) 
    : stats.totalDistanceKm;

  const totalRunsCount = userProfile?.total_runs || stats.runHistory.length;
  const totalPoints = userProfile?.total_uram_points || 3380;
  const heldHexCount = userProfile?.current_held_hexagons || stats.ownedHexesCount;

  const durationSec = userProfile?.total_duration_seconds || 54200;
  const hours = Math.floor(durationSec / 3600);
  const minutes = Math.floor((durationSec % 3600) / 60);
  const durationFormatted = `${hours}ч ${minutes}м`;

  // SVG Chart Dimensions for Weekly Volume & Hexes Conquered
  const chartHeight = 180;
  const chartWidth = 560;
  const maxDistance = Math.max(...stats.weeklyVolume.map(d => d.distance)) * 1.15;

  // Build SVG path points for Distance Spline
  const points = stats.weeklyVolume.map((item, index) => {
    const x = (index / (stats.weeklyVolume.length - 1)) * (chartWidth - 60) + 30;
    const y = chartHeight - 30 - (item.distance / maxDistance) * (chartHeight - 60);
    return { x, y, ...item };
  });

  const pathD = points.reduce((acc, pt, idx, arr) => {
    if (idx === 0) return `M ${pt.x} ${pt.y}`;
    const prev = arr[idx - 1];
    const cx = (prev.x + pt.x) / 2;
    return `${acc} C ${cx} ${prev.y}, ${cx} ${pt.y}, ${pt.x} ${pt.y}`;
  }, '');

  const areaD = `${pathD} L ${points[points.length - 1].x} ${chartHeight - 20} L ${points[0].x} ${chartHeight - 20} Z`;

  return (
    <div className="flex-1 h-full overflow-y-auto p-6 md:p-8 flex flex-col gap-6 bg-[#f0f4f8] text-slate-800 select-none font-sans">
      {/* Top Telemetry Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl md:text-3xl font-black font-heading text-slate-900 tracking-tight">
              ТЕЛЕМЕТРИЯ АТЛЕТА
            </h1>
            <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-blue-600 font-bold">
              PRO TELEMETRY
            </span>
          </div>
          <p className="text-xs md:text-sm text-slate-500 font-medium mt-0.5">
            Персональный тактический лог захвата территорий Казани и спортивной динамики
          </p>
        </div>

        {/* Action Buttons & Period Selector */}
        <div className="flex items-center gap-3">
          <div className="flex items-center p-1 rounded-2xl bg-white border border-slate-200 shadow-sm">
            {['week', 'month', 'season'].map((period) => (
              <button
                key={period}
                onClick={() => setSelectedPeriod(period)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  selectedPeriod === period
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {period === 'week' ? 'Неделя' : period === 'month' ? 'Этот месяц' : 'Сезон 04'}
              </button>
            ))}
          </div>

          <button className="flex items-center gap-1.5 px-3 py-2 rounded-2xl border border-slate-200 bg-white hover:border-blue-300 text-xs font-bold text-slate-700 shadow-sm transition cursor-pointer">
            <Download size={14} className="text-blue-600" />
            <span className="hidden sm:inline">Экспорт GPX</span>
          </button>
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
          <div className="flex items-center gap-1 text-[11px] font-mono text-emerald-600 font-semibold">
            <ArrowUpRight size={14} />
            <span>{stats.distanceTrend} к прошлому месяцу</span>
          </div>
        </div>

        {/* Metric 2: Hexes Conquered */}
        <div className="p-4 rounded-3xl border border-blue-200 bg-blue-50/50 shadow-sm hover:shadow-md transition-all flex flex-col justify-between relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-blue-700">Захвачено гексагонов</span>
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
            <span>{stats.ownedHexesToday} новых сегодня</span>
          </div>
        </div>

        {/* Metric 3: Total Runs & Points */}
        <div className="p-4 rounded-3xl border border-slate-200 bg-white/95 shadow-sm hover:shadow-md transition-all flex flex-col justify-between relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Забеги & Очки URAM</span>
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
            <span>Всего {totalRunsCount} тренировок</span>
          </div>
        </div>

        {/* Metric 4: Average Pace */}
        <div className="p-4 rounded-3xl border border-slate-200 bg-white/95 shadow-sm hover:shadow-md transition-all flex flex-col justify-between relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Средний темп</span>
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
              <Clock size={16} />
            </div>
          </div>
          <div className="my-2">
            <span className="text-2xl md:text-3xl font-black font-mono text-slate-900 tracking-tight">
              {stats.avgPace}
            </span>
            <span className="text-xs font-mono text-slate-500 ml-1">/км</span>
          </div>
          <div className="flex items-center gap-1 text-[11px] font-mono text-orange-600 font-bold">
            <span>⚡ Рекорд: {stats.bestPace}/км</span>
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
            <span>{stats.caloriesBurned.toLocaleString('ru-RU')} ккал сожжено</span>
          </div>
        </div>
      </div>

      {/* Analytics Main Grid (Chart + Radar) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Weekly Volume & Conquest Spline */}
        <div className="lg:col-span-2 p-6 rounded-3xl border border-slate-200 bg-white/95 shadow-sm flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <h2 className="text-base font-bold font-heading text-slate-900 flex items-center gap-2">
                <span>ДИНАМИКА ОБЪЕМА И ЗАХВАТОВ</span>
              </h2>
              <span className="text-xs text-slate-500">
                Соотношение бегового километража и захваченных гексов за 7 дней
              </span>
            </div>
            <div className="flex items-center gap-4 text-xs font-mono">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-blue-600" />
                <span className="text-slate-700 font-semibold">Дистанция (км)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-md bg-orange-100 border border-orange-500" />
                <span className="text-slate-700 font-semibold">Гексы</span>
              </div>
            </div>
          </div>

          {/* SVG Chart Render */}
          <div className="w-full overflow-x-auto">
            <div className="min-w-[500px]">
              <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-48 overflow-visible">
                <defs>
                  <linearGradient id="blueGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#2563eb" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#2563eb" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Grid Guidelines */}
                {[0.25, 0.5, 0.75].map((factor, i) => (
                  <line 
                    key={i}
                    x1="20" 
                    y1={chartHeight - 20 - (chartHeight - 60) * factor} 
                    x2={chartWidth - 20} 
                    y2={chartHeight - 20 - (chartHeight - 60) * factor} 
                    stroke="#e2e8f0" 
                    strokeDasharray="4 4"
                  />
                ))}

                {/* Bars for Hexes */}
                {points.map((pt) => {
                  const barHeight = (pt.hexes / 15) * (chartHeight - 70);
                  return (
                    <g key={`bar-${pt.day}`}>
                      <rect
                        x={pt.x - 12}
                        y={chartHeight - 20 - barHeight}
                        width="24"
                        height={barHeight}
                        rx="6"
                        fill="rgba(254, 74, 9, 0.15)"
                        stroke="rgba(254, 74, 9, 0.5)"
                        strokeWidth="1.2"
                      />
                      <text
                        x={pt.x}
                        y={chartHeight - 24 - barHeight}
                        textAnchor="middle"
                        fill="#fe4a09"
                        fontSize="10"
                        fontFamily="var(--font-mono)"
                        fontWeight="bold"
                      >
                        +{pt.hexes}
                      </text>
                    </g>
                  );
                })}

                {/* Gradient Fill under spline */}
                <path d={areaD} fill="url(#blueGrad)" />

                {/* Spline Path */}
                <path d={pathD} fill="none" stroke="#2563eb" strokeWidth="3.5" strokeLinecap="round" />

                {/* Spline Points */}
                {points.map((pt) => (
                  <g key={`pt-${pt.day}`}>
                    <circle cx={pt.x} cy={pt.y} r="5" fill="#2563eb" stroke="#ffffff" strokeWidth="2.5" />
                    <text
                      x={pt.x}
                      y={chartHeight - 4}
                      textAnchor="middle"
                      fill="#64748b"
                      fontSize="11"
                      fontFamily="var(--font-heading)"
                      fontWeight="bold"
                    >
                      {pt.day}
                    </text>
                  </g>
                ))}
              </svg>
            </div>
          </div>
        </div>

        {/* District Domination Radar Distribution */}
        <div className="p-6 rounded-3xl border border-slate-200 bg-white/95 shadow-sm flex flex-col justify-between">
          <div>
            <h2 className="text-base font-bold font-heading text-slate-900">
              РАЙОННЫЙ ОХВАТ КАЗАНИ
            </h2>
            <span className="text-xs text-slate-500">
              Процент присутствия в 7 ключевых районах
            </span>
          </div>

          <div className="flex flex-col gap-2.5 my-3">
            {stats.districtRadar.map((item) => (
              <div key={item.district} className="flex flex-col gap-1">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-slate-700">{item.district}</span>
                  <span className="font-mono text-blue-600 font-bold">{item.value}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full transition-all duration-500"
                    style={{ width: `${item.value}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="p-3 rounded-2xl bg-blue-50/70 border border-blue-100 text-xs text-slate-700 font-medium">
            🏆 Наивысший контроль: <strong className="text-blue-700">Вахитовский район (88%)</strong>
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
              Нажмите на пробежку, чтобы изучить подробный маршрут и соты на карте
            </span>
          </div>
          <span className="text-xs font-mono font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-xl border border-blue-200">
            ВСЕГО: {stats.runHistory.length} ЗАБЕГА
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="border-b border-slate-200 text-[11px] font-mono uppercase text-slate-400">
                <th className="pb-3 font-semibold">Дата и маршрут</th>
                <th className="pb-3 font-semibold">Район</th>
                <th className="pb-3 font-semibold">Дистанция</th>
                <th className="pb-3 font-semibold">Время</th>
                <th className="pb-3 font-semibold">Темп</th>
                <th className="pb-3 font-semibold">Гексы</th>
                <th className="pb-3 font-semibold text-right">Действие</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {stats.runHistory.map((run) => (
                <tr 
                  key={run.id || run.run_id} 
                  onClick={() => onSelectRun && onSelectRun(run)}
                  className="hover:bg-blue-50/50 transition-colors group cursor-pointer"
                >
                  <td className="py-4 pr-3">
                    <div className="flex flex-col">
                      <span className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors flex items-center gap-1.5">
                        {run.title}
                      </span>
                      <span className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                        <Calendar size={12} className="text-slate-400" /> {run.date || new Date(Number(run.started_at)).toLocaleDateString('ru-RU')} • {run.routeTag}
                      </span>
                    </div>
                  </td>
                  <td className="py-4 pr-3 font-semibold text-slate-700">
                    {run.district}
                  </td>
                  <td className="py-4 pr-3 font-mono font-black text-slate-900">
                    {run.total_distance_meters ? (run.total_distance_meters / 1000).toFixed(2) : run.distanceKm} км
                  </td>
                  <td className="py-4 pr-3 font-mono text-slate-600">
                    {run.duration || `${Math.floor(run.total_duration_seconds / 60)} мин`}
                  </td>
                  <td className="py-4 pr-3 font-mono text-orange-600 font-bold">
                    {run.avgPace}/км
                  </td>
                  <td className="py-4 pr-3">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-orange-50 border border-orange-200 text-orange-600 font-mono font-bold text-[11px]">
                      +{run.captured_h3_indices?.length || run.hexesCaptured || 0} сот
                    </span>
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
      </div>
    </div>
  );
}

export default UserAnalyticsView;
