import React from 'react';
import { PaymentLedgerEntry } from '../../shared/types';

interface AdminLedgerTabProps {
  ledger: PaymentLedgerEntry[];
}

export const AdminLedgerTab: React.FC<AdminLedgerTabProps> = ({ ledger }) => {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="p-4 border-b border-slate-200 bg-slate-50 font-bold text-sm text-charcoal-900 flex justify-between items-center">
        <span>Cash Reconciliation Ledger (Integer Paisa System)</span>
        <span className="pak-badge-success">
          Introductory 0% Commission
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 text-slate-500 uppercase border-b border-slate-200">
            <tr>
              <th className="p-3">Ledger ID</th>
              <th className="p-3">Ride ID</th>
              <th className="p-3">Gross (PKR)</th>
              <th className="p-3">Commission</th>
              <th className="p-3">Driver Net (PKR)</th>
              <th className="p-3">Method</th>
              <th className="p-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {ledger.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-6 text-center text-slate-400">
                  No payments recorded for selected filter. Complete a ride to see ledger transactions.
                </td>
              </tr>
            ) : (
              ledger.map((l) => (
                <tr key={l.id} className="hover:bg-slate-50">
                  <td className="p-3 font-semibold text-slate-700">{l.id}</td>
                  <td className="p-3 text-slate-500">{l.rideId}</td>
                  <td className="p-3 font-bold text-charcoal-900">
                    PKR {Math.round(l.grossAmountPaisa / 100)}
                  </td>
                  <td className="p-3 text-pakgreen-600 font-semibold">
                    PKR {Math.round(l.platformCommissionPaisa / 100)} (0%)
                  </td>
                  <td className="p-3 font-bold text-pakgreen-700">
                    PKR {Math.round(l.driverNetPaisa / 100)}
                  </td>
                  <td className="p-3 uppercase font-semibold text-slate-600">{l.method}</td>
                  <td className="p-3">
                    <span className="pak-badge-success">
                      {l.status}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
