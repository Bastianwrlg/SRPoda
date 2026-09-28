/**
 * CSV and TSV parsing & generation utilities for PODA E-Liquid Sales Hub
 */
import { ProductLiquid, LiquidCategory } from '../types';

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
  rawRow: Record<string, string>;
  validationErrors: string[];
  isExisting?: boolean;
}

/**
 * Parses raw text into rows and columns handling quotes, commas, semicolons, and tabs.
 */
export function parseCSVText(text: string): string[][] {
  const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
  const result: string[][] = [];

  for (let line of lines) {
    line = line.trim();
    if (!line) continue;

    // Detect delimiter: semicolon, tab, or comma
    let delimiter = ',';
    if (line.includes(';') && (line.split(';').length > line.split(',').length)) {
      delimiter = ';';
    } else if (line.includes('\t')) {
      delimiter = '\t';
    }

    const row: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++; // Skip escaped quote
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === delimiter && !inQuotes) {
        row.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    row.push(current.trim());
    result.push(row);
  }

  return result;
}

/**
 * Normalizes category input into LiquidCategory
 */
function normalizeCategory(catStr: string): LiquidCategory {
  const lower = (catStr || '').toLowerCase();
  if (lower.includes('salt') || lower.includes('saltnic')) {
    return 'Saltnic';
  }
  if (lower.includes('pod') || lower.includes('friendly')) {
    return 'Pods Friendly';
  }
  if (lower.includes('free') || lower.includes('freebase')) {
    return 'Freebase';
  }
  return 'Saltnic';
}

/**
 * Converts parsed table data into validated Product objects
 */
export function mapRowsToProducts(rows: string[][], existingProducts: ProductLiquid[]): ParsedProductRow[] {
  if (rows.length < 2) return [];

  const headerRow = rows[0].map(h => h.toLowerCase().replace(/[^a-z0-9]/g, ''));
  
  // Find column indexes
  const colIndexes = {
    id: headerRow.findIndex(h => h === 'id' || h === 'sku' || h === 'kodeproduk' || h === 'kode'),
    name: headerRow.findIndex(h => h.includes('nama') || h.includes('name') || h === 'produk' || h === 'product'),
    variant: headerRow.findIndex(h => h.includes('varian') || h.includes('variant') || h.includes('rasa') || h.includes('flavor')),
    category: headerRow.findIndex(h => h.includes('kategori') || h.includes('category') || h.includes('jenis')),
    nicotine: headerRow.findIndex(h => h.includes('nikotin') || h.includes('nicotine') || h.includes('nic') || h.includes('mg')),
    volume: headerRow.findIndex(h => h.includes('volume') || h.includes('ukuran') || h.includes('size') || h.includes('ml')),
    wholesalePrice: headerRow.findIndex(h => h.includes('grosir') || h.includes('wholesale') || h.includes('modal') || h.includes('beli') || h.includes('hargagrosir')),
    retailPrice: headerRow.findIndex(h => h.includes('retail') || h.includes('eceran') || h.includes('jual') || h.includes('hargajual') || h.includes('hargaretail')),
    stock: headerRow.findIndex(h => h.includes('stok') || h.includes('stock') || h.includes('qty') || h.includes('jumlah') || h.includes('kuantitas')),
    description: headerRow.findIndex(h => h.includes('deskripsi') || h.includes('desc') || h.includes('keterangan'))
  };

  const parsedResults: ParsedProductRow[] = [];

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (row.length === 0 || row.every(c => !c)) continue;

    const rawMap: Record<string, string> = {};
    headerRow.forEach((h, idx) => {
      rawMap[h] = row[idx] || '';
    });

    const name = (colIndexes.name !== -1 ? row[colIndexes.name] : row[1] || '').trim();
    const variant = (colIndexes.variant !== -1 ? row[colIndexes.variant] : row[2] || '').trim();
    const categoryRaw = (colIndexes.category !== -1 ? row[colIndexes.category] : row[3] || 'Saltnic').trim();
    const category = normalizeCategory(categoryRaw);
    const nicotine = (colIndexes.nicotine !== -1 ? row[colIndexes.nicotine] : row[4] || '30mg').trim();
    const volume = (colIndexes.volume !== -1 ? row[colIndexes.volume] : row[5] || '30ml').trim();
    
    // Clean numbers
    const cleanNum = (strVal: string, fallback: number): number => {
      if (!strVal) return fallback;
      const cleaned = strVal.replace(/[^0-9.-]/g, '');
      const num = parseFloat(cleaned);
      return isNaN(num) ? fallback : Math.max(0, num);
    };

    const wholesalePrice = cleanNum(colIndexes.wholesalePrice !== -1 ? row[colIndexes.wholesalePrice] : row[6], 80000);
    const retailPrice = cleanNum(colIndexes.retailPrice !== -1 ? row[colIndexes.retailPrice] : row[7], 110000);
    const stock = Math.round(cleanNum(colIndexes.stock !== -1 ? row[colIndexes.stock] : row[8], 100));
    const description = (colIndexes.description !== -1 ? row[colIndexes.description] : row[9] || `${name} varian ${variant}`).trim();
    
    let id = (colIndexes.id !== -1 ? row[colIndexes.id] : row[0] || '').trim();

    const errors: string[] = [];
    if (!name) {
      errors.push('Nama produk tidak boleh kosong');
    }
    if (wholesalePrice <= 0) {
      errors.push('Harga grosir harus lebih besar dari 0');
    }
    if (retailPrice < wholesalePrice) {
      errors.push('Harga retail lebih rendah dari harga grosir');
    }

    // Check if matches existing product
    const existing = existingProducts.find(
      p => (id && p.id.toLowerCase() === id.toLowerCase()) || 
           (p.name.toLowerCase() === name.toLowerCase() && p.variant.toLowerCase() === variant.toLowerCase()) ||
           (p.name.toLowerCase() === name.toLowerCase())
    );

    if (existing && !id) {
      id = existing.id;
    }

    parsedResults.push({
      id: id || undefined,
      name,
      variant: variant || 'Original Blend',
      category,
      nicotine: nicotine || (category === 'Saltnic' ? '30mg' : category === 'Pods Friendly' ? '12mg' : '3mg'),
      volume: volume || (category === 'Freebase' ? '60ml' : '30ml'),
      wholesalePrice,
      retailPrice,
      stock,
      description,
      rawRow: rawMap,
      validationErrors: errors,
      isExisting: !!existing
    });
  }

  return parsedResults;
}

