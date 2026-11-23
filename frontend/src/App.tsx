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
  AlertCircle,
  LogIn,
  LogOut,
  UserCheck,
  ShieldAlert
} from 'lucide-react';
import { PassengerView } from './components/PassengerView';
import { DriverView } from './components/DriverView';
import { AdminView } from './components/AdminView';
import { AuthModal } from './components/AuthModal';
import { translations, Language } from './i18n/translations';
import { DriverProfile, UserRole, AuthSuccessPayload } from './shared/types';

// Environment-aware API URL (Vercel Cloud or Localhost)
const API_BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:4000';

// Pre-seeded Personas for testing & instant demonstration
export interface PersonaUser {
  id: string;
  fullName: string;
  phone: string;
  role: UserRole;
  label: string;
}

const DEMO_PERSONAS: PersonaUser[] = [
  {
    id: 'user-passenger-1',
    fullName: 'Ali Khan',
    phone: '03001234567',
    role: 'PASSENGER',
    label: 'Passenger 1: Ali Khan'
  },
  {
    id: 'user-passenger-2',
    fullName: 'Zainab Bibi',
    phone: '03007443615',
    role: 'PASSENGER',
    label: 'Passenger 2: Zainab Bibi'
  },
  {
    id: 'user-driver-car-1',
    fullName: 'Tariq Mehmood',
    phone: '03007654321',
    role: 'DRIVER',
    label: 'Driver 1 (Car): Tariq Mehmood'
  },
  {
    id: 'user-driver-moto-1',
    fullName: 'Kamran Iqbal',
    phone: '03112233445',
    role: 'DRIVER',
    label: 'Driver 2 (Motorcycle): Kamran Iqbal'
  },
  {
    id: 'user-driver-rick-1',
    fullName: 'Zubair Ahmed',
    phone: '03229988776',
    role: 'DRIVER',
    label: 'Driver 3 (Rickshaw): Zubair Ahmed'
  },
  {
    id: 'user-admin-1',
    fullName: 'Ahmad Hassan',
    phone: '03009999999',
    role: 'ADMIN',
    label: 'Admin: Ahmad Hassan'
  }
];

