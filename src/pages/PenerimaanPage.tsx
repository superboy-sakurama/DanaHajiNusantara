import React, { useState, useMemo } from 'react';
import { Transaction } from '../types/index.ts';
import {
  formatRupiah,
  formatTanggalIndo,
  getTransactionCategory,
  getCategoryBadgeColor,
  PENERIMAAN_CATEGORIES,
} from '../utils/finance.ts';
import {
  ArrowDownLeft,
  Search,
  Plus,
  Edit2,
  Trash2,
  Calendar,
  Building2,
  Tag,
  Filter,
  X,
  RotateCcw,
  AlertTriangle,
} from 'lucide-react';

interface PenerimaanPageProps {
  transactions: Transaction[];
  isAdmin: boolean;
  onOpenAddModal: () => void;
  onEditTransaction: (trx: Transaction) => void;
  onDeleteTransaction: (id: string) => Promise<void>;
}

export const PenerimaanPage: React.FC<PenerimaanPageProps> = ({
  transactions,
  isAdmin,
  onOpenAddModal,
  onEditTransaction,
  onDeleteTransaction,
}) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterMonth, setFilterMonth] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [confirmDeleteTrx, setConfirmDeleteTrx] = useState<Transaction | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const penerimaanList = useMemo(() => {
    return transactions.filter((t) => t.jenis === 'penerimaan');
  }, [transactions]);

  const filtered = useMemo(() => {
    return penerimaanList.filter((item) => {
      // Filter Bulan
      if (filterMonth !== 'all' && !item.tanggal.startsWith(filterMonth)) {
        return false;
      }

      // Filter Kategori
      if (filterCategory !== 'all') {
        const cat = getTransactionCategory(item);
        if (cat.toLowerCase() !== filterCategory.toLowerCase()) {
          return false;
        }
      }

      // Filter Kata Kunci Pencarian
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase().trim();
        const inSumber = item.sumber_dana?.toLowerCase().includes(q);
        const inKet = item.keterangan?.toLowerCase().includes(q);
        const inNominal = item.nominal.toString().includes(q);
        const inTanggal = item.tanggal?.toLowerCase().includes(q);
        const inCat = getTransactionCategory(item).toLowerCase().includes(q);
        return inSumber || inKet || inNominal || inTanggal || inCat;
      }
      return true;
    });
  }, [penerimaanList, filterMonth, filterCategory, searchTerm]);

  const totalNominal = filtered.reduce((acc, curr) => acc + (Number(curr.nominal) || 0), 0);

  const availableMonths = useMemo(() => {
    return Array.from(new Set(penerimaanList.map((t) => t.tanggal.slice(0, 7)))).sort().reverse();
  }, [penerimaanList]);

  const isFilterActive = searchTerm.trim() !== '' || filterCategory !== 'all' || filterMonth !== 'all';

  const resetFilters = () => {
    setSearchTerm('');
    setFilterCategory('all');
    setFilterMonth('all');
  };

  const handleExecuteDelete = async () => {
    if (!confirmDeleteTrx) return;
    try {
      setDeletingId(confirmDeleteTrx.id);
      setDeleteError(null);
      await onDeleteTransaction(confirmDeleteTrx.id);
      setConfirmDeleteTrx(null);
    } catch (err: any) {
      setDeleteError(err.message || 'Gagal menghapus data penerimaan');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-4 pb-20">
      {/* Header Banner */}
      <div className="rounded-2xl p-4 sm:p-5 bg-gradient-to-r from-emerald-950/60 via-purple-950/60 to-slate-900/60 border border-emerald-500/20 backdrop-blur-xl shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            <ArrowDownLeft className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-white">
              Riwayat Penerimaan Dana
            </h2>
            <p className="text-xs text-emerald-300/80">
              Pencatatan BOK Haji, alokasi Dinkes, hibah, dan swadaya posko
            </p>
          </div>
        </div>

        {isAdmin && (
          <button
            type="button"
            onClick={onOpenAddModal}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/30 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Penerimaan</span>
          </button>
        )}
      </div>

      {/* Confirmation Modal for Safe Deletion (No window.alert/confirm) */}
      {confirmDeleteTrx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-sm rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 border border-rose-500/30 shadow-2xl p-5 space-y-4">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="p-2 rounded-xl bg-rose-500/20">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-white">Konfirmasi Hapus Data</h4>
                <p className="text-[11px] text-rose-300/80">Tindakan ini tidak dapat dibatalkan</p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-xs space-y-1">
              <div className="text-slate-400">Sumber Dana:</div>
              <div className="font-bold text-white">{confirmDeleteTrx.sumber_dana || '-'}</div>
              <div className="text-slate-400 mt-2">Nominal:</div>
              <div className="font-bold text-emerald-400">+{formatRupiah(confirmDeleteTrx.nominal)}</div>
              <div className="text-[10px] text-purple-200/60 mt-1">{confirmDeleteTrx.keterangan}</div>
            </div>

            {deleteError && (
              <div className="p-2.5 rounded-xl bg-rose-500/20 border border-rose-500/30 text-rose-200 text-xs">
                {deleteError}
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setConfirmDeleteTrx(null)}
                disabled={Boolean(deletingId)}
                className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleExecuteDelete}
                disabled={Boolean(deletingId)}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-lg shadow-rose-600/30 transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{deletingId ? 'Menghapus...' : 'Ya, Hapus'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Summary Total Bar with Active Filters indicator */}
      <div className="rounded-xl p-3 bg-white/5 border border-white/10 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2">
          <span className="text-slate-300">
            Total Terfilter ({filtered.length} Transaksi):
          </span>
          {isFilterActive && (
            <button
              type="button"
              onClick={resetFilters}
              className="flex items-center gap-1 text-[11px] text-pink-300 hover:text-pink-200 underline cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset Filter</span>
            </button>
          )}
        </div>
        <span className="text-sm font-extrabold text-emerald-400">
          +{formatRupiah(totalNominal)}
        </span>
      </div>

      {/* Search, Month, and Category Filter Controls */}
      <div className="space-y-2.5">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
          {/* Search Bar with Clear Button */}
          <div className="sm:col-span-6 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              aria-label="Cari transaksi penerimaan"
              placeholder="Cari sumber dana, keterangan, nominal, tanggal..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-9 py-2 rounded-xl bg-black/30 border border-white/15 text-white text-xs focus:border-emerald-500 focus:outline-none placeholder:text-slate-500 shadow-inner"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-white"
                aria-label="Hapus kata kunci pencarian penerimaan"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Category Dropdown Filter */}
          <div className="sm:col-span-3 relative">
            <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-emerald-400">
              <Tag className="w-3.5 h-3.5" />
            </div>
            <select
              aria-label="Filter kategori penerimaan"
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="w-full pl-8 pr-3 py-2 rounded-xl bg-black/30 border border-white/15 text-white text-xs focus:border-emerald-500 focus:outline-none cursor-pointer"
            >
              <option value="all" className="bg-slate-900 text-white">
                Semua Kategori ({penerimaanList.length})
              </option>
              {PENERIMAAN_CATEGORIES.map((cat) => (
                <option key={cat} value={cat} className="bg-slate-900 text-white">
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Month Dropdown Filter */}
          <div className="sm:col-span-3 relative">
            <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-purple-400">
              <Calendar className="w-3.5 h-3.5" />
            </div>
            <select
              aria-label="Filter bulan penerimaan"
              value={filterMonth}
              onChange={(e) => setFilterMonth(e.target.value)}
              className="w-full pl-8 pr-3 py-2 rounded-xl bg-black/30 border border-white/15 text-white text-xs focus:border-emerald-500 focus:outline-none cursor-pointer"
            >
              <option value="all" className="bg-slate-900 text-white">
                Semua Bulan
              </option>
              {availableMonths.map((m) => (
                <option key={m} value={m} className="bg-slate-900 text-white">
                  Bulan {m}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Quick Category Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
          <span className="text-[10px] text-slate-400 font-medium shrink-0 flex items-center gap-1">
            <Filter className="w-3 h-3 text-emerald-400" />
            Kategori:
          </span>
          <button
            type="button"
            onClick={() => setFilterCategory('all')}
            className={`text-[10px] px-2.5 py-1 rounded-full border transition-all shrink-0 cursor-pointer ${
              filterCategory === 'all'
                ? 'bg-emerald-600 text-white border-emerald-400 font-bold shadow-md shadow-emerald-600/30'
                : 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/10'
            }`}
          >
            Semua ({penerimaanList.length})
          </button>
          {PENERIMAAN_CATEGORIES.map((cat) => {
            const isSelected = filterCategory === cat;
            const badge = getCategoryBadgeColor(cat);
            const count = penerimaanList.filter((item) => getTransactionCategory(item) === cat).length;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setFilterCategory(isSelected ? 'all' : cat)}
                className={`text-[10px] px-2.5 py-1 rounded-full border transition-all shrink-0 cursor-pointer ${
                  isSelected
                    ? 'bg-emerald-600 text-white border-emerald-400 font-bold shadow-md shadow-emerald-600/30'
                    : `${badge.bg} ${badge.text} ${badge.border} hover:bg-white/10`
                }`}
              >
                {cat} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Transaction List */}
      <div className="space-y-2.5">
        {filtered.length === 0 ? (
          <div className="rounded-2xl p-8 bg-white/5 border border-dashed border-white/10 text-center text-slate-400 text-xs space-y-2.5">
            <Search className="w-7 h-7 mx-auto text-emerald-400 opacity-60" />
            <div className="font-semibold text-slate-200">
              Tidak ada data penerimaan yang cocok
            </div>
            <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
              {isFilterActive
                ? 'Tidak ditemukan penerimaan dana yang sesuai dengan kata kunci, kategori, atau bulan yang dipilih.'
                : 'Belum ada data penerimaan yang dicatat dalam sistem.'}
            </p>
            {isFilterActive && (
              <button
                type="button"
                onClick={resetFilters}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-200 text-xs font-semibold border border-emerald-500/30 transition-all cursor-pointer mt-1"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Filter & Pencarian</span>
              </button>
            )}
          </div>
        ) : (
          filtered.map((item) => {
            const cat = getTransactionCategory(item);
            const badge = getCategoryBadgeColor(cat);

            return (
              <div
                key={item.id}
                className="rounded-2xl p-4 bg-white/5 backdrop-blur-md border border-white/10 hover:border-emerald-500/30 transition-all shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div className="space-y-1.5 min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-[10px] text-purple-300 px-2 py-0.5 rounded bg-purple-500/20 border border-purple-500/30">
                      {item.id}
                    </span>
                    <span
                      className={`text-[9px] font-semibold px-2 py-0.5 rounded-full border ${badge.bg} ${badge.text} ${badge.border}`}
                    >
                      {cat}
                    </span>
                    <span className="text-[11px] text-slate-400 flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-emerald-400" />
                      {formatTanggalIndo(item.tanggal)}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 font-bold text-white text-sm">
                    <Building2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span className="truncate">{item.sumber_dana || 'Sumber Dana Puskesmas'}</span>
                  </div>

                  <div className="text-slate-300/90 text-xs flex items-start gap-1">
                    <Tag className="w-3 h-3 text-purple-400 shrink-0 mt-0.5" />
                    <span>{item.keterangan}</span>
                  </div>

                  {item.dibuat_oleh && (
                    <div className="text-[10px] text-purple-300/60">
                      Diterima oleh: {item.dibuat_oleh}
                    </div>
                  )}
                </div>

                {/* Amount and Admin actions */}
                <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center border-t sm:border-t-0 pt-2 sm:pt-0 border-white/10 shrink-0 gap-2">
                  <div className="text-base font-extrabold text-emerald-400">
                    +{formatRupiah(item.nominal)}
                  </div>

                  {isAdmin && (
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => onEditTransaction(item)}
                        className="p-1.5 rounded-lg bg-white/10 hover:bg-emerald-500/20 text-slate-300 hover:text-emerald-300 transition-colors cursor-pointer"
                        title="Edit Penerimaan"
                        aria-label={`Edit Penerimaan ${item.id}`}
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteTrx(item)}
                        disabled={deletingId === item.id}
                        className="p-1.5 rounded-lg bg-white/10 hover:bg-rose-500/20 text-slate-300 hover:text-rose-300 transition-colors cursor-pointer"
                        title="Hapus Penerimaan"
                        aria-label={`Hapus Penerimaan ${item.id}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

