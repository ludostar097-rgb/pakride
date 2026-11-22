import React, { useState, useEffect } from 'react';
import {
  Power,
  ShieldCheck,
  ShieldAlert,
  MapPin,
  Clock,
  ArrowRight,
  CheckCircle,
  TrendingUp,
  KeyRound,
  Sparkles,
  Zap,
  Camera,
  Upload,
  FileText,
  Edit3,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { RideRequest, DriverProfile, VehicleCategory } from '../shared/types';
import { Socket } from 'socket.io-client';

interface DriverViewProps {
  socket: Socket | null;
  currentUser: { id: string; fullName: string; phone: string };
  driverProfile: DriverProfile;
  lang: 'en' | 'ur';
  t: any;
  apiBaseUrl: string;
}

export const DriverView: React.FC<DriverViewProps> = ({
  socket,
  currentUser,
  driverProfile: initialProfile,
  lang,
  t,
  apiBaseUrl
}) => {
  const [profile, setProfile] = useState<DriverProfile>(initialProfile);
  const [isEditingVehicle, setIsEditingVehicle] = useState(false);
  const [vehCategory, setVehCategory] = useState<VehicleCategory>(profile.vehicle?.category || 'MOTORCYCLE');
  const [vehMake, setVehMake] = useState(profile.vehicle?.make || 'Honda');
  const [vehModel, setVehModel] = useState(profile.vehicle?.model || 'CD 70');
  const [vehPlate, setVehPlate] = useState(profile.vehicle?.plateNumber || '');
  const [vehColor, setVehColor] = useState(profile.vehicle?.color || 'Black');
  const [cnicNum, setCnicNum] = useState(profile.cnicNumber || '');
  const [profilePhoto, setProfilePhoto] = useState(profile.profilePhotoUrl || '');
  const [vehicleDoc, setVehicleDoc] = useState(profile.vehicleDocUrl || '');
  const [cnicDoc, setCnicDoc] = useState(profile.cnicDocUrl || '');
  const [savingVehicle, setSavingVehicle] = useState(false);
  const [vehicleSuccessMsg, setVehicleSuccessMsg] = useState<string | null>(null);
  const [vehicleErrorMsg, setVehicleErrorMsg] = useState<string | null>(null);

  const [availableRides, setAvailableRides] = useState<RideRequest[]>([]);
  const [activeTrip, setActiveTrip] = useState<RideRequest | null>(null);
  const [counterValues, setCounterValues] = useState<Record<string, number>>({});
  const [showPinModal, setShowPinModal] = useState(false);
  const [inputPin, setInputPin] = useState('');
  const [pinError, setPinError] = useState<string | null>(null);
  const [earnings, setEarnings] = useState<{
    completedTripsCount: number;
    totalGrossPkr: number;
    totalCommissionPkr: number;
    totalNetPkr: number;
  }>({
    completedTripsCount: 0,
    totalGrossPkr: 0,
    totalCommissionPkr: 0,
    totalNetPkr: 0
  });

  const isApproved = profile.verificationStatus === 'APPROVED';
  const isPendingDocs = profile.verificationStatus === 'PENDING_DOCUMENTS' || !profile.vehicle || !profile.vehicle.plateNumber;
  const isUnderReview = profile.verificationStatus === 'UNDER_REVIEW';

  const SAMPLE_PHOTO = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><circle cx="50" cy="50" r="50" fill="%23006633"/><circle cx="50" cy="40" r="18" fill="white"/><path d="M25 82 C25 64 75 64 75 82" fill="white"/></svg>';
  const SAMPLE_BIKE_DOC = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="160" viewBox="0 0 300 160"><rect width="300" height="160" rx="8" fill="%23f8fafc" stroke="%23006633" stroke-width="3"/><text x="150" y="32" font-size="13" font-family="sans-serif" fill="%23006633" text-anchor="middle" font-weight="bold">EXCISE &amp; TAXATION SINDH</text><text x="150" y="56" font-size="11" font-family="sans-serif" fill="%23475569" text-anchor="middle">MOTOR VEHICLE REGISTRATION</text><text x="150" y="92" font-size="18" font-family="monospace" fill="%230f172a" text-anchor="middle" font-weight="bold">KHI-4921</text><text x="150" y="120" font-size="11" font-family="sans-serif" fill="%2316a34a" text-anchor="middle">HONDA CD 70 • OFFICIAL COPY</text></svg>';
  const SAMPLE_CNIC_DOC = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="160" viewBox="0 0 300 160"><rect width="300" height="160" rx="8" fill="%23ecfdf5" stroke="%23059669" stroke-width="3"/><text x="150" y="32" font-size="13" font-family="sans-serif" fill="%23065f46" text-anchor="middle" font-weight="bold">GOVERNMENT OF PAKISTAN</text><text x="150" y="56" font-size="11" font-family="sans-serif" fill="%23047857" text-anchor="middle">NATIONAL IDENTITY CARD (CNIC)</text><text x="150" y="92" font-size="16" font-family="monospace" fill="%23111827" text-anchor="middle" font-weight="bold">42201-1234567-1</text><text x="150" y="120" font-size="11" font-family="sans-serif" fill="%23059669" text-anchor="middle">CITIZEN VERIFICATION CERTIFIED</text></svg>';

  // Sync profile when initialProfile changes from props or storage
  useEffect(() => {
    if (initialProfile) {
      setProfile(initialProfile);
      if (initialProfile.vehicle) {
        setVehCategory(initialProfile.vehicle.category);
        setVehMake(initialProfile.vehicle.make);
        setVehModel(initialProfile.vehicle.model);
        setVehPlate(initialProfile.vehicle.plateNumber);
        setVehColor(initialProfile.vehicle.color);
      }
      if (initialProfile.cnicNumber) setCnicNum(initialProfile.cnicNumber);
      if (initialProfile.profilePhotoUrl) setProfilePhoto(initialProfile.profilePhotoUrl);
      if (initialProfile.vehicleDocUrl) setVehicleDoc(initialProfile.vehicleDocUrl);
      if (initialProfile.cnicDocUrl) setCnicDoc(initialProfile.cnicDocUrl);
    }
  }, [initialProfile]);

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

  const handleSaveVehicleDocuments = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingVehicle(true);
    setVehicleErrorMsg(null);
    setVehicleSuccessMsg(null);
    try {
      if (!vehPlate.trim()) {
        throw new Error('Please enter your bike or vehicle plate number.');
      }
      const res = await fetch(`${apiBaseUrl}/api/driver/vehicle`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getAuthToken()}`
        },
        body: JSON.stringify({
          category: vehCategory,
          make: vehMake,
          model: vehModel,
          plateNumber: vehPlate.trim().toUpperCase(),
          color: vehColor,
          year: 2022,
          cnicNumber: cnicNum.trim() || '42201-1234567-1',
          profilePhotoUrl: profilePhoto || SAMPLE_PHOTO,
          vehicleDocUrl: vehicleDoc || SAMPLE_BIKE_DOC,
          cnicDocUrl: cnicDoc || SAMPLE_CNIC_DOC
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update vehicle details');
      if (data.profile) {
        setProfile(data.profile);
      }
      setVehicleSuccessMsg('Vehicle & documents submitted successfully! Admin review in progress.');
      setIsEditingVehicle(false);
    } catch (err: any) {
      setVehicleErrorMsg(err.message);
    } finally {
      setSavingVehicle(false);
    }
  };

  const getAuthToken = () => {
    return localStorage.getItem('pakride_token') || `mock-token-${currentUser.id}`;
  };

  // Fetch driver earnings
  const fetchEarnings = () => {
    fetch(`${apiBaseUrl}/api/driver/earnings`, {
      headers: { Authorization: `Bearer ${getAuthToken()}` }
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.totalGrossPkr !== undefined) setEarnings(data);
      })
      .catch((err) => console.error('Earnings fetch error:', err));
  };

  // Fetch available requests feed
  const fetchFeed = () => {
    if (!profile.isOnline || !isApproved) return;
    fetch(`${apiBaseUrl}/api/rides/driver/feed`, {
      headers: { Authorization: `Bearer ${getAuthToken()}` }
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.rides) setAvailableRides(data.rides);
      })
      .catch((err) => console.error('Feed error:', err));
  };

  useEffect(() => {
    fetchEarnings();
    if (profile.isOnline) fetchFeed();
  }, [profile.isOnline, isApproved]);

  // Socket listeners
  useEffect(() => {
    if (!socket) return;
    socket.emit('join_user_room', currentUser.id);

    socket.on('new_ride_available', (newRide: RideRequest) => {
      if (profile.isOnline && isApproved) {
        setAvailableRides((prev) => {
          if (prev.some((r) => r.id === newRide.id)) return prev;
          return [newRide, ...prev];
        });
      }
    });

    socket.on('offer_accepted_notify', (data: { ride: RideRequest }) => {
      setActiveTrip(data.ride);
      setAvailableRides((prev) => prev.filter((r) => r.id !== data.ride.id));
    });

    socket.on('ride_status_changed', (data: { ride: RideRequest }) => {
      if (activeTrip && activeTrip.id === data.ride.id) {
        setActiveTrip(data.ride);
      }
    });

    // Periodic GPS simulation for Gulistan-e-Jauhar
    const interval = setInterval(() => {
      if (profile.isOnline && isApproved) {
        const deltaLat = (Math.random() - 0.5) * 0.001;
        const deltaLng = (Math.random() - 0.5) * 0.001;
        const lat = (profile.currentLat || 24.918) + deltaLat;
        const lng = (profile.currentLng || 67.135) + deltaLng;

        socket.emit('driver_location_update', {
          driverId: currentUser.id,
          lat,
          lng
        });
      }
    }, 4000);

    return () => {
      socket.off('new_ride_available');
      socket.off('offer_accepted_notify');
      socket.off('ride_status_changed');
      clearInterval(interval);
    };
  }, [socket, currentUser.id, profile.isOnline, isApproved, activeTrip]);

  // Toggle Online/Offline
  const handleToggleOnline = async () => {
    if (!isApproved) return;
    try {
      const res = await fetch(`${apiBaseUrl}/api/driver/toggle-online`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getAuthToken()}`
        }
      });
      const data = await res.json();
      if (data.profile) {
        setProfile(data.profile);
        if (!data.profile.isOnline) setAvailableRides([]);
      }
    } catch (err) {
      console.error('Toggle online error:', err);
    }
  };

  // Submit Driver Offer / Counteroffer
  const handleSubmitOffer = async (rideId: string, counterPkr: number) => {
    try {
      await fetch(`${apiBaseUrl}/api/rides/${rideId}/offer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getAuthToken()}`
        },
        body: JSON.stringify({
          counterFarePkr: counterPkr,
          etaMinutes: 4
        })
      });
      alert(`Offer of PKR ${counterPkr} submitted! Waiting for passenger confirmation.`);
    } catch (err) {
      console.error('Submit offer error:', err);
    }
  };

  // Progress Trip Workflow
  const handleTripTransition = async (newStatus: 'EN_ROUTE' | 'IN_PROGRESS' | 'COMPLETED', otp?: string) => {
    if (!activeTrip) return;
    setPinError(null);
    try {
      const res = await fetch(`${apiBaseUrl}/api/rides/${activeTrip.id}/transition`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getAuthToken()}`
        },
        body: JSON.stringify({ newStatus, otp })
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        setPinError(data.error || 'Failed to update trip');
        return;
      }
      if (data.ride) {
        if (newStatus === 'COMPLETED') {
          setActiveTrip(null);
          fetchEarnings();
        } else {
          setActiveTrip(data.ride);
          setShowPinModal(false);
          setInputPin('');
        }
      }
    } catch (err) {
      console.error('Trip transition error:', err);
    }
  };

  // Estimated 20% platform commission saved vs competitors
  const commissionSavedPkr = Math.round(earnings.totalGrossPkr * 0.20);

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12">
      {/* 1. Header & Verification Status */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
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
                    {profile.vehicle.category === 'MOTORCYCLE' ? '🏍️' : profile.vehicle.category === 'RICKSHAW' ? '🛺' : '🚗'}{' '}
                    {profile.vehicle.make} {profile.vehicle.model} ({profile.vehicle.plateNumber}) • {t.pilotZone}
                  </span>
                ) : (
                  <span className="text-amber-600 font-semibold">Vehicle details not yet submitted</span>
                )}
              </p>
            </div>
          </div>

          {/* Action Buttons: Edit details & Online Toggle */}
          <div className="flex items-center space-x-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => {
                setIsEditingVehicle(!isEditingVehicle);
                setVehicleSuccessMsg(null);
                setVehicleErrorMsg(null);
              }}
              className="px-3.5 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center space-x-1.5 transition"
            >
              <Edit3 className="w-3.5 h-3.5 text-slate-500" />
              <span>{isEditingVehicle ? 'Close Form' : 'Update Vehicle / Docs'}</span>
            </button>

            <button
              type="button"
              disabled={!isApproved}
              onClick={handleToggleOnline}
              className={`flex-1 sm:flex-none px-6 py-2.5 rounded-xl font-bold text-sm flex items-center justify-center space-x-2 shadow-sm transition ${
                !isApproved
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  : profile.isOnline
                  ? 'bg-red-500 hover:bg-red-600 text-white'
                  : 'bg-pakgreen-500 hover:bg-pakgreen-600 text-white'
              }`}
            >
              <Power className="w-4 h-4" />
              <span>{profile.isOnline ? t.goOffline : t.goOnline}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Messages */}
      {vehicleSuccessMsg && (
        <div className="p-3.5 bg-green-50 border border-green-200 text-green-800 rounded-2xl text-xs font-semibold flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
          <span>{vehicleSuccessMsg}</span>
        </div>
      )}
      {vehicleErrorMsg && (
        <div className="p-3.5 bg-red-50 border border-red-200 text-red-600 rounded-2xl text-xs font-semibold flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
          <span>{vehicleErrorMsg}</span>
        </div>
      )}

      {/* 2. POST-LOGIN VEHICLE & DOCUMENTS ONBOARDING / UPDATE FORM */}
      {(isPendingDocs || isEditingVehicle || !profile.vehicle?.plateNumber) && (
        <div className="bg-white rounded-2xl shadow-sm border-2 border-pakgreen-500 p-6 space-y-5">
          <div className="border-b border-slate-100 pb-3 flex justify-between items-start">
            <div>
              <h3 className="text-base font-bold text-charcoal-900 flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-pakgreen-500"></span>
                <span>
                  {isPendingDocs || !profile.vehicle?.plateNumber
                    ? 'Complete Captain Profile & Vehicle Setup'
                    : 'Update Vehicle Details & Document Copies'}
                </span>
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Provide your vehicle details, Captain photo, bike registration copy, and CNIC to activate your account.
              </p>
            </div>
            {isEditingVehicle && (
              <button
                type="button"
                onClick={() => setIsEditingVehicle(false)}
                className="text-xs text-slate-400 hover:text-slate-600 font-bold"
              >
                Cancel
              </button>
            )}
          </div>

          <form onSubmit={handleSaveVehicleDocuments} className="space-y-4">
            {/* Step 1: Vehicle Category */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5">1. Select Vehicle Category</label>
              <div className="grid grid-cols-3 gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setVehCategory('MOTORCYCLE');
                    setVehMake('Honda');
                    setVehModel('CD 70');
                  }}
                  className={`p-3 rounded-xl border text-center transition ${
                    vehCategory === 'MOTORCYCLE'
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
                    setVehCategory('CAR');
                    setVehMake('Suzuki');
                    setVehModel('Alto');
                  }}
                  className={`p-3 rounded-xl border text-center transition ${
                    vehCategory === 'CAR'
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
                    setVehCategory('RICKSHAW');
                    setVehMake('Sazgar');
                    setVehModel('4-Stroke');
                  }}
                  className={`p-3 rounded-xl border text-center transition ${
                    vehCategory === 'RICKSHAW'
                      ? 'border-pakgreen-500 bg-pakgreen-50 text-pakgreen-800 font-bold shadow-xs'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <div className="text-2xl mb-1">🛺</div>
                  <div className="text-xs">Rickshaw</div>
                </button>
              </div>
            </div>

            {/* Step 2: Plate Number, Make, Model, Color */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5">2. Vehicle Identification</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <span className="text-[11px] font-semibold text-slate-500 block mb-1">
                    {vehCategory === 'MOTORCYCLE' ? 'Bike Registration / Plate #' : 'Vehicle Plate #'}
                  </span>
                  <input
                    type="text"
                    required
                    placeholder="e.g. KHI-4921 or LE-22-1234"
                    value={vehPlate}
                    onChange={(e) => setVehPlate(e.target.value)}
                    className="w-full p-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl font-bold uppercase tracking-wide focus:ring-2 focus:ring-pakgreen-500 outline-none"
                  />
                </div>
                <div>
                  <span className="text-[11px] font-semibold text-slate-500 block mb-1">CNIC / National ID</span>
                  <input
                    type="text"
                    placeholder="e.g. 42201-1234567-1"
                    value={cnicNum}
                    onChange={(e) => setCnicNum(e.target.value)}
                    className="w-full p-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-pakgreen-500 outline-none"
                  />
                </div>
                <div>
                  <span className="text-[11px] font-semibold text-slate-500 block mb-1">Manufacturer / Make</span>
                  <input
                    type="text"
                    placeholder="e.g. Honda, Suzuki, Yamaha"
                    value={vehMake}
                    onChange={(e) => setVehMake(e.target.value)}
                    className="w-full p-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-pakgreen-500 outline-none"
                  />
                </div>
                <div>
                  <span className="text-[11px] font-semibold text-slate-500 block mb-1">Model &amp; Color</span>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Model (CD 70, Alto)"
                      value={vehModel}
                      onChange={(e) => setVehModel(e.target.value)}
                      className="flex-1 p-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-pakgreen-500 outline-none"
                    />
                    <input
                      type="text"
                      placeholder="Color"
                      value={vehColor}
                      onChange={(e) => setVehColor(e.target.value)}
                      className="w-24 p-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-pakgreen-500 outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Step 3: Photos & Document Copies */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5">
                3. Upload Captain Picture &amp; Document Copies
              </label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* 3a: Captain Picture */}
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex flex-col justify-between space-y-2.5">
                  <div>
                    <span className="text-xs font-bold text-charcoal-900 block flex items-center space-x-1">
                      <Camera className="w-3.5 h-3.5 text-pakgreen-600" />
                      <span>Captain Photo / Selfie</span>
                    </span>
                    <p className="text-[10px] text-slate-500 mt-0.5">Clear headshot of driver</p>
                  </div>
                  {profilePhoto && (
                    <div className="w-16 h-16 mx-auto rounded-full overflow-hidden border-2 border-pakgreen-500 shadow-xs">
                      <img src={profilePhoto} alt="Captain Photo" className="w-full h-full object-cover" />
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
                        onChange={(e) => handleFileUpload(e, setProfilePhoto)}
                      />
                    </label>
                    <button
                      type="button"
                      onClick={() => setProfilePhoto(SAMPLE_PHOTO)}
                      className="w-full py-1 text-[11px] text-pakgreen-700 hover:underline font-semibold text-center block"
                    >
                      Use Demo Photo
                    </button>
                  </div>
                </div>

                {/* 3b: Bike / Vehicle Registration Copy */}
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex flex-col justify-between space-y-2.5">
                  <div>
                    <span className="text-xs font-bold text-charcoal-900 block flex items-center space-x-1">
                      <FileText className="w-3.5 h-3.5 text-pakgreen-600" />
                      <span>{vehCategory === 'MOTORCYCLE' ? 'Bike Registration Copy' : 'Vehicle Registration Copy'}</span>
                    </span>
                    <p className="text-[10px] text-slate-500 mt-0.5">Registration book or smart card</p>
                  </div>
                  {vehicleDoc && (
                    <div className="w-full h-16 rounded-lg overflow-hidden border border-slate-300 shadow-xs bg-white">
                      <img src={vehicleDoc} alt="Vehicle Registration Copy" className="w-full h-full object-contain" />
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
                        onChange={(e) => handleFileUpload(e, setVehicleDoc)}
                      />
                    </label>
                    <button
                      type="button"
                      onClick={() => setVehicleDoc(SAMPLE_BIKE_DOC)}
                      className="w-full py-1 text-[11px] text-pakgreen-700 hover:underline font-semibold text-center block"
                    >
                      Use Demo Copy
                    </button>
                  </div>
                </div>

                {/* 3c: CNIC / ID Copy */}
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex flex-col justify-between space-y-2.5">
                  <div>
                    <span className="text-xs font-bold text-charcoal-900 block flex items-center space-x-1">
                      <FileText className="w-3.5 h-3.5 text-pakgreen-600" />
                      <span>CNIC Copy (National ID)</span>
                    </span>
                    <p className="text-[10px] text-slate-500 mt-0.5">Government ID card copy</p>
                  </div>
                  {cnicDoc && (
                    <div className="w-full h-16 rounded-lg overflow-hidden border border-slate-300 shadow-xs bg-white">
                      <img src={cnicDoc} alt="CNIC Document Copy" className="w-full h-full object-contain" />
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
                        onChange={(e) => handleFileUpload(e, setCnicDoc)}
                      />
                    </label>
                    <button
                      type="button"
                      onClick={() => setCnicDoc(SAMPLE_CNIC_DOC)}
                      className="w-full py-1 text-[11px] text-pakgreen-700 hover:underline font-semibold text-center block"
                    >
                      Use Demo CNIC
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Submit Action */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={savingVehicle}
                className="w-full bg-pakgreen-500 hover:bg-pakgreen-600 text-white font-bold py-3 rounded-xl shadow-md transition text-sm disabled:opacity-50 flex items-center justify-center space-x-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{savingVehicle ? 'Submitting Details...' : 'Submit Documents for Verification'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Review Banner if Under Review and not editing */}
      {isUnderReview && !isPendingDocs && !isEditingVehicle && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl space-y-3">
          <div className="flex items-start space-x-3">
            <Clock className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-bold text-amber-900 text-sm">Captain Verification Under Review</h4>
              <p className="text-xs text-amber-700 mt-0.5 leading-relaxed">
                Your Captain Photo, Bike Number (<strong>{profile.vehicle?.plateNumber}</strong>), and registration copy
                have been submitted. PakRide Admin is reviewing your records. Once approved, your Online toggle will be
                activated immediately.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsEditingVehicle(true)}
              className="px-3 py-1.5 bg-white border border-amber-300 text-amber-800 rounded-lg text-xs font-bold hover:bg-amber-100 transition"
            >
              Edit Details
            </button>
          </div>

          {/* Document Preview Thumbnails */}
          <div className="flex items-center space-x-3 pt-2 border-t border-amber-200/60 text-xs text-amber-800">
            <span className="font-semibold text-[11px]">Submitted Documents:</span>
            {profile.profilePhotoUrl && (
              <span className="inline-flex items-center space-x-1 bg-white px-2 py-0.5 rounded border border-amber-200 text-[11px]">
                <span>📷 Photo</span>
              </span>
            )}
            {profile.vehicleDocUrl && (
              <span className="inline-flex items-center space-x-1 bg-white px-2 py-0.5 rounded border border-amber-200 text-[11px]">
                <span>📄 Bike Reg Copy</span>
              </span>
            )}
            {profile.cnicDocUrl && (
              <span className="inline-flex items-center space-x-1 bg-white px-2 py-0.5 rounded border border-amber-200 text-[11px]">
                <span>🪪 CNIC Copy</span>
              </span>
            )}
          </div>
        </div>
      )}

      {/* 2. Driver Earnings & 0% Commission Savings Tracker */}
      <div className="bg-gradient-to-r from-pakgreen-700 via-pakgreen-800 to-charcoal-900 rounded-2xl p-5 text-white shadow-lg space-y-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <TrendingUp className="w-5 h-5 text-pakgreen-300" />
            <h3 className="text-sm font-semibold text-pakgreen-100">{t.driverEarnings}</h3>
          </div>
          <span className="text-[11px] bg-white/20 px-2.5 py-0.5 rounded-full font-bold">
            0% Platform Fee
          </span>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-3xl font-extrabold">PKR {earnings.totalNetPkr}</div>
            <div className="text-xs text-pakgreen-200 mt-0.5">Total Net Cash in Pocket</div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">{earnings.completedTripsCount}</div>
            <div className="text-xs text-pakgreen-200 mt-0.5">{t.tripsCompleted}</div>
          </div>
        </div>

        {/* Commission Savings Callout */}
        <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs">
          <div className="flex items-center space-x-1.5 text-amber-300 font-bold">
            <Sparkles className="w-4 h-4" />
            <span>{t.savingsTitle}: PKR {commissionSavedPkr}</span>
          </div>
          <span className="text-[10px] text-slate-300">{t.savingsSubtitle}</span>
        </div>
      </div>

      {/* 3. ACTIVE TRIP PROGRESSION (If Driver is on a ride) */}
      {activeTrip && (
        <div className="bg-white rounded-2xl shadow-md border-2 border-pakgreen-500 p-5 space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold uppercase tracking-wider text-pakgreen-700 bg-pakgreen-100 px-3 py-1 rounded-full">
              {t.tripStatus}: {activeTrip.status}
            </span>
            <span className="text-lg font-extrabold text-pakgreen-600">
              Cash: PKR {Math.round((activeTrip.agreedFarePaisa || activeTrip.proposedFarePaisa) / 100)}
            </span>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
            <div className="font-bold text-sm text-charcoal-900">Passenger: {activeTrip.passengerName}</div>
            <div className="text-xs text-slate-600">🟢 Pickup: {activeTrip.pickup.address}</div>
            <div className="text-xs text-slate-600">🔴 Destination: {activeTrip.destination.address}</div>
            {activeTrip.pickupNotes && (
              <div className="text-xs text-amber-800 bg-amber-50 p-2 rounded border border-amber-200">
                📌 <span className="font-bold">Passenger Gate Note:</span> {activeTrip.pickupNotes}
              </div>
            )}
          </div>

          {/* Workflow Action Buttons */}
          <div className="pt-2">
            {activeTrip.status === 'DRIVER_SELECTED' && (
              <button
                type="button"
                onClick={() => handleTripTransition('EN_ROUTE')}
                className="w-full bg-charcoal-900 hover:bg-black text-white font-bold py-3 rounded-xl text-sm transition"
              >
                {t.markArrived}
              </button>
            )}

            {activeTrip.status === 'EN_ROUTE' && (
              <button
                type="button"
                onClick={() => setShowPinModal(true)}
                className="w-full bg-pakgreen-500 hover:bg-pakgreen-600 text-white font-bold py-3 rounded-xl text-sm shadow-md transition flex items-center justify-center space-x-2"
              >
                <KeyRound className="w-4 h-4" />
                <span>{t.startTrip}</span>
              </button>
            )}

            {activeTrip.status === 'IN_PROGRESS' && (
              <button
                type="button"
                onClick={() => handleTripTransition('COMPLETED')}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 rounded-xl text-sm shadow-lg shadow-emerald-600/30 transition flex items-center justify-center space-x-2"
              >
                <CheckCircle className="w-5 h-5" />
                <span>{t.completeTrip}</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* 4. PIN VERIFICATION MODAL */}
      {showPinModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-2xl">
            <div className="w-12 h-12 bg-pakgreen-100 rounded-full flex items-center justify-center mx-auto text-pakgreen-600">
              <KeyRound className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-center text-charcoal-900">{t.enterPinPrompt}</h3>
            <p className="text-xs text-center text-slate-500">
              Ask passenger for their 4-digit security PIN displayed on their screen.
            </p>

            {pinError && (
              <div className="p-2.5 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600 text-center font-semibold">
                {pinError}
              </div>
            )}

            <div>
              <input
                type="text"
                maxLength={4}
                value={inputPin}
                onChange={(e) => setInputPin(e.target.value)}
                placeholder="4-digit PIN"
                className="w-full text-center text-2xl font-mono font-extrabold tracking-widest py-2.5 border-2 border-slate-300 focus:border-pakgreen-500 rounded-xl outline-none"
              />
            </div>

            <div className="space-y-2">
              <button
                type="button"
                disabled={inputPin.length < 4}
                onClick={() => handleTripTransition('IN_PROGRESS', inputPin)}
                className="w-full bg-pakgreen-500 hover:bg-pakgreen-600 text-white font-bold py-2.5 rounded-xl text-sm shadow-md transition disabled:opacity-50"
              >
                {t.pinSubmit}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowPinModal(false);
                  setPinError(null);
                }}
                className="w-full border border-slate-300 text-slate-700 font-semibold py-2 rounded-xl text-xs"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. LIVE REQUEST FEED */}
      {!activeTrip && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-charcoal-900 text-base">{t.activeRequests}</h3>
            <span className="text-xs font-semibold px-2 py-0.5 bg-slate-100 rounded-full text-slate-600">
              {availableRides.length} available
            </span>
          </div>

          {!profile.isOnline ? (
            <div className="text-center py-8 text-slate-400 text-sm">
              <Power className="w-8 h-8 mx-auto mb-2 text-slate-300" />
              <p>You are currently OFFLINE.</p>
              <p className="text-xs mt-1">Tap "Go Online" above to receive passenger requests in Gulistan-e-Jauhar.</p>
            </div>
          ) : availableRides.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-sm">
              <Clock className="w-8 h-8 mx-auto mb-2 text-slate-300 animate-spin" />
              <p>{t.noRequests}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {availableRides.map((ride) => {
                const passengerFare = Math.round(ride.proposedFarePaisa / 100);
                const currentCounter = counterValues[ride.id] || passengerFare;

                return (
                  <div
                    key={ride.id}
                    className="p-4 rounded-xl border-2 border-slate-200 hover:border-pakgreen-400 bg-white transition space-y-3"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-xs font-semibold text-slate-500">
                          {ride.category} • {ride.distanceKm} km
                        </span>
                        <div className="font-bold text-sm text-charcoal-900 mt-1">
                          🟢 {ride.pickup.address}
                        </div>
                        <div className="font-bold text-sm text-charcoal-900 mt-0.5">
                          🔴 {ride.destination.address}
                        </div>
                        {ride.pickupNotes && (
                          <div className="text-xs text-amber-800 bg-amber-50 px-2 py-1 rounded mt-1.5 border border-amber-200 inline-block">
                            📌 {ride.pickupNotes}
                          </div>
                        )}
                      </div>

                      <div className="text-right">
                        <span className="text-xs text-slate-400 block">{t.yourOffer}</span>
                        <span className="text-xl font-extrabold text-pakgreen-600">
                          PKR {passengerFare}
                        </span>
                      </div>
                    </div>

                    {/* Counteroffer Controls with 1-Tap Quick Increment Pills */}
                    <div className="bg-slate-50 p-3 rounded-lg flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center space-x-1.5">
                        <button
                          type="button"
                          onClick={() => handleSubmitOffer(ride.id, passengerFare + 20)}
                          className="px-2.5 py-1 bg-white border border-slate-300 hover:border-pakgreen-500 rounded text-xs font-bold text-pakgreen-700 shadow-sm"
                        >
                          +20 PKR
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSubmitOffer(ride.id, passengerFare + 50)}
                          className="px-2.5 py-1 bg-white border border-slate-300 hover:border-pakgreen-500 rounded text-xs font-bold text-pakgreen-700 shadow-sm"
                        >
                          +50 PKR
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSubmitOffer(ride.id, passengerFare + 100)}
                          className="px-2.5 py-1 bg-white border border-slate-300 hover:border-pakgreen-500 rounded text-xs font-bold text-pakgreen-700 shadow-sm"
                        >
                          +100 PKR
                        </button>
                      </div>

                      <div className="flex items-center space-x-1.5">
                        <span className="text-xs font-semibold text-slate-600">PKR</span>
                        <input
                          type="number"
                          step="10"
                          value={currentCounter}
                          onChange={(e) =>
                            setCounterValues({ ...counterValues, [ride.id]: Number(e.target.value) })
                          }
                          className="w-20 px-2 py-1 text-sm font-bold border border-slate-300 rounded bg-white text-right outline-none"
                        />
                      </div>
                    </div>

                    {/* Submit Offer Button */}
                    <button
                      type="button"
                      onClick={() => handleSubmitOffer(ride.id, currentCounter)}
                      className="w-full bg-pakgreen-500 hover:bg-pakgreen-600 text-white font-bold py-2.5 rounded-xl text-xs transition flex items-center justify-center space-x-1"
                    >
                      <span>
                        {currentCounter === passengerFare
                          ? t.acceptRide
                          : `${t.offerFare} ${currentCounter}`}
                      </span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
