import React from 'react';
import { ShieldCheck, MapPin, RefreshCw } from 'lucide-react';
import { OPERATING_CITIES } from '../../shared/constants';

interface AdminHeaderProps {
  selectedCityId: string;
  onCityChange: (cityId: string) => void;
  onRefresh: () => void;
  loading: boolean;
  t: any;
}

export const AdminHeader: React.FC<AdminHeaderProps> = ({
  selectedCityId,
  onCityChange,
  onRefresh,
  loading,
  t
}) => {
  return (
    <div className="glass-panel p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border border-white/80 dark:border-white/10 shadow-2xl transition-all">
      <div>
        <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center space-x-2.5">
          <div className="w-9 h-9 rounded-xl bg-pakgreen-600/15 dark:bg-emerald-500/20 text-pakgreen-600 dark:text-emerald-400 flex items-center justify-center border border-pakgreen-500/30">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <span>{t.adminDashboard}</span>
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
          Multi-City Control Hub • Karachi, Islamabad, Lahore, Multan & D.G. Khan
        </p>
      </div>

      <div className="flex items-center space-x-3 flex-wrap gap-2">
        {/* Admin Operational City Dropdown Selector */}
        <div className="flex items-center space-x-2 bg-white/80 dark:bg-slate-900/80 border border-slate-300 dark:border-white/15 px-3.5 py-2 rounded-xl shadow-inner">
          <MapPin className="w-4 h-4 text-pakgreen-600 dark:text-emerald-400 flex-shrink-0" />
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Filter City:</span>
          <select
            value={selectedCityId}
            onChange={(e) => onCityChange(e.target.value)}
            className="bg-transparent text-xs font-black text-slate-900 dark:text-white outline-none cursor-pointer"
          >
            <option value="ALL" className="bg-slate-900 text-white">All Cities (Pakistan)</option>
            {OPERATING_CITIES.map((city) => (
              <option key={city.id} value={city.id} className="bg-slate-900 text-white">
                {city.name} ({city.province})
              </option>
            ))}
          </select>
        </div>

        <button
          type="button"
          onClick={onRefresh}
          className="glass-btn-secondary px-4 py-2 text-xs flex items-center space-x-1.5"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Feed</span>
        </button>
      </div>
    </div>
  );
};
