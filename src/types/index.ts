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
  kategori?: string; // Kategori pengeluaran/penerimaan
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

export interface BudgetStatus {
  limit: number;
  expenditure: number;
  percentage: number;
  remaining: number;
  isOverBudget: boolean;
  status: 'safe' | 'warning' | 'danger';
  statusLabel: string;
}

export interface BudgetPeriod {
  value: string; // 'all' or 'YYYY-MM'
  label: string;
}

export interface SheetsTestResult {
  success: boolean;
  message: string;
  errorType?:
    | 'INVALID_API_KEY'
    | 'SERVICE_ACCOUNT_KEY_ID_DETECTED'
    | 'PERMISSION_DENIED'
    | 'API_NOT_ENABLED'
    | 'SHEET_NOT_FOUND'
    | 'MISSING_SHEETS'
    | 'NETWORK_ERROR'
    | 'UNKNOWN';
  suggestions?: string[];
  sheetNames?: string[];
  spreadsheetTitle?: string;
  foundExpectedSheets?: {
    users: boolean;
    saldo: boolean;
    transaksi: boolean;
  };
}

export interface SheetsBootstrapResult {
  success: boolean;
  message: string;
  createdSheets: string[];
  alreadyExisted: string[];
  initializedHeaders: string[];
  method: 'service_account' | 'api_key' | 'demo_mode';
}

export interface GoogleSheetsConfig {
  sheetId: string;
  apiKey?: string;
  clientEmail?: string;
  authMethod: 'api_key' | 'service_account' | 'demo_mode';
  isConfigured: boolean;
  status: 'connected' | 'demo_mode' | 'error';
  lastSynced?: string;
  message?: string;
  errorType?: string;
  suggestions?: string[];
  spreadsheetTitle?: string;
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
