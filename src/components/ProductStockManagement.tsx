import React, { useState, useMemo } from 'react';
import { 
  Package, 
  UploadCloud, 
  Download, 
  Plus, 
  Search, 
  Filter, 
  Edit3, 
  Trash2, 
  CheckCircle2, 
  AlertTriangle, 
  FileSpreadsheet, 
  TrendingUp, 
  Layers, 
  SlidersHorizontal,
  ChevronDown,
  X,
  Sparkles,
  ArrowUpDown,
  History,
  Boxes,
  Minus
} from 'lucide-react';
import { ProductLiquid, LiquidCategory, AppUser } from '../types';
import { formatRupiah, formatNumber } from '../utils/formatters';
import { 
  exportProductsToExcel,
  downloadProductTemplateExcel
} from '../utils/excelHelper';
import { ImportStockModal, ImportMode } from './ImportStockModal';

interface ProductStockManagementProps {
  products: ProductLiquid[];
  currentUser: AppUser | null;
  onUpdateProducts: (updatedProducts: ProductLiquid[], actionMessage?: string) => void;
  onAddToast: (title: string, message: string, type: 'success' | 'warning' | 'info' | 'error') => void;
}

export const ProductStockManagement: React.FC<ProductStockManagementProps> = ({
  products,
  currentUser,
  onUpdateProducts,
  onAddToast
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStockStatus, setSelectedStockStatus] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'name' | 'stock_asc' | 'stock_desc' | 'price_desc'>('stock_desc');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');

  // Modal states
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isAddEditModalOpen, setIsAddEditModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductLiquid | null>(null);

  // Quick Inline Stock Adjustment modal or state
  const [adjustingStockProduct, setAdjustingStockProduct] = useState<ProductLiquid | null>(null);
  const [customStockAmount, setCustomStockAmount] = useState<string>('');

  // Form state for Add/Edit
  const [formData, setFormData] = useState<Partial<ProductLiquid>>({
    name: '',
    variant: '',
    category: 'Saltnic',
    nicotine: '30mg',
    volume: '30ml',
    wholesalePrice: 85000,
    retailPrice: 115000,
    stock: 200,
    description: '',
    badgeColor: 'from-cyan-500 to-blue-600'
  });

  // KPI Calculations
  const stats = useMemo(() => {
    const totalSKU = products.length;
    const totalPhysicalStock = products.reduce((sum, p) => sum + p.stock, 0);
    const totalWholesaleValue = products.reduce((sum, p) => sum + (p.stock * p.wholesalePrice), 0);
    const totalRetailValue = products.reduce((sum, p) => sum + (p.stock * p.retailPrice), 0);
    const lowStockCount = products.filter(p => p.stock < 150).length;
    const outOfStockCount = products.filter(p => p.stock <= 0).length;

    const saltnicCount = products.filter(p => p.category === 'Saltnic').length;
    const freebaseCount = products.filter(p => p.category === 'Freebase').length;
    const podFriendlyCount = products.filter(p => p.category === 'Pods Friendly').length;

    return {
      totalSKU,
      totalPhysicalStock,
      totalWholesaleValue,
      totalRetailValue,
      lowStockCount,
      outOfStockCount,
      saltnicCount,
      freebaseCount,
      podFriendlyCount
    };
  }, [products]);

  // Filter & Sort Logic
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      // Search
      const matchesSearch = 
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.variant.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()));

      // Category
      const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;

      // Stock Status
      let matchesStock = true;
      if (selectedStockStatus === 'safe') {
        matchesStock = p.stock >= 250;
      } else if (selectedStockStatus === 'medium') {
        matchesStock = p.stock >= 100 && p.stock < 250;
      } else if (selectedStockStatus === 'low') {
        matchesStock = p.stock < 100;
      }

      return matchesSearch && matchesCategory && matchesStock;
    }).sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'stock_asc') return a.stock - b.stock;
      if (sortBy === 'stock_desc') return b.stock - a.stock;
      if (sortBy === 'price_desc') return b.wholesalePrice - a.wholesalePrice;
      return 0;
    });
  }, [products, searchQuery, selectedCategory, selectedStockStatus, sortBy]);

  // Handle Import Apply
  const handleApplyImport = (updatedList: ProductLiquid[], mode: ImportMode, summaryText: string) => {
    onUpdateProducts(updatedList, summaryText);
    onAddToast(
      'Import Data Berhasil', 
      summaryText, 
      'success'
    );
  };

  // Quick Stock Adjustment
  const handleQuickAdjustStock = (productId: string, delta: number) => {
    const target = products.find(p => p.id === productId);
    if (!target) return;
    const newStock = Math.max(0, target.stock + delta);
    
    const updated = products.map(p => p.id === productId ? { ...p, stock: newStock } : p);
    onUpdateProducts(updated, `Penyesuaian stok ${target.name} (${delta > 0 ? `+${delta}` : delta} botol)`);
    onAddToast(
      'Stok Diperbarui', 
      `${target.name}: ${target.stock} → ${newStock} botol`, 
      'info'
    );
  };

  // Set Exact Stock from Inline Modal
  const handleSaveExactStock = () => {
    if (!adjustingStockProduct) return;
    const newStock = parseInt(customStockAmount);
    if (isNaN(newStock) || newStock < 0) {
      alert('Masukkan jumlah stok valid (angka 0 atau lebih).');
      return;
    }

    const updated = products.map(p => 
      p.id === adjustingStockProduct.id ? { ...p, stock: newStock } : p
    );
    onUpdateProducts(updated, `Stock opname manual ${adjustingStockProduct.name}: ${newStock} botol`);
    onAddToast('Stock Opname Tersimpan', `${adjustingStockProduct.name} sekarang berjumlah ${newStock} botol.`, 'success');
    setAdjustingStockProduct(null);
  };

  // Open Edit Modal
  const handleOpenEditModal = (product: ProductLiquid) => {
    setEditingProduct(product);
    setFormData({ ...product });
    setIsAddEditModalOpen(true);
  };

  // Open Add Modal
  const handleOpenAddModal = () => {
    setEditingProduct(null);
    setFormData({
      name: '',
      variant: '',
      category: 'Saltnic',
      nicotine: '30mg',
      volume: '30ml',
      wholesalePrice: 85000,
      retailPrice: 115000,
      stock: 200,
      description: '',
      badgeColor: 'from-cyan-500 to-blue-600'
    });
    setIsAddEditModalOpen(true);
  };

  // Delete Product
  const handleDeleteProduct = (productId: string) => {
    const prod = products.find(p => p.id === productId);
    if (!prod) return;
    if (window.confirm(`Hapus produk "${prod.name} - ${prod.variant}" dari katalog?`)) {
      const updated = products.filter(p => p.id !== productId);
      onUpdateProducts(updated, `Hapus produk ${prod.name}`);
      onAddToast('Produk Dihapus', `${prod.name} telah dikeluarkan dari katalog PODA.`, 'info');
    }
  };

  // Save Product (Add or Edit)
  const handleSaveProductForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.variant) {
      alert('Nama produk dan varian rasa wajib diisi!');
      return;
    }

    if (editingProduct) {
      // Edit
      const updated = products.map(p => 
        p.id === editingProduct.id ? { ...p, ...(formData as ProductLiquid) } : p
      );
      onUpdateProducts(updated, `Update produk ${formData.name}`);
      onAddToast('Produk Diperbarui', `Data ${formData.name} berhasil disimpan.`, 'success');
    } else {
      // Add
      const newProd: ProductLiquid = {
        id: `prod-${Date.now()}`,
        name: formData.name || '',
        variant: formData.variant || '',
        category: (formData.category as LiquidCategory) || 'Saltnic',
        nicotine: formData.nicotine || '30mg',
        volume: formData.volume || '30ml',
        wholesalePrice: Number(formData.wholesalePrice) || 85000,
        retailPrice: Number(formData.retailPrice) || 115000,
        stock: Number(formData.stock) || 100,
        badgeColor: formData.badgeColor || 'from-teal-500 to-emerald-600',
        description: formData.description || ''
      };
      onUpdateProducts([...products, newProd], `Tambah produk baru ${newProd.name}`);
      onAddToast('Produk Baru Ditambahkan', `${newProd.name} berhasil ditambahkan ke katalog.`, 'success');
    }

    setIsAddEditModalOpen(false);
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner & Action Header */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-teal-100 text-teal-800 border border-teal-200">
              Master Data & Gudang
            </span>
            <span className="text-xs text-slate-400">•</span>
            <span className="text-xs text-slate-500">PODA E-Liquid Inventori</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Manage Data Product & Stok
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl">
            Kelola katalog produk e-liquid, penetapan harga grosir & retail, pantau stok gudang fisik, serta export & import format Excel (.xlsx / .xls).
          </p>
        </div>

        {/* Action Button Cluster */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Import Button */}
          <button
            id="btn-import-stock"
            onClick={() => setIsImportModalOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-xs shadow-teal-600/20 hover:shadow-md transition-all cursor-pointer"
          >
            <UploadCloud className="w-4 h-4" />
            <span>Import XLS</span>
          </button>

          {/* Download Sample Template */}
          <button
            id="btn-download-template"
            onClick={() => {
              downloadProductTemplateExcel();
              onAddToast('Template Diunduh', 'Template Excel produk (.xlsx) berhasil diunduh.', 'success');
            }}
            title="Unduh contoh template spreadsheet Excel (.xlsx) siap isi"
            className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition-all cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-teal-600" />
            <span className="hidden sm:inline">Template XLS</span>
          </button>

          {/* Export Products */}
          <button
            id="btn-export-products"
            onClick={() => {
              exportProductsToExcel(products);
              onAddToast('Export Berhasil', `${products.length} data produk berhasil diekspor ke format Excel (.xlsx).`, 'success');
            }}
            title="Ekspor seluruh katalog dan status stok saat ini ke Excel (.xlsx)"
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold transition-all cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>Export XLS</span>
          </button>

          {/* Add Product Manual */}
          <button
            id="btn-add-product"
            onClick={handleOpenAddModal}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all cursor-pointer shadow-xs"
          >
            <Plus className="w-4 h-4 text-emerald-400" />
            <span>Tambah Produk</span>
          </button>
        </div>
      </div>

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        
        {/* Card 1: Total SKU */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-500">Total Varian (SKU)</span>
            <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
              <Boxes className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 tracking-tight">
            {stats.totalSKU} <span className="text-xs font-normal text-slate-500">SKU</span>
          </div>
          <div className="flex items-center gap-2 mt-2 pt-2 border-t border-slate-100 text-[11px] text-slate-500">
            <span>{stats.saltnicCount} Salt</span> • 
            <span>{stats.freebaseCount} Freebase</span> • 
            <span>{stats.podFriendlyCount} Pods</span>
          </div>
        </div>

        {/* Card 2: Total Physical Stock */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-500">Stok Botol Fisik</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-emerald-800 tracking-tight">
            {formatNumber(stats.totalPhysicalStock)} <span className="text-xs font-normal text-slate-500">Botol</span>
          </div>
          <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-slate-100 text-[11px]">
            {stats.lowStockCount > 0 ? (
              <span className="text-amber-600 font-medium flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                {stats.lowStockCount} varian menipis (&lt;150 btl)
              </span>
            ) : (
              <span className="text-emerald-700 font-medium flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                Semua stok aman terkendali
              </span>
            )}
          </div>
        </div>

        {/* Card 3: Wholesale Inventory Asset Value */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-500">Nilai Aset Modal Grosir</span>
            <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            {formatRupiah(stats.totalWholesaleValue)}
          </div>
          <p className="mt-2 pt-2 border-t border-slate-100 text-[11px] text-slate-500 truncate">
            Estimasi nilai modal gudang e-liquid
          </p>
        </div>

        {/* Card 4: Potential Retail Turnover */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-500">Potensi Omzet Retail</span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            {formatRupiah(stats.totalRetailValue)}
          </div>
          <p className="mt-2 pt-2 border-t border-slate-100 text-[11px] text-emerald-700 font-medium truncate">
            Margin grosir-retail: +{Math.round(((stats.totalRetailValue - stats.totalWholesaleValue) / (stats.totalWholesaleValue || 1)) * 100)}%
          </p>
        </div>

      </div>

      {/* Filter, Search & View Controls */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-3.5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari varian liquid, nama, rasa, atau SKU..."
              className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500 bg-slate-50/50 focus:bg-white transition-all"
            />
          </div>

          {/* View Toggles & Sorter */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
              <button
                onClick={() => setViewMode('table')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  viewMode === 'table' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                }`}
              >
                Tabel Rinci
              </button>
              <button
                onClick={() => setViewMode('cards')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  viewMode === 'cards' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                }`}
              >
                Grid Kartu
              </button>
            </div>

            <div className="relative">
              <select
                value={sortBy}
                onChange={(e: any) => setSortBy(e.target.value)}
                className="pl-3 pr-8 py-2 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-700 appearance-none focus:outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer"
              >
                <option value="stock_desc">Stok Terbanyak</option>
                <option value="stock_asc">Stok Tersedikit (Perlu Restock)</option>
                <option value="name">Nama Produk (A-Z)</option>
                <option value="price_desc">Harga Tertinggi</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
          </div>

        </div>

        {/* Category & Status Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1">
            Kategori:
          </span>
          {['all', 'Saltnic', 'Freebase', 'Pods Friendly'].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-teal-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat === 'all' ? 'Semua Kategori' : cat}
            </button>
          ))}

          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-3 mr-1">
            Stok:
          </span>
          {[
            { id: 'all', label: 'Semua Status' },
            { id: 'safe', label: 'Aman (≥250)' },
            { id: 'medium', label: 'Sedang (100-249)' },
            { id: 'low', label: 'Menipis (<100)' }
          ].map((st) => (
            <button
              key={st.id}
              onClick={() => setSelectedStockStatus(st.id)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                selectedStockStatus === st.id
                  ? 'bg-slate-800 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {st.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Product Display Area (Table or Cards) */}
      {viewMode === 'table' ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="p-3.5">Produk & Varian Rasa</th>
                  <th className="p-3.5">Kategori & Spek</th>
                  <th className="p-3.5 text-right">Harga Grosir</th>
                  <th className="p-3.5 text-right">Harga Retail</th>
                  <th className="p-3.5 text-center min-w-[200px]">Stok Botol Fisik</th>
                  <th className="p-3.5 text-right">Total Nilai Modal</th>
                  <th className="p-3.5 text-center w-24">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-400">
                      <Package className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                      <p className="font-semibold text-slate-700">Tidak ada produk yang cocok dengan pencarian.</p>
                      <p className="text-[11px] text-slate-400 mt-1">Coba ubah kata kunci atau impor data baru.</p>
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map((product) => {
                    const isLow = product.stock < 150;
                    const isCritical = product.stock <= 50;

                    return (
                      <tr key={product.id} className="hover:bg-slate-50/80 transition-colors">
                        
                        {/* Name & Variant */}
                        <td className="p-3.5">
                          <div className="flex items-center gap-2.5">
                            <div className={`w-3 h-8 rounded-full bg-gradient-to-b ${product.badgeColor} shrink-0`} />
                            <div>
                              <div className="font-bold text-slate-900 text-sm">{product.name}</div>
                              <div className="text-[11px] text-slate-500">{product.variant}</div>
                              <span className="font-mono text-[10px] text-slate-400">ID: {product.id}</span>
                            </div>
                          </div>
                        </td>

                        {/* Category & Spec */}
                        <td className="p-3.5 whitespace-nowrap">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                            product.category === 'Saltnic' 
                              ? 'bg-purple-50 text-purple-700 border-purple-200' 
                              : product.category === 'Freebase' 
                              ? 'bg-amber-50 text-amber-800 border-amber-200' 
                              : 'bg-cyan-50 text-cyan-700 border-cyan-200'
                          }`}>
                            {product.category}
                          </span>
                          <div className="text-[11px] text-slate-600 mt-1 font-mono">
                            {product.volume} • {product.nicotine}
                          </div>
                        </td>

                        {/* Wholesale Price */}
                        <td className="p-3.5 text-right font-medium text-slate-700 whitespace-nowrap">
                          {formatRupiah(product.wholesalePrice)}
                        </td>

                        {/* Retail Price */}
                        <td className="p-3.5 text-right whitespace-nowrap">
                          <div className="font-bold text-slate-900">{formatRupiah(product.retailPrice)}</div>
                          <div className="text-[10px] text-emerald-600 font-semibold">
                            Margin +{formatRupiah(product.retailPrice - product.wholesalePrice)}
                          </div>
                        </td>

                        {/* Physical Stock with Quick Adjust Controls */}
                        <td className="p-3.5">
                          <div className="flex flex-col items-center">
                            <div className="flex items-center gap-2 mb-1">
                              <span className={`text-sm font-extrabold ${
                                isCritical ? 'text-rose-600' : isLow ? 'text-amber-700' : 'text-emerald-700'
                              }`}>
                                {formatNumber(product.stock)} botol
                              </span>
                              {isCritical && (
                                <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-rose-100 text-rose-700 border border-rose-200">
                                  Kritis
                                </span>
                              )}
                            </div>

                            {/* Quick Inline Adjustment Buttons */}
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handleQuickAdjustStock(product.id, -10)}
                                title="Kurangi 10 botol"
                                className="px-2 py-0.5 rounded-md bg-slate-100 hover:bg-rose-100 hover:text-rose-700 text-slate-600 text-[10px] font-bold transition-colors cursor-pointer"
                              >
                                -10
                              </button>
                              <button
                                onClick={() => {
                                  setAdjustingStockProduct(product);
                                  setCustomStockAmount(product.stock.toString());
                                }}
                                title="Set jumlah stok pasti (Opname)"
                                className="px-2 py-0.5 rounded-md bg-slate-100 hover:bg-teal-100 hover:text-teal-800 text-slate-600 text-[10px] font-bold transition-colors cursor-pointer"
                              >
                                Opname
                              </button>
                              <button
                                onClick={() => handleQuickAdjustStock(product.id, 10)}
                                title="Tambah 10 botol"
                                className="px-2 py-0.5 rounded-md bg-slate-100 hover:bg-emerald-100 hover:text-emerald-700 text-slate-600 text-[10px] font-bold transition-colors cursor-pointer"
                              >
                                +10
                              </button>
                              <button
                                onClick={() => handleQuickAdjustStock(product.id, 50)}
                                title="Tambah 50 botol"
                                className="px-2 py-0.5 rounded-md bg-emerald-50 hover:bg-emerald-200 text-emerald-800 text-[10px] font-bold transition-colors cursor-pointer"
                              >
                                +50
                              </button>
                            </div>
                          </div>
                        </td>

                        {/* Total Asset Value */}
                        <td className="p-3.5 text-right font-semibold text-slate-900 whitespace-nowrap">
                          {formatRupiah(product.stock * product.wholesalePrice)}
                        </td>

                        {/* Actions */}
                        <td className="p-3.5 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => handleOpenEditModal(product)}
                              title="Edit Detail Produk"
                              className="p-1.5 rounded-lg text-slate-500 hover:text-teal-700 hover:bg-teal-50 transition-colors cursor-pointer"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteProduct(product.id)}
                              title="Hapus Produk"
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>

                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Cards View */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredProducts.map((product) => {
            const isLow = product.stock < 150;
            return (
              <div
                key={product.id}
                className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-col justify-between hover:border-teal-300 transition-all group"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                      product.category === 'Saltnic' 
                        ? 'bg-purple-50 text-purple-700 border-purple-200' 
                        : product.category === 'Freebase' 
                        ? 'bg-amber-50 text-amber-800 border-amber-200' 
                        : 'bg-cyan-50 text-cyan-700 border-cyan-200'
                    }`}>
                      {product.category}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">{product.id}</span>
                  </div>

                  <div className="h-1.5 w-full rounded-full bg-gradient-to-r mb-3" style={{
                    backgroundImage: `linear-gradient(to right, var(--tw-gradient-stops))`
                  }} />

                  <h4 className="text-sm font-bold text-slate-900 group-hover:text-teal-700 transition-colors">
                    {product.name}
                  </h4>
                  <p className="text-xs text-slate-500 mb-2 font-medium">{product.variant}</p>
                  <p className="text-[11px] text-slate-500 line-clamp-2 mb-3 leading-relaxed">
                    {product.description || 'Varian e-liquid premium cita rasa khas PODA.'}
                  </p>

                  <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-100 space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Harga Grosir:</span>
                      <span className="font-semibold text-slate-800">{formatRupiah(product.wholesalePrice)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Harga Retail:</span>
                      <span className="font-bold text-slate-900">{formatRupiah(product.retailPrice)}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Stok Fisik</span>
                    <span className={`text-base font-extrabold ${isLow ? 'text-rose-600' : 'text-emerald-700'}`}>
                      {formatNumber(product.stock)} botol
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleQuickAdjustStock(product.id, 10)}
                      className="px-2 py-1 bg-teal-50 text-teal-700 rounded-lg text-xs font-bold hover:bg-teal-100 cursor-pointer"
                    >
                      +10
                    </button>
                    <button
                      onClick={() => handleOpenEditModal(product)}
                      className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 cursor-pointer"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* Stock Opname Inline Modal */}
      {adjustingStockProduct && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xl max-w-sm w-full">
            <h3 className="text-base font-bold text-slate-900 mb-1">
              Stock Opname Gudang
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Perbarui jumlah stok fisik nyata untuk <strong>{adjustingStockProduct.name}</strong>.
            </p>

            <div className="mb-4">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Jumlah Botol Saat Ini (Fisik):
              </label>
              <input
                type="number"
                min="0"
                value={customStockAmount}
                onChange={(e) => setCustomStockAmount(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-300 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setAdjustingStockProduct(null)}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSaveExactStock}
                className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-xs"
              >
                Simpan Stok
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Product Modal */}
      {isAddEditModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-in fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden my-6">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h3 className="text-base font-bold text-slate-900">
                {editingProduct ? 'Edit Master Data Produk' : 'Tambah Varian Produk Baru'}
              </h3>
              <button
                onClick={() => setIsAddEditModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProductForm} className="p-5 space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Produk <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: PODA Frost Mint Ice"
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Varian Rasa / Karakteristik <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Menthol & Spearmint Blast"
                  value={formData.variant || ''}
                  onChange={(e) => setFormData({ ...formData, variant: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-2.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Kategori</label>
                  <select
                    value={formData.category}
                    onChange={(e: any) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  >
                    <option value="Saltnic">Saltnic</option>
                    <option value="Freebase">Freebase</option>
                    <option value="Pods Friendly">Pods Friendly</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Nikotin</label>
                  <input
                    type="text"
                    placeholder="30mg"
                    value={formData.nicotine || ''}
                    onChange={(e) => setFormData({ ...formData, nicotine: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Volume</label>
                  <input
                    type="text"
                    placeholder="30ml"
                    value={formData.volume || ''}
                    onChange={(e) => setFormData({ ...formData, volume: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Harga Grosir (IDR)</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formData.wholesalePrice || 0}
                    onChange={(e) => setFormData({ ...formData, wholesalePrice: Number(e.target.value) })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-semibold focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Harga Retail (IDR)</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formData.retailPrice || 0}
                    onChange={(e) => setFormData({ ...formData, retailPrice: Number(e.target.value) })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-semibold focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Stok Botol</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formData.stock || 0}
                    onChange={(e) => setFormData({ ...formData, stock: Number(e.target.value) })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-bold text-teal-800 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Deskripsi Produk</label>
                <textarea
                  rows={2}
                  placeholder="Penjelasan profil rasa e-liquid..."
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddEditModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-xs"
                >
                  Simpan Produk
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CSV / Excel Import Modal */}
      <ImportStockModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        existingProducts={products}
        onApplyImport={handleApplyImport}
      />

    </div>
  );
};
