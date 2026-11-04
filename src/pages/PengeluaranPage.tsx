import React, { useState } from 'react';
import { Transaction } from '../types/index.ts';
import { formatRupiah, formatTanggalIndo } from '../utils/finance.ts';
import {
  ArrowUpRight,
  Search,
  Plus,
  Edit2,
  Trash2,
  Calendar,
  User,
  Tag,
} from 'lucide-react';

interface PengeluaranPageProps {
  transactions: Transaction[];
  isAdmin: boolean;
  onOpenAddModal: () => void;
  onEditTransaction: (trx: Transaction) => void;
  onDeleteTransaction: (id: string) => Promise<void>;
}

export const PengeluaranPage: React.FC<PengeluaranPageProps> = ({
  transactions,
  isAdmin,
  onOpenAddModal,
  onEditTransaction,
  onDeleteTransaction,
}) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterMonth, setFilterMonth] = useState<string>('all');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const pengeluaranList = transactions.filter((t) => t.jenis === 'pengeluaran');

  const filtered = pengeluaranList.filter((item) => {
    if (filterMonth !== 'all' && !item.tanggal.startsWith(filterMonth)) {
      return false;
    }
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const inPenerima = item.nama_penerima?.toLowerCase().includes(q);
      const inKet = item.keterangan?.toLowerCase().includes(q);
      const inNominal = item.nominal.toString().includes(q);
      return inPenerima || inKet || inNominal;
    }
    return true;
  });

  const totalNominal = filtered.reduce((acc, curr) => acc + (Number(curr.nominal) || 0), 0);

  const availableMonths = Array.from(
    new Set(pengeluaranList.map((t) => t.tanggal.slice(0, 7)))
  ).sort();

  const handleDelete = async (id: string, penerima: string) => {
    if (window.confirm(`Yakin ingin menghapus data pengeluaran kepada "${penerima}"?`)) {
      try {
        setDeletingId(id);
        await onDeleteTransaction(id);
      } catch (err: any) {
        alert(err.message || 'Gagal menghapus data pengeluaran');
      } finally {
        setDeletingId(null);
      }
    }
  };

  return (
    <div className="space-y-4 pb-20">
      {/* Header Banner */}
      <div className="rounded-2xl p-4 sm:p-5 bg-gradient-to-r from-rose-950/60 via-purple-950/60 to-slate-900/60 border border-rose-500/20 backdrop-blur-xl shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30">
            <ArrowUpRight className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-white">
              Riwayat Pengeluaran Dana
            </h2>
            <p className="text-xs text-rose-300/80">
              Pengadaan obat-obatan haji, alkes darurat, konsumsi & logistik posko
            </p>
          </div>
        </div>

        {isAdmin && (
          <button
            type="button"
            onClick={onOpenAddModal}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-lg shadow-rose-600/30 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Pengeluaran</span>
          </button>
        )}
      </div>

      {/* Summary Total Bar */}
      <div className="rounded-xl p-3 bg-white/5 border border-white/10 flex items-center justify-between text-xs">
        <span className="text-slate-300">
          Total Terfilter ({filtered.length} Transaksi):
        </span>
        <span className="text-sm font-extrabold text-rose-400">
          -{formatRupiah(totalNominal)}
        </span>
      </div>

      {/* Search & Month Filter Controls */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            placeholder="Cari penerima atau keterangan pengeluaran..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-black/30 border border-white/15 text-white text-xs focus:border-rose-500 focus:outline-none placeholder:text-slate-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={filterMonth}
            onChange={(e) => setFilterMonth(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-black/30 border border-white/15 text-white text-xs focus:border-rose-500 focus:outline-none"
          >
            <option value="all" className="bg-slate-900 text-white">
              Semua Bulan ({pengeluaranList.length} Transaksi)
            </option>
            {availableMonths.map((m) => (
              <option key={m} value={m} className="bg-slate-900 text-white">
                Bulan {m}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Transaction List */}
      <div className="space-y-2.5">
        {filtered.length === 0 ? (
          <div className="rounded-2xl p-8 bg-white/5 border border-white/10 text-center text-slate-400 text-xs">
            Tidak ada transaksi pengeluaran yang sesuai kriteria pencarian.
          </div>
        ) : (
          filtered.map((item) => (
            <div
              key={item.id}
              className="rounded-2xl p-4 bg-white/5 backdrop-blur-md border border-white/10 hover:border-rose-500/30 transition-all shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
            >
              <div className="space-y-1.5 min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[10px] text-pink-300 px-2 py-0.5 rounded bg-pink-500/20 border border-pink-500/30">
                    {item.id}
                  </span>
                  <span className="text-[11px] text-slate-400 flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-rose-400" />
                    {formatTanggalIndo(item.tanggal)}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 font-bold text-white text-sm">
                  <User className="w-4 h-4 text-rose-400 shrink-0" />
                  <span className="truncate">{item.nama_penerima || 'Pihak Ketiga / Vendor'}</span>
                </div>

                <div className="text-slate-300/90 text-xs flex items-start gap-1">
                  <Tag className="w-3 h-3 text-pink-400 shrink-0 mt-0.5" />
                  <span>{item.keterangan}</span>
                </div>

                {item.dibuat_oleh && (
                  <div className="text-[10px] text-purple-300/60">
                    Disahkan oleh: {item.dibuat_oleh}
                  </div>
                )}
              </div>

              {/* Amount and Admin actions */}
              <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center border-t sm:border-t-0 pt-2 sm:pt-0 border-white/10 shrink-0 gap-2">
                <div className="text-base font-extrabold text-rose-400">
                  -{formatRupiah(item.nominal)}
                </div>

                {isAdmin && (
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => onEditTransaction(item)}
                      className="p-1.5 rounded-lg bg-white/10 hover:bg-rose-500/20 text-slate-300 hover:text-rose-300 transition-colors"
                      title="Edit Pengeluaran"
                      aria-label={`Edit Pengeluaran ${item.id}`}
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(item.id, item.nama_penerima || item.keterangan)}
                      disabled={deletingId === item.id}
                      className="p-1.5 rounded-lg bg-white/10 hover:bg-rose-500/20 text-slate-300 hover:text-rose-300 transition-colors"
                      title="Hapus Pengeluaran"
                      aria-label={`Hapus Pengeluaran ${item.id}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
