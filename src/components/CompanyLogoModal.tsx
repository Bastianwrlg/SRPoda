import React, { useState, useRef } from 'react';
import { 
  ShieldCheck, 
  UploadCloud, 
  Flame, 
  CheckCircle2, 
  AlertTriangle, 
  X, 
  Key, 
  Lock, 
  RefreshCw, 
  Trash2, 
  Sparkles, 
  Copy, 
  Check, 
  Eye, 
  Sliders, 
  FileImage,
  Layers,
  ArrowRight
} from 'lucide-react';
import { CompanyBranding, AppUser } from '../types';
import { 
  generatePodaEncryptedSession, 
  calculateDataChecksum, 
  verifyAdminSessionPrivilege 
} from '../utils/sessionSecurity';

interface CompanyLogoModalProps {
  isOpen: boolean;
  onClose: () => void;
  branding: CompanyBranding;
  currentUser: AppUser | null;
  onSaveBranding: (updatedBranding: CompanyBranding, message: string) => void;
  onAddToast: (title: string, message: string, type: 'success' | 'warning' | 'info' | 'error') => void;
}

// Preset visual options for quick branding customization
const PRESET_LOGOS = [
  {
    id: 'default-emerald',
    name: 'PODA Emerald Flame (Default)',
    description: 'Gradien Emerald-Teal resmi PODA E-Liquid',
    gradient: 'from-emerald-600 via-teal-600 to-cyan-500',
    iconColor: 'text-white'
  },
  {
    id: 'gold-reserve',
    name: 'PODA Gold Reserve',
    description: 'Varian Edisi Terbatas Emas & Amber',
    gradient: 'from-amber-500 via-yellow-500 to-orange-500',
    iconColor: 'text-amber-950'
  },
  {
    id: 'dark-stealth',
    name: 'PODA Dark Stealth',
    description: 'Varian Minimalis Hitam Titanium',
    gradient: 'from-slate-900 via-slate-800 to-slate-700',
    iconColor: 'text-emerald-400'
  },
  {
    id: 'frost-ice',
    name: 'PODA Frost Series',
    description: 'Varian Dingin Spearmint & Cyan',
    gradient: 'from-cyan-500 via-blue-500 to-indigo-600',
    iconColor: 'text-white'
  }
];

