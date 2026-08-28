import React from 'react';
import { 
  X, 
  MapPin, 
  Clock, 
  TrendingUp, 
  Award, 
  Layers, 
  Navigation, 
  Flame, 
  Mountain, 
  Calendar,
  CheckCircle2,
  ChevronRight,
  ExternalLink
} from 'lucide-react';
import { h3Uint64ToHexString } from '../services/protoService.js';

export function RunDetailsModal({
  isOpen,
  onClose,
  runData,
  onViewOnMap,
  onSelectHex
}) {
  if (!isOpen || !runData) return null;

  const distanceKm = runData.total_distance_meters 
    ? (runData.total_distance_meters / 1000).toFixed(2)
    : (runData.distanceKm || '0.00');

  const durationSec = runData.total_duration_seconds || 0;
  const durationFormatted = durationSec > 0 
    ? `${Math.floor(durationSec / 3600) > 0 ? Math.floor(durationSec / 3600) + 'ч ' : ''}${Math.floor((durationSec % 3600) / 60)}м ${durationSec % 60}с`
    : (runData.duration || '—');

  const pointsEarned = runData.uram_points_earned || 0;
  const avgPace = runData.avgPace || '04:22';
  const calories = runData.calories || Math.round(Number(distanceKm) * 68);
  const elevation = runData.elevationGainM || 65;

  const capturedHexes = (runData.captured_h3_indices || []).map(idx => 
    typeof idx === 'string' ? idx : h3Uint64ToHexString(idx)
  );

  const routePointsCount = runData.route_points?.length || 0;

  const startDateStr = runData.started_at 
    ? new Date(Number(runData.started_at)).toLocaleString('ru-RU', {
        day: 'numeric',
        month: 'long',
        hour: '2-digit',
        minute: '2-digit'
      })
    : (runData.date || 'Сегодня');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in select-none">
      <div 
        className="relative w-full max-w-2xl bg-white/95 border border-slate-200/90 rounded-3xl shadow-[0_25px_60px_rgba(15,23,42,0.14)] overflow-hidden text-slate-800 flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Blue/Orange Cyber Gradient Header */}
        <div className="relative p-6 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white flex items-start justify-between">
          <div className="flex flex-col gap-1 z-10">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-white/20 text-white backdrop-blur-md border border-white/20 flex items-center gap-1">
                <CheckCircle2 size={12} className="text-emerald-300" /> ЗАВЕРШЕННЫЙ ЗАБЕГ #{runData.run_id || runData.id}
              </span>
              {runData.district && (
                <span className="text-xs font-semibold text-blue-100 flex items-center gap-1">
                  <MapPin size={12} /> {runData.district}
                </span>
              )}
            </div>
            <h2 className="text-xl sm:text-2xl font-black font-heading tracking-tight text-white mt-1">
              {runData.title || `Забег ${distanceKm} км`}
            </h2>
            <div className="flex items-center gap-2 text-xs text-blue-100 font-medium mt-0.5">
              <Calendar size={13} />
              <span>{startDateStr}</span>
              {runData.routeTag && <span>• {runData.routeTag}</span>}
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full bg-white/15 hover:bg-white/25 text-white transition z-10 cursor-pointer"
            title="Закрыть окно"
          >
            <X size={18} />
          </button>

          {/* Background Decorative Graphic */}
          <div className="absolute right-0 top-0 bottom-0 w-64 bg-white/5 mask-radial-gradient pointer-events-none" />
        </div>

        {/* Modal Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Key Metric KPI Cards Deck */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* Distance */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
              <span className="text-xs font-semibold text-slate-500 flex items-center gap-1">
                <Navigation size={13} className="text-blue-600" /> Дистанция
              </span>
              <div className="mt-2">
                <span className="text-2xl font-black font-mono text-slate-900">{distanceKm}</span>
                <span className="text-xs font-mono text-slate-500 ml-1">км</span>
              </div>
            </div>

            {/* Duration */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
              <span className="text-xs font-semibold text-slate-500 flex items-center gap-1">
                <Clock size={13} className="text-indigo-600" /> Время
              </span>
              <div className="mt-2">
                <span className="text-xl font-bold font-mono text-slate-900">{durationFormatted}</span>
              </div>
            </div>

            {/* Average Pace */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
              <span className="text-xs font-semibold text-slate-500 flex items-center gap-1">
                <TrendingUp size={13} className="text-orange-500" /> Средний темп
              </span>
              <div className="mt-2">
                <span className="text-xl font-bold font-mono text-orange-600">{avgPace}</span>
                <span className="text-[11px] font-mono text-slate-500 ml-1">/км</span>
              </div>
            </div>

            {/* Points Earned */}
            <div className="p-3.5 rounded-2xl bg-orange-50/80 border border-orange-200 flex flex-col justify-between">
              <span className="text-xs font-semibold text-orange-600 flex items-center gap-1">
                <Award size={13} className="text-orange-600" /> URAM Очки
              </span>
              <div className="mt-2">
                <span className="text-2xl font-black font-mono text-orange-600">+{pointsEarned}</span>
                <span className="text-xs font-mono text-orange-500 ml-1">pts</span>
              </div>
            </div>
          </div>

          {/* Secondary Telemetry: Energy, Altitude & GPS Coordinates */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3 rounded-xl bg-slate-50/70 border border-slate-200 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-100 text-amber-600">
                <Flame size={18} />
              </div>
              <div className="flex flex-col">
                <span className="text-[11px] text-slate-500">Расход энергии</span>
                <span className="text-sm font-bold text-slate-800 font-mono">{calories} ккал</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50/70 border border-slate-200 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-100 text-emerald-600">
                <Mountain size={18} />
              </div>
              <div className="flex flex-col">
                <span className="text-[11px] text-slate-500">Набор высоты</span>
                <span className="text-sm font-bold text-slate-800 font-mono">+{elevation} м</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50/70 border border-slate-200 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100 text-blue-600">
                <Navigation size={18} />
              </div>
              <div className="flex flex-col">
                <span className="text-[11px] text-slate-500">GPS точек маршрута</span>
                <span className="text-sm font-bold text-slate-800 font-mono">{routePointsCount || '10+ точек'}</span>
              </div>
            </div>
          </div>

          {/* Captured Hexagons Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers size={16} className="text-blue-600" />
                <h3 className="text-sm font-bold text-slate-800">
                  Захваченные и защищенные гексагоны
                </h3>
              </div>
              <span className="text-xs font-mono font-bold text-orange-600 bg-orange-100/70 px-2 py-0.5 rounded-md">
                {capturedHexes.length} соты
              </span>
            </div>

            {capturedHexes.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {capturedHexes.map((hexStr, idx) => (
                  <button
                    key={hexStr || idx}
                    onClick={() => {
                      if (onSelectHex) onSelectHex(hexStr);
                    }}
                    className="p-2.5 rounded-xl bg-slate-50 hover:bg-blue-50/60 border border-slate-200 hover:border-blue-300 text-left transition flex items-center justify-between group cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-orange-500" />
                      <span className="text-xs font-mono font-bold text-slate-700 group-hover:text-blue-600">
                        #{hexStr.substring(0, 8)}...
                      </span>
                    </div>
                    <ExternalLink size={12} className="text-slate-400 group-hover:text-blue-600" />
                  </button>
                ))}
              </div>
            ) : (
              <div className="p-4 rounded-xl border border-dashed border-slate-200 text-center text-xs text-slate-500">
                За этот забег не было зафиксировано захватов новых сот
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-6 bg-slate-50/90 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-100 text-xs font-bold text-slate-700 transition cursor-pointer"
          >
            Закрыть
          </button>

          <button
            onClick={() => {
              if (onViewOnMap) onViewOnMap(runData);
              onClose();
            }}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-500 hover:to-indigo-600 text-white text-xs font-bold font-heading tracking-wide shadow-lg shadow-blue-600/25 transition active:scale-[0.99] cursor-pointer"
          >
            <Navigation size={15} />
            <span>Показать маршрут на тактической карте</span>
            <ChevronRight size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}

export default RunDetailsModal;
