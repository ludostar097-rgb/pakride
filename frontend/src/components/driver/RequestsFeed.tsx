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

  // Filter rides where acceptance window hasn't expired (30 seconds from ride creation or if driver already sent offer)
  const activeRides = rides.filter((ride) => {
    if (submittedOffers[ride.id]) return true; // keep showing if offer already sent
    const expireTime = new Date(ride.createdAt).getTime() + 35000;
    return expireTime > now;
  });

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="font-bold text-charcoal-900 text-base">{t.activeRequests || 'Active Ride Requests'}</h3>
          <p className="text-xs text-slate-500">Nearby requests • Real-time acceptance countdown</p>
        </div>
        <span className="text-xs font-bold px-2.5 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-full">
          {activeRides.length} available
        </span>
      </div>

      {!isOnline ? (
        <div className="text-center py-8 text-slate-400 text-sm">
          <Power className="w-8 h-8 mx-auto mb-2 text-slate-300" />
          <p className="font-bold text-slate-600">You are currently OFFLINE</p>
          <p className="text-xs mt-1">Tap "Go Online" above to receive passenger requests near you.</p>
        </div>
      ) : activeRides.length === 0 ? (
        <div className="text-center py-8 text-slate-400 text-sm space-y-2">
          <Clock className="w-8 h-8 mx-auto text-pakgreen-600 animate-spin" />
          <p className="font-semibold text-slate-700">{t.noRequests || 'Searching for passenger requests nearby...'}</p>
          <p className="text-xs text-slate-400">Requests in your area will appear with a live 30-second timer to accept or bid.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {activeRides.map((ride) => {
            const passengerFare = Math.round(ride.proposedFarePaisa / 100);
            const currentCounter = counterValues[ride.id] || passengerFare;
            const submittedFare = submittedOffers[ride.id];

            const expireTime = new Date(ride.createdAt).getTime() + 35000;
            const remainingMs = Math.max(0, expireTime - now);
            const secondsLeft = Math.ceil(remainingMs / 1000);
            const progressPercent = Math.min(100, Math.max(0, (remainingMs / 35000) * 100));

            const barColor =
              secondsLeft > 15
                ? 'bg-emerald-500'
                : secondsLeft > 7
                ? 'bg-amber-500'
                : 'bg-red-500 animate-pulse';

            const timerBadgeColor =
              secondsLeft > 15
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : secondsLeft > 7
                ? 'bg-amber-50 text-amber-700 border-amber-200'
                : 'bg-red-50 text-red-700 border-red-200 animate-pulse font-bold';

            return (
              <div
                key={ride.id}
                className="rounded-2xl border-2 border-slate-200 hover:border-pakgreen-500 bg-white shadow-sm overflow-hidden transition space-y-0"
              >
                {/* Uber / inDrive Acceptance Countdown Progress Bar */}
                {!submittedFare && (
                  <div className="w-full bg-slate-100 h-1.5">
                    <div
                      className={`h-full transition-all duration-500 ease-linear ${barColor}`}
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                )}

                <div className="p-4 space-y-3">
                  <div className="flex justify-between items-start gap-2">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                        <span className="text-xs font-bold text-pakgreen-700 bg-pakgreen-50 px-2 py-0.5 rounded-full border border-pakgreen-200">
                          {ride.category}
                        </span>
                        {ride.driverDistanceKm !== undefined && (
                          <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                            📍 {ride.driverDistanceKm} km away
                          </span>
                        )}
                        {!submittedFare && (
                          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border flex items-center space-x-1 ${timerBadgeColor}`}>
                            <Timer className="w-3 h-3 flex-shrink-0" />
                            <span>{secondsLeft}s to accept</span>
                          </span>
                        )}
                      </div>

                      <div className="font-bold text-sm text-charcoal-900 pt-1">
                        🟢 {ride.pickup.address}
                      </div>
                      <div className="font-bold text-sm text-charcoal-900">
                        🔴 {ride.destination.address}
                      </div>

                      {ride.pickupNotes && (
                        <div className="text-xs text-amber-800 bg-amber-50 px-2.5 py-1 rounded-lg mt-1 border border-amber-200 inline-block font-medium">
                          📌 Gate Note: {ride.pickupNotes}
                        </div>
                      )}
                    </div>

                    <div className="text-right flex-shrink-0">
                      <span className="text-[10px] text-slate-400 uppercase font-semibold block">{t.yourOffer || 'Proposed Fare'}</span>
                      <span className="text-2xl font-extrabold text-pakgreen-600">
                        PKR {passengerFare}
                      </span>
                      <span className="text-[10px] text-slate-400 block">Trip: {ride.distanceKm} km</span>
                    </div>
                  </div>

                  {/* If offer already submitted for this ride */}
                  {submittedFare ? (
                    <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between">
                      <div className="flex items-center space-x-2 text-xs font-bold text-emerald-800">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                        <span>Offer of PKR {submittedFare} Sent (Waiting for Passenger)</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleSend(ride.id, submittedFare + 20)}
                        disabled={submittingRideId === ride.id}
                        className="text-xs font-bold text-emerald-700 hover:underline"
                      >
                        +20 Raise
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2 pt-1">
                      {/* Counteroffer Controls with 1-Tap Quick Increment Pills */}
                      <div className="bg-slate-50 p-2 rounded-xl flex flex-wrap items-center justify-between gap-2 border border-slate-200">
                        <div className="flex items-center space-x-1">
                          <span className="text-[11px] font-bold text-slate-500 mr-1">Bid Counter:</span>
                          <button
                            type="button"
                            onClick={() =>
                              setCounterValues({ ...counterValues, [ride.id]: passengerFare + 20 })
                            }
                            className="px-2.5 py-1 bg-white border border-slate-300 hover:border-pakgreen-500 rounded-lg text-xs font-bold text-pakgreen-700 shadow-2xs transition"
                          >
                            +20
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setCounterValues({ ...counterValues, [ride.id]: passengerFare + 50 })
                            }
                            className="px-2.5 py-1 bg-white border border-slate-300 hover:border-pakgreen-500 rounded-lg text-xs font-bold text-pakgreen-700 shadow-2xs transition"
                          >
                            +50
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setCounterValues({ ...counterValues, [ride.id]: passengerFare + 100 })
                            }
                            className="px-2.5 py-1 bg-white border border-slate-300 hover:border-pakgreen-500 rounded-lg text-xs font-bold text-pakgreen-700 shadow-2xs transition"
                          >
                            +100
                          </button>
                        </div>

                        <div className="flex items-center space-x-1.5">
                          <span className="text-xs font-semibold text-slate-500">PKR</span>
                          <input
                            type="number"
                            step="10"
                            value={currentCounter}
                            onChange={(e) =>
                              setCounterValues({ ...counterValues, [ride.id]: Number(e.target.value) })
                            }
                            className="w-20 px-2 py-1 text-sm font-bold border border-slate-300 rounded-lg bg-white text-right outline-none focus:border-pakgreen-500"
                          />
                        </div>
                      </div>

                      {/* 1-Tap Acceptance / Counteroffer Button (Uber & inDrive Style) */}
                      <button
                        type="button"
                        disabled={submittingRideId === ride.id}
                        onClick={() => handleSend(ride.id, currentCounter)}
                        className="w-full bg-pakgreen-600 hover:bg-pakgreen-700 text-white font-bold py-3 rounded-xl text-sm transition flex items-center justify-center space-x-2 shadow-sm disabled:opacity-50"
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
