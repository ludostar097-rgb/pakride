import React from 'react';
import { Car, Bike, Navigation, Clock, Sparkles, Plus, Minus, Check, MapPin, Zap } from 'lucide-react';
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
    <div className="glass-panel p-6 space-y-5 border border-white/80 dark:border-white/10 shadow-2xl transition-all">
      {/* 1. Header with Modern Frosted Badging */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-200/50 dark:border-white/10">
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
            {t.selectCategory || 'Choose Your Ride'}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            Transparent Bidding • 0% Platform Commission
          </p>
        </div>
        <span className="text-[11px] font-extrabold bg-emerald-500/10 text-emerald-800 dark:text-emerald-400 border border-emerald-500/20 backdrop-blur-md px-3 py-1 rounded-full flex items-center space-x-1.5 shadow-2xs">
          <span className="w-2 h-2 rounded-full bg-pakgreen-500 animate-pulse"></span>
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
            <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5 flex items-center space-x-1">
              <Clock className="w-3 h-3 text-slate-400 dark:text-slate-500" />
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
                  className="px-2.5 py-1 bg-white/75 dark:bg-slate-800/70 hover:bg-white dark:hover:bg-slate-700 backdrop-blur-md border border-slate-200/80 dark:border-white/10 hover:border-pakgreen-400 dark:hover:border-emerald-500 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold transition truncate max-w-[200px] shadow-2xs active:scale-95"
                >
                  {hub.landmark || hub.address.split(',')[0]}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 3. VEHICLE CATEGORIES: Modern Glass Cards with Dynamic Pricing */}
      <div>
        <div className="text-xs font-bold text-slate-600 dark:text-slate-400 mb-2 flex items-center justify-between">
          <span className="font-extrabold text-slate-800 dark:text-slate-200">Select Vehicle Tier</span>
          {fareEstimate && (
            <span className="text-[11px] text-emerald-800 dark:text-emerald-300 bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-500/30 px-2 py-0.5 rounded-full font-semibold">
              {fareEstimate.distanceKm} km • ~{fareEstimate.estimatedMinutes} mins
            </span>
          )}
        </div>

        <div className="grid grid-cols-3 gap-2.5">
          {/* CAR TIER */}
          <button
            type="button"
            onClick={() => handleCategorySelect('CAR')}
            className={`p-3.5 rounded-2xl flex flex-col items-center justify-between text-left relative transition-all duration-200 ${
              category === 'CAR'
                ? 'glass-card-active scale-[1.02]'
                : 'glass-card hover:bg-white/90 dark:hover:bg-slate-800/90'
            }`}
          >
            {category === 'CAR' && (
              <span className="absolute top-2 right-2 w-4 h-4 bg-pakgreen-600 text-white rounded-full flex items-center justify-center text-[10px] shadow-xs">
                <Check className="w-2.5 h-2.5 stroke-[3]" />
              </span>
            )}
            <div className={`p-2 rounded-xl mb-1 ${category === 'CAR' ? 'bg-pakgreen-600/15 text-pakgreen-700 dark:text-emerald-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}`}>
              <Car className="w-6 h-6" />
            </div>
            <span className="font-extrabold text-xs text-center text-slate-900 dark:text-white">{t.car || 'Car (AC)'}</span>
            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">4 Seats</span>
            <span className="mt-1.5 text-xs font-black text-pakgreen-800 dark:text-emerald-300 bg-white/90 dark:bg-slate-900/90 px-2.5 py-0.5 rounded-lg border border-slate-200/80 dark:border-white/10 shadow-2xs">
              PKR {carPrice}
            </span>
          </button>

          {/* MOTORCYCLE TIER */}
          <button
            type="button"
            onClick={() => handleCategorySelect('MOTORCYCLE')}
            className={`p-3.5 rounded-2xl flex flex-col items-center justify-between text-left relative transition-all duration-200 ${
              category === 'MOTORCYCLE'
                ? 'glass-card-active scale-[1.02]'
                : 'glass-card hover:bg-white/90 dark:hover:bg-slate-800/90'
            }`}
          >
            {category === 'MOTORCYCLE' && (
              <span className="absolute top-2 right-2 w-4 h-4 bg-pakgreen-600 text-white rounded-full flex items-center justify-center text-[10px] shadow-xs">
                <Check className="w-2.5 h-2.5 stroke-[3]" />
              </span>
            )}
            <div className={`p-2 rounded-xl mb-1 ${category === 'MOTORCYCLE' ? 'bg-pakgreen-600/15 text-pakgreen-700 dark:text-emerald-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}`}>
              <Bike className="w-6 h-6" />
            </div>
            <span className="font-extrabold text-xs text-center text-slate-900 dark:text-white">{t.motorcycle || 'Bike / سواری'}</span>
            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">1 Rider</span>
            <span className="mt-1.5 text-xs font-black text-pakgreen-800 dark:text-emerald-300 bg-white/90 dark:bg-slate-900/90 px-2.5 py-0.5 rounded-lg border border-slate-200/80 dark:border-white/10 shadow-2xs">
              PKR {motoPrice}
            </span>
          </button>

          {/* RICKSHAW TIER */}
          <button
            type="button"
            onClick={() => handleCategorySelect('RICKSHAW')}
            className={`p-3.5 rounded-2xl flex flex-col items-center justify-between text-left relative transition-all duration-200 ${
              category === 'RICKSHAW'
                ? 'glass-card-active scale-[1.02]'
                : 'glass-card hover:bg-white/90 dark:hover:bg-slate-800/90'
            }`}
          >
            {category === 'RICKSHAW' && (
              <span className="absolute top-2 right-2 w-4 h-4 bg-pakgreen-600 text-white rounded-full flex items-center justify-center text-[10px] shadow-xs">
                <Check className="w-2.5 h-2.5 stroke-[3]" />
              </span>
            )}
            <div className={`p-2 rounded-xl mb-1 ${category === 'RICKSHAW' ? 'bg-pakgreen-600/15 text-pakgreen-700 dark:text-emerald-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}`}>
              <Navigation className="w-6 h-6" />
            </div>
            <span className="font-extrabold text-xs text-center text-slate-900 dark:text-white">{t.rickshaw || 'Auto / رکشہ'}</span>
            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">3 Seats</span>
            <span className="mt-1.5 text-xs font-black text-pakgreen-800 dark:text-emerald-300 bg-white/90 dark:bg-slate-900/90 px-2.5 py-0.5 rounded-lg border border-slate-200/80 dark:border-white/10 shadow-2xs">
              PKR {rickPrice}
            </span>
          </button>
        </div>
      </div>

      {/* 4. inDrive FARE NEGOTIATION / FROSTED STEPPER */}
      <div className="glass-panel-subtle p-4 border border-white/80 dark:border-white/10 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs font-extrabold text-slate-800 dark:text-slate-200 block">Offer Your Fare</span>
            {fareEstimate && (
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                Recommended: PKR {fareEstimate.suggestedFarePkr}
              </span>
            )}
          </div>
          <span className="text-xs font-extrabold text-emerald-800 dark:text-emerald-300 bg-emerald-500/10 dark:bg-emerald-950/40 border border-emerald-500/20 dark:border-emerald-500/30 px-2.5 py-0.5 rounded-full">
            Cash on Arrival
          </span>
        </div>

        {/* Big Frosted Stepper */}
        <div className="flex items-center justify-between bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200/80 dark:border-white/10 rounded-2xl p-2 shadow-inner">
          <button
            type="button"
            onClick={() => setProposedFarePkr(Math.max(50, proposedFarePkr - 20))}
            className="w-11 h-11 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-95 text-slate-700 dark:text-slate-200 font-black flex items-center justify-center transition shadow-2xs"
            aria-label="Decrease Fare"
          >
            <Minus className="w-4 h-4 stroke-[3]" />
          </button>

          <div className="text-center">
            <span className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              PKR {proposedFarePkr}
            </span>
          </div>

          <button
            type="button"
            onClick={() => setProposedFarePkr(proposedFarePkr + 20)}
            className="w-11 h-11 rounded-xl glass-btn-primary active:scale-95 text-white font-black flex items-center justify-center transition shadow-md shadow-pakgreen-600/30"
            aria-label="Increase Fare"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
          </button>
        </div>

        {/* Quick Bump Pills */}
        <div className="grid grid-cols-4 gap-2 pt-1">
          <button
            type="button"
            onClick={() => setProposedFarePkr(Math.max(50, proposedFarePkr - 20))}
            className="glass-btn-secondary py-1.5 px-2 text-xs font-bold text-slate-700 dark:text-slate-200 hover:text-pakgreen-700 dark:hover:text-emerald-400 transition text-center active:scale-95"
          >
            -20
          </button>
          <button
            type="button"
            onClick={() => setProposedFarePkr(proposedFarePkr + 20)}
            className="glass-btn-secondary py-1.5 px-2 text-xs font-bold text-slate-700 dark:text-slate-200 hover:text-pakgreen-700 dark:hover:text-emerald-400 transition text-center active:scale-95"
          >
            +20
          </button>
          <button
            type="button"
            onClick={() => setProposedFarePkr(proposedFarePkr + 50)}
            className="glass-btn-secondary py-1.5 px-2 text-xs font-bold text-slate-700 dark:text-slate-200 hover:text-pakgreen-700 dark:hover:text-emerald-400 transition text-center active:scale-95"
          >
            +50
          </button>
          <button
            type="button"
            onClick={() => setProposedFarePkr(proposedFarePkr + 100)}
            className="glass-btn-secondary py-1.5 px-2 text-xs font-bold text-slate-700 dark:text-slate-200 hover:text-pakgreen-700 dark:hover:text-emerald-400 transition text-center active:scale-95"
          >
            +100
          </button>
        </div>
      </div>

      {/* 5. Gate Notes / Instructions */}
      <div>
        <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300 block mb-1">
          {t.pickupNotes || 'Pickup Gate Note'} (Optional)
        </label>
        <input
          type="text"
          placeholder="e.g. Near White Gate, Call upon arrival..."
          value={pickupNotes}
          onChange={(e) => setPickupNotes(e.target.value)}
          className="glass-input w-full px-3.5 py-2.5 text-xs text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none"
        />
        <div className="flex flex-wrap gap-1.5 mt-2">
          {notePresets.map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => setPickupNotes(preset)}
              className="px-2.5 py-1 bg-white/70 dark:bg-slate-800/70 hover:bg-white dark:hover:bg-slate-700 backdrop-blur-sm border border-slate-200/80 dark:border-white/10 text-slate-600 dark:text-slate-300 rounded-xl text-[11px] font-semibold transition active:scale-95 shadow-2xs"
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
        className="w-full py-4 glass-btn-primary text-white font-black text-sm rounded-2xl shadow-xl shadow-pakgreen-600/30 transition flex items-center justify-center space-x-2 disabled:opacity-50 active:scale-[0.99]"
      >
        <Car className="w-4 h-4" />
        <span>
          {loading
            ? 'Dispatching Request...'
            : `Find Captain • PKR ${proposedFarePkr || carPrice}`}
        </span>
      </button>

      <div className="text-center text-[11px] text-slate-500 dark:text-slate-400 font-medium">
        100% Cash payment to Captain • No surge pricing • No commission cuts
      </div>
    </div>
  );
};