import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Plus, 
  Search, 
  CheckCircle2, 
  AlertCircle, 
  Play, 
  StopCircle, 
  Camera, 
  CheckSquare, 
  Square, 
  X, 
  ShoppingBag, 
  ChevronRight,
  Filter,
  Navigation,
  FileCheck,
  Send
} from 'lucide-react';
import { 
  VisitSchedule, 
  Customer, 
  VisitPurpose, 
  VisitPriority, 
  VisitStatus,
  VisitChecklist 
} from '../types';
import { 
  formatRupiah, 
  formatDateIndo, 
  getStatusBadgeClass 
} from '../utils/formatters';

interface VisitSchedulerProps {
  visits: VisitSchedule[];
  customers: Customer[];
  onAddVisit: (visit: Omit<VisitSchedule, 'id'>) => void;
  onUpdateVisit: (visit: VisitSchedule) => void;
  onDeleteVisit: (id: string) => void;
  onOpenSaleForVisit: (visit: VisitSchedule) => void;
}

export const VisitScheduler: React.FC<VisitSchedulerProps> = ({
  visits,
  customers,
  onAddVisit,
  onUpdateVisit,
  onDeleteVisit,
  onOpenSaleForVisit
}) => {
  const [filterDate, setFilterDate] = useState<'today' | 'upcoming' | 'all'>('today');
  const [filterStatus, setFilterStatus] = useState<string>('Semua');
  const [searchTerm, setSearchTerm] = useState('');

  // Modals
  const [isNewVisitModalOpen, setIsNewVisitModalOpen] = useState(false);
  const [activeCheckInVisit, setActiveCheckInVisit] = useState<VisitSchedule | null>(null);

  // Form State for new visit
  const [newVisitForm, setNewVisitForm] = useState({
    customerId: customers[0]?.id || '',
    date: '2026-09-16',
    time: '14:00',
    purpose: 'Restock Order' as VisitPurpose,
    priority: 'Sedang' as VisitPriority,
    notes: ''
  });

  // Check-in Field Execution State
  const [checkInTimerSeconds, setCheckInTimerSeconds] = useState<number>(0);
  const [checklistState, setChecklistState] = useState<VisitChecklist>({
    stockCheck: false,
    testerProvided: false,
    promoMaterialInstalled: false,
    paymentFollowUp: false
  });
  const [visitNotes, setVisitNotes] = useState('');
  const [salesNominal, setSalesNominal] = useState<number>(0);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [locationSuccess, setLocationSuccess] = useState(false);

  // Live timer for ongoing check-in
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (activeCheckInVisit && activeCheckInVisit.status === 'Sedang Berlangsung') {
      interval = setInterval(() => {
        setCheckInTimerSeconds(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [activeCheckInVisit]);

  // Filtering
  const filteredVisits = visits.filter(v => {
    const matchesSearch = 
      v.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.customerArea.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.purpose.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = filterStatus === 'Semua' || v.status === filterStatus;

    let matchesDate = true;
    if (filterDate === 'today') {
      matchesDate = v.date === '2026-09-16';
    } else if (filterDate === 'upcoming') {
      matchesDate = v.date > '2026-09-16';
    }

    return matchesSearch && matchesStatus && matchesDate;
  });

  const handleStartCheckIn = (visit: VisitSchedule) => {
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    
    const updatedVisit: VisitSchedule = {
      ...visit,
      status: 'Sedang Berlangsung',
      checkInTime: visit.checkInTime || timeStr,
      locationVerified: true
    };

    onUpdateVisit(updatedVisit);
    setActiveCheckInVisit(updatedVisit);
    setChecklistState(visit.checklist || {
      stockCheck: false,
      testerProvided: false,
      promoMaterialInstalled: false,
      paymentFollowUp: false
    });
    setVisitNotes(visit.notes || '');
    setSalesNominal(visit.salesResult || 0);
    setCheckInTimerSeconds(visit.durationMinutes ? visit.durationMinutes * 60 : 0);
  };

  const handleSimulateGPS = () => {
    setIsGettingLocation(true);
    setTimeout(() => {
      setIsGettingLocation(false);
      setLocationSuccess(true);
    }, 800);
  };

  const handleCompleteCheckOut = () => {
    if (!activeCheckInVisit) return;
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const calculatedMinutes = Math.max(15, Math.round(checkInTimerSeconds / 60) || 35);

    const completedVisit: VisitSchedule = {
      ...activeCheckInVisit,
      status: 'Selesai',
      checkOutTime: timeStr,
      durationMinutes: calculatedMinutes,
      checklist: checklistState,
      notes: visitNotes,
      salesResult: Number(salesNominal) || 0,
      photoUrl: activeCheckInVisit.photoUrl || 'https://images.unsplash.com/photo-1555421689-491a97ff2040?auto=format&fit=crop&w=600&q=80'
    };

    onUpdateVisit(completedVisit);
    setActiveCheckInVisit(null);
  };

  const handleCreateVisitSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const selectedCust = customers.find(c => c.id === newVisitForm.customerId);
    if (!selectedCust) {
      alert('Pilih toko tujuan');
      return;
    }

    onAddVisit({
      customerId: selectedCust.id,
      customerName: selectedCust.name,
      customerArea: selectedCust.area,
      date: newVisitForm.date,
      time: newVisitForm.time,
      purpose: newVisitForm.purpose,
      priority: newVisitForm.priority,
      status: 'Terjadwal',
      notes: newVisitForm.notes,
      checklist: {
        stockCheck: false,
        testerProvided: false,
        promoMaterialInstalled: false,
        paymentFollowUp: false
      }
    });

    setIsNewVisitModalOpen(false);
  };

  // Format timer HH:MM:SS
  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  return (
    <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-300">
      
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200">
              <Calendar className="w-4 h-4" />
            </span>
            <h2 className="text-lg sm:text-2xl font-bold text-slate-900">Jadwal Kunjungan Lapangan</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Penjadwalan visitasi toko mitra, verifikasi check-in GPS, audit etalase, dan closing order langsung.
          </p>
        </div>

        <button
          onClick={() => setIsNewVisitModalOpen(true)}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition-all shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Buat Jadwal Visit</span>
        </button>
      </div>

      {/* Filter Row */}
      <div className="p-3 sm:p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        
        {/* Date Filter Tabs */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl border border-slate-200/80 overflow-x-auto">
          <button
            onClick={() => setFilterDate('today')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
              filterDate === 'today'
                ? 'bg-white text-emerald-700 shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Hari Ini (16 Sep)
          </button>
          <button
            onClick={() => setFilterDate('upcoming')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
              filterDate === 'upcoming'
                ? 'bg-white text-emerald-700 shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Mendatang
          </button>
          <button
            onClick={() => setFilterDate('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
              filterDate === 'all'
                ? 'bg-white text-emerald-700 shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Semua Jadwal
          </button>
        </div>

        {/* Search & Status Filter */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 sm:flex-initial">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari toko atau agenda..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full sm:w-48 bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
            />
          </div>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="flex-1 sm:flex-initial bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-xl px-3 py-1.5 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="Semua">Semua Status</option>
            <option value="Terjadwal">Terjadwal</option>
            <option value="Sedang Berlangsung">Sedang Berlangsung</option>
            <option value="Selesai">Selesai</option>
            <option value="Dibatalkan">Dibatalkan</option>
          </select>
        </div>

      </div>

      {/* Visits List */}
      <div className="space-y-3">
        {filteredVisits.length === 0 ? (
          <div className="p-10 sm:p-12 text-center rounded-2xl bg-white border border-slate-200">
            <Calendar className="w-10 h-10 text-slate-400 mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-slate-800">Tidak ada jadwal kunjungan yang cocok</h3>
            <p className="text-xs text-slate-500 mt-1">Pilih rentang tanggal lain atau jadwalkan visitasi baru.</p>
          </div>
        ) : (
          filteredVisits.map((visit) => {
            return (
              <div
                key={visit.id}
                className={`p-4 sm:p-5 rounded-2xl border transition-all shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3.5 sm:gap-4 ${
                  visit.status === 'Sedang Berlangsung'
                    ? 'bg-amber-50/30 border-amber-300 ring-1 ring-amber-200'
                    : visit.status === 'Selesai'
                    ? 'bg-white border-slate-200 hover:border-slate-300'
                    : 'bg-white border-slate-200 hover:border-emerald-300'
                }`}
              >
                {/* Left: Time, Customer & Details */}
                <div className="flex items-start gap-3 sm:gap-4 min-w-0">
                  {/* Time Badge */}
                  <div className="flex flex-col items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-slate-50 border border-slate-200 text-center shrink-0">
                    <span className="text-[10px] text-slate-500 font-medium">{formatDateIndo(visit.date).split(' ')[0]} {formatDateIndo(visit.date).split(' ')[1]}</span>
                    <span className="text-sm sm:text-base font-extrabold text-slate-900">{visit.time}</span>
                    <span className="text-[9px] text-emerald-700 font-semibold">WIB</span>
                  </div>

                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                      <h3 className="text-base font-bold text-slate-900 truncate">{visit.customerName}</h3>
                      <span className="text-xs text-slate-500 flex items-center gap-1 truncate">
                        <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                        <span className="truncate">{visit.customerArea}</span>
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5 text-xs">
                      <span className="px-2 py-0.5 rounded-md font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {visit.purpose}
                      </span>
                      <span className={`px-2 py-0.5 rounded-md font-semibold border ${getStatusBadgeClass(visit.status)}`}>
                        {visit.status}
                      </span>
                      {visit.priority === 'Tinggi' && (
                        <span className="px-2 py-0.5 rounded-md font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                          Prioritas Tinggi
                        </span>
                      )}
                    </div>

                    {visit.notes && (
                      <p className="text-xs text-slate-600 mt-1 line-clamp-2 italic">
                        &ldquo;{visit.notes}&rdquo;
                      </p>
                    )}

                    {/* Result Info if completed */}
                    {visit.status === 'Selesai' && (
                      <div className="flex flex-wrap items-center gap-2 sm:gap-3 pt-1 text-[11px] text-slate-500">
                        <span>Durasi: <strong className="text-slate-800">{visit.durationMinutes || 45} mnt</strong></span>
                        <span>Check-in: {visit.checkInTime} - {visit.checkOutTime} WIB</span>
                        {visit.salesResult && visit.salesResult > 0 ? (
                          <span className="text-emerald-700 font-bold">
                            Closing: {formatRupiah(visit.salesResult)}
                          </span>
                        ) : (
                          <span className="text-slate-400">Maintenance</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Right: Actions (Mobile thumb accessible) */}
                <div className="flex flex-wrap items-center gap-2 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100 justify-end">
                  
                  {visit.status === 'Terjadwal' && (
                    <button
                      onClick={() => handleStartCheckIn(visit)}
                      className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition-all cursor-pointer"
                    >
                      <Play className="w-3.5 h-3.5 fill-white" />
                      <span>Check-In Lapangan</span>
                    </button>
                  )}

                  {visit.status === 'Sedang Berlangsung' && (
                    <button
                      onClick={() => {
                        setActiveCheckInVisit(visit);
                        setChecklistState(visit.checklist || {
                          stockCheck: true,
                          testerProvided: false,
                          promoMaterialInstalled: false,
                          paymentFollowUp: false
                        });
                        setVisitNotes(visit.notes || '');
                        setSalesNominal(visit.salesResult || 0);
                      }}
                      className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold shadow-xs animate-pulse transition-all cursor-pointer"
                    >
                      <StopCircle className="w-4 h-4" />
                      <span>Lanjutkan Check-Out ({formatTimer(checkInTimerSeconds)})</span>
                    </button>
                  )}

                  {visit.status === 'Selesai' && (
                    <button
                      onClick={() => onOpenSaleForVisit(visit)}
                      className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-emerald-700 text-xs font-semibold border border-slate-200 transition-colors cursor-pointer"
                    >
                      <ShoppingBag className="w-3.5 h-3.5" />
                      <span>Input Nota Penjualan</span>
                    </button>
                  )}

                </div>

              </div>
            );
          })
        )}
      </div>

      {/* MODAL: Form Jadwal Kunjungan Baru */}
      {isNewVisitModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="relative w-full max-w-lg bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            
            <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-slate-200 bg-slate-50/90">
              <h3 className="text-base font-bold text-slate-900">Buat Jadwal Kunjungan Toko</h3>
              <button
                onClick={() => setIsNewVisitModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200/60 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateVisitSubmit} className="p-5 sm:p-6 space-y-4 overflow-y-auto">
              
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Pilih Mitra Toko Tujuan *
                </label>
                <select
                  required
                  value={newVisitForm.customerId}
                  onChange={(e) => setNewVisitForm({ ...newVisitForm, customerId: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500"
                >
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.area}) - {c.tier}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Tanggal Kunjungan *
                  </label>
                  <input
                    type="date"
                    required
                    value={newVisitForm.date}
                    onChange={(e) => setNewVisitForm({ ...newVisitForm, date: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Jam Rencana Tiba (WIB) *
                  </label>
                  <input
                    type="time"
                    required
                    value={newVisitForm.time}
                    onChange={(e) => setNewVisitForm({ ...newVisitForm, time: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Tujuan Kunjungan
                  </label>
                  <select
                    value={newVisitForm.purpose}
                    onChange={(e) => setNewVisitForm({ ...newVisitForm, purpose: e.target.value as VisitPurpose })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="Restock Order">Restock Order</option>
                    <option value="Pengenalan Varian Baru">Pengenalan Varian Baru</option>
                    <option value="Penagihan Piutang">Penagihan Piutang</option>
                    <option value="Display & Merchandising">Display & Merchandising</option>
                    <option value="Follow-up Rutin">Follow-up Rutin</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Tingkat Prioritas
                  </label>
                  <select
                    value={newVisitForm.priority}
                    onChange={(e) => setNewVisitForm({ ...newVisitForm, priority: e.target.value as VisitPriority })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="Tinggi">Tinggi (Mendesak)</option>
                    <option value="Sedang">Sedang (Rutin)</option>
                    <option value="Rendah">Rendah (Fleksibel)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Catatan / Agenda Khusus Kunjungan
                </label>
                <textarea
                  rows={2}
                  placeholder="misal: Bawa tester varian PODA Frost Mint dan brosur promo toko baru..."
                  value={newVisitForm.notes}
                  onChange={(e) => setNewVisitForm({ ...newVisitForm, notes: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500"
                ></textarea>
              </div>

              <div className="pt-4 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsNewVisitModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                >
                  Jadwalkan Kunjungan
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* MODAL: Field Check-In Execution Modal */}
      {activeCheckInVisit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="relative w-full max-w-xl bg-white border border-amber-300 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh]">
            
            {/* Header with timer */}
            <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-slate-200 bg-amber-50/80">
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-2 rounded-xl bg-amber-100 text-amber-800 border border-amber-200 animate-pulse shrink-0">
                  <Navigation className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-base font-bold text-slate-900 truncate">
                    Kunjungan: {activeCheckInVisit.customerName}
                  </h3>
                  <p className="text-xs text-slate-500 truncate">
                    {activeCheckInVisit.customerArea} • Check-in: {activeCheckInVisit.checkInTime} WIB
                  </p>
                </div>
              </div>

              <div className="text-right shrink-0">
                <span className="text-[10px] text-slate-500 block uppercase font-medium">Durasi</span>
                <span className="text-base font-mono font-extrabold text-amber-700">
                  {formatTimer(checkInTimerSeconds)}
                </span>
              </div>
            </div>

            <div className="p-5 sm:p-6 space-y-4 overflow-y-auto text-xs">
              
              {/* GPS Geolocation Verification Box */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-semibold text-slate-900 block">Radius Lokasi Toko</span>
                    <span className="text-[11px] text-slate-500">
                      {locationSuccess || activeCheckInVisit.locationVerified 
                        ? 'Koordinat GPS terverifikasi (< 50 meter dari gerai)' 
                        : 'Verifikasi posisi Anda di lokasi toko'}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleSimulateGPS}
                  disabled={isGettingLocation || locationSuccess}
                  className="px-3 py-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-semibold disabled:opacity-50 transition-colors shrink-0 cursor-pointer"
                >
                  {isGettingLocation ? 'Memindai...' : locationSuccess ? 'Terverifikasi ✓' : 'Verifikasi GPS'}
                </button>
              </div>

              {/* Visit Checklist */}
              <div>
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                  <FileCheck className="w-4 h-4 text-emerald-600" />
                  Audit Checklist Kunjungan Lapangan
                </h4>

                <div className="space-y-2">
                  <label className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200 hover:bg-slate-100 transition-colors cursor-pointer">
                    <input
                      type="checkbox"
                      checked={checklistState.stockCheck}
                      onChange={(e) => setChecklistState({ ...checklistState, stockCheck: e.target.checked })}
                      className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                    />
                    <div className="flex-1">
                      <span className="font-semibold text-slate-800 block">Cek Ketersediaan Stok Etalase PODA</span>
                      <span className="text-[11px] text-slate-500">Pastikan varian Saltnic, Freebase, dan Pods Friendly tercukupi</span>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200 hover:bg-slate-100 transition-colors cursor-pointer">
                    <input
                      type="checkbox"
                      checked={checklistState.testerProvided}
                      onChange={(e) => setChecklistState({ ...checklistState, testerProvided: e.target.checked })}
                      className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                    />
                    <div className="flex-1">
                      <span className="font-semibold text-slate-800 block">Pemberian Tester & Sampling Pengunjung</span>
                      <span className="text-[11px] text-slate-500">Edukasi barista toko tentang citarasa liquid PODA edisi terbaru</span>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200 hover:bg-slate-100 transition-colors cursor-pointer">
                    <input
                      type="checkbox"
                      checked={checklistState.promoMaterialInstalled}
                      onChange={(e) => setChecklistState({ ...checklistState, promoMaterialInstalled: e.target.checked })}
                      className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                    />
                    <div className="flex-1">
                      <span className="font-semibold text-slate-800 block">Pemasangan Banner / Display Akrilik Promosi</span>
                      <span className="text-[11px] text-slate-500">Pastikan materi promosi terlihat jelas oleh pengunjung gerai</span>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200 hover:bg-slate-100 transition-colors cursor-pointer">
                    <input
                      type="checkbox"
                      checked={checklistState.paymentFollowUp}
                      onChange={(e) => setChecklistState({ ...checklistState, paymentFollowUp: e.target.checked })}
                      className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                    />
                    <div className="flex-1">
                      <span className="font-semibold text-slate-800 block">Follow-up Tagihan & Konfirmasi Piutang</span>
                      <span className="text-[11px] text-slate-500">Verifikasi status pembayaran invoice tempo terdahulu</span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Sales Achievement in this visit */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nominal Penjualan Berhasil Dihasilkan Saat Kunjungan (Rp)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="100000"
                    min="0"
                    value={salesNominal}
                    onChange={(e) => setSalesNominal(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-emerald-700 font-bold focus:bg-white focus:ring-2 focus:ring-emerald-500"
                    placeholder="misal: 4500000"
                  />
                </div>
                <span className="text-[11px] text-slate-500 mt-1 block">
                  Kosongkan (0) jika kunjungan hanya bersifat audit/maintenance tanpa transaksi langsung.
                </span>
              </div>

              {/* Notes from visit */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Catatan Hasil Kunjungan & Kesan Toko
                </label>
                <textarea
                  rows={2}
                  value={visitNotes}
                  onChange={(e) => setVisitNotes(e.target.value)}
                  placeholder="Tuliskan respon barista, feedback rasa liquid, atau permintaan restock..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500"
                ></textarea>
              </div>

              {/* Photo Evidence Simulation */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Camera className="w-4 h-4 text-slate-500" />
                  <div>
                    <span className="font-semibold text-slate-800 block">Foto Bukti Kunjungan & Display Toko</span>
                    <span className="text-[11px] text-slate-500">Lampiran bukti fisik keberadaan di toko mitra</span>
                  </div>
                </div>
                <span className="text-[11px] font-semibold text-emerald-700">
                  Foto Terlampir ✓
                </span>
              </div>

            </div>

            {/* Modal Actions */}
            <div className="px-5 sm:px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => setActiveCheckInVisit(null)}
                className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
              >
                Simpan Draft
              </button>

              <button
                type="button"
                onClick={handleCompleteCheckOut}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Selesaikan & Check-Out</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
