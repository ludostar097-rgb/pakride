import React from 'react';
import { Users, Car, DollarSign, Compass, TrendingUp, CheckCircle2 } from 'lucide-react';
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
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Total Drivers KPI */}
      <div className="glass-panel p-5 border border-white/80 dark:border-white/10 shadow-xl relative overflow-hidden group hover:border-cyan-500/40 transition-all">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-400">
            Total Captains
          </span>
          <div className="w-8 h-8 rounded-xl bg-cyan-500/10 dark:bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 flex items-center justify-center border border-cyan-500/20">
            <Users className="w-4 h-4" />
          </div>
        </div>
        <div className="text-3xl font-black text-slate-900 dark:text-white mt-2 tracking-tight">
          {totalDriversCount}
        </div>
        <div className="mt-2 flex items-center space-x-1.5">
          <span className="text-[11px] font-extrabold text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 dark:bg-emerald-950/40 border border-emerald-500/20 px-2.5 py-0.5 rounded-full flex items-center space-x-1">
            <CheckCircle2 className="w-3 h-3" />
            <span>{approvedDriversCount} Verified</span>
          </span>
        </div>
      </div>

      {/* 2. Total Rides KPI */}
      <div className="glass-panel p-5 border border-white/80 dark:border-white/10 shadow-xl relative overflow-hidden group hover:border-violet-500/40 transition-all">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-400">
            Dispatched Rides
          </span>
          <div className="w-8 h-8 rounded-xl bg-violet-500/10 dark:bg-violet-500/20 text-violet-600 dark:text-violet-400 flex items-center justify-center border border-violet-500/20">
            <Car className="w-4 h-4" />
          </div>
        </div>
        <div className="text-3xl font-black text-slate-900 dark:text-white mt-2 tracking-tight">
          {totalRidesCount}
        </div>
        <div className="mt-2 flex items-center space-x-1.5">
          <span className="text-[11px] font-extrabold text-violet-700 dark:text-violet-300 bg-violet-500/10 dark:bg-violet-950/40 border border-violet-500/20 px-2.5 py-0.5 rounded-full">
            {completedRidesCount} Completed
          </span>
        </div>
      </div>

      {/* 3. Gross GMV KPI */}
      <div className="glass-panel p-5 border border-white/80 dark:border-white/10 shadow-xl relative overflow-hidden group hover:border-emerald-500/40 transition-all">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-400">
            Gross GMV
          </span>
          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/20">
            <DollarSign className="w-4 h-4" />
          </div>
        </div>
        <div className="text-3xl font-black text-pakgreen-700 dark:text-emerald-400 mt-2 tracking-tight">
          PKR {grossGmvPkr}
        </div>
        <div className="mt-2 flex items-center space-x-1.5">
          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 truncate max-w-[170px]">
            {currentCityName} • 0% Cut
          </span>
        </div>
      </div>

      {/* 4. Active Pilot Zones KPI */}
      <div className="glass-panel p-5 border border-white/80 dark:border-white/10 shadow-xl relative overflow-hidden group hover:border-amber-500/40 transition-all">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-400">
            Pilot Zones
          </span>
          <div className="w-8 h-8 rounded-xl bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-500/20">
            <Compass className="w-4 h-4" />
          </div>
        </div>
        <div className="text-3xl font-black text-slate-900 dark:text-white mt-2 tracking-tight">
          {activeZonesCount} <span className="text-sm font-semibold text-slate-400">/ {totalZonesCount}</span>
        </div>
        <div className="mt-2 flex items-center space-x-1.5">
          <span className="text-[11px] font-extrabold text-amber-700 dark:text-amber-300 bg-amber-500/10 dark:bg-amber-950/40 border border-amber-500/20 px-2.5 py-0.5 rounded-full">
            {selectedCityId === 'ALL' ? 'Nationwide Active' : `${currentCityName} Active`}
          </span>
        </div>
      </div>
    </div>
  );
};
