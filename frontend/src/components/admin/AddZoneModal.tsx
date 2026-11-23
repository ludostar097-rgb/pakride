import React, { useState } from 'react';
import { Compass } from 'lucide-react';

interface AddZoneModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (zoneData: {
    cityName: string;
    zoneName: string;
    centerLat: number;
    centerLng: number;
    radiusKm: number;
    baseFareCarPaisa: number;
    perKmCarPaisa: number;
  }) => Promise<void>;
}

export const AddZoneModal: React.FC<AddZoneModalProps> = ({
  isOpen,
  onClose,
  onSubmit
}) => {
  const [newCityName, setNewCityName] = useState('Multan');
  const [newZoneName, setNewZoneName] = useState('Cantt & Bosan Road');
  const [newCenterLat, setNewCenterLat] = useState('30.1984');
  const [newCenterLng, setNewCenterLng] = useState('71.4687');
  const [newRadiusKm, setNewRadiusKm] = useState('9.0');
  const [newBaseFareCar, setNewBaseFareCar] = useState('140');
  const [newPerKmCar, setNewPerKmCar] = useState('35');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onSubmit({
        cityName: newCityName,
        zoneName: newZoneName,
        centerLat: parseFloat(newCenterLat),
        centerLng: parseFloat(newCenterLng),
        radiusKm: parseFloat(newRadiusKm),
        baseFareCarPaisa: Math.round(parseFloat(newBaseFareCar) * 100),
        perKmCarPaisa: Math.round(parseFloat(newPerKmCar) * 100)
      });
      onClose();
    } catch (err) {
      console.error('Error submitting zone:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
        <h3 className="text-lg font-bold text-charcoal-900 flex items-center space-x-2">
          <Compass className="w-5 h-5 text-pakgreen-600" />
          <span>Add Operational City / Zone</span>
        </h3>

        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          <div>
            <label className="font-semibold text-slate-700 block mb-1">Select Preset City or Type Name</label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {[
                { city: 'Multan', zone: 'Cantt & Bosan Road', lat: '30.1984', lng: '71.4687', rad: '9.0', base: '140', perKm: '35' },
                { city: 'D.G. Khan', zone: 'Pull Dat & Traffic Chowk', lat: '30.0489', lng: '70.6455', rad: '7.5', base: '120', perKm: '30' },
                { city: 'Karachi', zone: 'Gulistan-e-Jauhar', lat: '24.9180', lng: '67.1350', rad: '7.5', base: '150', perKm: '40' },
                { city: 'Islamabad', zone: 'Blue Area & F Sectors', lat: '33.6844', lng: '73.0479', rad: '8.5', base: '180', perKm: '45' },
                { city: 'Lahore', zone: 'Gulberg & Cantt', lat: '31.5204', lng: '74.3587', rad: '10.0', base: '160', perKm: '42' }
              ].map((preset) => (
                <button
                  key={preset.city}
                  type="button"
                  onClick={() => {
                    setNewCityName(preset.city);
                    setNewZoneName(preset.zone);
                    setNewCenterLat(preset.lat);
                    setNewCenterLng(preset.lng);
                    setNewRadiusKm(preset.rad);
                    setNewBaseFareCar(preset.base);
                    setNewPerKmCar(preset.perKm);
                  }}
                  className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md font-bold text-[11px] transition"
                >
                  + {preset.city}
                </button>
              ))}
            </div>
            <input
              type="text"
              required
              value={newCityName}
              onChange={(e) => setNewCityName(e.target.value)}
              placeholder="e.g. Multan, D.G. Khan, Islamabad"
              className="pak-input"
            />
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">Zone Name</label>
            <input
              type="text"
              required
              value={newZoneName}
              onChange={(e) => setNewZoneName(e.target.value)}
              placeholder="e.g. Blue Area & F Sectors"
              className="pak-input"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Center Lat</label>
              <input
                type="number"
                step="0.0001"
                required
                value={newCenterLat}
                onChange={(e) => setNewCenterLat(e.target.value)}
                className="pak-input"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Center Lng</label>
              <input
                type="number"
                step="0.0001"
                required
                value={newCenterLng}
                onChange={(e) => setNewCenterLng(e.target.value)}
                className="pak-input"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Radius (Km)</label>
              <input
                type="number"
                step="0.5"
                required
                value={newRadiusKm}
                onChange={(e) => setNewRadiusKm(e.target.value)}
                className="pak-input"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Base Car (PKR)</label>
              <input
                type="number"
                required
                value={newBaseFareCar}
                onChange={(e) => setNewBaseFareCar(e.target.value)}
                className="pak-input"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Per Km (PKR)</label>
              <input
                type="number"
                required
                value={newPerKmCar}
                onChange={(e) => setNewPerKmCar(e.target.value)}
                className="pak-input"
              />
            </div>
          </div>

          <div className="flex space-x-2 pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 pak-btn-primary"
            >
              {submitting ? 'Creating...' : 'Create & Activate Zone'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="border border-slate-300 text-slate-600 px-4 py-2.5 rounded-xl font-semibold"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
