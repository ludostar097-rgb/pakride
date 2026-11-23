import React from 'react';
import { RideRequest } from '../../shared/types';

interface AdminRidesTabProps {
  rides: RideRequest[];
}

export const AdminRidesTab: React.FC<AdminRidesTabProps> = ({ rides }) => {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="p-4 border-b border-slate-200 bg-slate-50 font-bold text-sm text-charcoal-900">
        Real-Time Ride Requests & Status
      </div>

      <div className="divide-y divide-slate-200">
        {rides.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-sm">
            No rides found for selected filter.
          </div>
        ) : (
          rides.map((ride) => (
            <div
              key={ride.id}
              className="p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-2 hover:bg-slate-50/50 transition"
            >
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-xs text-charcoal-900">{ride.id}</span>
                  <span className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-semibold">
                    {ride.category}
                  </span>
                  <span className="text-xs font-bold text-pakgreen-600">
                    PKR {Math.round((ride.agreedFarePaisa || ride.proposedFarePaisa) / 100)}
                  </span>
                  {ride.verificationOtp && (
                    <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded font-mono font-bold">
                      PIN: {ride.verificationOtp}
                    </span>
                  )}
                </div>
                <div className="text-xs text-slate-600 mt-1">
                  Passenger: {ride.passengerName} • 🟢 {ride.pickup.address} &rarr; 🔴 {ride.destination.address}
                </div>
                {ride.pickupNotes && (
                  <div className="text-[11px] text-amber-700 mt-0.5">
                    📌 Gate Note: {ride.pickupNotes}
                  </div>
                )}
                {ride.driverName && (
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Driver Assigned: {ride.driverName} ({ride.vehicleDetails})
                  </div>
                )}
              </div>

              <div>
                <span className="text-xs font-bold px-2.5 py-1 bg-slate-100 text-slate-800 rounded-full">
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
