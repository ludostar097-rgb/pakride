import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { Crosshair, Navigation } from 'lucide-react';
import { LocationCoordinates } from '../shared/types';

interface MapViewProps {
  pickup?: LocationCoordinates;
  destination?: LocationCoordinates;
  driverLocation?: { lat: number; lng: number };
  onSelectPickup?: (loc: LocationCoordinates) => void;
  onSelectDestination?: (loc: LocationCoordinates) => void;
  mode?: 'pickup' | 'destination' | 'tracking';
}

export const MapView: React.FC<MapViewProps> = ({
  pickup,
  destination,
  driverLocation,
  onSelectPickup,
  onSelectDestination,
  mode = 'pickup'
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const pickupMarkerRef = useRef<L.Marker | null>(null);
  const destMarkerRef = useRef<L.Marker | null>(null);
  const driverMarkerRef = useRef<L.Marker | null>(null);
  const polylineRef = useRef<L.Polyline | null>(null);
  const driverToPickupLineRef = useRef<L.Polyline | null>(null);

  const [routeInfo, setRouteInfo] = useState<{ distanceKm: number; durationMin: number } | null>(null);
  const [locating, setLocating] = useState(false);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    // Karachi Gulistan-e-Jauhar coordinates
    const jauharCenter: [number, number] = [24.918, 67.135];
    const map = L.map(mapContainerRef.current, {
      zoomControl: true,
      attributionControl: false
    }).setView(jauharCenter, 14);

    // Free OpenStreetMap vector/raster tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19
    }).addTo(map);

    // Pilot Zone Green Boundary Circle (Gulistan-e-Jauhar ~4.5km radius)
    L.circle(jauharCenter, {
      radius: 4000,
      color: '#00a859',
      weight: 2,
      dashArray: '6, 6',
      fillColor: '#00a859',
      fillOpacity: 0.08
    }).addTo(map);

    // Map click handler to place pins
    map.on('click', (e) => {
      const lat = Math.round(e.latlng.lat * 10000) / 10000;
      const lng = Math.round(e.latlng.lng * 10000) / 10000;
      const customLoc: LocationCoordinates = {
        lat,
        lng,
        address: `Custom Point (${lat.toFixed(3)}, ${lng.toFixed(3)})`,
        landmark: 'Gulistan-e-Jauhar'
      };

      if (mode === 'pickup' && onSelectPickup) {
        onSelectPickup(customLoc);
      } else if (mode === 'destination' && onSelectDestination) {
        onSelectDestination(customLoc);
      }
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Update Pickup Marker
  useEffect(() => {
    if (!mapRef.current) return;
    if (pickup) {
      const pickupIcon = L.divIcon({
        className: 'custom-pin',
        html: `<div style="background-color: #00a859; color: white; width: 34px; height: 34px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; border: 3px solid white; box-shadow: 0 4px 8px rgba(0,0,0,0.3); font-size: 16px;">📍</div>`,
        iconSize: [34, 34],
        iconAnchor: [17, 34]
      });

      if (!pickupMarkerRef.current) {
        pickupMarkerRef.current = L.marker([pickup.lat, pickup.lng], { icon: pickupIcon }).addTo(mapRef.current);
      } else {
        pickupMarkerRef.current.setLatLng([pickup.lat, pickup.lng]);
      }
    } else if (pickupMarkerRef.current) {
      pickupMarkerRef.current.remove();
      pickupMarkerRef.current = null;
    }
  }, [pickup]);

  // Update Destination Marker
  useEffect(() => {
    if (!mapRef.current) return;
    if (destination) {
      const destIcon = L.divIcon({
        className: 'custom-pin',
        html: `<div style="background-color: #ef4444; color: white; width: 34px; height: 34px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; border: 3px solid white; box-shadow: 0 4px 8px rgba(0,0,0,0.3); font-size: 16px;">🏁</div>`,
        iconSize: [34, 34],
        iconAnchor: [17, 34]
      });

      if (!destMarkerRef.current) {
        destMarkerRef.current = L.marker([destination.lat, destination.lng], { icon: destIcon }).addTo(mapRef.current);
      } else {
        destMarkerRef.current.setLatLng([destination.lat, destination.lng]);
      }
    } else if (destMarkerRef.current) {
      destMarkerRef.current.remove();
      destMarkerRef.current = null;
    }
  }, [destination]);

  // Update Driver Marker
  useEffect(() => {
    if (!mapRef.current) return;
    if (driverLocation) {
      const driverIcon = L.divIcon({
        className: 'custom-driver-pin',
        html: `<div style="background-color: #1e293b; color: white; width: 38px; height: 38px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 3px solid #00a859; box-shadow: 0 4px 10px rgba(0,0,0,0.4); font-size: 18px;">🚗</div>`,
        iconSize: [38, 38],
        iconAnchor: [19, 19]
      });

      if (!driverMarkerRef.current) {
        driverMarkerRef.current = L.marker([driverLocation.lat, driverLocation.lng], { icon: driverIcon }).addTo(mapRef.current);
      } else {
        driverMarkerRef.current.setLatLng([driverLocation.lat, driverLocation.lng]);
      }

      // Draw driver-to-pickup path if pickup exists
      if (pickup) {
        const dLine: [number, number][] = [
          [driverLocation.lat, driverLocation.lng],
          [pickup.lat, pickup.lng]
        ];
        if (!driverToPickupLineRef.current) {
          driverToPickupLineRef.current = L.polyline(dLine, {
            color: '#3b82f6',
            weight: 3,
            dashArray: '5, 8',
            opacity: 0.7
          }).addTo(mapRef.current);
        } else {
          driverToPickupLineRef.current.setLatLngs(dLine);
        }
      }
    } else {
      if (driverMarkerRef.current) {
        driverMarkerRef.current.remove();
        driverMarkerRef.current = null;
      }
      if (driverToPickupLineRef.current) {
        driverToPickupLineRef.current.remove();
        driverToPickupLineRef.current = null;
      }
    }
  }, [driverLocation, pickup]);

  // Dynamic Road Routing (OSRM Free Road Engine + Smooth Direct Fallback)
  useEffect(() => {
    if (!mapRef.current) return;

    if (pickup && destination) {
      let isSubscribed = true;

      // Try fetching real street road network path from Open Source Routing Machine (OSRM)
      const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${pickup.lng},${pickup.lat};${destination.lng},${destination.lat}?overview=full&geometries=geojson`;

      fetch(osrmUrl)
        .then((res) => res.json())
        .then((data) => {
          if (!isSubscribed || !mapRef.current) return;

          let latlngs: [number, number][] = [];

          if (data && data.routes && data.routes.length > 0) {
            const coords = data.routes[0].geometry.coordinates;
            latlngs = coords.map((c: [number, number]) => [c[1], c[0]]);
            const distKm = Math.round((data.routes[0].distance / 1000) * 10) / 10;
            const durMin = Math.round(data.routes[0].duration / 60);
            setRouteInfo({ distanceKm: distKm, durationMin: durMin });
          } else {
            // Fallback straight path
            latlngs = [
              [pickup.lat, pickup.lng],
              [destination.lat, destination.lng]
            ];
          }

          if (!polylineRef.current) {
            polylineRef.current = L.polyline(latlngs, {
              color: '#00a859',
              weight: 5,
              opacity: 0.85
            }).addTo(mapRef.current);
          } else {
            polylineRef.current.setLatLngs(latlngs);
          }

          mapRef.current.fitBounds(L.latLngBounds(latlngs), { padding: [60, 60] });
        })
        .catch(() => {
          if (!isSubscribed || !mapRef.current) return;
          // Fallback to direct path on offline/network errors
          const latlngs: [number, number][] = [
            [pickup.lat, pickup.lng],
            [destination.lat, destination.lng]
          ];
          if (!polylineRef.current) {
            polylineRef.current = L.polyline(latlngs, {
              color: '#00a859',
              weight: 4,
              dashArray: '8, 8',
              opacity: 0.8
            }).addTo(mapRef.current);
          } else {
            polylineRef.current.setLatLngs(latlngs);
          }
          mapRef.current.fitBounds(L.latLngBounds(latlngs), { padding: [50, 50] });
        });

      return () => {
        isSubscribed = false;
      };
    } else if (polylineRef.current) {
      polylineRef.current.remove();
      polylineRef.current = null;
      setRouteInfo(null);
    }
  }, [pickup, destination]);

  // GPS "Locate Me" Button Handler
  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        const lat = Math.round(pos.coords.latitude * 10000) / 10000;
        const lng = Math.round(pos.coords.longitude * 10000) / 10000;
        const myLoc: LocationCoordinates = {
          lat,
          lng,
          address: `My GPS Location (${lat.toFixed(3)}, ${lng.toFixed(3)})`,
          landmark: 'Current GPS'
        };

        if (mapRef.current) {
          mapRef.current.setView([lat, lng], 15);
        }
        if (onSelectPickup) {
          onSelectPickup(myLoc);
        }
      },
      (err) => {
        setLocating(false);
        console.warn('Geolocation error:', err.message);
        // Center on Karachi Gulistan-e-Jauhar default
        if (mapRef.current) {
          mapRef.current.setView([24.918, 67.135], 14);
        }
      },
      { timeout: 8000 }
    );
  };

  return (
    <div className="relative w-full h-full min-h-[300px] overflow-hidden rounded-2xl border border-slate-200 shadow-inner">
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* Pilot Zone Pill Indicator */}
      <div className="absolute top-3 left-3 z-[400] bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-full shadow-md border border-slate-200 flex items-center space-x-2 text-xs font-semibold text-slate-700">
        <span className="w-2.5 h-2.5 rounded-full bg-pakgreen-500 animate-pulse"></span>
        <span>Karachi: Gulistan-e-Jauhar Pilot Zone</span>
      </div>

      {/* Floating Road Route Stats Banner (When Route is loaded) */}
      {routeInfo && (
        <div className="absolute top-3 right-3 z-[400] bg-charcoal-900/90 text-white backdrop-blur-md px-3 py-1.5 rounded-xl shadow-lg border border-slate-700 flex items-center space-x-3 text-xs">
          <div className="flex items-center space-x-1">
            <Navigation className="w-3.5 h-3.5 text-pakgreen-400" />
            <span className="font-bold">{routeInfo.distanceKm} km</span>
          </div>
          <div className="text-slate-400">|</div>
          <div className="text-pakgreen-300 font-semibold">{routeInfo.durationMin} mins drive</div>
        </div>
      )}

      {/* GPS Locate Me Button */}
      <button
        type="button"
        onClick={handleLocateMe}
        disabled={locating}
        title="Locate my GPS position"
        className="absolute bottom-4 right-4 z-[400] p-3 bg-white hover:bg-slate-50 text-slate-700 rounded-full shadow-lg border border-slate-200 active:scale-95 transition"
      >
        <Crosshair className={`w-5 h-5 ${locating ? 'animate-spin text-pakgreen-500' : 'text-slate-700'}`} />
      </button>
    </div>
  );
};
