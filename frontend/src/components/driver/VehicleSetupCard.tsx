import React, { useState } from 'react';
import { Camera, FileText, Upload, CheckCircle2 } from 'lucide-react';
import { VehicleCategory } from '../../shared/types';

interface VehicleSetupCardProps {
  isPendingDocs: boolean;
  initialCategory?: VehicleCategory;
  initialMake?: string;
  initialModel?: string;
  initialPlate?: string;
  initialColor?: string;
  initialCnic?: string;
  initialPhoto?: string;
  initialVehicleDoc?: string;
  initialCnicDoc?: string;
  onSave: (payload: {
    category: VehicleCategory;
    make: string;
    model: string;
    plateNumber: string;
    color: string;
    cnicNumber: string;
    profilePhotoUrl: string;
    vehicleDocUrl: string;
    cnicDocUrl: string;
  }) => Promise<void>;
  onCancel?: () => void;
  loading: boolean;
}

export const VehicleSetupCard: React.FC<VehicleSetupCardProps> = ({
  isPendingDocs,
  initialCategory = 'MOTORCYCLE',
  initialMake = 'Honda',
  initialModel = 'CD 70',
  initialPlate = '',
  initialColor = 'Black',
  initialCnic = '',
  initialPhoto = '',
  initialVehicleDoc = '',
  initialCnicDoc = '',
  onSave,
  onCancel,
  loading
}) => {
  const [category, setCategory] = useState<VehicleCategory>(initialCategory);
  const [make, setMake] = useState(initialMake);
  const [model, setModel] = useState(initialModel);
  const [plateNumber, setPlateNumber] = useState(initialPlate);
  const [color, setColor] = useState(initialColor);
  const [cnicNumber, setCnicNumber] = useState(initialCnic);
  const [profilePhotoUrl, setProfilePhotoUrl] = useState(initialPhoto);
  const [vehicleDocUrl, setVehicleDocUrl] = useState(initialVehicleDoc);
  const [cnicDocUrl, setCnicDocUrl] = useState(initialCnicDoc);

  const SAMPLE_PHOTO = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><circle cx="50" cy="50" r="50" fill="%23006633"/><circle cx="50" cy="40" r="18" fill="white"/><path d="M25 82 C25 64 75 64 75 82" fill="white"/></svg>';
  const SAMPLE_BIKE_DOC = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="160" viewBox="0 0 300 160"><rect width="300" height="160" rx="8" fill="%23f8fafc" stroke="%23006633" stroke-width="3"/><text x="150" y="32" font-size="13" font-family="sans-serif" fill="%23006633" text-anchor="middle" font-weight="bold">EXCISE &amp; TAXATION SINDH</text><text x="150" y="56" font-size="11" font-family="sans-serif" fill="%23475569" text-anchor="middle">MOTOR VEHICLE REGISTRATION</text><text x="150" y="92" font-size="18" font-family="monospace" fill="%230f172a" text-anchor="middle" font-weight="bold">KHI-4921</text><text x="150" y="120" font-size="11" font-family="sans-serif" fill="%2316a34a" text-anchor="middle">HONDA CD 70 • OFFICIAL COPY</text></svg>';
  const SAMPLE_CNIC_DOC = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="160" viewBox="0 0 300 160"><rect width="300" height="160" rx="8" fill="%23ecfdf5" stroke="%23059669" stroke-width="3"/><text x="150" y="32" font-size="13" font-family="sans-serif" fill="%23065f46" text-anchor="middle" font-weight="bold">GOVERNMENT OF PAKISTAN</text><text x="150" y="56" font-size="11" font-family="sans-serif" fill="%23047857" text-anchor="middle">NATIONAL IDENTITY CARD (CNIC)</text><text x="150" y="92" font-size="16" font-family="monospace" fill="%23111827" text-anchor="middle" font-weight="bold">42201-1234567-1</text><text x="150" y="120" font-size="11" font-family="sans-serif" fill="%23059669" text-anchor="middle">CITIZEN VERIFICATION CERTIFIED</text></svg>';

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, setter: (val: string) => void) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setter(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      category,
      make,
      model,
      plateNumber: plateNumber.trim().toUpperCase(),
      color,
      cnicNumber: cnicNumber.trim(),
      profilePhotoUrl: profilePhotoUrl || SAMPLE_PHOTO,
      vehicleDocUrl: vehicleDocUrl || SAMPLE_BIKE_DOC,
      cnicDocUrl: cnicDocUrl || SAMPLE_CNIC_DOC
    });
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border-2 border-pakgreen-500 p-6 space-y-5">
      <div className="border-b border-slate-100 pb-3 flex justify-between items-start">
        <div>
          <h3 className="text-base font-bold text-charcoal-900 flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-pakgreen-500"></span>
            <span>
              {isPendingDocs ? 'Complete Captain Profile & Vehicle Setup' : 'Update Vehicle Details & Document Copies'}
            </span>
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Provide your vehicle details, Captain photo, bike registration copy, and CNIC to activate your account.
          </p>
        </div>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="text-xs text-slate-400 hover:text-slate-600 font-bold"
          >
            Cancel
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* 1. Category */}
        <div>
          <label className="text-xs font-bold text-slate-700 block mb-1.5">1. Select Vehicle Category</label>
          <div className="grid grid-cols-3 gap-2.5">
            <button
              type="button"
              onClick={() => {
                setCategory('MOTORCYCLE');
                setMake('Honda');
                setModel('CD 70');
              }}
              className={`p-3 rounded-xl border text-center transition ${
                category === 'MOTORCYCLE'
                  ? 'border-pakgreen-500 bg-pakgreen-50 text-pakgreen-800 font-bold shadow-xs'
                  : 'border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <div className="text-2xl mb-1">🏍️</div>
              <div className="text-xs">Bike / Motorcycle</div>
            </button>
            <button
              type="button"
              onClick={() => {
                setCategory('CAR');
                setMake('Suzuki');
                setModel('Alto');
              }}
              className={`p-3 rounded-xl border text-center transition ${
                category === 'CAR'
                  ? 'border-pakgreen-500 bg-pakgreen-50 text-pakgreen-800 font-bold shadow-xs'
                  : 'border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <div className="text-2xl mb-1">🚗</div>
              <div className="text-xs">Car</div>
            </button>
            <button
              type="button"
              onClick={() => {
                setCategory('RICKSHAW');
                setMake('Sazgar');
                setModel('4-Stroke');
              }}
              className={`p-3 rounded-xl border text-center transition ${
                category === 'RICKSHAW'
                  ? 'border-pakgreen-500 bg-pakgreen-50 text-pakgreen-800 font-bold shadow-xs'
                  : 'border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <div className="text-2xl mb-1">🛺</div>
              <div className="text-xs">Rickshaw</div>
            </button>
          </div>
        </div>

        {/* 2. Vehicle ID */}
        <div>
          <label className="text-xs font-bold text-slate-700 block mb-1.5">2. Vehicle Identification</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <span className="text-[11px] font-semibold text-slate-500 block mb-1">
                {category === 'MOTORCYCLE' ? 'Bike Registration / Plate #' : 'Vehicle Plate #'}
              </span>
              <input
                type="text"
                required
                placeholder="e.g. KHI-4921 or LE-22-1234"
                value={plateNumber}
                onChange={(e) => setPlateNumber(e.target.value)}
                className="w-full p-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl font-bold uppercase tracking-wide focus:ring-2 focus:ring-pakgreen-500 outline-none"
              />
            </div>
            <div>
              <span className="text-[11px] font-semibold text-slate-500 block mb-1">CNIC / National ID</span>
              <input
                type="text"
                placeholder="e.g. 42201-1234567-1"
                value={cnicNumber}
                onChange={(e) => setCnicNumber(e.target.value)}
                className="w-full p-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-pakgreen-500 outline-none"
              />
            </div>
            <div>
              <span className="text-[11px] font-semibold text-slate-500 block mb-1">Make / Manufacturer</span>
              <input
                type="text"
                placeholder="e.g. Honda, Suzuki"
                value={make}
                onChange={(e) => setMake(e.target.value)}
                className="w-full p-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-pakgreen-500 outline-none"
              />
            </div>
            <div>
              <span className="text-[11px] font-semibold text-slate-500 block mb-1">Model &amp; Color</span>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="CD 70, Alto"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  className="flex-1 p-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-pakgreen-500 outline-none"
                />
                <input
                  type="text"
                  placeholder="Color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="w-24 p-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-pakgreen-500 outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* 3. Photos & Documents */}
        <div>
          <label className="text-xs font-bold text-slate-700 block mb-1.5">
            3. Upload Captain Picture &amp; Document Copies
          </label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Photo */}
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex flex-col justify-between space-y-2.5">
              <div>
                <span className="text-xs font-bold text-charcoal-900 block flex items-center space-x-1">
                  <Camera className="w-3.5 h-3.5 text-pakgreen-600" />
                  <span>Captain Photo / Selfie</span>
                </span>
                <p className="text-[10px] text-slate-500 mt-0.5">Clear headshot of driver</p>
              </div>
              {profilePhotoUrl && (
                <div className="w-16 h-16 mx-auto rounded-full overflow-hidden border-2 border-pakgreen-500 shadow-xs">
                  <img src={profilePhotoUrl} alt="Captain Photo" className="w-full h-full object-cover" />
                </div>
              )}
              <div className="space-y-1.5">
                <label className="w-full py-1.5 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg text-center cursor-pointer block text-xs font-bold text-slate-700 transition">
                  <Upload className="w-3.5 h-3.5 inline mr-1 text-slate-500" />
                  Browse Photo
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleFileUpload(e, setProfilePhotoUrl)}
                  />
                </label>
                <button
                  type="button"
                  onClick={() => setProfilePhotoUrl(SAMPLE_PHOTO)}
                  className="w-full py-1 text-[11px] text-pakgreen-700 hover:underline font-semibold text-center block"
                >
                  Use Demo Photo
                </button>
              </div>
            </div>

            {/* Registration Copy */}
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex flex-col justify-between space-y-2.5">
              <div>
                <span className="text-xs font-bold text-charcoal-900 block flex items-center space-x-1">
                  <FileText className="w-3.5 h-3.5 text-pakgreen-600" />
                  <span>{category === 'MOTORCYCLE' ? 'Bike Reg Copy' : 'Vehicle Reg Copy'}</span>
                </span>
                <p className="text-[10px] text-slate-500 mt-0.5">Registration book or smart card</p>
              </div>
              {vehicleDocUrl && (
                <div className="w-full h-16 rounded-lg overflow-hidden border border-slate-300 shadow-xs bg-white">
                  <img src={vehicleDocUrl} alt="Vehicle Registration Copy" className="w-full h-full object-contain" />
                </div>
              )}
              <div className="space-y-1.5">
                <label className="w-full py-1.5 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg text-center cursor-pointer block text-xs font-bold text-slate-700 transition">
                  <Upload className="w-3.5 h-3.5 inline mr-1 text-slate-500" />
                  Browse Document
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleFileUpload(e, setVehicleDocUrl)}
                  />
                </label>
                <button
                  type="button"
                  onClick={() => setVehicleDocUrl(SAMPLE_BIKE_DOC)}
                  className="w-full py-1 text-[11px] text-pakgreen-700 hover:underline font-semibold text-center block"
                >
                  Use Demo Copy
                </button>
              </div>
            </div>

            {/* CNIC Copy */}
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex flex-col justify-between space-y-2.5">
              <div>
                <span className="text-xs font-bold text-charcoal-900 block flex items-center space-x-1">
                  <FileText className="w-3.5 h-3.5 text-pakgreen-600" />
                  <span>CNIC Copy (National ID)</span>
                </span>
                <p className="text-[10px] text-slate-500 mt-0.5">Government ID card copy</p>
              </div>
              {cnicDocUrl && (
                <div className="w-full h-16 rounded-lg overflow-hidden border border-slate-300 shadow-xs bg-white">
                  <img src={cnicDocUrl} alt="CNIC Copy" className="w-full h-full object-contain" />
                </div>
              )}
              <div className="space-y-1.5">
                <label className="w-full py-1.5 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg text-center cursor-pointer block text-xs font-bold text-slate-700 transition">
                  <Upload className="w-3.5 h-3.5 inline mr-1 text-slate-500" />
                  Browse CNIC
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleFileUpload(e, setCnicDocUrl)}
                  />
                </label>
                <button
                  type="button"
                  onClick={() => setCnicDocUrl(SAMPLE_CNIC_DOC)}
                  className="w-full py-1 text-[11px] text-pakgreen-700 hover:underline font-semibold text-center block"
                >
                  Use Demo CNIC
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-pakgreen-500 hover:bg-pakgreen-600 text-white font-bold py-3 rounded-xl shadow-md transition text-sm disabled:opacity-50 flex items-center justify-center space-x-2"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{loading ? 'Submitting Details...' : 'Submit Documents for Verification'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
