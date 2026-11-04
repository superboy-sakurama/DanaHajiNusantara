export type UserRole = 'admin' | 'anggota';

export interface User {
  id: string;
  username: string;
  password_hash: string;
  role: UserRole;
  nama_lengkap: string;
  jabatan?: string;
}

export type AuthUser = Omit<User, 'password_hash'>;

export interface SaldoRecord {
  id: string;
  tahun: string;
  saldo_awal_tahun_lalu: number;
  saldo_realtime: number;
  catatan?: string;
  updated_at?: string;
}

export type TransactionType = 'penerimaan' | 'pengeluaran';

export interface Transaction {
  id: string;
  tanggal: string; // YYYY-MM-DD
  jenis: TransactionType;
  nominal: number;
  sumber_dana?: string; // Diisi jika jenis === 'penerimaan'
  nama_penerima?: string; // Diisi jika jenis === 'pengeluaran'
  keterangan: string;
  dibuat_oleh?: string;
  created_at?: string;
}

export interface FinancialSummary {
  saldoAwalTahunLalu: number;
  saldoRealtime: number;
  totalPenerimaan: number;
  totalPengeluaran: number;
  tahun: string;
}

export interface GoogleSheetsConfig {
  sheetId: string;
  clientEmail: string;
  privateKey: string;
  isConfigured: boolean;
  status: 'connected' | 'demo_mode' | 'error';
  lastSynced?: string;
  message?: string;
}

export interface LoginResponse {
  token: string;
  user: AuthUser;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}
