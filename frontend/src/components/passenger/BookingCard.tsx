import React from 'react';
import { Clock, Plus, Minus, Check, MapPin, Zap, Shield, Sparkles } from 'lucide-react';
import { LocationCoordinates, VehicleCategory } from '../../shared/types';
import { LocationSearchInput } from '../LocationSearchInput';
import { GeocodingService } from '../../services/geocoding';
import { CarIcon, MotorcycleIcon, RickshawIcon } from '../common/VehicleIcons';

interface BookingCardProps {
  category: VehicleCategory;
  setCategory: (c: VehicleCategory) => void;
  pickup: LocationCoordinates;
  setPickup: (loc: LocationCoordinates) => void;
  destination: LocationCoordinates | null;
  setDestination: (loc: LocationCoordinates | null) => void;
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
    <div className="airbnb-card p-6 space-y-6">
      {/* 1. Header with Airbnb Modern Badge */}
      <div className="flex items-center justify-between pb-3 border-b border-neutral-100 dark:border-white/10">
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
            {t.selectCategory || 'Choose Your Ride'}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            Transparent Bidding • 0% Platform Commission
          </p>
        </div>
        <span className="text-[11px] font-extrabold bg-emerald-500/10 text-emerald-800 dark:text-emerald-400 border border-emerald-500/20 px-3 py-1 rounded-full flex items-center space-x-1.5 shadow-2xs">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>Live Bidding</span>
        </span>
      </div>

      {/* 2. AIRBNB-STYLE HORIZONTAL CATEGORIES STRIP */}
      <div>
        <div className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-2.5 flex items-center justify-between">
          <span>Vehicle Tier</span>
          {fareEstimate && (
            <span className="text-[11px] text-emerald-700 dark:text-emerald-300 font-semibold bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800/40">
              {fareEstimate.distanceKm} km • ~{fareEstimate.estimatedMinutes} mins
            </span>
          )}
        </div>

        <div className="grid grid-cols-3 gap-2.5">
          {/* CAR TIER */}
          <button
            type="button"
            onClick={() => handleCategorySelect('CAR')}
            className={`p-3.5 rounded-2xl flex flex-col items-center justify-between text-center relative transition-all duration-200 border ${
              category === 'CAR'
                ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 border-neutral-900 dark:border-white shadow-md'
                : 'bg-neutral-50 dark:bg-neutral-800/60 hover:bg-neutral-100 dark:hover:bg-neutral-800 border-neutral-200/80 dark:border-white/10 text-slate-800 dark:text-slate-100'
            }`}
          >
            {category === 'CAR' && (
              <span className="absolute top-2 right-2 w-4 h-4 bg-emerald-500 text-white rounded-full flex items-center justify-center text-[10px] shadow-xs">
                <Check className="w-2.5 h-2.5 stroke-[3]" />
              </span>
            )}
            <div className={`p-2 rounded-xl mb-1.5 ${category === 'CAR' ? 'text-emerald-400 dark:text-emerald-600' : 'text-slate-600 dark:text-slate-300'}`}>
              <CarIcon size={26} />
            </div>
            <span className="font-extrabold text-xs">{t.car || 'Car (AC)'}</span>
            <span className={`text-[10px] font-medium ${category === 'CAR' ? 'text-neutral-300 dark:text-neutral-600' : 'text-slate-400 dark:text-slate-500'}`}>
              4 Seats
            </span>
            <span className={`mt-2 text-xs font-black px-2.5 py-0.5 rounded-lg border ${
              category === 'CAR'
                ? 'bg-neutral-800 text-white dark:bg-neutral-100 dark:text-neutral-900 border-neutral-700 dark:border-neutral-200'
                : 'bg-white dark:bg-neutral-900 text-emerald-700 dark:text-emerald-400 border-neutral-200 dark:border-white/10'
            }`}>
              PKR {carPrice}
            </span>
          </button>

