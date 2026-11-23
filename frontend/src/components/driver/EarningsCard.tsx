import React from 'react';
import { TrendingUp, Sparkles } from 'lucide-react';

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
  // Approximate savings kept in pocket
  const savedPkr = Math.round(totalGrossPkr * 0.2);

  return (
    <div className="bg-gradient-to-r from-pakgreen-700 via-pakgreen-800 to-charcoal-900 rounded-2xl p-5 text-white shadow-lg space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <TrendingUp className="w-5 h-5 text-pakgreen-300" />
          <h3 className="text-sm font-semibold text-pakgreen-100">{t.driverEarnings || 'Captain Earnings'}</h3>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <div className="text-3xl font-extrabold">PKR {totalNetPkr}</div>
          <div className="text-xs text-pakgreen-200 mt-0.5">Total Cash in Pocket</div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold">{completedTripsCount}</div>
          <div className="text-xs text-pakgreen-200 mt-0.5">{t.tripsCompleted || 'Trips Completed'}</div>
        </div>
      </div>

      {/* You Saved Callout */}
      <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs">
        <div className="flex items-center space-x-1.5 text-amber-300 font-bold">
          <Sparkles className="w-4 h-4" />
          <span>{t.savingsTitle || 'You Saved'}: PKR {savedPkr}</span>
        </div>
        <span className="text-[10px] text-slate-300">In your pocket</span>
      </div>
    </div>
  );
};
