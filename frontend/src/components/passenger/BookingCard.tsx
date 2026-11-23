import React from 'react';
import { Car, Bike, Navigation, Clock, Sparkles } from 'lucide-react';
import { LocationCoordinates, VehicleCategory } from '../../shared/types';
import { LocationSearchInput } from '../LocationSearchInput';
import { GeocodingService } from '../../services/geocoding';

interface BookingCardProps {
  category: VehicleCategory;
  setCategory: (c: VehicleCategory) => void;
  pickup: LocationCoordinates;
  setPickup: (loc: LocationCoordinates) => void;
  destination: LocationCoordinates;
  setDestination: (loc: LocationCoordinates) => void;
  recentChips: LocationCoordinates[];
  fareEstimate: any;
  proposedFarePkr: number;
  setProposedFarePkr: (fare: number) => void;
  pickupNotes: string;
  setPickupNotes: (notes: string) => void;
  notePresets: string[];
  isLocatingGps: boolean;
  onLocateGps: () => void;
  onRequestRide: () => void;
  loading: boolean;
  t: any;
}

export const BookingCard: React.FC<BookingCardProps> = ({
  category,
  setCategory,
  pickup,
  setPickup,
  destination,
  setDestination,
  recentChips,
  fareEstimate,
  proposedFarePkr,
  setProposedFarePkr,
  pickupNotes,
  setPickupNotes,
  notePresets,
  isLocatingGps,
  onLocateGps,
  onRequestRide,
  loading,
  t
}) => {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 space-y-4">
      {/* Category Header */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xl font-bold text-charcoal-900">
            {t.selectCategory || 'Choose Your Ride'}
          </h2>
          <span className="text-xs bg-pakgreen-100 text-pakgreen-800 px-2.5 py-1 rounded-full font-bold">
            Direct Bidding
          </span>
        </div>

        {/* GPS location pill */}
        <div className="flex items-center justify-between bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs">
          <div className="flex items-center space-x-2 truncate pr-2">
            <span className="w-2.5 h-2.5 rounded-full bg-pakgreen-500 animate-pulse flex-shrink-0"></span>
            <span className="text-slate-700 font-semibold truncate">
              📍 {pickup?.address ? pickup.address.split(',')[0] : 'Current Location'}
            </span>
          </div>
          <button
            type="button"
            onClick={onLocateGps}
            disabled={isLocatingGps}
            className="text-pakgreen-700 hover:text-pakgreen-800 font-bold text-[11px] flex items-center space-x-1 flex-shrink-0 bg-white border border-slate-200 px-2.5 py-1 rounded-lg shadow-2xs hover:bg-slate-50 transition"
          >
            <Navigation className={`w-3 h-3 ${isLocatingGps ? 'animate-spin' : ''}`} />
            <span>{isLocatingGps ? 'Locating...' : 'Locate Me'}</span>
          </button>
        </div>
      </div>

      {/* Category Buttons */}
      <div className="grid grid-cols-3 gap-2">
        <button
          type="button"
          onClick={() => setCategory('CAR')}
          className={`p-3 rounded-xl border flex flex-col items-center space-y-1 transition ${
            category === 'CAR'
              ? 'border-pakgreen-500 bg-pakgreen-50 text-pakgreen-700 shadow-xs'
              : 'border-slate-200 hover:border-slate-300 text-slate-600'
          }`}
        >
          <Car className="w-6 h-6" />
          <span className="font-semibold text-xs">{t.car || 'Car'}</span>
          <span className="text-[10px] text-slate-400">4 Seats</span>
        </button>

        <button
          type="button"
          onClick={() => setCategory('MOTORCYCLE')}
          className={`p-3 rounded-xl border flex flex-col items-center space-y-1 transition ${
            category === 'MOTORCYCLE'
              ? 'border-pakgreen-500 bg-pakgreen-50 text-pakgreen-700 shadow-xs'
              : 'border-slate-200 hover:border-slate-300 text-slate-600'
          }`}
        >
          <Bike className="w-6 h-6" />
          <span className="font-semibold text-xs">{t.motorcycle || 'Motorcycle'}</span>
          <span className="text-[10px] text-slate-400">1 Rider</span>
        </button>

        <button
          type="button"
          onClick={() => setCategory('RICKSHAW')}
          className={`p-3 rounded-xl border flex flex-col items-center space-y-1 transition ${
            category === 'RICKSHAW'
              ? 'border-pakgreen-500 bg-pakgreen-50 text-pakgreen-700 shadow-xs'
              : 'border-slate-200 hover:border-slate-300 text-slate-600'
          }`}
        >
          <Navigation className="w-6 h-6" />
          <span className="font-semibold text-xs">{t.rickshaw || 'Rickshaw'}</span>
          <span className="text-[10px] text-slate-400">3 Seats</span>
        </button>
      </div>

      {/* Location Search Inputs */}
      <div className="space-y-3">
        <LocationSearchInput
          label={t.pickupLocation || 'Pickup Location'}
          iconColor="bg-emerald-500"
          value={pickup}
          onChange={(loc) => setPickup(loc)}
          placeholder="Where should we pick you up?..."
          userLocation={pickup ? { lat: pickup.lat, lng: pickup.lng } : undefined}
          showGpsButton={true}
          onLocateGps={onLocateGps}
          isLocating={isLocatingGps}
        />

        <LocationSearchInput
          label={t.destinationLocation || 'Destination'}
          iconColor="bg-red-500"
          value={destination}
          onChange={(loc) => setDestination(loc)}
          placeholder="Where to? (e.g. Centaurus, Faisal Masjid, Jauhar...)"
          userLocation={pickup ? { lat: pickup.lat, lng: pickup.lng } : undefined}
        />

        {/* Quick Places Chips */}
        {recentChips.length > 0 && (
          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center space-x-1">
              <Clock className="w-3 h-3 text-slate-400" />
              <span>Quick Places:</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {recentChips.slice(0, 5).map((hub, idx) => (
                <button
                  key={`${hub.address}-${idx}`}
                  type="button"
                  onClick={() => {
                    setDestination(hub);
                    GeocodingService.saveRecentLocation(hub);
                  }}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition truncate max-w-[200px]"
                >
                  {hub.landmark || hub.address.split(',')[0]}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Fare Proposal & Negotiation */}
      {fareEstimate && (
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-500">Trip Distance:</span>
            <span className="font-bold text-charcoal-900">{fareEstimate.distanceKm} km</span>
          </div>

          <div className="flex justify-between items-center">
            <div>
              <span className="text-xs text-slate-500 block">Suggested Fare:</span>
              <span className="text-base font-bold text-slate-700">PKR {fareEstimate.suggestedFarePkr}</span>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-500 block">Your Proposed Fare:</span>
              <span className="text-2xl font-extrabold text-pakgreen-600">PKR {proposedFarePkr}</span>
            </div>
          </div>

          {/* Quick Adjustment Pills */}
          <div className="flex items-center space-x-2 pt-1">
            <button
              type="button"
              onClick={() => setProposedFarePkr(Math.max(50, proposedFarePkr - 20))}
              className="px-3 py-1 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg text-xs font-bold text-slate-700 transition"
            >
              -20
            </button>
            <button
              type="button"
              onClick={() => setProposedFarePkr(proposedFarePkr + 20)}
              className="px-3 py-1 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg text-xs font-bold text-slate-700 transition"
            >
              +20
            </button>
            <button
              type="button"
              onClick={() => setProposedFarePkr(proposedFarePkr + 50)}
              className="px-3 py-1 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg text-xs font-bold text-slate-700 transition"
            >
              +50
            </button>
            <button
              type="button"
              onClick={() => setProposedFarePkr(proposedFarePkr + 100)}
              className="px-3 py-1 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg text-xs font-bold text-slate-700 transition"
            >
              +100
            </button>
          </div>
        </div>
      )}

      {/* Gate Notes */}
      <div>
        <label className="text-xs font-bold text-slate-700 block mb-1">
          {t.pickupNotes || 'Pickup Gate Note'}
        </label>
        <input
          type="text"
          placeholder="e.g. Near White Gate, Call upon arrival..."
          value={pickupNotes}
          onChange={(e) => setPickupNotes(e.target.value)}
          className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-pakgreen-500 outline-none"
        />
        <div className="flex flex-wrap gap-1.5 mt-2">
          {notePresets.map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => setPickupNotes(preset)}
              className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded text-[11px] font-semibold transition"
            >
              {preset}
            </button>
          ))}
        </div>
      </div>

      {/* Book Button */}
      <button
        type="button"
        disabled={loading || !pickup || !destination}
        onClick={onRequestRide}
        className="w-full py-3.5 bg-pakgreen-500 hover:bg-pakgreen-600 text-white font-bold text-sm rounded-xl shadow-md transition disabled:opacity-50"
      >
        {loading ? 'Submitting Request...' : `${t.bookRide || 'Request Ride'} (PKR ${proposedFarePkr || 150})`}
      </button>
    </div>
  );
};
