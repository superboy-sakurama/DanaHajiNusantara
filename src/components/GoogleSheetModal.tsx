import React, { useState } from 'react';
import { GoogleSheetsConfig } from '../types/index.ts';
import { api } from '../utils/api.ts';
import { X, Database, CheckCircle2, AlertCircle, Copy, Check, RefreshCw } from 'lucide-react';

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
  const [activeTab, setActiveTab] = useState<'status' | 'schema' | 'config'>('status');
  const [sheetId, setSheetId] = useState<string>('');
  const [clientEmail, setClientEmail] = useState<string>('');
  const [privateKey, setPrivateKey] = useState<string>('');
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
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
        sheetId,
        clientEmail,
        privateKey,
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-xl max-h-[90vh] flex flex-col rounded-2xl bg-gradient-to-b from-slate-900/95 via-purple-950/95 to-slate-950/95 border border-white/20 shadow-2xl p-5 sm:p-6 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-300">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Integrasi Google Spreadsheet</h3>
              <p className="text-[11px] text-purple-200/70">Database Google Sheets API Service Account</p>
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
        <div className="flex gap-2 p-1 mt-3 rounded-xl bg-black/40 border border-white/10 shrink-0 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab('status')}
            className={`flex-1 py-1.5 rounded-lg transition-all ${
              activeTab === 'status'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Status Koneksi
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('schema')}
            className={`flex-1 py-1.5 rounded-lg transition-all ${
              activeTab === 'schema'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Skema 3 Sheet
          </button>
          {isAdmin && (
            <button
              type="button"
              onClick={() => setActiveTab('config')}
              className={`flex-1 py-1.5 rounded-lg transition-all ${
                activeTab === 'config'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Kredensial API
            </button>
          )}
        </div>

        {/* Tab Content Body */}
        <div className="mt-4 flex-1 overflow-y-auto no-scrollbar space-y-4 pr-1">
          {activeTab === 'status' && (
            <div className="space-y-3.5">
              <div
                className={`p-4 rounded-xl border flex items-start gap-3 ${
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
                <div className="text-xs space-y-1">
                  <div className="font-bold text-white text-sm">
                    {config?.isConfigured
                      ? 'Tersambung ke Google Spreadsheet'
                      : 'Mode Demo Lokal Aktif'}
                  </div>
                  <p className="text-slate-300 leading-relaxed">
                    {config?.message ||
                      'Data keuangan operasional disimpan dalam backend server yang responsif.'}
                  </p>
                  {config?.sheetId && (
                    <div className="text-[11px] text-purple-300 font-mono mt-1">
                      ID Sheet: {config.sheetId}
                    </div>
                  )}
                </div>
              </div>

              {/* Action: Test Connection */}
              <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-200">Uji Akses Google Sheets API</span>
                  <button
                    type="button"
                    onClick={handleTestConnection}
                    disabled={isTesting}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-medium transition-colors"
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
                    {testResult.message}
                  </div>
                )}
              </div>

              <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 text-xs text-slate-300 space-y-2">
                <div className="font-bold text-white">Panduan Penggunaan Google Sheets:</div>
                <ol className="list-decimal pl-4 space-y-1 text-slate-300/90 text-[11px]">
                  <li>Buat dokumen spreadsheet baru di Google Sheets.</li>
                  <li>Buat 3 lembar kerja (sheets) dengan nama: <code>Users</code>, <code>Saldo</code>, dan <code>Transaksi</code>.</li>
                  <li>Bagikan (Share) spreadsheet tersebut ke alamat email Service Account dengan akses <b>Editor</b>.</li>
                  <li>Salin ID Spreadsheet (bagian teks di URL antara <code>/d/</code> dan <code>/edit</code>).</li>
                </ol>
              </div>
            </div>
          )}

          {activeTab === 'schema' && (
            <div className="space-y-3 text-xs">
              {/* Sheet Users */}
              <div className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-1.5">
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
                <div className="text-[10px] text-slate-400 bg-black/40 p-2 rounded-lg font-mono">
                  usr-1 | admin | admin123 | admin | dr. H. Rahmat Hidayat | Ketua Tim Haji<br />
                  usr-2 | petugas | petugas123 | anggota | Ns. Hj. Siti Nurjanah | Paramedis Kloter
                </div>
              </div>

              {/* Sheet Saldo */}
              <div className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-1.5">
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
                <div className="text-[10px] text-slate-400 bg-black/40 p-2 rounded-lg font-mono">
                  sld-2026 | 1447 H / 2026 M | 12500000 | 12500000 | Sisa kas operasional tahun lalu
                </div>
              </div>

              {/* Sheet Transaksi */}
              <div className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-1.5">
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
                <div className="text-[10px] text-slate-400 bg-black/40 p-2 rounded-lg font-mono">
                  TRX-001 | 2026-04-10 | penerimaan | 15000000 | Dana BOK | | Pencairan Tahap 1<br />
                  TRX-002 | 2026-04-18 | pengeluaran | 4200000 | | Apotek Kimia Farma | Beli Obat Haji
                </div>
              </div>
            </div>
          )}

          {activeTab === 'config' && isAdmin && (
            <form onSubmit={handleSaveConfig} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-200 font-semibold mb-1">
                  Google Spreadsheet ID
                </label>
                <input
                  type="text"
                  placeholder="Contoh: 1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms"
                  value={sheetId}
                  onChange={(e) => setSheetId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-black/30 border border-white/15 text-white font-mono text-[11px] focus:border-pink-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-200 font-semibold mb-1">
                  Service Account Client Email
                </label>
                <input
                  type="email"
                  placeholder="Contoh: haji-finance@project-id.iam.gserviceaccount.com"
                  value={clientEmail}
                  onChange={(e) => setClientEmail(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-black/30 border border-white/15 text-white font-mono text-[11px] focus:border-pink-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-200 font-semibold mb-1">
                  Private Key (PEM Format)
                </label>
                <textarea
                  rows={4}
                  placeholder="-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwgg...\n-----END PRIVATE KEY-----"
                  value={privateKey}
                  onChange={(e) => setPrivateKey(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-black/30 border border-white/15 text-white font-mono text-[10px] focus:border-pink-500 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={isSaving}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold transition-all shadow-lg shadow-pink-500/25"
              >
                {isSaving ? 'Menyimpan Konfigurasi...' : 'Simpan & Hubungkan'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
