import React, { useState } from 'react';
import { 
  Users, 
  Search, 
  Plus, 
  Filter, 
  Phone, 
  MapPin, 
  CreditCard, 
  Calendar, 
  ShoppingBag, 
  Edit2, 
  Trash2, 
  Eye, 
  X, 
  Check, 
  AlertCircle,
  MessageCircle,
  Sparkles,
  FileSpreadsheet,
  UploadCloud,
  Download
} from 'lucide-react';
import { Customer, CustomerTier, CustomerStatus } from '../types';
import { 
  formatRupiah, 
  formatDateIndo, 
  getTierBadgeClass, 
  getStatusBadgeClass 
} from '../utils/formatters';
import { 
  exportCustomersToExcel, 
  downloadCustomerTemplateExcel 
} from '../utils/excelHelper';
import { ImportCustomerModal, CustomerImportMode } from './ImportCustomerModal';

interface CustomerManagementProps {
  customers: Customer[];
  onAddCustomer: (customer: Omit<Customer, 'id' | 'totalOrdersCount' | 'totalRevenue' | 'lastVisitDate'>) => void;
  onUpdateCustomer: (customer: Customer) => void;
  onDeleteCustomer: (id: string) => void;
  onScheduleVisitForCustomer: (customer: Customer) => void;
  onCreateSaleForCustomer: (customer: Customer) => void;
  onImportCustomers?: (customers: Customer[], mode: CustomerImportMode) => void;
  onAddToast?: (title: string, message: string, type: 'success' | 'warning' | 'info' | 'error') => void;
}