          {/* MOTORCYCLE TIER */}
          <button
            type="button"
            onClick={() => handleCategorySelect('MOTORCYCLE')}
            className={`p-3.5 rounded-2xl flex flex-col items-center justify-between text-center relative transition-all duration-200 border ${
              category === 'MOTORCYCLE'
                ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 border-neutral-900 dark:border-white shadow-md'
                : 'bg-neutral-50 dark:bg-neutral-800/60 hover:bg-neutral-100 dark:hover:bg-neutral-800 border-neutral-200/80 dark:border-white/10 text-slate-800 dark:text-slate-100'
            }`}
          >
            {category === 'MOTORCYCLE' && (
              <span className="absolute top-2 right-2 w-4 h-4 bg-emerald-500 text-white rounded-full flex items-center justify-center text-[10px] shadow-xs">
                <Check className="w-2.5 h-2.5 stroke-[3]" />
              </span>
            )}
            <div className={`p-2 rounded-xl mb-1.5 ${category === 'MOTORCYCLE' ? 'text-emerald-400 dark:text-emerald-600' : 'text-slate-600 dark:text-slate-300'}`}>
              <MotorcycleIcon size={26} />
            </div>
            <span className="font-extrabold text-xs">{t.motorcycle || 'Bike / سواری'}</span>
            <span className={`text-[10px] font-medium ${category === 'MOTORCYCLE' ? 'text-neutral-300 dark:text-neutral-600' : 'text-slate-400 dark:text-slate-500'}`}>
              1 Rider
            </span>
            <span className={`mt-2 text-xs font-black px-2.5 py-0.5 rounded-lg border ${
              category === 'MOTORCYCLE'
                ? 'bg-neutral-800 text-white dark:bg-neutral-100 dark:text-neutral-900 border-neutral-700 dark:border-neutral-200'
                : 'bg-white dark:bg-neutral-900 text-emerald-700 dark:text-emerald-400 border-neutral-200 dark:border-white/10'
            }`}>
              PKR {motoPrice}
            </span>
          </button>

          {/* RICKSHAW TIER */}
          <button
            type="button"
            onClick={() => handleCategorySelect('RICKSHAW')}
            className={`p-3.5 rounded-2xl flex flex-col items-center justify-between text-center relative transition-all duration-200 border ${
              category === 'RICKSHAW'
                ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 border-neutral-900 dark:border-white shadow-md'
                : 'bg-neutral-50 dark:bg-neutral-800/60 hover:bg-neutral-100 dark:hover:bg-neutral-800 border-neutral-200/80 dark:border-white/10 text-slate-800 dark:text-slate-100'
            }`}
          >
            {category === 'RICKSHAW' && (
              <span className="absolute top-2 right-2 w-4 h-4 bg-emerald-500 text-white rounded-full flex items-center justify-center text-[10px] shadow-xs">
                <Check className="w-2.5 h-2.5 stroke-[3]" />
              </span>
            )}
            <div className={`p-2 rounded-xl mb-1.5 ${category === 'RICKSHAW' ? 'text-emerald-400 dark:text-emerald-600' : 'text-slate-600 dark:text-slate-300'}`}>
              <RickshawIcon size={26} />
            </div>
            <span className="font-extrabold text-xs">{t.rickshaw || 'Auto / رکشہ'}</span>
            <span className={`text-[10px] font-medium ${category === 'RICKSHAW' ? 'text-neutral-300 dark:text-neutral-600' : 'text-slate-400 dark:text-slate-500'}`}>
              3 Seats
            </span>
            <span className={`mt-2 text-xs font-black px-2.5 py-0.5 rounded-lg border ${
              category === 'RICKSHAW'
                ? 'bg-neutral-800 text-white dark:bg-neutral-100 dark:text-neutral-900 border-neutral-700 dark:border-neutral-200'
                : 'bg-white dark:bg-neutral-900 text-emerald-700 dark:text-emerald-400 border-neutral-200 dark:border-white/10'
            }`}>
              PKR {rickPrice}
            </span>
          </button>
        </div>
      </div>

      {/* 3. ROUTE SETUP: Pickup & Destination (Airbnb Segmented Style) */}
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

