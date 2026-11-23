import React from 'react';
import { Power, ShieldCheck, ShieldAlert, AlertCircle, Clock, Edit3 } from 'lucide-react';
import { DriverProfile } from '../../shared/types';

interface DriverHeaderProps {
  currentUser: { fullName: string; phone: string };
  profile: DriverProfile;
  isApproved: boolean;
  isUnderReview: boolean;
  isEditingVehicle: boolean;
  pilotZoneText: string;
  onToggleOnline: () => void;
  onToggleEditVehicle: () => void;
}

export const DriverHeader: React.FC<DriverHeaderProps> = ({
  currentUser,
  profile,
  isApproved,
  isUnderReview,
  isEditingVehicle,
  pilotZoneText,
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
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        {/* Profile info */}
        <div className="flex items-center space-x-3.5">
          {profile.profilePhotoUrl ? (
            <img
              src={profile.profilePhotoUrl}
              alt={currentUser.fullName}
              className="w-13 h-13 rounded-full object-cover border-2 border-pakgreen-500 shadow-sm"
            />
          ) : (
            <div className="w-13 h-13 rounded-full bg-pakgreen-100 border-2 border-pakgreen-500 flex items-center justify-center font-bold text-pakgreen-800 text-lg">
              {currentUser.fullName.charAt(0)}
            </div>
          )}

          <div>
            <div className="flex items-center space-x-2 flex-wrap gap-y-1">
              <h2 className="text-xl font-bold text-charcoal-900">{currentUser.fullName}</h2>
              {isApproved ? (
                <span className="flex items-center space-x-1 text-xs font-semibold px-2.5 py-1 bg-green-100 text-green-800 rounded-full">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Verified Captain</span>
                </span>
              ) : isUnderReview ? (
                <span className="flex items-center space-x-1 text-xs font-semibold px-2.5 py-1 bg-amber-100 text-amber-800 rounded-full">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Documents Under Review</span>
                </span>
              ) : (
                <span className="flex items-center space-x-1 text-xs font-semibold px-2.5 py-1 bg-blue-100 text-blue-800 rounded-full">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>Documents Pending</span>
                </span>
              )}
            </div>

            <p className="text-xs text-slate-500 mt-1">
              {profile.vehicle?.plateNumber ? (
                <span>
                  {iconChar} {profile.vehicle.make} {profile.vehicle.model} ({profile.vehicle.plateNumber}) • {pilotZoneText}
                </span>
              ) : (
                <span className="text-amber-600 font-semibold">Vehicle details not yet submitted</span>
              )}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={onToggleEditVehicle}
            className="px-3.5 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center space-x-1.5 transition"
          >
            <Edit3 className="w-3.5 h-3.5 text-slate-500" />
            <span>{isEditingVehicle ? 'Close Form' : 'Update Vehicle / Docs'}</span>
          </button>

          <button
            type="button"
            disabled={!isApproved}
            onClick={onToggleOnline}
            className={`flex-1 sm:flex-none px-6 py-2.5 rounded-xl font-bold text-sm flex items-center justify-center space-x-2 shadow-sm transition ${
              !isApproved
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                : profile.isOnline
                ? 'bg-red-500 hover:bg-red-600 text-white'
                : 'bg-pakgreen-500 hover:bg-pakgreen-600 text-white'
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
