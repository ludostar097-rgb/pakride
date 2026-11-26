import React from 'react';
import { PaymentLedgerEntry } from '../../shared/types';
import { DollarSign, ShieldCheck } from 'lucide-react';

interface AdminLedgerTabProps {
  ledger: PaymentLedgerEntry[];
}

export const AdminLedgerTab: React.FC<AdminLedgerTabProps> = ({ ledger }) => {
  return (
    <div className="glass-panel border border-white/80 dark:border-white/10 shadow-2xl overflow-hidden transition-all">
      <div className="p-4 border-b border-slate-200/60 dark:border-white/10 bg-white/40 dark:bg-white/5 font-black text-sm text-slate-900 dark:text-white flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <DollarSign className="w-4 h-4 text-emerald-500" />
          <span>Cash Reconciliation Ledger (Integer Paisa Standard)</span>
        </div>
        <span className="glass-badge-success px-3 py-1 text-xs">
          100% Cash-First • 0% Platform Commission
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50/70 dark:bg-slate-900/60 text-slate-500 dark:text-slate-400 uppercase tracking-wider font-extrabold border-b border-slate-200/60 dark:border-white/10">
            <tr>
              <th className="p-3.5">Ledger ID</th>
              <th className="p-3.5">Ride ID</th>
              <th className="p-3.5">Gross (PKR)</th>
              <th className="p-3.5">Commission</th>
              <th className="p-3.5">Captain Net (PKR)</th>
              <th className="p-3.5">Method</th>
              <th className="p-3.5">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200/50 dark:divide-white/5">
            {ledger.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-slate-400 dark:text-slate-500 font-medium">
                  No payments recorded for selected filter. Complete a ride to see ledger transactions.
                </td>
              </tr>
            ) : (
              ledger.map((l) => (
                <tr key={l.id} className="hover:bg-white/50 dark:hover:bg-white/5 transition">
                  <td className="p-3.5 font-bold text-slate-800 dark:text-slate-200">{l.id}</td>
                  <td className="p-3.5 text-slate-500 dark:text-slate-400 font-mono text-[11px]">{l.rideId}</td>
                  <td className="p-3.5 font-black text-slate-900 dark:text-white">
                    PKR {Math.round(l.grossAmountPaisa / 100)}
                  </td>
                  <td className="p-3.5 text-emerald-600 dark:text-emerald-400 font-bold">
                    PKR {Math.round(l.platformCommissionPaisa / 100)} (0%)
                  </td>
                  <td className="p-3.5 font-black text-pakgreen-700 dark:text-emerald-400">
                    PKR {Math.round(l.driverNetPaisa / 100)}
                  </td>
                  <td className="p-3.5 uppercase font-extrabold text-slate-600 dark:text-slate-300">{l.method}</td>
                  <td className="p-3.5">
                    <span className="glass-badge-success px-2.5 py-0.5 text-[11px]">
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
