import React, { useState, useEffect } from 'react';
import { Socket } from 'socket.io-client';
import { Compass, ShieldAlert } from 'lucide-react';
import {
  VehicleCategory,
  LocationCoordinates,
  RideRequest,
  RideOffer
} from '../shared/types';
import { MapView } from './MapView';
import { LiveChatModal } from './LiveChatModal';
import { GeocodingService } from '../services/geocoding';
import { getNearestOperatingCity, OPERATING_CITIES } from '../shared/constants';
import { BookingCard } from './passenger/BookingCard';
import { IncomingOffersList } from './passenger/IncomingOffersList';
import { ActiveRideCard } from './passenger/ActiveRideCard';
import { RideRatingModal } from './passenger/RideRatingModal';

interface PassengerViewProps {
  socket: Socket | null;
  currentUser: { id: string; fullName: string; phone: string };
  authToken?: string;
  lang: 'en' | 'ur';
  t: any;
  apiBaseUrl: string;
}

export const PassengerView: React.FC<PassengerViewProps> = ({
  socket,
  currentUser,
  authToken,
  lang,
  t,
  apiBaseUrl
}) => {
  const [detectedCity, setDetectedCity] = useState<string>('Islamabad & Rawalpindi');
  const [category, setCategory] = useState<VehicleCategory>('CAR');
  const [mapTargetMode, setMapTargetMode] = useState<'pickup' | 'destination'>('pickup');
  const [isLocatingGps, setIsLocatingGps] = useState(false);

  // Initialize with dynamic popular hubs or saved user history
  const savedRecents = GeocodingService.getRecentLocations();
  const defaultHubs = GeocodingService.getPopularHubsForLocation();
  const [pickup, setPickup] = useState<LocationCoordinates>(savedRecents[0] || defaultHubs[0]);
  const [destination, setDestination] = useState<LocationCoordinates>(savedRecents[1] || defaultHubs[1]);
  const [pickupNotes, setPickupNotes] = useState<string>('');
  const [recentChips, setRecentChips] = useState<LocationCoordinates[]>(
    savedRecents.length > 0 ? savedRecents : defaultHubs
  );

  const [fareEstimate, setFareEstimate] = useState<{
    distanceKm: number;
    estimatedMinutes: number;
    suggestedFarePkr: number;
    zoneName?: string;
  } | null>(null);

  const [proposedFarePkr, setProposedFarePkr] = useState<number>(250);
  const [activeRide, setActiveRide] = useState<RideRequest | null>(null);
  const [offers, setOffers] = useState<RideOffer[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingOfferId, setLoadingOfferId] = useState<string | null>(null);
  const [driverPos, setDriverPos] = useState<{ lat: number; lng: number } | undefined>();
  const [showSosModal, setShowSosModal] = useState(false);
  const [showChatModal, setShowChatModal] = useState(false);
  const [submittingRating, setSubmittingRating] = useState(false);

  const notePresets = [t.noteGate || 'Near Gate', t.noteBakery || 'Near Bakery', t.noteCall || 'Call on arrival', t.noteCorner || 'Corner'];

  const getAuthToken = () => {
    return authToken || localStorage.getItem('pakride_token') || `mock-token-${currentUser.id}`;
  };

  // Automatically detect GPS location on app launch (Zero-effort onboarding)
  useEffect(() => {
    if (navigator.geolocation) {
      setIsLocatingGps(true);
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const lat = Math.round(pos.coords.latitude * 10000) / 10000;
          const lng = Math.round(pos.coords.longitude * 10000) / 10000;
          try {
            const loc = await GeocodingService.reverseGeocode(lat, lng);
            setPickup(loc);
            GeocodingService.saveRecentLocation(loc);
            const hubs = GeocodingService.getPopularHubsForLocation({ lat, lng });
            setRecentChips(hubs);
            const nearest = getNearestOperatingCity(lat, lng);
            setDetectedCity(nearest.name);
          } catch (e) {
            console.warn('Auto reverse-geocoding error:', e);
          } finally {
            setIsLocatingGps(false);
          }
        },
        (err) => {
          console.log('GPS auto-locate permission notice:', err.message);
          setIsLocatingGps(false);
        },
        { timeout: 8000, enableHighAccuracy: true }
      );
    }
  }, []);

  // Manual GPS trigger
  const handleLocateGps = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }
    setIsLocatingGps(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = Math.round(pos.coords.latitude * 10000) / 10000;
        const lng = Math.round(pos.coords.longitude * 10000) / 10000;
        try {
          const loc = await GeocodingService.reverseGeocode(lat, lng);
          setPickup(loc);
          GeocodingService.saveRecentLocation(loc);
          const hubs = GeocodingService.getPopularHubsForLocation({ lat, lng });
          setRecentChips(hubs);
          const nearest = getNearestOperatingCity(lat, lng);
          setDetectedCity(nearest.name);
        } catch (e) {
          console.warn('Reverse geocode error:', e);
        } finally {
          setIsLocatingGps(false);
        }
      },
      (err) => {
        console.warn('GPS location error:', err);
        setIsLocatingGps(false);
        alert('Could not retrieve GPS location. Please check location permissions.');
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  // Automatically derive operating city whenever passenger locates or selects a pickup location
  useEffect(() => {
    if (pickup?.lat && pickup?.lng) {
      const nearest = getNearestOperatingCity(pickup.lat, pickup.lng);
      setDetectedCity(nearest.name);
    }
  }, [pickup?.lat, pickup?.lng]);

  // Fetch estimated fare whenever pickup, dest, or category changes
  useEffect(() => {
    if (!pickup || !destination) return;

    fetch(`${apiBaseUrl}/api/rides/calculate-fare`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ category, pickup, destination })
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.suggestedFarePkr) {
          setFareEstimate(data);
          setProposedFarePkr(data.suggestedFarePkr);
          if (data.zoneName) setDetectedCity(data.zoneName);
        }
      })
      .catch((err) => console.error('Fare calculation error:', err));
  }, [category, pickup, destination, apiBaseUrl]);

  // Fetch active passenger ride & offers on mount or reconnect
  const fetchActivePassengerRide = () => {
    fetch(`${apiBaseUrl}/api/rides/passenger/active-ride`, {
      headers: { Authorization: `Bearer ${getAuthToken()}` }
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.ride) {
          setActiveRide(data.ride);
          if (Array.isArray(data.offers)) {
            setOffers(data.offers);
          }
        } else if (!data.ride && activeRide && activeRide.status !== 'COMPLETED') {
          setActiveRide(null);
          setOffers([]);
        }
      })
      .catch((err) => console.error('Passenger active ride fetch error:', err));
  };

  useEffect(() => {
    fetchActivePassengerRide();
    const pollInterval = setInterval(() => {
      fetchActivePassengerRide();
    }, 3000);
    return () => clearInterval(pollInterval);
  }, [currentUser.id, authToken]);

  // Socket event listeners for real-time ride & offer updates
  useEffect(() => {
    if (!socket) return;

    socket.emit('join_user_room', currentUser.id);

    socket.on('new_offer_received', (data: { rideId: string; offer: RideOffer }) => {
      setOffers((prev) => {
        const exists = prev.some((o) => o.id === data.offer.id);
        if (exists) return prev.map((o) => (o.id === data.offer.id ? data.offer : o));
        return [data.offer, ...prev];
      });
    });

    socket.on('ride_status_changed', (data: { ride: RideRequest }) => {
      setActiveRide(data.ride);
    });

    socket.on('ride_cancelled_broadcast', (data: { rideId: string; reason?: string }) => {
      if (activeRide && activeRide.id === data.rideId) {
        setActiveRide(null);
        setOffers([]);
      }
    });

    socket.on('driver_position_broadcast', (data: { driverId: string; lat: number; lng: number }) => {
      if (activeRide && activeRide.driverId === data.driverId) {
        setDriverPos({ lat: data.lat, lng: data.lng });
      }
    });

    return () => {
      socket.off('new_offer_received');
      socket.off('ride_status_changed');
      socket.off('ride_cancelled_broadcast');
      socket.off('driver_position_broadcast');
    };
  }, [socket, currentUser.id, activeRide]);

  // Submit Ride Request
  const handleRequestRide = async () => {
    if (!pickup || !destination) return;
    setLoading(true);
    setOffers([]);
    try {
      const res = await fetch(`${apiBaseUrl}/api/rides/request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getAuthToken()}`
        },
        body: JSON.stringify({
          category,
          pickup,
          destination,
          proposedFarePkr,
          pickupNotes: pickupNotes.trim() || undefined
        })
      });
      const data = await res.json();
      if (data.ride) {
        setActiveRide(data.ride);
        GeocodingService.saveRecentLocation(pickup);
        GeocodingService.saveRecentLocation(destination);
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
    setLoadingOfferId(offerId);
    try {
      const res = await fetch(`${apiBaseUrl}/api/rides/${activeRide.id}/select-offer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getAuthToken()}`
        },
        body: JSON.stringify({ offerId })
      });
      const data = await res.json();
      if (data.ride) {
        setActiveRide(data.ride);
      }
    } catch (err) {
      console.error('Error selecting offer:', err);
    } finally {
      setLoadingOfferId(null);
    }
  };

  // Cancel Ride
  const handleCancelRide = async (reason: string) => {
    if (!activeRide) return;
    try {
      await fetch(`${apiBaseUrl}/api/rides/${activeRide.id}/transition`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getAuthToken()}`
        },
        body: JSON.stringify({
          newStatus: 'CANCELLED',
          reason: reason || 'Cancelled by Passenger'
        })
      });
      setActiveRide(null);
      setOffers([]);
    } catch (err) {
      console.error('Cancel ride error:', err);
    }
  };

  // Passenger bumps fare to attract captains faster (inDrive style)
  const handleBumpFare = async (bumpAmountPkr: number) => {
    if (!activeRide) return;
    try {
      const res = await fetch(`${apiBaseUrl}/api/rides/${activeRide.id}/bump-fare`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getAuthToken()}`
        },
        body: JSON.stringify({ bumpAmountPkr })
      });
      const data = await res.json();
      if (data.ride) {
        setActiveRide(data.ride);
      }
    } catch (err) {
      console.error('Bump fare error:', err);
    }
  };

  // Submit Rating & Review
  const handleRatingSubmit = async (rating: number, comment: string) => {
    if (!activeRide) return;
    setSubmittingRating(true);
    try {
      await fetch(`${apiBaseUrl}/api/rides/${activeRide.id}/rate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getAuthToken()}`
        },
        body: JSON.stringify({ rating, reviewComment: comment })
      });
    } catch (err) {
      console.error('Rate ride error:', err);
    } finally {
      setSubmittingRating(false);
      setActiveRide(null);
      setOffers([]);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pb-12">
      {/* Left Column: Interactive Map with Glass Frame */}
      <div className="lg:col-span-7 h-[360px] sm:h-[440px] lg:h-[720px] relative lg:sticky lg:top-24">
        <div className="w-full h-full rounded-3xl p-1.5 glass-panel-subtle shadow-xl border border-white/80 dark:border-white/10 overflow-hidden">
          <MapView
            pickup={pickup || undefined}
            destination={destination || undefined}
            driverLocation={driverPos}
            onSelectPickup={(loc) => {
              if (!activeRide) {
                setPickup(loc);
                GeocodingService.saveRecentLocation(loc);
              }
            }}
            onSelectDestination={(loc) => {
              if (!activeRide) {
                setDestination(loc);
                GeocodingService.saveRecentLocation(loc);
              }
            }}
            zoneName={detectedCity}
          />
        </div>
        <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-400 bg-white/75 dark:bg-slate-900/70 backdrop-blur-xl px-4 py-2 rounded-2xl border border-white/80 dark:border-white/10 shadow-xs">
          <div className="flex items-center space-x-2">
            <Compass className="w-3.5 h-3.5 text-pakgreen-600" />
            <span className="font-medium">Tap map anytime to fine-tune route pin</span>
          </div>
          <div className="flex items-center space-x-1.5 font-bold">
            <span className="text-emerald-700 bg-emerald-50/80 px-2 py-0.5 rounded-md border border-emerald-200">🟢 Pickup</span>
            <span>→</span>
            <span className="text-red-700 bg-red-50/80 px-2 py-0.5 rounded-md border border-red-200">🔴 Drop</span>
          </div>
        </div>
      </div>

      {/* Right Column: Ride Actions & Workflow */}
      <div className="lg:col-span-5 space-y-4">
        {/* CASE 1: No Active Ride - Booking Flow */}
        {!activeRide && (
          <BookingCard
            category={category}
            setCategory={setCategory}
            pickup={pickup}
            setPickup={setPickup}
            destination={destination}
            setDestination={setDestination}
            recentChips={recentChips}
            fareEstimate={fareEstimate}
            proposedFarePkr={proposedFarePkr}
            setProposedFarePkr={setProposedFarePkr}
            pickupNotes={pickupNotes}
            setPickupNotes={setPickupNotes}
            notePresets={notePresets}
            isLocatingGps={isLocatingGps}
            onLocateGps={handleLocateGps}
            onRequestRide={handleRequestRide}
            loading={loading}
            t={t}
            detectedCity={detectedCity}
          />
        )}

        {/* CASE 2: Active Ride Exists (Waiting for Offers, Driver Selected, or En Route) */}
        {activeRide && (
          <>
            <ActiveRideCard
              activeRide={activeRide}
              onCancelRide={handleCancelRide}
              detectedCity={detectedCity}
              onOpenChat={() => setShowChatModal(true)}
              onOpenSos={() => setShowSosModal(true)}
              onBumpFare={handleBumpFare}
              t={t}
            />

            {/* If ride is waiting for driver offers, show Incoming Offers */}
            {(activeRide.status === 'REQUESTED' || activeRide.status === 'OFFERS_OPEN') && (
              <IncomingOffersList
                offers={offers}
                onSelectOffer={handleSelectOffer}
                loadingOfferId={loadingOfferId}
                t={t}
              />
            )}
          </>
        )}
      </div>

      {/* Live Chat Modal */}
      {activeRide && (
        <LiveChatModal
          isOpen={showChatModal}
          onClose={() => setShowChatModal(false)}
          rideId={activeRide.id}
          currentUser={currentUser}
          recipientName={activeRide.driverName || 'Captain'}
          recipientPhone={activeRide.driverPhone}
          socket={socket}
          apiBaseUrl={apiBaseUrl}
        />
      )}

      {/* 5-Star Ride Rating Modal (Appears upon ride completion) */}
      {activeRide && activeRide.status === 'COMPLETED' && (
        <RideRatingModal
          rideId={activeRide.id}
          driverName={activeRide.driverName}
          onSubmit={handleRatingSubmit}
          onDismiss={() => {
            setActiveRide(null);
            setOffers([]);
          }}
          loading={submittingRating}
        />
      )}

      {/* Emergency SOS Modal */}
      {showSosModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-2xl text-center">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto text-red-600">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-charcoal-900">PakRide Safety SOS</h3>
            <p className="text-xs text-slate-600">
              Emergency police assistance is available 24/7 across Pakistan (Police Madadgar 15).
            </p>
            <div className="space-y-2 pt-2">
              <a
                href="tel:15"
                className="block text-center w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 rounded-xl text-sm shadow-md"
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
