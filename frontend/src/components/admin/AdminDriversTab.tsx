import React from 'react';
import { CheckCircle, XCircle } from 'lucide-react';

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
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="p-4 border-b border-slate-200 bg-slate-50 font-bold text-sm text-charcoal-900">
        Registered Drivers & Document Verification
      </div>

      <div className="divide-y divide-slate-200">
        {drivers.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-sm">
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
                className="p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:bg-slate-50/50 transition"
              >
                <div className="flex items-start space-x-3">
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
                      className="w-12 h-12 rounded-full object-cover border-2 border-pakgreen-500 cursor-pointer hover:opacity-90 transition shadow-xs flex-shrink-0"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-slate-100 border border-slate-300 flex items-center justify-center font-bold text-slate-700 text-sm flex-shrink-0">
                      {driver.fullName.charAt(0)}
                    </div>
                  )}

                  <div>
                    <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                      <span className="font-bold text-sm text-charcoal-900">{driver.fullName}</span>
                      <span className="text-xs text-slate-500">({driver.phone})</span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          driver.verificationStatus === 'APPROVED'
                            ? 'bg-green-100 text-green-800'
                            : driver.verificationStatus === 'UNDER_REVIEW'
                            ? 'bg-amber-100 text-amber-800'
                            : driver.verificationStatus === 'PENDING_DOCUMENTS'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {driver.verificationStatus}
                      </span>
                      {driver.isOnline && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                          🟢 Online
                        </span>
                      )}
                    </div>

                    <div className="text-xs text-slate-600 mt-1">
                      <span className="font-semibold text-slate-800 mr-1">
                        {iconChar} {driver.vehicle?.category || 'VEHICLE'}:
                      </span>
                      {driver.vehicle?.plateNumber ? (
                        <span>
                          {driver.vehicle.color} {driver.vehicle.make} {driver.vehicle.model} ({driver.vehicle.plateNumber})
                        </span>
                      ) : (
                        <span className="text-amber-600 italic">No plate registered</span>
                      )}
                    </div>

                    <div className="text-[11px] text-slate-400 mt-0.5">
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
                          className="text-[11px] px-2 py-0.5 bg-slate-100 hover:bg-pakgreen-50 hover:text-pakgreen-700 rounded border border-slate-200 font-semibold transition"
                        >
                          📷 Photo
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
                          className="text-[11px] px-2 py-0.5 bg-slate-100 hover:bg-pakgreen-50 hover:text-pakgreen-700 rounded border border-slate-200 font-semibold transition"
                        >
                          📄 Reg Copy
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
                          className="text-[11px] px-2 py-0.5 bg-slate-100 hover:bg-pakgreen-50 hover:text-pakgreen-700 rounded border border-slate-200 font-semibold transition"
                        >
                          🪪 CNIC Copy
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2 w-full md:w-auto justify-end">
                  {driver.verificationStatus !== 'APPROVED' ? (
                    <button
                      type="button"
                      onClick={() => onApproveDriver(driver.userId, 'APPROVED')}
                      className="pak-btn-primary"
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>{approveText}</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onApproveDriver(driver.userId, 'REJECTED')}
                      className="px-3 py-1.5 border border-red-200 text-red-600 hover:bg-red-50 rounded-lg text-xs font-semibold transition flex items-center space-x-1"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Suspend / Reject</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
