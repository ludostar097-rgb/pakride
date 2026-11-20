import React, { useState, useEffect } from 'react';
import {
  Car,
  Bike,
  Navigation,
  Clock,
  Banknote,
  Star,
  CheckCircle,
  AlertTriangle,
  Phone,
  ShieldAlert,
  ArrowRight
} from 'lucide-react';
import {
  VehicleCategory,
  LocationCoordinates,
  RideRequest,
  RideOffer
} from '../shared/types';
import { KARACHI_LANDMARKS } from '../shared/constants';
import { MapView } from './MapView';
import { Socket } from 'socket.io-client';

interface PassengerViewProps {
  socket: Socket | null;
  currentUser: { id: string; fullName: string; phone: string };
  lang: 'en' | 'ur';
  t: any;
  apiBaseUrl: string;
}

export const PassengerView: React.FC<PassengerViewProps> = ({
  socket,
  currentUser,
  lang,
  t,
  apiBaseUrl
}) => {
  const [category, setCategory] = useState<VehicleCategory>('CAR');
  const [pickup, setPickup] = useState<LocationCoordinates>({
    lat: KARACHI_LANDMARKS[0].lat,
    lng: KARACHI_LANDMARKS[0].lng,
    address: KARACHI_LANDMARKS[0].name,
    landmark: KARACHI_LANDMARKS[0].zone
  });
  const [destination, setDestination] = useState<LocationCoordinates>({
    lat: KARACHI_LANDMARKS[4].lat,
    lng: KARACHI_LANDMARKS[4].lng,
    address: KARACHI_LANDMARKS[4].name,
    landmark: KARACHI_LANDMARKS[4].zone
  });

  const [fareEstimate, setFareEstimate] = useState<{
    distanceKm: number;
    estimatedMinutes: number;
    suggestedFarePkr: number;
  } | null>(null);

  const [proposedFarePkr, setProposedFarePkr] = useState<number>(250);
  const [activeRide, setActiveRide] = useState<RideRequest | null>(null);
  const [offers, setOffers] = useState<RideOffer[]>([]);
  const [loading, setLoading] = useState(false);
  const [driverPos, setDriverPos] = useState<{ lat: number; lng: number } | undefined>();
  const [showSosModal, setShowSosModal] = useState(false);
  const [ratingSubmitted, setRatingSubmitted] = useState(false);

  // Fetch estimated fare whenever pickup, dest, or category changes
  useEffect(() => {
    if (!pickup || !destination) return;
    fetch(`${apiBaseUrl}/api/rides/calculate-fare`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        category,
        pickup,
        destination,
        zoneId: 'zone-karachi-jauhar'
      })
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.suggestedFarePkr) {
          setFareEstimate(data);
          setProposedFarePkr(data.suggestedFarePkr);
        }
      })
      .catch((err) => console.error('Fare calculation error:', err));
  }, [category, pickup, destination, apiBaseUrl]);

  // Socket event listeners for real-time ride & offer updates
  useEffect(() => {
    if (!socket) return;

    socket.emit('join_user_room', currentUser.id);

    // Listen for new counteroffers from drivers
    socket.on('new_offer_received', (data: { rideId: string; offer: RideOffer }) => {
      setOffers((prev) => {
        const exists = prev.some((o) => o.id === data.offer.id);
        if (exists) return prev;
        return [data.offer, ...prev];
      });
    });

    // Listen for ride status transitions
    socket.on('ride_status_changed', (data: { ride: RideRequest }) => {
      setActiveRide(data.ride);
    });

    // Listen for driver live GPS updates
    socket.on('driver_position_broadcast', (data: { driverId: string; lat: number; lng: number }) => {
      if (activeRide && activeRide.driverId === data.driverId) {
        setDriverPos({ lat: data.lat, lng: data.lng });
      }
    });

    return () => {
      socket.off('new_offer_received');
      socket.off('ride_status_changed');
      socket.off('driver_position_broadcast');
    };
  }, [socket, currentUser.id, activeRide]);

  // Submit Ride Request
  const handleRequestRide = async () => {
    setLoading(true);
    setOffers([]);
    try {
      const res = await fetch(`${apiBaseUrl}/api/rides/request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer mock-token-${currentUser.id}`
        },
        body: JSON.stringify({
          category,
          pickup,
          destination,
          proposedFarePkr
        })
      });
      const data = await res.json();
      if (data.ride) {
        setActiveRide(data.ride);
      }
    } catch (err) {
      console.error('Request ride failed:', err);
    } finally {
      setLoading(false);
    }
  };

  // Passenger selects an offer (Atomic Assignment)
  const handleSelectOffer = async (offerId: string) => {
    if (!activeRide) return;
    try {
      const res = await fetch(`${apiBaseUrl}/api/rides/${activeRide.id}/select-offer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer mock-token-${currentUser.id}`
        },
        body: JSON.stringify({ offerId })
      });
      const data = await res.json();
      if (data.ride) {
        setActiveRide(data.ride);
      }
    } catch (err) {
      console.error('Error selecting offer:', err);
    }
  };

  // Cancel Ride
  const handleCancelRide = async () => {
    if (!activeRide) return;
    try {
      await fetch(`${apiBaseUrl}/api/rides/${activeRide.id}/transition`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer mock-token-${currentUser.id}`
        },
        body: JSON.stringify({
          newStatus: 'CANCELLED',
          reason: 'Cancelled by Passenger'
        })
      });
      setActiveRide(null);
      setOffers([]);
    } catch (err) {
      console.error('Cancel ride error:', err);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pb-12">
      {/* Left Column: Interactive Map */}
      <div className="lg:col-span-7 h-[420px] lg:h-[680px] sticky top-20">
        <MapView
          pickup={pickup}
          destination={destination}
          driverLocation={driverPos}
          onSelectPickup={(loc) => !activeRide && setPickup(loc)}
          onSelectDestination={(loc) => !activeRide && setDestination(loc)}
        />
      </div>

      {/* Right Column: Ride Actions & Workflow */}
      <div className="lg:col-span-5 space-y-4">
        {/* CASE 1: No Active Ride - Booking Flow */}
        {!activeRide && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 space-y-5">
            <div>
              <h2 className="text-xl font-bold text-charcoal-900 flex items-center justify-between">
                <span>{t.selectCategory}</span>
                <span className="text-xs bg-pakgreen-100 text-pakgreen-800 px-2.5 py-1 rounded-full font-semibold">
                  0% Commission
                </span>
              </h2>
              <p className="text-xs text-slate-500 mt-1">{t.pilotZone}</p>
            </div>

            {/* Vehicle Category Selector */}
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setCategory('CAR')}
                className={`p-3 rounded-xl border flex flex-col items-center space-y-1 transition ${
                  category === 'CAR'
                    ? 'border-pakgreen-500 bg-pakgreen-50 text-pakgreen-700 shadow-sm'
                    : 'border-slate-200 hover:border-slate-300 text-slate-600'
                }`}
              >
                <Car className="w-6 h-6" />
                <span className="font-semibold text-xs">{t.car}</span>
                <span className="text-[10px] text-slate-400">4 Seats</span>
              </button>

              <button
                type="button"
                onClick={() => setCategory('MOTORCYCLE')}
                className={`p-3 rounded-xl border flex flex-col items-center space-y-1 transition ${
                  category === 'MOTORCYCLE'
                    ? 'border-pakgreen-500 bg-pakgreen-50 text-pakgreen-700 shadow-sm'
                    : 'border-slate-200 hover:border-slate-300 text-slate-600'
                }`}
              >
                <Bike className="w-6 h-6" />
                <span className="font-semibold text-xs">{t.motorcycle}</span>
                <span className="text-[10px] text-slate-400">1 Rider</span>
              </button>

              <button
                type="button"
                onClick={() => setCategory('RICKSHAW')}
                className={`p-3 rounded-xl border flex flex-col items-center space-y-1 transition ${
                  category === 'RICKSHAW'
                    ? 'border-pakgreen-500 bg-pakgreen-50 text-pakgreen-700 shadow-sm'
                    : 'border-slate-200 hover:border-slate-300 text-slate-600'
                }`}
              >
                <Navigation className="w-6 h-6" />
                <span className="font-semibold text-xs">{t.rickshaw}</span>
                <span className="text-[10px] text-slate-400">3 Seats</span>
              </button>
            </div>

            {/* Pickup & Destination Shortcuts */}
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1 block">
                  🟢 {t.pickupLocation}
                </label>
                <select
                  value={pickup.address}
                  onChange={(e) => {
                    const l = KARACHI_LANDMARKS.find((lm) => lm.name === e.target.value);
                    if (l) setPickup({ lat: l.lat, lng: l.lng, address: l.name, landmark: l.zone });
                  }}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-pakgreen-500 outline-none"
                >
                  {KARACHI_LANDMARKS.map((lm) => (
                    <option key={lm.name} value={lm.name}>
                      {lm.name} ({lm.zone})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1 block">
                  🔴 {t.destinationLocation}
                </label>
                <select
                  value={destination.address}
                  onChange={(e) => {
                    const l = KARACHI_LANDMARKS.find((lm) => lm.name === e.target.value);
                    if (l) setDestination({ lat: l.lat, lng: l.lng, address: l.name, landmark: l.zone });
                  }}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-pakgreen-500 outline-none"
                >
                  {KARACHI_LANDMARKS.map((lm) => (
                    <option key={lm.name} value={lm.name}>
                      {lm.name} ({lm.zone})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Estimated Stats */}
            {fareEstimate && (
              <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 grid grid-cols-3 text-center divide-x divide-slate-200">
                <div>
                  <div className="text-[10px] text-slate-400 font-medium uppercase">{t.distance}</div>
                  <div className="text-sm font-bold text-slate-700">{fareEstimate.distanceKm} km</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 font-medium uppercase">{t.estTime}</div>
                  <div className="text-sm font-bold text-slate-700">{fareEstimate.estimatedMinutes} mins</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 font-medium uppercase">{t.suggestedFare}</div>
                  <div className="text-sm font-bold text-pakgreen-600">PKR {fareEstimate.suggestedFarePkr}</div>
                </div>
              </div>
            )}

            {/* Fare Negotiation Input */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-bold text-charcoal-900">{t.yourOffer}</label>
                <span className="text-[11px] text-slate-400">
                  Suggested: PKR {fareEstimate?.suggestedFarePkr || 250}
                </span>
              </div>
              <div className="relative">
                <input
                  type="number"
                  step="10"
                  min="50"
                  value={proposedFarePkr}
                  onChange={(e) => setProposedFarePkr(Number(e.target.value))}
                  className="w-full pl-4 pr-16 py-3 text-lg font-extrabold bg-white border-2 border-slate-300 focus:border-pakgreen-500 rounded-xl outline-none"
                />
                <span className="absolute right-4 top-3.5 text-sm font-bold text-slate-400">PKR</span>
              </div>
            </div>

            {/* Request Button */}
            <button
              type="button"
              disabled={loading}
              onClick={handleRequestRide}
              className="w-full bg-pakgreen-500 hover:bg-pakgreen-600 text-white font-bold py-3.5 px-4 rounded-xl shadow-lg shadow-pakgreen-500/20 active:scale-[0.99] transition flex items-center justify-center space-x-2"
            >
              <span>{t.findDrivers}</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* CASE 2: Ride Requested & Waiting for Driver Counteroffers */}
        {activeRide && (activeRide.status === 'REQUESTED' || activeRide.status === 'OFFERS_OPEN') && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold px-2.5 py-1 bg-amber-100 text-amber-800 rounded-full">
                  {t.waitingOffers}
                </span>
                <h3 className="text-lg font-bold text-charcoal-900 mt-2">{t.receivedOffers} ({offers.length})</h3>
              </div>
              <button
                onClick={handleCancelRide}
                className="text-xs text-red-600 hover:text-red-700 font-semibold underline"
              >
                {t.cancelRide}
              </button>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex justify-between items-center text-xs">
              <div>
                <span className="text-slate-400 block">{t.yourOffer}</span>
                <span className="font-bold text-slate-800 text-sm">PKR {Math.round(activeRide.proposedFarePaisa / 100)}</span>
              </div>
              <div className="text-right">
                <span className="text-slate-400 block">{t.distance}</span>
                <span className="font-bold text-slate-800 text-sm">{activeRide.distanceKm} km</span>
              </div>
            </div>

            {/* Offers List */}
            {offers.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-sm">
                <Clock className="w-8 h-8 mx-auto mb-2 text-slate-300 animate-spin" />
                <p>{t.noOffersYet}</p>
                <p className="text-xs mt-1 text-slate-400">Drivers in Gulistan-e-Jauhar are reviewing your offer...</p>
              </div>
            ) : (
              <div className="space-y-3">
                {offers.map((offer) => {
                  const offerPkr = Math.round(offer.counterFarePaisa / 100);
                  const proposedPkr = Math.round(activeRide.proposedFarePaisa / 100);
                  const isCounter = offerPkr !== proposedPkr;

                  return (
                    <div
                      key={offer.id}
                      className="p-4 rounded-xl border-2 border-slate-200 hover:border-pakgreen-500 bg-white transition space-y-2"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-bold text-charcoal-900 text-sm">{offer.driverName}</div>
                          <div className="text-xs text-slate-500">{offer.driverVehicle}</div>
                          <div className="flex items-center text-xs text-amber-500 font-semibold mt-0.5">
                            <Star className="w-3.5 h-3.5 fill-current mr-1" />
                            <span>{offer.driverRating}</span>
                            <span className="text-slate-400 font-normal ml-2">
                              {offer.etaMinutes} {t.minsAway}
                            </span>
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="text-lg font-extrabold text-pakgreen-600">
                            PKR {offerPkr}
                          </div>
                          {isCounter ? (
                            <span className="text-[10px] font-bold px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full">
                              {t.counterOfferBadge}
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold px-2 py-0.5 bg-green-100 text-green-700 rounded-full">
                              {t.driverAcceptedBadge}
                            </span>
                          )}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleSelectOffer(offer.id)}
                        className="w-full mt-2 bg-charcoal-900 hover:bg-black text-white font-bold py-2 rounded-lg text-xs transition"
                      >
                        {t.acceptOffer}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* CASE 3: Driver Selected & Trip in Progress */}
        {activeRide &&
          ['DRIVER_SELECTED', 'EN_ROUTE', 'IN_PROGRESS', 'COMPLETED'].includes(activeRide.status) && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold uppercase tracking-wider text-pakgreen-600 bg-pakgreen-50 px-3 py-1 rounded-full">
                  {activeRide.status === 'DRIVER_SELECTED' && t.driverSelected}
                  {activeRide.status === 'EN_ROUTE' && t.enRoute}
                  {activeRide.status === 'IN_PROGRESS' && t.inProgress}
                  {activeRide.status === 'COMPLETED' && t.completed}
                </span>

                <button
                  type="button"
                  onClick={() => setShowSosModal(true)}
                  className="bg-red-50 text-red-600 hover:bg-red-100 p-2 rounded-xl text-xs font-bold flex items-center space-x-1 border border-red-200"
                >
                  <ShieldAlert className="w-4 h-4 text-red-600" />
                  <span>{t.sosButton}</span>
                </button>
              </div>

              {/* Driver Card */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex items-center justify-between">
                <div>
                  <div className="font-bold text-sm text-charcoal-900">{activeRide.driverName}</div>
                  <div className="text-xs text-slate-500">{activeRide.vehicleDetails}</div>
                  <div className="flex items-center text-xs text-amber-500 font-semibold mt-1">
                    <Star className="w-3.5 h-3.5 fill-current mr-1" />
                    <span>{activeRide.driverRating || 4.9}</span>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <a
                    href={`tel:${activeRide.driverPhone}`}
                    className="p-2.5 bg-white border border-slate-200 rounded-full text-slate-700 hover:bg-slate-100 shadow-sm"
                  >
                    <Phone className="w-4 h-4 text-pakgreen-600" />
                  </a>
                </div>
              </div>

              {/* Payment Summary */}
              <div className="p-4 bg-pakgreen-50 rounded-xl border border-pakgreen-200 flex justify-between items-center">
                <div>
                  <span className="text-xs text-slate-600 block">{t.fareSummary}</span>
                  <span className="text-xl font-extrabold text-pakgreen-700">
                    PKR {Math.round((activeRide.agreedFarePaisa || activeRide.proposedFarePaisa) / 100)}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-500">Method</span>
                  <div className="text-xs font-bold text-charcoal-900 uppercase">Cash on Arrival</div>
                </div>
              </div>

              {/* Completed Modal / Review */}
              {activeRide.status === 'COMPLETED' && (
                <div className="border-t border-slate-200 pt-4 space-y-3">
                  <div className="flex items-center space-x-2 text-pakgreen-600 font-bold text-sm">
                    <CheckCircle className="w-5 h-5" />
                    <span>{t.completed}</span>
                  </div>
                  <p className="text-xs text-slate-500">{t.rateDriver}</p>

                  <div className="flex space-x-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className="w-7 h-7 text-amber-400 fill-current cursor-pointer hover:scale-110 transition"
                      />
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveRide(null);
                      setOffers([]);
                    }}
                    className="w-full bg-pakgreen-500 hover:bg-pakgreen-600 text-white font-bold py-2.5 rounded-xl text-xs transition"
                  >
                    {t.submitReview}
                  </button>
                </div>
              )}
            </div>
          )}
      </div>

      {/* Emergency SOS Modal */}
      {showSosModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-2xl">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto text-red-600">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-center text-charcoal-900">PakRide Safety SOS</h3>
            <p className="text-xs text-center text-slate-600">
              Emergency assistance is available for rides in Karachi Gulistan-e-Jauhar pilot zone.
            </p>
            <div className="space-y-2">
              <a
                href="tel:15"
                className="block text-center w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 rounded-xl text-sm"
              >
                Call Police (Madadgar 15)
              </a>
              <button
                type="button"
                onClick={() => setShowSosModal(false)}
                className="w-full border border-slate-300 text-slate-700 font-semibold py-2.5 rounded-xl text-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
