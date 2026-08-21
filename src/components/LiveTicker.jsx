import React from 'react';

export function LiveTicker({ events }) {
  return (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 max-w-lg w-[92%] panel-dock rounded-full px-3.5 py-1.5 border border-zinc-800 flex items-center gap-3 overflow-hidden shadow-2xl">
      <div className="flex items-center gap-1.5 shrink-0 bg-zinc-950 px-2 py-0.5 rounded-full border border-zinc-800 text-[10px] font-bold text-orange-400 font-mono">
        <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse"></span>
        LIVE KZN
      </div>

      <div className="overflow-hidden whitespace-nowrap text-xs text-zinc-300 font-sans flex items-center gap-3">
        {events && events.length > 0 ? (
          <div className="flex items-center gap-2">
            <span className="font-semibold text-zinc-100" style={{ color: events[0].clubColor || '#f97316' }}>
              {events[0].user}
            </span>
            <span className="text-zinc-400">{events[0].text}</span>
            <span className="font-mono text-emerald-400 text-[11px] font-semibold">{events[0].score}</span>
            <span className="text-[10px] text-zinc-600 font-mono">({events[0].time})</span>
          </div>
        ) : (
          <span className="text-zinc-500">Ожидание очередных пробежек в Казани...</span>
        )}
      </div>
    </div>
  );
}