export const App: React.FC = () => {
  const [lang, setLang] = useState<Language>('en');
  const [appMode, setAppMode] = useState<'PASSENGER' | 'DRIVER' | 'ADMIN'>('PASSENGER');
  const [currentUser, setCurrentUser] = useState<PersonaUser>(() => {
    try {
      const stored = localStorage.getItem('pakride_user');
      const token = localStorage.getItem('pakride_token');
      if (stored && token) {
        return JSON.parse(stored);
      }
    } catch {}
    // Initial default: Passenger 1 (Ali Khan)
    return DEMO_PERSONAS[0];
  });
  const [authToken, setAuthToken] = useState<string>(() => {
    return localStorage.getItem('pakride_token') || '';
  });
  const [isLoggedOut, setIsLoggedOut] = useState(false);
  const [driverProfile, setDriverProfile] = useState<DriverProfile | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);

  const t = translations[lang];

  const getAuthToken = () => {
    return authToken || localStorage.getItem('pakride_token') || `mock-token-${currentUser.id}`;
  };

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

  // Fetch driver profile if current user is a driver
  useEffect(() => {
    if (currentUser && currentUser.role === 'DRIVER') {
      fetch(`${API_BASE_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${getAuthToken()}` }
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
  }, [currentUser?.id, currentUser?.role, authToken]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const toggleLanguage = () => {
    setLang((prev) => (prev === 'en' ? 'ur' : 'en'));
  };

  const handleAuthSuccess = (data: AuthSuccessPayload) => {
    const userObj: PersonaUser = {
      id: data.user.id,
      fullName: data.user.fullName,
      phone: data.user.phone,
      role: data.user.role,
      label: `${data.user.role}: ${data.user.fullName}`
    };
    setCurrentUser(userObj);
    setIsLoggedOut(false);
    localStorage.setItem('pakride_user', JSON.stringify(userObj));
    if (data.token) {
      localStorage.setItem('pakride_token', data.token);
      setAuthToken(data.token);
    }
    if (data.driverProfile) {
      setDriverProfile(data.driverProfile);
    }
    if (data.user.role === 'DRIVER') setAppMode('DRIVER');
    else if (data.user.role === 'ADMIN') setAppMode('ADMIN');
    else setAppMode('PASSENGER');
    showToast(`Welcome, ${data.user.fullName}! Signed in as ${data.user.role}.`);
  };

  const handleLogout = () => {
    localStorage.removeItem('pakride_token');
    localStorage.removeItem('pakride_user');
    setAuthToken('');
    setIsLoggedOut(true);
    showToast('Logged out successfully.');
  };

  // Switch between 3 Core App Modes on Web
  const handleSwitchApp = async (mode: 'PASSENGER' | 'DRIVER' | 'ADMIN') => {
    setIsLoggedOut(false);
    if (mode === 'PASSENGER') {
      await handleSwitchAccount('user-passenger-1');
    } else if (mode === 'DRIVER') {
      await handleSwitchAccount('user-driver-car-1');
    } else if (mode === 'ADMIN') {
      await handleSwitchAccount('user-admin-1');
    }
    setAppMode(mode);
  };

  // Switch between pre-seeded demo accounts
  const handleSwitchAccount = async (personaId: string) => {
    const persona = DEMO_PERSONAS.find((p) => p.id === personaId);
    if (!persona) return;
    setIsLoggedOut(false);
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: persona.phone, password: 'pakride123' })
      });
      const data = await res.json();
      if (data.token) {
        localStorage.setItem('pakride_token', data.token);
        const userObj: PersonaUser = {
          id: data.user.id,
          fullName: data.user.fullName,
          phone: data.user.phone,
          role: data.user.role,
          label: `${data.user.role}: ${data.user.fullName}`
        };
        localStorage.setItem('pakride_user', JSON.stringify(userObj));
        setCurrentUser(userObj);
        setAuthToken(data.token);
        if (data.driverProfile) setDriverProfile(data.driverProfile);
        else setDriverProfile(null);
        showToast(`Logged in as ${data.user.fullName} (${data.user.role})`);
        return;
      }
    } catch (e) {
      console.warn('Direct login failed, using fallback persona', e);
    }
    // Fallback if offline
    const fallbackToken = `mock-token-${persona.id}`;
    localStorage.setItem('pakride_token', fallbackToken);
    localStorage.setItem('pakride_user', JSON.stringify(persona));
    setCurrentUser(persona);
    setAuthToken(fallbackToken);
    showToast(`Switched to ${persona.fullName} (${persona.role})`);
  };

  // Filter accounts belonging to current mode for easy 1-click test switching
  const modeAccounts = DEMO_PERSONAS.filter((p) => {
    if (appMode === 'PASSENGER') return p.role === 'PASSENGER';
    if (appMode === 'DRIVER') return p.role === 'DRIVER';
    return p.role === 'ADMIN';
  });

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

      {/* Top Header Navigation */}
      <header className="bg-charcoal-900 text-white sticky top-0 z-40 shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-2.5 flex flex-wrap items-center justify-between gap-3">
          {/* Brand Logo */}
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-pakgreen-500 flex items-center justify-center font-extrabold text-white text-base shadow-sm">
              PR
            </div>
            <div>
              <div className="font-extrabold text-base tracking-tight flex items-center space-x-2">
                <span>{t.brand}</span>
                <span className="text-[10px] bg-pakgreen-500/20 text-pakgreen-300 px-2 py-0.5 rounded font-mono font-bold">
                  PILOT v1.0
                </span>
              </div>
              <div className="text-[10px] text-slate-400 hidden sm:block">{t.tagline}</div>
            </div>
          </div>

          {/* 3 App Switching Segmented Tabs (Unified Web Workspace for Demo & Testing) */}
          <div className="flex items-center bg-charcoal-800 p-1 rounded-xl border border-charcoal-700">
            <button
              type="button"
              onClick={() => handleSwitchApp('PASSENGER')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                appMode === 'PASSENGER'
                  ? 'bg-pakgreen-500 text-white shadow-xs'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <Car className="w-3.5 h-3.5" />
              <span>{lang === 'ur' ? 'مسافر ایپ' : 'Passenger App'}</span>
            </button>

            <button
              type="button"
              onClick={() => handleSwitchApp('DRIVER')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                appMode === 'DRIVER'
                  ? 'bg-pakgreen-500 text-white shadow-xs'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <Navigation className="w-3.5 h-3.5" />
              <span>{lang === 'ur' ? 'ڈرائیور ایپ' : 'Driver App'}</span>
            </button>

            <button
              type="button"
              onClick={() => handleSwitchApp('ADMIN')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                appMode === 'ADMIN'
                  ? 'bg-pakgreen-500 text-white shadow-xs'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              <span>{lang === 'ur' ? 'ایڈمن کنٹرول' : 'Admin Console'}</span>
            </button>
          </div>

          {/* User Controls: Persona Dropdown, Profile Pill, and Language Switcher */}
          <div className="flex items-center space-x-2">
            {/* Quick Account Switcher (e.g. Passenger 1 vs Passenger 2, Driver 1 vs Driver 2) */}
            {modeAccounts.length > 1 && (
              <div className="flex items-center space-x-1 bg-charcoal-800 px-2 py-1.5 rounded-xl border border-charcoal-700 hidden md:flex">
                <User className="w-3.5 h-3.5 text-slate-400" />
                <select
                  value={currentUser.id}
                  onChange={(e) => handleSwitchAccount(e.target.value)}
                  className="bg-transparent text-xs text-white outline-none cursor-pointer font-medium"
                >
                  {modeAccounts.map((p) => (
                    <option key={p.id} value={p.id} className="bg-charcoal-900 text-white">
                      {p.label}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Profile Pill (When Logged In) vs Sign In Button (When Logged Out) */}
            {!isLoggedOut ? (
              <div className="flex items-center space-x-2 bg-charcoal-800 px-3 py-1.5 rounded-xl border border-charcoal-700">
                <div className="w-6 h-6 rounded-full bg-pakgreen-600 flex items-center justify-center text-xs font-bold text-white">
                  {currentUser.fullName.charAt(0)}
                </div>
                <div className="text-left text-xs hidden sm:block">
                  <div className="font-bold text-white truncate max-w-[110px]">{currentUser.fullName}</div>
                  <div className="text-[10px] text-pakgreen-400 font-semibold">{currentUser.role}</div>
                </div>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="p-1 hover:bg-charcoal-700 text-red-400 rounded-lg transition ml-1"
                  title="Log out"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowAuthModal(true)}
                className="flex items-center space-x-1.5 bg-pakgreen-500 hover:bg-pakgreen-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition shadow-xs"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>{t.signIn || 'Sign In / Register'}</span>
              </button>
            )}

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

      {/* Main Content Area: Strictly Renders the Selected Application */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6">
        {appMode === 'PASSENGER' && (
          <PassengerView
            key={`passenger-${currentUser.id}`}
            socket={socket}
            currentUser={currentUser}
            authToken={authToken}
            lang={lang}
            t={t}
            apiBaseUrl={API_BASE_URL}
          />
        )}

        {appMode === 'DRIVER' && (
          <DriverView
            key={`driver-${currentUser.id}`}
            socket={socket}
            currentUser={currentUser}
            authToken={authToken}
            driverProfile={
              driverProfile || {
                id: `prof-${currentUser.id}`,
                userId: currentUser.id,
                verificationStatus: currentUser.id.startsWith('user-driver') ? 'APPROVED' : 'PENDING_DOCUMENTS',
                isOnline: currentUser.id.startsWith('user-driver'),
                activeCityId: 'city-karachi',
                activeZoneId: 'zone-karachi-jauhar',
                ratingAverage: 4.9,
                ratingCount: 38,
                vehicle: currentUser.id.startsWith('user-driver') ? {
                  id: `veh-${currentUser.id}`,
                  driverId: currentUser.id,
                  category: currentUser.id.includes('moto') ? 'MOTORCYCLE' : currentUser.id.includes('rick') ? 'RICKSHAW' : 'CAR',
                  make: currentUser.id.includes('moto') ? 'Honda' : currentUser.id.includes('rick') ? 'Sazgar' : 'Toyota',
                  model: currentUser.id.includes('moto') ? 'CD 70' : currentUser.id.includes('rick') ? '4-Stroke' : 'Corolla',
                  year: 2022,
                  plateNumber: 'ISB-4921',
                  color: 'White'
                } : undefined
              }
            }
            lang={lang}
            t={t}
            apiBaseUrl={API_BASE_URL}
          />
        )}

        {appMode === 'ADMIN' && (
          <AdminView
            currentUser={currentUser}
            lang={lang}
            t={t}
            apiBaseUrl={API_BASE_URL}
          />
        )}
      </main>

      {/* Auth Modal (Login / Register / Forgot Password) */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={handleAuthSuccess}
        apiBaseUrl={API_BASE_URL}
        lang={lang}
        t={t}
      />

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-3 text-center text-xs text-slate-500">
        PakRide • Pilot Launch Edition • Karachi (Gulistan-e-Jauhar Pilot Zone) & Islamabad Multi-City Rollout • Cash-First Model
      </footer>
    </div>
  );
};
