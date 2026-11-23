import React from 'react';
import { OPERATING_CITIES } from '../../shared/constants';

interface AdminMetricsProps {
  totalDriversCount: number;
  approvedDriversCount: number;
  totalRidesCount: number;
  completedRidesCount: number;
  grossGmvPkr: number;
  activeZonesCount: number;
  totalZonesCount: number;
  selectedCityId: string;
}

export const AdminMetrics: React.FC<AdminMetricsProps> = ({
  totalDriversCount,
  approvedDriversCount,
  totalRidesCount,
  completedRidesCount,
  grossGmvPkr,
  activeZonesCount,
  totalZonesCount,
  selectedCityId
}) => {
  const currentCityName =
    selectedCityId === 'ALL'
      ? 'All Active Cities'
      : OPERATING_CITIES.find((c) => c.id === selectedCityId)?.name || selectedCityId;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div className="pak-card-compact">
        <div className="text-xs text-slate-400 font-semibold uppercase">Total Drivers</div>
        <div className="text-2xl font-bold text-charcoal-900 mt-1">{totalDriversCount}</div>
        <div className="text-[11px] text-green-600 mt-1 font-semibold">
          {approvedDriversCount} Approved
        </div>
      </div>

      <div className="pak-card-compact">
        <div className="text-xs text-slate-400 font-semibold uppercase">Total Rides</div>
        <div className="text-2xl font-bold text-charcoal-900 mt-1">{totalRidesCount}</div>
        <div className="text-[11px] text-slate-500 mt-1">
          {completedRidesCount} Completed
        </div>
      </div>

      <div className="pak-card-compact">
        <div className="text-xs text-slate-400 font-semibold uppercase">Gross GMV (PKR)</div>
        <div className="text-2xl font-bold text-pakgreen-600 mt-1">
          PKR {grossGmvPkr}
        </div>
        <div className="text-[11px] text-slate-500 mt-1">
          {currentCityName}
        </div>
      </div>

      <div className="pak-card-compact">
        <div className="text-xs text-slate-400 font-semibold uppercase">Active Zones</div>
        <div className="text-2xl font-bold text-slate-700 mt-1">
          {activeZonesCount} / {totalZonesCount}
        </div>
        <div className="text-[11px] text-purple-600 mt-1 font-semibold">
          {selectedCityId === 'ALL' ? 'Nationwide' : `${currentCityName} Region`}
        </div>
      </div>
    </div>
  );
};
