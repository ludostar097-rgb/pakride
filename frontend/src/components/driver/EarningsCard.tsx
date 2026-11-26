import React from 'react';
import { TrendingUp, Sparkles, Wallet, Award } from 'lucide-react';

interface EarningsCardProps {
  totalNetPkr: number;
  completedTripsCount: number;
  totalGrossPkr: number;
  t: any;
}

export const EarningsCard: React.FC<EarningsCardProps> = ({
  totalNetPkr,
  completedTripsCount,
  totalGrossPkr,
  t
}) => {
  // Approximate savings kept in pocket from zero commission
  const savedPkr = Math.round(totalGrossPkr * 0.2);

  return (
    <div className="glass-panel-dark p-6 text-white shadow-2xl space-y-4 border border-white/15 bg-gradient-to-br from-slate-900/90 via-emerald-950/70 to-slate-900/90 backdrop-blur-2xl transition-all">
      <div className="flex justify-between items-center pb-2 border-b border-white/10">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30 shadow-xs">
            <TrendingUp className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-black text-emerald-300 tracking-wide uppercase">{t.driverEarnings || 'Captain Earnings'}</h3>
        </div>
        <span className="text-[11px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-0.5 rounded-full">
          0% Commission Direct Cash
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4 pt-1">
        <div>
          <div className="text-3xl font-black tracking-tight text-white">PKR {totalNetPkr}</div>
          <div className="text-xs text-slate-300 mt-1 font-medium flex items-center space-x-1">
            <Wallet className="w-3.5 h-3.5 text-emerald-400" />
            <span>Total Cash in Pocket</span>
          </div>
        </div>
        <div className="text-right">
          <div className="text-3xl font-black tracking-tight text-emerald-300">{completedTripsCount}</div>
          <div className="text-xs text-slate-300 mt-1 font-medium flex items-center justify-end space-x-1">
            <Award className="w-3.5 h-3.5 text-emerald-400" />
            <span>{t.tripsCompleted || 'Trips Completed'}</span>
          </div>
        </div>
      </div>

      {/* You Saved Callout */}
      <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs">
        <div className="flex items-center space-x-1.5 text-amber-300 font-black">
          <Sparkles className="w-4 h-4 fill-amber-300" />
          <span>{t.savingsTitle || 'You Saved'}: PKR {savedPkr}</span>
        </div>
        <span className="text-[11px] text-slate-400 font-semibold bg-white/5 border border-white/10 px-2 py-0.5 rounded-md">
          Retained 100% of ride fares
        </span>
      </div>
    </div>
  );
};