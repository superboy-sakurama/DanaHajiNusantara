import React, { useState } from 'react';
import { GoogleSheetsConfig } from '../types/index.ts';
import { api } from '../utils/api.ts';
import {
  X,
  Database,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  RefreshCw,
  KeyRound,
  ExternalLink,
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
  const [activeTab, setActiveTab] = useState<'status' | 'apiKeyGuide' | 'schema' | 'config'>('status');
  const [sheetId, setSheetId] = useState<string>('');
  const [apiKey, setApiKey] = useState<string>('');
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; sheetNames?: string[] } | null>(null);
  const [isTesting, setIsTesting] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  if (!isOpen) return null;

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
      if (res.success) {
        onConfigUpdated();
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err.message || 'Gagal menghubungi Google Sheets API',
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await api.updateSheetsConfig({
        sheetId: sheetId.trim(),
        apiKey: apiKey.trim(),
      });
      onConfigUpdated();
      setActiveTab('status');
      handleTestConnection();
    } catch (err: any) {
      alert(err.message || 'Gagal menyimpan konfigurasi');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-xl max-h-[92vh] flex flex-col rounded-3xl bg-gradient-to-b from-slate-900/95 via-purple-950/95 to-slate-950/95 border border-white/20 shadow-2xl p-5 sm:p-6 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-purple-600 to-pink-500 text-white shadow-md">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-1.5">
                <span>Integrasi Google Spreadsheet</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Google Sheets API v4
                </span>
              </h3>
              <p className="text-[11px] text-purple-200/70">Koneksi Langsung Tanpa Apps Script</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white"
            aria-label="Tutup Modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Buttons */}
        <div className="grid grid-cols-4 gap-1 p-1 mt-3 rounded-xl bg-black/40 border border-white/10 shrink-0 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab('status')}
            className={`py-1.5 rounded-lg transition-all text-center truncate ${
              activeTab === 'status' ? 'bg-purple-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Status
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('apiKeyGuide')}
            className={`py-1.5 rounded-lg transition-all text-center truncate ${
              activeTab === 'apiKeyGuide' ? 'bg-purple-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Panduan API
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('schema')}
            className={`py-1.5 rounded-lg transition-all text-center truncate ${
              activeTab === 'schema' ? 'bg-purple-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            3 Sheet
          </button>
          {isAdmin && (
            <button
              type="button"
              onClick={() => setActiveTab('config')}
              className={`py-1.5 rounded-lg transition-all text-center truncate ${
                activeTab === 'config' ? 'bg-purple-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Pengaturan
            </button>
          )}
        </div>

        {/* Tab Content Body */}
        <div className="mt-4 flex-1 overflow-y-auto no-scrollbar space-y-4 pr-1 text-xs">
          {/* TAB 1: STATUS */}
          {activeTab === 'status' && (
            <div className="space-y-3.5">
              <div
                className={`p-4 rounded-2xl border flex items-start gap-3 ${
                  config?.isConfigured
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200'
                    : 'bg-purple-500/10 border-purple-500/30 text-purple-200'
                }`}
              >
                {config?.isConfigured ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                )}
                <div className="space-y-1">
                  <div className="font-bold text-white text-sm">
                    {config?.isConfigured
                      ? 'Tersambung ke Google Spreadsheet'
                      : 'Mode Data Lokal Aktif'}
                  </div>
                  <p className="text-slate-300 leading-relaxed text-[11px]">
                    {config?.message}
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

              {/* Action: Test Connection & Sync */}
              <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-200">Uji Akses Google Sheets API v4</span>
                  <button
                    type="button"
                    onClick={handleTestConnection}
                    disabled={isTesting}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-medium transition-all shadow-md cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
                    <span>{isTesting ? 'Menguji...' : 'Tes Koneksi'}</span>
                  </button>
                </div>

                {testResult && (
                  <div
                    className={`p-2.5 rounded-lg text-xs border ${
                      testResult.success
                        ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-200'
                        : 'bg-rose-500/15 border-rose-500/30 text-rose-200'
                    }`}
                  >
                    <div className="font-semibold">{testResult.message}</div>
                    {testResult.sheetNames && testResult.sheetNames.length > 0 && (
                      <div className="text-[10px] text-emerald-300/80 mt-1">
                        Lembar terdeteksi: {testResult.sheetNames.join(', ')}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Kelebihan Tanpa Apps Script */}
              <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 space-y-2 text-[11px] text-slate-300">
                <div className="font-bold text-white flex items-center gap-1.5">
                  <KeyRound className="w-4 h-4 text-amber-400" />
                  <span>Kelebihan Menggunakan Google Sheets API v4 Langsung:</span>
                </div>
                <ul className="list-disc pl-4 space-y-1 text-slate-300/90">
                  <li><b>Murni Standar Google Cloud</b>: Tidak bergantung pada skrip tambahan atau webhook pihak ketiga.</li>
                  <li><b>Kinerja Cepat</b>: Membaca data spreadsheet secara langsung melalui REST endpoint resmi Google.</li>
                  <li><b>Keamanan Terjaga</b>: API Key diproteksi di sisi server tanpa terekspos di browser pengguna.</li>
                </ul>
              </div>
            </div>
          )}

          {/* TAB 2: PANDUAN API KEY */}
          {activeTab === 'apiKeyGuide' && (
            <div className="space-y-3.5">
              <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-2.5">
                <div className="font-bold text-white text-sm flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-pink-400" />
                  <span>Panduan Menghubungkan Google Spreadsheet:</span>
                </div>

                <ol className="list-decimal pl-4 space-y-2 text-[11px] text-slate-300/90">
                  <li>
                    Buka{' '}
                    <a
                      href="https://console.cloud.google.com/apis/credentials"
                      target="_blank"
                      rel="noreferrer"
                      className="text-pink-300 underline font-semibold inline-flex items-center gap-1"
                    >
                      Google Cloud Console <ExternalLink className="w-3 h-3" />
                    </a>.
                  </li>
                  <li>
                    Aktifkan API: Cari <b>Google Sheets API</b> di menu <i>APIs & Services &gt; Library</i>, lalu klik <b>Enable</b>.
                  </li>
                  <li>
                    Buat Kredensial: Di menu <i>Credentials</i>, klik <b>+ CREATE CREDENTIALS &gt; API Key</b>.
                  </li>
                  <li>
                    Salin string API Key yang dibuat (contoh: <code>AIzaSy...</code>).
                  </li>
                  <li>
                    Buka Google Spreadsheet keuangan Anda, klik tombol <b>Share / Bagikan</b> di kanan atas, ubah General Access ke:{' '}
                    <b className="text-amber-300">"Anyone with the link can view / Siapa saja yang memiliki link dapat melihat"</b>.
                  </li>
                  <li>
                    Salin ID Spreadsheet dari URL (karakter antara <code>/d/</code> dan <code>/edit</code>).
                  </li>
                  <li>
                    Masukkan ke tab <b>Pengaturan</b> di modal ini (atau di file <code>.env</code> server) lalu klik <b>Simpan & Uji Koneksi</b>.
                  </li>
                </ol>
              </div>
            </div>
          )}

          {/* TAB 3: SKEMA 3 SHEET */}
          {activeTab === 'schema' && (
            <div className="space-y-3">
              {/* Sheet Users */}
              <div className="p-3 rounded-2xl bg-white/5 border border-white/10 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-emerald-300">1. Sheet "Users"</span>
                  <button
                    type="button"
                    onClick={() => handleCopy('id,username,password_hash,role,nama_lengkap,jabatan', 'users')}
                    className="flex items-center gap-1 text-[11px] text-purple-300 hover:text-white"
                  >
                    {copiedText === 'users' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>Salin Header</span>
                  </button>
                </div>
                <p className="text-[11px] text-slate-300">
                  Kolom: <code>id, username, password_hash, role, nama_lengkap, jabatan</code>
                </p>
                <div className="text-[10px] text-slate-400 bg-black/40 p-2 rounded-xl font-mono">
                  usr-1 | admin | admin123 | admin | dr. H. Rahmat Hidayat | Ketua Tim Haji<br />
                  usr-2 | petugas | petugas123 | anggota | Ns. Hj. Siti Nurjanah | Paramedis Kloter
                </div>
              </div>

              {/* Sheet Saldo */}
              <div className="p-3 rounded-2xl bg-white/5 border border-white/10 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-purple-300">2. Sheet "Saldo"</span>
                  <button
                    type="button"
                    onClick={() => handleCopy('id,tahun,saldo_awal_tahun_lalu,saldo_realtime,catatan,updated_at', 'saldo')}
                    className="flex items-center gap-1 text-[11px] text-purple-300 hover:text-white"
                  >
                    {copiedText === 'saldo' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>Salin Header</span>
                  </button>
                </div>
                <p className="text-[11px] text-slate-300">
                  Kolom: <code>id, tahun, saldo_awal_tahun_lalu, saldo_realtime, catatan, updated_at</code>
                </p>
                <div className="text-[10px] text-slate-400 bg-black/40 p-2 rounded-xl font-mono">
                  sld-2026 | 1447 H / 2026 M | 12500000 | 12500000 | Sisa kas operasional tahun lalu
                </div>
              </div>

              {/* Sheet Transaksi */}
              <div className="p-3 rounded-2xl bg-white/5 border border-white/10 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-pink-300">3. Sheet "Transaksi"</span>
                  <button
                    type="button"
                    onClick={() => handleCopy('id,tanggal,jenis,nominal,sumber_dana,nama_penerima,keterangan,dibuat_oleh,created_at', 'trx')}
                    className="flex items-center gap-1 text-[11px] text-purple-300 hover:text-white"
                  >
                    {copiedText === 'trx' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>Salin Header</span>
                  </button>
                </div>
                <p className="text-[11px] text-slate-300">
                  Kolom: <code>id, tanggal, jenis, nominal, sumber_dana, nama_penerima, keterangan, dibuat_oleh, created_at</code>
                </p>
                <div className="text-[10px] text-slate-400 bg-black/40 p-2 rounded-xl font-mono">
                  TRX-001 | 2026-04-10 | penerimaan | 15000000 | Dana BOK | | Pencairan Tahap 1<br />
                  TRX-002 | 2026-04-18 | pengeluaran | 4200000 | | PT Kimia Farma | Beli Obat Haji
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: PENGATURAN API KEY (ADMIN ONLY) */}
          {activeTab === 'config' && isAdmin && (
            <form onSubmit={handleSaveConfig} className="space-y-3.5">
              <div>
                <label className="block text-slate-200 font-semibold mb-1">
                  Google Spreadsheet ID
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: 1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms"
                  value={sheetId}
                  onChange={(e) => setSheetId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-black/30 border border-white/15 text-white font-mono text-[11px] focus:border-pink-500 focus:outline-none"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  Salin dari URL dokumen Google Sheets antara /d/ dan /edit.
                </span>
              </div>

              <div>
                <label className="block text-slate-200 font-semibold mb-1">
                  Google Cloud API Key
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: AIzaSyA...B123"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-black/30 border border-white/15 text-white font-mono text-[11px] focus:border-pink-500 focus:outline-none"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  API Key resmi Google Cloud dengan Google Sheets API v4 aktif.
                </span>
              </div>

              <button
                type="submit"
                disabled={isSaving}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-purple-600 via-fuchsia-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold transition-all shadow-lg shadow-pink-500/25 cursor-pointer"
              >
                {isSaving ? 'Menyimpan Konfigurasi...' : 'Simpan & Uji Koneksi'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
