import React, { useState } from 'react';
import { Power, Clock, ArrowRight, MapPin, CheckCircle2 } from 'lucide-react';
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
  const [counterValues, setCounterValues] = useState<Record<string, number>>({});
  const [submittingRideId, setSubmittingRideId] = useState<string | null>(null);

  const handleSend = async (rideId: string, fare: number) => {
    setSubmittingRideId(rideId);
    try {
      await onSubmitOffer(rideId, fare);
    } finally {
      setSubmittingRideId(null);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="font-bold text-charcoal-900 text-base">{t.activeRequests || 'Active Ride Requests'}</h3>
          <p className="text-xs text-slate-500">Sorted by proximity (nearest to your location first)</p>
        </div>
        <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 rounded-full text-slate-600">
          {rides.length} available
        </span>
      </div>

      {!isOnline ? (
        <div className="text-center py-8 text-slate-400 text-sm">
          <Power className="w-8 h-8 mx-auto mb-2 text-slate-300" />
          <p className="font-bold text-slate-600">You are currently OFFLINE</p>
          <p className="text-xs mt-1">Tap "Go Online" above to receive passenger requests near you.</p>
        </div>
      ) : rides.length === 0 ? (
        <div className="text-center py-8 text-slate-400 text-sm">
          <Clock className="w-8 h-8 mx-auto mb-2 text-slate-300 animate-spin" />
          <p>{t.noRequests || 'Searching for passenger requests nearby...'}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {rides.map((ride) => {
            const passengerFare = Math.round(ride.proposedFarePaisa / 100);
            const currentCounter = counterValues[ride.id] || passengerFare;
            const submittedFare = submittedOffers[ride.id];

            return (
              <div
                key={ride.id}
                className="p-4 rounded-xl border-2 border-slate-200 hover:border-pakgreen-400 bg-white transition space-y-3"
              >
                <div className="flex justify-between items-start gap-2">
                  <div>
                    <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                      <span className="text-xs font-bold text-pakgreen-700 bg-pakgreen-50 px-2 py-0.5 rounded-full border border-pakgreen-200">
                        {ride.category}
                      </span>
                      {ride.driverDistanceKm !== undefined && (
                        <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          📍 {ride.driverDistanceKm} km away
                        </span>
                      )}
                      <span className="text-xs text-slate-500">
                        • Trip: {ride.distanceKm} km
                      </span>
                    </div>

                    <div className="font-bold text-sm text-charcoal-900 mt-1.5">
                      🟢 {ride.pickup.address}
                    </div>
                    <div className="font-bold text-sm text-charcoal-900 mt-0.5">
                      🔴 {ride.destination.address}
                    </div>

                    {ride.pickupNotes && (
                      <div className="text-xs text-amber-800 bg-amber-50 px-2.5 py-1 rounded-lg mt-2 border border-amber-200 inline-block">
                        📌 {ride.pickupNotes}
                      </div>
                    )}
                  </div>

                  <div className="text-right flex-shrink-0">
                    <span className="text-xs text-slate-400 block">{t.yourOffer || 'Proposed Fare'}</span>
                    <span className="text-xl font-extrabold text-pakgreen-600">
                      PKR {passengerFare}
                    </span>
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
                      className="text-[11px] font-bold text-emerald-700 hover:underline"
                    >
                      Update Offer
                    </button>
                  </div>
                ) : (
                  <>
                    {/* Counteroffer Controls with 1-Tap Quick Increment Pills */}
                    <div className="bg-slate-50 p-2.5 rounded-lg flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center space-x-1.5">
                        <button
                          type="button"
                          onClick={() =>
                            setCounterValues({ ...counterValues, [ride.id]: passengerFare + 20 })
                          }
                          className="px-2.5 py-1 bg-white border border-slate-300 hover:border-pakgreen-500 rounded-lg text-xs font-bold text-pakgreen-700 shadow-xs"
                        >
                          +20
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setCounterValues({ ...counterValues, [ride.id]: passengerFare + 50 })
                          }
                          className="px-2.5 py-1 bg-white border border-slate-300 hover:border-pakgreen-500 rounded-lg text-xs font-bold text-pakgreen-700 shadow-xs"
                        >
                          +50
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setCounterValues({ ...counterValues, [ride.id]: passengerFare + 100 })
                          }
                          className="px-2.5 py-1 bg-white border border-slate-300 hover:border-pakgreen-500 rounded-lg text-xs font-bold text-pakgreen-700 shadow-xs"
                        >
                          +100
                        </button>
                      </div>

                      <div className="flex items-center space-x-1.5">
                        <span className="text-xs font-semibold text-slate-600">PKR</span>
                        <input
                          type="number"
                          step="10"
                          value={currentCounter}
                          onChange={(e) =>
                            setCounterValues({ ...counterValues, [ride.id]: Number(e.target.value) })
                          }
                          className="w-20 px-2 py-1 text-sm font-bold border border-slate-300 rounded bg-white text-right outline-none"
                        />
                      </div>
                    </div>

                    {/* Submit Offer Button */}
                    <button
                      type="button"
                      disabled={submittingRideId === ride.id}
                      onClick={() => handleSend(ride.id, currentCounter)}
                      className="w-full bg-pakgreen-500 hover:bg-pakgreen-600 text-white font-bold py-2.5 rounded-xl text-xs transition flex items-center justify-center space-x-1.5 shadow-xs disabled:opacity-50"
                    >
                      <span>
                        {submittingRideId === ride.id
                          ? 'Sending Offer...'
                          : currentCounter === passengerFare
                          ? `Accept Ride (PKR ${passengerFare})`
                          : `Send Counteroffer (PKR ${currentCounter})`}
                      </span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
