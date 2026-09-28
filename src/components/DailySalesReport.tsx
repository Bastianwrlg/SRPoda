import React, { useState } from 'react';
import { 
  FileText, 
  Target, 
  TrendingUp, 
  Plus, 
  Search, 
  ShoppingBag, 
  Calendar, 
  CheckCircle2, 
  Printer, 
  Download, 
  X, 
  Trash2, 
  Flame, 
  CreditCard, 
  ChevronDown,
  ArrowUpRight,
  Sparkles,
  Share2
} from 'lucide-react';
import { 
  DailySalesReport, 
  DailyTargetConfig, 
  Customer, 
  ProductLiquid, 
  OrderItem, 
  PaymentMethod, 
  PaymentStatus 
} from '../types';
import { 
  formatRupiah, 
  formatNumber, 
  formatDateIndo, 
  getStatusBadgeClass 
} from '../utils/formatters';

interface DailySalesReportProps {
  salesReports: DailySalesReport[];
  targetConfig: DailyTargetConfig;
  customers: Customer[];
  products: ProductLiquid[];
  onAddReport: (report: Omit<DailySalesReport, 'id' | 'invoiceNumber'>) => void;
  preselectedCustomer?: Customer | null;
  onClearPreselectedCustomer?: () => void;
}

export const DailySalesReportComponent: React.FC<DailySalesReportProps> = ({
  salesReports,
  targetConfig,
  customers,
  products,
  onAddReport,
  preselectedCustomer,
  onClearPreselectedCustomer
}) => {
  const [filterDate, setFilterDate] = useState<'today' | 'all'>('today');
  const [searchTerm, setSearchTerm] = useState('');
  const [isNewSaleModalOpen, setIsNewSaleModalOpen] = useState(false);
  const [viewingInvoice, setViewingInvoice] = useState<DailySalesReport | null>(null);

  // Form state for creating a sale
  const [customerId, setCustomerId] = useState(customers[0]?.id || '');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Transfer Bank');
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('Lunas');
  const [notes, setNotes] = useState('');
  const [orderItems, setOrderItems] = useState<OrderItem[]>([
    {
      productId: products[0]?.id || '',
      productName: products[0]?.name || '',
      category: products[0]?.category || 'Saltnic',
      quantity: 25,
      unitPrice: products[0]?.wholesalePrice || 85000,
      subtotal: (products[0]?.wholesalePrice || 85000) * 25
    }
  ]);

  // Open modal if preselected customer passed
  React.useEffect(() => {
    if (preselectedCustomer) {
      setCustomerId(preselectedCustomer.id);
      setIsNewSaleModalOpen(true);
      if (onClearPreselectedCustomer) {
        onClearPreselectedCustomer();
      }
    }
  }, [preselectedCustomer, onClearPreselectedCustomer]);

  // Calculations for Today (2026-09-16)
  const todayReports = salesReports.filter(r => r.date === '2026-09-16');
  const todayRevenue = todayReports.reduce((sum, r) => sum + r.totalRevenue, 0);
  const todayBottles = todayReports.reduce((sum, r) => sum + r.totalBottles, 0);

  const revenuePct = Math.min(100, Math.round((todayRevenue / targetConfig.targetRevenue) * 100));
  const bottlesPct = Math.min(100, Math.round((todayBottles / targetConfig.targetBottles) * 100));

  const remainingRevenue = Math.max(0, targetConfig.targetRevenue - todayRevenue);
  const remainingBottles = Math.max(0, targetConfig.targetBottles - todayBottles);

  // Filtering reports
  const filteredReports = salesReports.filter(r => {
    const matchesSearch = 
      r.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.items.some(i => i.productName.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesDate = filterDate === 'today' ? r.date === '2026-09-16' : true;
    return matchesSearch && matchesDate;
  });

  // Handle adding order item row
  const handleAddItemRow = () => {
    const firstProd = products[0];
    setOrderItems([
      ...orderItems,
      {
        productId: firstProd.id,
        productName: firstProd.name,
        category: firstProd.category,
        quantity: 10,
        unitPrice: firstProd.wholesalePrice,
        subtotal: firstProd.wholesalePrice * 10
      }
    ]);
  };

  const handleUpdateItem = (index: number, field: 'productId' | 'quantity', value: any) => {
    const updated = [...orderItems];
    if (field === 'productId') {
      const prod = products.find(p => p.id === value);
      if (prod) {
        updated[index].productId = prod.id;
        updated[index].productName = prod.name;
        updated[index].category = prod.category;
        updated[index].unitPrice = prod.wholesalePrice;
        updated[index].subtotal = prod.wholesalePrice * updated[index].quantity;
      }
    } else if (field === 'quantity') {
      const qty = Math.max(1, Number(value) || 1);
      updated[index].quantity = qty;
      updated[index].subtotal = updated[index].unitPrice * qty;
    }
    setOrderItems(updated);
  };

  const handleRemoveItem = (index: number) => {
    if (orderItems.length > 1) {
      setOrderItems(orderItems.filter((_, i) => i !== index));
    }
  };

  const currentTotalBottles = orderItems.reduce((sum, item) => sum + item.quantity, 0);
  const currentTotalRevenue = orderItems.reduce((sum, item) => sum + item.subtotal, 0);

  const handleSubmitNewSale = (e: React.FormEvent) => {
    e.preventDefault();
    const customer = customers.find(c => c.id === customerId);
    if (!customer) {
      alert('Pilih toko pembeli terlebih dahulu');
      return;
    }

    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    onAddReport({
      date: '2026-09-16',
      time: timeStr,
      customerId: customer.id,
      customerName: customer.name,
      customerArea: customer.area,
      salesRepName: 'Rian Pratama',
      items: orderItems,
      totalBottles: currentTotalBottles,
      totalRevenue: currentTotalRevenue,
      paymentMethod,
      paymentStatus,
      notes
    });

    setIsNewSaleModalOpen(false);
  };

  // CSV Export
  const handleExportCSV = () => {
    const headers = ['No Invoice', 'Tanggal', 'Jam', 'Nama Toko', 'Wilayah', 'Total Botol', 'Total Omzet (Rp)', 'Metode Bayar', 'Status'];
    const rows = filteredReports.map(r => [
      r.invoiceNumber,
      r.date,
      r.time,
      `"${r.customerName}"`,
      r.customerArea,
      r.totalBottles,
      r.totalRevenue,
      r.paymentMethod,
      r.paymentStatus
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Rekap_Penjualan_PODA_${filterDate === 'today' ? '16Sep2026' : 'Semua'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-300">
      
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200">
              <Target className="w-4 h-4" />
            </span>
            <h2 className="text-lg sm:text-2xl font-bold text-slate-900">Pelaporan Target Penjualan Harian</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Realisasi kuota penjualan botol e-liquid dan omzet harian PODA E-Liquid Sales Representative.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold border border-slate-200 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Ekspor CSV</span>
          </button>

          <button
            onClick={() => setIsNewSaleModalOpen(true)}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Input Penjualan</span>
          </button>
        </div>
      </div>

      {/* Target Harian Progress Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5 sm:gap-4">
        
        {/* Card 1: Target Omzet Harian */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Target Omzet Hari Ini</span>
            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              16 Sep 2026
            </span>
          </div>

          <div className="mt-3">
            <div className="text-xl sm:text-2xl font-extrabold text-slate-900">
              {formatRupiah(todayRevenue)}
            </div>
            <div className="flex items-center justify-between text-xs text-slate-500 mt-1">
              <span>Target: {formatRupiah(targetConfig.targetRevenue)}</span>
              <span className="font-bold text-emerald-700">{revenuePct}%</span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden mt-3 border border-slate-200">
            <div 
              className="bg-gradient-to-r from-emerald-500 to-teal-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${revenuePct}%` }}
            ></div>
          </div>

          <div className="mt-3 text-[11px] text-slate-500 flex items-center justify-between pt-2 border-t border-slate-100">
            <span>Kurang capai target:</span>
            <span className="font-semibold text-slate-800">{formatRupiah(remainingRevenue)}</span>
          </div>
        </div>

        {/* Card 2: Target Botol Liquid */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Target Volume Liquid</span>
            <div className="p-1.5 rounded-lg bg-sky-50 text-sky-700 border border-sky-200">
              <Flame className="w-3.5 h-3.5" />
            </div>
          </div>

          <div className="mt-3">
            <div className="text-xl sm:text-2xl font-extrabold text-slate-900">
              {formatNumber(todayBottles)} <span className="text-xs font-normal text-slate-500">/ {targetConfig.targetBottles} Botol</span>
            </div>
            <div className="flex items-center justify-between text-xs text-slate-500 mt-1">
              <span>Target: {targetConfig.targetBottles} botol</span>
              <span className="font-bold text-sky-700">{bottlesPct}%</span>
            </div>
          </div>

          <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden mt-3 border border-slate-200">
            <div 
              className="bg-gradient-to-r from-sky-500 to-blue-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${bottlesPct}%` }}
            ></div>
          </div>

          <div className="mt-3 text-[11px] text-slate-500 flex items-center justify-between pt-2 border-t border-slate-100">
            <span>Sisa kuota:</span>
            <span className="font-semibold text-sky-700">{remainingBottles} botol lagi</span>
          </div>
        </div>

        {/* Card 3: Target Kunjungan & Status Insentif */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-xs relative overflow-hidden flex flex-col justify-between sm:col-span-2 md:col-span-1">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">KPI Kunjungan & Bonus Harian</span>
              <div className="p-1.5 rounded-lg bg-purple-50 text-purple-700 border border-purple-200">
                <CheckCircle2 className="w-3.5 h-3.5" />
              </div>
            </div>

            <div className="mt-3">
              <div className="text-xl sm:text-2xl font-extrabold text-slate-900">
                3 <span className="text-xs font-normal text-slate-500">/ 4 Kunjungan Selesai</span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Tersisa 1 kunjungan terjadwal di Cloud Nine Kemang sore ini.
              </p>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] mt-3">
            <span className="text-emerald-700 font-semibold flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> Insentif On-Track
            </span>
            <span className="text-slate-600 font-medium">Bonus Rp 250rb</span>
          </div>
        </div>

      </div>

      {/* Filter & Search Header */}
      <div className="p-3 sm:p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl border border-slate-200 self-start">
          <button
            onClick={() => setFilterDate('today')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              filterDate === 'today'
                ? 'bg-white text-emerald-700 shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Hari Ini (16 Sep)
          </button>
          <button
            onClick={() => setFilterDate('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              filterDate === 'all'
                ? 'bg-white text-emerald-700 shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Semua Riwayat
          </button>
        </div>

        <div className="relative flex-1 max-w-sm">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari invoice, toko, atau nama liquid..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
          />
        </div>

      </div>

      {/* MOBILE VIEW: Cards for Smartphone screens */}
      <div className="md:hidden space-y-3">
        {filteredReports.length === 0 ? (
          <div className="p-8 text-center rounded-2xl bg-white border border-slate-200 text-slate-500 text-xs">
            Belum ada transaksi penjualan yang sesuai filter.
          </div>
        ) : (
          filteredReports.map((report) => (
            <div key={report.id} className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="font-mono font-bold text-slate-900 text-xs">{report.invoiceNumber}</div>
                  <div className="text-[10px] text-slate-500">{formatDateIndo(report.date)} • {report.time} WIB</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-extrabold text-emerald-700">{formatRupiah(report.totalRevenue)}</div>
                  <div className="text-[11px] font-bold text-slate-700">{report.totalBottles} botol</div>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-slate-900 text-xs">{report.customerName}</div>
                  <div className="text-[10px] text-slate-500">{report.customerArea}</div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border ${getStatusBadgeClass(report.paymentStatus)}`}>
                    {report.paymentStatus}
                  </span>
                  <button
                    onClick={() => setViewingInvoice(report)}
                    className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold border border-slate-200 transition-colors"
                  >
                    Struk
                  </button>
                </div>
              </div>

              <div className="bg-slate-50 p-2 rounded-lg text-[11px] text-slate-600 space-y-0.5">
                {report.items.map((it, idx) => (
                  <div key={idx} className="flex justify-between">
                    <span className="truncate">• {it.productName}</span>
                    <span className="font-semibold text-slate-800 shrink-0 ml-2">x{it.quantity}</span>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {/* DESKTOP VIEW: Table for Tablets & PCs */}
      <div className="hidden md:block p-5 rounded-2xl bg-white border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500">
                <th className="pb-3 font-semibold">No. Invoice & Tanggal</th>
                <th className="pb-3 font-semibold">Toko Pembeli</th>
                <th className="pb-3 font-semibold">Rincian Item Liquid PODA</th>
                <th className="pb-3 font-semibold text-center">Volume</th>
                <th className="pb-3 font-semibold text-right">Total Tagihan</th>
                <th className="pb-3 font-semibold text-center">Pembayaran</th>
                <th className="pb-3 font-semibold text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredReports.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">
                    Belum ada transaksi penjualan yang sesuai filter.
                  </td>
                </tr>
              ) : (
                filteredReports.map((report) => (
                  <tr key={report.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3.5">
                      <div className="font-mono font-bold text-slate-900 text-[11px]">{report.invoiceNumber}</div>
                      <div className="text-[10px] text-slate-500">
                        {formatDateIndo(report.date)} • {report.time} WIB
                      </div>
                    </td>

                    <td className="py-3.5">
                      <div className="font-semibold text-slate-900">{report.customerName}</div>
                      <div className="text-[10px] text-slate-500">{report.customerArea}</div>
                    </td>

                    <td className="py-3.5">
                      <div className="space-y-0.5 max-w-xs">
                        {report.items.map((it, idx) => (
                          <div key={idx} className="text-[11px] text-slate-600 flex items-center justify-between gap-2">
                            <span className="truncate">• {it.productName}</span>
                            <span className="text-slate-800 shrink-0 font-medium">x{it.quantity}</span>
                          </div>
                        ))}
                      </div>
                    </td>

                    <td className="py-3.5 text-center font-bold text-slate-900">
                      {report.totalBottles} btl
                    </td>

                    <td className="py-3.5 text-right font-extrabold text-emerald-700">
                      {formatRupiah(report.totalRevenue)}
                    </td>

                    <td className="py-3.5 text-center">
                      <div className="inline-flex flex-col items-center gap-1">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border ${getStatusBadgeClass(report.paymentStatus)}`}>
                          {report.paymentStatus}
                        </span>
                        <span className="text-[9px] text-slate-500 font-medium">
                          {report.paymentMethod}
                        </span>
                      </div>
                    </td>

                    <td className="py-3.5 text-right">
                      <button
                        onClick={() => setViewingInvoice(report)}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold border border-slate-200 transition-colors cursor-pointer"
                      >
                        Nota Struk
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: Form Input Penjualan Baru */}
      {isNewSaleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="relative w-full max-w-2xl bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh]">
            
            <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-slate-200 bg-slate-50/90">
              <div>
                <h3 className="text-base font-bold text-slate-900">Input Laporan Penjualan Baru</h3>
                <p className="text-xs text-slate-500">Catat transaksi pemesanan e-liquid PODA dari toko mitra</p>
              </div>
              <button
                onClick={() => setIsNewSaleModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200/60 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitNewSale} className="p-5 sm:p-6 space-y-4 overflow-y-auto text-xs">
              
              {/* Customer Selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Pilih Mitra Toko Pembeli *
                </label>
                <select
                  required
                  value={customerId}
                  onChange={(e) => setCustomerId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500"
                >
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.area}) - Kategori: {c.tier} [Sisa Piutang: {formatRupiah(c.currentDebt)}]
                    </option>
                  ))}
                </select>
              </div>

              {/* Order Items Table Builder */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Daftar Produk E-Liquid Dipesan
                  </h4>
                  <button
                    type="button"
                    onClick={handleAddItemRow}
                    className="flex items-center gap-1 text-emerald-700 hover:text-emerald-800 font-semibold cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Tambah Varian</span>
                  </button>
                </div>

                <div className="space-y-2.5">
                  {orderItems.map((item, idx) => (
                    <div 
                      key={idx} 
                      className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center gap-2.5"
                    >
                      {/* Product selector */}
                      <div className="flex-1 w-full sm:w-auto">
                        <select
                          value={item.productId}
                          onChange={(e) => handleUpdateItem(idx, 'productId', e.target.value)}
                          className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900"
                        >
                          {products.map(p => (
                            <option key={p.id} value={p.id}>
                              {p.name} ({p.volume} - {p.nicotine}) - {formatRupiah(p.wholesalePrice)}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Quantity Input */}
                      <div className="flex items-center gap-2">
                        <span className="text-slate-500">Qty (Btl):</span>
                        <input
                          type="number"
                          min="1"
                          max="500"
                          value={item.quantity}
                          onChange={(e) => handleUpdateItem(idx, 'quantity', e.target.value)}
                          className="w-20 bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 text-center font-bold"
                        />
                      </div>

                      {/* Subtotal */}
                      <div className="w-28 text-right font-bold text-emerald-700">
                        {formatRupiah(item.subtotal)}
                      </div>

                      {/* Remove Button */}
                      {orderItems.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(idx)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Order Summary Box */}
              <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-200 flex items-center justify-between">
                <div>
                  <span className="text-slate-600 block">Total Volume Pesanan:</span>
                  <span className="text-base font-bold text-slate-900">{currentTotalBottles} Botol E-Liquid</span>
                </div>
                <div className="text-right">
                  <span className="text-slate-600 block">Total Nilai Transaksi:</span>
                  <span className="text-xl font-extrabold text-emerald-700">{formatRupiah(currentTotalRevenue)}</span>
                </div>
              </div>

              {/* Payment Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Metode Pembayaran
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:bg-white"
                  >
                    <option value="Transfer Bank">Transfer Bank (BCA / Mandiri)</option>
                    <option value="Tunai">Tunai / Cash On Delivery</option>
                    <option value="Tempo 14 Hari">Tempo 14 Hari</option>
                    <option value="Tempo 30 Hari">Tempo 30 Hari</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Status Pelunasan
                  </label>
                  <select
                    value={paymentStatus}
                    onChange={(e) => setPaymentStatus(e.target.value as PaymentStatus)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:bg-white"
                  >
                    <option value="Lunas">Lunas (Sudah Dibayar)</option>
                    <option value="Tempo">Tempo (Piutang Dagang)</option>
                    <option value="Pending">Pending Konfirmasi Kasir</option>
                  </select>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Catatan Tambahan Transaksi
                </label>
                <input
                  type="text"
                  placeholder="misal: Diskon khusus repeat order partai besar / tempo disetujui Pak Sales Manager..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:bg-white"
                />
              </div>

              <div className="pt-4 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsNewSaleModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
                >
                  Simpan Laporan Penjualan
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* MODAL: Detail Nota / Struk Invoice */}
      {viewingInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="relative w-full max-w-lg bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            
            <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-slate-200 bg-slate-50">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-emerald-600" />
                <h3 className="text-base font-bold text-slate-900">Nota Penjualan Resmi</h3>
              </div>
              <button
                onClick={() => setViewingInvoice(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200/60 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 sm:p-6 space-y-4 overflow-y-auto text-xs">
              
              {/* Receipt Header */}
              <div className="text-center pb-4 border-b border-dashed border-slate-300">
                <h2 className="text-base font-extrabold text-slate-900">PODA E-LIQUID COMPANY</h2>
                <p className="text-[10px] text-slate-500">PT. Poda Liquid Distribusi Indonesia</p>
                <p className="text-[10px] text-slate-600 font-mono mt-1 font-semibold">Invoice: {viewingInvoice.invoiceNumber}</p>
              </div>

              {/* Invoice Meta */}
              <div className="grid grid-cols-2 gap-2 text-slate-700">
                <div>
                  <span className="text-slate-500 block">Toko:</span>
                  <span className="font-semibold text-slate-900">{viewingInvoice.customerName}</span>
                  <span className="text-[10px] text-slate-500 block">{viewingInvoice.customerArea}</span>
                </div>
                <div className="text-right">
                  <span className="text-slate-500 block">Waktu Transaksi:</span>
                  <span className="font-semibold text-slate-900">{formatDateIndo(viewingInvoice.date)}</span>
                  <span className="text-[10px] text-slate-500 block">{viewingInvoice.time} WIB</span>
                </div>
              </div>

              {/* Items List */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="font-semibold text-slate-500 pb-1 border-b border-slate-200 flex justify-between">
                  <span>Produk E-Liquid</span>
                  <span>Subtotal</span>
                </div>
                {viewingInvoice.items.map((it, idx) => (
                  <div key={idx} className="flex justify-between items-center py-1">
                    <div>
                      <div className="text-slate-900 font-medium">{it.productName}</div>
                      <div className="text-[10px] text-slate-500">
                        {it.quantity} btl @ {formatRupiah(it.unitPrice)}
                      </div>
                    </div>
                    <div className="font-bold text-slate-900">
                      {formatRupiah(it.subtotal)}
                    </div>
                  </div>
                ))}
              </div>

              {/* Grand Total */}
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 flex justify-between items-center">
                <div>
                  <span className="text-slate-600 block">Total Pembelian ({viewingInvoice.totalBottles} Botol):</span>
                  <span className="text-xs text-slate-800 font-semibold">
                    Metode: {viewingInvoice.paymentMethod} ({viewingInvoice.paymentStatus})
                  </span>
                </div>
                <div className="text-lg font-extrabold text-emerald-700">
                  {formatRupiah(viewingInvoice.totalRevenue)}
                </div>
              </div>

              {viewingInvoice.notes && (
                <div className="p-3 rounded-lg bg-slate-50 text-slate-600 italic text-[11px] border border-slate-200">
                  Catatan: {viewingInvoice.notes}
                </div>
              )}

              {/* Actions */}
              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  onClick={() => {
                    window.print();
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Cetak Nota</span>
                </button>
                <button
                  onClick={() => {
                    const text = `*NOTA PENJUALAN PODA E-LIQUID COMPANY*\nNo: ${viewingInvoice.invoiceNumber}\nToko: ${viewingInvoice.customerName}\nTotal: ${formatRupiah(viewingInvoice.totalRevenue)} (${viewingInvoice.totalBottles} botol)\nStatus: ${viewingInvoice.paymentStatus}`;
                    navigator.clipboard.writeText(text);
                    alert('Rangkuman nota berhasil disalin ke clipboard untuk WhatsApp!');
                  }}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Salin ke WhatsApp</span>
                </button>
              </div>

            </div>

          </div>
        </div>
      )}

    </div>
  );
};
