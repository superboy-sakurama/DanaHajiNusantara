import React from 'react';
import { Transaction, SaldoRecord, AuthUser } from '../types/index.ts';
import { formatRupiah, formatTanggalIndo } from '../utils/finance.ts';
import { StatCards } from '../components/StatCard.tsx';
import { Kabah4DScene } from '../components/Kabah4DScene.tsx';
import {
  ArrowDownLeft,
  ArrowUpRight,
  FileText,
  Clock,
  PlusCircle,
  TrendingUp,
  BarChart3,
  Calendar,
} from 'lucide-react';

interface DashboardPageProps {
  user: AuthUser;
  isAdmin: boolean;
  saldo: SaldoRecord;
  transactions: Transaction[];
  onOpenAddModal: (type?: 'penerimaan' | 'pengeluaran') => void;
  onOpenSaldoModal: () => void;
  onOpenExportModal: () => void;
  onNavigateTab: (tab: 'penerimaan' | 'pengeluaran' | 'laporan') => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  user,
  isAdmin,
  saldo,
  transactions,
  onOpenAddModal,
  onOpenSaldoModal,
  onOpenExportModal,
  onNavigateTab,
}) => {
  // Sort recent transactions
  const recentTransactions = [...transactions]
    .sort((a, b) => b.tanggal.localeCompare(a.tanggal))
    .slice(0, 5);

  const totalPenerimaan = transactions
    .filter((t) => t.jenis === 'penerimaan')
    .reduce((acc, curr) => acc + (Number(curr.nominal) || 0), 0);

  const totalPengeluaran = transactions
    .filter((t) => t.jenis === 'pengeluaran')
    .reduce((acc, curr) => acc + (Number(curr.nominal) || 0), 0);

  const totalVolume = totalPenerimaan + totalPengeluaran;
  const penerimaanPercent = totalVolume > 0 ? Math.round((totalPenerimaan / totalVolume) * 100) : 50;
  const pengeluaranPercent = 100 - penerimaanPercent;

  return (
    <div className="space-y-4 pb-20">
      {/* Top Banner with 4D Ka'bah Animation & User Greeting */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-purple-900/50 via-slate-900/60 to-pink-900/50 backdrop-blur-xl border border-white/15 p-4 sm:p-5 shadow-2xl">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="w-full sm:w-1/2 text-left z-10">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-pink-500/20 text-pink-300 border border-pink-500/30 text-[11px] font-semibold mb-1.5">
              <span>🕋 Posko Kesehatan Kloter</span>
            </div>
            <h2 className="text-lg sm:text-xl font-extrabold text-white">
              Ahlan Wa Sahlan,
            </h2>
            <p className="text-sm font-semibold text-pink-200">
              {user.nama_lengkap}
            </p>
            <p className="text-xs text-purple-200/70 mt-0.5">
              {user.jabatan || (isAdmin ? 'Admin Pengelola Kas Haji' : 'Petugas Haji')}
            </p>

            <div className="mt-3 flex items-center gap-2">
              <span className="text-[11px] text-slate-300 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-pink-400" />
                Musim Haji {saldo.tahun}
              </span>
            </div>
          </div>

          {/* 4D Ka'bah Animation Header */}
          <div className="w-full sm:w-1/2 flex justify-center">
            <Kabah4DScene size="compact" interactive={true} />
          </div>
        </div>
      </div>

      {/* Financial Stat Cards */}
      <StatCards
        saldoAwal={saldo.saldo_awal_tahun_lalu}
        saldoRealtime={saldo.saldo_realtime}
        totalPenerimaan={totalPenerimaan}
        totalPengeluaran={totalPengeluaran}
        tahun={saldo.tahun}
        isAdmin={isAdmin}
        onEditSaldoAwal={onOpenSaldoModal}
      />

      {/* Quick Action Buttons */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
        {isAdmin && (
          <button
            type="button"
            onClick={() => onOpenAddModal('penerimaan')}
            className="p-3 rounded-2xl bg-emerald-950/40 hover:bg-emerald-950/60 border border-emerald-500/30 text-emerald-200 flex items-center gap-2.5 transition-all text-left shadow-lg"
          >
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-300">
              <ArrowDownLeft className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-white">+ Catat Masuk</div>
              <div className="text-[10px] text-emerald-300/80">Dana operasional</div>
            </div>
          </button>
        )}

        {isAdmin && (
          <button
            type="button"
            onClick={() => onOpenAddModal('pengeluaran')}
            className="p-3 rounded-2xl bg-rose-950/40 hover:bg-rose-950/60 border border-rose-500/30 text-rose-200 flex items-center gap-2.5 transition-all text-left shadow-lg"
          >
            <div className="p-2 rounded-xl bg-rose-500/20 text-rose-300">
              <ArrowUpRight className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-white">- Catat Keluar</div>
              <div className="text-[10px] text-rose-300/80">Obat & logistik</div>
            </div>
          </button>
        )}

        <button
          type="button"
          onClick={onOpenExportModal}
          className={`p-3 rounded-2xl bg-purple-950/40 hover:bg-purple-950/60 border border-purple-500/30 text-purple-200 flex items-center gap-2.5 transition-all text-left shadow-lg ${
            !isAdmin ? 'col-span-2 sm:col-span-3' : ''
          }`}
        >
          <div className="p-2 rounded-xl bg-purple-500/20 text-purple-300">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold text-white">Ekspor Laporan PDF</div>
            <div className="text-[10px] text-purple-300/80">Cetak dokumen resmi</div>
          </div>
        </button>
      </div>

      {/* Arus Kas & Analisis Visual */}
      <div className="rounded-2xl p-4 bg-white/5 backdrop-blur-md border border-white/10 shadow-xl space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-pink-400" />
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              Rasio Arus Kas Keuangan
            </h3>
          </div>
          <span className="text-[11px] text-slate-400">
            Total Arus: {formatRupiah(totalVolume)}
          </span>
        </div>

        {/* Progress ratio bar */}
        <div>
          <div className="h-3 w-full bg-black/40 rounded-full overflow-hidden flex p-0.5 border border-white/10">
            <div
              style={{ width: `${penerimaanPercent}%` }}
              className="bg-emerald-500 h-full rounded-full transition-all duration-500"
              title={`Penerimaan: ${penerimaanPercent}%`}
            />
            <div
              style={{ width: `${pengeluaranPercent}%` }}
              className="bg-rose-500 h-full rounded-full transition-all duration-500 ml-1"
              title={`Pengeluaran: ${pengeluaranPercent}%`}
            />
          </div>
          <div className="flex items-center justify-between text-[11px] mt-1.5 font-medium">
            <span className="text-emerald-300">
              ● Dana Masuk: {penerimaanPercent}%
            </span>
            <span className="text-rose-300">
              ● Dana Keluar: {pengeluaranPercent}%
            </span>
          </div>
        </div>
      </div>

      {/* Riwayat Transaksi Terakhir */}
      <div className="rounded-2xl p-4 bg-white/5 backdrop-blur-md border border-white/10 shadow-xl space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-purple-400" />
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              Transaksi Terkini
            </h3>
          </div>
          <button
            type="button"
            onClick={() => onNavigateTab('penerimaan')}
            className="text-[11px] text-pink-400 hover:text-pink-300 font-semibold"
          >
            Lihat Semua →
          </button>
        </div>

        <div className="space-y-2">
          {recentTransactions.length === 0 ? (
            <div className="text-center py-6 text-slate-400 text-xs">
              Belum ada riwayat transaksi yang dicatat.
            </div>
          ) : (
            recentTransactions.map((trx) => (
              <div
                key={trx.id}
                className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 border border-white/5 hover:border-white/15 transition-all text-xs"
              >
                <div className="flex items-center gap-2.5 min-w-0 pr-2">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                      trx.jenis === 'penerimaan'
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : 'bg-rose-500/20 text-rose-400'
                    }`}
                  >
                    {trx.jenis === 'penerimaan' ? (
                      <ArrowDownLeft className="w-4 h-4" />
                    ) : (
                      <ArrowUpRight className="w-4 h-4" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="font-semibold text-slate-100 truncate">
                      {trx.jenis === 'penerimaan' ? trx.sumber_dana : trx.nama_penerima}
                    </div>
                    <div className="text-[10px] text-purple-200/60 truncate">
                      {formatTanggalIndo(trx.tanggal)} • {trx.keterangan}
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div
                    className={`font-bold ${
                      trx.jenis === 'penerimaan' ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {trx.jenis === 'penerimaan' ? '+' : '-'}
                    {formatRupiah(trx.nominal)}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
