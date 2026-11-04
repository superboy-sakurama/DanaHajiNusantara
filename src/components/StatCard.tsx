import React from 'react';
import { formatRupiah } from '../utils/finance.ts';
import { Wallet, ArrowDownCircle, ArrowUpCircle, History, Edit3 } from 'lucide-react';

interface StatCardsProps {
  saldoAwal: number;
  saldoRealtime: number;
  totalPenerimaan: number;
  totalPengeluaran: number;
  tahun: string;
  isAdmin: boolean;
  onEditSaldoAwal: () => void;
}

export const StatCards: React.FC<StatCardsProps> = ({
  saldoAwal,
  saldoRealtime,
  totalPenerimaan,
  totalPengeluaran,
  tahun,
  isAdmin,
  onEditSaldoAwal,
}) => {
  return (
    <div className="space-y-3">
      {/* HERO CARD: Saldo Realtime Terakhir */}
      <div className="relative overflow-hidden rounded-2xl p-5 bg-gradient-to-br from-purple-900/60 via-fuchsia-900/40 to-pink-900/60 backdrop-blur-xl border border-white/20 shadow-2xl">
        {/* Ambient background blur */}
        <div className="absolute -top-12 -right-12 w-36 h-36 bg-pink-500/20 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-purple-500/20 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-pink-500/20 border border-pink-500/30 text-pink-300">
                <Wallet className="w-4 h-4" />
              </span>
              <span className="text-xs font-semibold text-purple-200 uppercase tracking-wider">
                Sisa Saldo Kas Realtime
              </span>
            </div>
            <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-white/10 text-white/90 border border-white/15">
              Musim {tahun}
            </span>
          </div>

          <div className="mt-1">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white via-pink-100 to-amber-200 tracking-tight">
              {formatRupiah(saldoRealtime)}
            </h2>
            <p className="text-[11px] text-pink-200/70 mt-1 flex items-center gap-1">
              <span>✓ Saldo sinkron otomatis dengan riwayat kas transaksi</span>
            </p>
          </div>
        </div>
      </div>

      {/* 3 Secondary Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        {/* 1. Saldo Awal Tahun Lalu */}
        <div className="relative rounded-xl p-3.5 bg-white/5 backdrop-blur-md border border-white/10 shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-1.5 text-slate-300">
              <History className="w-3.5 h-3.5 text-purple-300" />
              <span className="text-[11px] font-medium text-slate-300">Saldo Awal Tahun Lalu</span>
            </div>
            {isAdmin && (
              <button
                type="button"
                onClick={onEditSaldoAwal}
                className="p-1 rounded-md bg-white/10 hover:bg-white/20 text-purple-200 hover:text-white transition-colors"
                title="Edit Saldo Awal Tahun Lalu (Admin)"
                aria-label="Edit Saldo Awal"
              >
                <Edit3 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <div>
            <div className="text-base sm:text-lg font-bold text-slate-100">
              {formatRupiah(saldoAwal)}
            </div>
            <div className="text-[10px] text-purple-300/60 mt-0.5">Kas tahun sebelumnya</div>
          </div>
        </div>

        {/* 2. Total Penerimaan */}
        <div className="relative rounded-xl p-3.5 bg-emerald-950/20 backdrop-blur-md border border-emerald-500/20 shadow-lg flex flex-col justify-between">
          <div className="flex items-center gap-1.5 text-emerald-300 mb-1.5">
            <ArrowDownCircle className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-[11px] font-medium text-emerald-200">Total Dana Masuk</span>
          </div>
          <div>
            <div className="text-base sm:text-lg font-bold text-emerald-400">
              +{formatRupiah(totalPenerimaan)}
            </div>
            <div className="text-[10px] text-emerald-300/60 mt-0.5">Penerimaan & bantuan</div>
          </div>
        </div>

        {/* 3. Total Pengeluaran */}
        <div className="relative rounded-xl p-3.5 bg-rose-950/20 backdrop-blur-md border border-rose-500/20 shadow-lg flex flex-col justify-between">
          <div className="flex items-center gap-1.5 text-rose-300 mb-1.5">
            <ArrowUpCircle className="w-3.5 h-3.5 text-rose-400" />
            <span className="text-[11px] font-medium text-rose-200">Total Dana Keluar</span>
          </div>
          <div>
            <div className="text-base sm:text-lg font-bold text-rose-400">
              -{formatRupiah(totalPengeluaran)}
            </div>
            <div className="text-[10px] text-rose-300/60 mt-0.5">Operasional & obat haji</div>
          </div>
        </div>
      </div>
    </div>
  );
};
