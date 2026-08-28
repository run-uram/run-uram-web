import React from 'react';

export function LiveTicker({ events }) {
  return (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 max-w-lg w-[92%] bg-white/95 backdrop-blur-xl rounded-full px-3.5 py-1.5 border border-slate-200 shadow-xl shadow-slate-900/5 flex items-center gap-3 overflow-hidden select-none">
      <div className="flex items-center gap-1.5 shrink-0 bg-slate-900 px-2.5 py-0.5 rounded-full text-[10px] font-bold text-white font-mono shadow-xs">
        <img src="/app_icon_stylized_run_svg.svg" alt="Run" className="w-3.5 h-3.5 object-contain" />
        <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse"></span>
        <span>LIVE KZN</span>
      </div>

      <div className="overflow-hidden whitespace-nowrap text-xs text-slate-700 font-sans flex items-center gap-3">
        {events && events.length > 0 ? (
          <div className="flex items-center gap-2">
            <span className="font-bold" style={{ color: events[0].clubColor || '#2563eb' }}>
              {events[0].user}
            </span>
            <span className="text-slate-600">{events[0].text}</span>
            <span className="font-mono text-emerald-600 text-[11px] font-bold">{events[0].score}</span>
            <span className="text-[10px] text-slate-400 font-mono">({events[0].time})</span>
          </div>
        ) : (
          <span className="text-slate-400 font-medium">Ожидание очередных пробежек в Казани...</span>
        )}
      </div>
    </div>
  );
}

export default LiveTicker;
