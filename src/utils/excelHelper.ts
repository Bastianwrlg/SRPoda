/**
 * Excel (.xlsx / .xls) parsing and generation utilities using SheetJS (xlsx)
 * Designed for PODA E-Liquid Sales Hub
 */
import * as XLSX from 'xlsx';
import { Customer, CustomerTier, CustomerStatus, ProductLiquid, LiquidCategory } from '../types';

export interface ParsedProductRow {
  id?: string;
  name: string;
  variant: string;
  category: LiquidCategory;
  nicotine: string;
  volume: string;
  wholesalePrice: number;
  retailPrice: number;
  stock: number;
  description: string;
  rawRow: Record<string, any>;
  validationErrors: string[];
  isExisting?: boolean;
}

export interface ParsedCustomerRow {
  id?: string;
  name: string;
  ownerName: string;
  phone: string;
  email: string;
  address: string;
  area: string;
  tier: CustomerTier;
  status: CustomerStatus;
  creditLimit: number;
  currentDebt: number;
  notes: string;
  rawRow: Record<string, any>;
  validationErrors: string[];
  isExisting?: boolean;
}

/**
 * Reads any File (.xlsx, .xls, etc.) and returns rows as string[][]
 */
export async function parseExcelFile(file: File): Promise<string[][]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        
        if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
          throw new Error('File Excel tidak memiliki lembar kerja (worksheet).');
        }

        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        // Extract as 2D array of strings
        const rawData: any[][] = XLSX.utils.sheet_to_json(firstSheet, { 
          header: 1, 
          defval: '',
          raw: false 
        });

        // Filter empty rows
        const cleanedRows: string[][] = rawData
          .filter(row => Array.isArray(row) && row.some(cell => cell !== undefined && String(cell).trim() !== ''))
          .map(row => row.map(cell => (cell === undefined || cell === null) ? '' : String(cell).trim()));

        resolve(cleanedRows);
      } catch (err: any) {
        reject(new Error(err?.message || 'Gagal membaca format file Excel. Pastikan file valid (.xlsx / .xls).'));
      }
    };

    reader.onerror = () => {
      reject(new Error('Gagal membaca file dari disk.'));
    };

    reader.readAsArrayBuffer(file);
  });
}

/**
 * Normalizes liquid category
 */
function normalizeCategory(catStr: string): LiquidCategory {
  const lower = (catStr || '').toLowerCase();
  if (lower.includes('salt') || lower.includes('saltnic')) return 'Saltnic';
  if (lower.includes('pod') || lower.includes('friendly')) return 'Pods Friendly';
  if (lower.includes('free') || lower.includes('freebase')) return 'Freebase';
  return 'Saltnic';
}

/**
 * Normalizes customer tier
 */
function normalizeCustomerTier(tierStr: string): CustomerTier {
  const lower = (tierStr || '').toLowerCase();
  if (lower.includes('distributor')) return 'Distributor';
  if (lower.includes('whole') || lower.includes('grosir')) return 'Wholesaler';
  if (lower.includes('premium')) return 'Retail Premium';
  return 'Retail Regular';
}

/**
 * Normalizes customer status
 */
function normalizeCustomerStatus(statusStr: string): CustomerStatus {
  const lower = (statusStr || '').toLowerCase();
  if (lower.includes('non') || lower.includes('pasif') || lower.includes('tutup')) return 'Non-Aktif';
  if (lower.includes('kunjung')) return 'Perlu Kunjungan';
  if (lower.includes('restock') || lower.includes('order')) return 'Menunggu Restock';
  return 'Aktif';
}

/**
 * Maps 2D table rows into validated ProductLiquid objects
 */
