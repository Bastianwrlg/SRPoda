import React, { useState, useRef } from 'react';
import { 
  UploadCloud, 
  FileSpreadsheet, 
  Download, 
  CheckCircle2, 
  AlertTriangle, 
  X, 
  ArrowRight, 
  Layers, 
  Plus, 
  Building2, 
  Phone,
  MapPin,
  RefreshCw
} from 'lucide-react';
import { Customer } from '../types';
import { 
  parseExcelFile, 
  mapRowsToCustomers, 
  ParsedCustomerRow, 
  downloadCustomerTemplateExcel 
} from '../utils/excelHelper';
import { formatRupiah } from '../utils/formatters';

export type CustomerImportMode = 'merge' | 'append_only';

interface ImportCustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  existingCustomers: Customer[];
  onApplyImport: (customersToSave: Customer[], mode: CustomerImportMode, summaryText: string) => void;
}

export const ImportCustomerModal: React.FC<ImportCustomerModalProps> = ({
  isOpen,
  onClose,
  existingCustomers,
  onApplyImport
}) => {
  const [importMode, setImportMode] = useState<CustomerImportMode>('merge');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<'input' | 'preview'>('input');
  const [parsedRows, setParsedRows] = useState<ParsedCustomerRow[]>([]);
  const [selectedRowIndices, setSelectedRowIndices] = useState<Set<number>>(new Set());
  const [isProcessing, setIsProcessing] = useState(false);
  const [parseError, setParseError] = useState('');

  if (!isOpen) return null;

  const handleFileChange = async (file: File) => {
    setSelectedFile(file);
    setParseError('');
    setIsProcessing(true);

    try {
      const rows = await parseExcelFile(file);
      if (rows.length < 2) {
        setParseError('File Excel tidak memiliki baris data atau kosong.');
        setIsProcessing(false);
        return;
      }

      const mapped = mapRowsToCustomers(rows, existingCustomers);
      if (mapped.length === 0) {
        setParseError('Tidak ada baris data toko mitra yang valid ditemukan dalam file Excel.');
        setIsProcessing(false);
        return;
      }

      setParsedRows(mapped);
      // Select all rows by default
      setSelectedRowIndices(new Set(mapped.map((_, idx) => idx)));
      setStep('preview');
    } catch (err: any) {
      setParseError(err?.message || 'Gagal membaca format file Excel (.xlsx / .xls).');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      handleFileChange(file);
    }
  };

  const toggleSelectRow = (index: number) => {
    const next = new Set(selectedRowIndices);
    if (next.has(index)) {
      next.delete(index);
    } else {
      next.add(index);
    }
    setSelectedRowIndices(next);
  };

  const toggleSelectAll = () => {
    if (selectedRowIndices.size === parsedRows.length) {
      setSelectedRowIndices(new Set());
    } else {
      setSelectedRowIndices(new Set(parsedRows.map((_, i) => i)));
    }
  };

  const handleSaveImport = () => {
    const validRowsToImport = parsedRows.filter((_, idx) => selectedRowIndices.has(idx));
    if (validRowsToImport.length === 0) {
      alert('Pilih setidaknya 1 baris data toko untuk diimpor.');
      return;
    }

    const customersToSave: Customer[] = validRowsToImport.map((row, index) => {
      const existing = existingCustomers.find(c => 
        (row.id && c.id === row.id) || 
        c.name.toLowerCase() === row.name.toLowerCase() ||
        c.phone.replace(/[^0-9]/g, '') === row.phone.replace(/[^0-9]/g, '')
      );

      const generatedId = existing ? existing.id : (row.id || `TK-MTR-${Date.now().toString().slice(-4)}${index}`);

      return {
        id: generatedId,
        name: row.name,
        ownerName: row.ownerName,
        phone: row.phone,
        email: row.email || (existing?.email || ''),
        address: row.address || (existing?.address || 'Alamat Belum Terdata'),
        area: row.area || (existing?.area || 'Jakarta Pusat'),
        tier: row.tier,
        status: row.status,
        creditLimit: row.creditLimit || (existing?.creditLimit || 15000000),
        currentDebt: existing ? existing.currentDebt : row.currentDebt,
        totalOrdersCount: existing ? existing.totalOrdersCount : 0,
        totalRevenue: existing ? existing.totalRevenue : 0,
        lastVisitDate: existing ? existing.lastVisitDate : new Date().toISOString().split('T')[0],
        notes: row.notes || (existing?.notes || ''),
        coordinates: existing?.coordinates || {
          lat: -6.2088 + (Math.random() - 0.5) * 0.05,
          lng: 106.8456 + (Math.random() - 0.5) * 0.05
        }
      };
    });

    const summary = `${validRowsToImport.length} data toko mitra berhasil diimpor ke sistem.`;
    onApplyImport(customersToSave, importMode, summary);
    handleReset();
    onClose();
  };

  const handleReset = () => {
    setStep('input');
    setSelectedFile(null);
    setParsedRows([]);
    setSelectedRowIndices(new Set());
    setParseError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const totalValid = parsedRows.filter(r => r.validationErrors.length === 0).length;
  const totalWarning = parsedRows.filter(r => r.validationErrors.length > 0).length;
  const totalExisting = parsedRows.filter(r => r.isExisting).length;
  const totalNew = parsedRows.length - totalExisting;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-slate-900">
                  Import Data Toko Mitra (Excel .XLSX / .XLS)
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                  XLS Ready
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Unggah spreadsheet Excel berisi daftar outlet ritel, distributor, dan nomor kontak PIC.
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              handleReset();
              onClose();
            }}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1">
          {step === 'input' ? (
            <div className="space-y-6">
              
              {/* Template Download Card */}
              <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 mt-0.5">
                    <Download className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-emerald-950">
                      Gunakan Template Resmi Excel (.xlsx)
                    </h4>
                    <p className="text-[11px] text-emerald-800/80 mt-0.5">
                      Kolom sudah disesuaikan: Kode Toko, Nama Outlet, Pemilik/PIC, No. Telp, Alamat, Wilayah, Tier, Status, Plafon Kredit.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => downloadCustomerTemplateExcel()}
                  className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-emerald-300 text-emerald-800 text-xs font-semibold shadow-xs hover:bg-emerald-100 transition-colors shrink-0 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Unduh Template Toko (.xlsx)</span>
                </button>
              </div>

              {/* Upload Drop Zone */}
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx, .xls, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleFileChange(e.target.files[0]);
                    }
                  }}
                />

                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-8 sm:p-10 text-center transition-all cursor-pointer ${
                    isDragging
                      ? 'border-emerald-500 bg-emerald-50/50 scale-[0.99]'
                      : 'border-slate-300 hover:border-emerald-400 bg-slate-50/50 hover:bg-slate-50'
                  }`}
                >
                  <div className="w-14 h-14 mx-auto rounded-2xl bg-white border border-slate-200 text-emerald-600 flex items-center justify-center shadow-xs mb-3">
                    <UploadCloud className="w-7 h-7" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-800">
                    Pilih File Excel (.xlsx / .xls) Toko Mitra
                  </h4>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                    Tarik dan lepaskan file Excel Anda ke sini, atau klik untuk memilih file dari komputer Anda.
                  </p>
                  <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-100/70 text-emerald-800 text-xs font-medium">
                    <FileSpreadsheet className="w-4 h-4" />
                    <span>Mendukung format Microsoft Excel .xlsx dan .xls</span>
                  </div>
                </div>

                {isProcessing && (
                  <div className="mt-4 flex items-center justify-center gap-2 text-xs text-slate-600">
                    <RefreshCw className="w-4 h-4 animate-spin text-emerald-600" />
                    <span>Menganalisis lembar kerja Excel...</span>
                  </div>
                )}

                {parseError && (
                  <div className="mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500" />
                    <span>{parseError}</span>
                  </div>
                )}
              </div>

              {/* Mode Selection */}
              <div className="pt-4 border-t border-slate-200">
                <label className="text-xs font-bold text-slate-700 block mb-2">
                  Metode Penggabungan Data:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div
                    onClick={() => setImportMode('merge')}
                    className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all ${
                      importMode === 'merge'
                        ? 'border-emerald-500 bg-emerald-50/50 ring-1 ring-emerald-500'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Layers className="w-4 h-4 text-emerald-600" />
                      <span className="text-xs font-bold text-slate-900">Perbarui & Tambah (Rekomendasi)</span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Memperbarui data jika nama/kode toko sudah ada, dan menambahkan toko baru yang belum tercatat.
                    </p>
                  </div>

                  <div
                    onClick={() => setImportMode('append_only')}
                    className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all ${
                      importMode === 'append_only'
                        ? 'border-emerald-500 bg-emerald-50/50 ring-1 ring-emerald-500'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Plus className="w-4 h-4 text-emerald-600" />
                      <span className="text-xs font-bold text-slate-900">Hanya Tambah Toko Baru</span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Hanya menambahkan baris data toko yang belum pernah terdaftar sebelumnya.
                    </p>
                  </div>
                </div>
              </div>

            </div>
          ) : (
            /* Preview Step */
            <div className="space-y-4">
              
              {/* Summary Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[11px] text-slate-500 block">Total Baris Excel</span>
                  <span className="text-lg font-bold text-slate-900">{parsedRows.length} Toko</span>
                </div>
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200">
                  <span className="text-[11px] text-emerald-700 block">Toko Baru</span>
                  <span className="text-lg font-bold text-emerald-800">{totalNew} Toko</span>
                </div>
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200">
                  <span className="text-[11px] text-amber-700 block">Toko Sudah Terdaftar</span>
                  <span className="text-lg font-bold text-amber-800">{totalExisting} Toko</span>
                </div>
                <div className="p-3 rounded-xl bg-blue-50 border border-blue-200">
                  <span className="text-[11px] text-blue-700 block">Siap Diimpor</span>
                  <span className="text-lg font-bold text-blue-800">{selectedRowIndices.size} Toko</span>
                </div>
              </div>

              {/* Table Preview */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <div className="p-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={toggleSelectAll}
                      className="font-medium text-emerald-700 hover:text-emerald-800 cursor-pointer"
                    >
                      {selectedRowIndices.size === parsedRows.length ? 'Batalkan Semua' : 'Pilih Semua'}
                    </button>
                    <span className="text-slate-400">•</span>
                    <span className="text-slate-600">
                      Terpilih: <strong>{selectedRowIndices.size}</strong> dari {parsedRows.length} baris
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-500">File: {selectedFile?.name}</span>
                </div>

                <div className="max-h-72 overflow-y-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead className="bg-slate-100 text-slate-700 sticky top-0 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="p-2.5 w-10 text-center">Pilih</th>
                        <th className="p-2.5">Nama Toko & PIC</th>
                        <th className="p-2.5">Kontak & Area</th>
                        <th className="p-2.5">Kategori / Tier</th>
                        <th className="p-2.5 text-right">Plafon Kredit</th>
                        <th className="p-2.5 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {parsedRows.map((row, idx) => {
                        const isSelected = selectedRowIndices.has(idx);
                        return (
                          <tr
                            key={idx}
                            onClick={() => toggleSelectRow(idx)}
                            className={`cursor-pointer transition-colors ${
                              isSelected ? 'bg-emerald-50/40 hover:bg-emerald-50/70' : 'hover:bg-slate-50 opacity-60'
                            }`}
                          >
                            <td className="p-2.5 text-center" onClick={(e) => e.stopPropagation()}>
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => toggleSelectRow(idx)}
                                className="rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                              />
                            </td>
                            <td className="p-2.5">
                              <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                                <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                <span>{row.name}</span>
                              </div>
                              <div className="text-[11px] text-slate-500">PIC: {row.ownerName}</div>
                            </td>
                            <td className="p-2.5">
                              <div className="flex items-center gap-1 text-slate-700">
                                <Phone className="w-3 h-3 text-slate-400" />
                                <span>{row.phone}</span>
                              </div>
                              <div className="text-[11px] text-slate-500 flex items-center gap-1">
                                <MapPin className="w-3 h-3 text-slate-400" />
                                <span>{row.area}</span>
                              </div>
                            </td>
                            <td className="p-2.5">
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                                {row.tier}
                              </span>
                            </td>
                            <td className="p-2.5 text-right font-medium text-slate-900">
                              {formatRupiah(row.creditLimit)}
                            </td>
                            <td className="p-2.5 text-center">
                              {row.isExisting ? (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                                  Update
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                  Baru
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50/70 flex items-center justify-between">
          {step === 'preview' ? (
            <button
              type="button"
              onClick={handleReset}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-200/60 transition-colors cursor-pointer"
            >
              Ganti File Excel
            </button>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-200/60 transition-colors cursor-pointer"
            >
              Batal
            </button>
          )}

          {step === 'preview' && (
            <button
              type="button"
              onClick={handleSaveImport}
              disabled={selectedRowIndices.size === 0}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Simpan & Terapkan Data Toko ({selectedRowIndices.size})</span>
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
