import React from 'react';
import { Star, Clock, Car, Check } from 'lucide-react';
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
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 space-y-3">
      <div className="flex justify-between items-center">
        <h3 className="font-bold text-sm text-charcoal-900 flex items-center space-x-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-pakgreen-500 animate-pulse"></span>
          <span>{t.driverOffers || 'Incoming Driver Offers'}</span>
        </h3>
        <span className="text-xs text-slate-500 font-semibold">{offers.length} nearby offers</span>
      </div>

      {offers.length === 0 ? (
        <div className="text-center py-6 text-slate-400 text-xs space-y-2 bg-slate-50 rounded-xl border border-dashed border-slate-200">
          <Clock className="w-6 h-6 mx-auto text-pakgreen-600 animate-spin" />
          <p className="font-semibold text-slate-700">{t.noOffersYet || 'Waiting for nearby driver offers...'}</p>
          <p className="text-[11px] text-slate-400">Captains in your area are currently reviewing your proposed fare</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {offers.map((offer) => {
            const offerPkr = Math.round(offer.counterFarePaisa / 100);
            const isSelected = loadingOfferId === offer.id;

            return (
              <div
                key={offer.id}
                className="p-3.5 rounded-xl border-2 border-slate-200 hover:border-pakgreen-500 bg-white transition flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3"
              >
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-sm text-charcoal-900">{offer.driverName}</span>
                    <span className="flex items-center text-xs font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">
                      <Star className="w-3 h-3 fill-amber-500 text-amber-500 mr-0.5" />
                      {offer.driverRating.toFixed(1)}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    {offer.driverVehicle} • ETA: {offer.etaMinutes} mins
                  </div>
                </div>

                <div className="flex items-center space-x-3 w-full sm:w-auto justify-between sm:justify-end">
                  <div className="text-right">
                    <span className="text-xs text-slate-400 block">Offer Fare</span>
                    <span className="text-lg font-extrabold text-pakgreen-600">
                      PKR {offerPkr}
                    </span>
                  </div>

                  <button
                    type="button"
                    disabled={Boolean(loadingOfferId)}
                    onClick={() => onSelectOffer(offer.id)}
                    className="px-4 py-2 bg-pakgreen-500 hover:bg-pakgreen-600 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center space-x-1 disabled:opacity-50"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>{isSelected ? 'Accepting...' : t.acceptOffer || 'Accept Offer'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
