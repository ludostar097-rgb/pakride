import React, { useState } from 'react';
import { X, AlertTriangle, Check } from 'lucide-react';

interface CancelRideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  role: 'PASSENGER' | 'DRIVER';
  loading?: boolean;
}

const PASSENGER_REASONS = [
  'Driver is taking too long to arrive',
  'Changed my travel plans',
  'Booked by mistake',
  'Found alternative transport',
  'Driver asked me to cancel',
  'Other / Personal reason'
];

const DRIVER_REASONS = [
  'Passenger not responding / unreachable',
  'Heavy traffic / road closed in area',
  'Vehicle breakdown / flat tyre',
  'Pickup location inaccessible',
  'Accidental accept',
  'Emergency / Other reason'
];

export const CancelRideModal: React.FC<CancelRideModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  role,
  loading = false
}) => {
  const reasons = role === 'DRIVER' ? DRIVER_REASONS : PASSENGER_REASONS;
  const [selectedReason, setSelectedReason] = useState<string>(reasons[0]);
  const [customNote, setCustomNote] = useState('');

  if (!isOpen) return null;

  const handleConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    const finalReason = customNote.trim() ? `${selectedReason} - ${customNote.trim()}` : selectedReason;
    onConfirm(finalReason);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl relative border border-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-full bg-red-100 text-red-600 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base text-charcoal-900">
                {role === 'DRIVER' ? 'Cancel Trip' : 'Cancel Ride'}
              </h3>
              <p className="text-[11px] text-slate-500">Please choose a reason for cancellation</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Reason Selection */}
        <form onSubmit={handleConfirm} className="space-y-3.5">
          <div className="space-y-1.5">
            {reasons.map((reason) => {
              const isSelected = selectedReason === reason;
              return (
                <button
                  key={reason}
                  type="button"
                  onClick={() => setSelectedReason(reason)}
                  className={`w-full p-2.5 rounded-xl border text-left text-xs font-semibold flex items-center justify-between transition ${
                    isSelected
                      ? 'border-red-500 bg-red-50 text-red-900'
                      : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span>{reason}</span>
                  {isSelected && <Check className="w-4 h-4 text-red-600 flex-shrink-0" />}
                </button>
              );
            })}
          </div>

          <div>
            <label className="text-[11px] font-semibold text-slate-600 block mb-1">
              Additional Details (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Traffic jam near Jauhar Chowrangi..."
              value={customNote}
              onChange={(e) => setCustomNote(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-red-500 outline-none"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-50 transition"
            >
              Keep Ride
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-md transition disabled:opacity-50"
            >
              {loading ? 'Cancelling...' : 'Confirm Cancellation'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
