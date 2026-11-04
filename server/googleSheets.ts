import { google } from 'googleapis';
import { User, SaldoRecord, Transaction } from '../src/types/index.ts';
import { initialUsers, initialSaldo, initialTransactions } from './seedData.ts';
import { calculateFinancialSummary } from '../src/utils/finance.ts';

// In-Memory store as immediate reliable fallback and cache
let memoryUsers: User[] = [...initialUsers];
let memorySaldo: SaldoRecord = { ...initialSaldo };
let memoryTransactions: Transaction[] = [...initialTransactions];

// Configurable credentials (from env or runtime config)
let config = {
  sheetId: process.env.GOOGLE_SHEET_ID || '',
  clientEmail: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || '',
  privateKey: (process.env.GOOGLE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
};

/**
 * Mendapatkan instance Google Sheets API dengan autentikasi Service Account
 */
function getSheetsClient() {
  if (!config.sheetId || !config.clientEmail || !config.privateKey) {
    return null;
  }

  const auth = new google.auth.JWT({
    email: config.clientEmail,
    key: config.privateKey,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  return google.sheets({ version: 'v4', auth });
}

export function getSheetsConfigStatus() {
  const isConfigured = Boolean(config.sheetId && config.clientEmail && config.privateKey);
  return {
    isConfigured,
    sheetId: config.sheetId ? `${config.sheetId.slice(0, 6)}...${config.sheetId.slice(-4)}` : '',
    clientEmail: config.clientEmail ? `${config.clientEmail.slice(0, 8)}...` : '',
    status: isConfigured ? ('connected' as const) : ('demo_mode' as const),
    message: isConfigured
      ? 'Terhubung dengan Google Spreadsheet via Google Sheets API (Service Account)'
      : 'Mode Demo Lokal Aktif (Data tersimpan di server, siap dihubungkan ke Google Sheets API)',
  };
}

export function updateSheetsConfig(newConfig: { sheetId?: string; clientEmail?: string; privateKey?: string }) {
  if (newConfig.sheetId !== undefined) config.sheetId = newConfig.sheetId.trim();
  if (newConfig.clientEmail !== undefined) config.clientEmail = newConfig.clientEmail.trim();
  if (newConfig.privateKey !== undefined) {
    config.privateKey = newConfig.privateKey.replace(/\\n/g, '\n').trim();
  }
}

/**
 * Tes koneksi ke Google Spreadsheet
 */
export async function testSheetsConnection(): Promise<{ success: boolean; message: string; sheetNames?: string[] }> {
  const client = getSheetsClient();
  if (!client) {
    return {
      success: false,
      message: 'Kredensial Service Account atau ID Spreadsheet belum dikonfigurasi lengkap.',
    };
  }

  try {
    const res = await client.spreadsheets.get({
      spreadsheetId: config.sheetId,
    });
    const sheetNames = res.data.sheets?.map((s) => s.properties?.title || '') || [];
    return {
      success: true,
      message: `Berhasil terhubung ke spreadsheet "${res.data.properties?.title || config.sheetId}"`,
      sheetNames,
    };
  } catch (err: any) {
    return {
      success: false,
      message: `Gagal mengakses Google Spreadsheet: ${err.message || 'Periksa izin Share ke Service Account'}`,
    };
  }
}

// ==========================================
// 1. SHEET "USERS"
// ==========================================
export async function getUsersFromStore(): Promise<User[]> {
  const client = getSheetsClient();
  if (!client) return memoryUsers;

  try {
    const response = await client.spreadsheets.values.get({
      spreadsheetId: config.sheetId,
      range: 'Users!A2:F',
    });
    const rows = response.data.values;
    if (!rows || rows.length === 0) return memoryUsers;

    const users: User[] = rows.map((row) => ({
      id: row[0] || `usr-${Date.now()}`,
      username: row[1] || '',
      password_hash: row[2] || '',
      role: (row[3] as 'admin' | 'anggota') || 'anggota',
      nama_lengkap: row[4] || row[1] || 'Petugas',
      jabatan: row[5] || 'Anggota Tim Haji',
    }));

    memoryUsers = users;
    return users;
  } catch (error) {
    console.warn('Sheets API read Users failed, using fallback:', error);
    return memoryUsers;
  }
}

// ==========================================
// 2. SHEET "SALDO"
// ==========================================
export async function getSaldoFromStore(): Promise<SaldoRecord> {
  // Update realtime balance based on current transactions
  const summary = calculateFinancialSummary(memorySaldo.saldo_awal_tahun_lalu, memoryTransactions, memorySaldo.tahun);
  memorySaldo.saldo_realtime = summary.saldoRealtime;

  const client = getSheetsClient();
  if (!client) return memorySaldo;

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
    return memorySaldo;
  } catch (error) {
    console.warn('Sheets API read Saldo failed, using fallback:', error);
    return memorySaldo;
  }
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

  // Re-calculate realtime balance
  const summary = calculateFinancialSummary(memorySaldo.saldo_awal_tahun_lalu, memoryTransactions, memorySaldo.tahun);
  memorySaldo.saldo_realtime = summary.saldoRealtime;

  const client = getSheetsClient();
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
    } catch (err) {
      console.error('Sheets API write Saldo failed:', err);
    }
  }

  return memorySaldo;
}

