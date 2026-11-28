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

  // Filter pending offers (resilient 3-minute inDrive window)
  const activeOffers = offers.filter((o) => o.status === 'PENDING' || !o.status);

  return (
    <div className="airbnb-card p-6 shadow-xl space-y-4 transition-all">
      <div className="flex justify-between items-center pb-2.5 border-b border-neutral-100 dark:border-white/10">
        <h3 className="font-black text-sm text-slate-900 dark:text-white flex items-center space-x-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>{t.driverOffers || 'Incoming Driver Offers'}</span>
        </h3>
        <span className="text-xs text-emerald-800 dark:text-emerald-300 bg-emerald-500/10 dark:bg-emerald-950/40 border border-emerald-500/20 dark:border-emerald-500/30 px-3 py-0.5 rounded-full font-extrabold">
          {activeOffers.length} live {activeOffers.length === 1 ? 'offer' : 'offers'}
        </span>
      </div>

      {activeOffers.length === 0 ? (
        <div className="text-center py-8 text-slate-400 text-xs space-y-2 airbnb-card-subtle p-6 rounded-2xl border border-dashed border-neutral-300 dark:border-white/10">
          <Clock className="w-7 h-7 mx-auto text-emerald-600 dark:text-emerald-400 animate-spin" />
          <p className="font-extrabold text-slate-700 dark:text-slate-200 text-sm">{t.noOffersYet || 'Waiting for nearby driver offers...'}</p>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
            Captains are reviewing your request. When a captain accepts or bids, their card will appear here instantly.
          </p>
        </div>
      ) : (
        <div className="space-y-3.5">
          {activeOffers.map((offer) => {
            const offerPkr = Math.round(offer.counterFarePaisa / 100);
            const isSelected = loadingOfferId === offer.id;

            const totalDurationMs = 180000; // 3 minutes
            const expireTime = offer.expiresAt
              ? new Date(offer.expiresAt).getTime()
              : new Date(offer.createdAt).getTime() + totalDurationMs;
            const remainingMs = Math.max(0, expireTime - now);
            const secondsLeft = Math.ceil(remainingMs / 1000);
            const progressPercent = Math.min(100, Math.max(0, (remainingMs / totalDurationMs) * 100));

            const barColor =
              secondsLeft > 60
                ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                : secondsLeft > 20
                ? 'bg-gradient-to-r from-amber-500 to-yellow-400'
                : 'bg-gradient-to-r from-red-500 to-rose-400 animate-pulse';

            const timerBadgeColor =
              secondsLeft > 60
                ? 'bg-emerald-500/10 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-500/25 dark:border-emerald-500/30'
                : secondsLeft > 20
                ? 'bg-amber-500/10 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-500/25 dark:border-amber-500/30'
                : 'bg-red-500/10 dark:bg-red-950/40 text-red-800 dark:text-red-300 border-red-500/25 dark:border-red-500/30 animate-pulse font-extrabold';

            return (
              <div
                key={offer.id}
                className="bg-white dark:bg-neutral-900 rounded-2xl overflow-hidden border border-neutral-200 dark:border-white/10 shadow-sm transition-all hover:shadow-md"
              >
                {/* inDrive Live Acceptance Countdown Progress Bar */}
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5">
                  <div
                    className={`h-full transition-all duration-500 ease-linear ${barColor}`}
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>

                <div className="p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <div className="space-y-1.5">
                    <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                      <span className="font-black text-sm text-slate-900 dark:text-white">{offer.driverName}</span>
                      <span className="flex items-center text-xs font-bold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-lg border border-amber-300 dark:border-amber-500/30">
                        <Star className="w-3 h-3 fill-amber-500 text-amber-500 mr-1" />
                        {(offer.driverRating || 4.9).toFixed(1)}
                      </span>
                      {/* Active Countdown Badge */}
                      <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border flex items-center space-x-1 ${timerBadgeColor}`}>
                        <Timer className="w-3 h-3 flex-shrink-0" />
                        <span>{secondsLeft > 0 ? `${secondsLeft}s left` : 'Reviewing'}</span>
                      </span>
                    </div>

                    <div className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                      {offer.driverVehicle} • <span className="font-extrabold text-emerald-700 dark:text-emerald-400">{offer.etaMinutes || 4} mins away</span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 w-full sm:w-auto justify-between sm:justify-end pt-2 sm:pt-0 border-t sm:border-0 border-neutral-100 dark:border-white/10">
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-black block">Captain Offer</span>
                      <span className="text-2xl font-black text-emerald-700 dark:text-emerald-400 tracking-tight">
                        PKR {offerPkr}
                      </span>
                    </div>

                    <button
                      type="button"
                      disabled={Boolean(loadingOfferId)}
                      onClick={() => onSelectOffer(offer.id)}
                      className="px-5 py-2.5 airbnb-btn-primary text-xs rounded-full shadow-md transition flex items-center space-x-1.5 disabled:opacity-50 active:scale-95"
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