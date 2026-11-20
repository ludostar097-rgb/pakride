import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
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

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    // Karachi Gulistan-e-Jauhar coordinates
    const jauharCenter: [number, number] = [24.918, 67.135];
    const map = L.map(mapContainerRef.current, {
      zoomControl: false,
      attributionControl: false
    }).setView(jauharCenter, 14);

    // Free OpenStreetMap vector/raster tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19
    }).addTo(map);

    // Pilot Zone Green Boundary Circle (Gulistan-e-Jauhar ~5.5km)
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
        address: `Map Location (${lat.toFixed(3)}, ${lng.toFixed(3)})`,
        landmark: 'Gulistan-e-Jauhar Point'
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
        html: `<div style="background-color: #00a859; color: white; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; border: 3px solid white; box-shadow: 0 4px 6px rgba(0,0,0,0.3);">📍</div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 32]
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
        html: `<div style="background-color: #ef4444; color: white; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; border: 3px solid white; box-shadow: 0 4px 6px rgba(0,0,0,0.3);">🏁</div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 32]
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
        html: `<div style="background-color: #1e293b; color: white; width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 3px solid #00a859; box-shadow: 0 4px 10px rgba(0,0,0,0.4); font-size: 18px;">🚗</div>`,
        iconSize: [36, 36],
        iconAnchor: [18, 18]
      });

      if (!driverMarkerRef.current) {
        driverMarkerRef.current = L.marker([driverLocation.lat, driverLocation.lng], { icon: driverIcon }).addTo(mapRef.current);
      } else {
        driverMarkerRef.current.setLatLng([driverLocation.lat, driverLocation.lng]);
      }
    }
  }, [driverLocation]);

  // Draw Route Polyline
  useEffect(() => {
    if (!mapRef.current) return;

    if (pickup && destination) {
      const latlngs: [number, number][] = [
        [pickup.lat, pickup.lng],
        [destination.lat, destination.lng]
      ];

      if (!polylineRef.current) {
        polylineRef.current = L.polyline(latlngs, {
          color: '#00a859',
          weight: 4,
          opacity: 0.8,
          dashArray: '8, 8'
        }).addTo(mapRef.current);
      } else {
        polylineRef.current.setLatLngs(latlngs);
      }

      // Auto fit map view to cover both markers
      mapRef.current.fitBounds(L.latLngBounds(latlngs), { padding: [50, 50] });
    } else if (polylineRef.current) {
      polylineRef.current.remove();
      polylineRef.current = null;
    }
  }, [pickup, destination]);

  return (
    <div className="relative w-full h-full min-h-[300px] overflow-hidden rounded-2xl border border-slate-200 shadow-inner">
      <div ref={mapContainerRef} className="w-full h-full z-0" />
      {/* Pilot badge indicator */}
      <div className="absolute top-3 left-3 z-[400] bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-full shadow-md border border-slate-200 flex items-center space-x-2 text-xs font-semibold text-slate-700">
        <span className="w-2.5 h-2.5 rounded-full bg-pakgreen-500 animate-pulse"></span>
        <span>Karachi: Gulistan-e-Jauhar Pilot Zone</span>
      </div>
    </div>
  );
};
