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
