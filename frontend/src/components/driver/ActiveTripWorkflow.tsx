import React, { useState } from 'react';
import { KeyRound, CheckCircle, ArrowRight, XCircle, MapPin, User, Phone } from 'lucide-react';
import { RideRequest } from '../../shared/types';
import { CancelRideModal } from '../common/CancelRideModal';

interface ActiveTripWorkflowProps {
  activeTrip: RideRequest;
  onTransition: (newStatus: 'EN_ROUTE' | 'IN_PROGRESS' | 'COMPLETED', otp?: string) => Promise<void>;
  onCancelTrip: (reason: string) => Promise<void>;
  onToggleForwardDispatch?: () => void;
  showForwardDispatch?: boolean;
  pinError: string | null;
  t: any;
}

export const ActiveTripWorkflow: React.FC<ActiveTripWorkflowProps> = ({
  activeTrip,
  onTransition,
  onCancelTrip,
  onToggleForwardDispatch,
  showForwardDispatch = false,
  pinError,
  t
}) => {
  const [showPinModal, setShowPinModal] = useState(false);
  const [inputPin, setInputPin] = useState('');
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const farePkr = Math.round((activeTrip.agreedFarePaisa || activeTrip.proposedFarePaisa) / 100);

  const handleStartTripWithPin = async () => {
    if (inputPin.length < 4) return;
    await onTransition('IN_PROGRESS', inputPin);
    if (!pinError) {
      setShowPinModal(false);
      setInputPin('');
    }
  };

  const handleConfirmCancel = async (reason: string) => {
    setCancelling(true);
    try {
      await onCancelTrip(reason);
      setShowCancelModal(false);
    } finally {
      setCancelling(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-md border-2 border-pakgreen-500 p-5 space-y-4">
      {/* Top Banner */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="text-xs font-bold uppercase tracking-wider text-pakgreen-700 bg-pakgreen-100 px-3 py-1 rounded-full">
            {t.tripStatus || 'Trip Status'}: {activeTrip.status}
          </span>
        </div>
        <span className="text-lg font-extrabold text-pakgreen-600">
          Cash: PKR {farePkr}
        </span>
      </div>

      {/* Passenger & Route Card */}
      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
        <div className="flex justify-between items-center">
          <div className="font-bold text-sm text-charcoal-900 flex items-center space-x-1.5">
            <User className="w-4 h-4 text-pakgreen-600" />
            <span>Passenger: {activeTrip.passengerName}</span>
          </div>
          {activeTrip.passengerPhone && (
            <span className="text-xs text-slate-500 flex items-center space-x-1">
              <Phone className="w-3.5 h-3.5 text-slate-400" />
              <span>{activeTrip.passengerPhone}</span>
            </span>
          )}
        </div>

        <div className="text-xs text-slate-600 flex items-start space-x-1.5 pt-1">
          <span className="text-emerald-600 font-bold">🟢 Pickup:</span>
          <span>{activeTrip.pickup.address}</span>
        </div>
        <div className="text-xs text-slate-600 flex items-start space-x-1.5">
          <span className="text-red-500 font-bold">🔴 Drop-off:</span>
          <span>{activeTrip.destination.address}</span>
        </div>

        {activeTrip.pickupNotes && (
          <div className="text-xs text-amber-800 bg-amber-50 p-2 rounded-lg border border-amber-200 mt-2">
            📌 <span className="font-bold">Passenger Gate Note:</span> {activeTrip.pickupNotes}
          </div>
        )}
      </div>

      {/* Action Workflow Buttons */}
      <div className="space-y-2 pt-1">
        {activeTrip.status === 'DRIVER_SELECTED' && (
          <button
            type="button"
            onClick={() => onTransition('EN_ROUTE')}
            className="w-full bg-charcoal-900 hover:bg-black text-white font-bold py-3.5 rounded-xl text-sm transition shadow-sm flex items-center justify-center space-x-2"
          >
            <span>{t.markArrived || 'Mark Arrived at Pickup'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        )}

        {activeTrip.status === 'EN_ROUTE' && (
          <button
            type="button"
            onClick={() => setShowPinModal(true)}
            className="w-full bg-pakgreen-500 hover:bg-pakgreen-600 text-white font-bold py-3.5 rounded-xl text-sm shadow-md transition flex items-center justify-center space-x-2"
          >
            <KeyRound className="w-4 h-4" />
            <span>{t.startTrip || 'Start Trip (Enter Passenger PIN)'}</span>
          </button>
        )}

        {activeTrip.status === 'IN_PROGRESS' && (
          <>
            <button
              type="button"
              onClick={() => onTransition('COMPLETED')}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 rounded-xl text-sm shadow-lg shadow-emerald-600/30 transition flex items-center justify-center space-x-2"
            >
              <CheckCircle className="w-5 h-5" />
              <span>{t.completeTrip || 'Complete Trip & Collect Cash'}</span>
            </button>

            {/* Back-to-Back Rides (Forward Dispatching near Drop-off) */}
            <div className="p-3.5 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl space-y-2 mt-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-900 flex items-center space-x-1.5">
                  <span>🎯</span>
                  <span>Queue Next Ride (Forward Dispatch)</span>
                </span>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">
                  Near Drop-off
                </span>
              </div>
              <p className="text-[11px] text-emerald-700 leading-relaxed">
                Accept your next ride near <strong>{activeTrip.destination.address}</strong> before finishing this trip to eliminate idle waiting time!
              </p>
              {onToggleForwardDispatch && (
                <button
                  type="button"
                  onClick={onToggleForwardDispatch}
                  className="w-full py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-lg transition shadow-xs flex items-center justify-center space-x-1.5"
                >
                  <span>{showForwardDispatch ? 'Hide Drop-off Rides' : 'View & Queue Rides Near Drop-off'}</span>
                </button>
              )}
            </div>
          </>
        )}

        {/* Cancellation Option (Allowed in DRIVER_SELECTED and EN_ROUTE) */}
        {(activeTrip.status === 'DRIVER_SELECTED' || activeTrip.status === 'EN_ROUTE') && (
          <button
            type="button"
            onClick={() => setShowCancelModal(true)}
            className="w-full py-2.5 rounded-xl border border-red-200 hover:bg-red-50 text-red-600 font-semibold text-xs flex items-center justify-center space-x-1.5 transition"
          >
            <XCircle className="w-3.5 h-3.5" />
            <span>Cancel This Trip</span>
          </button>
        )}
      </div>

      {/* PIN Verification Modal */}
      {showPinModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-2xl">
            <div className="w-12 h-12 bg-pakgreen-100 rounded-full flex items-center justify-center mx-auto text-pakgreen-600">
              <KeyRound className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-center text-charcoal-900">{t.enterPinPrompt || 'Enter 4-Digit Passenger PIN'}</h3>
            <p className="text-xs text-center text-slate-500">
              Ask passenger for the 4-digit security PIN displayed on their screen.
            </p>

            {pinError && (
              <div className="p-2.5 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600 text-center font-semibold">
                {pinError}
              </div>
            )}

            <div>
              <input
                type="text"
                maxLength={4}
                value={inputPin}
                onChange={(e) => setInputPin(e.target.value)}
                placeholder="4-digit PIN"
                className="w-full text-center text-2xl font-mono font-extrabold tracking-widest py-2.5 border-2 border-slate-300 focus:border-pakgreen-500 rounded-xl outline-none"
              />
            </div>

            <div className="space-y-2">
              <button
                type="button"
                disabled={inputPin.length < 4}
                onClick={handleStartTripWithPin}
                className="w-full bg-pakgreen-500 hover:bg-pakgreen-600 text-white font-bold py-2.5 rounded-xl text-sm shadow-md transition disabled:opacity-50"
              >
                {t.pinSubmit || 'Verify PIN & Start Trip'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowPinModal(false);
                  setInputPin('');
                }}
                className="w-full border border-slate-300 text-slate-700 font-semibold py-2 rounded-xl text-xs"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Trip Modal */}
      <CancelRideModal
        isOpen={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        onConfirm={handleConfirmCancel}
        role="DRIVER"
        loading={cancelling}
      />
    </div>
  );
};
