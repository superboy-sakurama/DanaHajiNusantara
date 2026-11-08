import { Transaction, FinancialSummary } from '../types/index.ts';

/**
 * Format angka ke format mata uang Rupiah Indonesia (Rp xx.xxx.xxx)
 */
export function formatRupiah(nominal: number): string {
  if (isNaN(nominal) || nominal === null || nominal === undefined) {
    return 'Rp 0';
  }
  const isNegative = nominal < 0;
  const abs = Math.abs(nominal);
  const formatted = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(abs);

  return isNegative ? `-${formatted}` : formatted;
}

/**
 * Parsing string input rupiah ke integer/number
 */
export function parseRupiah(input: string | number): number {
  if (typeof input === 'number') return Math.round(input);
  if (!input) return 0;
  const cleaned = input.replace(/[^0-9-]/g, '');
  const parsed = parseInt(cleaned, 10);
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Menghitung saldo realtime dan total transaksi
 */
export function calculateFinancialSummary(
  saldoAwal: number,
  transactions: Transaction[],
  tahun: string = '2026'
): FinancialSummary {
  let totalPenerimaan = 0;
  let totalPengeluaran = 0;

  for (const t of transactions) {
    const nominal = Math.abs(Number(t.nominal) || 0);
    if (t.jenis === 'penerimaan') {
      totalPenerimaan += nominal;
    } else if (t.jenis === 'pengeluaran') {
      totalPengeluaran += nominal;
    }
  }

  const saldoRealtime = saldoAwal + totalPenerimaan - totalPengeluaran;

  return {
    saldoAwalTahunLalu: saldoAwal,
    saldoRealtime,
    totalPenerimaan,
    totalPengeluaran,
    tahun,
  };
}

export const PENERIMAAN_CATEGORIES = [
  'BOK / Kemenkes',
  'Dinkes / Pemda',
  'BAZNAS & Hibah',
  'Swadaya Petugas',
  'Penerimaan Lainnya',
] as const;

export const PENGELUARAN_CATEGORIES = [
  'Obat & Farmasi',
  'Alkes & Alat Medis',
  'Seragam & Administrasi',
  'Logistik & Konsumsi',
  'Transportasi & Operasional',
  'Operasional Lainnya',
] as const;

export const ALL_CATEGORIES = [
  ...PENERIMAAN_CATEGORIES,
  ...PENGELUARAN_CATEGORIES,
] as const;

/**
 * Mendeteksi atau mengembalikan kategori transaksi secara otomatis dan akurat
 */
export function getTransactionCategory(item: {
  jenis: 'penerimaan' | 'pengeluaran';
  sumber_dana?: string;
  nama_penerima?: string;
  keterangan?: string;
  kategori?: string;
}): string {
  if (item.kategori && item.kategori.trim()) {
    return item.kategori.trim();
  }

  const text = `${item.sumber_dana || ''} ${item.nama_penerima || ''} ${item.keterangan || ''}`.toLowerCase();

  if (item.jenis === 'penerimaan') {
    if (text.includes('bok') || text.includes('kemenkes') || text.includes('kementerian kesehatan')) {
      return 'BOK / Kemenkes';
    }
    if (text.includes('dinkes') || text.includes('dinas kesehatan') || text.includes('pemda') || text.includes('apbd')) {
      return 'Dinkes / Pemda';
    }
    if (text.includes('baznas') || text.includes('hibah') || text.includes('donasi') || text.includes('csr') || text.includes('bantuan')) {
      return 'BAZNAS & Hibah';
    }
    if (text.includes('swadaya') || text.includes('iuran') || text.includes('mandiri') || text.includes('patungan') || text.includes('petugas')) {
      return 'Swadaya Petugas';
    }
    return 'Penerimaan Lainnya';
  } else {
    // Pengeluaran
    if (
      text.includes('obat') ||
      text.includes('farmasi') ||
      text.includes('vitamin') ||
      text.includes('paracetamol') ||
      text.includes('antihistamin') ||
      text.includes('amoxicillin') ||
      text.includes('oralit') ||
      text.includes('suplemen') ||
      text.includes('antasida') ||
      text.includes('apotek')
    ) {
      return 'Obat & Farmasi';
    }
    if (
      text.includes('alkes') ||
      text.includes('alat medis') ||
      text.includes('tensi') ||
      text.includes('stetoskop') ||
      text.includes('glukometer') ||
      text.includes('oximeter') ||
      text.includes('oksigen') ||
      text.includes('spuit') ||
      text.includes('jarum') ||
      text.includes('perban') ||
      text.includes('kasa') ||
      text.includes('plester') ||
      text.includes('termometer') ||
      text.includes('medis')
    ) {
      return 'Alkes & Alat Medis';
    }
    if (
      text.includes('seragam') ||
      text.includes('rompi') ||
      text.includes('id card') ||
      text.includes('nametag') ||
      text.includes('atk') ||
      text.includes('kertas') ||
      text.includes('fotokopi') ||
      text.includes('print') ||
      text.includes('buku') ||
      text.includes('administrasi') ||
      text.includes('spanduk') ||
      text.includes('banner')
    ) {
      return 'Seragam & Administrasi';
    }
    if (
      text.includes('konsumsi') ||
      text.includes('makan') ||
      text.includes('snack') ||
      text.includes('minum') ||
      text.includes('katering') ||
      text.includes('logistik') ||
      text.includes('air mineral') ||
      text.includes('nasi') ||
      text.includes('ransum')
    ) {
      return 'Logistik & Konsumsi';
    }
    if (
      text.includes('transport') ||
      text.includes('bbm') ||
      text.includes('bensin') ||
      text.includes('solar') ||
      text.includes('sewa mobil') ||
      text.includes('tiket') ||
      text.includes('kendaraan') ||
      text.includes('akomodasi') ||
      text.includes('hotel') ||
      text.includes('pulsa') ||
      text.includes('kuota') ||
      text.includes('paket data')
    ) {
      return 'Transportasi & Operasional';
    }
    return 'Operasional Lainnya';
  }
}

/**
 * Filter data transaksi berdasarkan kriteria lengkap (jenis, kategori, bulan, tanggal, pencarian kata kunci)
 */
export function filterTransactions(
  transactions: Transaction[],
  filters: {
    jenis?: 'all' | 'penerimaan' | 'pengeluaran';
    search?: string;
    kategori?: string;
    startDate?: string;
    endDate?: string;
    month?: string; // Format 'YYYY-MM'
  }
): Transaction[] {
  return transactions.filter((item) => {
    // Filter jenis
    if (filters.jenis && filters.jenis !== 'all' && item.jenis !== filters.jenis) {
      return false;
    }

    // Filter kategori
    if (filters.kategori && filters.kategori !== 'all') {
      const cat = getTransactionCategory(item);
      if (cat.toLowerCase() !== filters.kategori.toLowerCase()) {
        return false;
      }
    }

    // Filter bulan 'YYYY-MM'
    if (filters.month && filters.month !== 'all' && !item.tanggal.startsWith(filters.month)) {
      return false;
    }

    // Filter tanggal spesifik
    if (filters.startDate && item.tanggal < filters.startDate) {
      return false;
    }
    if (filters.endDate && item.tanggal > filters.endDate) {
      return false;
    }

    // Filter pencarian
    if (filters.search && filters.search.trim() !== '') {
      const q = filters.search.toLowerCase().trim();
      const inKet = item.keterangan?.toLowerCase().includes(q);
      const inSumber = item.sumber_dana?.toLowerCase().includes(q);
      const inPenerima = item.nama_penerima?.toLowerCase().includes(q);
      const inNominal = item.nominal?.toString().includes(q);
      const inTanggal = item.tanggal?.toLowerCase().includes(q);
      const inKategori = getTransactionCategory(item).toLowerCase().includes(q);
      if (!inKet && !inSumber && !inPenerima && !inNominal && !inTanggal && !inKategori) {
        return false;
      }
    }

    return true;
  });
}

/**
 * Urutkan transaksi berdasarkan tanggal descending (terbaru di atas)
 */
export function sortTransactionsDesc(transactions: Transaction[]): Transaction[] {
  return [...transactions].sort((a, b) => {
    if (b.tanggal === a.tanggal) {
      return (b.id || '').localeCompare(a.id || '');
    }
    return b.tanggal.localeCompare(a.tanggal);
  });
}

/**
 * Validasi form transaksi
 */
export function validateTransactionForm(data: {
  tanggal?: string;
  jenis?: 'penerimaan' | 'pengeluaran';
  nominal?: number;
  sumber_dana?: string;
  nama_penerima?: string;
  keterangan?: string;
}): { valid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {};

  if (!data.tanggal || data.tanggal.trim() === '') {
    errors.tanggal = 'Tanggal transaksi wajib diisi';
  } else if (!/^\d{4}-\d{2}-\d{2}$/.test(data.tanggal)) {
    errors.tanggal = 'Format tanggal harus YYYY-MM-DD';
  }

  if (!data.jenis || (data.jenis !== 'penerimaan' && data.jenis !== 'pengeluaran')) {
    errors.jenis = 'Jenis transaksi harus berupa Penerimaan atau Pengeluaran';
  }

  if (typeof data.nominal !== 'number' || isNaN(data.nominal) || data.nominal <= 0) {
    errors.nominal = 'Nominal harus bernilai angka lebih dari 0';
  }

  if (data.jenis === 'penerimaan') {
    if (!data.sumber_dana || data.sumber_dana.trim() === '') {
      errors.sumber_dana = 'Sumber dana penerimaan wajib diisi';
    }
  }

  if (data.jenis === 'pengeluaran') {
    if (!data.nama_penerima || data.nama_penerima.trim() === '') {
      errors.nama_penerima = 'Nama penerima pengeluaran wajib diisi';
    }
  }

  if (!data.keterangan || data.keterangan.trim().length < 3) {
    errors.keterangan = 'Keterangan transaksi minimal 3 karakter';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Format tanggal Indonesia (Contoh: 14 Mei 2026)
 */
export function formatTanggalIndo(dateStr: string): string {
  if (!dateStr) return '-';
  try {
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    const date = new Date(year, month, day);

    const bulan = [
      'Januari',
      'Februari',
      'Maret',
      'April',
      'Mei',
      'Juni',
      'Juli',
      'Agustus',
      'September',
      'Oktober',
      'November',
      'Desember',
    ];

    return `${day} ${bulan[month]} ${year}`;
  } catch {
    return dateStr;
  }
}

/**
 * Ekstrak daftar bulan unik dari transaksi yang tersedia
 */
export function getAvailableMonths(transactions: Transaction[]): { value: string; label: string }[] {
  const monthsMap = new Map<string, string>();
  const bulanNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  for (const t of transactions) {
    if (t.tanggal && /^\d{4}-\d{2}/.test(t.tanggal)) {
      const ym = t.tanggal.substring(0, 7);
      if (!monthsMap.has(ym)) {
        const [yearStr, monthStr] = ym.split('-');
        const monthIndex = parseInt(monthStr, 10) - 1;
        const monthName = bulanNames[monthIndex] || monthStr;
        monthsMap.set(ym, `${monthName} ${yearStr}`);
      }
    }
  }

  // Jika belum ada transaksi atau hanya ada 1, sediakan bulan haji standar
  if (!monthsMap.has('2026-05')) {
    monthsMap.set('2026-05', 'Mei 2026');
  }
  if (!monthsMap.has('2026-06')) {
    monthsMap.set('2026-06', 'Juni 2026');
  }

  return Array.from(monthsMap.entries())
    .map(([value, label]) => ({ value, label }))
    .sort((a, b) => b.value.localeCompare(a.value));
}

/**
 * Hitung total pengeluaran untuk periode tertentu ('all' atau 'YYYY-MM')
 */
export function calculatePeriodExpenditure(
  transactions: Transaction[],
  period: string = 'all'
): number {
  return transactions
    .filter((t) => {
      if (t.jenis !== 'pengeluaran') return false;
      if (period === 'all') return true;
      return t.tanggal.startsWith(period);
    })
    .reduce((sum, curr) => sum + (Math.abs(Number(curr.nominal)) || 0), 0);
}

/**
 * Menghitung status plafon anggaran pengeluaran
 */
export function calculateBudgetStatus(
  expenditure: number,
  limit: number
): {
  limit: number;
  expenditure: number;
  percentage: number;
  remaining: number;
  isOverBudget: boolean;
  status: 'safe' | 'warning' | 'danger';
  statusLabel: string;
} {
  const safeLimit = Math.max(0, limit || 0);
  const safeExp = Math.max(0, expenditure || 0);

  if (safeLimit === 0) {
    return {
      limit: 0,
      expenditure: safeExp,
      percentage: safeExp > 0 ? 100 : 0,
      remaining: -safeExp,
      isOverBudget: safeExp > 0,
      status: safeExp > 0 ? 'danger' : 'safe',
      statusLabel: safeExp > 0 ? 'Plafon Belum Diatur' : 'Aman',
    };
  }

  const rawPercentage = (safeExp / safeLimit) * 100;
  const percentage = Math.round(rawPercentage * 10) / 10;
  const remaining = safeLimit - safeExp;
  const isOverBudget = remaining < 0;

  let status: 'safe' | 'warning' | 'danger' = 'safe';
  let statusLabel = 'Terkendali (Aman)';

  if (isOverBudget || percentage >= 90) {
    status = 'danger';
    statusLabel = isOverBudget ? 'Melebihi Plafon' : 'Kritis (≥90%)';
  } else if (percentage >= 70) {
    status = 'warning';
    statusLabel = 'Waspada (70-89%)';
  }

  return {
    limit: safeLimit,
    expenditure: safeExp,
    percentage,
    remaining,
    isOverBudget,
    status,
    statusLabel,
  };
}

/**
 * Styling badge kategori transaksi untuk konsistensi visual di seluruh aplikasi
 */
export function getCategoryBadgeColor(category: string): { bg: string; text: string; border: string } {
  switch (category) {
    case 'Obat & Farmasi':
      return { bg: 'bg-violet-500/20', text: 'text-violet-300', border: 'border-violet-500/30' };
    case 'Alkes & Alat Medis':
      return { bg: 'bg-cyan-500/20', text: 'text-cyan-300', border: 'border-cyan-500/30' };
    case 'Seragam & Administrasi':
      return { bg: 'bg-indigo-500/20', text: 'text-indigo-300', border: 'border-indigo-500/30' };
    case 'Logistik & Konsumsi':
      return { bg: 'bg-amber-500/20', text: 'text-amber-300', border: 'border-amber-500/30' };
    case 'Transportasi & Operasional':
      return { bg: 'bg-sky-500/20', text: 'text-sky-300', border: 'border-sky-500/30' };
    case 'BOK / Kemenkes':
      return { bg: 'bg-emerald-500/20', text: 'text-emerald-300', border: 'border-emerald-500/30' };
    case 'Dinkes / Pemda':
      return { bg: 'bg-teal-500/20', text: 'text-teal-300', border: 'border-teal-500/30' };
    case 'BAZNAS & Hibah':
      return { bg: 'bg-yellow-500/20', text: 'text-yellow-300', border: 'border-yellow-500/30' };
    case 'Swadaya Petugas':
      return { bg: 'bg-pink-500/20', text: 'text-pink-300', border: 'border-pink-500/30' };
    default:
      return { bg: 'bg-purple-500/20', text: 'text-purple-300', border: 'border-purple-500/30' };
  }
}


