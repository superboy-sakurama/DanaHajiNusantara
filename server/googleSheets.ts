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
// Error suppression and cooldown to prevent repetitive failing requests
let lastFetchFailedAt = 0;
let lastErrorMessage = '';
let lastErrorType = '';
let lastSuggestions: string[] = [];
let lastSpreadsheetTitle = '';
let verifiedConnected = false;
const COOLDOWN_MS = 30000; // 30 seconds cooldown after fetch failure

/**
 * Ekstrak Spreadsheet ID dari format URL atau string ID mentah
 */
export function extractSheetId(input: string): string {
  if (!input) return '';
  const clean = input.trim();
  const match = clean.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (match && match[1]) {
    return match[1];
  }
  return clean;
}

/**
 * Deteksi apakah sebuah string merupakan Key ID heksadesimal dari Service Account
 * (Biasanya 32-45 karakter hex seperti 0d909848fae32a67e15a... yang sering salah disalin sebagai API Key)
 */
export function isHexKeyId(str: string): boolean {
  if (!str) return false;
  const clean = str.trim();
  return /^[0-9a-f]{32,45}$/i.test(clean);
}

/**
 * Validasi apakah API Key berformat Google Cloud API Key
 * Google API Key standar diawali dengan 'AIza' dan sekitar 39 karakter
 */
export function isGoogleApiKey(key: string): boolean {
  if (!key) return false;
  const clean = key.trim();
  return clean.startsWith('AIza') && clean.length >= 30;
}

/**
 * Validasi apakah API Key memenuhi syarat dasar
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
  const clean = extractSheetId(id);
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
 * Mendapatkan status konfigurasi Google Sheets dengan detail diagnostik lengkap
 */
export function getSheetsConfigStatus(): GoogleSheetsConfig {
  const method = getActiveAuthMethod();
  const isConfigured = method !== 'demo_mode';

  let status: 'connected' | 'demo_mode' | 'error' = 'demo_mode';
  let message = 'Mode Data Lokal Aktif (Data tersimpan di server, siap dihubungkan ke Google Sheets)';

  if (isConfigured) {
    if (lastErrorMessage) {
      status = 'error';
      message = lastErrorMessage;
    } else if (verifiedConnected) {
      status = 'connected';
      message =
        method === 'api_key'
          ? `Terhubung ke Google Spreadsheet "${lastSpreadsheetTitle || 'Aktif'}" via Google Sheets API v4 (API Key)`
          : `Terhubung ke Google Spreadsheet "${lastSpreadsheetTitle || 'Aktif'}" via Service Account`;
    } else {
      // Terkonfigurasi tetapi belum ditest
      status = 'connected';
      message =
        method === 'api_key'
          ? 'Kredensial API Key terpasang. Klik tombol "Tes Koneksi" untuk memverifikasi izin baca Google Sheets.'
          : 'Kredensial Service Account terpasang. Klik "Tes Koneksi" untuk memverifikasi.';
    }
  }

  const cleanSheetId = extractSheetId(config.sheetId);

  return {
    sheetId: isValidSheetId(cleanSheetId) ? `${cleanSheetId.slice(0, 6)}...${cleanSheetId.slice(-4)}` : '',
    apiKey: isValidApiKey(config.apiKey) ? `${config.apiKey.slice(0, 5)}...${config.apiKey.slice(-3)}` : '',
    clientEmail: config.clientEmail ? `${config.clientEmail.slice(0, 8)}...` : '',
    authMethod: method,
    isConfigured,
    status,
    message,
    errorType: lastErrorType || undefined,
    suggestions: lastSuggestions.length > 0 ? lastSuggestions : undefined,
    spreadsheetTitle: lastSpreadsheetTitle || undefined,
    lastSynced: new Date().toISOString(),
  };
}

/**
 * Update runtime config dengan parsing cerdas (ekstrak URL & auto-detect JSON Service Account)
 */
