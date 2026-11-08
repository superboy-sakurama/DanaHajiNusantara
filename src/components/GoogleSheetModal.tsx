import React, { useState, useEffect } from 'react';
import { GoogleSheetsConfig, SheetsTestResult, SheetsBootstrapResult } from '../types/index.ts';
import { api } from '../utils/api.ts';
import {
  X,
  Database,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Copy,
  Check,
  RefreshCw,
  KeyRound,
  ExternalLink,
  Shield,
  FileSpreadsheet,
  RotateCcw,
  HelpCircle,
  Info,
  Wand2,
  Sparkles,
  Download,
} from 'lucide-react';

interface GoogleSheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: GoogleSheetsConfig | null;
  isAdmin: boolean;
  onConfigUpdated: () => void;
}

export const GoogleSheetModal: React.FC<GoogleSheetModalProps> = ({
  isOpen,
  onClose,
  config,
  isAdmin,
  onConfigUpdated,
}) => {
  const [activeTab, setActiveTab] = useState<'status' | 'apiKey' | 'serviceAccount' | 'schema' | 'guide'>('status');
  const [sheetInput, setSheetInput] = useState<string>('');
  const [apiKeyInput, setApiKeyInput] = useState<string>('');
  const [serviceAccountJson, setServiceAccountJson] = useState<string>('');
  const [clientEmail, setClientEmail] = useState<string>('');
  const [privateKey, setPrivateKey] = useState<string>('');

  const [testResult, setTestResult] = useState<SheetsTestResult | null>(null);
  const [bootstrapResult, setBootstrapResult] = useState<SheetsBootstrapResult | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [confirmReset, setConfirmReset] = useState<boolean>(false);
  const [isTesting, setIsTesting] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isResetting, setIsResetting] = useState<boolean>(false);
  const [isBootstrapping, setIsBootstrapping] = useState<boolean>(false);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  // Sync state saat modal dibuka
  useEffect(() => {
    if (isOpen && config) {
      if (config.status === 'error' && config.message) {
        setTestResult({
          success: false,
          message: config.message,
          errorType: (config.errorType as any) || 'UNKNOWN',
          suggestions: config.suggestions,
        });
      }
    }
  }, [isOpen, config]);

  if (!isOpen) return null;

  // Ekstrak ID Spreadsheet dari URL otomatis jika user menempel link lengkap
  const extractCleanSheetId = (input: string): string => {
    const clean = input.trim();
    const match = clean.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    if (match && match[1]) {
      return match[1];
    }
    return clean;
  };

  // Deteksi format kunci
  const isHexDetected = /^[0-9a-f]{32,45}$/i.test(apiKeyInput.trim());
  const isGoogleKeyDetected = apiKeyInput.trim().startsWith('AIza');

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await api.testSheetsConnection();
      setTestResult(res);
      onConfigUpdated();
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err.message || 'Gagal menghubungi server untuk menguji Google Sheets',
        errorType: 'NETWORK_ERROR',
        suggestions: ['Periksa koneksi internet dan pastikan backend server aktif.'],
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSaveApiKeyConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setFormError(null);
    try {
      const cleanId = extractCleanSheetId(sheetInput);
      await api.updateSheetsConfig({
        sheetId: cleanId,
        apiKey: apiKeyInput.trim(),
      });
      onConfigUpdated();
      setActiveTab('status');
      await handleTestConnection();
    } catch (err: any) {
      setFormError(err.message || 'Gagal menyimpan konfigurasi');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveServiceAccountConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setFormError(null);
    try {
      const cleanId = extractCleanSheetId(sheetInput);
      let email = clientEmail.trim();
      let pKey = privateKey.trim();

      // Jika user paste JSON lengkap
      if (serviceAccountJson.trim().startsWith('{')) {
        try {
          const parsed = JSON.parse(serviceAccountJson);
          if (parsed.client_email) email = parsed.client_email;
          if (parsed.private_key) pKey = parsed.private_key;
        } catch {
          throw new Error('Format JSON Service Account tidak valid. Pastikan JSON lengkap dan terformat baik.');
        }
      }

      await api.updateSheetsConfig({
        sheetId: cleanId,
        clientEmail: email,
        privateKey: pKey,
      });
      onConfigUpdated();
      setActiveTab('status');
      await handleTestConnection();
    } catch (err: any) {
      setFormError(err.message || 'Gagal menyimpan konfigurasi Service Account');
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetToDemoMode = async () => {
    setIsResetting(true);
    setConfirmReset(false);
    try {
      await api.resetSheetsConfig();
      setSheetInput('');
      setApiKeyInput('');
      setServiceAccountJson('');
      setClientEmail('');
      setPrivateKey('');
      setTestResult(null);
      setFormError(null);
      onConfigUpdated();
      setActiveTab('status');
    } catch (err: any) {
      setFormError(err.message || 'Gagal mereset konfigurasi');
    } finally {
      setIsResetting(false);
    }
  };

  const handleBootstrapSheets = async () => {
    setIsBootstrapping(true);
    setBootstrapResult(null);
    setFormError(null);
    try {
      const res = await api.bootstrapSheets();
      setBootstrapResult(res);
      if (res.success) {
        onConfigUpdated();
        await handleTestConnection();
      }
    } catch (err: any) {
      setBootstrapResult({
        success: false,
        message: err.message || 'Gagal menginisialisasi lembar kerja otomatis',
        createdSheets: [],
        alreadyExisted: [],
        initializedHeaders: [],
        method: config?.authMethod || 'service_account',
      });
    } finally {
      setIsBootstrapping(false);
    }
  };

  const handleDownloadCsv = (sheetName: 'Users' | 'Saldo' | 'Transaksi') => {
    let content = '';
    if (sheetName === 'Users') {
      content = 'id,username,password_hash,role,nama_lengkap,jabatan\r\nusr-1,admin,admin123,admin,"dr. H. Rahmat Hidayat, M.Kes","Ketua Tim Haji"\r\nusr-2,petugas,petugas123,anggota,"Ns. Hj. Siti Nurjanah, S.Kep","Paramedis Kloter"';
    } else if (sheetName === 'Saldo') {
      content = 'id,tahun,saldo_awal_tahun_lalu,saldo_realtime,catatan,updated_at\r\nsld-2026,1447 H / 2026 M,12500000,28200000,"Sisa kas operasional tahun lalu",2026-05-01T00:00:00.000Z';
    } else if (sheetName === 'Transaksi') {
      content = 'id,tanggal,jenis,nominal,sumber_dana,nama_penerima,keterangan,dibuat_oleh,created_at\r\nTRX-2026-001,2026-04-10,penerimaan,15000000,"Dana Operasional Dinkes",,"Pencairan Tahap 1 BOK Haji","Admin Petugas Haji",2026-04-10T08:00:00.000Z\r\nTRX-2026-002,2026-04-18,pengeluaran,4200000,,"PT Kimia Farma Apotek","Pengadaan Obat Emergensi & Vitamin","Admin Petugas Haji",2026-04-18T10:30:00.000Z';
    }
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${sheetName}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Evaluasi status kartu
  const hasError = config?.status === 'error' || (testResult && !testResult.success);
  const isConnected = config?.status === 'connected' && (!testResult || testResult.success);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-xl max-h-[94vh] flex flex-col rounded-3xl bg-gradient-to-b from-slate-900/95 via-purple-950/95 to-slate-950/95 border border-white/20 shadow-2xl p-4 sm:p-6 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-purple-600 to-pink-500 text-white shadow-md">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>Integrasi Google Spreadsheet</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono">
                  Sheets API v4
                </span>
              </h3>
              <p className="text-[11px] text-purple-200/70">Koneksi Langsung Tanpa Google Apps Script</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-colors cursor-pointer"
            aria-label="Tutup Modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Buttons */}
        <div className="grid grid-cols-5 gap-1 p-1 mt-3 rounded-xl bg-black/50 border border-white/10 shrink-0 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab('status')}
            className={`py-1.5 rounded-lg transition-all text-center truncate cursor-pointer ${
              activeTab === 'status' ? 'bg-purple-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Status
          </button>
          {isAdmin && (
            <button
              type="button"
              onClick={() => setActiveTab('apiKey')}
              className={`py-1.5 rounded-lg transition-all text-center truncate cursor-pointer ${
                activeTab === 'apiKey' ? 'bg-purple-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              API Key
            </button>
          )}
          {isAdmin && (
            <button
              type="button"
              onClick={() => setActiveTab('serviceAccount')}
              className={`py-1.5 rounded-lg transition-all text-center truncate cursor-pointer ${
                activeTab === 'serviceAccount'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Service Acc
            </button>
          )}
          <button
            type="button"
            onClick={() => setActiveTab('schema')}
            className={`py-1.5 rounded-lg transition-all text-center truncate cursor-pointer ${
              activeTab === 'schema' ? 'bg-purple-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            3 Sheet
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('guide')}
            className={`py-1.5 rounded-lg transition-all text-center truncate cursor-pointer ${
              activeTab === 'guide' ? 'bg-purple-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Panduan
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="mt-3.5 flex-1 overflow-y-auto no-scrollbar space-y-3.5 pr-1 text-xs">
          {/* TAB 1: STATUS & DIAGNOSTIK */}
          {activeTab === 'status' && (
            <div className="space-y-3.5">
              {/* STATUS CARD */}
              {hasError ? (
                /* ERROR CARD */
                <div className="p-4 rounded-2xl border bg-rose-950/40 border-rose-500/40 text-rose-200 space-y-3">
                  <div className="flex items-start gap-3">
                    <XCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                    <div className="space-y-1 flex-1">
                      <div className="font-bold text-white text-sm flex items-center justify-between">
                        <span>Koneksi Google Sheets Bermasalah</span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30 font-mono uppercase">
                          {testResult?.errorType || config?.errorType || 'ERROR'}
                        </span>
                      </div>
                      <p className="text-rose-100 text-[11px] leading-relaxed">
                        {testResult?.message || config?.message}
                      </p>
                    </div>
                  </div>

                  {/* Khusus PERMISSION_DENIED: Panduan Interaktif & Solusi Cepat */}
                  {(testResult?.errorType === 'PERMISSION_DENIED' || config?.errorType === 'PERMISSION_DENIED') && (
                    <div className="p-3 rounded-xl bg-black/40 border border-amber-500/30 text-amber-200 text-[11px] space-y-2.5">
                      <div className="flex items-center justify-between">
                        <div className="font-bold text-amber-300 flex items-center gap-1.5">
                          <AlertTriangle className="w-4 h-4 text-amber-400" />
                          <span>Solusi Mengatasi Akses Ditolak (PERMISSION_DENIED):</span>
                        </div>
                        {sheetInput.trim() && (
                          <a
                            href={
                              sheetInput.startsWith('http')
                                ? sheetInput
                                : `https://docs.google.com/spreadsheets/d/${extractCleanSheetId(sheetInput)}/edit`
                            }
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-pink-600 hover:bg-pink-500 text-white font-bold text-[10px] transition-all"
                          >
                            <span>Buka Dokumen</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>

                      <div className="p-2.5 rounded-lg bg-white/5 border border-white/10 space-y-1.5 text-slate-200">
                        <p className="font-semibold text-pink-300">
                          Mengapa Google API Menolak Akses Ini?
                        </p>
                        <p className="text-slate-300 leading-relaxed text-[10px]">
                          Google Cloud API Key adalah kunci tanpa identitas login pengguna. Google Sheets API secara ketat <b>hanya mengizinkan API Key membaca spreadsheet yang akses umumnya telah dibuka</b>. Jika dokumen masih berstatus <b>"Dibatasi" (Restricted)</b>, Google Cloud akan selalu menolaknya.
                        </p>
                      </div>

                      <div className="space-y-1.5">
                        <span className="font-semibold text-amber-300 block text-[11px]">
                          4 Langkah Mengaktifkan Akses dalam 10 Detik:
                        </span>
                        <ol className="list-decimal pl-4 space-y-1 text-slate-200 text-[10px] leading-relaxed">
                          <li>Buka file Google Spreadsheet Anda di browser.</li>
                          <li>
                            Klik tombol biru <b>"Bagikan" (Share)</b> di pojok kanan atas layar spreadsheet.
                          </li>
                          <li>
                            Pada bagian <b>"Akses umum" (General access)</b>, ubah dari <i>"Dibatasi"</i> menjadi{' '}
                            <b className="text-emerald-300">"Siapa saja yang memiliki link" (Anyone with the link)</b> dengan peran <b>Pelihat (Viewer)</b>.
                          </li>
                          <li>
                            Klik <b>"Selesai"</b>, lalu kembali ke aplikasi ini dan klik tombol{' '}
                            <b>"Tes Koneksi Sekarang"</b> di bawah.
                          </li>
                        </ol>
                      </div>
                    </div>
                  )}

                  {/* Langkah Solusi Umum */}
                  {testResult?.errorType !== 'PERMISSION_DENIED' &&
                    config?.errorType !== 'PERMISSION_DENIED' &&
                    (testResult?.suggestions || config?.suggestions) && (
                      <div className="mt-2 pt-2.5 border-t border-rose-500/25 bg-black/20 p-2.5 rounded-xl">
                        <div className="font-semibold text-rose-300 text-[11px] flex items-center gap-1.5 mb-1.5">
                          <Info className="w-3.5 h-3.5 text-rose-300" />
                          <span>Langkah Perbaikan yang Disarankan:</span>
                        </div>
                        <ul className="list-disc pl-4 space-y-1 text-[11px] text-rose-200/90 leading-relaxed">
                          {(testResult?.suggestions || config?.suggestions || []).map((sug, idx) => (
                            <li key={idx}>{sug}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                  {isAdmin && (
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setActiveTab('apiKey')}
                        className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-semibold text-[11px] transition-all cursor-pointer"
                      >
                        Perbaiki di Tab API Key
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveTab('serviceAccount')}
                        className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-slate-200 font-semibold text-[11px] transition-all cursor-pointer"
                      >
                        Gunakan Service Account (Untuk Dokumen Privat)
                      </button>
                    </div>
                  )}
                </div>
              ) : isConnected ? (
                /* CONNECTED CARD */
                <div className="p-4 rounded-2xl border bg-emerald-950/40 border-emerald-500/40 text-emerald-200 space-y-2">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <div className="font-bold text-white text-sm">
                        Terhubung ke Google Spreadsheet
                      </div>
                      <p className="text-emerald-100 text-[11px] leading-relaxed">
                        {testResult?.message || config?.message}
                      </p>
                      {config?.sheetId && (
                        <div className="text-[10px] text-purple-300 font-mono mt-1">
                          ID Dokumen: {config.sheetId}
                        </div>
                      )}
                      {config?.apiKey && (
                        <div className="text-[10px] text-emerald-300 font-mono">
                          API Key: {config.apiKey}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                /* DEMO / LOCAL MODE CARD */
                <div className="p-4 rounded-2xl border bg-purple-950/40 border-purple-500/30 text-purple-200 space-y-2">
                  <div className="flex items-start gap-3">
                    <Database className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <div className="font-bold text-white text-sm">
                        Mode Data Lokal Aktif (Standar)
                      </div>
                      <p className="text-slate-300 text-[11px] leading-relaxed">
                        Aplikasi saat ini berjalan menggunakan database lokal di server. Seluruh transaksi kas haji,
                        saldo realtime, dan ekspor laporan PDF berfungsi penuh.
                      </p>
                      <p className="text-purple-300/80 text-[10px]">
                        Admin dapat menghubungkan Google Spreadsheet melalui tab "API Key" atau "Service Acc".
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* ACTION BUTTONS: TES KONEKSI & RESET */}
              <div className="p-3 rounded-2xl bg-white/5 border border-white/10 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleTestConnection}
                    disabled={isTesting}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-semibold transition-all shadow-md cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
                    <span>{isTesting ? 'Menguji Akses...' : 'Tes Koneksi Sekarang'}</span>
                  </button>

                  {isAdmin && config?.isConfigured && (
                    confirmReset ? (
                      <div className="flex items-center gap-1.5 animate-fade-in">
                        <button
                          type="button"
                          onClick={handleResetToDemoMode}
                          disabled={isResetting}
                          className="flex items-center gap-1 px-3 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
                        >
                          <RotateCcw className={`w-3.5 h-3.5 ${isResetting ? 'animate-spin' : ''}`} />
                          <span>Konfirmasi Reset</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmReset(false)}
                          className="px-2.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 text-xs transition-all cursor-pointer"
                        >
                          Batal
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmReset(true)}
                        disabled={isResetting}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/10 hover:bg-rose-500/20 text-slate-300 hover:text-rose-200 border border-white/10 hover:border-rose-500/30 transition-all text-xs cursor-pointer"
                        title="Hapus konfigurasi dan kembali ke database lokal"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Reset ke Data Lokal</span>
                      </button>
                    )
                  )}
                </div>

                <span className="text-[10px] text-slate-400">
                  {config?.lastSynced ? `Sinkron: ${new Date(config.lastSynced).toLocaleTimeString('id-ID')}` : ''}
                </span>
              </div>

              {/* FITUR INISIALISASI 3 SHEET & HEADER OTOMATIS */}
              <div className="p-3.5 rounded-2xl bg-gradient-to-r from-purple-950/60 via-pink-950/40 to-purple-950/60 border border-pink-500/30 space-y-2.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-pink-500/20 text-pink-300 border border-pink-500/30">
                      <Wand2 className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                        <span>Inisialisasi 3 Sheet & Header Otomatis</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-pink-500/20 text-pink-300 border border-pink-500/30 font-semibold">
                          Tanpa Manual
                        </span>
                      </h4>
                      <p className="text-[11px] text-purple-200/70 mt-0.5">
                        Terapkan lembar <b>Users</b>, <b>Saldo</b>, & <b>Transaksi</b> langsung tanpa mengubah data yang ada
                      </p>
                    </div>
                  </div>

                  {isAdmin && (
                    <button
                      type="button"
                      onClick={handleBootstrapSheets}
                      disabled={isBootstrapping}
                      className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-pink-500 via-fuchsia-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-bold text-xs shadow-md transition-all flex items-center gap-1.5 self-start sm:self-auto disabled:opacity-50 cursor-pointer"
                    >
                      <Sparkles className={`w-3.5 h-3.5 ${isBootstrapping ? 'animate-spin' : ''}`} />
                      <span>{isBootstrapping ? 'Menerapkan...' : 'Terapkan Otomatis'}</span>
                    </button>
                  )}
                </div>

                {bootstrapResult && (
                  <div
                    className={`p-2.5 rounded-xl text-[11px] flex items-start gap-2 ${
                      bootstrapResult.success
                        ? 'bg-emerald-500/20 border border-emerald-500/30 text-emerald-300'
                        : 'bg-rose-500/20 border border-rose-500/30 text-rose-300'
                    }`}
                  >
                    {bootstrapResult.success ? (
                      <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0 text-emerald-400" />
                    ) : (
                      <XCircle className="w-4 h-4 mt-0.5 shrink-0 text-rose-400" />
                    )}
                    <div className="leading-relaxed flex-1">
                      <p className="font-semibold">{bootstrapResult.message}</p>
                      {bootstrapResult.method === 'api_key' && (
                        <div className="mt-2 pt-2 border-t border-white/10 space-y-1.5">
                          <p className="text-[10px] text-slate-300">
                            Unduh file template CSV siap pakai (tinggal Import di Google Sheets):
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleDownloadCsv('Users')}
                              className="px-2 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white text-[10px] flex items-center gap-1"
                            >
                              <Download className="w-3 h-3" /> Unduh Users.csv
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDownloadCsv('Saldo')}
                              className="px-2 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white text-[10px] flex items-center gap-1"
                            >
                              <Download className="w-3 h-3" /> Unduh Saldo.csv
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDownloadCsv('Transaksi')}
                              className="px-2 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white text-[10px] flex items-center gap-1"
                            >
                              <Download className="w-3 h-3" /> Unduh Transaksi.csv
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* CHECKLIST 3 SHEET DOKUMEN */}
              <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white text-xs flex items-center gap-1.5">
                    <FileSpreadsheet className="w-4 h-4 text-pink-400" />
                    <span>Status 3 Lembar Kerja Standar:</span>
                  </span>
                  <span className="text-[10px] text-slate-400">Diperlukan untuk sinkronisasi</span>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-1">
                  {/* Sheet Users */}
                  <div className="p-2 rounded-xl bg-black/40 border border-white/10 flex flex-col justify-between">
                    <span className="font-semibold text-slate-200 text-[11px]">1. Users</span>
                    <span className="text-[10px] text-slate-400 mt-1">
                      {testResult?.foundExpectedSheets?.users
                        ? '✓ Terdeteksi'
                        : config?.isConfigured
                        ? 'Belum sinkron'
                        : 'Siap lokal'}
                    </span>
                  </div>

                  {/* Sheet Saldo */}
                  <div className="p-2 rounded-xl bg-black/40 border border-white/10 flex flex-col justify-between">
                    <span className="font-semibold text-slate-200 text-[11px]">2. Saldo</span>
                    <span className="text-[10px] text-slate-400 mt-1">
                      {testResult?.foundExpectedSheets?.saldo
                        ? '✓ Terdeteksi'
                        : config?.isConfigured
                        ? 'Belum sinkron'
                        : 'Siap lokal'}
                    </span>
                  </div>

                  {/* Sheet Transaksi */}
                  <div className="p-2 rounded-xl bg-black/40 border border-white/10 flex flex-col justify-between">
                    <span className="font-semibold text-slate-200 text-[11px]">3. Transaksi</span>
                    <span className="text-[10px] text-slate-400 mt-1">
                      {testResult?.foundExpectedSheets?.transaksi
                        ? '✓ Terdeteksi'
                        : config?.isConfigured
                        ? 'Belum sinkron'
                        : 'Siap lokal'}
                    </span>
                  </div>
                </div>
              </div>

              {/* INFO TAMBAHAN */}
              <div className="p-3 rounded-2xl bg-white/5 border border-white/10 text-[11px] text-slate-300 space-y-1">
                <div className="font-bold text-white flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-amber-400" />
                  <span>Keamanan Data Petugas Haji:</span>
                </div>
                <p className="text-slate-300/80 leading-relaxed text-[11px]">
                  Seluruh pemanggilan Google Sheets API v4 dilakukan secara aman dari sisi server Node.js.
                  Kunci API atau kredensial Service Account tidak pernah terpapar di browser pengguna.
                </p>
              </div>
            </div>
          )}

          {/* TAB 2: PENGATURAN API KEY */}
          {activeTab === 'apiKey' && isAdmin && (
            <form onSubmit={handleSaveApiKeyConfig} className="space-y-3.5">
              {formError && (
                <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-500/50 text-rose-200 text-[11px] flex items-center gap-2">
                  <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="p-3 rounded-2xl bg-purple-950/30 border border-purple-500/30 text-purple-200 text-[11px] leading-relaxed">
                <b>Metode 1 (API Key):</b> Akses baca cepat langsung menggunakan Google Sheets API v4.
                Pastikan Google Spreadsheet telah diatur ke <b className="text-amber-300">"Anyone with the link can view / Siapa saja yang memiliki link dapat melihat"</b>.
              </div>

              {/* Spreadsheet ID / URL */}
              <div>
                <label className="block text-slate-200 font-semibold mb-1">
                  Google Spreadsheet ID atau Link Lengkap Dokumen
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: 1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms atau paste URL dokumen"
                  value={sheetInput}
                  onChange={(e) => setSheetInput(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-black/40 border border-white/15 text-white font-mono text-[11px] focus:border-pink-500 focus:outline-none"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Anda bisa menempel URL dokumen lengkap dari browser; sistem akan mengekstrak ID-nya secara otomatis.
                </span>
              </div>

              {/* Google Cloud API Key */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-slate-200 font-semibold">Google Cloud API Key</label>
                  <a
                    href="https://console.cloud.google.com/apis/credentials"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] text-pink-300 hover:text-pink-200 inline-flex items-center gap-1 underline"
                  >
                    Buka Google Cloud Credentials <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <input
                  type="text"
                  required
                  placeholder="Contoh: AIzaSyA... (39 karakter)"
                  value={apiKeyInput}
                  onChange={(e) => setApiKeyInput(e.target.value)}
                  className={`w-full px-3 py-2.5 rounded-xl bg-black/40 border font-mono text-[11px] text-white focus:outline-none ${
                    isHexDetected
                      ? 'border-amber-500 bg-amber-950/20'
                      : isGoogleKeyDetected
                      ? 'border-emerald-500 bg-emerald-950/20'
                      : 'border-white/15 focus:border-pink-500'
                  }`}
                />

                {/* Real-time Validation Banner */}
                {isHexDetected && (
                  <div className="mt-2 p-2.5 rounded-xl bg-amber-950/50 border border-amber-500/40 text-amber-200 text-[11px] space-y-1 animate-fade-in">
                    <div className="font-bold flex items-center gap-1.5 text-amber-300">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>Perhatian: Kunci Terdeteksi sebagai Service Account Key ID</span>
                    </div>
                    <p className="text-amber-200/90 leading-relaxed text-[10px]">
                      Kunci yang Anda masukkan berformat heksadesimal 40 karakter. Di Google Cloud, ini adalah <b>Private Key ID</b> milik Service Account, bukan Google Cloud API Key.
                    </p>
                    <p className="text-amber-200/90 text-[10px]">
                      • Jika ingin menggunakan API Key: Buat di Google Cloud Console &gt; <b>+ Create Credentials &gt; API Key</b> (diawali <code>AIzaSy...</code>).<br />
                      • Jika Anda memiliki file Service Account JSON: Gunakan tab <b>"Service Acc"</b> di samping.
                    </p>
                  </div>
                )}

                {isGoogleKeyDetected && (
                  <div className="mt-1 text-[10px] text-emerald-400 flex items-center gap-1">
                    <Check className="w-3 h-3" />
                    <span>Format API Key Google Cloud terdeteksi valid (diawali AIza...)</span>
                  </div>
                )}

                <span className="text-[10px] text-slate-400 mt-1 block">
                  Pastikan <b>Google Sheets API</b> sudah diaktifkan (Enable) pada proyek Google Cloud Anda.
                </span>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-purple-600 via-fuchsia-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold transition-all shadow-lg shadow-pink-500/25 cursor-pointer disabled:opacity-50"
                >
                  {isSaving ? 'Menyimpan & Menguji...' : 'Simpan & Uji Koneksi API Key'}
                </button>
              </div>
            </form>
          )}

          {/* TAB 3: PENGATURAN SERVICE ACCOUNT */}
          {activeTab === 'serviceAccount' && isAdmin && (
            <form onSubmit={handleSaveServiceAccountConfig} className="space-y-3.5">
              {formError && (
                <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-500/50 text-rose-200 text-[11px] flex items-center gap-2">
                  <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="p-3 rounded-2xl bg-pink-950/30 border border-pink-500/30 text-pink-200 text-[11px] leading-relaxed">
                <b>Metode 2 (Service Account - Direkomendasikan untuk Read & Write):</b> Mendukung pembacaan dan penyimpanan data langsung ke spreadsheet privat tanpa harus membuka akses publik.
              </div>

              {/* Spreadsheet ID / URL */}
              <div>
                <label className="block text-slate-200 font-semibold mb-1">
                  Google Spreadsheet ID atau URL Dokumen
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: 1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms"
                  value={sheetInput}
                  onChange={(e) => setSheetInput(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/15 text-white font-mono text-[11px] focus:border-pink-500 focus:outline-none"
                />
              </div>

              {/* Paste Full JSON Option */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-slate-200 font-semibold">
                    Tempel Isi File Kredensial JSON (Service Account)
                  </label>
                  <span className="text-[10px] text-pink-300">Auto-Extract</span>
                </div>
                <textarea
                  rows={4}
                  placeholder={`Tempel seluruh isi file credentials.json di sini, contoh:\n{\n  "type": "service_account",\n  "client_email": "petugas-haji@project.iam.gserviceaccount.com",\n  "private_key": "-----BEGIN PRIVATE KEY-----\\n..."\n}`}
                  value={serviceAccountJson}
                  onChange={(e) => {
                    const val = e.target.value;
                    setServiceAccountJson(val);
                    if (val.trim().startsWith('{')) {
                      try {
                        const parsed = JSON.parse(val);
                        if (parsed.client_email) setClientEmail(parsed.client_email);
                        if (parsed.private_key) setPrivateKey(parsed.private_key);
                      } catch {
                        // ignore parsing error while typing
                      }
                    }
                  }}
                  className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/15 text-white font-mono text-[10px] focus:border-pink-500 focus:outline-none resize-none"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  Tempel JSON lengkap, atau isi email dan private key secara manual di bawah.
                </span>
              </div>

              {/* Client Email & Private Key */}
              <div className="space-y-2 pt-1 border-t border-white/10">
                <div>
                  <label className="block text-slate-200 font-semibold mb-1 text-[11px]">
                    Client Email (Service Account)
                  </label>
                  <input
                    type="email"
                    placeholder="Contoh: my-sa@project-id.iam.gserviceaccount.com"
                    value={clientEmail}
                    onChange={(e) => setClientEmail(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/15 text-white font-mono text-[11px] focus:border-pink-500 focus:outline-none"
                  />
                  <span className="text-[10px] text-amber-300/90 mt-0.5 block">
                    Penting: Bagikan (Share) Google Spreadsheet Anda ke email ini sebagai <b>Editor</b>.
                  </span>
                </div>

                <div>
                  <label className="block text-slate-200 font-semibold mb-1 text-[11px]">
                    Private Key (PEM format)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgk...-----END PRIVATE KEY-----\n"
                    value={privateKey}
                    onChange={(e) => setPrivateKey(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl bg-black/40 border border-white/15 text-white font-mono text-[10px] focus:border-pink-500 focus:outline-none resize-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSaving}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-pink-600 via-fuchsia-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white font-bold transition-all shadow-lg shadow-pink-500/25 cursor-pointer disabled:opacity-50"
              >
                {isSaving ? 'Menyimpan & Menguji...' : 'Simpan & Uji Koneksi Service Account'}
              </button>
            </form>
          )}

          {/* TAB 4: SKEMA 3 SHEET */}
          {activeTab === 'schema' && (
            <div className="space-y-3">
              {/* Action Banner: Terapkan Otomatis */}
              <div className="p-3 rounded-2xl bg-gradient-to-r from-purple-900/60 via-pink-900/40 to-purple-900/60 border border-pink-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div>
                  <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-pink-400" />
                    <span>Terapkan 3 Sheet & Header Otomatis</span>
                  </h4>
                  <p className="text-[10px] text-purple-200/80 mt-0.5">
                    Buat lembar kerja baru tanpa mengubah data yang sudah ada di spreadsheet Anda.
                  </p>
                </div>

                {isAdmin && (
                  <button
                    type="button"
                    onClick={handleBootstrapSheets}
                    disabled={isBootstrapping}
                    className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-bold text-xs shadow-md transition-all flex items-center gap-1.5 self-start sm:self-auto disabled:opacity-50 cursor-pointer"
                  >
                    <Wand2 className={`w-3.5 h-3.5 ${isBootstrapping ? 'animate-spin' : ''}`} />
                    <span>{isBootstrapping ? 'Menerapkan...' : 'Terapkan Otomatis'}</span>
                  </button>
                )}
              </div>

              {bootstrapResult && (
                <div
                  className={`p-2.5 rounded-xl text-[11px] flex items-start gap-2 ${
                    bootstrapResult.success
                      ? 'bg-emerald-500/20 border border-emerald-500/30 text-emerald-300'
                      : 'bg-rose-500/20 border border-rose-500/30 text-rose-300'
                  }`}
                >
                  {bootstrapResult.success ? (
                    <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0 text-emerald-400" />
                  ) : (
                    <XCircle className="w-4 h-4 mt-0.5 shrink-0 text-rose-400" />
                  )}
                  <span className="leading-relaxed font-semibold">{bootstrapResult.message}</span>
                </div>
              )}

              {/* Sheet Users */}
              <div className="p-3 rounded-2xl bg-white/5 border border-white/10 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-emerald-300">1. Sheet "Users"</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleDownloadCsv('Users')}
                      className="flex items-center gap-1 text-[10px] text-pink-300 hover:text-white px-2 py-0.5 rounded bg-white/5 hover:bg-white/10 cursor-pointer transition-colors"
                      title="Unduh file CSV siap import ke Google Sheets"
                    >
                      <Download className="w-3 h-3" />
                      <span>Unduh CSV</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCopy('id,username,password_hash,role,nama_lengkap,jabatan', 'users')}
                      className="flex items-center gap-1 text-[11px] text-purple-300 hover:text-white cursor-pointer"
                    >
                      {copiedText === 'users' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>Salin Header</span>
                    </button>
                  </div>
                </div>
                <p className="text-[11px] text-slate-300">
                  Kolom: <code>id, username, password_hash, role, nama_lengkap, jabatan</code>
                </p>
                <div className="text-[10px] text-slate-400 bg-black/40 p-2 rounded-xl font-mono overflow-x-auto whitespace-pre">
                  usr-1 | admin | admin123 | admin | dr. H. Rahmat Hidayat | Ketua Tim Haji{'\n'}
                  usr-2 | petugas | petugas123 | anggota | Ns. Hj. Siti Nurjanah | Paramedis Kloter
                </div>
              </div>

              {/* Sheet Saldo */}
              <div className="p-3 rounded-2xl bg-white/5 border border-white/10 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-purple-300">2. Sheet "Saldo"</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleDownloadCsv('Saldo')}
                      className="flex items-center gap-1 text-[10px] text-pink-300 hover:text-white px-2 py-0.5 rounded bg-white/5 hover:bg-white/10 cursor-pointer transition-colors"
                      title="Unduh file CSV siap import ke Google Sheets"
                    >
                      <Download className="w-3 h-3" />
                      <span>Unduh CSV</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCopy('id,tahun,saldo_awal_tahun_lalu,saldo_realtime,catatan,updated_at', 'saldo')}
                      className="flex items-center gap-1 text-[11px] text-purple-300 hover:text-white cursor-pointer"
                    >
                      {copiedText === 'saldo' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>Salin Header</span>
                    </button>
                  </div>
                </div>
                <p className="text-[11px] text-slate-300">
                  Kolom: <code>id, tahun, saldo_awal_tahun_lalu, saldo_realtime, catatan, updated_at</code>
                </p>
                <div className="text-[10px] text-slate-400 bg-black/40 p-2 rounded-xl font-mono overflow-x-auto whitespace-pre">
                  sld-2026 | 1447 H / 2026 M | 12500000 | 12500000 | Sisa kas operasional tahun lalu
                </div>
              </div>

              {/* Sheet Transaksi */}
              <div className="p-3 rounded-2xl bg-white/5 border border-white/10 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-pink-300">3. Sheet "Transaksi"</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleDownloadCsv('Transaksi')}
                      className="flex items-center gap-1 text-[10px] text-pink-300 hover:text-white px-2 py-0.5 rounded bg-white/5 hover:bg-white/10 cursor-pointer transition-colors"
                      title="Unduh file CSV siap import ke Google Sheets"
                    >
                      <Download className="w-3 h-3" />
                      <span>Unduh CSV</span>
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        handleCopy(
                          'id,tanggal,jenis,nominal,sumber_dana,nama_penerima,keterangan,dibuat_oleh,created_at',
                          'trx'
                        )
                      }
                      className="flex items-center gap-1 text-[11px] text-purple-300 hover:text-white cursor-pointer"
                    >
                      {copiedText === 'trx' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>Salin Header</span>
                    </button>
                  </div>
                </div>
                <p className="text-[11px] text-slate-300">
                  Kolom: <code>id, tanggal, jenis, nominal, sumber_dana, nama_penerima, keterangan, dibuat_oleh, created_at</code>
                </p>
                <div className="text-[10px] text-slate-400 bg-black/40 p-2 rounded-xl font-mono overflow-x-auto whitespace-pre">
                  TRX-2026-001 | 2026-04-10 | penerimaan | 15000000 | Dana BOK | | Pencairan Tahap 1{'\n'}
                  TRX-2026-002 | 2026-04-18 | pengeluaran | 4200000 | | PT Kimia Farma | Beli Obat Haji
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: PANDUAN LENGKAP */}
          {activeTab === 'guide' && (
            <div className="space-y-3.5">
              <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-2.5">
                <div className="font-bold text-white text-sm flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-pink-400" />
                  <span>Langkah Mendapatkan Google Cloud API Key yang Benar:</span>
                </div>

                <ol className="list-decimal pl-4 space-y-2 text-[11px] text-slate-300/90 leading-relaxed">
                  <li>
                    Buka{' '}
                    <a
                      href="https://console.cloud.google.com/apis/credentials"
                      target="_blank"
                      rel="noreferrer"
                      className="text-pink-300 underline font-semibold inline-flex items-center gap-1"
                    >
                      Google Cloud Console Credentials <ExternalLink className="w-3 h-3" />
                    </a>.
                  </li>
                  <li>
                    Pilih Proyek Anda (atau buat proyek baru).
                  </li>
                  <li>
                    Aktifkan Google Sheets API:{' '}
                    <a
                      href="https://console.cloud.google.com/apis/library/sheets.googleapis.com"
                      target="_blank"
                      rel="noreferrer"
                      className="text-pink-300 underline inline-flex items-center gap-1"
                    >
                      Buka Halaman Google Sheets API <ExternalLink className="w-3 h-3" />
                    </a>{' '}
                    lalu klik <b>Enable (Aktifkan)</b>.
                  </li>
                  <li>
                    Kembali ke menu <b>Credentials</b>, klik tombol <b>+ CREATE CREDENTIALS &gt; API key</b>.
                  </li>
                  <li>
                    Salin string yang muncul. Kunci resmi Google Cloud <b>selalu diawali dengan huruf <code>AIzaSy...</code> sepanjang 39 karakter</b>.
                  </li>
                  <li>
                    <b className="text-amber-300">Penting:</b> Jangan tertukar dengan <i>Key ID</i> milik Service Account yang berformat heksadesimal 40 karakter.
                  </li>
                  <li>
                    Buka dokumen Google Spreadsheet Anda, klik <b>Bagikan (Share)</b> di kanan atas, ubah Akses Umum menjadi:{' '}
                    <b className="text-emerald-300">"Anyone with the link can view / Siapa saja yang memiliki link dapat melihat"</b>.
                  </li>
                  <li>
                    Masukkan Spreadsheet ID dan API Key ke tab <b>API Key</b> pada aplikasi ini, lalu klik <b>Simpan & Uji Koneksi</b>.
                  </li>
                </ol>
              </div>

              {/* Troubleshooting Box */}
              <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-2 text-[11px]">
                <div className="font-bold text-white flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  <span>Daftar Solusi Kendala Umum:</span>
                </div>

                <div className="space-y-1.5 text-slate-300">
                  <div>
                    <span className="font-semibold text-rose-300">• API key not valid:</span> Kunci yang disalin bukan Google Cloud API Key atau terpotong. Pastikan berawalan <code>AIzaSy...</code>.
                  </div>
                  <div>
                    <span className="font-semibold text-rose-300">• Permission Denied:</span> Spreadsheet belum di-share dengan opsi "Siapa saja yang memiliki link dapat melihat".
                  </div>
                  <div>
                    <span className="font-semibold text-rose-300">• Google Sheets API disabled:</span> Buka Library Google Cloud dan klik Enable pada Google Sheets API.
                  </div>
                  <div>
                    <span className="font-semibold text-rose-300">• Dokumen tidak ditemukan:</span> Periksa Spreadsheet ID dari URL antara <code>/d/</code> dan <code>/edit</code>.
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
