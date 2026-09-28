/**
 * Utility functions for PODA E-Liquid Sales Hub
 */

export const formatRupiah = (amount: number): string => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0
  }).format(amount);
};

export const formatNumber = (num: number): string => {
  return new Intl.NumberFormat('id-ID').format(num);
};

export const formatDateIndo = (dateStr: string): string => {
  if (!dateStr) return '-';
  try {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const date = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
      return new Intl.DateTimeFormat('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      }).format(date);
    }
    return dateStr;
  } catch {
    return dateStr;
  }
};

export const getTierBadgeClass = (tier: string): string => {
  switch (tier) {
    case 'Distributor':
      return 'bg-amber-50 text-amber-800 border-amber-300 font-semibold';
    case 'Wholesaler':
      return 'bg-purple-50 text-purple-800 border-purple-300 font-semibold';
    case 'Retail Premium':
      return 'bg-emerald-50 text-emerald-800 border-emerald-300 font-semibold';
    default:
      return 'bg-blue-50 text-blue-800 border-blue-300 font-semibold';
  }
};

export const getStatusBadgeClass = (status: string): string => {
  switch (status) {
    case 'Aktif':
    case 'Selesai':
    case 'Lunas':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200 font-medium';
    case 'Sedang Berlangsung':
    case 'Menunggu Restock':
      return 'bg-amber-50 text-amber-700 border-amber-200 font-medium';
    case 'Perlu Kunjungan':
    case 'Pending':
    case 'Tempo':
      return 'bg-orange-50 text-orange-700 border-orange-200 font-medium';
    case 'Terjadwal':
      return 'bg-blue-50 text-blue-700 border-blue-200 font-medium';
    case 'Dibatalkan':
    case 'Non-Aktif':
      return 'bg-rose-50 text-rose-700 border-rose-200 font-medium';
    default:
      return 'bg-slate-100 text-slate-700 border-slate-200 font-medium';
  }
};
