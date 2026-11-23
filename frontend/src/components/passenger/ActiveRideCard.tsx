import React, { useState, useEffect } from 'react';
import {
  KeyRound,
  ShieldAlert,
  Share2,
  Mic,
  XCircle,
  Phone,
  MessageSquare,
  MapPin,
  Clock,
  CheckCircle2,
  Zap,
  Radio,
  Car
} from 'lucide-react';
import { RideRequest } from '../../shared/types';
import { CancelRideModal } from '../common/CancelRideModal';

interface ActiveRideCardProps {
  activeRide: RideRequest;
  onCancelRide: (reason: string) => Promise<void>;
  detectedCity: string;
  onOpenChat?: () => void;
  onOpenSos?: () => void;
  onBumpFare?: (amount: number) => Promise<void>;
  t: any;
}

export const ActiveRideCard: React.FC<ActiveRideCardProps> = ({
  activeRide,
  onCancelRide,
  detectedCity,
  onOpenChat,
  onOpenSos,
  onBumpFare,
  t
}) => {
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [bumpingFare, setBumpingFare] = useState(false);
  const [audioPromptSent, setAudioPromptSent] = useState(false);

  // Live elapsed search timer for inDrive radar screen
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    if (activeRide.status === 'REQUESTED' || activeRide.status === 'OFFERS_OPEN') {
      const startTime = new Date(activeRide.createdAt || Date.now()).getTime();
      const interval = setInterval(() => {
        const secs = Math.max(0, Math.floor((Date.now() - startTime) / 1000));
        setElapsedSeconds(secs);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [activeRide.status, activeRide.createdAt]);

  const farePkr = Math.round((activeRide.agreedFarePaisa || activeRide.proposedFarePaisa) / 100);

  const handleShareWhatsApp = () => {
    const msg = encodeURIComponent(
      `Assalam-o-Alaikum! I am on a PakRide trip in ${detectedCity}.\nDriver: ${activeRide.driverName || 'Assigned Driver'}\nVehicle: ${activeRide.vehicleDetails || 'PakRide'}\nFare: PKR ${farePkr}\nTrack trip safety: https://pakride.pk/track/${activeRide.id}`
    );
    window.open(`https://wa.me/?text=${msg}`, '_blank');
  };

  const handleSimulateAudioNote = () => {
    setAudioPromptSent(true);
    setTimeout(() => setAudioPromptSent(false), 4000);
  };

  const handleConfirmCancel = async (reason: string) => {
    setCancelling(true);
    try {
      await onCancelRide(reason);
      setShowCancelModal(false);
    } finally {
      setCancelling(false);
    }
  };

  const handleBump = async (amount: number) => {
    if (!onBumpFare) return;
    setBumpingFare(true);
    try {
      await onBumpFare(amount);
    } finally {
      setBumpingFare(false);
    }
  };

  const isBiddingSearch = activeRide.status === 'REQUESTED' || activeRide.status === 'OFFERS_OPEN';
  const isDriverAssigned = activeRide.status === 'DRIVER_SELECTED' || activeRide.status === 'EN_ROUTE';
  const isInProgress = activeRide.status === 'IN_PROGRESS';
  const isCompleted = activeRide.status === 'COMPLETED';

  const canCancel = isBiddingSearch || isDriverAssigned;

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 space-y-4">
      {/* CASE 1: inDrive RADAR / SEARCHING LOBBY */}
      {isBiddingSearch && (
        <div className="space-y-4">
          {/* Radar Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center space-x-2.5">
              <div className="relative flex items-center justify-center">
                <span className="w-3.5 h-3.5 rounded-full bg-pakgreen-500 animate-ping absolute"></span>
                <span className="w-3 h-3 rounded-full bg-pakgreen-600 relative"></span>
              </div>
              <div>
                <span className="text-xs font-extrabold uppercase tracking-wider text-pakgreen-800">
                  Searching for Captains
                </span>
                <div className="text-[11px] text-slate-500">
                  {detectedCity} • Elapsed: <span className="font-mono font-bold text-slate-700">{elapsedSeconds}s</span>
                </div>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Your Offer</span>
              <span className="text-xl font-black text-pakgreen-600">
                PKR {farePkr}
              </span>
            </div>
          </div>

          {/* Animated Radar Visual & Fare Bump Bar */}
          <div className="bg-gradient-to-br from-emerald-50 via-slate-50 to-emerald-50/30 border border-emerald-200 rounded-2xl p-4 text-center space-y-3">
            <div className="flex items-center justify-center space-x-2 text-xs font-semibold text-emerald-900">
              <Radio className="w-4 h-4 text-emerald-600 animate-pulse" />
              <span>Broadcasted to verified captains nearby</span>
            </div>

            {/* inDrive 1-Tap Fare Bump */}
            <div className="pt-1">
              <div className="text-[11px] font-bold text-slate-600 mb-2 flex items-center justify-center space-x-1">
                <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                <span>Raise fare to attract captains faster:</span>
              </div>

              <div className="flex items-center justify-center space-x-2">
                <button
                  type="button"
                  disabled={bumpingFare}
                  onClick={() => handleBump(25)}
                  className="px-4 py-2 bg-white hover:bg-emerald-50 active:bg-emerald-100 border-2 border-emerald-500 text-emerald-700 font-extrabold text-xs rounded-xl shadow-xs transition flex items-center space-x-1 disabled:opacity-50"
                >
                  <span>+ PKR 25</span>
                </button>
                <button
                  type="button"
                  disabled={bumpingFare}
                  onClick={() => handleBump(50)}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-extrabold text-xs rounded-xl shadow-xs transition flex items-center space-x-1 disabled:opacity-50"
                >
                  <Zap className="w-3 h-3 fill-white" />
                  <span>+ PKR 50</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CASE 2: DRIVER ASSIGNED & EN ROUTE (Uber / Careem Style) */}
      {isDriverAssigned && (
        <div className="space-y-4">
          <div className="flex justify-between items-center pb-2 border-b border-slate-100">
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
              <span className="text-xs font-extrabold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                Captain En Route
              </span>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-400 block font-semibold">Agreed Fare (Cash)</span>
              <span className="text-xl font-black text-pakgreen-600">PKR {farePkr}</span>
            </div>
          </div>

          {/* CRITICAL: 4-Digit Security Ride PIN (Uber / Careem Standard) */}
          {activeRide.verificationOtp && (
            <div className="p-3.5 bg-amber-50 rounded-2xl border-2 border-amber-300 flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] uppercase font-extrabold text-amber-800 tracking-wider block">
                    Ride Start PIN
                  </span>
                  <span className="text-xs text-amber-900 font-medium">
                    Give this 4-digit PIN to your captain:
                  </span>
                </div>
              </div>
              <span className="text-2xl font-mono font-black text-amber-950 tracking-widest bg-white px-3 py-1 rounded-xl border border-amber-300 shadow-2xs">
                {activeRide.verificationOtp}
              </span>
            </div>
          )}

          {/* Captain Profile Card */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
            <div>
              <div className="font-extrabold text-sm text-charcoal-900">
                {activeRide.driverName || 'Assigned Captain'}
              </div>
              <div className="text-xs text-slate-600 mt-0.5">
                {activeRide.vehicleDetails || 'Verified Vehicle'}
              </div>
              <div className="text-[11px] font-semibold text-emerald-700 mt-0.5">
                ★ 4.9 • Verified Captain
              </div>
            </div>

            <div className="flex items-center space-x-2">
              {onOpenChat && (
                <button
                  type="button"
                  onClick={onOpenChat}
                  className="p-2.5 bg-white border border-slate-200 text-pakgreen-700 hover:bg-slate-100 rounded-xl transition shadow-2xs flex items-center space-x-1 text-xs font-bold"
                  title="Live Chat"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Chat</span>
                </button>
              )}
              {activeRide.driverPhone && (
                <a
                  href={`tel:${activeRide.driverPhone}`}
                  className="p-2.5 bg-pakgreen-600 text-white hover:bg-pakgreen-700 rounded-xl transition shadow-2xs flex items-center space-x-1 text-xs font-bold"
                  title="Call Captain"
                >
                  <Phone className="w-4 h-4" />
                  <span>Call</span>
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      {/* CASE 3: IN PROGRESS */}
      {isInProgress && (
        <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 space-y-2">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-pulse"></span>
              <span className="font-extrabold text-xs text-emerald-900 uppercase">
                Trip In Progress
              </span>
            </div>
            <span className="text-lg font-black text-emerald-900">PKR {farePkr}</span>
          </div>
          <p className="text-xs text-emerald-800">
            Enjoy your ride with Captain {activeRide.driverName || 'Captain'}. Please have cash ready upon arrival.
          </p>
        </div>
      )}

      {/* CASE 4: COMPLETED */}
      {isCompleted && (
        <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 text-center space-y-2">
          <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
          <h4 className="font-bold text-sm text-emerald-900">Ride Completed Successfully</h4>
          <p className="text-xs text-emerald-700">
            Fare: PKR {farePkr} paid in Cash. 0% platform commission deducted.
          </p>
        </div>
      )}

      {/* Route Addresses Summary */}
      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5 text-xs text-slate-700">
        <div className="truncate">
          🟢 <span className="font-bold">Pickup:</span> {activeRide.pickup.address}
        </div>
        <div className="truncate">
          🔴 <span className="font-bold">Drop-off:</span> {activeRide.destination.address}
        </div>
        {activeRide.pickupNotes && (
          <div className="text-amber-800 bg-amber-50 p-2 rounded-lg border border-amber-200 mt-1 font-medium">
            📌 Gate Note: {activeRide.pickupNotes}
          </div>
        )}
      </div>

      {/* Action / Safety Bar */}
      <div className="pt-1 flex flex-col sm:flex-row gap-2">
        <button
          type="button"
          onClick={handleShareWhatsApp}
          className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center justify-center space-x-1.5 transition"
        >
          <Share2 className="w-3.5 h-3.5" />
          <span>{t.safetyShare || 'Share Trip on WhatsApp'}</span>
        </button>

        {onOpenSos && (
          <button
            type="button"
            onClick={onOpenSos}
            className="py-2.5 px-3 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 font-bold text-xs rounded-xl transition flex items-center justify-center space-x-1"
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>SOS 15</span>
          </button>
        )}

        {canCancel && (
          <button
            type="button"
            onClick={() => setShowCancelModal(true)}
            className="py-2.5 px-3 rounded-xl border border-red-200 hover:bg-red-50 text-red-600 font-semibold text-xs flex items-center justify-center space-x-1 transition"
          >
            <XCircle className="w-3.5 h-3.5" />
            <span>Cancel</span>
          </button>
        )}
      </div>

      {/* Cancel Ride Modal */}
      <CancelRideModal
        isOpen={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        onConfirm={handleConfirmCancel}
        role="PASSENGER"
        loading={cancelling}
      />
    </div>
  );
};