export function updateSheetsConfig(newConfig: {
  sheetId?: string;
  apiKey?: string;
  clientEmail?: string;
  privateKey?: string;
}) {
  if (newConfig.sheetId !== undefined) {
    config.sheetId = extractSheetId(newConfig.sheetId);
  }

  // Cek apakah ada JSON Service Account yang ditempelkan
  const possibleJson = newConfig.apiKey || newConfig.privateKey || '';
  if (possibleJson.trim().startsWith('{') && possibleJson.includes('client_email')) {
    try {
      const parsed = JSON.parse(possibleJson);
      if (parsed.client_email && parsed.private_key) {
        config.clientEmail = parsed.client_email;
        config.privateKey = parsed.private_key.replace(/\\n/g, '\n');
        config.apiKey = '';
      }
    } catch {
      // Abaikan jika bukan JSON valid
    }
  }

  if (newConfig.apiKey !== undefined && !newConfig.apiKey.trim().startsWith('{')) {
    const rawKey = newConfig.apiKey.trim();
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

  if (newConfig.privateKey !== undefined && !newConfig.privateKey.trim().startsWith('{')) {
    config.privateKey = newConfig.privateKey.replace(/\\n/g, '\n').trim();
  }

  // Reset status verifikasi saat user memperbarui konfigurasi
  lastFetchFailedAt = 0;
  lastErrorMessage = '';
  lastErrorType = '';
  lastSuggestions = [];
  verifiedConnected = false;
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
  lastErrorType = '';
  lastSuggestions = [];
  lastSpreadsheetTitle = '';
  verifiedConnected = false;
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
  const cleanId = extractSheetId(config.sheetId);
  if (!isValidSheetId(cleanId) || !isValidApiKey(config.apiKey)) {
    return null;
  }

  // Jika kunci adalah Hex Key ID Service Account, jangan kirim agar tidak memicu error 400
  if (isHexKeyId(config.apiKey)) {
    return null;
  }

  // Jika baru saja gagal (cooldown), gunakan data lokal tanpa membebani server/Google API
  if (Date.now() - lastFetchFailedAt < COOLDOWN_MS) {
    return null;
  }

  const url = `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(cleanId)}/values/${encodeURIComponent(
    range
  )}?key=${encodeURIComponent(config.apiKey)}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      lastFetchFailedAt = Date.now();
      const errData = await response.json().catch(() => ({}));
      const rawMsg = errData?.error?.message || `HTTP ${response.status}`;
      if (response.status === 403 || rawMsg.includes('PERMISSION_DENIED') || rawMsg.includes('permission')) {
        lastErrorType = 'PERMISSION_DENIED';
        lastErrorMessage = 'Akses Google Spreadsheet Ditolak: Dokumen belum dibuka untuk publik.';
        lastSuggestions = [
          'Buka file Google Spreadsheet Anda di browser.',
          'Klik tombol "Bagikan" (Share) di pojok kanan atas.',
          'Pada bagian "Akses umum" (General access), ubah dari "Dibatasi" menjadi "Siapa saja yang memiliki link dapat melihat" (Viewer).',
        ];
      } else if (response.status === 400 || rawMsg.includes('API key not valid')) {
        lastErrorType = 'INVALID_API_KEY';
        lastErrorMessage = 'API Key ditolak oleh Google Cloud: Kunci tidak valid atau tidak terdaftar.';
        lastSuggestions = [
          'Pastikan menyalin API Key dari menu Google Cloud Credentials (diawali AIzaSy...).',
        ];
      } else {
        lastErrorMessage = rawMsg;
        lastErrorType = 'UNKNOWN';
      }
      verifiedConnected = false;
      return null;
    }

    const data = await response.json();
    lastErrorMessage = '';
    lastErrorType = '';
    verifiedConnected = true;
    lastFetchFailedAt = 0;
    return data.values || [];
  } catch (err: any) {
    lastFetchFailedAt = Date.now();
    lastErrorType = 'NETWORK_ERROR';
    lastErrorMessage = err?.message || 'Gangguan koneksi ke Google Sheets API';
    verifiedConnected = false;
    return null;
  }
}

/**
 * Tes koneksi ke Google Spreadsheet secara komprehensif dengan diagnosa kesalahan ramah pengguna
 */
export async function testSheetsConnection(): Promise<{
  success: boolean;
  message: string;
  errorType?: string;
  suggestions?: string[];
  sheetNames?: string[];
  spreadsheetTitle?: string;
  foundExpectedSheets?: {
    users: boolean;
    saldo: boolean;
    transaksi: boolean;
  };
}> {
  // Reset cooldown saat uji coba eksplisit
  lastFetchFailedAt = 0;
  config.sheetId = extractSheetId(config.sheetId);
  const method = getActiveAuthMethod();

  // A. Pengecekan awal: apakah user keliru memasukkan Key ID Service Account ke kolom API Key?
  if (config.apiKey && isHexKeyId(config.apiKey)) {
    const masked = `${config.apiKey.slice(0, 5)}...${config.apiKey.slice(-3)}`;
    const msg = `Kunci yang dimasukkan (${masked}) berformat Hexadecimal. Ini adalah Key ID Service Account, bukan Google Cloud API Key.`;
    lastErrorMessage = msg;
    lastErrorType = 'SERVICE_ACCOUNT_KEY_ID_DETECTED';
    lastSuggestions = [
      'Google Cloud API Key resmi selalu diawali dengan "AIzaSy..." (39 karakter).',
      'Buka Google Cloud Console > APIs & Services > Credentials > Create Credentials > API Key.',
      'Jika Anda memiliki file JSON Service Account lengkap, Anda dapat menempelkannya di tab "Service Account".',
    ];
    verifiedConnected = false;
    return {
      success: false,
      message: msg,
      errorType: 'SERVICE_ACCOUNT_KEY_ID_DETECTED',
      suggestions: lastSuggestions,
    };
  }

  // B. Pengecekan jika belum ada konfigurasi
  if (method === 'demo_mode') {
    return {
      success: false,
      message: 'Belum ada Google Spreadsheet ID atau API Key / Service Account yang dikonfigurasi.',
      errorType: 'UNKNOWN',
      suggestions: [
        'Buka tab "Pengaturan" lalu masukkan Spreadsheet ID dan Google Cloud API Key.',
        'Atau tetap gunakan mode data lokal aplikasi yang sudah siap pakai.',
      ],
    };
  }

  // 1. Tes koneksi langsung via Google Sheets API v4 (API Key)
  if (method === 'api_key') {
    try {
      const metaUrl = `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(
        config.sheetId
      )}?key=${encodeURIComponent(config.apiKey)}`;
      const res = await fetch(metaUrl);
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        verifiedConnected = false;
        lastFetchFailedAt = Date.now();
        const rawMsg = data.error?.message || `HTTP ${res.status}`;
        const rawStatus = data.error?.status || '';

        // Klasifikasi error secara spesifik dan ramah
        if (rawMsg.includes('API key not valid') || rawStatus === 'INVALID_ARGUMENT') {
          lastErrorType = 'INVALID_API_KEY';
          lastErrorMessage = 'API Key ditolak oleh Google Cloud: Kunci tidak valid atau tidak terdaftar.';
          lastSuggestions = [
            'Pastikan Anda menyalin API Key dari menu Google Cloud Console > APIs & Services > Credentials.',
            'Kunci API resmi Google diawali dengan huruf "AIzaSy..." (panjang 39 karakter).',
            'Jangan gunakan Key ID (format heksadesimal) dari Service Account.',
          ];
        } else if (
          rawMsg.includes('has not been used') ||
          rawMsg.includes('is disabled') ||
          rawMsg.includes('Sheets API has not been used')
        ) {
          lastErrorType = 'API_NOT_ENABLED';
          lastErrorMessage = 'Google Sheets API belum diaktifkan pada proyek Google Cloud Anda.';
          lastSuggestions = [
            'Buka Google Cloud Console > APIs & Services > Library.',
            'Cari "Google Sheets API" lalu klik tombol "Enable" (Aktifkan).',
            'Tunggu sekitar 1 menit agar aktivasi berlaku, kemudian klik "Tes Koneksi" kembali.',
          ];
        } else if (
          rawMsg.includes('The caller does not have permission') ||
          rawMsg.includes('PERMISSION_DENIED') ||
          res.status === 403
        ) {
          lastErrorType = 'PERMISSION_DENIED';
          lastErrorMessage = 'Akses Google Spreadsheet Ditolak: Dokumen belum dibuka untuk publik.';
          lastSuggestions = [
            'Buka file Google Spreadsheet Anda di browser.',
            'Klik tombol "Bagikan" (Share) di pojok kanan atas.',
            'Pada bagian "Akses umum" (General access), ubah dari "Dibatasi" menjadi "Siapa saja yang memiliki link dapat melihat" (Viewer).',
          ];
        } else if (res.status === 404 || rawMsg.includes('not found') || rawStatus === 'NOT_FOUND') {
          lastErrorType = 'SHEET_NOT_FOUND';
          lastErrorMessage = 'Dokumen Google Spreadsheet tidak ditemukan (404 Not Found).';
          lastSuggestions = [
            'Periksa kembali Spreadsheet ID Anda.',
            'Salin ID yang benar dari URL spreadsheet di antara "/d/" dan "/edit".',
          ];
        } else {
          lastErrorType = 'UNKNOWN';
          lastErrorMessage = `Gagal akses Google Sheets API: ${rawMsg}`;
          lastSuggestions = [
            'Periksa koneksi internet server dan pastikan pengaturan Google Cloud Anda sudah benar.',
          ];
        }

        return {
          success: false,
          message: lastErrorMessage,
          errorType: lastErrorType,
          suggestions: lastSuggestions,
        };
      }

      // Berhasil terhubung! Lakukan audit lembar kerja
      const sheetTitles: string[] = (data.sheets || []).map((s: any) => s.properties?.title || '');
      const spreadsheetTitle = data.properties?.title || 'Dokumen Keuangan Haji Puskesmas';
      lastSpreadsheetTitle = spreadsheetTitle;

      const hasUsers = sheetTitles.some((t) => t.trim().toLowerCase() === 'users');
      const hasSaldo = sheetTitles.some((t) => t.trim().toLowerCase() === 'saldo');
      const hasTransaksi = sheetTitles.some((t) => t.trim().toLowerCase() === 'transaksi');

      verifiedConnected = true;
      lastErrorMessage = '';
      lastErrorType = '';
      lastSuggestions = [];

      const missing: string[] = [];
      if (!hasUsers) missing.push('"Users"');
      if (!hasSaldo) missing.push('"Saldo"');
      if (!hasTransaksi) missing.push('"Transaksi"');

      let successMsg = `Koneksi Berhasil! Terhubung ke spreadsheet "${spreadsheetTitle}" via Google Sheets API v4.`;
      const suggestions: string[] = [];
      if (missing.length > 0) {
        successMsg += ` Catatan: Lembar kerja ${missing.join(', ')} belum dibuat di spreadsheet.`;
        suggestions.push(
          `Buka spreadsheet dan buat lembar baru dengan nama ${missing.join(', ')} sesuai panduan di tab "3 Sheet".`
        );
      }

      return {
        success: true,
        message: successMsg,
        sheetNames: sheetTitles,
        spreadsheetTitle,
        foundExpectedSheets: {
          users: hasUsers,
          saldo: hasSaldo,
          transaksi: hasTransaksi,
        },
        suggestions: suggestions.length > 0 ? suggestions : undefined,
      };
    } catch (err: any) {
      verifiedConnected = false;
      lastFetchFailedAt = Date.now();
      lastErrorType = 'NETWORK_ERROR';
      lastErrorMessage = `Gagal menghubungi Google Sheets API: ${err?.message || 'Gangguan jaringan'}`;
      lastSuggestions = ['Pastikan server dapat mengakses endpoint https://sheets.googleapis.com'];
      return {
        success: false,
        message: lastErrorMessage,
        errorType: 'NETWORK_ERROR',
        suggestions: lastSuggestions,
      };
    }
  }

  // 2. Tes koneksi via Service Account
  if (method === 'service_account') {
    const client = getServiceAccountClient();
    if (!client) {
      lastErrorType = 'UNKNOWN';
      lastErrorMessage = 'Kredensial Service Account belum lengkap atau format Private Key salah.';
      lastSuggestions = [
        'Pastikan Client Email dan Private Key diisi lengkap.',
        'Private Key harus berformat PEM valid (diawali -----BEGIN PRIVATE KEY-----).',
      ];
      verifiedConnected = false;
      return {
        success: false,
        message: lastErrorMessage,
        errorType: 'UNKNOWN',
        suggestions: lastSuggestions,
      };
    }

    try {
      const res = await client.spreadsheets.get({ spreadsheetId: config.sheetId });
      const sheetTitles = res.data.sheets?.map((s) => s.properties?.title || '') || [];
      const spreadsheetTitle = res.data.properties?.title || config.sheetId;
      lastSpreadsheetTitle = spreadsheetTitle;

      const hasUsers = sheetTitles.some((t) => t.trim().toLowerCase() === 'users');
      const hasSaldo = sheetTitles.some((t) => t.trim().toLowerCase() === 'saldo');
      const hasTransaksi = sheetTitles.some((t) => t.trim().toLowerCase() === 'transaksi');

      verifiedConnected = true;
      lastErrorMessage = '';
      lastErrorType = '';
      lastSuggestions = [];

      return {
        success: true,
        message: `Berhasil terhubung ke spreadsheet "${spreadsheetTitle}" via Service Account.`,
        sheetNames: sheetTitles,
        spreadsheetTitle,
        foundExpectedSheets: {
          users: hasUsers,
          saldo: hasSaldo,
          transaksi: hasTransaksi,
        },
      };
    } catch (err: any) {
      verifiedConnected = false;
      lastFetchFailedAt = Date.now();
      const rawMsg = err.message || '';
      if (rawMsg.includes('permission') || rawMsg.includes('403')) {
        lastErrorType = 'PERMISSION_DENIED';
        lastErrorMessage = `Akses ditolak: Dokumen belum dibagikan ke Service Account (${config.clientEmail}).`;
        lastSuggestions = [
          `Buka Google Spreadsheet > Klik "Bagikan" (Share) > Tambahkan email Service Account (${config.clientEmail}) sebagai Editor.`,
        ];
      } else {
        lastErrorType = 'UNKNOWN';
        lastErrorMessage = `Gagal mengakses Google Spreadsheet: ${rawMsg}`;
        lastSuggestions = ['Periksa Spreadsheet ID dan pastikan Service Account diizinkan mengakses dokumen.'];
      }

      return {
        success: false,
        message: lastErrorMessage,
        errorType: lastErrorType,
        suggestions: lastSuggestions,
      };
    }
  }

  return {
    success: false,
    message: 'Metode koneksi tidak dikenali. Silakan masukkan API Key atau Service Account.',
  };
}

/**
 * Inisialisasi otomatis: Buat sheet baru (Users, Saldo, Transaksi) dan pasang header
 * langsung ke Google Spreadsheet tanpa membuat manual.
 * TIDAK MENGUBAH / MENGHAPUS DATABASE YANG SUDAH ADA.
 */
export async function bootstrapSheets(): Promise<{
  success: boolean;
  message: string;
  createdSheets: string[];
  alreadyExisted: string[];
  initializedHeaders: string[];
  method: 'service_account' | 'api_key' | 'demo_mode';
}> {
  config.sheetId = extractSheetId(config.sheetId);
  const method = getActiveAuthMethod();

  if (method === 'demo_mode') {
    return {
      success: false,
      message: 'Belum ada Google Spreadsheet ID atau Service Account yang dikonfigurasi.',
      createdSheets: [],
      alreadyExisted: [],
      initializedHeaders: [],
      method: 'demo_mode',
    };
  }

  if (method === 'api_key') {
    return {
      success: false,
      message:
        'Google Sheets API v4 membatasi API Key hanya untuk operasi BACA (Read-Only) pada dokumen yang telah dibagikan publik. Untuk membuat lembar kerja dan menulis header langsung secara otomatis dari server ke Google Spreadsheet, gunakan kredensial Service Account pada tab "Service Acc".',
      createdSheets: [],
      alreadyExisted: [],
      initializedHeaders: [],
      method: 'api_key',
    };
  }

  // Service Account aktif: Lakukan pembuatan sheet & header otomatis secara langsung!
  const client = getServiceAccountClient();
  if (!client) {
    return {
      success: false,
      message: 'Kredensial Service Account belum lengkap atau format Private Key tidak valid.',
      createdSheets: [],
      alreadyExisted: [],
      initializedHeaders: [],
      method: 'service_account',
    };
  }

  try {
    // 1. Ambil metadata spreadsheet saat ini
    const meta = await client.spreadsheets.get({ spreadsheetId: config.sheetId });
    const existingTitles = (meta.data.sheets || []).map((s) => s.properties?.title || '');

    const targetSheets = [
      {
        title: 'Users',
        header: ['id', 'username', 'password_hash', 'role', 'nama_lengkap', 'jabatan'],
        seedRows: memoryUsers.map((u) => [u.id, u.username, u.password_hash, u.role, u.nama_lengkap, u.jabatan || '']),
      },
      {
        title: 'Saldo',
        header: ['id', 'tahun', 'saldo_awal_tahun_lalu', 'saldo_realtime', 'catatan', 'updated_at'],
        seedRows: [
          [
            memorySaldo.id,
            memorySaldo.tahun,
            memorySaldo.saldo_awal_tahun_lalu,
            memorySaldo.saldo_realtime,
            memorySaldo.catatan || '',
            memorySaldo.updated_at || new Date().toISOString(),
          ],
        ],
      },
      {
        title: 'Transaksi',
        header: ['id', 'tanggal', 'jenis', 'nominal', 'sumber_dana', 'nama_penerima', 'keterangan', 'dibuat_oleh', 'created_at'],
        seedRows: memoryTransactions.map((t) => [
          t.id,
          t.tanggal,
          t.jenis,
          t.nominal,
          t.sumber_dana || '',
          t.nama_penerima || '',
          t.keterangan,
          t.dibuat_oleh || '',
          t.created_at || '',
        ]),
      },
    ];

    const createdSheets: string[] = [];
    const alreadyExisted: string[] = [];
    const initializedHeaders: string[] = [];

    // 2. Deteksi sheet yang belum ada
    const missingSheets = targetSheets.filter(
      (ts) => !existingTitles.some((et) => et.trim().toLowerCase() === ts.title.toLowerCase())
    );

    // 3. Buat lembar kerja baru via batchUpdate
    if (missingSheets.length > 0) {
      const requests = missingSheets.map((ms) => ({
        addSheet: {
          properties: {
            title: ms.title,
            gridProperties: {
              frozenRowCount: 1,
            },
          },
        },
      }));

      await client.spreadsheets.batchUpdate({
        spreadsheetId: config.sheetId,
        requestBody: { requests },
      });

      missingSheets.forEach((ms) => createdSheets.push(ms.title));
    }

    // Catat yang sudah ada sebelumnya
    targetSheets.forEach((ts) => {
      if (!createdSheets.includes(ts.title)) {
        alreadyExisted.push(ts.title);
      }
    });

    // 4. Terapkan header & data awal hanya pada sheet yang baru dibuat atau yang baris 1-nya kosong
    // (JANGAN MENGUBAH DATABASE / DATA YANG SUDAH ADA)
    for (const ts of targetSheets) {
      if (createdSheets.includes(ts.title)) {
        // Sheet baru: Tulis header di baris 1 dan isi data seed
        await client.spreadsheets.values.update({
          spreadsheetId: config.sheetId,
          range: `${ts.title}!A1:${String.fromCharCode(64 + ts.header.length)}${ts.seedRows.length + 1}`,
          valueInputOption: 'USER_ENTERED',
          requestBody: {
            values: [ts.header, ...ts.seedRows],
          },
        });
        initializedHeaders.push(ts.title);
      } else {
        // Sheet sudah ada: Cek apakah baris 1 kosong
        try {
          const checkRes = await client.spreadsheets.values.get({
            spreadsheetId: config.sheetId,
            range: `${ts.title}!A1:A1`,
          });
          const hasContent = checkRes.data.values && checkRes.data.values.length > 0;
          if (!hasContent) {
            // Baris 1 kosong: pasang header tanpa mengubah data lain
            await client.spreadsheets.values.update({
              spreadsheetId: config.sheetId,
              range: `${ts.title}!A1:${String.fromCharCode(64 + ts.header.length)}1`,
              valueInputOption: 'USER_ENTERED',
              requestBody: {
                values: [ts.header],
              },
            });
            initializedHeaders.push(ts.title);
          }
        } catch {
          // Abaikan jika tidak dapat dibaca
        }
      }
    }

    const createdStr = createdSheets.length > 0 ? `Lembar baru berhasil dibuat: ${createdSheets.join(', ')}. ` : '';
    const existingStr = alreadyExisted.length > 0 ? `Lembar yang sudah ada tetap dipertahankan: ${alreadyExisted.join(', ')}. ` : '';
    const msg = `Inisialisasi selesai! ${createdStr}${existingStr}Header dan struktur standar siap digunakan.`;

    verifiedConnected = true;
    lastErrorMessage = '';
    lastErrorType = '';

    return {
      success: true,
      message: msg,
      createdSheets,
      alreadyExisted,
      initializedHeaders,
      method: 'service_account',
    };
  } catch (err: any) {
    const rawMsg = err.message || '';
    let friendly = `Gagal menginisialisasi spreadsheet: ${rawMsg}`;
    if (rawMsg.includes('permission') || rawMsg.includes('403')) {
      friendly = `Akses ditolak: Pastikan Google Spreadsheet telah dibagikan (Share) ke email Service Account (${config.clientEmail}) sebagai Editor.`;
    }
    return {
      success: false,
      message: friendly,
      createdSheets: [],
      alreadyExisted: [],
      initializedHeaders: [],
      method: 'service_account',
    };
  }
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
