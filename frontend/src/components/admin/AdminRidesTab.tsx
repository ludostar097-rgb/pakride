import React from 'react';
import { RideRequest } from '../../shared/types';
import { Car, KeyRound, MapPin } from 'lucide-react';

interface AdminRidesTabProps {
  rides: RideRequest[];
}

export const AdminRidesTab: React.FC<AdminRidesTabProps> = ({ rides }) => {
  return (
    <div className="glass-panel border border-white/80 dark:border-white/10 shadow-2xl overflow-hidden transition-all">
      <div className="p-4 border-b border-slate-200/60 dark:border-white/10 bg-white/40 dark:bg-white/5 font-black text-sm text-slate-900 dark:text-white flex items-center space-x-2">
        <Car className="w-4 h-4 text-emerald-500" />
        <span>Real-Time Ride Requests & Dispatch Log</span>
      </div>

      <div className="divide-y divide-slate-200/50 dark:divide-white/5">
        {rides.length === 0 ? (
          <div className="p-8 text-center text-slate-400 dark:text-slate-500 text-sm font-medium">
            No rides found for selected filter.
          </div>
        ) : (
          rides.map((ride) => (
            <div
              key={ride.id}
              className="p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-2 hover:bg-white/40 dark:hover:bg-white/5 transition"
            >
              <div className="space-y-1">
                <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                  <span className="font-mono font-bold text-xs text-slate-800 dark:text-slate-200">{ride.id}</span>
                  <span className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2.5 py-0.5 rounded-full font-bold border border-slate-200 dark:border-white/10">
                    {ride.category}
                  </span>
                  <span className="text-xs font-black text-pakgreen-700 dark:text-emerald-400">
                    PKR {Math.round((ride.agreedFarePaisa || ride.proposedFarePaisa) / 100)}
                  </span>
                  {ride.verificationOtp && (
                    <span className="text-[10px] bg-amber-500/15 text-amber-900 dark:text-amber-300 px-2 py-0.5 rounded-md font-mono font-bold border border-amber-500/30 flex items-center space-x-1">
                      <KeyRound className="w-3 h-3 text-amber-500" />
                      <span>PIN: {ride.verificationOtp}</span>
                    </span>
                  )}
                </div>
                <div className="text-xs text-slate-600 dark:text-slate-400">
                  <span className="font-bold text-slate-900 dark:text-white">Passenger:</span> {ride.passengerName} • 🟢 {ride.pickup.address} &rarr; 🔴 {ride.destination.address}
                </div>
                {ride.pickupNotes && (
                  <div className="text-[11px] text-amber-800 dark:text-amber-300 bg-amber-500/10 px-2.5 py-0.5 rounded-lg border border-amber-400/30 inline-block font-semibold">
                    📌 Gate Note: {ride.pickupNotes}
                  </div>
                )}
                {ride.driverName && (
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">
                    Captain Assigned: <strong className="text-slate-800 dark:text-slate-200">{ride.driverName}</strong> ({ride.vehicleDetails})
                  </div>
                )}
              </div>

              <div>
                <span className={`text-xs font-bold px-3 py-1 rounded-full border ${
                  ride.status === 'COMPLETED'
                    ? 'glass-badge-success'
                    : ride.status === 'IN_PROGRESS' || ride.status === 'EN_ROUTE'
                    ? 'glass-badge-info'
                    : 'glass-badge-warning'
                }`}>
                  {ride.status}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
