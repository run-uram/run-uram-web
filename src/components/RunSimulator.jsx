import React, { useState } from 'react';
import { X, Play, Zap, Compass } from 'lucide-react';
import { MOCK_RUNNERS } from '../services/mockData.js';

export function RunSimulator({ onClose, onSimulateCapture }) {
  const [selectedRunner, setSelectedRunner] = useState(MOCK_RUNNERS[0]);
  const [isRunning, setIsRunning] = useState(false);
  const [capturedCount, setCapturedCount] = useState(0);
  const [currentDistance, setCurrentDistance] = useState(0);

  const startSimulation = (routePreset) => {
    setIsRunning(true);
    setCapturedCount(0);
    setCurrentDistance(0);

    let count = 0;
    const interval = setInterval(() => {
      count++;
      setCapturedCount(count);
      setCurrentDistance((count * 0.42).toFixed(1));

      onSimulateCapture(selectedRunner, routePreset);

      if (count >= 6) {
        clearInterval(interval);
        setIsRunning(false);
      }
    }, 1200);
  };

  return (
    <div className="absolute bottom-14 right-6 z-30 w-full max-w-xs panel-industrial rounded-2xl border border-zinc-800 shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 duration-200">
      <div className="p-3.5 bg-zinc-900/90 border-b border-zinc-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-orange-500 fill-orange-500" />
          <h3 className="font-heading font-semibold text-zinc-100 text-xs">Симулятор Забега</h3>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-lg hover:bg-zinc-800 text-zinc-500 hover:text-zinc-200 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="p-4 space-y-3.5 text-xs">
        <div>
          <label className="block text-[11px] font-mono text-zinc-500 uppercase mb-1">Атлет:</label>
          <select
            value={selectedRunner.id}
            onChange={(e) => {
              const r = MOCK_RUNNERS.find((item) => item.id === Number(e.target.value));
              if (r) setSelectedRunner(r);
            }}
            className="w-full bg-zinc-950 border border-zinc-800 text-zinc-200 rounded-xl p-2 font-mono text-xs focus:border-orange-500 focus:outline-none"
          >
            {MOCK_RUNNERS.map((runner) => (
              <option key={runner.id} value={runner.id}>
                {runner.name} ({runner.club.name})
              </option>
            ))}
          </select>
        </div>

        {isRunning && (
          <div className="p-3 rounded-xl bg-zinc-950 border border-emerald-500/40 space-y-1 font-mono text-xs">
            <div className="flex items-center justify-between">
              <span className="text-emerald-400 font-semibold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Забег активен...
              </span>
              <span className="text-zinc-300">{currentDistance} km</span>
            </div>
            <div className="text-[11px] text-zinc-400 flex justify-between">
              <span>Захвачено H3:</span>
              <span className="text-emerald-400 font-bold">+{capturedCount}</span>
            </div>
          </div>
        )}

        <div className="space-y-2 pt-1 font-sans">
          <button
            disabled={isRunning}
            onClick={() => startSimulation('uram')}
            className="w-full py-2.5 px-3 rounded-xl font-heading font-semibold text-xs bg-orange-500 hover:bg-orange-400 text-zinc-950 transition-colors shadow-md shadow-orange-500/20 flex items-center justify-center gap-1.5 disabled:opacity-50"
          >
            <Play className="w-3.5 h-3.5 fill-zinc-950" />
            Забег по Парку УРАМ (6 ячеек)
          </button>

          <button
            disabled={isRunning}
            onClick={() => startSimulation('kremlin')}
            className="w-full py-2 px-3 rounded-xl font-medium text-xs bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
          >
            <Compass className="w-3.5 h-3.5 text-zinc-400" />
            Спринт по Кремлю
          </button>
        </div>
      </div>
    </div>
  );
}
