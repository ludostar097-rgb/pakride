import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import {
  Users,
  Car,
  DollarSign,
  Radio,
  Compass
} from 'lucide-react';
import { DriverProfile, RideRequest, PaymentLedgerEntry, CityZone } from '../shared/types';
import { PILOT_ZONES, OPERATING_CITIES } from '../shared/constants';
import { AdminHeader } from './admin/AdminHeader';
import { AdminMetrics } from './admin/AdminMetrics';
import { AdminRadarTab } from './admin/AdminRadarTab';
import { AdminZonesTab } from './admin/AdminZonesTab';
import { AdminDriversTab } from './admin/AdminDriversTab';
import { AdminRidesTab } from './admin/AdminRidesTab';
import { AdminLedgerTab } from './admin/AdminLedgerTab';
import { AddZoneModal } from './admin/AddZoneModal';
import { DocumentPreviewModal } from './admin/DocumentPreviewModal';

interface AdminViewProps {
  currentUser: { id: string; fullName: string; phone: string; role: string };
  lang: 'en' | 'ur';
  t: any;
  apiBaseUrl: string;
}

export const AdminView: React.FC<AdminViewProps> = ({
  currentUser,
  lang,
  t,
  apiBaseUrl
}) => {
  const [drivers, setDrivers] = useState<any[]>([]);
  const [rides, setRides] = useState<RideRequest[]>([]);
  const [ledger, setLedger] = useState<PaymentLedgerEntry[]>([]);
  const [zones, setZones] = useState<CityZone[]>(PILOT_ZONES as CityZone[]);
  const [settings, setSettings] = useState<any>({ introductoryCommissionPercent: 0 });
  const [activeTab, setActiveTab] = useState<'radar' | 'drivers' | 'rides' | 'ledger' | 'zones'>('radar');
  const [selectedCityId, setSelectedCityId] = useState<string>('ALL');
  const [loading, setLoading] = useState(false);
  const [previewDocModal, setPreviewDocModal] = useState<{ title: string; url: string } | null>(null);
  const [showAddZoneModal, setShowAddZoneModal] = useState(false);

  // Map refs for Radar
  const radarMapContainerRef = useRef<HTMLDivElement>(null);
  const radarMapRef = useRef<L.Map | null>(null);
  const driverMarkersMapRef = useRef<Record<string, L.Marker>>({});

  // Strict relational data model filtering via canonical cityId foreign key
  const displayedDrivers = drivers.filter(
    (d) => selectedCityId === 'ALL' || d.activeCityId === selectedCityId
  );
  const displayedRides = rides.filter(
    (r) => selectedCityId === 'ALL' || r.cityId === selectedCityId
  );
  const displayedLedger = ledger.filter(
    (l) => selectedCityId === 'ALL' || l.cityId === selectedCityId
  );
  const displayedZones = zones.filter(
    (z) => selectedCityId === 'ALL' || z.cityId === selectedCityId
  );

  const getAuthToken = () => {
    return localStorage.getItem('pakride_token') || `mock-token-${currentUser.id}`;
  };

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const headers = { Authorization: `Bearer ${getAuthToken()}` };
      const [dRes, rRes, lRes, sRes, zRes] = await Promise.all([
        fetch(`${apiBaseUrl}/api/admin/drivers`, { headers }),
        fetch(`${apiBaseUrl}/api/admin/rides`, { headers }),
        fetch(`${apiBaseUrl}/api/admin/ledger`, { headers }),
        fetch(`${apiBaseUrl}/api/admin/settings`, { headers }),
        fetch(`${apiBaseUrl}/api/zones`)
      ]);

      const [dData, rData, lData, sData, zData] = await Promise.all([
        dRes.json(),
        rRes.json(),
        lRes.json(),
        sRes.json(),
        zRes.json()
      ]);

      if (dData.drivers) setDrivers(dData.drivers);
      if (rData.rides) setRides(rData.rides);
      if (lData.ledger) setLedger(lData.ledger);
      if (sData.settings) setSettings(sData.settings);
      if (zData.zones) setZones(zData.zones);
    } catch (err) {
      console.error('Error fetching admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, [currentUser.id]);

  // Initialize Radar Map when tab is 'radar'
  useEffect(() => {
    if (activeTab !== 'radar' || !radarMapContainerRef.current) return;

    if (!radarMapRef.current) {
      const defaultCenter = [OPERATING_CITIES[0].centerLat, OPERATING_CITIES[0].centerLng] as [number, number];
      const map = L.map(radarMapContainerRef.current, {
        zoomControl: true,
        attributionControl: false
      }).setView(defaultCenter, OPERATING_CITIES[0].defaultZoom);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19
      }).addTo(map);

      radarMapRef.current = map;
    }

    const map = radarMapRef.current;
    if (map) {
      const targetCity = OPERATING_CITIES.find((c) => c.id === selectedCityId) || OPERATING_CITIES[0];
      map.flyTo([targetCity.centerLat, targetCity.centerLng], targetCity.defaultZoom);

      // Plot Drivers on Radar Map (only matching filtered city)
      Object.values(driverMarkersMapRef.current).forEach((m) => m.remove());
      driverMarkersMapRef.current = {};

      displayedDrivers.forEach((d) => {
        if (d.currentLat && d.currentLng) {
          const iconChar =
            d.vehicle?.category === 'MOTORCYCLE' ? '🏍️' : d.vehicle?.category === 'RICKSHAW' ? '🛺' : '🚗';
          const iconColor = d.isOnline ? '#00a859' : '#94a3b8';
          const customIcon = L.divIcon({
            className: 'admin-radar-pin',
            html: `<div style="background-color: white; border: 3px solid ${iconColor}; width: 34px; height: 34px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 16px; box-shadow: 0 4px 6px rgba(0,0,0,0.3);">${iconChar}</div>`,
            iconSize: [34, 34],
            iconAnchor: [17, 17]
          });

          const marker = L.marker([d.currentLat, d.currentLng], { icon: customIcon }).addTo(map);
          marker.bindPopup(
            `<b>${d.fullName}</b><br>${d.vehicle?.make || 'Vehicle'} (${d.vehicle?.category || 'CAR'})<br>${
              d.isOnline ? '🟢 Online' : '⚪ Offline'
            }`
          );
          driverMarkersMapRef.current[d.userId] = marker;
        }
      });
    }
  }, [activeTab, displayedDrivers, selectedCityId]);

  // Driver Document Approval Action
  const handleApproveDriver = async (userId: string, newStatus: 'APPROVED' | 'REJECTED') => {
    try {
      const res = await fetch(`${apiBaseUrl}/api/admin/drivers/${userId}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getAuthToken()}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      const data = await res.json();
      if (data.success) {
        fetchAdminData();
      }
    } catch (err) {
      console.error('Driver approval error:', err);
    }
  };

  // Toggle Zone Active Status
  const handleToggleZone = async (zoneId: string) => {
    try {
      const res = await fetch(`${apiBaseUrl}/api/admin/zones/${zoneId}/toggle`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${getAuthToken()}`
        }
      });
      if (res.ok) {
        fetchAdminData();
      }
    } catch (err) {
      console.error('Zone toggle error:', err);
    }
  };

  // Create New City/Zone
  const handleCreateZone = async (zoneData: {
    cityName: string;
    zoneName: string;
    centerLat: number;
    centerLng: number;
    radiusKm: number;
    baseFareCarPaisa: number;
    perKmCarPaisa: number;
  }) => {
    const res = await fetch(`${apiBaseUrl}/api/admin/zones`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${getAuthToken()}`
      },
      body: JSON.stringify(zoneData)
    });
    if (res.ok) {
      fetchAdminData();
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      {/* 1. Header with City Selector & Refresh */}
      <AdminHeader
        selectedCityId={selectedCityId}
        onCityChange={setSelectedCityId}
        onRefresh={fetchAdminData}
        loading={loading}
        t={t}
      />

      {/* 2. Top Metric Cards */}
      <AdminMetrics
        totalDriversCount={displayedDrivers.length}
        approvedDriversCount={displayedDrivers.filter((d) => d.verificationStatus === 'APPROVED').length}
        totalRidesCount={displayedRides.length}
        completedRidesCount={displayedRides.filter((r) => r.status === 'COMPLETED').length}
        grossGmvPkr={displayedLedger.reduce((acc, l) => acc + Math.round(l.grossAmountPaisa / 100), 0)}
        activeZonesCount={displayedZones.filter((z) => z.isActive).length}
        totalZonesCount={displayedZones.length}
        selectedCityId={selectedCityId}
      />

      {/* 3. Navigation Tabs (Glassmorphic Segmented Bar) */}
      <div className="flex space-x-2 glass-panel-subtle p-1.5 rounded-2xl border border-white/80 dark:border-white/10 overflow-x-auto shadow-xs">
        <button
          onClick={() => setActiveTab('radar')}
          className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center space-x-2 ${
            activeTab === 'radar'
              ? 'bg-slate-900 dark:bg-emerald-600 text-white shadow-md shadow-slate-900/30 dark:shadow-emerald-600/30 scale-[1.02]'
              : 'text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white hover:bg-white/70 dark:hover:bg-white/10'
          }`}
        >
          <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
          <span>{t.radarTab}</span>
        </button>

        <button
          onClick={() => setActiveTab('zones')}
          className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center space-x-2 ${
            activeTab === 'zones'
              ? 'bg-slate-900 dark:bg-emerald-600 text-white shadow-md shadow-slate-900/30 dark:shadow-emerald-600/30 scale-[1.02]'
              : 'text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white hover:bg-white/70 dark:hover:bg-white/10'
          }`}
        >
          <Compass className="w-4 h-4 text-emerald-400" />
          <span>Cities & Zones</span>
        </button>

        <button
          onClick={() => setActiveTab('drivers')}
          className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center space-x-2 ${
            activeTab === 'drivers'
              ? 'bg-slate-900 dark:bg-emerald-600 text-white shadow-md shadow-slate-900/30 dark:shadow-emerald-600/30 scale-[1.02]'
              : 'text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white hover:bg-white/70 dark:hover:bg-white/10'
          }`}
        >
          <Users className="w-4 h-4 text-emerald-400" />
          <span>{t.driverVerification}</span>
        </button>

        <button
          onClick={() => setActiveTab('rides')}
          className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center space-x-2 ${
            activeTab === 'rides'
              ? 'bg-slate-900 dark:bg-emerald-600 text-white shadow-md shadow-slate-900/30 dark:shadow-emerald-600/30 scale-[1.02]'
              : 'text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white hover:bg-white/70 dark:hover:bg-white/10'
          }`}
        >
          <Car className="w-4 h-4 text-emerald-400" />
          <span>{t.activeDispatches}</span>
        </button>

        <button
          onClick={() => setActiveTab('ledger')}
          className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center space-x-2 ${
            activeTab === 'ledger'
              ? 'bg-slate-900 dark:bg-emerald-600 text-white shadow-md shadow-slate-900/30 dark:shadow-emerald-600/30 scale-[1.02]'
              : 'text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white hover:bg-white/70 dark:hover:bg-white/10'
          }`}
        >
          <DollarSign className="w-4 h-4 text-emerald-400" />
          <span>{t.financialLedger}</span>
        </button>
      </div>

      {/* 4. Tab Views */}
      {activeTab === 'radar' && (
        <AdminRadarTab
          radarMapContainerRef={radarMapContainerRef}
          selectedCityId={selectedCityId}
          onSelectCityId={setSelectedCityId}
          radarTitle={t.radarTitle}
        />
      )}

      {activeTab === 'zones' && (
        <AdminZonesTab
          zones={displayedZones}
          onToggleZone={handleToggleZone}
          onOpenAddModal={() => setShowAddZoneModal(true)}
        />
      )}

      {activeTab === 'drivers' && (
        <AdminDriversTab
          drivers={displayedDrivers}
          onApproveDriver={handleApproveDriver}
          onPreviewDoc={setPreviewDocModal}
          approveText={t.approveDriver}
        />
      )}

      {activeTab === 'rides' && (
        <AdminRidesTab rides={displayedRides} />
      )}

      {activeTab === 'ledger' && (
        <AdminLedgerTab ledger={displayedLedger} />
      )}

      {/* Add Zone Modal Form */}
      <AddZoneModal
        isOpen={showAddZoneModal}
        onClose={() => setShowAddZoneModal(false)}
        onSubmit={handleCreateZone}
      />

      {/* Document Preview Lightbox Modal */}
      <DocumentPreviewModal
        modalData={previewDocModal}
        onClose={() => setPreviewDocModal(null)}
      />
    </div>
  );
};
