import React from 'react';
import { Power, ShieldCheck, ShieldAlert, AlertCircle, Clock, Edit3 } from 'lucide-react';
import { DriverProfile } from '../../shared/types';

interface DriverHeaderProps {
  currentUser: { fullName: string; phone: string };
  profile: DriverProfile;
  isApproved: boolean;
  isUnderReview: boolean;
  isEditingVehicle: boolean;
  pilotZoneText?: string;
  onToggleOnline: () => void;
  onToggleEditVehicle: () => void;
}

export const DriverHeader: React.FC<DriverHeaderProps> = ({
  currentUser,
  profile,
  isApproved,
  isUnderReview,
  isEditingVehicle,
  onToggleOnline,
  onToggleEditVehicle
}) => {
  const iconChar =
    profile.vehicle?.category === 'MOTORCYCLE'
      ? '🏍️'
      : profile.vehicle?.category === 'RICKSHAW'
      ? '🛺'
      : '🚗';

  return (
    <div className="glass-panel p-6 border border-white/80 shadow-2xl shadow-slate-900/5 transition-all">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        {/* Profile info */}
        <div className="flex items-center space-x-3.5">
          {profile.profilePhotoUrl ? (
            <img
              src={profile.profilePhotoUrl}
              alt={currentUser.fullName}
              className="w-14 h-14 rounded-2xl object-cover border-2 border-pakgreen-500 shadow-md shadow-pakgreen-500/20"
            />
          ) : (
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-pakgreen-600 to-emerald-400 border-2 border-white/40 flex items-center justify-center font-black text-white text-xl shadow-md shadow-pakgreen-600/30">
              {currentUser.fullName.charAt(0)}
            </div>
          )}

          <div>
            <div className="flex items-center space-x-2 flex-wrap gap-y-1">
              <h2 className="text-xl font-black text-slate-900 tracking-tight">{currentUser.fullName}</h2>
              {isApproved ? (
                <span className="flex items-center space-x-1 text-xs font-extrabold px-3 py-1 bg-emerald-500/15 text-emerald-900 border border-emerald-500/30 rounded-full shadow-2xs">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Verified Captain</span>
                </span>
              ) : isUnderReview ? (
                <span className="flex items-center space-x-1 text-xs font-extrabold px-3 py-1 bg-amber-500/15 text-amber-900 border border-amber-500/30 rounded-full shadow-2xs">
                  <Clock className="w-3.5 h-3.5 text-amber-600" />
                  <span>Documents Under Review</span>
                </span>
              ) : (
                <span className="flex items-center space-x-1 text-xs font-extrabold px-3 py-1 bg-blue-500/15 text-blue-900 border border-blue-500/30 rounded-full shadow-2xs">
                  <AlertCircle className="w-3.5 h-3.5 text-blue-600" />
                  <span>Documents Pending</span>
                </span>
              )}
            </div>

            <p className="text-xs text-slate-500 mt-1 font-medium">
              {profile.vehicle?.plateNumber ? (
                <span>
                  {iconChar} {profile.vehicle.make} {profile.vehicle.model} ({profile.vehicle.plateNumber})
                </span>
              ) : (
                <span className="text-amber-600 font-semibold">Vehicle details pending</span>
              )}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-2.5 w-full sm:w-auto">
          <button
            type="button"
            onClick={onToggleEditVehicle}
            className="px-4 py-2.5 rounded-xl glass-btn-secondary text-xs font-bold flex items-center space-x-1.5 transition active:scale-95 shadow-xs"
          >
            <Edit3 className="w-3.5 h-3.5 text-slate-500" />
            <span>{isEditingVehicle ? 'Close Form' : 'Update Vehicle / Docs'}</span>
          </button>

          <button
            type="button"
            disabled={!isApproved}
            onClick={onToggleOnline}
            className={`flex-1 sm:flex-none px-6 py-2.5 rounded-xl font-black text-sm flex items-center justify-center space-x-2 transition active:scale-95 shadow-md ${
              !isApproved
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                : profile.isOnline
                ? 'bg-gradient-to-tr from-red-600 to-rose-500 hover:from-red-700 hover:to-rose-600 text-white shadow-red-500/30'
                : 'glass-btn-primary text-white shadow-pakgreen-600/30'
            }`}
          >
            <Power className="w-4 h-4" />
            <span>{profile.isOnline ? 'Go Offline' : 'Go Online'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};