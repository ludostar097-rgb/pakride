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
    <div className="pak-card space-y-3">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
        <h3 className="font-bold text-sm text-charcoal-900 flex items-center space-x-2">
          <span className="w-2.5 h-2.5 rounded-full bg-pakgreen-500 animate-ping"></span>
          <span>{radarTitle}</span>
        </h3>

        {/* City Radar Quick Switcher */}
        <div className="flex items-center space-x-1.5 bg-slate-100 p-1 rounded-xl flex-wrap gap-1">
          <button
            type="button"
            onClick={() => onSelectCityId('ALL')}
            className={`px-2.5 py-1 text-xs font-bold rounded-lg transition ${
              selectedCityId === 'ALL'
                ? 'bg-white text-pakgreen-700 shadow-xs'
                : 'text-slate-500 hover:text-slate-700'
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
                  ? 'bg-white text-pakgreen-700 shadow-xs'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {c.name.split(' ')[0]}
            </button>
          ))}
        </div>
      </div>

      <div className="w-full h-[480px] rounded-xl overflow-hidden border border-slate-200 relative">
        <div ref={radarMapContainerRef} className="w-full h-full" />
        <div className="absolute bottom-3 left-3 z-[400] bg-white/95 backdrop-blur-md p-2.5 rounded-xl shadow-md border border-slate-200 text-[11px] space-y-1">
          <div className="font-bold text-slate-800">Fleet Indicators:</div>
          <div className="flex items-center space-x-2">
            <span>🚗 Car</span>
            <span>🏍️ Bike</span>
            <span>🛺 Rickshaw</span>
          </div>
          <div className="text-[10px] text-slate-500">🟢 Online • ⚪ Offline</div>
        </div>
      </div>
    </div>
  );
};
