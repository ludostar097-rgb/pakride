import React from 'react';
import { Plus, Power, Compass } from 'lucide-react';
import { CityZone } from '../../shared/types';

interface AdminZonesTabProps {
  zones: CityZone[];
  onToggleZone: (zoneId: string) => void;
  onOpenAddModal: () => void;
}

export const AdminZonesTab: React.FC<AdminZonesTabProps> = ({
  zones,
  onToggleZone,
  onOpenAddModal
}) => {
  return (
    <div className="glass-panel p-6 space-y-5 border border-white/80 dark:border-white/10 shadow-2xl transition-all">
      <div className="flex justify-between items-center pb-3 border-b border-slate-200/60 dark:border-white/10">
        <div>
          <h3 className="font-black text-base text-slate-900 dark:text-white flex items-center space-x-2">
            <Compass className="w-5 h-5 text-emerald-500" />
            <span>Operational Cities & Pilot Zones</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Blueprint Rule: Activate one compact, operationally manageable zone at a time.
          </p>
        </div>
        <button
          type="button"
          onClick={onOpenAddModal}
          className="glass-btn-primary px-4 py-2 text-xs flex items-center space-x-1.5"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Zone</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {zones.map((zone) => (
          <div
            key={zone.id}
            className={`p-4 rounded-2xl border transition-all ${
              zone.isActive
                ? 'border-emerald-500/40 bg-emerald-500/10 dark:bg-emerald-950/30 shadow-md shadow-emerald-500/5'
                : 'border-slate-200 dark:border-white/10 bg-white/40 dark:bg-slate-900/40 opacity-70'
            }`}
          >
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-black text-sm text-slate-900 dark:text-white">{zone.cityName}</span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">• {zone.zoneName}</span>
                </div>
                <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                  Center: ({zone.centerLat}, {zone.centerLng}) • Radius: {zone.radiusKm} km
                </div>
              </div>

              <button
                type="button"
                onClick={() => onToggleZone(zone.id)}
                className={`px-3 py-1 rounded-full text-xs font-bold transition flex items-center space-x-1 ${
                  zone.isActive
                    ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30'
                    : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                <Power className="w-3 h-3" />
                <span>{zone.isActive ? 'Active' : 'Inactive'}</span>
              </button>
            </div>

            <div className="mt-3 pt-3 border-t border-slate-200/60 dark:border-white/10 grid grid-cols-3 gap-2 text-center text-xs">
              <div className="bg-white/80 dark:bg-slate-900/70 p-2 rounded-xl border border-slate-200 dark:border-white/10">
                <span className="text-[10px] text-slate-400 block font-medium">Car Base / Km</span>
                <span className="font-black text-slate-800 dark:text-slate-200">
                  PKR {Math.round(zone.baseFareCarPaisa / 100)} / {Math.round(zone.perKmCarPaisa / 100)}
                </span>
              </div>
              <div className="bg-white/80 dark:bg-slate-900/70 p-2 rounded-xl border border-slate-200 dark:border-white/10">
                <span className="text-[10px] text-slate-400 block font-medium">Bike Base / Km</span>
                <span className="font-black text-slate-800 dark:text-slate-200">
                  PKR {Math.round(zone.baseFareMotoPaisa / 100)} / {Math.round(zone.perKmMotoPaisa / 100)}
                </span>
              </div>
              <div className="bg-white/80 dark:bg-slate-900/70 p-2 rounded-xl border border-slate-200 dark:border-white/10">
                <span className="text-[10px] text-slate-400 block font-medium">Rickshaw Base / Km</span>
                <span className="font-black text-slate-800 dark:text-slate-200">
                  PKR {Math.round(zone.baseFareRickshawPaisa / 100)} / {Math.round(zone.perKmRickshawPaisa / 100)}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
