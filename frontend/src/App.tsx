import React, { useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import {
  Car,
  Bike,
  Navigation,
  Shield,
  User,
  Globe,
  Bell,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { PassengerView } from './components/PassengerView';
import { DriverView } from './components/DriverView';
import { AdminView } from './components/AdminView';
import { translations, Language } from './i18n/translations';
import { DriverProfile } from './shared/types';

const API_BASE_URL = 'http://localhost:4000';

// Pre-seeded Synthetic Personas for instant zero-friction demonstration
const DEMO_PERSONAS = [
  {
    id: 'user-passenger-1',
    fullName: 'Ali Khan',
    phone: '03001234567',
    role: 'PASSENGER' as const,
    label: 'Passenger (Ali)'
  },
  {
    id: 'user-driver-car-1',
    fullName: 'Tariq Mehmood',
    phone: '03007654321',
    role: 'DRIVER' as const,
    label: 'Driver: Car (Tariq)'
  },
  {
    id: 'user-driver-moto-1',
    fullName: 'Kamran Iqbal',
    phone: '03112233445',
    role: 'DRIVER' as const,
    label: 'Driver: Bike (Kamran)'
  },
  {
    id: 'user-driver-rick-1',
    fullName: 'Zubair Ahmed',
    phone: '03229988776',
    role: 'DRIVER' as const,
    label: 'Driver: Rickshaw (Zubair)'
  },
  {
    id: 'user-driver-pending-1',
    fullName: 'Usman Farooq',
    phone: '03335555555',
    role: 'DRIVER' as const,
    label: 'Driver: Unapproved (Usman)'
  },
  {
    id: 'user-admin-1',
    fullName: 'Ahmad Hassan',
    phone: '03009999999',
    role: 'ADMIN' as const,
    label: 'Admin Console (Ahmad)'
  }
];

export const App: React.FC = () => {
  const [lang, setLang] = useState<Language>('en');
  const [activePersona, setActivePersona] = useState(DEMO_PERSONAS[0]);
  const [driverProfile, setDriverProfile] = useState<DriverProfile | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const t = translations[lang];

  // Initialize Socket.io connection
  useEffect(() => {
    const s = io(API_BASE_URL, {
      transports: ['websocket', 'polling']
    });

    s.on('connect', () => {
      console.log('[APP] Connected to PakRide real-time engine:', s.id);
    });

    s.on('new_offer_received', (data: any) => {
      showToast(`⚡ New Offer: ${data.offer.driverName} offered PKR ${Math.round(data.offer.counterFarePaisa / 100)}`);
    });

    s.on('offer_accepted_notify', (data: any) => {
      showToast(`🎉 Passenger ${data.ride.passengerName} accepted your offer for PKR ${Math.round(data.ride.agreedFarePaisa / 100)}!`);
    });

    s.on('ride_status_changed', (data: any) => {
      showToast(`Status Updated: Trip is now ${data.ride.status}`);
    });

    setSocket(s);

    return () => {
      s.disconnect();
    };
  }, []);

  // Fetch driver profile if active persona is a driver
  useEffect(() => {
    if (activePersona.role === 'DRIVER') {
      fetch(`${API_BASE_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer mock-token-${activePersona.id}` }
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.driverProfile) {
            setDriverProfile(data.driverProfile);
          }
        })
        .catch((err) => console.error('Error fetching driver profile:', err));
    } else {
      setDriverProfile(null);
    }
  }, [activePersona.id]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const toggleLanguage = () => {
    setLang((prev) => (prev === 'en' ? 'ur' : 'en'));
  };

  return (
    <div
      dir={lang === 'ur' ? 'rtl' : 'ltr'}
      className={`min-h-screen bg-slate-100 flex flex-col ${
        lang === 'ur' ? 'font-urdu' : 'font-sans'
      }`}
    >
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-50 bg-charcoal-900 text-white px-4 py-3 rounded-xl shadow-xl flex items-center space-x-2 border border-pakgreen-500 animate-bounce">
          <Bell className="w-4 h-4 text-pakgreen-400" />
          <span className="text-xs font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Top Demo Bar: Quick Persona Switcher & Language Toggle */}
      <header className="bg-charcoal-900 text-white sticky top-0 z-40 shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-2.5 flex flex-wrap items-center justify-between gap-3">
          {/* Brand Logo & Name */}
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-pakgreen-500 flex items-center justify-center font-extrabold text-white text-base shadow-sm">
              PR
            </div>
            <div>
              <div className="font-extrabold text-base tracking-tight flex items-center space-x-2">
                <span>{t.brand}</span>
                <span className="text-[10px] bg-pakgreen-500/30 text-pakgreen-300 px-2 py-0.5 rounded font-mono font-bold">
                  PILOT v1.0
                </span>
              </div>
              <div className="text-[10px] text-slate-400 hidden sm:block">{t.tagline}</div>
            </div>
          </div>

          {/* Quick Role Switcher */}
          <div className="flex items-center space-x-2">
            <label className="text-[11px] text-slate-300 font-semibold hidden md:inline">
              {t.switchRole}:
            </label>
            <select
              value={activePersona.id}
              onChange={(e) => {
                const found = DEMO_PERSONAS.find((p) => p.id === e.target.value);
                if (found) setActivePersona(found);
              }}
              className="bg-charcoal-800 text-xs text-white border border-charcoal-700 rounded-lg px-2.5 py-1.5 focus:ring-2 focus:ring-pakgreen-500 outline-none font-medium"
            >
              {DEMO_PERSONAS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </select>

            {/* Language Toggle */}
            <button
              type="button"
              onClick={toggleLanguage}
              className="flex items-center space-x-1 bg-charcoal-800 hover:bg-charcoal-700 text-pakgreen-400 border border-charcoal-700 px-3 py-1.5 rounded-lg text-xs font-bold transition"
            >
              <Globe className="w-3.5 h-3.5" />
              <span>{t.langToggle}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6">
        {activePersona.role === 'PASSENGER' && (
          <PassengerView
            socket={socket}
            currentUser={activePersona}
            lang={lang}
            t={t}
            apiBaseUrl={API_BASE_URL}
          />
        )}

        {activePersona.role === 'DRIVER' && (
          <DriverView
            socket={socket}
            currentUser={activePersona}
            driverProfile={
              driverProfile || {
                id: 'prof-fallback',
                userId: activePersona.id,
                verificationStatus: activePersona.id.includes('pending') ? 'UNDER_REVIEW' : 'APPROVED',
                isOnline: false,
                activeCityId: 'city-karachi',
                activeZoneId: 'zone-karachi-jauhar',
                ratingAverage: 4.9,
                ratingCount: 15,
                vehicle: {
                  id: 'v-fallback',
                  driverId: activePersona.id,
                  category: activePersona.id.includes('moto') ? 'MOTORCYCLE' : activePersona.id.includes('rick') ? 'RICKSHAW' : 'CAR',
                  make: 'Toyota',
                  model: 'Corolla',
                  year: 2021,
                  plateNumber: 'KHI-8291',
                  color: 'White'
                }
              }
            }
            lang={lang}
            t={t}
            apiBaseUrl={API_BASE_URL}
          />
        )}

        {activePersona.role === 'ADMIN' && (
          <AdminView
            currentUser={activePersona}
            lang={lang}
            t={t}
            apiBaseUrl={API_BASE_URL}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-3 text-center text-xs text-slate-500">
        PakRide • Pilot Launch Edition • Gulistan-e-Jauhar, Karachi • Cash-First Model
      </footer>
    </div>
  );
};
