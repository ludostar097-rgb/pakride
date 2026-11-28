import React, { useState } from 'react';
import { Lock, Phone, User as UserIcon, Shield, Car, ArrowRight, CheckCircle2, AlertCircle, KeyRound, Sparkles } from 'lucide-react';
import { AuthSuccessPayload, UserRole } from '../shared/types';
import { Language } from '../i18n/translations';

interface AuthViewProps {
  onSuccess: (userData: AuthSuccessPayload) => void;
  apiBaseUrl: string;
  lang: Language;
  t: any;
}

export const AuthView: React.FC<AuthViewProps> = ({
  onSuccess,
  apiBaseUrl,
  lang,
  t
}) => {
  const [tab, setTab] = useState<'login' | 'signup' | 'forgot'>('login');

  // Sign in / Sign up states
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<'PASSENGER' | 'DRIVER'>('PASSENGER');

  // Forgot password states
  const [resetOtp, setResetOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const isUrdu = lang === 'ur';

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || !password) {
      setError(isUrdu ? 'براہ کرم فون نمبر اور پاس ورڈ درج کریں' : 'Please enter your phone number and password');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${apiBaseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phone.trim(), password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to sign in');
      if (data.token) localStorage.setItem('pakride_token', data.token);
      if (data.user) localStorage.setItem('pakride_user', JSON.stringify(data.user));
      onSuccess(data);
    } catch (err: any) {
      setError(err.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !phone || !password) {
      setError(isUrdu ? 'براہ کرم تمام خانے پر کریں' : 'Please fill all required fields');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const payload = {
        fullName: fullName.trim(),
        phone: phone.trim(),
        password,
        role
      };

      const res = await fetch(`${apiBaseUrl}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create account');
      if (data.token) localStorage.setItem('pakride_token', data.token);
      if (data.user) localStorage.setItem('pakride_user', JSON.stringify(data.user));
      onSuccess(data);
    } catch (err: any) {
      setError(err.message || 'Could not register user');
    } finally {
      setLoading(false);
    }
  };

  const handleSendForgotOtp = async () => {
    if (!phone) {
      setError(isUrdu ? 'براہ کرم فون نمبر درج کریں' : 'Please enter your phone number first');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${apiBaseUrl}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phone.trim() })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to request reset OTP');
      setSuccessMsg(data.message || (isUrdu ? 'او ٹی پی بھیج دیا گیا ہے' : 'Reset code sent to your phone.'));
    } catch (err: any) {
      setError(err.message || 'Error sending reset code');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || !resetOtp || !newPassword) {
      setError(isUrdu ? 'براہ کرم تمام معلومات درج کریں' : 'Please fill all reset fields');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${apiBaseUrl}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phone.trim(), otp: resetOtp.trim(), newPassword })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to reset password');
      setSuccessMsg(isUrdu ? 'پاس ورڈ کامیابی سے تبدیل ہو گیا ہے۔ براہ کرم لاگ ان کریں۔' : 'Password reset successfully! Please sign in with your new password.');
      setTab('login');
    } catch (err: any) {
      setError(err.message || 'Could not reset password');
    } finally {
      setLoading(false);
    }
  };

  // Local development quick-fill (stripped in production)
  const handleDevQuickLogin = async (devPhone: string, devPass: string = 'pakride123') => {
    setPhone(devPhone);
    setPassword(devPass);
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${apiBaseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: devPhone, password: devPass })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Dev login failed');
      if (data.token) localStorage.setItem('pakride_token', data.token);
      if (data.user) localStorage.setItem('pakride_user', JSON.stringify(data.user));
      onSuccess(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-140px)] py-8 px-4">
      {/* Brand Header */}
      <div className="text-center mb-6 max-w-md">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-pakgreen-600 to-emerald-400 text-white font-black text-2xl shadow-xl shadow-pakgreen-500/20 border border-white/20 mb-3">
          PR
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
          {isUrdu ? 'پاک رائڈ میں خوش آمدید' : 'Welcome to PakRide'}
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1 font-medium">
          {isUrdu
            ? 'پاکستان کا شفاف کرایہ اور زیرو کمیشن رائیڈ ہیلنگ پلیٹ فارم'
            : 'Transparent Direct Bidding • Zero Platform Commission'}
        </p>
      </div>

      {/* Main Airbnb Luxury Card */}
      <div className="airbnb-card max-w-md w-full p-6 sm:p-8 shadow-2xl relative overflow-hidden transition-all">
        {/* Tab Navigation (Airbnb Segmented Style) */}
        <div className="flex bg-neutral-100 dark:bg-neutral-900 p-1 rounded-full border border-neutral-200 dark:border-neutral-800 mb-6">
          <button
            type="button"
            onClick={() => { setTab('login'); setError(null); setSuccessMsg(null); }}
            className={`flex-1 py-2 text-xs font-bold rounded-full transition-all ${
              tab === 'login'
                ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {isUrdu ? 'لاگ ان' : 'Sign In'}
          </button>
          <button
            type="button"
            onClick={() => { setTab('signup'); setError(null); setSuccessMsg(null); }}
            className={`flex-1 py-2 text-xs font-bold rounded-full transition-all ${
              tab === 'signup'
                ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {isUrdu ? 'رجسٹریشن' : 'Sign Up'}
          </button>
          <button
            type="button"
            onClick={() => { setTab('forgot'); setError(null); setSuccessMsg(null); }}
            className={`flex-1 py-2 text-xs font-bold rounded-full transition-all ${
              tab === 'forgot'
                ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {isUrdu ? 'پاس ورڈ ری سیٹ' : 'Forgot?'}
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 rounded-xl text-xs font-semibold flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Success Alert */}
        {successMsg && (
          <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400 rounded-xl text-xs font-semibold flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* TAB 1: SIGN IN */}
        {tab === 'login' && (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                {isUrdu ? 'فون نمبر' : 'Phone Number'}
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3.5 pointer-events-none" />
                <input
                  type="tel"
                  required
                  placeholder="03XX XXXXXXX"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-white/70 dark:bg-slate-900/60 border border-slate-200 dark:border-white/10 rounded-xl text-sm font-semibold text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-pakgreen-500 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                {isUrdu ? 'پاس ورڈ' : 'Password'}
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3.5 pointer-events-none" />
                <input
                  type="password"
                  required
                  placeholder={isUrdu ? 'پاس ورڈ درج کریں' : 'Enter your password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-white/70 dark:bg-slate-900/60 border border-slate-200 dark:border-white/10 rounded-xl text-sm font-semibold text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-pakgreen-500 transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-pakgreen-600 hover:bg-pakgreen-700 text-white rounded-xl font-bold text-sm shadow-lg shadow-pakgreen-600/30 transition-all flex items-center justify-center space-x-2 active:scale-98 disabled:opacity-50"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>{isUrdu ? 'لاگ ان کریں' : 'Sign In'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        {/* TAB 2: SIGN UP */}
        {tab === 'signup' && (
          <form onSubmit={handleSignup} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                {isUrdu ? 'مکمل نام' : 'Full Name'}
              </label>
              <div className="relative">
                <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-3.5 pointer-events-none" />
                <input
                  type="text"
                  required
                  placeholder={isUrdu ? 'علی خان' : 'Ali Khan'}
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-white/70 dark:bg-slate-900/60 border border-slate-200 dark:border-white/10 rounded-xl text-sm font-semibold text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-pakgreen-500 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                {isUrdu ? 'فون نمبر' : 'Phone Number'}
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3.5 pointer-events-none" />
                <input
                  type="tel"
                  required
                  placeholder="03XX XXXXXXX"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-white/70 dark:bg-slate-900/60 border border-slate-200 dark:border-white/10 rounded-xl text-sm font-semibold text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-pakgreen-500 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                {isUrdu ? 'اکاؤنٹ کی قسم' : 'Select Account Role'}
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setRole('PASSENGER')}
                  className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center justify-center space-y-1 transition ${
                    role === 'PASSENGER'
                      ? 'border-pakgreen-500 bg-emerald-50 dark:bg-emerald-950/40 text-pakgreen-700 dark:text-emerald-300'
                      : 'border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                  }`}
                >
                  <UserIcon className="w-4 h-4" />
                  <span>{isUrdu ? 'مسافر' : 'Passenger'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setRole('DRIVER')}
                  className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center justify-center space-y-1 transition ${
                    role === 'DRIVER'
                      ? 'border-pakgreen-500 bg-emerald-50 dark:bg-emerald-950/40 text-pakgreen-700 dark:text-emerald-300'
                      : 'border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                  }`}
                >
                  <Car className="w-4 h-4" />
                  <span>{isUrdu ? 'ڈرائیور / کیپٹن' : 'Captain / Driver'}</span>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                {isUrdu ? 'پاس ورڈ' : 'Password'}
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3.5 pointer-events-none" />
                <input
                  type="password"
                  required
                  placeholder={isUrdu ? 'پاس ورڈ درج کریں' : 'Enter a password (min 6 chars)'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-white/70 dark:bg-slate-900/60 border border-slate-200 dark:border-white/10 rounded-xl text-sm font-semibold text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-pakgreen-500 transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-pakgreen-600 hover:bg-pakgreen-700 text-white rounded-xl font-bold text-sm shadow-lg shadow-pakgreen-600/30 transition-all flex items-center justify-center space-x-2 active:scale-98 disabled:opacity-50"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>{isUrdu ? 'اکاؤنٹ بنائیں' : 'Create Account'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        {/* TAB 3: FORGOT PASSWORD */}
        {tab === 'forgot' && (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                {isUrdu ? 'فون نمبر' : 'Registered Phone Number'}
              </label>
              <div className="flex space-x-2">
                <div className="relative flex-1">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3.5 pointer-events-none" />
                  <input
                    type="tel"
                    required
                    placeholder="03XX XXXXXXX"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 bg-white/70 dark:bg-slate-900/60 border border-slate-200 dark:border-white/10 rounded-xl text-sm font-semibold text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-pakgreen-500 transition"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleSendForgotOtp}
                  disabled={loading || !phone}
                  className="px-3.5 py-2.5 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold rounded-xl transition disabled:opacity-50 shrink-0"
                >
                  {isUrdu ? 'کوڈ بھیجیں' : 'Send Code'}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                {isUrdu ? 'او ٹی پی کوڈ' : '6-Digit OTP Code'}
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-3.5 pointer-events-none" />
                <input
                  type="text"
                  required
                  placeholder={isUrdu ? '6 ہندسوں کا کوڈ' : '6-digit OTP code'}
                  value={resetOtp}
                  onChange={(e) => setResetOtp(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-white/70 dark:bg-slate-900/60 border border-slate-200 dark:border-white/10 rounded-xl text-sm font-semibold text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-pakgreen-500 transition font-mono tracking-wider"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                {isUrdu ? 'نیا پاس ورڈ' : 'New Password'}
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3.5 pointer-events-none" />
                <input
                  type="password"
                  required
                  placeholder={isUrdu ? 'نیا پاس ورڈ' : 'Enter new password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-white/70 dark:bg-slate-900/60 border border-slate-200 dark:border-white/10 rounded-xl text-sm font-semibold text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-pakgreen-500 transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-pakgreen-600 hover:bg-pakgreen-700 text-white rounded-xl font-bold text-sm shadow-lg shadow-pakgreen-600/30 transition-all flex items-center justify-center space-x-2 active:scale-98 disabled:opacity-50"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>{isUrdu ? 'پاس ورڈ تبدیل کریں' : 'Reset Password & Sign In'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        {/* DEV ONLY FAST-LOGIN SHORTCUTS (Excluded in Production Builds) */}
        {(import.meta as any).env?.DEV && (
          <div className="mt-6 pt-5 border-t border-dashed border-slate-200 dark:border-white/10">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-mono uppercase font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded">
                ⚡ Local Dev Helper
              </span>
              <span className="text-[10px] text-slate-400">Dev Only</span>
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              <button
                type="button"
                onClick={() => handleDevQuickLogin('03001234567')}
                className="p-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-[10px] font-semibold text-slate-700 dark:text-slate-300 text-center truncate"
                title="Ali Khan (Passenger)"
              >
                Ali Khan (Pass)
              </button>
              <button
                type="button"
                onClick={() => handleDevQuickLogin('03007654321')}
                className="p-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-[10px] font-semibold text-slate-700 dark:text-slate-300 text-center truncate"
                title="Tariq Mehmood (Driver)"
              >
                Tariq (Driver)
              </button>
              <button
                type="button"
                onClick={() => handleDevQuickLogin('03009999999')}
                className="p-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-[10px] font-semibold text-slate-700 dark:text-slate-300 text-center truncate"
                title="Ahmad Hassan (Admin)"
              >
                Ahmad (Admin)
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
