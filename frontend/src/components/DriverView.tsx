import React, { useState, useEffect } from 'react';
import { RideRequest, DriverProfile, VehicleCategory, DriverVehicleSetupPayload } from '../shared/types';
import { Socket } from 'socket.io-client';
import { DriverHeader } from './driver/DriverHeader';
import { ActiveTripWorkflow } from './driver/ActiveTripWorkflow';
import { RequestsFeed } from './driver/RequestsFeed';
import { VehicleSetupCard } from './driver/VehicleSetupCard';
import { EarningsCard } from './driver/EarningsCard';

interface DriverViewProps {
  socket: Socket | null;
  currentUser: { id: string; fullName: string; phone: string };
  driverProfile: DriverProfile;
  authToken?: string;
  lang: 'en' | 'ur';
  t: any;
  apiBaseUrl: string;
}

export const DriverView: React.FC<DriverViewProps> = ({
  socket,
  currentUser,
  driverProfile: initialProfile,
  authToken,
  lang,
  t,
  apiBaseUrl
}) => {
  const [profile, setProfile] = useState<DriverProfile>(initialProfile);
  const [isEditingVehicle, setIsEditingVehicle] = useState(false);
  const [savingVehicle, setSavingVehicle] = useState(false);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const [availableRides, setAvailableRides] = useState<RideRequest[]>([]);
  const [submittedOffers, setSubmittedOffers] = useState<Record<string, number>>({});
  const [activeTrip, setActiveTrip] = useState<RideRequest | null>(null);
  const [pinError, setPinError] = useState<string | null>(null);

  // Forward dispatch state (Queue next ride near drop-off before current trip completes)
  const [showForwardDispatch, setShowForwardDispatch] = useState(false);
  const [forwardRides, setForwardRides] = useState<RideRequest[]>([]);

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
  const isPendingDocs =
    profile.verificationStatus === 'PENDING_DOCUMENTS' ||
    !profile.vehicle ||
    !profile.vehicle.plateNumber;
  const isUnderReview = profile.verificationStatus === 'UNDER_REVIEW';

  const showActionNotice = (msg: string) => {
    setActionNotice(msg);
    setTimeout(() => setActionNotice(null), 4000);
  };

  const getAuthToken = () => {
    return authToken || localStorage.getItem('pakride_token') || `mock-token-${currentUser.id}`;
  };

  // Sync profile when initialProfile or currentUser changes
  useEffect(() => {
    if (initialProfile) {
      setProfile(initialProfile);
    }
  }, [initialProfile, currentUser.id]);

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

  // Fetch active trip from database (syncs across browser tabs & app switches)
  const fetchActiveTrip = () => {
    fetch(`${apiBaseUrl}/api/rides/driver/active-trip`, {
      headers: { Authorization: `Bearer ${getAuthToken()}` }
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.ride) {
          setActiveTrip(data.ride);
          // Remove assigned trip from request feed
          setAvailableRides((prev) => prev.filter((r) => r.id !== data.ride.id));
        } else if (!data.ride && activeTrip && activeTrip.status === 'COMPLETED') {
          setActiveTrip(null);
        }
      })
      .catch((err) => console.error('Active trip fetch error:', err));
  };

  // Fetch available request feed (sorted nearest to driver or nearest to drop-off!)
  const fetchFeed = (nearLocation?: { lat: number; lng: number }) => {
    if (!profile.isOnline || !isApproved) return;
    const query = nearLocation ? `?nearLat=${nearLocation.lat}&nearLng=${nearLocation.lng}` : '';
    fetch(`${apiBaseUrl}/api/rides/driver/feed${query}`, {
      headers: { Authorization: `Bearer ${getAuthToken()}` }
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.rides) {
          if (nearLocation) {
            setForwardRides(data.rides);
          } else {
            setAvailableRides(data.rides);
          }
        }
      })
      .catch((err) => console.error('Feed error:', err));
  };

  // Initial loads and background sync polling
  useEffect(() => {
    fetchEarnings();
    fetchActiveTrip();
    if (profile.isOnline) fetchFeed();

    const interval = setInterval(() => {
      fetchActiveTrip();
      if (profile.isOnline && !activeTrip) {
        fetchFeed();
      } else if (profile.isOnline && activeTrip && activeTrip.status === 'IN_PROGRESS' && showForwardDispatch) {
        fetchFeed({ lat: activeTrip.destination.lat, lng: activeTrip.destination.lng });
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [profile.isOnline, isApproved, currentUser.id, authToken, activeTrip?.id, showForwardDispatch]);

  // Real-time socket listeners
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
      showActionNotice(
        `🎉 Passenger accepted your offer for PKR ${Math.round(
          (data.ride.agreedFarePaisa || data.ride.proposedFarePaisa) / 100
        )}!`
      );
    });

    socket.on('ride_status_changed', (data: { ride: RideRequest }) => {
      if (activeTrip && activeTrip.id === data.ride.id) {
        if (data.ride.status === 'CANCELLED') {
          setActiveTrip(null);
          showActionNotice('Trip was cancelled.');
        } else {
          setActiveTrip(data.ride);
        }
      }
    });

    socket.on('ride_cancelled_broadcast', (data: { rideId: string }) => {
      setAvailableRides((prev) => prev.filter((r) => r.id !== data.rideId));
      setForwardRides((prev) => prev.filter((r) => r.id !== data.rideId));
      if (activeTrip && activeTrip.id === data.rideId) {
        setActiveTrip(null);
        showActionNotice('Trip was cancelled.');
      }
    });

    return () => {
      socket.off('new_ride_available');
      socket.off('offer_accepted_notify');
      socket.off('ride_status_changed');
      socket.off('ride_cancelled_broadcast');
    };
  }, [socket, currentUser.id, profile.isOnline, isApproved, activeTrip?.id]);

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
        if (!data.profile.isOnline) {
          setAvailableRides([]);
          setForwardRides([]);
        }
      }
    } catch (err) {
      console.error('Toggle online error:', err);
    }
  };

  // Submit Driver Offer / Counteroffer
  const handleSubmitOffer = async (rideId: string, counterPkr: number) => {
    try {
      const res = await fetch(`${apiBaseUrl}/api/rides/${rideId}/offer`, {
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
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit offer');

      // Record submitted offer locally for immediate feedback
      setSubmittedOffers((prev) => ({ ...prev, [rideId]: counterPkr }));
      showActionNotice(`✓ Offer of PKR ${counterPkr} sent! Waiting for passenger confirmation.`);
    } catch (err: any) {
      console.error('Submit offer error:', err);
      showActionNotice(err.message || 'Submit offer failed');
    }
  };

  // Progress Trip Workflow
  const handleTripTransition = async (
    newStatus: 'EN_ROUTE' | 'IN_PROGRESS' | 'COMPLETED',
    otp?: string
  ) => {
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
          setShowForwardDispatch(false);
          fetchEarnings();
          showActionNotice('🎉 Trip completed! Cash collected.');
        } else {
          setActiveTrip(data.ride);
        }
      }
    } catch (err) {
      console.error('Trip transition error:', err);
    }
  };

  // Cancel Trip
  const handleCancelTrip = async (reason: string) => {
    if (!activeTrip) return;
    try {
      const res = await fetch(`${apiBaseUrl}/api/rides/${activeTrip.id}/transition`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getAuthToken()}`
        },
        body: JSON.stringify({
          newStatus: 'CANCELLED',
          reason
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to cancel trip');
      setActiveTrip(null);
      showActionNotice('Trip cancelled.');
      fetchFeed();
    } catch (err: any) {
      console.error('Cancel trip error:', err);
      showActionNotice(err.message || 'Could not cancel trip');
    }
  };

  // Save Vehicle & Document Details with strict TypeScript contract
  const handleSaveVehicle = async (payload: DriverVehicleSetupPayload) => {
    setSavingVehicle(true);
    try {
      const res = await fetch(`${apiBaseUrl}/api/driver/vehicle`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getAuthToken()}`
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save vehicle details');
      if (data.profile) {
        setProfile(data.profile);
      }
      setIsEditingVehicle(false);
      showActionNotice('Vehicle details and documents submitted for admin review!');
    } catch (err: unknown) {
      console.error('Vehicle save error:', err);
      const msg = err instanceof Error ? err.message : 'Error saving vehicle details';
      showActionNotice(msg);
    } finally {
      setSavingVehicle(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12 relative">
      {/* In-app Toast Banner */}
      {actionNotice && (
        <div className="fixed top-16 right-4 z-50 bg-charcoal-900 text-white px-4 py-3 rounded-2xl shadow-2xl border-2 border-pakgreen-500 flex items-center space-x-2 text-xs font-bold animate-pulse">
          <span className="w-2.5 h-2.5 rounded-full bg-pakgreen-400"></span>
          <span>{actionNotice}</span>
        </div>
      )}

      {/* 1. Driver Header */}
      <DriverHeader
        currentUser={currentUser}
        profile={profile}
        isApproved={isApproved}
        isUnderReview={isUnderReview}
        isEditingVehicle={isEditingVehicle}
        pilotZoneText={t.pilotZone}
        onToggleOnline={handleToggleOnline}
        onToggleEditVehicle={() => setIsEditingVehicle(!isEditingVehicle)}
      />

      {/* 2. Post-login Onboarding or Update Card */}
      {(isPendingDocs || isEditingVehicle || !profile.vehicle?.plateNumber) && (
        <VehicleSetupCard
          isPendingDocs={isPendingDocs}
          initialCategory={profile.vehicle?.category}
          initialMake={profile.vehicle?.make}
          initialModel={profile.vehicle?.model}
          initialPlate={profile.vehicle?.plateNumber}
          initialColor={profile.vehicle?.color}
          initialCnic={profile.cnicNumber}
          initialPhoto={profile.profilePhotoUrl}
          initialVehicleDoc={profile.vehicleDocUrl}
          initialCnicDoc={profile.cnicDocUrl}
          onSave={handleSaveVehicle}
          onCancel={isEditingVehicle ? () => setIsEditingVehicle(false) : undefined}
          loading={savingVehicle}
        />
      )}

      {/* 3. Active Trip Progression Card */}
      {activeTrip && (
        <ActiveTripWorkflow
          activeTrip={activeTrip}
          onTransition={handleTripTransition}
          onCancelTrip={handleCancelTrip}
          onToggleForwardDispatch={() => setShowForwardDispatch(!showForwardDispatch)}
          showForwardDispatch={showForwardDispatch}
          pinError={pinError}
          t={t}
        />
      )}

      {/* 4. Forward Dispatch Next Rides (Near Drop-off while on an in-progress trip) */}
      {activeTrip && activeTrip.status === 'IN_PROGRESS' && showForwardDispatch && (
        <div className="space-y-2">
          <div className="text-xs font-bold text-slate-700 px-1">
            🎯 Rides near Drop-off ({activeTrip.destination.address}):
          </div>
          <RequestsFeed
            rides={forwardRides}
            isOnline={profile.isOnline}
            onSubmitOffer={handleSubmitOffer}
            submittedOffers={submittedOffers}
            t={t}
          />
        </div>
      )}

      {/* 5. Earnings Tracker & Live Feed (When Driver is not on a ride) */}
      {!activeTrip && (
        <>
          <EarningsCard
            totalNetPkr={earnings.totalNetPkr}
            completedTripsCount={earnings.completedTripsCount}
            totalGrossPkr={earnings.totalGrossPkr}
            t={t}
          />

          <RequestsFeed
            rides={availableRides}
            isOnline={profile.isOnline}
            onSubmitOffer={handleSubmitOffer}
            submittedOffers={submittedOffers}
            t={t}
          />
        </>
      )}
    </div>
  );
};
