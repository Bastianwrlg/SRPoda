import React, { useState } from 'react';
import { 
  TrendingUp, 
  Target, 
  Award, 
  ShoppingBag, 
  CalendarCheck, 
  Users, 
  ArrowUpRight, 
  Layers, 
  ChevronRight, 
  Flame, 
  CheckCircle2, 
  Clock, 
  BarChart3,
  Sparkles
} from 'lucide-react';
import { 
  Customer, 
  DailySalesReport, 
  ProductLiquid, 
  VisitSchedule 
} from '../types';
import { 
  formatRupiah, 
  formatNumber, 
  getTierBadgeClass 
} from '../utils/formatters';
import { 
  MONTHLY_TREND_DATA, 
  MONTHLY_TARGET_CONFIG 
} from '../data/initialData';

interface DashboardAnalyticsProps {
  customers: Customer[];
  salesReports: DailySalesReport[];
  products: ProductLiquid[];
  visits: VisitSchedule[];
  onNavigateToTab: (tab: 'customers' | 'visits' | 'sales') => void;
  onOpenNewSale: () => void;
  onOpenNewVisit: () => void;
}

export const DashboardAnalytics: React.FC<DashboardAnalyticsProps> = ({
  customers,
  salesReports,
  products,
  visits,
  onNavigateToTab,
  onOpenNewSale,
  onOpenNewVisit
}) => {
  const [selectedMonth, setSelectedMonth] = useState('September 2026');
  const [hoveredTrendIndex, setHoveredTrendIndex] = useState<number | null>(null);

  // Compute actual aggregated metrics from monthly trend data + current state
  const totalMonthlyRevenue = MONTHLY_TREND_DATA.reduce((sum, item) => sum + item.revenue, 0);
  const totalMonthlyBottles = MONTHLY_TREND_DATA.reduce((sum, item) => sum + item.bottles, 0);
  const totalMonthlyVisits = MONTHLY_TREND_DATA.reduce((sum, item) => sum + item.visits, 0);

  const revenueAchievementPct = Math.min(
    100, 
    Math.round((totalMonthlyRevenue / MONTHLY_TARGET_CONFIG.targetRevenue) * 1000) / 10
  );
  const bottlesAchievementPct = Math.min(
    100, 
    Math.round((totalMonthlyBottles / MONTHLY_TARGET_CONFIG.targetBottles) * 1000) / 10
  );
  const visitsAchievementPct = Math.min(
    100, 
    Math.round((totalMonthlyVisits / MONTHLY_TARGET_CONFIG.targetVisits) * 1000) / 10
  );

  // Category breakdown calculation
  const categoryStats = {
    Saltnic: { count: 0, revenue: 0 },
    Freebase: { count: 0, revenue: 0 },
    'Pods Friendly': { count: 0, revenue: 0 }
  };

  salesReports.forEach(report => {
    report.items.forEach(item => {
      if (categoryStats[item.category]) {
        categoryStats[item.category].count += item.quantity;
        categoryStats[item.category].revenue += item.subtotal;
      }
    });
  });

  // Top Customers by revenue
  const topCustomers = [...customers]
    .sort((a, b) => b.totalRevenue - a.totalRevenue)
    .slice(0, 5);

  // Best selling products
  const productSalesMap: { [prodId: string]: { name: string; category: string; bottles: number; revenue: number } } = {};
  products.forEach(p => {
    productSalesMap[p.id] = { name: p.name, category: p.category, bottles: 0, revenue: 0 };
  });

  salesReports.forEach(report => {
    report.items.forEach(item => {
      if (productSalesMap[item.productId]) {
        productSalesMap[item.productId].bottles += item.quantity;
        productSalesMap[item.productId].revenue += item.subtotal;
      }
    });
  });

  // Visit conversion stats
  const completedVisits = visits.filter(v => v.status === 'Selesai').length;
  const visitsWithSales = visits.filter(v => v.salesResult && v.salesResult > 0).length;
  const visitStrikeRate = completedVisits > 0 ? Math.round((visitsWithSales / completedVisits) * 100) : 0;

  // Max value for SVG trend chart
  const maxRevenue = Math.max(...MONTHLY_TREND_DATA.map(d => Math.max(d.revenue, d.target)));
  const chartHeight = 180;
  const chartWidth = 700;

  return (
    <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-300">
      
      {/* Top Welcome & Month Selector Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              Periode Aktif
            </span>
            <span className="text-[11px] text-slate-500">1 - 16 Sep 2026 (Hari ke-14 Kerja)</span>
          </div>
          <h2 className="text-lg sm:text-2xl font-bold text-slate-900 mt-1">
            Dashboard Kinerja Sales Rep
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Monitoring realisasi omzet, volume distribusi liquid, dan aktivitas kunjungan toko mitra.
          </p>
        </div>

        <div className="flex items-center gap-2 pt-1 sm:pt-0">
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="flex-1 sm:flex-initial bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-xl px-3 py-2 sm:py-2.5 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="September 2026">Sep 2026 (Aktif)</option>
            <option value="Agustus 2026">Agu 2026</option>
            <option value="Juli 2026">Jul 2026</option>
          </select>

          <button
            onClick={onOpenNewSale}
            className="flex items-center gap-1.5 px-3.5 py-2 sm:py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition-all shrink-0 cursor-pointer"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span className="hidden xs:inline">+ Lapor</span> Penjualan
          </button>
        </div>
      </div>

      {/* KPI Highlight Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        
        {/* Card 1: Omzet Bulanan */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 hover:border-emerald-300 transition-all shadow-xs relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Total Omzet Bulan Ini</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5">
            <div className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              {formatRupiah(totalMonthlyRevenue)}
            </div>
            <div className="flex flex-wrap items-center gap-1.5 mt-1">
              <span className="text-xs font-semibold text-emerald-600 flex items-center">
                <ArrowUpRight className="w-3.5 h-3.5" /> {revenueAchievementPct}%
              </span>
              <span className="text-[11px] text-slate-400">
                dari target {formatRupiah(MONTHLY_TARGET_CONFIG.targetRevenue)}
              </span>
            </div>
          </div>
          {/* Progress Bar */}
          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mt-3 border border-slate-200/60">
            <div 
              className="bg-gradient-to-r from-emerald-500 to-teal-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${revenueAchievementPct}%` }}
            ></div>
          </div>
        </div>

        {/* Card 2: Total Botol Liquid */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 hover:border-cyan-300 transition-all shadow-xs relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Botol Liquid Terjual</span>
            <div className="p-2 rounded-xl bg-cyan-50 text-cyan-600 border border-cyan-100">
              <Flame className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5">
            <div className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              {formatNumber(totalMonthlyBottles)} <span className="text-sm font-normal text-slate-500">Botol</span>
            </div>
            <div className="flex flex-wrap items-center gap-1.5 mt-1">
              <span className="text-xs font-semibold text-cyan-600 flex items-center">
                <ArrowUpRight className="w-3.5 h-3.5" /> {bottlesAchievementPct}%
              </span>
              <span className="text-[11px] text-slate-400">
                target {formatNumber(MONTHLY_TARGET_CONFIG.targetBottles)} btl
              </span>
            </div>
          </div>
          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mt-3 border border-slate-200/60">
            <div 
              className="bg-gradient-to-r from-cyan-500 to-blue-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${bottlesAchievementPct}%` }}
            ></div>
          </div>
        </div>

        {/* Card 3: Kunjungan Toko */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 hover:border-purple-300 transition-all shadow-xs relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Realisasi Kunjungan</span>
            <div className="p-2 rounded-xl bg-purple-50 text-purple-600 border border-purple-100">
              <CalendarCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5">
            <div className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              {totalMonthlyVisits} <span className="text-sm font-normal text-slate-500">/ {MONTHLY_TARGET_CONFIG.targetVisits} Toko</span>
            </div>
            <div className="flex flex-wrap items-center gap-1.5 mt-1">
              <span className="text-xs font-semibold text-purple-600 flex items-center">
                <CheckCircle2 className="w-3.5 h-3.5" /> {visitsAchievementPct}%
              </span>
              <span className="text-[11px] text-slate-400">
                Strike rate: {visitStrikeRate}%
              </span>
            </div>
          </div>
          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mt-3 border border-slate-200/60">
            <div 
              className="bg-gradient-to-r from-purple-500 to-indigo-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${visitsAchievementPct}%` }}
            ></div>
          </div>
        </div>

        {/* Card 4: Toko Aktif & Retensi */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 hover:border-amber-300 transition-all shadow-xs relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Pelanggan Aktif</span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600 border border-amber-100">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5">
            <div className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              {customers.length} <span className="text-sm font-normal text-slate-500">Mitra Toko</span>
            </div>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="text-xs font-semibold text-emerald-600">
                100% Retensi
              </span>
              <span className="text-[11px] text-slate-400">
                area Jabodetabek
              </span>
            </div>
          </div>
          <div className="mt-3 text-[11px] text-slate-500 flex items-center justify-between pt-1 border-t border-slate-100">
            <span>Rata-rata Order:</span>
            <span className="text-slate-800 font-bold">
              {formatRupiah(Math.round(totalMonthlyRevenue / (totalMonthlyVisits || 1)))}
            </span>
          </div>
        </div>

      </div>

      {/* Main Analytics: Interactive Daily Performance Trend */}
      <div className="p-4 sm:p-6 rounded-2xl bg-white border border-slate-200 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
          <div>
            <h3 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-emerald-600" />
              Tren Penjualan Harian & Komparasi Target (Sep 2026)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Garis hijau menunjukkan omzet harian aktual, garis putus-putus biru menunjukkan target sales harian.
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs shrink-0 pt-1 sm:pt-0">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-emerald-500"></span>
              <span className="text-slate-600 font-medium">Realisasi</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-cyan-500"></span>
              <span className="text-slate-600 font-medium">Target</span>
            </div>
          </div>
        </div>

        {/* Mobile Swipe Hint */}
        <div className="sm:hidden text-[10px] text-slate-400 mb-2 flex items-center gap-1">
          <span>⇄ Geser grafik horizontal untuk melihat detail harian</span>
        </div>

        {/* SVG Interactive Chart */}
        <div className="relative w-full overflow-x-auto no-scrollbar pb-1">
          <div className="min-w-[620px]">
            <svg 
              viewBox={`0 0 ${chartWidth} ${chartHeight + 40}`} 
              className="w-full h-52 sm:h-56 overflow-visible"
            >
              <defs>
                <linearGradient id="revenueFillLight" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Grid Horizontal Lines */}
              {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => {
                const y = chartHeight - pct * (chartHeight - 30) + 10;
                const value = Math.round(maxRevenue * pct);
                return (
                  <g key={i}>
                    <line 
                      x1="45" 
                      y1={y} 
                      x2={chartWidth - 10} 
                      y2={y} 
                      stroke="#e2e8f0" 
                      strokeDasharray="4 4" 
                      strokeWidth="1" 
                    />
                    <text 
                      x="40" 
                      y={y + 4} 
                      textAnchor="end" 
                      className="text-[9px] fill-slate-400 font-mono"
                    >
                      {value >= 1000000 ? `${(value / 1000000).toFixed(0)}jt` : '0'}
                    </text>
                  </g>
                );
              })}

              {/* Area path for revenue */}
              {(() => {
                const step = (chartWidth - 65) / (MONTHLY_TREND_DATA.length - 1);
                const points = MONTHLY_TREND_DATA.map((d, i) => {
                  const x = 55 + i * step;
                  const y = chartHeight - (d.revenue / maxRevenue) * (chartHeight - 30) + 10;
                  return `${x},${y}`;
                });
                const firstX = 55;
                const lastX = 55 + (MONTHLY_TREND_DATA.length - 1) * step;
                const areaD = `M ${points[0]} ` + points.slice(1).map(p => `L ${p}`).join(' ') + ` L ${lastX},${chartHeight + 10} L ${firstX},${chartHeight + 10} Z`;
                const lineD = `M ${points[0]} ` + points.slice(1).map(p => `L ${p}`).join(' ');

                // Target Line
                const targetPoints = MONTHLY_TREND_DATA.map((d, i) => {
                  const x = 55 + i * step;
                  const y = chartHeight - (d.target / maxRevenue) * (chartHeight - 30) + 10;
                  return `${x},${y}`;
                });
                const targetLineD = `M ${targetPoints[0]} ` + targetPoints.slice(1).map(p => `L ${p}`).join(' ');

                return (
                  <>
                    {/* Area under curve */}
                    <path d={areaD} fill="url(#revenueFillLight)" />

                    {/* Target dashed line */}
                    <path 
                      d={targetLineD} 
                      fill="none" 
                      stroke="#06b6d4" 
                      strokeWidth="2" 
                      strokeDasharray="4 4" 
                    />

                    {/* Actual revenue solid line */}
                    <path 
                      d={lineD} 
                      fill="none" 
                      stroke="#059669" 
                      strokeWidth="3" 
                    />

                    {/* Interactive dots */}
                    {MONTHLY_TREND_DATA.map((d, i) => {
                      const x = 55 + i * step;
                      const y = chartHeight - (d.revenue / maxRevenue) * (chartHeight - 30) + 10;
                      const isHovered = hoveredTrendIndex === i;

                      return (
                        <g 
                          key={i} 
                          className="cursor-pointer"
                          onMouseEnter={() => setHoveredTrendIndex(i)}
                          onMouseLeave={() => setHoveredTrendIndex(null)}
                          onClick={() => setHoveredTrendIndex(i)}
                        >
                          <circle 
                            cx={x} 
                            cy={y} 
                            r={isHovered ? 6 : 4} 
                            fill="#059669" 
                            stroke="#ffffff" 
                            strokeWidth="2" 
                            className="transition-all"
                          />
                          {/* X-axis date labels */}
                          <text 
                            x={x} 
                            y={chartHeight + 28} 
                            textAnchor="middle" 
                            className={`text-[10px] ${isHovered ? 'fill-emerald-700 font-bold' : 'fill-slate-500'}`}
                          >
                            {d.day}
                          </text>
                        </g>
                      );
                    })}
                  </>
                );
              })()}
            </svg>
          </div>
        </div>

        {/* Hovered Trend Detail Box */}
        {hoveredTrendIndex !== null && (
          <div className="mt-3 p-3 rounded-xl bg-slate-50 border border-emerald-300 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              <span className="font-bold text-slate-900">
                Tanggal: {MONTHLY_TREND_DATA[hoveredTrendIndex].date}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-slate-700">
              <div>
                Realisasi: <strong className="text-emerald-700 font-bold">{formatRupiah(MONTHLY_TREND_DATA[hoveredTrendIndex].revenue)}</strong>
              </div>
              <div>
                Target: <span className="text-cyan-700 font-semibold">{formatRupiah(MONTHLY_TREND_DATA[hoveredTrendIndex].target)}</span>
              </div>
              <div>
                Botol: <span className="text-slate-900 font-semibold">{MONTHLY_TREND_DATA[hoveredTrendIndex].bottles} pcs</span>
              </div>
              <div>
                Kunjungan: <span className="text-purple-700 font-semibold">{MONTHLY_TREND_DATA[hoveredTrendIndex].visits} toko</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Middle Grid: Category Breakdown & Top Vape Stores */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        
        {/* Category Breakdown (Saltnic vs Freebase vs Pods Friendly) */}
        <div className="p-4 sm:p-6 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Layers className="w-4 h-4 text-emerald-600" />
                Distribusi Kategori Liquid
              </h3>
              <span className="text-[11px] text-slate-400">Total Botol</span>
            </div>

            <div className="space-y-4 my-2">
              {/* Saltnic */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-semibold text-cyan-700 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-cyan-500"></span>
                    Saltnic (30ml)
                  </span>
                  <span className="text-slate-900 font-bold">
                    48% (1.398 btl)
                  </span>
                </div>
                <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                  <div className="bg-gradient-to-r from-cyan-500 to-blue-500 h-full rounded-full" style={{ width: '48%' }}></div>
                </div>
                <span className="text-[10px] text-slate-400 block mt-1">
                  Unggulan: Frost Mint Ice, Mango Freeze
                </span>
              </div>

              {/* Freebase */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-semibold text-amber-700 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                    Freebase (60ml)
                  </span>
                  <span className="text-slate-900 font-bold">
                    32% (932 btl)
                  </span>
                </div>
                <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                  <div className="bg-gradient-to-r from-amber-500 to-yellow-500 h-full rounded-full" style={{ width: '32%' }}></div>
                </div>
                <span className="text-[10px] text-slate-400 block mt-1">
                  Unggulan: Butterscotch Cream, Tokyo Banana
                </span>
              </div>

              {/* Pods Friendly */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-semibold text-purple-700 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                    Pods Friendly (30ml)
                  </span>
                  <span className="text-slate-900 font-bold">
                    20% (583 btl)
                  </span>
                </div>
                <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                  <div className="bg-gradient-to-r from-purple-500 to-fuchsia-500 h-full rounded-full" style={{ width: '20%' }}></div>
                </div>
                <span className="text-[10px] text-slate-400 block mt-1">
                  Unggulan: Grape Candy Pop, Watermelon Chill
                </span>
              </div>
            </div>
          </div>

          <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Rekomendasi Restock:</span>
            <span className="text-emerald-700 font-semibold">Tingkatkan kuota Saltnic</span>
          </div>
        </div>

        {/* Top 5 Contributor Vape Stores */}
        <div className="lg:col-span-2 p-4 sm:p-6 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Award className="w-4 h-4 text-amber-500" />
                Top 5 Vape Store Pembeli Terbesar
              </h3>
              <p className="text-xs text-slate-500">
                Mitra dengan kontribusi omzet akumulatif tertinggi di area Anda
              </p>
            </div>
            <button
              onClick={() => onNavigateToTab('customers')}
              className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 cursor-pointer"
            >
              <span>Semua Toko</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
            <table className="w-full text-left text-xs min-w-[500px]">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500">
                  <th className="pb-2.5 font-semibold">Nama Toko & Wilayah</th>
                  <th className="pb-2.5 font-semibold">Kategori Mitra</th>
                  <th className="pb-2.5 font-semibold text-center">Total Order</th>
                  <th className="pb-2.5 font-semibold text-right">Kontribusi Omzet</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {topCustomers.map((c, idx) => (
                  <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-2.5 sm:py-3">
                      <div className="flex items-center gap-2.5">
                        <span className="w-5 h-5 rounded-full bg-slate-100 border border-slate-200 text-center font-bold text-[10px] text-slate-700 flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>
                        <div>
                          <div className="font-semibold text-slate-900">{c.name}</div>
                          <div className="text-[11px] text-slate-400">{c.area} • PIC: {c.ownerName}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-2.5 sm:py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold border ${getTierBadgeClass(c.tier)}`}>
                        {c.tier}
                      </span>
                    </td>
                    <td className="py-2.5 sm:py-3 text-center font-semibold text-slate-700">
                      {c.totalOrdersCount}x
                    </td>
                    <td className="py-2.5 sm:py-3 text-right font-bold text-emerald-700">
                      {formatRupiah(c.totalRevenue)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* Bottom Row: Best-Selling SKU Leaderboard & Sales Rep Action Center */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        
        {/* Best Selling Liquid SKUs */}
        <div className="p-4 sm:p-6 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Flame className="w-4 h-4 text-orange-500" />
              Varian PODA E-Liquid Paling Laris
            </h3>
            <span className="text-[11px] text-slate-400">Bulan Berjalan</span>
          </div>

          <div className="space-y-2.5">
            {products.slice(0, 5).map((prod, i) => (
              <div key={prod.id} className="p-3 rounded-xl bg-slate-50/80 border border-slate-200/80 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 sm:gap-3">
                  <div className={`w-8 h-8 rounded-lg bg-gradient-to-tr ${prod.badgeColor} flex items-center justify-center text-white font-bold text-xs shadow-xs shrink-0`}>
                    #{i + 1}
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-slate-900">{prod.name}</h4>
                    <p className="text-[11px] text-slate-400">{prod.variant} • {prod.nicotine}</p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-xs font-bold text-emerald-700">
                    {formatRupiah(prod.wholesalePrice)}
                  </div>
                  <div className="text-[10px] text-slate-500">
                    Stok: <strong className="text-slate-800">{prod.stock} btl</strong>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Visit & Field Activity Quick Summary */}
        <div className="p-4 sm:p-6 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <CalendarCheck className="w-4 h-4 text-purple-600" />
                Aktivitas Kunjungan Lapangan Hari Ini
              </h3>
              <button
                onClick={onOpenNewVisit}
                className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 cursor-pointer"
              >
                + Jadwal Baru
              </button>
            </div>

            <div className="space-y-2.5">
              {visits.slice(0, 3).map((v) => (
                <div key={v.id} className="p-3 rounded-xl bg-slate-50/80 border border-slate-200/80 flex items-center justify-between gap-2">
                  <div className="flex items-start gap-2.5 min-w-0">
                    <div className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 mt-0.5 shrink-0">
                      <Clock className="w-3.5 h-3.5" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-slate-900 truncate">{v.customerName}</div>
                      <div className="text-[11px] text-slate-500 truncate">
                        {v.time} WIB • {v.purpose} ({v.customerArea})
                      </div>
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold shrink-0 ${
                    v.status === 'Selesai' 
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                      : v.status === 'Sedang Berlangsung'
                      ? 'bg-amber-50 text-amber-700 border border-amber-200 animate-pulse'
                      : 'bg-blue-50 text-blue-700 border border-blue-200'
                  }`}>
                    {v.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-5 pt-3 border-t border-slate-100 flex flex-wrap gap-2 justify-end">
            <button
              onClick={() => onNavigateToTab('visits')}
              className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
            >
              Buka Semua Jadwal
            </button>
            <button
              onClick={() => onNavigateToTab('sales')}
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-colors cursor-pointer shadow-xs"
            >
              Laporan Penjualan
            </button>
          </div>
        </div>

      </div>

    </div>
  );
};