export const CustomerManagement: React.FC<CustomerManagementProps> = ({
  customers,
  onAddCustomer,
  onUpdateCustomer,
  onDeleteCustomer,
  onScheduleVisitForCustomer,
  onCreateSaleForCustomer,
  onImportCustomers,
  onAddToast
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTier, setSelectedTier] = useState<string>('Semua');
  const [selectedStatus, setSelectedStatus] = useState<string>('Semua');
  const [selectedArea, setSelectedArea] = useState<string>('Semua');
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [viewingCustomer, setViewingCustomer] = useState<Customer | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    ownerName: '',
    phone: '',
    email: '',
    address: '',
    area: 'Jakarta Selatan',
    tier: 'Retail Premium' as CustomerTier,
    status: 'Aktif' as CustomerStatus,
    creditLimit: 30000000,
    currentDebt: 0,
    notes: '',
    lat: -6.2297,
    lng: 106.8166
  });

  // Extract unique areas
  const areas = ['Semua', ...Array.from(new Set(customers.map(c => c.area)))];

  // Filtering
  const filteredCustomers = customers.filter(c => {
    const matchesSearch = 
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.ownerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.phone.includes(searchTerm) ||
      c.address.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesTier = selectedTier === 'Semua' || c.tier === selectedTier;
    const matchesStatus = selectedStatus === 'Semua' || c.status === selectedStatus;
    const matchesArea = selectedArea === 'Semua' || c.area === selectedArea;

    return matchesSearch && matchesTier && matchesStatus && matchesArea;
  });

  const handleOpenAddModal = () => {
    setFormData({
      name: '',
      ownerName: '',
      phone: '',
      email: '',
      address: '',
      area: 'Jakarta Selatan',
      tier: 'Retail Premium',
      status: 'Aktif',
      creditLimit: 30000000,
      currentDebt: 0,
      notes: '',
      lat: -6.2297,
      lng: 106.8166
    });
    setEditingCustomer(null);
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (c: Customer) => {
    setEditingCustomer(c);
    setFormData({
      name: c.name,
      ownerName: c.ownerName,
      phone: c.phone,
      email: c.email || '',
      address: c.address,
      area: c.area,
      tier: c.tier,
      status: c.status,
      creditLimit: c.creditLimit,
      currentDebt: c.currentDebt,
      notes: c.notes,
      lat: c.coordinates?.lat || -6.2297,
      lng: c.coordinates?.lng || 106.8166
    });
    setIsAddModalOpen(true);
  };

  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.phone.trim()) {
      alert('Mohon isi nama toko dan nomor telepon PIC');
      return;
    }

    if (editingCustomer) {
      onUpdateCustomer({
        ...editingCustomer,
        name: formData.name,
        ownerName: formData.ownerName,
        phone: formData.phone,
        email: formData.email,
        address: formData.address,
        area: formData.area,
        tier: formData.tier,
        status: formData.status,
        creditLimit: Number(formData.creditLimit),
        currentDebt: Number(formData.currentDebt),
        notes: formData.notes,
        coordinates: {
          lat: formData.lat,
          lng: formData.lng
        }
      });
    } else {
      onAddCustomer({
        name: formData.name,
        ownerName: formData.ownerName,
        phone: formData.phone,
        email: formData.email,
        address: formData.address,
        area: formData.area,
        tier: formData.tier,
        status: formData.status,
        creditLimit: Number(formData.creditLimit),
        currentDebt: Number(formData.currentDebt),
        notes: formData.notes,
        coordinates: {
          lat: formData.lat,
          lng: formData.lng
        }
      });
    }

    setIsAddModalOpen(false);
  };

  // Metric counts
  const totalDebtSum = customers.reduce((acc, c) => acc + c.currentDebt, 0);
  const totalStores = customers.length;
  const activeStores = customers.filter(c => c.status === 'Aktif').length;

  return (
    <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-300">
      
      {/* Top Banner: Stats & Add / Export / Import Buttons */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              Database Mitra Vape Store
            </span>
            <span className="text-[11px] text-slate-500">{activeStores} dari {totalStores} Toko Aktif</span>
          </div>
          <h2 className="text-lg sm:text-2xl font-bold text-slate-900 mt-1">
            Manage Data Toko
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Kelola profil outlet ritel vape, kontak PIC, plafon piutang, serta export & import format Excel (.xlsx / .xls).
          </p>
        </div>

        {/* Action Button Cluster */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Import Button */}
          <button
            type="button"
            onClick={() => setIsImportModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
          >
            <UploadCloud className="w-4 h-4" />
            <span>Import XLS</span>
          </button>

          {/* Download Sample Template */}
          <button
            type="button"
            onClick={() => {
              downloadCustomerTemplateExcel();
              onAddToast?.('Template Diunduh', 'Template Excel toko (.xlsx) berhasil diunduh.', 'success');
            }}
            title="Unduh contoh template spreadsheet Excel toko (.xlsx) siap isi"
            className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition-all cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-teal-600" />
            <span className="hidden sm:inline">Template XLS</span>
          </button>

          {/* Export Customers */}
          <button
            type="button"
            onClick={() => {
              exportCustomersToExcel(customers);
              onAddToast?.('Export Berhasil', `${customers.length} data toko mitra berhasil diekspor ke Excel (.xlsx).`, 'success');
            }}
            title="Ekspor seluruh data toko mitra ke Excel (.xlsx)"
            className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold transition-all cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>Export XLS</span>
          </button>

          {/* Add Customer Manual */}
          <button
            type="button"
            onClick={handleOpenAddModal}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-xs transition-all shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4 text-emerald-400" />
            <span>Tambah Toko Mitra</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-3 sm:p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col md:flex-row gap-2.5 sm:gap-3 items-stretch md:items-center justify-between">
        
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari nama toko, PIC, telp, atau alamat..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-12 py-2 sm:py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs px-1"
            >
              Reset
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          
          {/* Tier Filter */}
          <select
            value={selectedTier}
            onChange={(e) => setSelectedTier(e.target.value)}
            className="flex-1 sm:flex-initial bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-xl px-2.5 sm:px-3 py-2 sm:py-2.5 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="Semua">Semua Kategori</option>
            <option value="Distributor">Distributor</option>
            <option value="Wholesaler">Wholesaler</option>
            <option value="Retail Premium">Retail Premium</option>
            <option value="Retail Regular">Retail Regular</option>
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="flex-1 sm:flex-initial bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-xl px-2.5 sm:px-3 py-2 sm:py-2.5 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="Semua">Semua Status</option>
            <option value="Aktif">Aktif</option>
            <option value="Menunggu Restock">Menunggu Restock</option>
            <option value="Perlu Kunjungan">Perlu Kunjungan</option>
            <option value="Non-Aktif">Non-Aktif</option>
          </select>

          {/* Area Filter */}
          <select
            value={selectedArea}
            onChange={(e) => setSelectedArea(e.target.value)}
            className="flex-1 sm:flex-initial bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-xl px-2.5 sm:px-3 py-2 sm:py-2.5 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            {areas.map(a => (
              <option key={a} value={a}>{a === 'Semua' ? 'Semua Wilayah' : a}</option>
            ))}
          </select>

        </div>
      </div>

      {/* Customers Card Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
        {filteredCustomers.length === 0 ? (
          <div className="col-span-full p-10 sm:p-12 text-center rounded-2xl bg-white border border-slate-200">
            <Users className="w-10 h-10 text-slate-400 mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-slate-800">Tidak ada data pelanggan yang cocok</h3>
            <p className="text-xs text-slate-500 mt-1">Coba sesuaikan kata kunci pencarian atau ganti filter kategori.</p>
          </div>
        ) : (
          filteredCustomers.map((customer) => {
            const debtRatio = customer.creditLimit > 0 
              ? Math.min(100, Math.round((customer.currentDebt / customer.creditLimit) * 100))
              : 0;

            const cleanPhone = customer.phone.replace(/[^0-9]/g, '');
            const waNumber = cleanPhone.startsWith('0') ? '62' + cleanPhone.slice(1) : cleanPhone;

            return (
              <div
                key={customer.id}
                className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 hover:border-emerald-400 hover:shadow-md transition-all flex flex-col justify-between group"
              >
                <div>
                  {/* Card Header: Store Name & Badges */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="min-w-0">
                      <h3 className="text-base font-bold text-slate-900 group-hover:text-emerald-700 transition-colors truncate">
                        {customer.name}
                      </h3>
                      <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5 truncate">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{customer.area}</span>
                      </p>
                    </div>

                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border ${getTierBadgeClass(customer.tier)}`}>
                        {customer.tier}
                      </span>
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border ${getStatusBadgeClass(customer.status)}`}>
                        {customer.status}
                      </span>
                    </div>
                  </div>

                  {/* PIC & Contact Details */}
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5 text-xs mb-3.5">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">PIC Toko:</span>
                      <span className="font-semibold text-slate-800">{customer.ownerName}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">WhatsApp / Telp:</span>
                      <span className="text-slate-800 font-mono text-[11px] font-medium">{customer.phone}</span>
                    </div>
                    <div className="text-[11px] text-slate-500 line-clamp-1 pt-1 border-t border-slate-200/60">
                      {customer.address}
                    </div>
                  </div>

                  {/* Credit Ceiling & Debt Meter */}
                  <div className="space-y-1.5 mb-3.5">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-500 flex items-center gap-1">
                        <CreditCard className="w-3 h-3 text-slate-400" />
                        Plafon Piutang
                      </span>
                      <span className="text-slate-800 font-medium">
                        {formatRupiah(customer.currentDebt)} / <span className="text-slate-500">{formatRupiah(customer.creditLimit)}</span>
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden border border-slate-200/60">
                      <div 
                        className={`h-full rounded-full transition-all ${
                          debtRatio > 80 ? 'bg-rose-500' : debtRatio > 50 ? 'bg-amber-500' : 'bg-emerald-500'
                        }`}
                        style={{ width: `${debtRatio}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Order & Sales Stats */}
                  <div className="grid grid-cols-2 gap-2 pt-2.5 border-t border-slate-100 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 block">Total Order</span>
                      <span className="font-bold text-slate-800">{customer.totalOrdersCount} Transaksi</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 block">Akumulasi Omzet</span>
                      <span className="font-bold text-emerald-700">{formatRupiah(customer.totalRevenue)}</span>
                    </div>
                  </div>
                </div>

                {/* Card Action Buttons (Mobile thumb-friendly) */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-1.5">
                  <div className="flex items-center gap-1.5">
                    {/* Direct WhatsApp Message */}
                    <a
                      href={`https://wa.me/${waNumber}?text=Halo%20${encodeURIComponent(customer.ownerName)},%20saya%20Rian%20dari%20PODA%20E-LIQUID%20COMPANY...`}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Chat WhatsApp Toko"
                      className="p-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 transition-colors shrink-0"
                    >
                      <MessageCircle className="w-4 h-4" />
                    </a>

                    {/* View Details */}
                    <button
                      onClick={() => setViewingCustomer(customer)}
                      title="Lihat Detail Toko"
                      className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-colors shrink-0 cursor-pointer"
                    >
                      <Eye className="w-4 h-4" />
                    </button>

                    {/* Edit */}
                    <button
                      onClick={() => handleOpenEditModal(customer)}
                      title="Edit Data Mitra"
                      className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-colors shrink-0 cursor-pointer"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => onScheduleVisitForCustomer(customer)}
                      className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold border border-slate-200 transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <Calendar className="w-3.5 h-3.5 text-cyan-600" />
                      <span className="hidden xs:inline">Jadwal</span>
                    </button>

                    <button
                      onClick={() => onCreateSaleForCustomer(customer)}
                      className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-colors flex items-center gap-1 shadow-xs cursor-pointer"
                    >
                      <ShoppingBag className="w-3.5 h-3.5" />
                      <span>Order</span>
                    </button>
                  </div>
                </div>

              </div>
            );
          })
        )}
      </div>

      {/* MODAL: Tambah / Edit Pelanggan */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="relative w-full max-w-xl bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            
            <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-slate-200 bg-slate-50/90">
              <h3 className="text-base font-bold text-slate-900">
                {editingCustomer ? 'Edit Data Mitra Toko' : 'Tambah Toko Mitra Baru'}
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200/60 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitForm} className="p-5 sm:p-6 space-y-4 overflow-y-auto">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nama Toko / Outlet *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="misal: Vapor Lounge Jakarta"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nama Pemilik / PIC *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="misal: Hendra Gunawan"
                    value={formData.ownerName}
                    onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    No. WhatsApp / Telepon *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="misal: 0812-3456-7890"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Email Toko (Opsional)
                  </label>
                  <input
                    type="email"
                    placeholder="misal: store@gmail.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Wilayah / Area
                  </label>
                  <select
                    value={formData.area}
                    onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="Jakarta Selatan">Jakarta Selatan</option>
                    <option value="Jakarta Barat">Jakarta Barat</option>
                    <option value="Jakarta Pusat">Jakarta Pusat</option>
                    <option value="Jakarta Utara">Jakarta Utara</option>
                    <option value="Jakarta Timur">Jakarta Timur</option>
                    <option value="Tangerang">Tangerang</option>
                    <option value="Tangerang Selatan">Tangerang Selatan</option>
                    <option value="Bekasi">Bekasi</option>
                    <option value="Depok">Depok</option>
                    <option value="Bogor">Bogor</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Kategori Mitra
                  </label>
                  <select
                    value={formData.tier}
                    onChange={(e) => setFormData({ ...formData, tier: e.target.value as CustomerTier })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="Distributor">Distributor</option>
                    <option value="Wholesaler">Wholesaler</option>
                    <option value="Retail Premium">Retail Premium</option>
                    <option value="Retail Regular">Retail Regular</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Status Toko
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as CustomerStatus })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="Aktif">Aktif</option>
                    <option value="Menunggu Restock">Menunggu Restock</option>
                    <option value="Perlu Kunjungan">Perlu Kunjungan</option>
                    <option value="Non-Aktif">Non-Aktif</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Alamat Lengkap Toko
                </label>
                <textarea
                  rows={2}
                  placeholder="Nama jalan, nomor ruko/kavling, kelurahan, kecamatan..."
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500"
                ></textarea>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Limit Plafon Kredit (Rp)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="5000000"
                    value={formData.creditLimit}
                    onChange={(e) => setFormData({ ...formData, creditLimit: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Sisa Piutang Saat Ini (Rp)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="500000"
                    value={formData.currentDebt}
                    onChange={(e) => setFormData({ ...formData, currentDebt: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Catatan Preferensi / Selera Liquid Toko
                </label>
                <input
                  type="text"
                  placeholder="misal: Suka pesan PODA Saltnic rasa buah mangga dan mint..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="pt-4 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                >
                  {editingCustomer ? 'Simpan Perubahan' : 'Simpan Toko'}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* MODAL: Detail Pelanggan */}
      {viewingCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="relative w-full max-w-lg bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            
            <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-slate-200 bg-slate-50/90">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">{viewingCustomer.name}</h3>
                  <p className="text-xs text-slate-500">{viewingCustomer.area}</p>
                </div>
              </div>
              <button
                onClick={() => setViewingCustomer(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200/60 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 sm:p-6 space-y-4 overflow-y-auto text-xs">
              
              <div className="flex items-center gap-2">
                <span className={`px-2.5 py-1 rounded-md font-semibold border ${getTierBadgeClass(viewingCustomer.tier)}`}>
                  {viewingCustomer.tier}
                </span>
                <span className={`px-2.5 py-1 rounded-md font-semibold border ${getStatusBadgeClass(viewingCustomer.status)}`}>
                  Status: {viewingCustomer.status}
                </span>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">Pemilik / PIC:</span>
                  <span className="text-slate-800 font-semibold">{viewingCustomer.ownerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Kontak WhatsApp:</span>
                  <span className="text-emerald-700 font-mono font-medium">{viewingCustomer.phone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Alamat Lengkap:</span>
                  <span className="text-slate-800 text-right max-w-[240px]">{viewingCustomer.address}</span>
                </div>
                <div className="flex justify-between pt-1 border-t border-slate-200">
                  <span className="text-slate-500">Kunjungan Terakhir:</span>
                  <span className="text-slate-800">{formatDateIndo(viewingCustomer.lastVisitDate)}</span>
                </div>
              </div>

              {/* Financial Snapshot */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Status Keuangan & Order</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-slate-500 block">Plafon Kredit:</span>
                    <span className="text-slate-800 font-bold">{formatRupiah(viewingCustomer.creditLimit)}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Sisa Piutang:</span>
                    <span className={`font-bold ${viewingCustomer.currentDebt > 0 ? 'text-amber-700' : 'text-emerald-700'}`}>
                      {formatRupiah(viewingCustomer.currentDebt)}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Frekuensi Order:</span>
                    <span className="text-slate-800 font-bold">{viewingCustomer.totalOrdersCount}x transaksi</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Total Pembelian:</span>
                    <span className="text-emerald-700 font-bold">{formatRupiah(viewingCustomer.totalRevenue)}</span>
                  </div>
                </div>
              </div>

              {/* Notes */}
              {viewingCustomer.notes && (
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[11px] font-semibold text-slate-500 block mb-1">Catatan Khusus:</span>
                  <p className="text-slate-700 italic">{viewingCustomer.notes}</p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2">
                <button
                  onClick={() => {
                    if (confirm(`Hapus toko ${viewingCustomer.name} dari database?`)) {
                      onDeleteCustomer(viewingCustomer.id);
                      setViewingCustomer(null);
                    }
                  }}
                  className="p-2 text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Hapus</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      const c = viewingCustomer;
                      setViewingCustomer(null);
                      onScheduleVisitForCustomer(c);
                    }}
                    className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold flex items-center gap-1.5 cursor-pointer"
                  >
                    <Calendar className="w-3.5 h-3.5 text-cyan-600" />
                    <span>Jadwal Kunjungan</span>
                  </button>

                  <button
                    onClick={() => {
                      const c = viewingCustomer;
                      setViewingCustomer(null);
                      onCreateSaleForCustomer(c);
                    }}
                    className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold flex items-center gap-1.5 cursor-pointer"
                  >
                    <ShoppingBag className="w-3.5 h-3.5" />
                    <span>Order Liquid</span>
                  </button>
                </div>
              </div>

            </div>

          </div>
        </div>
      )}

      {/* Import Excel Toko Modal */}
      <ImportCustomerModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        existingCustomers={customers}
        onApplyImport={(importedCustomers, mode, summary) => {
          if (onImportCustomers) {
            onImportCustomers(importedCustomers, mode);
          }
          onAddToast?.('Import Toko Berhasil', summary, 'success');
        }}
      />

    </div>
  );
};