export function mapRowsToProducts(rows: string[][], existingProducts: ProductLiquid[]): ParsedProductRow[] {
  if (rows.length < 2) return [];

  const headerRow = rows[0].map(h => h.toLowerCase().replace(/[^a-z0-9]/g, ''));

  const colIndexes = {
    id: headerRow.findIndex(h => h === 'id' || h === 'sku' || h === 'kodeproduk' || h === 'kode'),
    name: headerRow.findIndex(h => h.includes('nama') || h.includes('name') || h === 'produk' || h === 'product'),
    variant: headerRow.findIndex(h => h.includes('varian') || h.includes('variant') || h.includes('rasa') || h.includes('flavor')),
    category: headerRow.findIndex(h => h.includes('kategori') || h.includes('category') || h.includes('jenis')),
    nicotine: headerRow.findIndex(h => h.includes('nikotin') || h.includes('nicotine') || h.includes('nic') || h.includes('mg')),
    volume: headerRow.findIndex(h => h.includes('volume') || h.includes('isi') || h.includes('ukuran') || h.includes('size')),
    wholesale: headerRow.findIndex(h => h.includes('grosir') || h.includes('wholesale') || h.includes('modal') || h.includes('hargab') || h === 'hargagrosir'),
    retail: headerRow.findIndex(h => h.includes('retail') || h.includes('eceran') || h.includes('jual') || h.includes('hargajual') || h === 'hargaretail'),
    stock: headerRow.findIndex(h => h.includes('stok') || h.includes('stock') || h.includes('qty') || h.includes('jumlah') || h === 'stokfisik'),
    description: headerRow.findIndex(h => h.includes('deskripsi') || h.includes('ket') || h.includes('desc') || h.includes('catatan'))
  };

  const results: ParsedProductRow[] = [];

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (row.length === 0 || row.every(cell => !cell)) continue;

    const rawId = colIndexes.id !== -1 ? row[colIndexes.id] : '';
    const rawName = colIndexes.name !== -1 ? row[colIndexes.name] : (row[0] || '');
    const rawVariant = colIndexes.variant !== -1 ? row[colIndexes.variant] : (row[1] || '');
    const rawCategory = colIndexes.category !== -1 ? row[colIndexes.category] : '';
    const rawNicotine = colIndexes.nicotine !== -1 ? row[colIndexes.nicotine] : '30mg';
    const rawVolume = colIndexes.volume !== -1 ? row[colIndexes.volume] : '30ml';
    
    // Parse prices & stock
    const cleanNumber = (val: string): number => {
      if (!val) return 0;
      const cleaned = val.replace(/[^0-9.-]+/g, '');
      const parsed = parseFloat(cleaned);
      return isNaN(parsed) ? 0 : parsed;
    };

    const wholesalePrice = colIndexes.wholesale !== -1 ? cleanNumber(row[colIndexes.wholesale]) : 65000;
    const retailPrice = colIndexes.retail !== -1 ? cleanNumber(row[colIndexes.retail]) : 110000;
    const stock = colIndexes.stock !== -1 ? Math.max(0, Math.floor(cleanNumber(row[colIndexes.stock]))) : 0;
    const description = colIndexes.description !== -1 ? row[colIndexes.description] : '';

    const validationErrors: string[] = [];
    if (!rawName) validationErrors.push('Nama produk wajib diisi');
    if (!rawVariant) validationErrors.push('Varian rasa wajib diisi');
    if (wholesalePrice <= 0) validationErrors.push('Harga grosir harus > 0');
    if (retailPrice <= 0) validationErrors.push('Harga retail harus > 0');

    // Check if matches existing by ID or Name + Variant
    const existing = existingProducts.find(p => 
      (rawId && p.id.toLowerCase() === rawId.toLowerCase()) || 
      (p.name.toLowerCase() === rawName.toLowerCase() && p.variant.toLowerCase() === rawVariant.toLowerCase())
    );

    const rawObj: Record<string, any> = {};
    rows[0].forEach((header, idx) => {
      rawObj[header || `col_${idx}`] = row[idx] || '';
    });

    results.push({
      id: existing ? existing.id : (rawId || undefined),
      name: rawName,
      variant: rawVariant,
      category: normalizeCategory(rawCategory),
      nicotine: rawNicotine.includes('mg') ? rawNicotine : `${rawNicotine}mg`,
      volume: rawVolume.includes('ml') ? rawVolume : `${rawVolume}ml`,
      wholesalePrice,
      retailPrice,
      stock,
      description: description || (existing ? existing.description : ''),
      rawRow: rawObj,
      validationErrors,
      isExisting: !!existing
    });
  }

  return results;
}

