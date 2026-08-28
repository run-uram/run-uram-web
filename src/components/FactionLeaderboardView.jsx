import React, { useState } from 'react';
import { 
  Shield, 
  Trophy, 
  Crown, 
  Flame, 
  Users, 
  MapPin, 
  Search, 
  Filter, 
  CheckCircle2, 
  AlertTriangle,
  Lock,
  Swords
} from 'lucide-react';
import { FACTIONS, KAZAN_DISTRICTS, TOP_RUNNERS } from '../services/mockData.js';

export function FactionLeaderboardView({ onSelectDistrict }) {
  const [activeTab, setActiveTab] = useState('factions'); // 'factions' | 'districts' | 'runners'
  const [searchQuery, setSearchQuery] = useState('');

  const filteredRunners = TOP_RUNNERS.filter(r => 
    r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.handle.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex-1 h-full overflow-y-auto p-6 md:p-8 flex flex-col gap-6 bg-[#f0f4f8] text-slate-800 select-none font-sans">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl md:text-3xl font-black font-heading text-slate-900 tracking-tight">
              БИТВА ЗА КАЗАНЬ
            </h1>
            <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-purple-50 border border-purple-200 text-purple-600 font-bold">
              СЕЗОН 04: ЛЕТО 2026
            </span>
          </div>
          <p className="text-xs md:text-sm text-slate-500 font-medium mt-0.5">
            Статус фракционного контроля районов Казани и глобальная таблица лидеров
          </p>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center p-1 rounded-2xl bg-white border border-slate-200 shadow-sm">
          {[
            { id: 'factions', label: 'Фракции' },
            { id: 'districts', label: 'Районы города' },
            { id: 'runners', label: 'Топ бегунов' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* 1. FACTIONS SECTION */}
      {(activeTab === 'factions' || activeTab === 'all') && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold font-heading text-slate-900 flex items-center gap-2">
              <Swords size={18} className="text-blue-600" />
              <span>РАСПРЕДЕЛЕНИЕ ТЕРРИТОРИЙ МЕЖДУ ФРАКЦИЯМИ</span>
            </h2>
            <span className="text-xs font-mono font-bold text-slate-500">
              1 090 ГЕКСАГОНОВ ПОД КОНТРОЛЕМ
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {FACTIONS.map((faction) => (
              <div 
                key={faction.id}
                className={`p-5 rounded-3xl border bg-white/95 shadow-sm hover:shadow-md flex flex-col justify-between relative overflow-hidden transition-all ${
                  faction.isUserFaction 
                    ? 'border-blue-300 ring-2 ring-blue-500/20' 
                    : 'border-slate-200'
                }`}
              >
                {faction.isUserFaction && (
                  <span className="absolute top-3 right-3 text-[9px] font-mono font-bold px-2 py-0.5 rounded-md bg-blue-600 text-white shadow-xs">
                    ТВОЯ КОМАНДА
                  </span>
                )}

                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-xs"
                      style={{ backgroundColor: `${faction.color}15`, border: `1px solid ${faction.color}40` }}
                    >
                      {faction.icon}
                    </div>
                    <div className="flex flex-col">
                      <span className="font-bold text-sm text-slate-900 font-heading">
                        {faction.name}
                      </span>
                      <span className="text-xs font-mono text-slate-500">
                        {faction.shortName} • {faction.activeRunners} бегунов
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-500 leading-relaxed font-medium">
                    {faction.description}
                  </p>
                </div>

                <div className="mt-4 pt-4 border-t border-slate-100 flex flex-col gap-2">
                  <div className="flex justify-between items-end">
                    <span className="text-xs font-medium text-slate-500">Контроль города</span>
                    <span className="text-base font-black font-mono" style={{ color: faction.color }}>
                      {faction.percent}%
                    </span>
                  </div>

                  <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div 
                      className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${faction.percent}%`, backgroundColor: faction.color }}
                    />
                  </div>

                  <div className="flex justify-between text-[11px] text-slate-500 font-mono font-medium mt-1">
                    <span>{faction.controlledHexes} сот</span>
                    <span>Темп: {faction.avgPace}/км</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 2. DISTRICTS STATUS SECTION */}
      {(activeTab === 'districts' || activeTab === 'all') && (
        <div className="p-6 rounded-3xl border border-slate-200 bg-white/95 shadow-sm flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold font-heading text-slate-900 flex items-center gap-2">
                <MapPin size={18} className="text-blue-600" />
                <span>КОНТРОЛЬ РАЙОНОВ КАЗАНИ</span>
              </h2>
              <span className="text-xs text-slate-500">
                Текущий статус доминирования в 7 административных секторах
              </span>
            </div>
            <span className="text-xs font-mono font-bold text-slate-500">7 СЕКТОРОВ</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {KAZAN_DISTRICTS.map((district) => {
              const leading = FACTIONS.find(f => f.id === district.leadingFaction) || FACTIONS[0];
              
              let statusBadge = {
                text: 'LOCKED',
                class: 'bg-emerald-50 text-emerald-700 border-emerald-200',
                icon: Lock
              };

              if (district.status === 'DISPUTED') {
                statusBadge = {
                  text: 'DISPUTED',
                  class: 'bg-amber-50 text-amber-700 border-amber-200',
                  icon: AlertTriangle
                };
              } else if (district.status === 'CONTESTED') {
                statusBadge = {
                  text: 'CONTESTED',
                  class: 'bg-purple-50 text-purple-700 border-purple-200',
                  icon: Swords
                };
              }

              const StatusIcon = statusBadge.icon;

              return (
                <div 
                  key={district.id}
                  className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-blue-300 hover:shadow-md transition-all flex flex-col justify-between gap-3"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex flex-col">
                      <span className="font-bold text-sm text-slate-900 font-heading">
                        {district.name}
                      </span>
                      <span className="text-xs text-slate-500 font-medium">
                        {district.center}
                      </span>
                    </div>

                    <span className={`inline-flex items-center gap-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded-md border ${statusBadge.class}`}>
                      <StatusIcon size={11} /> {statusBadge.text}
                    </span>
                  </div>

                  <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{leading.icon}</span>
                      <div className="flex flex-col">
                        <span className="text-[11px] text-slate-500 font-medium">Лидер сектора</span>
                        <span className="text-xs font-bold text-slate-900">{leading.name}</span>
                      </div>
                    </div>

                    <div className="flex flex-col items-end">
                      <span className="text-xs font-mono font-black text-blue-600">
                        {district.factionShare}%
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {district.totalHexes} сот
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. INDIVIDUAL RUNNERS LEADERBOARD */}
      {(activeTab === 'runners' || activeTab === 'all') && (
        <div className="p-6 rounded-3xl border border-slate-200 bg-white/95 shadow-sm flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold font-heading text-slate-900 flex items-center gap-2">
                <Trophy size={18} className="text-orange-500" />
                <span>ТАБЛИЦА ЛИДЕРОВ АТЛЕТОВ (КАЗАНЬ)</span>
              </h2>
              <span className="text-xs text-slate-500">
                Рейтинг по количеству удерживаемых гексов и среднему темпу
              </span>
            </div>

            {/* Search filter */}
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Поиск атлета..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white transition"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[650px]">
              <thead>
                <tr className="border-b border-slate-200 text-[11px] font-mono uppercase text-slate-400">
                  <th className="pb-3 font-semibold w-12 text-center">Ранг</th>
                  <th className="pb-3 font-semibold">Атлет</th>
                  <th className="pb-3 font-semibold">Фракция</th>
                  <th className="pb-3 font-semibold">Гексы под контролем</th>
                  <th className="pb-3 font-semibold">Дистанция</th>
                  <th className="pb-3 font-semibold">Средний темп</th>
                  <th className="pb-3 font-semibold text-right">Тир</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredRunners.map((runner) => {
                  const faction = FACTIONS.find(f => f.id === runner.faction) || FACTIONS[0];

                  return (
                    <tr 
                      key={runner.rank} 
                      className={`transition-colors ${
                        runner.isCurrentUser 
                          ? 'bg-blue-50/70 hover:bg-blue-50 border-l-2 border-blue-600 font-bold' 
                          : 'hover:bg-slate-50'
                      }`}
                    >
                      <td className="py-4 text-center font-mono font-bold text-sm">
                        {runner.rank === 1 ? '🥇' : runner.rank === 2 ? '🥈' : runner.rank === 3 ? '🥉' : `#${runner.rank}`}
                      </td>
                      <td className="py-4 pr-3">
                        <div className="flex items-center gap-2.5">
                          <div 
                            className="w-8 h-8 rounded-xl flex items-center justify-center font-black text-white text-xs shadow-xs"
                            style={{ backgroundColor: faction.color }}
                          >
                            {runner.name.charAt(0)}
                          </div>
                          <div className="flex flex-col">
                            <span className="font-bold text-slate-900">
                              {runner.name} {runner.isCurrentUser && '(Вы)'}
                            </span>
                            <span className="text-[11px] text-slate-500 font-mono">
                              {runner.handle}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 pr-3">
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-semibold border"
                          style={{ borderColor: `${faction.color}30`, backgroundColor: `${faction.color}10`, color: faction.color }}
                        >
                          {faction.icon} {faction.shortName}
                        </span>
                      </td>
                      <td className="py-4 pr-3 font-mono font-black text-blue-600 text-sm">
                        {runner.hexesCount} HEX
                      </td>
                      <td className="py-4 pr-3 font-mono text-slate-700">
                        {runner.totalDistanceKm} км
                      </td>
                      <td className="py-4 pr-3 font-mono text-slate-700">
                        {runner.avgPace}/км
                      </td>
                      <td className="py-4 text-right font-semibold text-slate-700">
                        <span className="px-2 py-1 rounded-md bg-slate-100 text-[11px]">
                          {runner.badge} {runner.tier}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default FactionLeaderboardView;
