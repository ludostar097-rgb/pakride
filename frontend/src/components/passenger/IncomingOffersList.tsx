import React, { useState, useEffect } from 'react';
import { Star, Clock, Car, Check, Timer } from 'lucide-react';
import { RideOffer } from '../../shared/types';

interface IncomingOffersListProps {
  offers: RideOffer[];
  onSelectOffer: (offerId: string) => Promise<void>;
  loadingOfferId: string | null;
  t: any;
}

export const IncomingOffersList: React.FC<IncomingOffersListProps> = ({
  offers,
  onSelectOffer,
  loadingOfferId,
  t
}) => {
  const [now, setNow] = useState<number>(Date.now());

  // High-frequency live countdown ticker (inDrive / Uber style)
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(interval);
  }, []);

  // Filter only active, unexpired offers (25s inDrive window)
  const activeOffers = offers.filter((o) => {
    const expireTime = o.expiresAt
      ? new Date(o.expiresAt).getTime()
      : new Date(o.createdAt).getTime() + 25000;
    return expireTime > now;
  });

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 space-y-3">
      <div className="flex justify-between items-center">
        <h3 className="font-bold text-sm text-charcoal-900 flex items-center space-x-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-pakgreen-500 animate-pulse"></span>
          <span>{t.driverOffers || 'Incoming Driver Offers'}</span>
        </h3>
        <span className="text-xs text-slate-500 font-semibold">
          {activeOffers.length} live {activeOffers.length === 1 ? 'offer' : 'offers'}
        </span>
      </div>

      {activeOffers.length === 0 ? (
        <div className="text-center py-6 text-slate-400 text-xs space-y-2 bg-slate-50 rounded-xl border border-dashed border-slate-200">
          <Clock className="w-6 h-6 mx-auto text-pakgreen-600 animate-spin" />
          <p className="font-semibold text-slate-700">{t.noOffersYet || 'Waiting for nearby driver offers...'}</p>
          <p className="text-[11px] text-slate-400">
            Captains are reviewing your request. Offers will appear here with live acceptance timers.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {activeOffers.map((offer) => {
            const offerPkr = Math.round(offer.counterFarePaisa / 100);
            const isSelected = loadingOfferId === offer.id;

            const expireTime = offer.expiresAt
              ? new Date(offer.expiresAt).getTime()
              : new Date(offer.createdAt).getTime() + 25000;
            const remainingMs = Math.max(0, expireTime - now);
            const secondsLeft = Math.ceil(remainingMs / 1000);
            const progressPercent = Math.min(100, Math.max(0, (remainingMs / 25000) * 100));

            const barColor =
              secondsLeft > 12
                ? 'bg-emerald-500'
                : secondsLeft > 6
                ? 'bg-amber-500'
                : 'bg-red-500 animate-pulse';

            const timerBadgeColor =
              secondsLeft > 12
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : secondsLeft > 6
                ? 'bg-amber-50 text-amber-700 border-amber-200'
                : 'bg-red-50 text-red-700 border-red-200 animate-pulse font-bold';

            return (
              <div
                key={offer.id}
                className="rounded-2xl border-2 border-slate-200 hover:border-pakgreen-500 bg-white shadow-sm overflow-hidden transition"
              >
                {/* inDrive Live Acceptance Countdown Progress Bar */}
                <div className="w-full bg-slate-100 h-1.5">
                  <div
                    className={`h-full transition-all duration-500 ease-linear ${barColor}`}
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>

                <div className="p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                      <span className="font-bold text-sm text-charcoal-900">{offer.driverName}</span>
                      <span className="flex items-center text-xs font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                        <Star className="w-3 h-3 fill-amber-500 text-amber-500 mr-0.5" />
                        {offer.driverRating.toFixed(1)}
                      </span>
                      {/* Active Countdown Badge */}
                      <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border flex items-center space-x-1 ${timerBadgeColor}`}>
                        <Timer className="w-3 h-3 flex-shrink-0" />
                        <span>{secondsLeft}s left</span>
                      </span>
                    </div>

                    <div className="text-xs text-slate-500">
                      {offer.driverVehicle} • <span className="font-semibold text-emerald-700">{offer.etaMinutes} mins away</span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 w-full sm:w-auto justify-between sm:justify-end pt-2 sm:pt-0 border-t sm:border-0 border-slate-100">
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 uppercase font-semibold block">Captain Offer</span>
                      <span className="text-xl font-extrabold text-pakgreen-600">
                        PKR {offerPkr}
                      </span>
                    </div>

                    <button
                      type="button"
                      disabled={Boolean(loadingOfferId)}
                      onClick={() => onSelectOffer(offer.id)}
                      className="px-5 py-2.5 bg-pakgreen-600 hover:bg-pakgreen-700 text-white font-bold text-xs rounded-xl shadow-sm transition flex items-center space-x-1.5 disabled:opacity-50"
                    >
                      <Check className="w-4 h-4 stroke-[3]" />
                      <span>{isSelected ? 'Accepting...' : t.acceptOffer || 'Accept Offer'}</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
