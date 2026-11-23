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
    <div className="pak-card flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
      <div>
        <h2 className="text-xl font-bold text-charcoal-900 flex items-center space-x-2">
          <ShieldCheck className="w-6 h-6 text-pakgreen-600" />
          <span>{t.adminDashboard}</span>
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Multi-City Control Hub • Karachi, Islamabad, Lahore, Multan & D.G. Khan
        </p>
      </div>

      <div className="flex items-center space-x-3 flex-wrap gap-2">
        {/* Admin Operational City Dropdown Selector */}
        <div className="flex items-center space-x-2 bg-slate-50 border-2 border-slate-300 px-3 py-1.5 rounded-xl shadow-2xs">
          <MapPin className="w-4 h-4 text-pakgreen-600 flex-shrink-0" />
          <span className="text-xs font-bold text-slate-700">Filter City:</span>
          <select
            value={selectedCityId}
            onChange={(e) => onCityChange(e.target.value)}
            className="bg-transparent text-xs font-extrabold text-charcoal-900 outline-none cursor-pointer"
          >
            <option value="ALL">All Cities (Pakistan)</option>
            {OPERATING_CITIES.map((city) => (
              <option key={city.id} value={city.id}>
                {city.name} ({city.province})
              </option>
            ))}
          </select>
        </div>

        <button
          type="button"
          onClick={onRefresh}
          className="pak-btn-secondary"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Feed</span>
        </button>
      </div>
    </div>
  );
};
