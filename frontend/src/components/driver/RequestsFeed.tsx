import React, { useState, useEffect } from 'react';
import { Power, Clock, ArrowRight, MapPin, CheckCircle2, Timer, Navigation } from 'lucide-react';
import { RideRequest } from '../../shared/types';

interface RequestsFeedProps {
  rides: RideRequest[];
  isOnline: boolean;
  onSubmitOffer: (rideId: string, counterPkr: number) => Promise<void>;
  submittedOffers: Record<string, number>;
  t: any;
}

export const RequestsFeed: React.FC<RequestsFeedProps> = ({
  rides,
  isOnline,
  onSubmitOffer,
  submittedOffers,
  t
}) => {
  const [now, setNow] = useState<number>(Date.now());
  const [counterValues, setCounterValues] = useState<Record<string, number>>({});
  const [submittingRideId, setSubmittingRideId] = useState<string | null>(null);

  // Live countdown ticker (Uber / Careem / inDrive style)
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(timer);
  }, []);

  const handleSend = async (rideId: string, fare: number) => {
    setSubmittingRideId(rideId);
    try {
      await onSubmitOffer(rideId, fare);
    } finally {
      setSubmittingRideId(null);
    }
  };

  // Filter rides where acceptance window hasn't expired (5-minute inDrive/Uber window)
  const activeRides = rides.filter((ride) => {
    if (submittedOffers[ride.id]) return true; // keep showing if offer already sent
    const expireTime = new Date(ride.createdAt).getTime() + 300000; // 5 minutes
    return expireTime > now;
  });

  return (
    <div className="glass-panel p-6 shadow-2xl shadow-slate-900/5 border border-white/80 space-y-5 transition-all">
      <div className="flex justify-between items-center pb-2.5 border-b border-slate-200/50">
        <div>
          <h3 className="font-black text-slate-900 text-base">{t.activeRequests || 'Active Ride Requests'}</h3>
          <p className="text-xs text-slate-500 font-medium">Nearby requests • Real-time acceptance countdown</p>
        </div>
        <span className="text-xs font-black px-3 py-1 bg-emerald-500/10 text-emerald-800 border border-emerald-500/25 rounded-full">
          {activeRides.length} available
        </span>
      </div>

      {!isOnline ? (
        <div className="text-center py-10 text-slate-400 text-sm glass-panel-subtle rounded-2xl border border-dashed border-slate-200/80">
          <Power className="w-9 h-9 mx-auto mb-2.5 text-slate-400/80" />
          <p className="font-black text-slate-700 text-base">You are currently OFFLINE</p>
          <p className="text-xs mt-1 text-slate-500">Tap "Go Online" above to receive passenger requests near you.</p>
        </div>
      ) : activeRides.length === 0 ? (
        <div className="text-center py-10 text-slate-400 text-sm space-y-2.5 glass-panel-subtle rounded-2xl border border-dashed border-slate-200/80">
          <Clock className="w-8 h-8 mx-auto text-pakgreen-600 animate-spin" />
          <p className="font-black text-slate-700 text-base">{t.noRequests || 'Searching for passenger requests nearby...'}</p>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">Requests in your area will appear with a live timer to accept or send counteroffers.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {activeRides.map((ride) => {
            const passengerFare = Math.round(ride.proposedFarePaisa / 100);
            const currentCounter = counterValues[ride.id] || passengerFare;
            const submittedFare = submittedOffers[ride.id];

            const totalDurationMs = 300000;
            const expireTime = new Date(ride.createdAt).getTime() + totalDurationMs;
            const remainingMs = Math.max(0, expireTime - now);
            const secondsLeft = Math.ceil(remainingMs / 1000);
            const progressPercent = Math.min(100, Math.max(0, (remainingMs / totalDurationMs) * 100));

            const barColor =
              secondsLeft > 120
                ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                : secondsLeft > 30
                ? 'bg-gradient-to-r from-amber-500 to-yellow-400'
                : 'bg-gradient-to-r from-red-500 to-rose-400 animate-pulse';

            const timerBadgeColor =
              secondsLeft > 120
                ? 'bg-emerald-500/10 text-emerald-800 border-emerald-500/25'
                : secondsLeft > 30
                ? 'bg-amber-500/10 text-amber-800 border-amber-500/25'
                : 'bg-red-500/10 text-red-800 border-red-500/25 animate-pulse font-extrabold';

            return (
              <div
                key={ride.id}
                className="glass-card p-0 rounded-2xl overflow-hidden border border-white/80 shadow-md transition-all hover:shadow-xl space-y-0"
              >
                {/* Uber / inDrive Acceptance Countdown Progress Bar */}
                {!submittedFare && (
                  <div className="w-full bg-slate-100/80 h-1.5">
                    <div
                      className={`h-full transition-all duration-500 ease-linear ${barColor}`}
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                )}

                <div className="p-4 space-y-3">
                  <div className="flex justify-between items-start gap-2">
                    <div className="space-y-1.5">
                      <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                        <span className="text-xs font-black text-pakgreen-800 bg-pakgreen-500/15 px-2.5 py-0.5 rounded-full border border-pakgreen-500/30">
                          {ride.category}
                        </span>
                        {ride.driverDistanceKm !== undefined && (
                          <span className="text-xs font-bold text-emerald-800 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/25">
                            📍 {ride.driverDistanceKm} km away
                          </span>
                        )}
                        {!submittedFare && (
                          <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border flex items-center space-x-1 ${timerBadgeColor}`}>
                            <Timer className="w-3 h-3 flex-shrink-0" />
                            <span>{secondsLeft}s to accept</span>
                          </span>
                        )}
                      </div>

                      <div className="font-extrabold text-sm text-slate-900 pt-1">
                        🟢 {ride.pickup.address}
                      </div>
                      <div className="font-extrabold text-sm text-slate-900">
                        🔴 {ride.destination.address}
                      </div>

                      {ride.pickupNotes && (
                        <div className="text-xs text-amber-900 bg-amber-500/10 px-3 py-1 rounded-xl mt-1 border border-amber-400/30 inline-block font-semibold">
                          📌 Gate Note: {ride.pickupNotes}
                        </div>
                      )}
                    </div>

                    <div className="text-right flex-shrink-0">
                      <span className="text-[10px] text-slate-400 uppercase font-black block">{t.yourOffer || 'Proposed Fare'}</span>
                      <span className="text-2xl font-black text-pakgreen-700 tracking-tight">
                        PKR {passengerFare}
                      </span>
                      <span className="text-[10px] text-slate-400 block font-medium">Trip: {ride.distanceKm} km</span>
                    </div>
                  </div>

                  {/* If offer already submitted for this ride */}
                  {submittedFare ? (
                    <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center justify-between shadow-2xs">
                      <div className="flex items-center space-x-2 text-xs font-extrabold text-emerald-900">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                        <span>Offer of PKR {submittedFare} Sent (Waiting for Passenger)</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleSend(ride.id, submittedFare + 20)}
                        disabled={submittingRideId === ride.id}
                        className="text-xs font-black text-emerald-700 hover:underline active:scale-95"
                      >
                        +20 Raise
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2.5 pt-1">
                      {/* Counteroffer Controls with 1-Tap Quick Increment Pills */}
                      <div className="glass-panel-subtle p-2.5 rounded-2xl flex flex-wrap items-center justify-between gap-2 border border-white/70 shadow-inner">
                        <div className="flex items-center space-x-1.5">
                          <span className="text-[11px] font-black text-slate-500 mr-1">Bid Counter:</span>
                          <button
                            type="button"
                            onClick={() =>
                              setCounterValues({ ...counterValues, [ride.id]: passengerFare + 20 })
                            }
                            className="px-3 py-1 bg-white/90 border border-slate-200/90 hover:border-pakgreen-500 rounded-xl text-xs font-extrabold text-pakgreen-800 shadow-2xs transition active:scale-95"
                          >
                            +20
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setCounterValues({ ...counterValues, [ride.id]: passengerFare + 50 })
                            }
                            className="px-3 py-1 bg-white/90 border border-slate-200/90 hover:border-pakgreen-500 rounded-xl text-xs font-extrabold text-pakgreen-800 shadow-2xs transition active:scale-95"
                          >
                            +50
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setCounterValues({ ...counterValues, [ride.id]: passengerFare + 100 })
                            }
                            className="px-3 py-1 bg-white/90 border border-slate-200/90 hover:border-pakgreen-500 rounded-xl text-xs font-extrabold text-pakgreen-800 shadow-2xs transition active:scale-95"
                          >
                            +100
                          </button>
                        </div>

                        <div className="flex items-center space-x-1.5">
                          <span className="text-xs font-bold text-slate-500">PKR</span>
                          <input
                            type="number"
                            step="10"
                            value={currentCounter}
                            onChange={(e) =>
                              setCounterValues({ ...counterValues, [ride.id]: Number(e.target.value) })
                            }
                            className="w-20 px-2.5 py-1 text-sm font-black border border-slate-200 rounded-xl bg-white text-right outline-none focus:border-pakgreen-500 shadow-inner"
                          />
                        </div>
                      </div>

                      {/* 1-Tap Acceptance / Counteroffer Button (Uber & inDrive Style) */}
                      <button
                        type="button"
                        disabled={submittingRideId === ride.id}
                        onClick={() => handleSend(ride.id, currentCounter)}
                        className="w-full glass-btn-primary py-3.5 text-white font-black text-sm rounded-xl transition flex items-center justify-center space-x-2 shadow-md shadow-pakgreen-600/30 disabled:opacity-50 active:scale-95"
                      >
                        <Timer className="w-4 h-4 flex-shrink-0" />
                        <span>
                          {submittingRideId === ride.id
                            ? 'Sending...'
                            : currentCounter === passengerFare
                            ? `Accept (PKR ${passengerFare}) • ${secondsLeft}s`
                            : `Send Counteroffer (PKR ${currentCounter}) • ${secondsLeft}s`}
                        </span>
                        <ArrowRight className="w-4 h-4 flex-shrink-0" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};