/**
 * Generates and downloads a ready-to-fill sample CSV template
 */
export function downloadProductTemplateCSV(): void {
  const headers = [
    'Kode SKU / ID',
    'Nama Produk',
    'Varian Rasa',
    'Kategori (Saltnic/Freebase/Pods Friendly)',
    'Kadar Nikotin',
    'Volume',
    'Harga Grosir (IDR)',
    'Harga Retail (IDR)',
    'Jumlah Stok Fisik',
    'Deskripsi Produk'
  ];

  const sampleRows = [
    [
      'prod-1',
      'PODA Frost Mint Ice',
      'Menthol & Spearmint Blast',
      'Saltnic',
      '30mg',
      '30ml',
      '85000',
      '115000',
      '450',
      'Sensasi dingin arctic mint menyegarkan dengan throat hit halus seimbang.'
    ],
    [
      'prod-2',
      'PODA Mango Freeze Blast',
      'Sweet Harumanis Mango Ice',
      'Saltnic',
      '30mg',
      '30ml',
      '85000',
      '115000',
      '380',
      'Perpaduan mangga harumanis ranum dengan sentuhan kristal es yang pekat.'
    ],
    [
      'prod-3',
      'PODA Butterscotch Cream Reserve',
      'Creamy Salted Caramel Custard',
      'Freebase',
      '3mg',
      '60ml',
      '115000',
      '155000',
      '290',
      'Karamel gurih leleh berpadu krim custard vanila madagaskar bertekstur tebal.'
    ],
    [
      'prod-new-1',
      'PODA Berry Lychee Punch',
      'Wild Berry & Sweet Lychee Ice',
      'Saltnic',
      '30mg',
      '30ml',
      '85000',
      '115000',
      '250',
      'Perpaduan buah leci segar dan beri hutan dengan rasa manis asam menyegarkan.'
    ],
    [
      'prod-new-2',
      'PODA Coffee Hazelnut Latte',
      'Espresso Roasted Hazelnut Cream',
      'Freebase',
      '6mg',
      '60ml',
      '115000',
      '155000',
      '180',
      'Aroma kopi espresso sangrai dipadu gurihnya hazelnut dan susu krim lembut.'
    ]
  ];

  const csvContent = '\uFEFF' + [
    headers.map(h => `"${h.replace(/"/g, '""')}"`).join(','),
    ...sampleRows.map(row => row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(','))
  ].join('\r\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `template_import_produk_stok_poda.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Exports current products & stock into a CSV file
 */
export function exportProductsToCSV(products: ProductLiquid[]): void {
  const headers = [
    'ID / SKU',
    'Nama Produk',
    'Varian Rasa',
    'Kategori',
    'Kadar Nikotin',
    'Volume',
    'Harga Grosir',
    'Harga Retail',
    'Stok Fisik Saat Ini',
    'Nilai Aset Stok (IDR)',
    'Deskripsi'
  ];

  const rows = products.map(p => [
    p.id,
    p.name,
    p.variant,
    p.category,
    p.nicotine,
    p.volume,
    p.wholesalePrice.toString(),
    p.retailPrice.toString(),
    p.stock.toString(),
    (p.stock * p.wholesalePrice).toString(),
    p.description || ''
  ]);

  const csvContent = '\uFEFF' + [
    headers.map(h => `"${h.replace(/"/g, '""')}"`).join(','),
    ...rows.map(row => row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(','))
  ].join('\r\n');

  const dateStr = new Date().toISOString().split('T')[0];
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `katalog_stok_poda_${dateStr}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
