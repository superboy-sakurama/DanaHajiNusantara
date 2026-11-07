import { google } from 'googleapis';
import { User, SaldoRecord, Transaction, GoogleSheetsConfig } from '../src/types/index.ts';
import { initialUsers, initialSaldo, initialTransactions } from './seedData.ts';
import { calculateFinancialSummary } from '../src/utils/finance.ts';

// In-Memory store as reliable fallback and local sync cache
let memoryUsers: User[] = [...initialUsers];
let memorySaldo: SaldoRecord = { ...initialSaldo };
let memoryTransactions: Transaction[] = [...initialTransactions];

// Configuration loaded from env or updated at runtime
let config = {
  sheetId: process.env.GOOGLE_SHEET_ID || '',
  apiKey: process.env.GOOGLE_SHEETS_API_KEY || '',
  clientEmail: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || '',
  privateKey: (process.env.GOOGLE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
};

// Error suppression and cooldown to prevent repetitive failing requests
let lastFetchFailedAt = 0;
let lastErrorMessage = '';
const COOLDOWN_MS = 60000; // 60 seconds cooldown after fetch failure

/**
 * Validasi apakah API Key berformat valid (bukan placeholder / private key)
 */
function isValidApiKey(key: string): boolean {
  if (!key) return false;
  const clean = key.trim();
  if (
    clean.startsWith('YOUR_') ||
    clean.startsWith('MY_') ||
    clean.includes('-----BEGIN') ||
    clean.includes('\n') ||
    clean.includes(' ')
  ) {
    return false;
  }
  return clean.length >= 20;
}

/**
 * Validasi apakah Spreadsheet ID berformat valid
 */
function isValidSheetId(id: string): boolean {
  if (!id) return false;
  const clean = id.trim();
  if (clean.startsWith('YOUR_') || clean.startsWith('MY_') || clean.includes(' ') || clean.includes('\n')) {
    return false;
  }
  return clean.length >= 15;
}

/**
 * Deteksi metode autentikasi yang sedang aktif
 */
export function getActiveAuthMethod(): GoogleSheetsConfig['authMethod'] {
  if (isValidApiKey(config.apiKey) && isValidSheetId(config.sheetId)) {
    return 'api_key';
  }
  if (config.clientEmail && config.privateKey && isValidSheetId(config.sheetId)) {
    return 'service_account';
  }
  return 'demo_mode';
}

/**
 * Mendapatkan status konfigurasi Google Sheets
 */
export function getSheetsConfigStatus(): GoogleSheetsConfig {
  const method = getActiveAuthMethod();
  const isConfigured = method !== 'demo_mode';

  let message = 'Mode Data Lokal Aktif (Data tersimpan di server, siap dihubungkan ke Google Sheets)';
  if (method === 'api_key') {
    if (lastErrorMessage) {
      message = `Perhatian Sinkronisasi: ${lastErrorMessage}`;
    } else {
      message = 'Terhubung ke Google Spreadsheet via Google Sheets API v4 (API Key)';
    }
  } else if (method === 'service_account') {
    message = 'Terhubung ke Google Spreadsheet via Google Cloud Service Account';
  }

  return {
    sheetId: isValidSheetId(config.sheetId) ? `${config.sheetId.slice(0, 6)}...${config.sheetId.slice(-4)}` : '',
    apiKey: isValidApiKey(config.apiKey) ? `${config.apiKey.slice(0, 5)}...${config.apiKey.slice(-3)}` : '',
    clientEmail: config.clientEmail ? `${config.clientEmail.slice(0, 8)}...` : '',
    authMethod: method,
    isConfigured,
    status: isConfigured ? (lastErrorMessage ? 'error' : 'connected') : 'demo_mode',
    message,
    lastSynced: new Date().toISOString(),
  };
}

/**
 * Update runtime config
 */
export function updateSheetsConfig(newConfig: {
  sheetId?: string;
  apiKey?: string;
  clientEmail?: string;
  privateKey?: string;
}) {
  if (newConfig.sheetId !== undefined) {
    config.sheetId = newConfig.sheetId.trim();
  }

  if (newConfig.apiKey !== undefined) {
    const rawKey = newConfig.apiKey.trim();
    // Jika user tidak sengaja paste Service Account private key ke kolom API Key, pisahkan secara cerdas
    if (rawKey.includes('-----BEGIN PRIVATE KEY-----')) {
      config.privateKey = rawKey.replace(/\\n/g, '\n');
      config.apiKey = '';
    } else {
      config.apiKey = rawKey;
    }
  }

  if (newConfig.clientEmail !== undefined) {
    config.clientEmail = newConfig.clientEmail.trim();
  }

  if (newConfig.privateKey !== undefined) {
    config.privateKey = newConfig.privateKey.replace(/\\n/g, '\n').trim();
  }

  // Reset error state saat user memperbarui konfigurasi
  lastFetchFailedAt = 0;
  lastErrorMessage = '';
}

/**
 * Reset config kembali ke mode demo data lokal
 */
export function resetSheetsConfig() {
  config.sheetId = '';
  config.apiKey = '';
  config.clientEmail = '';
  config.privateKey = '';
  lastFetchFailedAt = 0;
  lastErrorMessage = '';
}

/**
 * Service Account client (jika tersedia)
 */
function getServiceAccountClient() {
  if (!isValidSheetId(config.sheetId) || !config.clientEmail || !config.privateKey) {
    return null;
  }
  try {
    const auth = new google.auth.JWT({
      email: config.clientEmail,
      key: config.privateKey,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });
    return google.sheets({ version: 'v4', auth });
  } catch {
    return null;
  }
}

/**
 * Fetch data dari Google Sheets API v4 menggunakan API KEY (Direct REST API)
 * Dilengkapi graceful fallback tanpa console warning error
 */
async function fetchSheetValuesWithApiKey(range: string): Promise<any[][] | null> {
  if (!isValidSheetId(config.sheetId) || !isValidApiKey(config.apiKey)) {
    return null;
  }

  // Jika baru saja gagal (cooldown), gunakan data lokal tanpa membebani server/Google API
  if (Date.now() - lastFetchFailedAt < COOLDOWN_MS) {
    return null;
  }

  const url = `https://sheets.googleapis.com/v4/spreadsheets/${config.sheetId}/values/${encodeURIComponent(
    range
  )}?key=${encodeURIComponent(config.apiKey)}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      lastFetchFailedAt = Date.now();
      const errData = await response.json().catch(() => ({}));
      lastErrorMessage =
        errData?.error?.message ||
        `Akses sheet gagal (Status ${response.status}). Pastikan sharing spreadsheet: "Anyone with the link can view".`;
      return null;
    }

    const data = await response.json();
    lastErrorMessage = '';
    lastFetchFailedAt = 0;
    return data.values || [];
  } catch (err: any) {
    lastFetchFailedAt = Date.now();
    lastErrorMessage = err?.message || 'Gangguan koneksi ke Google Sheets API';
    return null;
  }
}

/**
 * Tes koneksi ke Google Spreadsheet secara langsung via Google Sheets API v4
 */
export async function testSheetsConnection(): Promise<{
  success: boolean;
  message: string;
  sheetNames?: string[];
  spreadsheetTitle?: string;
}> {
  // Reset cooldown saat uji coba eksplisit
  lastFetchFailedAt = 0;
  const method = getActiveAuthMethod();

  // 1. Tes koneksi langsung via Google Sheets API v4 (API Key)
  if (method === 'api_key') {
    try {
      const metaUrl = `https://sheets.googleapis.com/v4/spreadsheets/${config.sheetId}?key=${encodeURIComponent(
        config.apiKey
      )}`;
      const res = await fetch(metaUrl);
      const data = await res.json();

      if (!res.ok) {
        const errorMsg =
          data.error?.message ||
          'Pastikan API Key benar dan akses Google Spreadsheet diatur ke: "Siapa saja yang memiliki link dapat melihat"';
        lastErrorMessage = errorMsg;
        lastFetchFailedAt = Date.now();
        return {
          success: false,
          message: `Gagal akses Google Sheets API v4: ${errorMsg}`,
        };
      }

      const sheetNames = data.sheets?.map((s: any) => s.properties?.title || '') || [];
      lastErrorMessage = '';
      lastFetchFailedAt = 0;
      return {
        success: true,
        message: `Koneksi Google Sheets API v4 Berhasil! Terhubung ke dokumen "${data.properties?.title}"`,
        sheetNames,
        spreadsheetTitle: data.properties?.title,
      };
    } catch (err: any) {
      lastFetchFailedAt = Date.now();
      lastErrorMessage = err.message || 'Koneksi gagal';
      return {
        success: false,
        message: `Gagal menghubungi Google Sheets API: ${err.message}`,
      };
    }
  }

  // 2. Tes koneksi via Service Account
  if (method === 'service_account') {
    const client = getServiceAccountClient();
    if (!client) {
      return {
        success: false,
        message: 'Kredensial Service Account belum lengkap atau format kunci tidak valid.',
      };
    }
    try {
      const res = await client.spreadsheets.get({ spreadsheetId: config.sheetId });
      const sheetNames = res.data.sheets?.map((s) => s.properties?.title || '') || [];
      return {
        success: true,
        message: `Berhasil terhubung ke spreadsheet "${res.data.properties?.title || config.sheetId}" via Service Account`,
        sheetNames,
      };
    } catch (err: any) {
      return {
        success: false,
        message: `Gagal mengakses Google Spreadsheet: ${err.message || 'Periksa izin Share ke Service Account'}`,
      };
    }
  }

  return {
    success: false,
    message: 'Belum ada API Key valid yang dikonfigurasi. Aplikasi berjalan dalam mode data lokal.',
  };
}

// ==========================================
// 1. SHEET "USERS"
// ==========================================
export async function getUsersFromStore(): Promise<User[]> {
  const method = getActiveAuthMethod();

  // A. Jika menggunakan API Key langsung (Google Sheets API v4)
  if (method === 'api_key') {
    const rows = await fetchSheetValuesWithApiKey('Users!A2:F');
    if (rows && rows.length > 0) {
      memoryUsers = rows.map((row) => ({
        id: row[0] || `usr-${Date.now()}`,
        username: row[1] || '',
        password_hash: row[2] || '',
        role: (row[3] as 'admin' | 'anggota') || 'anggota',
        nama_lengkap: row[4] || row[1] || 'Petugas',
        jabatan: row[5] || 'Anggota Tim Haji',
      }));
      return memoryUsers;
    }
  }

  // B. Jika menggunakan Service Account
  const client = getServiceAccountClient();
  if (client) {
    try {
      const response = await client.spreadsheets.values.get({
        spreadsheetId: config.sheetId,
        range: 'Users!A2:F',
      });
      const rows = response.data.values;
      if (rows && rows.length > 0) {
        memoryUsers = rows.map((row) => ({
          id: row[0] || `usr-${Date.now()}`,
          username: row[1] || '',
          password_hash: row[2] || '',
          role: (row[3] as 'admin' | 'anggota') || 'anggota',
          nama_lengkap: row[4] || row[1] || 'Petugas',
          jabatan: row[5] || 'Anggota Tim Haji',
        }));
        return memoryUsers;
      }
    } catch {
      // Fallback to local memory silently
    }
  }

  return memoryUsers;
}

// ==========================================
// 2. SHEET "SALDO"
// ==========================================
export async function getSaldoFromStore(): Promise<SaldoRecord> {
  const summary = calculateFinancialSummary(memorySaldo.saldo_awal_tahun_lalu, memoryTransactions, memorySaldo.tahun);
  memorySaldo.saldo_realtime = summary.saldoRealtime;

  const method = getActiveAuthMethod();

  // A. Jika menggunakan API Key langsung (Google Sheets API v4)
  if (method === 'api_key') {
    const rows = await fetchSheetValuesWithApiKey('Saldo!A2:E2');
    if (rows && rows.length > 0) {
      const row = rows[0];
      const saldoAwal = Number(row[2]) || memorySaldo.saldo_awal_tahun_lalu;
      const calculatedRealtime = saldoAwal + summary.totalPenerimaan - summary.totalPengeluaran;

      memorySaldo = {
        id: row[0] || 'sld-2026',
        tahun: row[1] || '1447 H / 2026 M',
        saldo_awal_tahun_lalu: saldoAwal,
        saldo_realtime: calculatedRealtime,
        catatan: row[4] || memorySaldo.catatan,
        updated_at: new Date().toISOString(),
      };
      return memorySaldo;
    }
  }

  // B. Jika menggunakan Service Account
  const client = getServiceAccountClient();
  if (client) {
    try {
      const response = await client.spreadsheets.values.get({
        spreadsheetId: config.sheetId,
        range: 'Saldo!A2:E2',
      });
      const rows = response.data.values;
      if (rows && rows.length > 0) {
        const row = rows[0];
        const saldoAwal = Number(row[2]) || memorySaldo.saldo_awal_tahun_lalu;
        const calculatedRealtime = saldoAwal + summary.totalPenerimaan - summary.totalPengeluaran;

        memorySaldo = {
          id: row[0] || 'sld-2026',
          tahun: row[1] || '1447 H / 2026 M',
          saldo_awal_tahun_lalu: saldoAwal,
          saldo_realtime: calculatedRealtime,
          catatan: row[4] || memorySaldo.catatan,
          updated_at: new Date().toISOString(),
        };
      }
    } catch {
      // Fallback to local memory silently
    }
  }

  return memorySaldo;
}

export async function updateSaldoInStore(payload: {
  saldo_awal_tahun_lalu: number;
  tahun?: string;
  catatan?: string;
}): Promise<SaldoRecord> {
  memorySaldo.saldo_awal_tahun_lalu = Number(payload.saldo_awal_tahun_lalu) || 0;
  if (payload.tahun) memorySaldo.tahun = payload.tahun;
  if (payload.catatan !== undefined) memorySaldo.catatan = payload.catatan;
  memorySaldo.updated_at = new Date().toISOString();

  const summary = calculateFinancialSummary(memorySaldo.saldo_awal_tahun_lalu, memoryTransactions, memorySaldo.tahun);
  memorySaldo.saldo_realtime = summary.saldoRealtime;

  // Jika Service Account aktif
  const client = getServiceAccountClient();
  if (client) {
    try {
      await client.spreadsheets.values.update({
        spreadsheetId: config.sheetId,
        range: 'Saldo!A2:F2',
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [
            [
              memorySaldo.id,
              memorySaldo.tahun,
              memorySaldo.saldo_awal_tahun_lalu,
              memorySaldo.saldo_realtime,
              memorySaldo.catatan || '',
              memorySaldo.updated_at,
            ],
          ],
        },
      });
    } catch {
      // Keep local update
    }
  }

  return memorySaldo;
}

// ==========================================
// 3. SHEET "TRANSAKSI"
// ==========================================
export async function getTransactionsFromStore(): Promise<Transaction[]> {
  const method = getActiveAuthMethod();

  // A. Jika menggunakan API Key langsung (Google Sheets API v4)
  if (method === 'api_key') {
    const rows = await fetchSheetValuesWithApiKey('Transaksi!A2:I');
    if (rows && rows.length > 0) {
      memoryTransactions = rows.map((row) => ({
        id: row[0] || `TRX-${Date.now()}`,
        tanggal: row[1] || new Date().toISOString().split('T')[0],
        jenis: (row[2] as 'penerimaan' | 'pengeluaran') || 'penerimaan',
        nominal: Number(row[3]) || 0,
        sumber_dana: row[4] || '',
        nama_penerima: row[5] || '',
        keterangan: row[6] || '',
        dibuat_oleh: row[7] || '',
        created_at: row[8] || new Date().toISOString(),
      }));
      return memoryTransactions;
    }
  }

  // B. Jika menggunakan Service Account
  const client = getServiceAccountClient();
  if (client) {
    try {
      const response = await client.spreadsheets.values.get({
        spreadsheetId: config.sheetId,
        range: 'Transaksi!A2:I',
      });
      const rows = response.data.values;
      if (rows && rows.length > 0) {
        memoryTransactions = rows.map((row) => ({
          id: row[0] || `TRX-${Date.now()}`,
          tanggal: row[1] || new Date().toISOString().split('T')[0],
          jenis: (row[2] as 'penerimaan' | 'pengeluaran') || 'penerimaan',
          nominal: Number(row[3]) || 0,
          sumber_dana: row[4] || '',
          nama_penerima: row[5] || '',
          keterangan: row[6] || '',
          dibuat_oleh: row[7] || '',
          created_at: row[8] || new Date().toISOString(),
        }));
        return memoryTransactions;
      }
    } catch {
      // Fallback to local memory silently
    }
  }

  return memoryTransactions;
}

export async function addTransactionToStore(trx: Omit<Transaction, 'id' | 'created_at'>): Promise<Transaction> {
  const newId = `TRX-${new Date().getFullYear()}-${String(memoryTransactions.length + 1).padStart(3, '0')}-${Date.now().toString().slice(-4)}`;
  const newTrx: Transaction = {
    ...trx,
    id: newId,
    created_at: new Date().toISOString(),
  };

  memoryTransactions.unshift(newTrx);

  const summary = calculateFinancialSummary(memorySaldo.saldo_awal_tahun_lalu, memoryTransactions, memorySaldo.tahun);
  memorySaldo.saldo_realtime = summary.saldoRealtime;

  // Jika Service Account aktif
  const client = getServiceAccountClient();
  if (client) {
    try {
      await client.spreadsheets.values.append({
        spreadsheetId: config.sheetId,
        range: 'Transaksi!A:I',
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [
            [
              newTrx.id,
              newTrx.tanggal,
              newTrx.jenis,
              newTrx.nominal,
              newTrx.sumber_dana || '',
              newTrx.nama_penerima || '',
              newTrx.keterangan,
              newTrx.dibuat_oleh || 'Petugas Haji',
              newTrx.created_at,
            ],
          ],
        },
      });
    } catch {
      // Keep local addition
    }
  }

  return newTrx;
}

export async function updateTransactionInStore(
  id: string,
  updatedFields: Partial<Transaction>
): Promise<Transaction | null> {
  const index = memoryTransactions.findIndex((t) => t.id === id);
  if (index === -1) return null;

  const existing = memoryTransactions[index];
  const updated: Transaction = {
    ...existing,
    ...updatedFields,
    id: existing.id,
  };
  memoryTransactions[index] = updated;

  const summary = calculateFinancialSummary(memorySaldo.saldo_awal_tahun_lalu, memoryTransactions, memorySaldo.tahun);
  memorySaldo.saldo_realtime = summary.saldoRealtime;

  // Sync to Service Account if active
  const client = getServiceAccountClient();
  if (client) {
    try {
      const values = memoryTransactions.map((t) => [
        t.id,
        t.tanggal,
        t.jenis,
        t.nominal,
        t.sumber_dana || '',
        t.nama_penerima || '',
        t.keterangan,
        t.dibuat_oleh || '',
        t.created_at || '',
      ]);
      await client.spreadsheets.values.update({
        spreadsheetId: config.sheetId,
        range: `Transaksi!A2:I${values.length + 1}`,
        valueInputOption: 'USER_ENTERED',
        requestBody: { values },
      });
    } catch {
      // Keep local update
    }
  }

  return updated;
}

export async function deleteTransactionFromStore(id: string): Promise<boolean> {
  const initialLen = memoryTransactions.length;
  memoryTransactions = memoryTransactions.filter((t) => t.id !== id);

  if (memoryTransactions.length === initialLen) {
    return false;
  }

  const summary = calculateFinancialSummary(memorySaldo.saldo_awal_tahun_lalu, memoryTransactions, memorySaldo.tahun);
  memorySaldo.saldo_realtime = summary.saldoRealtime;

  // Sync to Service Account if active
  const client = getServiceAccountClient();
  if (client) {
    try {
      await client.spreadsheets.values.clear({
        spreadsheetId: config.sheetId,
        range: 'Transaksi!A2:I1000',
      });

      if (memoryTransactions.length > 0) {
        const values = memoryTransactions.map((t) => [
          t.id,
          t.tanggal,
          t.jenis,
          t.nominal,
          t.sumber_dana || '',
          t.nama_penerima || '',
          t.keterangan,
          t.dibuat_oleh || '',
          t.created_at || '',
        ]);
        await client.spreadsheets.values.update({
          spreadsheetId: config.sheetId,
          range: `Transaksi!A2:I${values.length + 1}`,
          valueInputOption: 'USER_ENTERED',
          requestBody: { values },
        });
      }
    } catch {
      // Keep local delete
    }
  }

  return true;
}
