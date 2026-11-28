import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { Crosshair, Navigation } from 'lucide-react';
import { LocationCoordinates } from '../shared/types';
import { GeocodingService } from '../services/geocoding';

interface MapViewProps {
  pickup?: LocationCoordinates;
  destination?: LocationCoordinates;
  driverLocation?: { lat: number; lng: number };
  onSelectPickup?: (loc: LocationCoordinates) => void;
  onSelectDestination?: (loc: LocationCoordinates) => void;
  mode?: 'pickup' | 'destination' | 'tracking';
  activeCity?: string;
  zoneName?: string;
}

export const MapView: React.FC<MapViewProps> = ({
  pickup,
  destination,
  driverLocation,
  onSelectPickup,
  onSelectDestination,
  mode = 'pickup',
  activeCity,
  zoneName
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
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const [isDark, setIsDark] = useState<boolean>(() => 
    typeof document !== 'undefined' ? document.documentElement.classList.contains('dark') : true
  );

  // Sync theme changes with DOM
  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains('dark'));
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    // Center initially on pickup coordinates if available, or Islamabad / Karachi centroid
    const initialCenter: [number, number] = pickup
      ? [pickup.lat, pickup.lng]
      : [33.6844, 73.0479]; // Default Islamabad / Pakistan central
    const map = L.map(mapContainerRef.current, {
      zoomControl: true,
      attributionControl: false
    }).setView(initialCenter, 13);

    // Free, reliable OpenStreetMap vector/raster tiles (Subdomains a, b, c)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      subdomains: ['a', 'b', 'c']
    }).addTo(map);

    // Map click handler: places pin and performs live Reverse Geocoding
    map.on('click', async (e) => {
      const wrapped = e.latlng.wrap();
      const lat = Math.round(wrapped.lat * 10000) / 10000;
      const lng = Math.round(wrapped.lng * 10000) / 10000;

      // Real Reverse Geocoding to get real street/sector name
      const realLoc = await GeocodingService.reverseGeocode(lat, lng);

      if (mode === 'pickup' && onSelectPickup) {
        onSelectPickup(realLoc);
      } else if (mode === 'destination' && onSelectDestination) {
        onSelectDestination(realLoc);
      }
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Pan smoothly to user's Pickup Location whenever set or updated
  useEffect(() => {
    if (!mapRef.current || !pickup) return;
    if (!destination) {
      mapRef.current.flyTo([pickup.lat, pickup.lng], 15, { duration: 1.2 });
    }
  }, [pickup?.lat, pickup?.lng, destination]);

  // Update Pickup Marker
  useEffect(() => {
    if (!mapRef.current) return;
    // Update Pickup Marker (Airbnb Emerald Vector Badge)
    if (pickup) {
      const pickupIcon = L.divIcon({
        className: 'airbnb-pickup-pin',
        html: `<div style="display:flex; align-items:center; justify-content:center; width:36px; height:36px;">
          <div style="position:absolute; width:36px; height:36px; border-radius:50%; background:rgba(5, 150, 105, 0.25); animation:ping 1.8s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
          <div style="background:#059669; width:28px; height:28px; border-radius:50%; display:flex; align-items:center; justify-content:center; border:2.5px solid #ffffff; box-shadow:0 4px 12px rgba(0,0,0,0.3); z-index:2;">
            <div style="background:#ffffff; width:8px; height:8px; border-radius:50%;"></div>
          </div>
        </div>`,
        iconSize: [36, 36],
        iconAnchor: [18, 18]
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

  // Update Destination Marker (Airbnb Sleek Pill / Badge Marker)
  useEffect(() => {
    if (!mapRef.current) return;
    if (destination) {
      const destIcon = L.divIcon({
        className: 'airbnb-dest-pin',
        html: `<div style="background:#0f172a; color:#ffffff; padding:4px 10px; border-radius:9999px; font-weight:800; font-size:11px; border:2px solid #ffffff; box-shadow:0 6px 16px rgba(0,0,0,0.35); display:inline-flex; align-items:center; gap:5px; white-space:nowrap; font-family:sans-serif;">
          <span style="color:#ef4444; font-size:10px;">●</span>
          <span>Destination</span>
        </div>`,
        iconSize: [90, 28],
        iconAnchor: [45, 14]
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

  // Update Driver Marker (Airbnb Vehicle Top-Down Badge)
  useEffect(() => {
    if (!mapRef.current) return;
    if (driverLocation) {
      const driverIcon = L.divIcon({
        className: 'airbnb-driver-pin',
        html: `<div style="background:#059669; color:#ffffff; width:38px; height:38px; border-radius:50%; display:flex; align-items:center; justify-content:center; border:3px solid #ffffff; box-shadow:0 6px 16px rgba(0,0,0,0.35);">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.4-1.7-1.1-2.2L18 8.5C17.3 7.6 16.2 7 15 7H9C7.8 7 6.7 7.6 6 8.5L3.1 10.8C2.4 11.3 2 12.1 2 13v3c0 .6.4 1 1 1h2"/>
            <circle cx="7" cy="17" r="2.5"/>
            <path d="M9.5 17h5"/>
            <circle cx="17" cy="17" r="2.5"/>
          </svg>
        </div>`,
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
      async (pos) => {
        setLocating(false);
        const lat = Math.round(pos.coords.latitude * 10000) / 10000;
        const lng = Math.round(pos.coords.longitude * 10000) / 10000;
        try {
          const myLoc = await GeocodingService.reverseGeocode(lat, lng);
          if (mapRef.current) {
            mapRef.current.setView([lat, lng], 15);
          }
          if (onSelectPickup) {
            onSelectPickup(myLoc);
          }
        } catch (e) {
          if (mapRef.current) {
            mapRef.current.setView([lat, lng], 15);
          }
        }
      },
      (err) => {
        setLocating(false);
        console.warn('Geolocation error:', err.message);
      },
      { timeout: 8000 }
    );
  };

  return (
    <div className="relative w-full h-full min-h-[300px] overflow-hidden rounded-3xl border border-slate-200 dark:border-white/10 shadow-inner">
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* Floating Road Route Stats Banner (When Route is loaded) */}
      {routeInfo && (
        <div className="absolute top-3 right-3 z-[400] bg-slate-900/90 text-white backdrop-blur-xl px-3.5 py-1.5 rounded-2xl shadow-xl border border-white/15 flex items-center space-x-3 text-xs">
          <div className="flex items-center space-x-1">
            <Navigation className="w-3.5 h-3.5 text-emerald-400" />
            <span className="font-bold">{routeInfo.distanceKm} km</span>
          </div>
          <div className="text-slate-500">|</div>
          <div className="text-emerald-300 font-semibold">{routeInfo.durationMin} mins drive</div>
        </div>
      )}

      {/* GPS Locate Me Button */}
      <button
        type="button"
        onClick={handleLocateMe}
        disabled={locating}
        title="Locate my GPS position"
        className="absolute bottom-4 right-4 z-[400] p-3 bg-white/90 dark:bg-slate-900/90 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-full shadow-xl border border-slate-200 dark:border-white/15 active:scale-95 transition backdrop-blur-md"
      >
        <Crosshair className={`w-5 h-5 ${locating ? 'animate-spin text-emerald-500' : 'text-slate-700 dark:text-slate-300'}`} />
      </button>
    </div>
  );
};
