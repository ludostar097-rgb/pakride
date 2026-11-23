import React from 'react';
import { Car, Bike, Navigation, Clock, Sparkles, Plus, Minus, Check, MapPin } from 'lucide-react';
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
  fareEstimate: {
    distanceKm: number;
    estimatedMinutes: number;
    suggestedFarePkr: number;
    estimatesByCategory?: {
      CAR: number;
      MOTORCYCLE: number;
      RICKSHAW: number;
    };
    zoneName?: string;
  } | null;
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
  detectedCity?: string;
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
  t,
  detectedCity = 'Karachi'
}) => {
  const carPrice = fareEstimate?.estimatesByCategory?.CAR ?? fareEstimate?.suggestedFarePkr ?? 250;
  const motoPrice = fareEstimate?.estimatesByCategory?.MOTORCYCLE ?? Math.max(80, Math.round((fareEstimate?.suggestedFarePkr ?? 250) * 0.45));
  const rickPrice = fareEstimate?.estimatesByCategory?.RICKSHAW ?? Math.max(120, Math.round((fareEstimate?.suggestedFarePkr ?? 250) * 0.7));

  const handleCategorySelect = (newCat: VehicleCategory) => {
    setCategory(newCat);
    if (newCat === 'CAR') setProposedFarePkr(carPrice);
    else if (newCat === 'MOTORCYCLE') setProposedFarePkr(motoPrice);
    else if (newCat === 'RICKSHAW') setProposedFarePkr(rickPrice);
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 space-y-5">
      {/* 1. Header with direct bidding reassurance */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
        <div>
          <h2 className="text-lg font-extrabold text-charcoal-900 tracking-tight">
            {t.selectCategory || 'Choose Your Ride'}
          </h2>
          <p className="text-xs text-slate-500">
            Transparent Bidding • 0% Platform Commission
          </p>
        </div>
        <span className="text-[11px] font-bold bg-pakgreen-50 text-pakgreen-700 border border-pakgreen-200 px-2.5 py-1 rounded-full flex items-center space-x-1">
          <span className="w-1.5 h-1.5 rounded-full bg-pakgreen-500 animate-pulse"></span>
          <span>inDrive Bidding</span>
        </span>
      </div>

      {/* 2. ROUTE SETUP: Pickup & Destination (Uber / inDrive / Careem Flow) */}
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

        {/* Quick Suggested Places */}
        {recentChips.length > 0 && (
          <div className="pt-1">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center space-x-1">
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
                  className="px-2.5 py-1 bg-slate-50 hover:bg-slate-100 border border-slate-200 hover:border-slate-300 text-slate-700 rounded-lg text-xs font-semibold transition truncate max-w-[200px]"
                >
                  {hub.landmark || hub.address.split(',')[0]}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 3. VEHICLE CATEGORIES: Comparative Pricing (Uber / Careem / Bykea Style) */}
      <div>
        <div className="text-xs font-bold text-slate-600 mb-2 flex items-center justify-between">
          <span>Select Vehicle Tier</span>
          {fareEstimate && (
            <span className="text-[11px] text-slate-400 font-normal">
              {fareEstimate.distanceKm} km • ~{fareEstimate.estimatedMinutes} mins
            </span>
          )}
        </div>

        <div className="grid grid-cols-3 gap-2.5">
          {/* CAR TIER */}
          <button
            type="button"
            onClick={() => handleCategorySelect('CAR')}
            className={`p-3 rounded-xl border-2 flex flex-col items-center justify-between transition relative text-left ${
              category === 'CAR'
                ? 'border-pakgreen-500 bg-pakgreen-50/60 text-pakgreen-950 shadow-sm'
                : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
            }`}
          >
            {category === 'CAR' && (
              <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-pakgreen-500 text-white rounded-full flex items-center justify-center text-[10px]">
                <Check className="w-2.5 h-2.5 stroke-[3]" />
              </span>
            )}
            <Car className={`w-6 h-6 mb-1 ${category === 'CAR' ? 'text-pakgreen-600' : 'text-slate-500'}`} />
            <span className="font-bold text-xs text-center">{t.car || 'Car (AC)'}</span>
            <span className="text-[10px] text-slate-400">4 Seats</span>
            <span className="mt-1 text-xs font-extrabold text-pakgreen-700 bg-white px-2 py-0.5 rounded-md border border-slate-200">
              PKR {carPrice}
            </span>
          </button>

          {/* MOTORCYCLE TIER */}
          <button
            type="button"
            onClick={() => handleCategorySelect('MOTORCYCLE')}
            className={`p-3 rounded-xl border-2 flex flex-col items-center justify-between transition relative text-left ${
              category === 'MOTORCYCLE'
                ? 'border-pakgreen-500 bg-pakgreen-50/60 text-pakgreen-950 shadow-sm'
                : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
            }`}
          >
            {category === 'MOTORCYCLE' && (
              <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-pakgreen-500 text-white rounded-full flex items-center justify-center text-[10px]">
                <Check className="w-2.5 h-2.5 stroke-[3]" />
              </span>
            )}
            <Bike className={`w-6 h-6 mb-1 ${category === 'MOTORCYCLE' ? 'text-pakgreen-600' : 'text-slate-500'}`} />
            <span className="font-bold text-xs text-center">{t.motorcycle || 'Bike / سواری'}</span>
            <span className="text-[10px] text-slate-400">1 Rider</span>
            <span className="mt-1 text-xs font-extrabold text-pakgreen-700 bg-white px-2 py-0.5 rounded-md border border-slate-200">
              PKR {motoPrice}
            </span>
          </button>

          {/* RICKSHAW TIER */}
          <button
            type="button"
            onClick={() => handleCategorySelect('RICKSHAW')}
            className={`p-3 rounded-xl border-2 flex flex-col items-center justify-between transition relative text-left ${
              category === 'RICKSHAW'
                ? 'border-pakgreen-500 bg-pakgreen-50/60 text-pakgreen-950 shadow-sm'
                : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
            }`}
          >
            {category === 'RICKSHAW' && (
              <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-pakgreen-500 text-white rounded-full flex items-center justify-center text-[10px]">
                <Check className="w-2.5 h-2.5 stroke-[3]" />
              </span>
            )}
            <Navigation className={`w-6 h-6 mb-1 ${category === 'RICKSHAW' ? 'text-pakgreen-600' : 'text-slate-500'}`} />
            <span className="font-bold text-xs text-center">{t.rickshaw || 'Auto / رکشہ'}</span>
            <span className="text-[10px] text-slate-400">3 Seats</span>
            <span className="mt-1 text-xs font-extrabold text-pakgreen-700 bg-white px-2 py-0.5 rounded-md border border-slate-200">
              PKR {rickPrice}
            </span>
          </button>
        </div>
      </div>

      {/* 4. inDrive FARE NEGOTIATION / BIDDING STEPPER */}
      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-700 block">Offer Your Fare</span>
            {fareEstimate && (
              <span className="text-[11px] text-slate-500">
                Recommended: PKR {fareEstimate.suggestedFarePkr}
              </span>
            )}
          </div>
          <span className="text-xs font-semibold text-pakgreen-700 bg-pakgreen-100/70 px-2 py-0.5 rounded-md">
            Cash on Arrival
          </span>
        </div>

        {/* Big Stepper */}
        <div className="flex items-center justify-between bg-white border-2 border-slate-200 rounded-xl p-2 shadow-2xs">
          <button
            type="button"
            onClick={() => setProposedFarePkr(Math.max(50, proposedFarePkr - 20))}
            className="w-10 h-10 rounded-lg bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 font-bold flex items-center justify-center transition"
            aria-label="Decrease Fare"
          >
            <Minus className="w-4 h-4" />
          </button>

          <div className="text-center">
            <span className="text-2xl font-black text-charcoal-900 tracking-tight">
              PKR {proposedFarePkr}
            </span>
          </div>

          <button
            type="button"
            onClick={() => setProposedFarePkr(proposedFarePkr + 20)}
            className="w-10 h-10 rounded-lg bg-pakgreen-500 hover:bg-pakgreen-600 active:bg-pakgreen-700 text-white font-bold flex items-center justify-center transition shadow-xs"
            aria-label="Increase Fare"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* Quick Bump Pills */}
        <div className="grid grid-cols-4 gap-1.5 pt-1">
          <button
            type="button"
            onClick={() => setProposedFarePkr(Math.max(50, proposedFarePkr - 20))}
            className="py-1.5 px-2 bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-100 rounded-lg text-xs font-bold text-slate-600 transition text-center"
          >
            -20
          </button>
          <button
            type="button"
            onClick={() => setProposedFarePkr(proposedFarePkr + 20)}
            className="py-1.5 px-2 bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-100 rounded-lg text-xs font-bold text-slate-700 transition text-center"
          >
            +20
          </button>
          <button
            type="button"
            onClick={() => setProposedFarePkr(proposedFarePkr + 50)}
            className="py-1.5 px-2 bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-100 rounded-lg text-xs font-bold text-slate-700 transition text-center"
          >
            +50
          </button>
          <button
            type="button"
            onClick={() => setProposedFarePkr(proposedFarePkr + 100)}
            className="py-1.5 px-2 bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-100 rounded-lg text-xs font-bold text-slate-700 transition text-center"
          >
            +100
          </button>
        </div>
      </div>

      {/* 5. Gate Notes / Instructions */}
      <div>
        <label className="text-xs font-bold text-slate-700 block mb-1">
          {t.pickupNotes || 'Pickup Gate Note'} (Optional)
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
              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-[11px] font-semibold transition"
            >
              {preset}
            </button>
          ))}
        </div>
      </div>

      {/* 6. Primary Action CTA Button (Find Captain) */}
      <button
        type="button"
        disabled={loading || !pickup || !destination}
        onClick={onRequestRide}
        className="w-full py-4 bg-pakgreen-600 hover:bg-pakgreen-700 active:bg-pakgreen-800 text-white font-extrabold text-sm rounded-xl shadow-md transition flex items-center justify-center space-x-2 disabled:opacity-50"
      >
        <Car className="w-4 h-4" />
        <span>
          {loading
            ? 'Dispatching Request...'
            : `Find Captain • PKR ${proposedFarePkr || carPrice}`}
        </span>
      </button>

      <div className="text-center text-[11px] text-slate-400">
        100% Cash payment to Captain • No surge pricing • No commission cuts
      </div>
    </div>
  );
};