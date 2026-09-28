import React, { useState, useRef } from 'react';
import { 
  UploadCloud, 
  FileText, 
  Download, 
  CheckCircle2, 
  AlertTriangle, 
  X, 
  ArrowRight, 
  FileSpreadsheet, 
  Clipboard, 
  RefreshCw,
  Plus,
  Layers,
  HelpCircle
} from 'lucide-react';
import { ProductLiquid } from '../types';
import { 
  parseExcelFile, 
  mapRowsToProducts, 
  ParsedProductRow, 
  downloadProductTemplateExcel 
} from '../utils/excelHelper';
import { parseCSVText } from '../utils/csvHelper';
import { formatRupiah, formatNumber } from '../utils/formatters';

export type ImportMode = 'merge' | 'stock_only' | 'replace';

interface ImportStockModalProps {
  isOpen: boolean;
  onClose: () => void;
  existingProducts: ProductLiquid[];
  onApplyImport: (productsToSave: ProductLiquid[], mode: ImportMode, summaryText: string) => void;
}

export const ImportStockModal: React.FC<ImportStockModalProps> = ({
  isOpen,
  onClose,
  existingProducts,
  onApplyImport
}) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'paste'>('upload');
  const [importMode, setImportMode] = useState<ImportMode>('merge');
  
  // File upload state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [pastedText, setPastedText] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Parsing & Preview state
  const [step, setStep] = useState<'input' | 'preview'>('input');
  const [parsedRows, setParsedRows] = useState<ParsedProductRow[]>([]);
  const [selectedRowIndices, setSelectedRowIndices] = useState<Set<number>>(new Set());
  const [isProcessing, setIsProcessing] = useState(false);
  const [parseError, setParseError] = useState('');

  if (!isOpen) return null;

  const handleFileChange = async (file: File) => {
    setSelectedFile(file);
    setParseError('');
    setIsProcessing(true);

    try {
      // Check if file is excel
      const isExcel = file.name.endsWith('.xlsx') || file.name.endsWith('.xls');
      let rawRows: string[][] = [];

      if (isExcel) {
        rawRows = await parseExcelFile(file);
      } else {
        // Plain text / fallback
        const text = await file.text();
        rawRows = parseCSVText(text);
      }

      if (rawRows.length < 2) {
        setParseError('Data file tidak memiliki baris data atau format kolom tidak sesuai.');
        setIsProcessing(false);
        return;
      }

      const mapped = mapRowsToProducts(rawRows, existingProducts);
      if (mapped.length === 0) {
        setParseError('Tidak ada baris data produk yang valid ditemukan dalam file.');
        setIsProcessing(false);
        return;
      }

      setParsedRows(mapped);
      // Select all rows by default
      setSelectedRowIndices(new Set(mapped.map((_, idx) => idx)));
      setStep('preview');
    } catch (err: any) {
      setParseError(err?.message || 'Gagal membaca isi file Excel.');
    } finally {
      setIsProcessing(false);
    }
  };

  const processRawContent = (rawText: string) => {
    try {
      const rawRows = parseCSVText(rawText);
      if (rawRows.length < 2) {
        setParseError('Data tidak memiliki baris data atau format kolom tidak sesuai.');
        return;
      }

      const mapped = mapRowsToProducts(rawRows, existingProducts);
      if (mapped.length === 0) {
        setParseError('Tidak ada baris data produk yang valid ditemukan.');
        return;
      }

      setParsedRows(mapped);
      // Select all rows by default
      setSelectedRowIndices(new Set(mapped.map((_, idx) => idx)));
      setStep('preview');
    } catch (err: any) {
      setParseError(err?.message || 'Terjadi kesalahan saat mengurai isi data.');
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
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleParsePastedText = () => {
    if (!pastedText.trim()) {
      setParseError('Silakan tempel teks format CSV / TSV terlebih dahulu.');
      return;
    }
    processRawContent(pastedText);
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
      setSelectedRowIndices(new Set(parsedRows.map((_, idx) => idx)));
    }
  };

  const handleExecuteImport = () => {
    const rowsToApply = parsedRows.filter((_, idx) => selectedRowIndices.has(idx));
    if (rowsToApply.length === 0) {
      alert('Pilih minimal satu baris produk untuk diimpor.');
      return;
    }

    setIsProcessing(true);

    setTimeout(() => {
      // Build final products list based on importMode
      let finalProducts: ProductLiquid[] = [];
      const badgeColors = [
        'from-cyan-500 to-blue-600',
        'from-amber-400 to-orange-500',
        'from-amber-600 to-yellow-700',
        'from-yellow-400 to-amber-500',
        'from-purple-500 to-fuchsia-600',
        'from-rose-500 to-red-600',
        'from-teal-500 to-emerald-600',
        'from-indigo-500 to-violet-600'
      ];

      if (importMode === 'replace') {
        finalProducts = rowsToApply.map((r, i) => ({
          id: r.id || `prod-imp-${Date.now()}-${i}`,
          name: r.name,
          variant: r.variant,
          category: r.category,
          nicotine: r.nicotine,
          volume: r.volume,
          wholesalePrice: r.wholesalePrice,
          retailPrice: r.retailPrice,
          stock: r.stock,
          badgeColor: badgeColors[i % badgeColors.length],
          description: r.description
        }));
      } else if (importMode === 'stock_only') {
        // Only update stock of existing matching products
        finalProducts = existingProducts.map(p => {
          const match = rowsToApply.find(
            r => (r.id && r.id.toLowerCase() === p.id.toLowerCase()) || 
                 (r.name.toLowerCase() === p.name.toLowerCase() && r.variant.toLowerCase() === p.variant.toLowerCase()) ||
                 (r.name.toLowerCase() === p.name.toLowerCase())
          );
          if (match) {
            return {
              ...p,
              stock: match.stock
            };
          }
          return p;
        });
      } else {
        // 'merge' mode: update existing or insert new
        const updatedExisting = [...existingProducts];
        const newItemsToAdd: ProductLiquid[] = [];

        rowsToApply.forEach((r, i) => {
          const matchIndex = updatedExisting.findIndex(
            p => (r.id && p.id.toLowerCase() === r.id.toLowerCase()) || 
                 (p.name.toLowerCase() === r.name.toLowerCase() && p.variant.toLowerCase() === r.variant.toLowerCase()) ||
                 (p.name.toLowerCase() === r.name.toLowerCase())
          );

          if (matchIndex >= 0) {
            updatedExisting[matchIndex] = {
              ...updatedExisting[matchIndex],
              stock: r.stock,
              wholesalePrice: r.wholesalePrice,
              retailPrice: r.retailPrice,
              description: r.description || updatedExisting[matchIndex].description
            };
          } else {
            newItemsToAdd.push({
              id: r.id || `prod-${Date.now()}-${i}`,
              name: r.name,
              variant: r.variant,
              category: r.category,
              nicotine: r.nicotine,
              volume: r.volume,
              wholesalePrice: r.wholesalePrice,
              retailPrice: r.retailPrice,
              stock: r.stock,
              badgeColor: badgeColors[(updatedExisting.length + i) % badgeColors.length],
              description: r.description
            });
          }
        });

        finalProducts = [...updatedExisting, ...newItemsToAdd];
      }

      const summary = `Berhasil memproses ${rowsToApply.length} data produk (${importMode === 'replace' ? 'Penggantian Total' : importMode === 'stock_only' ? 'Update Stok Opname' : 'Update & Tambah Varian Baru'})`;
      
      onApplyImport(finalProducts, importMode, summary);
      setIsProcessing(false);
      onClose();
    }, 600);
  };

  const newCount = parsedRows.filter(r => !r.isExisting).length;
  const updateCount = parsedRows.filter(r => r.isExisting).length;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-4xl w-full overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-100 border border-teal-200 text-teal-700 flex items-center justify-center shadow-xs">
              <UploadCloud className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Import Data Produk & Stok Fisik
              </h3>
              <p className="text-xs text-slate-500">
                Unggah file spreadsheet (CSV / Excel) untuk sinkronisasi katalog dan stok gudang PODA
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto flex-1 space-y-5">
          
          {step === 'input' ? (
            <>
              {/* Method Tabs & Template Download */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setActiveTab('upload')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      activeTab === 'upload'
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5 text-teal-600" />
                    <span>Upload File Excel (.xlsx / .xls)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('paste')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      activeTab === 'paste'
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Clipboard className="w-3.5 h-3.5 text-teal-600" />
                    <span>Tempel Teks Spreadsheet</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => downloadProductTemplateExcel()}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-teal-200 bg-teal-50 text-teal-800 text-xs font-bold hover:bg-teal-100 transition-colors shadow-xs cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-teal-700" />
                  <span>Unduh Template Excel (.xlsx)</span>
                </button>
              </div>

              {/* Import Mode Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">
                  Pilih Kebijakan & Mode Sinkronisasi:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div
                    onClick={() => setImportMode('merge')}
                    className={`p-3 rounded-xl border cursor-pointer transition-all ${
                      importMode === 'merge'
                        ? 'border-teal-500 bg-teal-50/60 ring-2 ring-teal-500/20'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-slate-900 flex items-center gap-1">
                        <RefreshCw className="w-3.5 h-3.5 text-teal-600" />
                        Update & Tambah
                      </span>
                      {importMode === 'merge' && <CheckCircle2 className="w-4 h-4 text-teal-600" />}
                    </div>
                    <p className="text-[11px] text-slate-500 leading-snug">
                      Perbarui stok & harga produk yang cocok, lalu tambahkan varian baru jika belum ada di sistem.
                    </p>
                  </div>

                  <div
                    onClick={() => setImportMode('stock_only')}
                    className={`p-3 rounded-xl border cursor-pointer transition-all ${
                      importMode === 'stock_only'
                        ? 'border-teal-500 bg-teal-50/60 ring-2 ring-teal-500/20'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-slate-900 flex items-center gap-1">
                        <Layers className="w-3.5 h-3.5 text-teal-600" />
                        Hanya Update Stok
                      </span>
                      {importMode === 'stock_only' && <CheckCircle2 className="w-4 h-4 text-teal-600" />}
                    </div>
                    <p className="text-[11px] text-slate-500 leading-snug">
                      Hanya perbarui angka stok fisik produk (Stock Opname). Data produk baru akan diabaikan.
                    </p>
                  </div>

                  <div
                    onClick={() => setImportMode('replace')}
                    className={`p-3 rounded-xl border cursor-pointer transition-all ${
                      importMode === 'replace'
                        ? 'border-rose-500 bg-rose-50/60 ring-2 ring-rose-500/20'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-slate-900 flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                        Timpa Semua Data
                      </span>
                      {importMode === 'replace' && <CheckCircle2 className="w-4 h-4 text-rose-600" />}
                    </div>
                    <p className="text-[11px] text-slate-500 leading-snug">
                      Hapus seluruh katalog produk lama dan ganti dengan data baru yang ada di file impor.
                    </p>
                  </div>
                </div>
              </div>

              {/* Input Area (Upload or Paste) */}
              {activeTab === 'upload' ? (
                <div>
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
                      isDragging
                        ? 'border-teal-500 bg-teal-50/50 scale-[0.99]'
                        : selectedFile
                        ? 'border-emerald-400 bg-emerald-50/20'
                        : 'border-slate-300 hover:border-teal-400 hover:bg-slate-50/60'
                    }`}
                  >
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
                    <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center mx-auto mb-3">
                      <UploadCloud className="w-6 h-6" />
                    </div>
                    {selectedFile ? (
                      <div>
                        <p className="text-xs font-bold text-emerald-800">
                          File Terpilih: {selectedFile.name}
                        </p>
                        <p className="text-[11px] text-slate-500 mt-1">
                          Ukuran: {(selectedFile.size / 1024).toFixed(1)} KB. Klik untuk mengganti file.
                        </p>
                      </div>
                    ) : (
                      <div>
                        <p className="text-xs font-bold text-slate-800">
                          Tarik dan lepas file Excel (.xlsx / .xls) di sini, atau <span className="text-teal-600 underline">Pilih Dokumen</span>
                        </p>
                        <p className="text-[11px] text-slate-400 mt-1">
                          Mendukung format file Microsoft Excel (.xlsx / .xls)
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Tempel Data Tabel Spreadsheet (Baris & Kolom):
                  </label>
                  <textarea
                    rows={6}
                    value={pastedText}
                    onChange={(e) => setPastedText(e.target.value)}
                    placeholder="Kode,Nama Produk,Varian,Kategori,Nikotin,Volume,Harga Grosir,Harga Retail,Stok,Deskripsi&#10;prod-1,PODA Frost Mint,Menthol,Saltnic,30mg,30ml,85000,115000,450,Dingin segar"
                    className="w-full p-3 rounded-xl border border-slate-300 text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white bg-slate-50"
                  />
                  <div className="flex justify-end mt-2">
                    <button
                      type="button"
                      onClick={handleParsePastedText}
                      className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-xs transition-colors flex items-center gap-1.5"
                    >
                      <span>Pratinjau Data Teks</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}

              {/* Error Box */}
              {parseError && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2 animate-in fade-in">
                  <AlertTriangle className="w-4 h-4 text-rose-600 mt-0.5 shrink-0" />
                  <span className="leading-relaxed">{parseError}</span>
                </div>
              )}

              {/* Guideline Footnote */}
              <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/80 text-[11px] text-slate-600 space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-slate-800">
                  <HelpCircle className="w-3.5 h-3.5 text-teal-600" />
                  <span>Petunjuk Kolom Import PODA:</span>
                </div>
                <p>
                  Kolom yang dikenali secara otomatis: <strong>Nama Produk</strong>, <strong>Varian</strong>, <strong>Kategori</strong> (Saltnic / Freebase / Pods Friendly), <strong>Nikotin</strong>, <strong>Volume</strong>, <strong>Harga Grosir</strong>, <strong>Harga Retail</strong>, dan <strong>Stok</strong>.
                </p>
              </div>
            </>
          ) : (
            /* STEP 2: PREVIEW & CONFIRMATION */
            <div className="space-y-4">
              {/* Summary Badges */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="p-2.5 rounded-xl bg-slate-100 border border-slate-200 text-center">
                  <span className="text-[10px] text-slate-500 font-medium block">Total Baris Ditemukan</span>
                  <span className="text-base font-bold text-slate-900">{parsedRows.length} Produk</span>
                </div>
                <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-center">
                  <span className="text-[10px] text-emerald-700 font-medium block">Akan Diproses</span>
                  <span className="text-base font-bold text-emerald-800">{selectedRowIndices.size} Dipilih</span>
                </div>
                <div className="p-2.5 rounded-xl bg-sky-50 border border-sky-200 text-center">
                  <span className="text-[10px] text-sky-700 font-medium block">Produk Baru Ditambah</span>
                  <span className="text-base font-bold text-sky-800">+{newCount} Varian</span>
                </div>
                <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-center">
                  <span className="text-[10px] text-amber-700 font-medium block">Update Stok/Harga</span>
                  <span className="text-base font-bold text-amber-800">{updateCount} Produk</span>
                </div>
              </div>

              {/* Action Toolbar */}
              <div className="flex items-center justify-between text-xs">
                <button
                  type="button"
                  onClick={toggleSelectAll}
                  className="font-semibold text-teal-700 hover:text-teal-900 cursor-pointer"
                >
                  {selectedRowIndices.size === parsedRows.length ? 'Batalkan Semua Pilihan' : 'Pilih Semua Baris'}
                </button>
                <span className="text-slate-500">
                  Mode: <strong className="text-slate-800 uppercase">{importMode}</strong>
                </span>
              </div>

              {/* Preview Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden max-h-72 overflow-y-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-100 text-slate-700 sticky top-0 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="p-2.5 w-10 text-center">Pilih</th>
                      <th className="p-2.5">Status</th>
                      <th className="p-2.5">Nama Produk & Varian</th>
                      <th className="p-2.5">Kategori</th>
                      <th className="p-2.5">Nikotin/Vol</th>
                      <th className="p-2.5 text-right">Harga Grosir</th>
                      <th className="p-2.5 text-right">Harga Retail</th>
                      <th className="p-2.5 text-center">Stok Fisik</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {parsedRows.map((row, idx) => {
                      const isSelected = selectedRowIndices.has(idx);
                      return (
                        <tr 
                          key={idx} 
                          className={`hover:bg-slate-50 transition-colors ${
                            !isSelected ? 'opacity-40 bg-slate-50/50' : ''
                          }`}
                        >
                          <td className="p-2.5 text-center">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleSelectRow(idx)}
                              className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500 border-slate-300"
                            />
                          </td>
                          <td className="p-2.5 whitespace-nowrap">
                            {row.isExisting ? (
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                                Update Data
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                                Produk Baru
                              </span>
                            )}
                          </td>
                          <td className="p-2.5 font-medium text-slate-900">
                            <div>{row.name}</div>
                            <div className="text-[11px] text-slate-500">{row.variant}</div>
                          </td>
                          <td className="p-2.5">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700">
                              {row.category}
                            </span>
                          </td>
                          <td className="p-2.5 text-slate-600 whitespace-nowrap">
                            {row.nicotine} • {row.volume}
                          </td>
                          <td className="p-2.5 text-right font-medium text-slate-700">
                            {formatRupiah(row.wholesalePrice)}
                          </td>
                          <td className="p-2.5 text-right font-medium text-slate-900">
                            {formatRupiah(row.retailPrice)}
                          </td>
                          <td className="p-2.5 text-center font-bold text-emerald-700 bg-emerald-50/40">
                            {formatNumber(row.stock)} botol
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3.5 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          {step === 'preview' ? (
            <button
              type="button"
              onClick={() => setStep('input')}
              disabled={isProcessing}
              className="px-4 py-2 rounded-xl border border-slate-300 bg-white text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-colors"
            >
              Kembali ke Upload
            </button>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-300 bg-white text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-colors"
            >
              Batal
            </button>
          )}

          {step === 'preview' && (
            <button
              type="button"
              disabled={selectedRowIndices.size === 0 || isProcessing}
              onClick={handleExecuteImport}
              className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-md shadow-teal-600/20 hover:shadow-lg transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {isProcessing ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  <span>Menyimpan ke Sistem...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Konfirmasi & Import ({selectedRowIndices.size} Produk)</span>
                </>
              )}
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
