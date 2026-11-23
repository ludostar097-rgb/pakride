import React, { useState } from 'react';
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
  CheckCircle2
} from 'lucide-react';
import { RideRequest } from '../../shared/types';
import { CancelRideModal } from '../common/CancelRideModal';

interface ActiveRideCardProps {
  activeRide: RideRequest;
  onCancelRide: (reason: string) => Promise<void>;
  detectedCity: string;
  onOpenChat?: () => void;
  onOpenSos?: () => void;
  t: any;
}

export const ActiveRideCard: React.FC<ActiveRideCardProps> = ({
  activeRide,
  onCancelRide,
  detectedCity,
  onOpenChat,
  onOpenSos,
  t
}) => {
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [audioPromptSent, setAudioPromptSent] = useState(false);

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

  const canCancel =
    activeRide.status === 'REQUESTED' ||
    activeRide.status === 'OFFERS_OPEN' ||
    activeRide.status === 'DRIVER_SELECTED' ||
    activeRide.status === 'EN_ROUTE';

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 space-y-4">
      {/* Status Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <span className="w-2.5 h-2.5 rounded-full bg-pakgreen-500 animate-ping"></span>
          <span className="text-xs font-bold uppercase tracking-wider text-pakgreen-700 bg-pakgreen-50 px-2.5 py-0.5 rounded-full border border-pakgreen-200">
            {t.tripStatus || 'Trip Status'}: {activeRide.status}
          </span>
        </div>
        <div className="flex items-center space-x-2">
          {onOpenSos && (
            <button
              type="button"
              onClick={onOpenSos}
              className="bg-red-50 text-red-600 hover:bg-red-100 px-2 py-1 rounded-lg text-xs font-bold flex items-center space-x-1 border border-red-200"
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>SOS 15</span>
            </button>
          )}
          <span className="text-lg font-extrabold text-pakgreen-600">
            PKR {farePkr}
          </span>
        </div>
      </div>

      {/* Driver Information (if assigned) */}
      {activeRide.driverName && (
        <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
          <div className="flex justify-between items-center">
            <div>
              <div className="font-bold text-sm text-charcoal-900">{activeRide.driverName}</div>
              <div className="text-xs text-slate-500">
                {activeRide.vehicleDetails || 'Verified Captain'}
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {onOpenChat && (
                <button
                  type="button"
                  onClick={onOpenChat}
                  className="p-2 bg-white border border-slate-200 text-pakgreen-700 rounded-xl hover:bg-slate-100 transition shadow-xs flex items-center space-x-1 text-xs font-bold"
                  title="Live Chat"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Chat</span>
                </button>
              )}
              {activeRide.driverPhone && (
                <a
                  href={`tel:${activeRide.driverPhone}`}
                  className="p-2 bg-pakgreen-50 border border-pakgreen-200 text-pakgreen-700 rounded-xl hover:bg-pakgreen-100 transition flex items-center space-x-1 text-xs font-bold"
                  title="Call Captain"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>Call</span>
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Security PIN Display (Crucial for passenger safety) */}
      {activeRide.verificationOtp && (
        <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <KeyRound className="w-5 h-5 text-amber-600 flex-shrink-0" />
            <div>
              <span className="text-[10px] uppercase font-bold text-amber-700 block tracking-wider">
                {t.securityPin || 'Ride Start PIN'}
              </span>
              <span className="text-xs text-amber-900 font-semibold">Share with captain upon pickup:</span>
            </div>
          </div>
          <span className="text-2xl font-mono font-extrabold text-amber-900 tracking-widest bg-white px-3 py-1 rounded-lg border border-amber-300 shadow-xs">
            {activeRide.verificationOtp}
          </span>
        </div>
      )}

      {/* Route Addresses */}
      <div className="space-y-1.5 text-xs text-slate-600">
        <div>🟢 <span className="font-bold">Pickup:</span> {activeRide.pickup.address}</div>
        <div>🔴 <span className="font-bold">Drop-off:</span> {activeRide.destination.address}</div>
        {activeRide.pickupNotes && (
          <div className="text-amber-800 bg-amber-50 p-2 rounded-lg border border-amber-200 mt-1">
            📌 Gate Note: {activeRide.pickupNotes}
          </div>
        )}
      </div>

      {/* Safety & Action Buttons */}
      <div className="pt-2 flex flex-col sm:flex-row gap-2">
        <button
          type="button"
          onClick={handleShareWhatsApp}
          className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center justify-center space-x-1.5 transition"
        >
          <Share2 className="w-3.5 h-3.5" />
          <span>{t.safetyShare || 'Share Trip on WhatsApp'}</span>
        </button>

        <button
          type="button"
          onClick={handleSimulateAudioNote}
          className="py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition flex items-center justify-center space-x-1"
        >
          <Mic className="w-3.5 h-3.5 text-slate-500" />
          <span>{audioPromptSent ? 'Voice Note Sent!' : 'Voice Gate Note'}</span>
        </button>

        {canCancel && (
          <button
            type="button"
            onClick={() => setShowCancelModal(true)}
            className="py-2.5 px-4 rounded-xl border border-red-200 hover:bg-red-50 text-red-600 font-semibold text-xs flex items-center justify-center space-x-1 transition"
          >
            <XCircle className="w-3.5 h-3.5" />
            <span>Cancel Ride</span>
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
