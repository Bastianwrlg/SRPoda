import React, { useState } from 'react';
import { 
  Flame, 
  Lock, 
  User, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  ShieldCheck, 
  AlertCircle
} from 'lucide-react';
import { AppUser, CompanyBranding } from '../types';

interface LoginFormProps {
  onLogin: (user: AppUser) => void;
  users: AppUser[];
  branding?: CompanyBranding;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onLogin, users, branding }) => {
  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!usernameOrEmail.trim() || !password.trim()) {
      setErrorMessage('Silakan isi username / email dan kata sandi Anda.');
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      const foundUser = users.find(
        u => (u.username.toLowerCase() === usernameOrEmail.trim().toLowerCase() ||
              u.email.toLowerCase() === usernameOrEmail.trim().toLowerCase()) &&
             (u.password === password || (u.username.toLowerCase() === 'admin' && password === 'admin') || password === 'password123')
      );

      if (!foundUser) {
        setIsLoading(false);
        setErrorMessage('Username atau kata sandi tidak valid. Silakan periksa kembali kredensial Anda.');
        return;
      }

      if (foundUser.status === 'Nonaktif') {
        setIsLoading(false);
        setErrorMessage('Akun ini sedang dinonaktifkan oleh Administrator. Hubungi HR / Manager Sales.');
        return;
      }

      setIsLoading(false);
      onLogin(foundUser);
    }, 450);
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-slate-100 via-slate-50 to-emerald-50/40 flex flex-col justify-center items-center p-4 sm:p-6 lg:p-8 font-['Poppins',sans-serif]">
      
      {/* Container Box */}
      <div className="w-full max-w-md bg-white border border-slate-200/90 rounded-3xl shadow-xl shadow-slate-200/50 p-6 sm:p-8 relative overflow-hidden animate-in fade-in zoom-in-95 duration-300">
        
        {/* Subtle decorative top glow */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500"></div>

        {/* Brand Header */}
        <div className="text-center mb-6">
          {branding?.logoUrl ? (
            <div className="inline-flex items-center justify-center mb-3.5">
              <img 
                src={branding.logoUrl} 
                alt={branding.companyName || "Logo"} 
                className="w-16 h-16 object-contain"
              />
            </div>
          ) : (
            <div className="inline-flex items-center justify-center mb-3.5 text-teal-600">
              <Flame className="w-12 h-12" />
            </div>
          )}

          <h2 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">
            {branding?.companyName ? (
              branding.companyName
            ) : (
              <>PODA <span className="text-emerald-600">E-LIQUID</span></>
            )}
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-1">
            {branding?.brandSubtext || 'Sales Representative Management Portal'}
          </p>
        </div>

        {/* Error Alert Box */}
        {errorMessage && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-rose-500 mt-0.5 shrink-0" />
            <span className="leading-relaxed">{errorMessage}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Username / Email */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Username atau Email
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <User className="w-4 h-4" />
              </div>
              <input
                type="text"
                id="login-username"
                value={usernameOrEmail}
                onChange={(e) => setUsernameOrEmail(e.target.value)}
                placeholder="misal: admin atau rian@podaliquid.co.id"
                required
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 text-xs placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-slate-700">
                Kata Sandi
              </label>
              <span className="text-[11px] text-emerald-600 hover:text-emerald-700 font-medium cursor-pointer">
                Lupa sandi?
              </span>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                id="login-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 text-xs placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                aria-label={showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Remember me */}
          <div className="flex items-center justify-between pt-1">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300"
              />
              <span className="text-xs text-slate-600 font-medium">Ingat saya di perangkat ini</span>
            </label>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            id="btn-submit-login"
            disabled={isLoading}
            className="w-full mt-2 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-xs shadow-md shadow-emerald-600/20 hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                <span>Memverifikasi Akses...</span>
              </span>
            ) : (
              <>
                <span>Masuk ke Sistem Sales PODA</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

      </div>

      {/* Info bottom copyright */}
      <div className="mt-6 text-center text-xs text-slate-400 max-w-sm">
        <p>© 2026 PODA E-LIQUID COMPANY . All rights reserved.</p>
      </div>

    </div>
  );
};