/**
 * Maps 2D table rows into validated Customer objects
 */
export function mapRowsToCustomers(rows: string[][], existingCustomers: Customer[]): ParsedCustomerRow[] {
  if (rows.length < 2) return [];

  const headerRow = rows[0].map(h => h.toLowerCase().replace(/[^a-z0-9]/g, ''));

  const colIndexes = {
    id: headerRow.findIndex(h => h === 'id' || h === 'kode' || h === 'kodetoko'),
    name: headerRow.findIndex(h => h.includes('nama') || h.includes('toko') || h.includes('store') || h.includes('outlet')),
    owner: headerRow.findIndex(h => h.includes('pemilik') || h.includes('owner') || h.includes('pic') || h.includes('kontak')),
    phone: headerRow.findIndex(h => h.includes('telp') || h.includes('telepon') || h.includes('phone') || h.includes('wa') || h.includes('hp')),
    email: headerRow.findIndex(h => h.includes('email') || h.includes('surel')),
    address: headerRow.findIndex(h => h.includes('alamat') || h.includes('address') || h.includes('lokasi')),
    area: headerRow.findIndex(h => h.includes('area') || h.includes('wilayah') || h.includes('kota') || h.includes('daerah')),
    tier: headerRow.findIndex(h => h.includes('tier') || h.includes('kategori') || h.includes('tipe') || h.includes('level')),
    status: headerRow.findIndex(h => h.includes('status')),
    creditLimit: headerRow.findIndex(h => h.includes('plafon') || h.includes('limit') || h.includes('kredit') || h.includes('creditlimit')),
    debt: headerRow.findIndex(h => h.includes('piutang') || h.includes('hutang') || h.includes('debt')),
    notes: headerRow.findIndex(h => h.includes('catatan') || h.includes('notes') || h.includes('keterangan'))
  };

  const results: ParsedCustomerRow[] = [];

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (row.length === 0 || row.every(cell => !cell)) continue;

    const rawId = colIndexes.id !== -1 ? row[colIndexes.id] : '';
    const rawName = colIndexes.name !== -1 ? row[colIndexes.name] : (row[0] || '');
    const rawOwner = colIndexes.owner !== -1 ? row[colIndexes.owner] : (row[1] || '');
    const rawPhone = colIndexes.phone !== -1 ? row[colIndexes.phone] : '';
    const rawEmail = colIndexes.email !== -1 ? row[colIndexes.email] : '';
    const rawAddress = colIndexes.address !== -1 ? row[colIndexes.address] : '';
    const rawArea = colIndexes.area !== -1 ? row[colIndexes.area] : 'Jakarta Pusat';
    const rawTier = colIndexes.tier !== -1 ? row[colIndexes.tier] : 'Retail Regular';
    const rawStatus = colIndexes.status !== -1 ? row[colIndexes.status] : 'Aktif';

    const cleanNumber = (val: string): number => {
      if (!val) return 0;
      const cleaned = val.replace(/[^0-9.-]+/g, '');
      const parsed = parseFloat(cleaned);
      return isNaN(parsed) ? 0 : parsed;
    };

    const creditLimit = colIndexes.creditLimit !== -1 ? cleanNumber(row[colIndexes.creditLimit]) : 15000000;
    const currentDebt = colIndexes.debt !== -1 ? cleanNumber(row[colIndexes.debt]) : 0;
    const notes = colIndexes.notes !== -1 ? row[colIndexes.notes] : '';

    const validationErrors: string[] = [];
    if (!rawName) validationErrors.push('Nama toko wajib diisi');
    if (!rawOwner) validationErrors.push('Nama pemilik / PIC wajib diisi');
    if (!rawPhone) validationErrors.push('Nomor kontak/telepon wajib diisi');

    // Check if matches existing customer by ID or Name or Phone
    const existing = existingCustomers.find(c =>
      (rawId && c.id.toLowerCase() === rawId.toLowerCase()) ||
      (c.name.toLowerCase() === rawName.toLowerCase()) ||
      (rawPhone && c.phone.replace(/[^0-9]/g, '') === rawPhone.replace(/[^0-9]/g, ''))
    );

    const rawObj: Record<string, any> = {};
    rows[0].forEach((header, idx) => {
      rawObj[header || `col_${idx}`] = row[idx] || '';
    });

    results.push({
      id: existing ? existing.id : (rawId || undefined),
      name: rawName,
      ownerName: rawOwner,
      phone: rawPhone,
      email: rawEmail,
      address: rawAddress,
      area: rawArea,
      tier: normalizeCustomerTier(rawTier),
      status: normalizeCustomerStatus(rawStatus),
      creditLimit,
      currentDebt,
      notes: notes || (existing ? existing.notes : ''),
      rawRow: rawObj,
      validationErrors,
      isExisting: !!existing
    });
  }

  return results;
}

