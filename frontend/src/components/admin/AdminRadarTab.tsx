import React from 'react';
import { OPERATING_CITIES } from '../../shared/constants';

interface AdminRadarTabProps {
  radarMapContainerRef: React.RefObject<HTMLDivElement>;
  selectedCityId: string;
  onSelectCityId: (cityId: string) => void;
  radarTitle: string;
}

export const AdminRadarTab: React.FC<AdminRadarTabProps> = ({
  radarMapContainerRef,
  selectedCityId,
  onSelectCityId,
  radarTitle
}) => {
  return (
    <div className="glass-panel p-6 space-y-4 border border-white/80 dark:border-white/10 shadow-2xl transition-all">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
        <h3 className="font-black text-sm text-slate-900 dark:text-white flex items-center space-x-2">
          <span className="w-2.5 h-2.5 rounded-full bg-pakgreen-500 animate-ping"></span>
          <span>{radarTitle}</span>
        </h3>

        {/* City Radar Quick Switcher */}
        <div className="flex items-center space-x-1.5 bg-slate-100 dark:bg-slate-900/80 border border-slate-200 dark:border-white/10 p-1 rounded-xl flex-wrap gap-1">
          <button
            type="button"
            onClick={() => onSelectCityId('ALL')}
            className={`px-2.5 py-1 text-xs font-bold rounded-lg transition ${
              selectedCityId === 'ALL'
                ? 'bg-white dark:bg-emerald-600 text-pakgreen-700 dark:text-white shadow-xs'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-white'
            }`}
          >
            All Pakistan
          </button>
          {OPERATING_CITIES.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => onSelectCityId(c.id)}
              className={`px-2.5 py-1 text-xs font-bold rounded-lg transition ${
                selectedCityId === c.id
                  ? 'bg-white dark:bg-emerald-600 text-pakgreen-700 dark:text-white shadow-xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-white'
              }`}
            >
              {c.name.split(' ')[0]}
            </button>
          ))}
        </div>
      </div>

      <div className="w-full h-[480px] rounded-2xl overflow-hidden border border-slate-200 dark:border-white/10 relative">
        <div ref={radarMapContainerRef} className="w-full h-full" />
        <div className="absolute bottom-3 left-3 z-[400] bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl p-3 rounded-2xl shadow-xl border border-slate-200 dark:border-white/10 text-[11px] space-y-1">
          <div className="font-black text-slate-800 dark:text-white">Fleet Live Radar:</div>
          <div className="flex items-center space-x-2 text-slate-700 dark:text-slate-300">
            <span>🚗 Car</span>
            <span>🏍️ Bike</span>
            <span>🛺 Rickshaw</span>
          </div>
          <div className="text-[10px] text-slate-500 dark:text-slate-400">🟢 Online • ⚪ Offline</div>
        </div>
      </div>
    </div>
  );
};
