import React, { useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import {
  Car,
  Navigation,
  Shield,
  User,
  Globe,
  Bell,
  LogOut,
  Sun,
  Moon
} from 'lucide-react';
import { PassengerView } from './components/PassengerView';
import { DriverView } from './components/DriverView';
import { AdminView } from './components/AdminView';
import { AuthView } from './components/AuthView';
import { translations, Language } from './i18n/translations';
import { DriverProfile, UserRole, AuthSuccessPayload } from './shared/types';

// Environment-aware API URL (Vercel Cloud or Localhost)
const API_BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:4000';

export interface PersonaUser {
  id: string;
  fullName: string;
  phone: string;
  role: UserRole;
  label?: string;
}

export const App: React.FC = () => {
  const [lang, setLang] = useState<Language>('en');
  const [currentUser, setCurrentUser] = useState<PersonaUser | null>(() => {
    try {
      const stored = localStorage.getItem('pakride_user');
      const token = localStorage.getItem('pakride_token');
      if (stored && token) {
        return JSON.parse(stored);
      }
    } catch {}
    return null;
  });
  const [authToken, setAuthToken] = useState<string>(() => {
    return localStorage.getItem('pakride_token') || '';
  });
  const [driverProfile, setDriverProfile] = useState<DriverProfile | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    const saved = localStorage.getItem('pakride_theme') as 'dark' | 'light';
    return saved || 'dark'; // Orbix Dark Glass by default
  });

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    localStorage.setItem('pakride_theme', nextTheme);
    if (nextTheme === 'dark') {
      document.documentElement.classList.add('dark');
      showToast('Switched to Orbix Dark Glass UI');
    } else {
      document.documentElement.classList.remove('dark');
      showToast('Switched to Frosted Light Glass UI');
    }
  };

  const t = translations[lang];

  const getAuthToken = () => {
    return authToken || localStorage.getItem('pakride_token') || '';
  };

  // Initialize Socket.io connection
  useEffect(() => {
    const s = io(API_BASE_URL, {
      transports: ['websocket', 'polling']
    });

    s.on('connect', () => {
      console.log('[APP] Connected to PakRide real-time engine:', s.id);
      if (currentUser?.id) {
        s.emit('join_user_room', currentUser.id);
      }
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

  // Keep socket joined to the active user's personal room across reconnects
  useEffect(() => {
    if (socket && socket.connected && currentUser?.id) {
      socket.emit('join_user_room', currentUser.id);
    }
  }, [socket, currentUser?.id]);

  // Fetch driver profile if current user is an authenticated driver
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
    localStorage.setItem('pakride_user', JSON.stringify(userObj));
    if (data.token) {
      localStorage.setItem('pakride_token', data.token);
      setAuthToken(data.token);
    }
    if (data.driverProfile) {
      setDriverProfile(data.driverProfile);
    }
    showToast(`Welcome, ${data.user.fullName}! Signed in as ${data.user.role}.`);
  };

  const handleLogout = () => {
    localStorage.removeItem('pakride_token');
    localStorage.removeItem('pakride_user');
    setAuthToken('');
    setCurrentUser(null);
    setDriverProfile(null);
    showToast('Logged out successfully.');
  };

  return (
    <div
      dir={lang === 'ur' ? 'rtl' : 'ltr'}
      className={`min-h-screen relative overflow-x-hidden flex flex-col transition-colors duration-300 ${
        theme === 'dark'
          ? 'dark bg-[#080c14] text-slate-100'
          : 'bg-gradient-to-br from-slate-50 via-emerald-50/20 to-slate-100 text-slate-900'
      } ${lang === 'ur' ? 'font-urdu' : 'font-sans'}`}
    >
      {/* Ambient background blur spheres for genuine glass refraction */}
      {theme === 'dark' ? (
        <>
          <div className="fixed top-[-10%] left-[-5%] w-[550px] h-[550px] bg-emerald-500/12 rounded-full blur-[140px] pointer-events-none -z-10 animate-pulse" />
          <div className="fixed bottom-[-10%] right-[-5%] w-[650px] h-[650px] bg-cyan-500/12 rounded-full blur-[160px] pointer-events-none -z-10" />
          <div className="fixed top-[35%] right-[20%] w-[450px] h-[450px] bg-emerald-400/8 rounded-full blur-[120px] pointer-events-none -z-10" />
        </>
      ) : (
        <>
          <div className="fixed top-[-10%] left-[-5%] w-[450px] h-[450px] bg-emerald-400/12 rounded-full blur-3xl pointer-events-none -z-10" />
          <div className="fixed bottom-[-10%] right-[-5%] w-[550px] h-[550px] bg-teal-400/12 rounded-full blur-3xl pointer-events-none -z-10" />
          <div className="fixed top-[35%] right-[20%] w-[350px] h-[350px] bg-emerald-300/10 rounded-full blur-3xl pointer-events-none -z-10" />
        </>
      )}

      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-50 bg-slate-900/90 text-white backdrop-blur-xl px-4 py-3 rounded-2xl shadow-2xl flex items-center space-x-2.5 border border-pakgreen-400/50 animate-bounce">
          <Bell className="w-4 h-4 text-pakgreen-400 animate-pulse" />
          <span className="text-xs font-bold tracking-tight">{toastMessage}</span>
        </div>
      )}

      {/* Modern Glass Header Navigation */}
      <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-2xl border-b border-white/10 shadow-lg shadow-black/5 text-white transition-all">
        <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-3">
          {/* Brand Logo */}
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-pakgreen-600 to-emerald-400 flex items-center justify-center font-black text-white text-base shadow-md shadow-pakgreen-500/30 border border-white/20">
              PR
            </div>
            <div>
              <div className="font-extrabold text-base tracking-tight flex items-center space-x-2">
                <span>{t.brand}</span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-mono font-bold">
                  PILOT v2.0
                </span>
              </div>
              <div className="text-[10px] text-slate-400 hidden sm:block">{t.tagline}</div>
            </div>
          </div>

          {/* Active Role Indicator (When Authenticated) */}
          {currentUser && (
            <div className="flex items-center space-x-2 bg-white/5 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-white/10 shadow-inner">
              {currentUser.role === 'PASSENGER' && <Car className="w-4 h-4 text-emerald-400" />}
              {currentUser.role === 'DRIVER' && <Navigation className="w-4 h-4 text-cyan-400" />}
              {(currentUser.role === 'ADMIN' || currentUser.role === 'CITY_MANAGER') && <Shield className="w-4 h-4 text-amber-400" />}
              <span className="text-xs font-bold text-slate-200">
                {currentUser.role === 'PASSENGER'
                  ? (lang === 'ur' ? 'مسافر پورٹل' : 'Passenger Portal')
                  : currentUser.role === 'DRIVER'
                  ? (lang === 'ur' ? 'کیپٹن / ڈرائیور پورٹل' : 'Captain Portal')
                  : currentUser.role === 'CITY_MANAGER'
                  ? (lang === 'ur' ? 'سٹی مینیجر پورٹل' : 'City Manager Console')
                  : (lang === 'ur' ? 'ایڈمن کنٹرول' : 'Admin Console')}
              </span>
            </div>
          )}

          {/* User Controls: Theme, Language, Profile / Logout */}
          <div className="flex items-center space-x-2">
            {/* Theme Toggle Button */}
            <button
              type="button"
              onClick={toggleTheme}
              className="flex items-center space-x-1.5 bg-white/10 hover:bg-white/15 text-slate-200 border border-white/10 px-2.5 py-1.5 rounded-xl text-xs font-bold transition"
              title="Toggle Theme"
            >
              {theme === 'dark' ? (
                <>
                  <Sun className="w-3.5 h-3.5 text-amber-400" />
                  <span className="hidden sm:inline">Light</span>
                </>
              ) : (
                <>
                  <Moon className="w-3.5 h-3.5 text-indigo-300" />
                  <span className="hidden sm:inline">Dark</span>
                </>
              )}
            </button>

            {/* Language Switcher */}
            <button
              type="button"
              onClick={toggleLanguage}
              className="flex items-center space-x-1 bg-white/10 hover:bg-white/15 text-emerald-400 border border-white/10 px-3 py-1.5 rounded-xl text-xs font-bold transition"
            >
              <Globe className="w-3.5 h-3.5" />
              <span>{t.langToggle}</span>
            </button>

            {/* Profile Pill & Logout (When Logged In) */}
            {currentUser && (
              <div className="flex items-center space-x-2 bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10">
                <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-pakgreen-600 to-emerald-400 flex items-center justify-center text-xs font-black text-white shadow-xs">
                  {currentUser.fullName.charAt(0)}
                </div>
                <div className="text-left text-xs hidden sm:block">
                  <div className="font-bold text-white truncate max-w-[110px]">{currentUser.fullName}</div>
                  <div className="text-[10px] text-emerald-400 font-semibold">{currentUser.role}</div>
                </div>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="p-1 hover:bg-white/10 text-red-400 rounded-lg transition ml-1"
                  title="Log out"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area: Strictly Renders Auth or Role-Isolated Application */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6">
        {!currentUser || !authToken ? (
          <AuthView
            onSuccess={handleAuthSuccess}
            apiBaseUrl={API_BASE_URL}
            lang={lang}
            t={t}
          />
        ) : (
          <>
            {currentUser.role === 'PASSENGER' && (
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

            {currentUser.role === 'DRIVER' && (
              driverProfile ? (
                <DriverView
                  key={`driver-${currentUser.id}`}
                  socket={socket}
                  currentUser={currentUser}
                  authToken={authToken}
                  driverProfile={driverProfile}
                  lang={lang}
                  t={t}
                  apiBaseUrl={API_BASE_URL}
                />
              ) : (
                <div className="flex flex-col items-center justify-center p-12 glass-panel rounded-3xl text-center max-w-md mx-auto my-12">
                  <div className="w-8 h-8 border-2 border-pakgreen-500 border-t-transparent rounded-full animate-spin mb-4" />
                  <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                    {lang === 'ur' ? 'ڈرائیور پروفائل لوڈ ہو رہا ہے...' : 'Loading Driver Profile...'}
                  </p>
                </div>
              )
            )}

            {(currentUser.role === 'ADMIN' || currentUser.role === 'CITY_MANAGER') && (
              <AdminView
                currentUser={currentUser}
                lang={lang}
                t={t}
                apiBaseUrl={API_BASE_URL}
              />
            )}
          </>
        )}
      </main>

      {/* Modern Glass Footer */}
      <footer className="bg-white/60 dark:bg-slate-950/70 backdrop-blur-xl border-t border-white/60 dark:border-white/10 py-4 text-center text-xs text-slate-600 dark:text-slate-400 shadow-xs transition-colors">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="font-semibold text-slate-700 dark:text-slate-300">
            PakRide • Modern Orbix Glass Pilot • Karachi, Islamabad, Lahore, Multan & D.G. Khan
          </div>
          <div className="text-[11px] text-emerald-700 dark:text-emerald-400 font-bold bg-emerald-50/80 dark:bg-emerald-950/50 border border-emerald-200/80 dark:border-emerald-500/30 px-2.5 py-1 rounded-full">
            100% Cash-First Model • Zero Platform Commission
          </div>
        </div>
      </footer>
    </div>
  );
};