/**
 * Exports products and stock into real Excel (.xlsx or .xls)
 */
export function exportProductsToExcel(products: ProductLiquid[], filename: string = 'katalog_produk_poda.xlsx'): void {
  const headers = [
    'ID / SKU',
    'Nama Produk',
    'Varian Rasa',
    'Kategori',
    'Kadar Nikotin',
    'Volume',
    'Harga Grosir (IDR)',
    'Harga Retail (IDR)',
    'Stok Fisik (Botol)',
    'Nilai Aset Stok (IDR)',
    'Deskripsi Produk'
  ];

  const rows = products.map(p => [
    p.id,
    p.name,
    p.variant,
    p.category,
    p.nicotine,
    p.volume,
    p.wholesalePrice,
    p.retailPrice,
    p.stock,
    p.stock * p.wholesalePrice,
    p.description || ''
  ]);

  const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  
  // Column width hints
  worksheet['!cols'] = [
    { wch: 14 }, // SKU
    { wch: 24 }, // Name
    { wch: 20 }, // Variant
    { wch: 14 }, // Category
    { wch: 14 }, // Nicotine
    { wch: 12 }, // Volume
    { wch: 18 }, // Wholesale Price
    { wch: 18 }, // Retail Price
    { wch: 16 }, // Stock
    { wch: 20 }, // Total Asset Value
    { wch: 35 }  // Description
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Katalog Produk');

  // Trigger download
  XLSX.writeFile(workbook, filename.endsWith('.xls') || filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`);
}

/**
 * Downloads a sample template Excel for Products
 */
export function downloadProductTemplateExcel(filename: string = 'template_import_produk_poda.xlsx'): void {
  const headers = [
    'ID / SKU',
    'Nama Produk',
    'Varian Rasa',
    'Kategori',
    'Kadar Nikotin',
    'Volume',
    'Harga Grosir (IDR)',
    'Harga Retail (IDR)',
    'Stok Fisik',
    'Deskripsi'
  ];

  const sampleRows = [
    [
      'POD-SALT-01',
      'Poda Oat Drip',
      'Banana Oat Milk',
      'Saltnic',
      '30mg',
      '30ml',
      70000,
      115000,
      120,
      'Perpaduan creamy oat hangat dengan sentuhan pisang matang manis.'
    ],
    [
      'POD-FREE-02',
      'Poda Ice Series',
      'Mango Freeze Extreme',
      'Freebase',
      '3mg',
      '60ml',
      85000,
      140000,
      85,
      'Sensasi mangga arumanis dingin menyegarkan dengan mint boost.'
    ],
    [
      'POD-PODS-03',
      'Poda Pods Friendly',
      'Caramel Machiato',
      'Pods Friendly',
      '12mg',
      '30ml',
      65000,
      105000,
      150,
      'Kopi karamel aromatik yang dirancang halus khusus open system pod.'
    ]
  ];

  const worksheet = XLSX.utils.aoa_to_sheet([headers, ...sampleRows]);
  worksheet['!cols'] = [
    { wch: 14 },
    { wch: 22 },
    { wch: 22 },
    { wch: 14 },
    { wch: 14 },
    { wch: 12 },
    { wch: 18 },
    { wch: 18 },
    { wch: 14 },
    { wch: 40 }
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Template Produk');
  XLSX.writeFile(workbook, filename);
}

/**
 * Exports customers/stores to real Excel (.xlsx / .xls)
 */
export function exportCustomersToExcel(customers: Customer[], filename: string = 'data_toko_mitra_poda.xlsx'): void {
  const headers = [
    'Kode Toko',
    'Nama Toko / Outlet',
    'Nama Pemilik / PIC',
    'No. WhatsApp / Telp',
    'Email Toko',
    'Alamat Lengkap',
    'Wilayah / Area',
    'Kategori / Tier',
    'Status Toko',
    'Plafon Kredit (IDR)',
    'Sisa Piutang Berjalan (IDR)',
    'Total Transaksi Pesanan',
    'Total Omzet (IDR)',
    'Terakhir Dikunjungi',
    'Catatan Khusus Toko'
  ];

  const rows = customers.map(c => [
    c.id,
    c.name,
    c.ownerName,
    c.phone,
    c.email || '',
    c.address,
    c.area,
    c.tier,
    c.status,
    c.creditLimit,
    c.currentDebt,
    c.totalOrdersCount,
    c.totalRevenue,
    c.lastVisitDate || '-',
    c.notes || ''
  ]);

  const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  worksheet['!cols'] = [
    { wch: 14 }, // Code
    { wch: 26 }, // Store Name
    { wch: 20 }, // Owner
    { wch: 18 }, // Phone
    { wch: 22 }, // Email
    { wch: 35 }, // Address
    { wch: 18 }, // Area
    { wch: 16 }, // Tier
    { wch: 16 }, // Status
    { wch: 20 }, // Credit Limit
    { wch: 22 }, // Current Debt
    { wch: 16 }, // Orders Count
    { wch: 20 }, // Total Revenue
    { wch: 18 }, // Last Visit
    { wch: 30 }  // Notes
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Data Toko Mitra');
  XLSX.writeFile(workbook, filename.endsWith('.xls') || filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`);
}

/**
 * Downloads a sample template Excel for Stores / Customers
 */
export function downloadCustomerTemplateExcel(filename: string = 'template_import_toko_poda.xlsx'): void {
  const headers = [
    'Kode Toko',
    'Nama Toko / Outlet',
    'Nama Pemilik / PIC',
    'No. WhatsApp / Telp',
    'Email Toko',
    'Alamat Lengkap',
    'Wilayah / Area',
    'Kategori / Tier',
    'Status Toko',
    'Plafon Kredit (IDR)',
    'Catatan Khusus'
  ];

  const sampleRows = [
    [
      'TK-JKT-01',
      'Vape Haven Tebet',
      'Rudy Hartono',
      '081298765432',
      'vapehaventebet@gmail.com',
      'Jl. Tebet Raya No. 45, Jakarta Selatan',
      'Jakarta Selatan',
      'Retail Premium',
      'Aktif',
      25000000,
      'Outlet vape premium dengan display rak utama di lobby depan.'
    ],
    [
      'TK-BDG-02',
      'Cloud Paradise Dago',
      'Dewi Anggraini',
      '081377889900',
      'cloudparadisedago@gmail.com',
      'Jl. Ir. H. Djuanda No. 120, Bandung',
      'Bandung',
      'Distributor',
      'Aktif',
      75000000,
      'Hub distribusi utama wilayah Dago dan Bandung Utara.'
    ],
    [
      'TK-BKS-03',
      'Vaporizer Galaxy Bekasi',
      'Fajar Nugraha',
      '085611223344',
      'vaporgalaxy@gmail.com',
      'Grand Galaxy City Ruko RGA No. 12, Bekasi',
      'Bekasi',
      'Wholesaler',
      'Perlu Kunjungan',
      35000000,
      'Perlu restock mingguan varian Saltnic 30mg.'
    ]
  ];

  const worksheet = XLSX.utils.aoa_to_sheet([headers, ...sampleRows]);
  worksheet['!cols'] = [
    { wch: 14 },
    { wch: 25 },
    { wch: 20 },
    { wch: 18 },
    { wch: 24 },
    { wch: 35 },
    { wch: 18 },
    { wch: 16 },
    { wch: 14 },
    { wch: 20 },
    { wch: 35 }
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Template Toko');
  XLSX.writeFile(workbook, filename);
}
