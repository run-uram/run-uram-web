import React from 'react';
import { 
  Map as MapIcon, 
  BarChart3, 
  ShieldAlert, 
  ChevronLeft, 
  ChevronRight,
  Award,
  Zap
} from 'lucide-react';

export function SidebarNav({ 
  currentView, 
  onViewChange, 
  isCollapsed, 
  onToggleCollapse 
}) {
  const navItems = [
    {
      id: 'map',
      label: 'Тактическая карта',
      subtitle: 'H3 Grid Kazan',
      icon: MapIcon,
      badge: 'LIVE',
      badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200'
    },
    {
      id: 'analytics',
      label: 'Аналитика атлета',
      subtitle: 'Telemetry & Routes',
      icon: BarChart3,
      badge: '+14%',
      badgeColor: 'bg-blue-50 text-blue-600 border-blue-200'
    },
    {
      id: 'factions',
      label: 'Фракции & Районы',
      subtitle: 'District Domination',
      icon: ShieldAlert,
      badge: 'WAR',
      badgeColor: 'bg-purple-50 text-purple-600 border-purple-200'
    }
  ];

  return (
    <aside 
      className={`relative flex flex-col justify-between h-full border-r border-slate-200/90 bg-white/95 backdrop-blur-xl transition-all duration-300 z-30 select-none shadow-xs ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Top Branding Section */}
      <div className="p-4 flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 overflow-hidden">
            {/* Dragon / Runner Stylized Logo Badge */}
            <div className="relative flex items-center justify-center w-10 h-10 shrink-0 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 shadow-md shadow-blue-600/25 text-white font-black text-lg">
              <span className="transform -rotate-6">🐉</span>
              <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-white" />
            </div>

            {!isCollapsed && (
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-black tracking-tight text-base uppercase text-slate-900 font-heading">RUN URAM</span>
                  <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-md bg-blue-50 border border-blue-200 text-blue-600">KZN</span>
                </div>
                <span className="text-[11px] text-slate-500 font-medium truncate">Territory Control Grid</span>
              </div>
            )}
          </div>

          {/* Collapse Button */}
          <button
            onClick={onToggleCollapse}
            className="p-1.5 rounded-xl border border-slate-200 hover:bg-slate-100 transition-colors text-slate-500 hover:text-slate-900 cursor-pointer shadow-xs"
            title={isCollapsed ? 'Развернуть меню' : 'Свернуть меню'}
          >
            {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex flex-col gap-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;

            return (
              <button
                key={item.id}
                onClick={() => onViewChange(item.id)}
                className={`relative flex items-center gap-3 w-full p-3 rounded-2xl transition-all text-left cursor-pointer ${
                  isActive
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-600/20'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-transparent'
                }`}
              >
                <div className={`p-2 rounded-xl ${isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'}`}>
                  <Icon size={18} />
                </div>

                {!isCollapsed && (
                  <div className="flex flex-col min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-bold tracking-tight ${isActive ? 'text-white' : 'text-slate-900'}`}>
                        {item.label}
                      </span>
                      {item.badge && (
                        <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-md border ${
                          isActive ? 'bg-white/20 text-white border-white/20' : item.badgeColor
                        }`}>
                          {item.badge}
                        </span>
                      )}
                    </div>
                    <span className={`text-[10px] truncate ${isActive ? 'text-blue-100' : 'text-slate-400'}`}>
                      {item.subtitle}
                    </span>
                  </div>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Controls (Faction Summary Card) */}
      <div className="p-4 border-t border-slate-200/90 flex flex-col gap-3">
        {!isCollapsed ? (
          <div className="p-3.5 rounded-2xl bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-200 flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-2.5">
              <div className="w-2.5 h-2.5 rounded-full bg-orange-500 animate-ping" />
              <div className="flex flex-col">
                <span className="text-[11px] font-bold text-slate-900">Zilant Cyber</span>
                <span className="text-[10px] text-orange-600 font-mono font-bold">482 Hexes (44.2%)</span>
              </div>
            </div>
            <Award size={16} className="text-orange-500" />
          </div>
        ) : (
          <div className="flex justify-center">
            <div className="p-2 rounded-xl bg-orange-50 text-orange-500">
              <Award size={18} />
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}

export default SidebarNav;
