import React, { useState } from 'react';
import { Transaction, SaldoRecord, AuthUser } from '../types/index.ts';
import { formatRupiah, calculateFinancialSummary } from '../utils/finance.ts';
import { generateFinancialPdfReport } from '../utils/pdfExport.ts';
import { X, FileDown, FileCheck, CheckCircle2 } from 'lucide-react';

interface ExportPdfModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactions: Transaction[];
  saldo: SaldoRecord;
  currentUser: AuthUser;
}

export const ExportPdfModal: React.FC<ExportPdfModalProps> = ({
  isOpen,
  onClose,
  transactions,
  saldo,
  currentUser,
}) => {
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [successExport, setSuccessExport] = useState<boolean>(false);

  if (!isOpen) return null;

  // Extract unique months from transactions
  const availableMonths = Array.from(
    new Set(transactions.map((t) => t.tanggal.slice(0, 7)))
  ).sort();

  const filteredTransactions =
    selectedMonth === 'all'
      ? transactions
      : transactions.filter((t) => t.tanggal.startsWith(selectedMonth));

  const summary = calculateFinancialSummary(
    saldo.saldo_awal_tahun_lalu,
    filteredTransactions,
    saldo.tahun
  );

  const handleExport = () => {
    setIsExporting(true);
    setSuccessExport(false);

    try {
      const monthLabel =
        selectedMonth === 'all'
          ? `Seluruh Musim Haji ${saldo.tahun}`
          : `Bulan ${selectedMonth}`;

      generateFinancialPdfReport({
        saldo,
        transactions,
        user: currentUser,
        periodeTitle: `Laporan Keuangan ${monthLabel}`,
        filterMonth: selectedMonth === 'all' ? undefined : selectedMonth,
      });

      setSuccessExport(true);
      setTimeout(() => {
        setSuccessExport(false);
      }, 3500);
    } catch (err: any) {
      alert(`Gagal membuat PDF: ${err.message || 'Kesalahan'}`);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-lg rounded-2xl bg-gradient-to-b from-slate-900/95 via-purple-950/95 to-slate-950/95 border border-white/20 shadow-2xl p-5 sm:p-6 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-500/20 text-purple-300">
              <FileDown className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Ekspor Laporan Keuangan PDF</h3>
              <p className="text-[11px] text-purple-200/70">Format Standar Dinas Kesehatan & Kemenkes</p>
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

        {/* Content */}
        <div className="mt-4 space-y-4">
          {/* Filter Periode */}
          <div>
            <label className="block text-xs font-semibold text-purple-200 mb-1.5">
              Pilih Periode Laporan
            </label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-black/30 border border-white/15 text-white text-xs sm:text-sm focus:border-pink-500 focus:outline-none"
            >
              <option value="all" className="bg-slate-900 text-white">
                Seluruh Transaksi ({saldo.tahun}) - {transactions.length} Transaksi
              </option>
              {availableMonths.map((m) => (
                <option key={m} value={m} className="bg-slate-900 text-white">
                  Bulan {m} ({transactions.filter((t) => t.tanggal.startsWith(m)).length} Transaksi)
                </option>
              ))}
            </select>
          </div>

          {/* Report Summary Card Preview */}
          <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-2.5 text-xs">
            <div className="font-bold text-slate-200 flex items-center justify-between">
              <span>Ringkasan Lembar Laporan:</span>
              <span className="text-[11px] text-pink-300 font-normal">
                {filteredTransactions.length} Data Terpilih
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div className="p-2 rounded-lg bg-black/30 border border-white/5">
                <span className="text-slate-400 block">Saldo Awal:</span>
                <span className="font-bold text-slate-200">{formatRupiah(summary.saldoAwalTahunLalu)}</span>
              </div>
              <div className="p-2 rounded-lg bg-emerald-950/30 border border-emerald-500/20">
                <span className="text-emerald-300 block">Total Masuk:</span>
                <span className="font-bold text-emerald-400">+{formatRupiah(summary.totalPenerimaan)}</span>
              </div>
              <div className="p-2 rounded-lg bg-rose-950/30 border border-rose-500/20">
                <span className="text-rose-300 block">Total Keluar:</span>
                <span className="font-bold text-rose-400">-{formatRupiah(summary.totalPengeluaran)}</span>
              </div>
              <div className="p-2 rounded-lg bg-purple-950/30 border border-purple-500/20">
                <span className="text-purple-300 block">Sisa Saldo Kas:</span>
                <span className="font-bold text-purple-200">{formatRupiah(summary.saldoRealtime)}</span>
              </div>
            </div>

            <div className="text-[10px] text-slate-400 pt-1 border-t border-white/10">
              ✓ Dilengkapi Kop Surat Resmi Puskesmas & Tim Penyelenggara Haji<br />
              ✓ Rincian tabel Penerimaan & Pengeluaran dengan format autotable rapi<br />
              ✓ Lembar tanda tangan Ketua Tim Medis & Bendahara Operasional
            </div>
          </div>

          {successExport && (
            <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-200 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Dokumen PDF berhasil diunduh ke perangkat Anda!</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              disabled={isExporting}
              className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-slate-300 text-xs font-medium"
            >
              Tutup
            </button>
            <button
              type="button"
              onClick={handleExport}
              disabled={isExporting}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 via-fuchsia-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white text-xs font-bold shadow-lg shadow-pink-500/30 transition-all cursor-pointer"
            >
              <FileCheck className="w-4 h-4" />
              <span>{isExporting ? 'Memproses PDF...' : 'Unduh Dokumen PDF'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
