import React, { useState } from 'react';
import { Transaction, SaldoRecord, AuthUser } from '../types/index.ts';
import { formatRupiah, formatTanggalIndo, calculateFinancialSummary } from '../utils/finance.ts';
import {
  FileText,
  FileDown,
  Printer,
  Calendar,
  ShieldCheck,
  CheckCircle,
  Building,
} from 'lucide-react';

interface LaporanPageProps {
  saldo: SaldoRecord;
  transactions: Transaction[];
  user: AuthUser;
  onOpenExportModal: () => void;
}

export const LaporanPage: React.FC<LaporanPageProps> = ({
  saldo,
  transactions,
  user,
  onOpenExportModal,
}) => {
  const [filterMonth, setFilterMonth] = useState<string>('all');
  const [reportTab, setReportTab] = useState<'semua' | 'penerimaan' | 'pengeluaran'>('semua');

  const availableMonths = Array.from(
    new Set(transactions.map((t) => t.tanggal.slice(0, 7)))
  ).sort();

  const filteredByMonth =
    filterMonth === 'all'
      ? transactions
      : transactions.filter((t) => t.tanggal.startsWith(filterMonth));

  const filteredTransactions = filteredByMonth.filter((t) => {
    if (reportTab === 'penerimaan') return t.jenis === 'penerimaan';
    if (reportTab === 'pengeluaran') return t.jenis === 'pengeluaran';
    return true;
  });

  const summary = calculateFinancialSummary(
    saldo.saldo_awal_tahun_lalu,
    filteredByMonth,
    saldo.tahun
  );

  return (
    <div className="space-y-4 pb-20">
      {/* Header Banner */}
      <div className="rounded-2xl p-4 sm:p-5 bg-gradient-to-r from-purple-950/70 via-slate-900/70 to-pink-950/70 border border-purple-500/20 backdrop-blur-xl shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-500/30">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-white">
              Laporan Pertanggungjawaban Keuangan
            </h2>
            <p className="text-xs text-purple-200/80">
              Dokumen resmi pertanggungjawaban kas operasional haji Puskesmas
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onOpenExportModal}
          className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 via-fuchsia-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white text-xs font-bold shadow-lg shadow-pink-500/30 transition-all cursor-pointer"
        >
          <FileDown className="w-4 h-4" />
          <span>Ekspor PDF Laporan</span>
        </button>
      </div>

      {/* Official Summary Box Preview */}
      <div className="rounded-2xl p-4 bg-white/5 backdrop-blur-md border border-white/10 shadow-xl space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-white/10 text-xs">
          <div className="flex items-center gap-2 text-slate-200 font-semibold">
            <Building className="w-4 h-4 text-purple-400" />
            <span>Kop Resmi UPTD Puskesmas & Tim Haji</span>
          </div>
          <span className="text-[11px] text-pink-300">
            Tahun Anggaran {saldo.tahun}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
          <div className="p-3 rounded-xl bg-black/30 border border-white/5">
            <span className="text-[10px] text-slate-400 block uppercase font-medium">Saldo Awal</span>
            <span className="text-sm font-bold text-slate-200">{formatRupiah(summary.saldoAwalTahunLalu)}</span>
          </div>
          <div className="p-3 rounded-xl bg-emerald-950/20 border border-emerald-500/20">
            <span className="text-[10px] text-emerald-300 block uppercase font-medium">Total Masuk</span>
            <span className="text-sm font-bold text-emerald-400">+{formatRupiah(summary.totalPenerimaan)}</span>
          </div>
          <div className="p-3 rounded-xl bg-rose-950/20 border border-rose-500/20">
            <span className="text-[10px] text-rose-300 block uppercase font-medium">Total Keluar</span>
            <span className="text-sm font-bold text-rose-400">-{formatRupiah(summary.totalPengeluaran)}</span>
          </div>
          <div className="p-3 rounded-xl bg-purple-950/30 border border-purple-500/30">
            <span className="text-[10px] text-purple-200 block uppercase font-medium">Saldo Kas Realtime</span>
            <span className="text-sm font-bold text-purple-200">{formatRupiah(summary.saldoRealtime)}</span>
          </div>
        </div>
      </div>

      {/* Filters & Tabs */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5">
        <div className="flex w-full sm:w-auto gap-1 p-1 rounded-xl bg-black/40 border border-white/10 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setReportTab('semua')}
            className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg transition-all ${
              reportTab === 'semua'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Semua ({filteredByMonth.length})
          </button>
          <button
            type="button"
            onClick={() => setReportTab('penerimaan')}
            className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg transition-all ${
              reportTab === 'penerimaan'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Penerimaan ({filteredByMonth.filter((t) => t.jenis === 'penerimaan').length})
          </button>
          <button
            type="button"
            onClick={() => setReportTab('pengeluaran')}
            className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg transition-all ${
              reportTab === 'pengeluaran'
                ? 'bg-rose-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Pengeluaran ({filteredByMonth.filter((t) => t.jenis === 'pengeluaran').length})
          </button>
        </div>

        <div className="w-full sm:w-64">
          <select
            value={filterMonth}
            onChange={(e) => setFilterMonth(e.target.value)}
            className="w-full px-3 py-1.5 rounded-xl bg-black/30 border border-white/15 text-white text-xs focus:border-pink-500 focus:outline-none"
          >
            <option value="all" className="bg-slate-900 text-white">
              Seluruh Musim Haji
            </option>
            {availableMonths.map((m) => (
              <option key={m} value={m} className="bg-slate-900 text-white">
                Bulan {m}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table Preview */}
      <div className="rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-purple-950/60 border-b border-white/10 text-slate-300 font-bold uppercase text-[10px]">
              <tr>
                <th className="py-3 px-3">Tanggal</th>
                <th className="py-3 px-3">Jenis</th>
                <th className="py-3 px-3">Pihak / Sumber</th>
                <th className="py-3 px-3">Keterangan</th>
                <th className="py-3 px-3 text-right">Nominal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-slate-200">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">
                    Tidak ada transaksi dalam filter ini.
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((trx) => (
                  <tr key={trx.id} className="hover:bg-white/5 transition-colors">
                    <td className="py-2.5 px-3 whitespace-nowrap text-slate-400 text-[11px]">
                      {formatTanggalIndo(trx.tanggal)}
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                          trx.jenis === 'penerimaan'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        }`}
                      >
                        {trx.jenis === 'penerimaan' ? 'Penerimaan' : 'Pengeluaran'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-white">
                      {trx.jenis === 'penerimaan' ? trx.sumber_dana : trx.nama_penerima}
                    </td>
                    <td className="py-2.5 px-3 text-slate-300/90 max-w-xs truncate">
                      {trx.keterangan}
                    </td>
                    <td
                      className={`py-2.5 px-3 text-right font-bold whitespace-nowrap ${
                        trx.jenis === 'penerimaan' ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {trx.jenis === 'penerimaan' ? '+' : '-'}
                      {formatRupiah(trx.nominal)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