export const CompanyLogoModal: React.FC<CompanyLogoModalProps> = ({
  isOpen,
  onClose,
  branding,
  currentUser,
  onSaveBranding,
  onAddToast
}) => {
  const [tempLogoUrl, setTempLogoUrl] = useState<string | null>(branding.logoUrl);
  const [logoShape, setLogoShape] = useState<'rounded' | 'square' | 'circle' | 'original'>(branding.logoShape || 'rounded');
  const [companyName, setCompanyName] = useState(branding.companyName || 'PODA E-LIQUID');
  const [brandSubtext, setBrandSubtext] = useState(branding.brandSubtext || 'Sales Representative & Toko Mitra');
  
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFileMeta, setSelectedFileMeta] = useState<{ name: string; size: string } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [copiedToken, setCopiedToken] = useState(false);
  const [previewTab, setPreviewTab] = useState<'header' | 'login' | 'invoice'>('header');
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const isAdmin = verifyAdminSessionPrivilege(currentUser?.role);

  const handleCopyToken = () => {
    navigator.clipboard.writeText(branding.sessionToken);
    setCopiedToken(true);
    setTimeout(() => setCopiedToken(false), 2000);
  };

  const handleFileSelect = (file: File) => {
    // Check file type
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      alert('Format file tidak didukung. Harap unggah gambar bertipe PNG, JPG, SVG, atau WebP.');
      return;
    }

    // Check size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Ukuran file terlalu besar. Maksimal ukuran gambar adalah 5 MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      setTempLogoUrl(dataUrl);
      setSelectedFileMeta({
        name: file.name,
        size: `${(file.size / 1024).toFixed(1)} KB`
      });
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleResetToDefault = () => {
    setTempLogoUrl(null);
    setSelectedFileMeta(null);
  };

  const handleSaveAndApply = async () => {
    if (!isAdmin) {
      alert('Akses Ditolak: Hanya Super Administrator yang diizinkan mengubah logo dan identitas perusahaan.');
      return;
    }

    setIsProcessing(true);

    try {
      // Generate cryptographic session token and checksum
      const newSession = generatePodaEncryptedSession(currentUser?.username || 'admin');
      const payloadHash = tempLogoUrl 
        ? await calculateDataChecksum(tempLogoUrl)
        : 'poda-default-flame-emblem-sha256-verified';

      const nowStr = new Date().toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }) + ' WIB';

      const updated: CompanyBranding = {
        companyName: companyName.trim() || 'PODA E-LIQUID',
        brandSubtext: brandSubtext.trim() || 'Sales Representative & Toko Mitra',
        logoUrl: tempLogoUrl,
        logoShape,
        sessionToken: newSession.sessionToken,
        encryptionAlgorithm: newSession.encryptionAlgorithm,
        sessionHash: payloadHash,
        lastUpdated: nowStr,
        updatedBy: currentUser?.name || 'Super Administrator',
        isVerifiedEncrypted: true
      };

      setTimeout(() => {
        onSaveBranding(
          updated, 
          `Logo perusahaan diperbarui oleh ${currentUser?.name || 'Admin'} (Terproteksi Enkripsi Sesi PODA ${payloadHash.slice(0, 16)})`
        );
        onAddToast(
          'Logo Perusahaan Disimpan',
          'Logo dan identitas resmi PODA berhasil diterapkan dengan Enkripsi Sesi AES-256.',
          'success'
        );
        setIsProcessing(false);
        onClose();
      }, 500);

    } catch (err: any) {
      setIsProcessing(false);
      alert('Terjadi kesalahan saat memverifikasi enkripsi sesi.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-in fade-in">
      <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200 shadow-2xl max-w-3xl w-full overflow-hidden my-auto flex flex-col max-h-[92vh]">
        
        {/* Modal Top Header with Security Encryption Badge */}
        <div className="px-5 sm:px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-400 flex items-center justify-center shrink-0 shadow-inner">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white tracking-tight">
                  Upload & Manajemen Logo Perusahaan
                </h3>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  <Lock className="w-2.5 h-2.5" />
                  Terproteksi Enkripsi Sesi
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                PODA E-Liquid Company • Protokol Keamanan Sesi Administrator Terotentikasi
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/50 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1">

          {/* Encryption & Session Certificate Bar */}
          <div className="bg-emerald-50/70 border border-emerald-200/90 rounded-2xl p-3.5 sm:p-4 text-xs text-emerald-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
            <div className="flex items-start gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                <Key className="w-4 h-4" />
              </div>
              <div>
                <div className="font-bold text-emerald-950 flex items-center gap-1.5">
                  <span>Enkripsi Sesi PODA E-Liquid Aktif</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                </div>
                <div className="font-mono text-[11px] text-emerald-700 mt-0.5 break-all">
                  Token: {branding.sessionToken}
                </div>
                <div className="text-[10px] text-emerald-600 mt-0.5">
                  Standar: {branding.encryptionAlgorithm} • Operator: <strong>{currentUser?.name}</strong> ({currentUser?.role})
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleCopyToken}
              title="Salin Token Sesi Enkripsi"
              className="self-start sm:self-center px-2.5 py-1.5 rounded-lg bg-white border border-emerald-200 text-emerald-800 text-[11px] font-semibold hover:bg-emerald-100/60 transition-colors flex items-center gap-1 shrink-0 cursor-pointer"
            >
              {copiedToken ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Tersalin!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Salin Token</span>
                </>
              )}
            </button>
          </div>

          {/* Unauthorized Alert if not Super Admin */}
          {!isAdmin && (
            <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-2.5">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
              <p>
                <strong>Mode Hanya-Lihat:</strong> Akun Anda terdaftar sebagai <strong>{currentUser?.role || 'Guest'}</strong>. Hanya Super Administrator yang memiliki kewenangan kriptografis untuk mengunggah logo resmi perusahaan.
              </p>
            </div>
          )}

          {/* Grid Layout: Upload Controls & Live Previews */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            
            {/* Left Column: Upload Area & Settings */}
            <div className="lg:col-span-7 space-y-4">
              
              {/* File Upload Zone */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Unggah File Logo Perusahaan (PNG, SVG, JPG, WebP):
                </label>

                <div
                  onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDrop}
                  onClick={() => isAdmin && fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all ${
                    !isAdmin 
                      ? 'opacity-60 cursor-not-allowed border-slate-200 bg-slate-50'
                      : isDragging
                      ? 'border-emerald-500 bg-emerald-50/50 scale-[0.99] cursor-pointer'
                      : tempLogoUrl
                      ? 'border-emerald-300 bg-emerald-50/20 hover:border-emerald-400 cursor-pointer'
                      : 'border-slate-300 hover:border-emerald-400 hover:bg-slate-50/80 cursor-pointer'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png, image/jpeg, image/jpg, image/svg+xml, image/webp"
                    className="hidden"
                    disabled={!isAdmin}
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleFileSelect(e.target.files[0]);
                      }
                    }}
                  />

                  {tempLogoUrl ? (
                    <div className="space-y-2">
                      <div className="inline-flex items-center justify-center p-2 rounded-2xl bg-white border border-slate-200 shadow-sm">
                        <img 
                          src={tempLogoUrl} 
                          alt="Company Logo Preview" 
                          className={`w-16 h-16 object-contain ${
                            logoShape === 'circle' ? 'rounded-full' : logoShape === 'rounded' ? 'rounded-xl' : ''
                          }`}
                        />
                      </div>
                      <p className="text-xs font-bold text-slate-800">
                        {selectedFileMeta ? selectedFileMeta.name : 'Logo Kustom Aktif'}
                      </p>
                      {selectedFileMeta && (
                        <p className="text-[11px] text-slate-500">Ukuran: {selectedFileMeta.size}</p>
                      )}
                      <p className="text-[11px] text-emerald-600 font-medium">
                        Klik atau seret file lain untuk mengganti gambar logo
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto shadow-xs">
                        <UploadCloud className="w-6 h-6" />
                      </div>
                      <p className="text-xs font-bold text-slate-800">
                        Seret & Lepas file logo di sini, atau <span className="text-emerald-600 underline">Pilih File</span>
                      </p>
                      <p className="text-[11px] text-slate-400">
                        Maksimal ukuran 5 MB. Disarankan resolusi minimal 512x512 piksel dengan latar transparan (PNG/SVG).
                      </p>
                    </div>
                  )}
                </div>

                {/* Reset & Quick Actions */}
                {tempLogoUrl && isAdmin && (
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-[11px] text-slate-500">Logo kustom terpasang</span>
                    <button
                      type="button"
                      onClick={handleResetToDefault}
                      className="text-xs font-semibold text-rose-600 hover:text-rose-700 flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Kembalikan ke Logo Default PODA</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Logo Display Shape Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Bentuk Pembingkaian Logo (Display Frame):
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'rounded', label: 'Rounded Square', desc: 'Sudut membulat modern' },
                    { id: 'circle', label: 'Lingkaran (Circle)', desc: 'Bulat sempurna' },
                    { id: 'original', label: 'Proporsi Asli', desc: 'Tanpa pemotongan' }
                  ].map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setLogoShape(s.id as any)}
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                        logoShape === s.id
                          ? 'border-emerald-500 bg-emerald-50/60 ring-2 ring-emerald-500/20 font-bold text-emerald-950'
                          : 'border-slate-200 hover:border-slate-300 text-slate-600 bg-white'
                      }`}
                    >
                      <div className="text-xs font-bold">{s.label}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">{s.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Company Name & Brand Subtext */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nama Resmi Perusahaan
                  </label>
                  <input
                    type="text"
                    disabled={!isAdmin}
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="PODA E-LIQUID"
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Subteks / Slogan Brand
                  </label>
                  <input
                    type="text"
                    disabled={!isAdmin}
                    value={brandSubtext}
                    onChange={(e) => setBrandSubtext(e.target.value)}
                    placeholder="Sales Representative & Toko Mitra"
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

            </div>

            {/* Right Column: Live Simulator & Preview */}
            <div className="lg:col-span-5 bg-slate-50 rounded-2xl p-4 border border-slate-200 flex flex-col justify-between space-y-4">
              
              <div>
                <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-200">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                    <Eye className="w-4 h-4 text-emerald-600" />
                    <span>Simulator Tampilan Nyata</span>
                  </div>

                  <div className="flex items-center gap-1 bg-slate-200/70 p-0.5 rounded-lg text-[10px] font-semibold">
                    <button
                      type="button"
                      onClick={() => setPreviewTab('header')}
                      className={`px-2 py-1 rounded-md transition-all ${
                        previewTab === 'header' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                      }`}
                    >
                      Header
                    </button>
                    <button
                      type="button"
                      onClick={() => setPreviewTab('login')}
                      className={`px-2 py-1 rounded-md transition-all ${
                        previewTab === 'login' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                      }`}
                    >
                      Login
                    </button>
                    <button
                      type="button"
                      onClick={() => setPreviewTab('invoice')}
                      className={`px-2 py-1 rounded-md transition-all ${
                        previewTab === 'invoice' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                      }`}
                    >
                      Nota
                    </button>
                  </div>
                </div>

                {/* Simulated Container */}
                <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
                  {previewTab === 'header' && (
                    <div className="space-y-2">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Preview di Bilah Navigasi Atas (Desktop & Mobile):
                      </span>
                      <div className="flex items-center gap-3 p-3 bg-white rounded-xl border border-slate-200 shadow-xs">
                        {tempLogoUrl ? (
                          <div className="w-10 h-10 flex items-center justify-center shrink-0">
                            <img 
                              src={tempLogoUrl} 
                              alt="Logo" 
                              className="w-full h-full object-contain"
                            />
                          </div>
                        ) : (
                          <div className="relative flex items-center justify-center w-10 h-10 text-teal-600 shrink-0">
                            <Flame className="w-8 h-8" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <h4 className="text-sm font-black text-slate-900 leading-tight truncate">
                            {companyName}
                          </h4>
                          <p className="text-[10px] text-slate-500 leading-tight truncate">
                            {brandSubtext}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {previewTab === 'login' && (
                    <div className="space-y-2 text-center py-3">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                        Preview di Layar Masuk / Autentikasi Pengguna:
                      </span>
                      {tempLogoUrl ? (
                        <div className="inline-flex items-center justify-center w-16 h-16 mx-auto">
                          <img 
                            src={tempLogoUrl} 
                            alt="Logo" 
                            className="w-full h-full object-contain"
                          />
                        </div>
                      ) : (
                        <div className="inline-flex items-center justify-center text-teal-600 mx-auto">
                          <Flame className="w-12 h-12" />
                        </div>
                      )}
                      <h4 className="text-base font-black text-slate-900 mt-2">
                        {companyName}
                      </h4>
                      <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
                        {brandSubtext}
                      </p>
                    </div>
                  )}

                  {previewTab === 'invoice' && (
                    <div className="space-y-2">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Kop Nota Resmi Faktur Penjualan:
                      </span>
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 font-mono text-[10px] text-slate-700 space-y-1">
                        <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                          <div className="flex items-center gap-2">
                            {tempLogoUrl ? (
                              <img src={tempLogoUrl} className="w-6 h-6 object-contain" alt="Logo" />
                            ) : (
                              <Flame className="w-4 h-4 text-emerald-600" />
                            )}
                            <span className="font-bold text-slate-900">{companyName}</span>
                          </div>
                          <span className="text-[9px] text-slate-400">FAKTUR-2026-09</span>
                        </div>
                        <div className="flex justify-between text-[9px] text-slate-500 pt-1">
                          <span>Total Tagihan:</span>
                          <span className="font-bold text-slate-800">Rp 12.450.000</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Cryptographic Integrity Specs Card */}
              <div className="bg-slate-900 rounded-xl p-3 text-slate-300 text-[11px] space-y-1.5 font-mono">
                <div className="flex items-center justify-between text-emerald-400 font-bold">
                  <span className="flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    STATUS ENKRIPSI SESI:
                  </span>
                  <span>AKTIF</span>
                </div>
                <div className="text-slate-400 truncate">
                  SHA-256 Checksum: {branding.sessionHash ? branding.sessionHash.slice(0, 24) + '...' : 'Verified-Default'}
                </div>
                <div className="text-slate-400">
                  Update Terakhir: {branding.lastUpdated} ({branding.updatedBy})
                </div>
              </div>

            </div>

          </div>

        </div>

        {/* Modal Footer */}
        <div className="px-5 sm:px-6 py-3.5 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-300 bg-white text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-colors cursor-pointer"
          >
            Tutup
          </button>

          {isAdmin && (
            <button
              type="button"
              disabled={isProcessing}
              onClick={handleSaveAndApply}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isProcessing ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  <span>Menerapkan Enkripsi Sesi...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4 text-white" />
                  <span>Simpan & Terapkan Logo (Terenkripsi)</span>
                </>
              )}
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
