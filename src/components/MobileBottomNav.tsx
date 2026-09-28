import React from 'react';
import { 
  TrendingUp, 
  Users, 
  Calendar, 
  FileText,
  ShieldCheck,
  Package
} from 'lucide-react';
import { AppTab } from '../types';

interface MobileBottomNavProps {
  activeTab: AppTab;
  setActiveTab: (tab: AppTab) => void;
  allowedTabs: AppTab[];
  customersCount: number;
  activeVisitsCount: number;
  productsCount?: number;
  targetPercentage: number;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  setActiveTab,
  allowedTabs,
  customersCount,
  activeVisitsCount,
  productsCount = 0,
  targetPercentage
}) => {
  const navItems: { tab: AppTab; label: string; icon: React.ReactNode; badge?: React.ReactNode }[] = [];

  if (allowedTabs.includes('dashboard')) {
    navItems.push({
      tab: 'dashboard',
      label: 'Analitik',
      icon: <TrendingUp className="w-5 h-5 mb-0.5" />
    });
  }

  if (allowedTabs.includes('customers')) {
    navItems.push({
      tab: 'customers',
      label: 'Manage Toko',
      icon: <Users className="w-5 h-5 mb-0.5" />,
      badge: (
        <span className="absolute -top-1 -right-2 px-1 py-0.2 text-[9px] font-bold rounded-full bg-slate-200 text-slate-700">
          {customersCount}
        </span>
      )
    });
  }

  if (allowedTabs.includes('visits')) {
    navItems.push({
      tab: 'visits',
      label: 'Kunjungan',
      icon: <Calendar className="w-5 h-5 mb-0.5" />,
      badge: activeVisitsCount > 0 ? (
        <span className="absolute -top-1 -right-2 px-1 py-0.2 text-[9px] font-bold rounded-full bg-amber-500 text-white animate-pulse">
          {activeVisitsCount}
        </span>
      ) : undefined
    });
  }

  if (allowedTabs.includes('sales')) {
    navItems.push({
      tab: 'sales',
      label: 'Penjualan',
      icon: <FileText className="w-5 h-5 mb-0.5" />,
      badge: (
        <span className="absolute -top-1 -right-2 px-1 py-0.2 text-[8px] font-bold rounded-full bg-emerald-600 text-white">
          {Math.round(targetPercentage)}%
        </span>
      )
    });
  }

  if (allowedTabs.includes('products')) {
    navItems.push({
      tab: 'products',
      label: 'Manage Produk',
      icon: <Package className="w-5 h-5 mb-0.5 text-teal-600" />,
      badge: productsCount > 0 ? (
        <span className="absolute -top-1 -right-2 px-1 py-0.2 text-[8px] font-bold rounded-full bg-teal-600 text-white">
          {productsCount}
        </span>
      ) : undefined
    });
  }

  if (allowedTabs.includes('roles')) {
    navItems.push({
      tab: 'roles',
      label: 'Role Akses',
      icon: <ShieldCheck className="w-5 h-5 mb-0.5 text-purple-600" />
    });
  }

  const colsClass = 
    navItems.length >= 6 ? 'grid-cols-6' :
    navItems.length === 5 ? 'grid-cols-5' : 
    navItems.length === 4 ? 'grid-cols-4' : 
    navItems.length === 3 ? 'grid-cols-3' : 
    navItems.length === 2 ? 'grid-cols-2' : 'grid-cols-1';

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-lg px-2 py-1.5 safe-area-pb">
      <nav className={`grid ${colsClass} gap-1 items-center max-w-lg mx-auto`}>
        {navItems.map((item) => (
          <button
            key={item.tab}
            id={`mobile-nav-${item.tab}`}
            onClick={() => setActiveTab(item.tab)}
            className={`flex flex-col items-center justify-center py-1.5 px-0.5 rounded-xl transition-all relative ${
              activeTab === item.tab
                ? item.tab === 'roles' ? 'text-purple-700 bg-purple-50 font-bold' : item.tab === 'products' ? 'text-teal-700 bg-teal-50 font-bold' : 'text-emerald-700 bg-emerald-50 font-bold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <div className="relative">
              {item.icon}
              {item.badge}
            </div>
            <span className="text-[9px] leading-tight truncate max-w-[55px]">{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
};
