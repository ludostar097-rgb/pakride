import React from 'react';
import { Plus, Power } from 'lucide-react';
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
    <div className="pak-card space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="font-bold text-base text-charcoal-900">Operational Cities & Pilot Zones</h3>
          <p className="text-xs text-slate-500">
            Blueprint Rule: Activate one compact, operationally manageable zone at a time.
          </p>
        </div>
        <button
          type="button"
          onClick={onOpenAddModal}
          className="pak-btn-primary"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Zone</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {zones.map((zone) => (
          <div
            key={zone.id}
            className={`p-4 rounded-xl border-2 transition ${
              zone.isActive ? 'border-emerald-300 bg-emerald-50/20' : 'border-slate-200 bg-slate-50/50'
            }`}
          >
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-sm text-charcoal-900">{zone.cityName}</span>
                  <span className="text-xs text-slate-500">• {zone.zoneName}</span>
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  Center: ({zone.centerLat}, {zone.centerLng}) • Radius: {zone.radiusKm} km
                </div>
              </div>

              <button
                type="button"
                onClick={() => onToggleZone(zone.id)}
                className={`px-3 py-1 rounded-full text-xs font-bold transition flex items-center space-x-1 ${
                  zone.isActive
                    ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                    : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                }`}
              >
                <Power className="w-3 h-3" />
                <span>{zone.isActive ? 'Active' : 'Inactive'}</span>
              </button>
            </div>

            <div className="mt-3 pt-3 border-t border-slate-200/60 grid grid-cols-3 gap-2 text-center text-xs">
              <div className="bg-white p-2 rounded-lg border border-slate-200">
                <span className="text-[10px] text-slate-400 block">Car Base / Km</span>
                <span className="font-bold text-slate-700">
                  PKR {Math.round(zone.baseFareCarPaisa / 100)} / {Math.round(zone.perKmCarPaisa / 100)}
                </span>
              </div>
              <div className="bg-white p-2 rounded-lg border border-slate-200">
                <span className="text-[10px] text-slate-400 block">Bike Base / Km</span>
                <span className="font-bold text-slate-700">
                  PKR {Math.round(zone.baseFareMotoPaisa / 100)} / {Math.round(zone.perKmMotoPaisa / 100)}
                </span>
              </div>
              <div className="bg-white p-2 rounded-lg border border-slate-200">
                <span className="text-[10px] text-slate-400 block">Rickshaw Base / Km</span>
                <span className="font-bold text-slate-700">
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
