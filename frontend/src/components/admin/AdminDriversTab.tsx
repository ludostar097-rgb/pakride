import React from 'react';
import { CheckCircle, XCircle, ShieldCheck, FileText, Image } from 'lucide-react';

interface AdminDriversTabProps {
  drivers: any[];
  onApproveDriver: (userId: string, newStatus: 'APPROVED' | 'REJECTED') => void;
  onPreviewDoc: (doc: { title: string; url: string }) => void;
  approveText: string;
}

export const AdminDriversTab: React.FC<AdminDriversTabProps> = ({
  drivers,
  onApproveDriver,
  onPreviewDoc,
  approveText
}) => {
  return (
    <div className="glass-panel border border-white/80 dark:border-white/10 shadow-2xl overflow-hidden transition-all">
      <div className="p-4 border-b border-slate-200/60 dark:border-white/10 bg-white/40 dark:bg-white/5 font-black text-sm text-slate-900 dark:text-white flex items-center space-x-2">
        <ShieldCheck className="w-4 h-4 text-emerald-500" />
        <span>Registered Captains & Document Verification</span>
      </div>

      <div className="divide-y divide-slate-200/50 dark:divide-white/5">
        {drivers.length === 0 ? (
          <div className="p-8 text-center text-slate-400 dark:text-slate-500 text-sm font-medium">
            No drivers found for the selected city filter.
          </div>
        ) : (
          drivers.map((driver) => {
            const iconChar =
              driver.vehicle?.category === 'MOTORCYCLE'
                ? '🏍️'
                : driver.vehicle?.category === 'RICKSHAW'
                ? '🛺'
                : '🚗';

            return (
              <div
                key={driver.userId}
                className="p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:bg-white/40 dark:hover:bg-white/5 transition"
              >
                <div className="flex items-start space-x-3.5">
                  {driver.profilePhotoUrl ? (
                    <img
                      src={driver.profilePhotoUrl}
                      alt={driver.fullName}
                      onClick={() =>
                        onPreviewDoc({
                          title: `Captain Photo - ${driver.fullName}`,
                          url: driver.profilePhotoUrl
                        })
                      }
                      className="w-12 h-12 rounded-2xl object-cover border-2 border-emerald-500 cursor-pointer hover:opacity-90 transition shadow-xs flex-shrink-0"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-pakgreen-600 to-emerald-400 text-white flex items-center justify-center font-black text-sm flex-shrink-0 shadow-sm">
                      {driver.fullName.charAt(0)}
                    </div>
                  )}

                  <div>
                    <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                      <span className="font-black text-sm text-slate-900 dark:text-white">{driver.fullName}</span>
                      <span className="text-xs text-slate-500 dark:text-slate-400">({driver.phone})</span>
                      <span
                        className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border ${
                          driver.verificationStatus === 'APPROVED'
                            ? 'bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border-emerald-500/30'
                            : driver.verificationStatus === 'UNDER_REVIEW'
                            ? 'bg-amber-500/10 text-amber-800 dark:text-amber-300 border-amber-500/30'
                            : driver.verificationStatus === 'PENDING_DOCUMENTS'
                            ? 'bg-blue-500/10 text-blue-800 dark:text-blue-300 border-blue-500/30'
                            : 'bg-red-500/10 text-red-800 dark:text-red-300 border-red-500/30'
                        }`}
                      >
                        {driver.verificationStatus}
                      </span>
                      {driver.isOnline && (
                        <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                          🟢 Online
                        </span>
                      )}
                    </div>

                    <div className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                      <span className="font-bold text-slate-800 dark:text-slate-200 mr-1">
                        {iconChar} {driver.vehicle?.category || 'VEHICLE'}:
                      </span>
                      {driver.vehicle?.plateNumber ? (
                        <span>
                          {driver.vehicle.color} {driver.vehicle.make} {driver.vehicle.model} ({driver.vehicle.plateNumber})
                        </span>
                      ) : (
                        <span className="text-amber-600 dark:text-amber-400 italic">No plate registered</span>
                      )}
                    </div>

                    <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                      CNIC: {driver.cnicNumber || 'Pending'} • DL: {driver.licenseNumber || 'Verified'}
                    </div>

                    {/* Submitted Documents Pills */}
                    <div className="flex items-center space-x-2 mt-2">
                      {driver.profilePhotoUrl && (
                        <button
                          type="button"
                          onClick={() =>
                            onPreviewDoc({
                              title: `Captain Photo: ${driver.fullName}`,
                              url: driver.profilePhotoUrl
                            })
                          }
                          className="text-[11px] px-2.5 py-0.5 bg-white/80 dark:bg-slate-800/80 hover:bg-emerald-50 dark:hover:bg-white/10 hover:text-emerald-600 text-slate-700 dark:text-slate-300 rounded-lg border border-slate-200 dark:border-white/10 font-bold transition flex items-center space-x-1"
                        >
                          <Image className="w-3 h-3 text-emerald-500" />
                          <span>Photo</span>
                        </button>
                      )}
                      {driver.vehicleDocUrl && (
                        <button
                          type="button"
                          onClick={() =>
                            onPreviewDoc({
                              title: `Vehicle Reg: ${driver.fullName} (${driver.vehicle?.plateNumber})`,
                              url: driver.vehicleDocUrl
                            })
                          }
                          className="text-[11px] px-2.5 py-0.5 bg-white/80 dark:bg-slate-800/80 hover:bg-emerald-50 dark:hover:bg-white/10 hover:text-emerald-600 text-slate-700 dark:text-slate-300 rounded-lg border border-slate-200 dark:border-white/10 font-bold transition flex items-center space-x-1"
                        >
                          <FileText className="w-3 h-3 text-emerald-500" />
                          <span>Reg Copy</span>
                        </button>
                      )}
                      {driver.cnicDocUrl && (
                        <button
                          type="button"
                          onClick={() =>
                            onPreviewDoc({
                              title: `CNIC Document: ${driver.fullName}`,
                              url: driver.cnicDocUrl
                            })
                          }
                          className="text-[11px] px-2.5 py-0.5 bg-white/80 dark:bg-slate-800/80 hover:bg-emerald-50 dark:hover:bg-white/10 hover:text-emerald-600 text-slate-700 dark:text-slate-300 rounded-lg border border-slate-200 dark:border-white/10 font-bold transition flex items-center space-x-1"
                        >
                          <FileText className="w-3 h-3 text-cyan-500" />
                          <span>CNIC</span>
                        </button>
                      )}
                      {driver.licenseDocUrl && (
                        <button
                          type="button"
                          onClick={() =>
                            onPreviewDoc({
                              title: `Driving License: ${driver.fullName}`,
                              url: driver.licenseDocUrl
                            })
                          }
                          className="text-[11px] px-2.5 py-0.5 bg-white/80 dark:bg-slate-800/80 hover:bg-emerald-50 dark:hover:bg-white/10 hover:text-emerald-600 text-slate-700 dark:text-slate-300 rounded-lg border border-slate-200 dark:border-white/10 font-bold transition flex items-center space-x-1"
                        >
                          <FileText className="w-3 h-3 text-amber-500" />
                          <span>License</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Approve / Reject Controls */}
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => onApproveDriver(driver.userId, 'APPROVED')}
                    className="px-3.5 py-1.5 glass-btn-primary text-white text-xs font-bold rounded-xl flex items-center space-x-1 transition shadow-xs active:scale-95"
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>{approveText || 'Approve'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onApproveDriver(driver.userId, 'REJECTED')}
                    className="px-3 py-1.5 rounded-xl border border-red-300 dark:border-red-500/30 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 text-xs font-bold flex items-center space-x-1 transition active:scale-95"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Reject</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
