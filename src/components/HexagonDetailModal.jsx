import React, { useEffect, useState } from 'react';
import { X, Shield, History, Zap, Share2, ArrowRight } from 'lucide-react';
import { getHexagonByH3Index } from '../services/api.js';

export function HexagonDetailModal({
  h3Index,
  onClose,
  onCaptureHexagon
}) {
  const [hexDetails, setHexDetails] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!h3Index) return;
    setLoading(true);
    getHexagonByH3Index(h3Index)
      .then((data) => {
        setHexDetails(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching hex detail:', err);
        setLoading(false);
      });
  }, [h3Index]);

  if (!h3Index) return null;

  const owner = hexDetails?.owner;
  const isCaptured = hexDetails?.is_captured;

  return (
    <div className="absolute top-20 right-6 z-30 w-full max-w-sm panel-industrial rounded-2xl border border-zinc-800 shadow-2xl overflow-hidden animate-in slide-in-from-right-4 duration-200">
      {/* Drawer Header */}
      <div className="p-3.5 bg-zinc-900/90 border-b border-zinc-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono uppercase tracking-wider text-zinc-500 font-semibold">
            H3 Cell
          </span>
          <span className="font-mono text-xs text-orange-400 font-bold bg-zinc-950 px-2 py-0.5 rounded border border-zinc-800">
            {h3Index}
          </span>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-lg hover:bg-zinc-800 text-zinc-500 hover:text-zinc-200 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {loading ? (
        <div className="p-8 text-center space-y-2">
          <div className="w-5 h-5 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs text-zinc-500 font-mono">Fetching cell telemetry...</p>
        </div>
      ) : (
        <div className="p-4 space-y-4 max-h-[calc(80vh-80px)] overflow-y-auto">
          {/* Owner Profile Card */}
          {isCaptured && owner ? (
            <div className="p-3.5 rounded-xl bg-zinc-900/80 border border-zinc-800 space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                  <img
                    src={owner.avatar}
                    alt={owner.name}
                    className="w-11 h-11 rounded-lg object-cover border border-zinc-700"
                  />
                  <div>
                    <div className="font-heading font-semibold text-zinc-100 text-sm leading-snug">
                      {owner.name}
                    </div>
                    <div className="text-xs font-mono text-zinc-400 flex items-center gap-1.5 mt-0.5">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: owner.color }}></span>
                      <span>{owner.club_name}</span>
                    </div>
                  </div>
                </div>

                <div className="text-right font-mono">
                  <div className="text-[10px] text-zinc-500 uppercase">Очки</div>
                  <div className="text-sm font-bold text-orange-400">{hexDetails.score} pts</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-zinc-800/80 text-xs font-mono">
                <div className="bg-zinc-950 p-2 rounded-lg border border-zinc-800/60">
                  <span className="text-zinc-500 text-[10px] block">Темп</span>
                  <span className="text-zinc-200 font-bold">{owner.avg_pace}</span>
                </div>
                <div className="bg-zinc-950 p-2 rounded-lg border border-zinc-800/60">
                  <span className="text-zinc-500 text-[10px] block">Удержание</span>
                  <span className="text-zinc-200 font-bold">34ч 12м</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 text-center space-y-1.5">
              <div className="w-8 h-8 rounded-lg bg-zinc-800 text-zinc-400 flex items-center justify-center mx-auto">
                <Shield className="w-4 h-4" />
              </div>
              <h4 className="font-heading font-semibold text-zinc-200 text-xs">Нейтральный сектор</h4>
              <p className="text-[11px] text-zinc-500">
                Сектор еще не захвачен. Пробегите через него, чтобы записать очки на свой счет.
              </p>
            </div>
          )}

          {/* History Timeline */}
          <div>
            <div className="text-[11px] font-mono text-zinc-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <History className="w-3.5 h-3.5 text-zinc-400" />
              <span>История ячейки</span>
            </div>

            <div className="space-y-1.5 font-mono text-xs">
              {(hexDetails?.history || []).map((item, idx) => (
                <div
                  key={item.id || idx}
                  className="p-2.5 rounded-lg bg-zinc-900/60 border border-zinc-800/80 flex items-center justify-between"
                >
                  <div>
                    <div className="text-zinc-200 font-medium">{item.runner}</div>
                    <div className="text-[10px] text-zinc-500">{item.action}</div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-zinc-500 block">{item.date}</span>
                    <span className="text-emerald-400 font-bold text-[11px]">+{item.score}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="pt-1 flex items-center gap-2">
            <button
              onClick={() => onCaptureHexagon(h3Index)}
              className="flex-1 py-2.5 px-3 rounded-xl font-heading font-semibold text-xs bg-orange-500 hover:bg-orange-400 text-zinc-950 transition-colors flex items-center justify-center gap-1.5 shadow-md shadow-orange-500/20"
            >
              <Zap className="w-3.5 h-3.5 fill-zinc-950" />
              Захватить ячейку
            </button>
            <button
              onClick={() => alert(`Ссылка на H3 ячейку ${h3Index} скопирована`)}
              className="p-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 border border-zinc-800 transition-colors"
            >
              <Share2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
