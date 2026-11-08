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

/**
 * Filter data transaksi berdasarkan kriteria
 */
export function filterTransactions(
  transactions: Transaction[],
  filters: {
    jenis?: 'all' | 'penerimaan' | 'pengeluaran';
    search?: string;
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

    // Filter bulan 'YYYY-MM'
    if (filters.month && !item.tanggal.startsWith(filters.month)) {
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
      if (!inKet && !inSumber && !inPenerima && !inNominal) {
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

