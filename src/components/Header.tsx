import React, { useState, useRef, useEffect } from 'react';
import { 
  Flame, 
  Wifi, 
  WifiOff, 
  RefreshCw, 
  TrendingUp, 
  Users, 
  Calendar, 
  FileText, 
  History, 
  CheckCircle2,
  ShieldCheck,
  LogOut,
  ChevronDown,
  User,
  ArrowRightLeft,
  Settings,
  Package,
  Camera
} from 'lucide-react';
import { RealtimeSyncState, AppTab, AppUser, CompanyBranding } from '../types';

interface HeaderProps {
  activeTab: AppTab;
  setActiveTab: (tab: AppTab) => void;
  allowedTabs: AppTab[];
  currentUser: AppUser | null;
  onLogout: () => void;
  onSwitchUser?: (user: AppUser) => void;
  allUsers?: AppUser[];
  syncState: RealtimeSyncState;
  onTriggerSync: () => void;
  onToggleOnline: () => void;
  onOpenSyncLogs: () => void;
  customersCount: number;
  activeVisitsCount: number;
  productsCount?: number;
  branding?: CompanyBranding;
  onOpenCompanyLogoModal?: () => void;
  todaySalesProgress: {
    revenue: number;
    targetRevenue: number;
    percentage: number;
  };
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  allowedTabs,
  currentUser,
  onLogout,
  onSwitchUser,
  allUsers = [],
  syncState,
  onTriggerSync,
  onToggleOnline,
  onOpenSyncLogs,
  customersCount,
  activeVisitsCount,
  productsCount = 0,
  branding,
  onOpenCompanyLogoModal,
  todaySalesProgress
}) => {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Close user dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const roleColors: Record<string, { badge: string; pill: string }> = {
    'Super Admin': { badge: 'bg-purple-100 text-purple-800 border-purple-200', pill: 'bg-purple-600' },
    'Sales Manager': { badge: 'bg-emerald-100 text-emerald-800 border-emerald-200', pill: 'bg-emerald-600' },
    'Sales Representative': { badge: 'bg-blue-100 text-blue-800 border-blue-200', pill: 'bg-blue-600' },
    'Staff Keuangan': { badge: 'bg-amber-100 text-amber-800 border-amber-200', pill: 'bg-amber-600' }
  };

  const userRole = currentUser?.role || 'Sales Representative';
  const roleStyle = roleColors[userRole] || { badge: 'bg-slate-100 text-slate-700 border-slate-200', pill: 'bg-slate-600' };

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
      {/* Top Banner: Brand, Sync Monitor & Sales Rep Profile */}
      <div className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 py-2.5 sm:py-3.5">
        <div className="flex items-center justify-between gap-2 sm:gap-4">
          
          {/* Brand Logo & Title */}
          <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0">
            <div 
              onClick={() => currentUser?.role === 'Super Admin' && onOpenCompanyLogoModal?.()}
              className={`relative flex items-center justify-center shrink-0 transition-opacity ${
                currentUser?.role === 'Super Admin' 
                  ? 'cursor-pointer hover:opacity-80' 
                  : ''
              }`}
              title={
                currentUser?.role === 'Super Admin' 
                  ? "Klik untuk kelola Logo Perusahaan" 
                  : branding?.companyName || "PODA E-Liquid"
              }
            >
              {branding?.logoUrl ? (
                <img 
                  src={branding.logoUrl} 
                  alt={branding.companyName || "PODA Logo"} 
                  className="w-8 h-8 sm:w-10 sm:h-10 object-contain" 
                />
              ) : (
                <Flame className="w-7 h-7 sm:w-8 sm:h-8 text-teal-600" />
              )}
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <h1 className="text-base sm:text-xl font-bold tracking-tight text-slate-900 truncate">
                  {branding?.companyName ? (
                    branding.companyName
                  ) : (
                    <>PODA <span className="text-emerald-600 font-extrabold">E-LIQUID</span></>
                  )}
                </h1>
                <span className="hidden xs:inline-block px-1.5 sm:px-2 py-0.5 text-[9px] sm:text-[10px] uppercase font-bold tracking-wider rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                  COMPANY
                </span>
              </div>
            </div>
          </div>

          {/* Right Toolbar: Sync Hub & User Profile */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            {/* Real-time Data Synchronization Pill */}
            <div className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 rounded-xl bg-slate-50 border border-slate-200/80 shadow-xs">
              <button
                id="btn-toggle-connection"
                onClick={onToggleOnline}
                title={syncState.isOnline ? "Klik untuk mensimulasikan mode offline" : "Klik untuk online kembali"}
                className={`flex items-center gap-1 px-1.5 py-0.5 sm:py-1 rounded-lg text-[11px] font-medium transition-all ${
                  syncState.isOnline 
                    ? 'text-emerald-700 hover:bg-emerald-50' 
                    : 'text-rose-600 hover:bg-rose-50 bg-rose-50'
                }`}
              >
                {syncState.isOnline ? (
                  <>
                    <Wifi className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    <span className="text-[10px] sm:text-[11px] font-semibold hidden xs:inline">Online</span>
                  </>
                ) : (
                  <>
                    <WifiOff className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                    <span className="text-[10px] sm:text-[11px] font-semibold">Offline</span>
                  </>
                )}
              </button>

              <div className="h-3.5 w-px bg-slate-200 hidden sm:block"></div>

              <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-600">
                <span className="text-[11px] text-slate-400">Sync:</span>
                <span className="text-[11px] font-medium text-slate-700">
                  {syncState.isSyncing ? (
                    <span className="text-amber-600 flex items-center gap-1">
                      <RefreshCw className="w-3 h-3 animate-spin" /> Sinkron...
                    </span>
                  ) : (
                    <span>{syncState.lastSyncTime}</span>
                  )}
                </span>
                {syncState.pendingSyncCount > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                    +{syncState.pendingSyncCount}
                  </span>
                )}
              </div>

              <button
                id="btn-sync-now"
                onClick={onTriggerSync}
                disabled={syncState.isSyncing}
                title="Sinkronkan data sekarang ke cloud PODA"
                aria-label="Sinkronkan data"
                className="p-1 sm:p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-200/70 rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${syncState.isSyncing ? 'animate-spin text-emerald-600' : ''}`} />
              </button>

              <button
                id="btn-sync-logs"
                onClick={onOpenSyncLogs}
                title="Lihat riwayat sinkronisasi real-time"
                aria-label="Riwayat log sinkronisasi"
                className="p-1 sm:p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-slate-200/70 rounded-lg transition-colors cursor-pointer"
              >
                <History className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Logged-In User Profile Pill with Interactive Dropdown */}
            <div className="relative" ref={userMenuRef}>
              <button
                id="btn-user-profile-menu"
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center gap-2 pl-1.5 sm:pl-2.5 py-1 pr-1.5 sm:pr-2 rounded-xl hover:bg-slate-100 border border-transparent hover:border-slate-200 transition-all cursor-pointer text-left"
              >
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-800 font-bold text-xs shadow-xs">
                  {currentUser?.avatarInitials || 'BW'}
                </div>
                <div className="hidden sm:block text-left min-w-0 max-w-[130px]">
                  <div className="text-xs font-semibold text-slate-900 flex items-center gap-1 truncate">
                    <span className="truncate">{currentUser?.name || 'Bastian Waralaga'}</span>
                    <CheckCircle2 className="w-3 h-3 text-emerald-600 inline shrink-0" />
                  </div>
                  <div className="text-[10px] text-emerald-700 font-medium truncate">
                    {currentUser?.role || 'Super Admin'}
                  </div>
                </div>
                <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isUserMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* User Menu Dropdown */}
              {isUserMenuOpen && (
                <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-2xl border border-slate-200 p-2 z-50 animate-in fade-in zoom-in-95">
                  {/* User Overview */}
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 mb-2">
                    <div className="flex items-center gap-2.5 mb-1.5">
                      <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white font-bold text-sm flex items-center justify-center shadow-xs">
                        {currentUser?.avatarInitials || 'BW'}
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-slate-900 truncate">
                          {currentUser?.name}
                        </h4>
                        <p className="text-[11px] text-slate-500 font-mono truncate">
                          {currentUser?.email}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[11px] pt-2 border-t border-slate-200/80">
                      <span className="text-slate-500">Jabatan:</span>
                      <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] border ${roleStyle.badge}`}>
                        {currentUser?.role}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] mt-1">
                      <span className="text-slate-500">ID Pegawai:</span>
                      <span className="font-mono text-slate-700 font-medium">
                        {currentUser?.salesRepCode || 'PODA-ADMIN-01'}
                      </span>
                    </div>
                  </div>


                  {/* Menu Action: Role & Akses Shortcut if allowed */}
                  {allowedTabs.includes('roles') && (
                    <button
                      onClick={() => {
                        setActiveTab('roles');
                        setIsUserMenuOpen(false);
                      }}
                      className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-100 flex items-center gap-2 text-xs font-semibold text-slate-700 transition-colors cursor-pointer"
                    >
                      <ShieldCheck className="w-4 h-4 text-purple-600" />
                      <span>Atur Role Akses & User</span>
                    </button>
                  )}

                  {/* Menu Action: Upload Logo Perusahaan (Terproteksi Enkripsi Sesi) */}
                  {currentUser?.role === 'Super Admin' && onOpenCompanyLogoModal && (
                    <button
                      onClick={() => {
                        onOpenCompanyLogoModal();
                        setIsUserMenuOpen(false);
                      }}
                      className="w-full text-left px-3 py-2 rounded-xl hover:bg-emerald-50 text-emerald-950 flex items-center justify-between text-xs font-semibold transition-colors cursor-pointer group"
                    >
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-emerald-600" />
                        <span>Logo & Identitas Perusahaan</span>
                      </div>
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold">
                        Enkripsi Sesi
                      </span>
                    </button>
                  )}

                  {/* Logout Button */}
                  <div className="pt-1.5 mt-1.5 border-t border-slate-100">
                    <button
                      id="btn-logout"
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        onLogout();
                      }}
                      className="w-full text-left px-3 py-2 rounded-xl hover:bg-rose-50 text-rose-600 flex items-center gap-2 text-xs font-bold transition-colors cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Keluar (Logout)</span>
                    </button>
                  </div>

                </div>
              )}
            </div>

          </div>
        </div>

        {/* Desktop Navigation Tabs Bar (Visible on md and larger) */}
        <div className="hidden md:flex items-center justify-between mt-2.5 pt-2.5 border-t border-slate-100">
          <nav className="flex space-x-1 sm:space-x-2">
            
            {/* Dashboard Analitik */}
            {allowedTabs.includes('dashboard') && (
              <button
                id="tab-nav-dashboard"
                onClick={() => setActiveTab('dashboard')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all cursor-pointer ${
                  activeTab === 'dashboard'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-transparent'
                }`}
              >
                <TrendingUp className="w-4 h-4" />
                <span>Dashboard Analitik</span>
              </button>
            )}

            {/* Manage Data Toko */}
            {allowedTabs.includes('customers') && (
              <button
                id="tab-nav-customers"
                onClick={() => setActiveTab('customers')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all cursor-pointer ${
                  activeTab === 'customers'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-transparent'
                }`}
              >
                <Users className="w-4 h-4" />
                <span>Manage Data Toko</span>
                <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                  {customersCount}
                </span>
              </button>
            )}

            {/* Jadwal Kunjungan */}
            {allowedTabs.includes('visits') && (
              <button
                id="tab-nav-visits"
                onClick={() => setActiveTab('visits')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all cursor-pointer ${
                  activeTab === 'visits'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-transparent'
                }`}
              >
                <Calendar className="w-4 h-4" />
                <span>Jadwal Kunjungan</span>
                {activeVisitsCount > 0 && (
                  <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-md bg-amber-50 text-amber-800 border border-amber-200">
                    {activeVisitsCount} hari ini
                  </span>
                )}
              </button>
            )}

            {/* Laporan Target Harian */}
            {allowedTabs.includes('sales') && (
              <button
                id="tab-nav-sales"
                onClick={() => setActiveTab('sales')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all cursor-pointer ${
                  activeTab === 'sales'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-transparent'
                }`}
              >
                <FileText className="w-4 h-4" />
                <span>Laporan Target Harian</span>
                <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-md bg-emerald-100 text-emerald-800 border border-emerald-200">
                  {Math.round(todaySalesProgress.percentage)}%
                </span>
              </button>
            )}

            {/* Manage Data Product */}
            {allowedTabs.includes('products') && (
              <button
                id="tab-nav-products"
                onClick={() => setActiveTab('products')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all cursor-pointer ${
                  activeTab === 'products'
                    ? 'bg-teal-50 text-teal-800 border border-teal-200 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-transparent'
                }`}
              >
                <Package className="w-4 h-4 text-teal-600" />
                <span>Manage Data Product</span>
                <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-md bg-teal-100 text-teal-800 border border-teal-200">
                  {productsCount}
                </span>
              </button>
            )}

            {/* Role & Akses Pengguna */}
            {allowedTabs.includes('roles') && (
              <button
                id="tab-nav-roles"
                onClick={() => setActiveTab('roles')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all cursor-pointer ${
                  activeTab === 'roles'
                    ? 'bg-purple-50 text-purple-700 border border-purple-200 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-transparent'
                }`}
              >
                <ShieldCheck className="w-4 h-4 text-purple-600" />
                <span>Role Akses & Pengguna</span>
              </button>
            )}

          </nav>

          {/* Quick Target Today Pill */}
          <div className="flex items-center gap-3 pl-4">
            <div className="text-right">
              <span className="text-[10px] text-slate-500 block font-normal">Target Hari Ini</span>
              <span className="text-xs font-bold text-slate-900">
                {Math.round(todaySalesProgress.percentage)}% Tercapai
              </span>
            </div>
            <div className="w-20 bg-slate-100 h-2 rounded-full overflow-hidden border border-slate-200">
              <div 
                className="bg-gradient-to-r from-emerald-500 to-teal-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(todaySalesProgress.percentage, 100)}%` }}
              ></div>
            </div>
          </div>
        </div>

      </div>
    </header>
  );
};