// ==========================================
// 3. SHEET "TRANSAKSI"
// ==========================================
export async function getTransactionsFromStore(): Promise<Transaction[]> {
  const client = getSheetsClient();
  if (!client) return memoryTransactions;

  try {
    const response = await client.spreadsheets.values.get({
      spreadsheetId: config.sheetId,
      range: 'Transaksi!A2:I',
    });
    const rows = response.data.values;
    if (!rows || rows.length === 0) return memoryTransactions;

    const list: Transaction[] = rows.map((row) => ({
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

    memoryTransactions = list;
    return list;
  } catch (error) {
    console.warn('Sheets API read Transaksi failed, using fallback:', error);
    return memoryTransactions;
  }
}

export async function addTransactionToStore(trx: Omit<Transaction, 'id' | 'created_at'>): Promise<Transaction> {
  const newId = `TRX-${new Date().getFullYear()}-${String(memoryTransactions.length + 1).padStart(3, '0')}-${Date.now().toString().slice(-4)}`;
  const newTrx: Transaction = {
    ...trx,
    id: newId,
    created_at: new Date().toISOString(),
  };

  memoryTransactions.unshift(newTrx);

  // Update saldo realtime
  const summary = calculateFinancialSummary(memorySaldo.saldo_awal_tahun_lalu, memoryTransactions, memorySaldo.tahun);
  memorySaldo.saldo_realtime = summary.saldoRealtime;

  const client = getSheetsClient();
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
    } catch (err) {
      console.error('Sheets API append Transaksi failed:', err);
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
    id: existing.id, // prevent ID overwrite
  };
  memoryTransactions[index] = updated;

  // Re-calculate saldo
  const summary = calculateFinancialSummary(memorySaldo.saldo_awal_tahun_lalu, memoryTransactions, memorySaldo.tahun);
  memorySaldo.saldo_realtime = summary.saldoRealtime;

  // If connected to Google Sheets, sync all rows
  const client = getSheetsClient();
  if (client) {
    try {
      // Find row index or rewrite data range
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
    } catch (err) {
      console.error('Sheets API update Transaksi failed:', err);
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

  // Re-calculate saldo
  const summary = calculateFinancialSummary(memorySaldo.saldo_awal_tahun_lalu, memoryTransactions, memorySaldo.tahun);
  memorySaldo.saldo_realtime = summary.saldoRealtime;

  // Update Google Sheets if connected
  const client = getSheetsClient();
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
    } catch (err) {
      console.error('Sheets API clear & update after delete failed:', err);
    }
  }

  return true;
}
