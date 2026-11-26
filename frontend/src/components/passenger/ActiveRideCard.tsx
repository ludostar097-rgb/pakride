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
    <div className="glass-panel p-6 shadow-2xl shadow-slate-900/5 border border-white/80 space-y-5 transition-all">
      {/* CASE 1: inDrive RADAR / SEARCHING LOBBY (Modern Glass Sonar Pulse) */}
      {isBiddingSearch && (
        <div className="space-y-4">
          {/* Radar Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-200/50">
            <div className="flex items-center space-x-3">
              <div className="relative flex items-center justify-center">
                <span className="w-4 h-4 rounded-full bg-pakgreen-500 animate-ping absolute opacity-75"></span>
                <span className="w-3.5 h-3.5 rounded-full bg-gradient-to-tr from-pakgreen-600 to-emerald-400 relative shadow-sm"></span>
              </div>
              <div>
                <span className="text-xs font-black uppercase tracking-wider text-slate-900">
                  Searching for Captains
                </span>
                <div className="text-[11px] text-slate-500 font-medium">
                  {detectedCity} • Elapsed: <span className="font-mono font-extrabold text-emerald-700">{elapsedSeconds}s</span>
                </div>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[10px] text-slate-400 uppercase font-extrabold block">Your Offer</span>
              <span className="text-2xl font-black text-pakgreen-700 tracking-tight">
                PKR {farePkr}
              </span>
            </div>
          </div>

          {/* Animated Glass Radar Visual & Fare Bump Bar */}
          <div className="bg-gradient-to-br from-emerald-500/10 via-white/80 to-emerald-500/5 backdrop-blur-xl border border-emerald-500/25 rounded-3xl p-5 text-center space-y-4 shadow-sm">
            <div className="flex items-center justify-center space-x-2 text-xs font-bold text-emerald-900">
              <Radio className="w-4 h-4 text-emerald-600 animate-pulse" />
              <span>Broadcasted to verified captains nearby</span>
            </div>

            {/* inDrive 1-Tap Fare Bump with Glass Controls */}
            <div className="pt-1">
              <div className="text-[11px] font-extrabold text-slate-700 mb-2.5 flex items-center justify-center space-x-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                <span>Raise fare to attract captains faster:</span>
              </div>

              <div className="flex items-center justify-center space-x-3">
                <button
                  type="button"
                  disabled={bumpingFare}
                  onClick={() => handleBump(25)}
                  className="px-5 py-2.5 bg-white/90 hover:bg-emerald-50 active:scale-95 border-2 border-emerald-500 text-emerald-800 font-black text-xs rounded-2xl shadow-sm transition flex items-center space-x-1.5 disabled:opacity-50"
                >
                  <span>+ PKR 25</span>
                </button>
                <button
                  type="button"
                  disabled={bumpingFare}
                  onClick={() => handleBump(50)}
                  className="px-5 py-2.5 glass-btn-primary active:scale-95 text-white font-black text-xs rounded-2xl shadow-md shadow-pakgreen-600/30 transition flex items-center space-x-1.5 disabled:opacity-50"
                >
                  <Zap className="w-3.5 h-3.5 fill-white" />
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
          <div className="flex justify-between items-center pb-2.5 border-b border-slate-200/50">
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
              <span className="text-xs font-black text-emerald-900 bg-emerald-500/15 px-3 py-1 rounded-full border border-emerald-500/30 shadow-2xs">
                Captain En Route
              </span>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-400 block font-bold uppercase">Agreed Fare (Cash)</span>
              <span className="text-2xl font-black text-pakgreen-700">PKR {farePkr}</span>
            </div>
          </div>

          {/* CRITICAL: 4-Digit Security Ride PIN (Uber / Careem Standard) with Amber Glass Effect */}
          {activeRide.verificationOtp && (
            <div className="p-4 bg-amber-500/10 backdrop-blur-xl rounded-2xl border-2 border-amber-400/50 flex items-center justify-between shadow-sm">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-400 text-white flex items-center justify-center font-black shadow-md shadow-amber-500/30 border border-white/30">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] uppercase font-black text-amber-900 tracking-wider block">
                    Ride Start PIN
                  </span>
                  <span className="text-xs text-amber-950 font-semibold">
                    Provide to your captain upon arrival:
                  </span>
                </div>
              </div>
              <span className="text-2xl font-mono font-black text-amber-950 tracking-widest bg-white/95 backdrop-blur px-4 py-1.5 rounded-xl border border-amber-300 shadow-sm">
                {activeRide.verificationOtp}
              </span>
            </div>
          )}

          {/* Captain Profile Card with Glass Card Styling */}
          <div className="p-4 glass-card border border-white/80 flex items-center justify-between shadow-xs">
            <div>
              <div className="font-extrabold text-sm text-slate-900">
                {activeRide.driverName || 'Assigned Captain'}
              </div>
              <div className="text-xs text-slate-600 mt-0.5 font-medium">
                {activeRide.vehicleDetails || 'Verified Vehicle'}
              </div>
              <div className="text-[11px] font-extrabold text-emerald-700 mt-0.5">
                ★ 4.9 • Verified Captain
              </div>
            </div>

            <div className="flex items-center space-x-2">
              {onOpenChat && (
                <button
                  type="button"
                  onClick={onOpenChat}
                  className="p-2.5 glass-btn-secondary text-pakgreen-700 rounded-xl transition shadow-2xs flex items-center space-x-1.5 text-xs font-bold"
                  title="Live Chat"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Chat</span>
                </button>
              )}
              {activeRide.driverPhone && (
                <a
                  href={`tel:${activeRide.driverPhone}`}
                  className="p-2.5 glass-btn-primary rounded-xl transition shadow-md shadow-pakgreen-600/30 flex items-center space-x-1.5 text-xs font-bold"
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
        <div className="p-5 bg-emerald-500/10 backdrop-blur-xl rounded-3xl border border-emerald-500/30 space-y-2.5 shadow-sm">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-pulse"></span>
              <span className="font-black text-xs text-emerald-900 uppercase tracking-wide">
                Trip In Progress
              </span>
            </div>
            <span className="text-xl font-black text-emerald-900">PKR {farePkr}</span>
          </div>
          <p className="text-xs text-emerald-950 font-medium">
            Enjoy your ride with Captain {activeRide.driverName || 'Captain'}. Please have cash ready upon arrival.
          </p>
        </div>
      )}

      {/* CASE 4: COMPLETED */}
      {isCompleted && (
        <div className="p-5 bg-emerald-500/10 backdrop-blur-xl rounded-3xl border border-emerald-500/30 text-center space-y-2 shadow-sm">
          <CheckCircle2 className="w-9 h-9 text-emerald-600 mx-auto" />
          <h4 className="font-black text-base text-emerald-950">Ride Completed Successfully</h4>
          <p className="text-xs text-emerald-800 font-medium">
            Fare: PKR {farePkr} paid in Cash. 0% platform commission deducted.
          </p>
        </div>
      )}

      {/* Route Addresses Summary */}
      <div className="p-3.5 glass-panel-subtle rounded-2xl border border-white/70 space-y-2 text-xs text-slate-700">
        <div className="truncate">
          🟢 <span className="font-bold text-slate-900">Pickup:</span> {activeRide.pickup.address}
        </div>
        <div className="truncate">
          🔴 <span className="font-bold text-slate-900">Drop-off:</span> {activeRide.destination.address}
        </div>
        {activeRide.pickupNotes && (
          <div className="text-amber-900 bg-amber-500/10 p-2.5 rounded-xl border border-amber-300/40 mt-1 font-semibold text-xs">
            📌 Gate Note: {activeRide.pickupNotes}
          </div>
        )}
      </div>

      {/* Action / Safety Bar */}
      <div className="pt-1 flex flex-col sm:flex-row gap-2.5">
        <button
          type="button"
          onClick={handleShareWhatsApp}
          className="flex-1 py-3 glass-btn-primary text-white font-extrabold text-xs rounded-xl shadow-md shadow-pakgreen-600/25 flex items-center justify-center space-x-2 transition active:scale-95"
        >
          <Share2 className="w-4 h-4" />
          <span>{t.safetyShare || 'Share Trip on WhatsApp'}</span>
        </button>

        {onOpenSos && (
          <button
            type="button"
            onClick={onOpenSos}
            className="py-3 px-4 bg-red-500/10 hover:bg-red-500/20 text-red-600 border border-red-500/30 font-black text-xs rounded-xl transition flex items-center justify-center space-x-1.5 active:scale-95 shadow-2xs"
          >
            <ShieldAlert className="w-4 h-4" />
            <span>SOS 15</span>
          </button>
        )}

        {canCancel && (
          <button
            type="button"
            onClick={() => setShowCancelModal(true)}
            className="py-3 px-4 rounded-xl border border-red-200 hover:bg-red-50 text-red-600 font-bold text-xs flex items-center justify-center space-x-1 transition active:scale-95"
          >
            <XCircle className="w-4 h-4" />
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