import React from 'react';
import { Zap, Trophy, Flame } from 'lucide-react';

export function LiveTicker({ events }) {
  const currentEvent = events && events.length > 0 ? events[0] : null;

  return (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 max-w-xl w-[92%] bg-white/95 backdrop-blur-xl rounded-2xl sm:rounded-full px-4 py-2 border border-slate-200/90 shadow-2xl shadow-slate-900/10 flex items-center gap-3 overflow-hidden select-none transition-all duration-300">
      <div className="flex items-center gap-1.5 shrink-0 bg-slate-900 px-2.5 py-1 rounded-full text-[10px] font-bold text-white font-mono shadow-xs">
        <span className="w-2 h-2 rounded-full bg-orange-500 animate-ping"></span>
        <span className="tracking-wider">LIVE KZN</span>
      </div>

      <div className="overflow-hidden whitespace-nowrap text-xs text-slate-700 font-sans flex items-center gap-2 flex-1">
        {currentEvent ? (
          <div className="flex items-center gap-2 overflow-hidden text-ellipsis animate-in fade-in slide-in-from-bottom-2 duration-300">
            <span 
              className="font-black text-slate-900 shrink-0 flex items-center gap-1"
              style={{ color: currentEvent.clubColor || '#fe4a09' }}
            >
              @{currentEvent.user}
            </span>
            <span className="text-slate-600 truncate">
              {currentEvent.text}
            </span>
            {currentEvent.score && (
              <span className="font-mono text-orange-600 text-[11px] font-black shrink-0 bg-orange-50 px-1.5 py-0.5 rounded-md border border-orange-200">
                {currentEvent.score}
              </span>
            )}
            <span className="text-[10px] text-slate-400 font-mono shrink-0 hidden sm:inline">
              • {currentEvent.time}
            </span>
          </div>
        ) : (
          <span className="text-slate-400 font-medium text-xs">
            Ожидание очередных пробежек и захватов секторов в Казани...
          </span>
        )}
      </div>
    </div>
  );
}

export default LiveTicker;