        {/* Quick Suggested Places in Airbnb Pill Format */}
        {recentChips.length > 0 && (
          <div className="pt-1">
            <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5 flex items-center space-x-1">
              <Clock className="w-3 h-3 text-slate-400 dark:text-slate-500" />
              <span>Popular Hubs:</span>
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
                  className="px-3 py-1 bg-neutral-100 dark:bg-neutral-800/80 hover:bg-neutral-200 dark:hover:bg-neutral-700 border border-neutral-200 dark:border-neutral-700 text-slate-700 dark:text-slate-200 rounded-full text-xs font-semibold transition truncate max-w-[200px] active:scale-95 shadow-2xs"
                >
                  {hub.landmark || hub.address.split(',')[0]}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 4. AIRBNB-STYLE FARE STEPPER & BIDDING */}
      <div className="airbnb-card-subtle p-5 space-y-3.5">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs font-extrabold text-slate-900 dark:text-white block">
              Propose Your Fare
            </span>
            {fareEstimate && (
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                Fair market rate: PKR {fareEstimate.suggestedFarePkr}
              </span>
            )}
          </div>
          <span className="text-xs font-extrabold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/50 px-3 py-0.5 rounded-full">
            Cash on Arrival
          </span>
        </div>

        {/* Tactile Airbnb Stepper */}
        <div className="flex items-center justify-between bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-3 shadow-sm">
          <button
            type="button"
            onClick={() => setProposedFarePkr(Math.max(50, proposedFarePkr - 20))}
            className="airbnb-circle-btn"
            aria-label="Decrease Fare"
          >
            <Minus className="w-4 h-4 stroke-[3]" />
          </button>

          <div className="text-center">
            <span className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              PKR {proposedFarePkr}
            </span>
          </div>

          <button
            type="button"
            onClick={() => setProposedFarePkr(proposedFarePkr + 20)}
            className="airbnb-circle-btn"
            aria-label="Increase Fare"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
          </button>
        </div>

        {/* Quick Stepper Pills */}
        <div className="grid grid-cols-4 gap-2 pt-1">
          {[-20, 20, 50, 100].map((delta) => (
            <button
              key={delta}
              type="button"
              onClick={() => setProposedFarePkr(Math.max(50, proposedFarePkr + delta))}
              className="py-1.5 px-2 bg-white dark:bg-neutral-900 hover:bg-neutral-100 dark:hover:bg-neutral-800 border border-neutral-200 dark:border-neutral-800 rounded-full text-xs font-bold text-slate-700 dark:text-slate-200 transition text-center active:scale-95 shadow-2xs"
            >
              {delta > 0 ? `+${delta}` : delta}
            </button>
          ))}
        </div>
      </div>

      {/* 5. Gate Notes / Instructions */}
      <div>
        <label className="text-xs font-extrabold text-slate-800 dark:text-slate-200 block mb-1.5">
          {t.pickupNotes || 'Pickup Gate Note'} (Optional)
        </label>
        <input
          type="text"
          placeholder="e.g. Near White Gate, Call upon arrival..."
          value={pickupNotes}
          onChange={(e) => setPickupNotes(e.target.value)}
          className="w-full px-4 py-2.5 text-xs bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl text-slate-800 dark:text-slate-100 placeholder:text-slate-400 outline-none focus:border-emerald-500 transition"
        />
        <div className="flex flex-wrap gap-1.5 mt-2">
          {notePresets.map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => setPickupNotes(preset)}
              className="px-3 py-1 bg-neutral-100 dark:bg-neutral-800/80 hover:bg-neutral-200 dark:hover:bg-neutral-700 border border-neutral-200/80 dark:border-neutral-700 text-slate-700 dark:text-slate-300 rounded-full text-[11px] font-semibold transition active:scale-95"
            >
              {preset}
            </button>
          ))}
        </div>
      </div>

      {/* 6. Primary Action CTA Button (Airbnb Signature Pill CTA) */}
      <button
        type="button"
        disabled={loading || !pickup || !destination}
        onClick={onRequestRide}
        className="airbnb-btn-primary w-full flex items-center justify-center space-x-2 disabled:opacity-50"
      >
        <Zap className="w-4 h-4 fill-white" />
        <span>
          {loading
            ? 'Dispatching Request...'
            : `Find Captain • PKR ${proposedFarePkr || carPrice}`}
        </span>
      </button>

      <div className="text-center text-[11px] text-slate-500 dark:text-slate-400 font-medium">
        100% Cash payment to Captain • Direct Bidding • 0% Platform Deductions
      </div>
    </div>
  );
};
