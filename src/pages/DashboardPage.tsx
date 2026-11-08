import React, { useState, useMemo } from 'react';
import { Transaction, SaldoRecord, AuthUser } from '../types/index.ts';
import {
  formatRupiah,
  formatTanggalIndo,
  filterTransactions,
  getTransactionCategory,
  getCategoryBadgeColor,
  sortTransactionsDesc,
  ALL_CATEGORIES,
} from '../utils/finance.ts';
import { StatCards } from '../components/StatCard.tsx';
import { Kabah4DScene } from '../components/Kabah4DScene.tsx';
import { BudgetTrackerCard } from '../components/BudgetTrackerCard.tsx';
import {
  ArrowDownLeft,
  ArrowUpRight,
  FileText,
  Clock,
  PlusCircle,
  TrendingUp,
  BarChart3,
  Calendar,
  Search,
  Filter,
  X,
  Tag,
  RotateCcw,
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
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterType, setFilterType] = useState<'all' | 'penerimaan' | 'pengeluaran'>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [showExpanded, setShowExpanded] = useState<boolean>(false);

  // Filter transactions based on search and category
  const filteredTransactions = useMemo(() => {
    return filterTransactions(transactions, {
      jenis: filterType,
      search: searchTerm,
      kategori: filterCategory,
    });
  }, [transactions, filterType, searchTerm, filterCategory]);

  const sortedFiltered = useMemo(() => {
    return sortTransactionsDesc(filteredTransactions);
  }, [filteredTransactions]);

  const displayLimit = showExpanded || searchTerm.trim() || filterCategory !== 'all' || filterType !== 'all' ? 20 : 5;
  const displayTransactions = sortedFiltered.slice(0, displayLimit);

  const isFilterActive = searchTerm.trim() !== '' || filterCategory !== 'all' || filterType !== 'all';

  const resetFilters = () => {
    setSearchTerm('');
    setFilterType('all');
    setFilterCategory('all');
  };

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

      {/* Pelacak Plafon Anggaran (Budget Tracking Progress) */}
      <BudgetTrackerCard transactions={transactions} isAdmin={isAdmin} />

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

      {/* Riwayat Transaksi Terkini dengan Fitur Pencarian & Filter Kategori */}
      <div className="rounded-2xl p-4 bg-white/5 backdrop-blur-md border border-white/10 shadow-xl space-y-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-purple-400" />
            <h3 className="text-xs sm:text-sm font-bold text-white uppercase tracking-wider">
              Pencarian & Transaksi Terkini
            </h3>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
              {filteredTransactions.length} ditemukan
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs">
            {isFilterActive && (
              <button
                type="button"
                onClick={resetFilters}
                className="flex items-center gap-1 text-[11px] text-pink-300 hover:text-pink-200 transition-colors cursor-pointer"
                title="Reset semua filter pencarian"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => onNavigateTab('penerimaan')}
              className="text-[11px] text-purple-300 hover:text-pink-300 font-semibold transition-colors"
            >
              Lihat Detail →
            </button>
          </div>
        </div>

        {/* Search Bar & Category Filter Controls */}
        <div className="space-y-2.5">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              aria-label="Cari transaksi di Dashboard"
              placeholder="Cari penerima, sumber dana, kategori, keterangan, nominal..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-9 py-2 rounded-xl bg-black/40 border border-white/15 text-white text-xs sm:text-sm focus:border-pink-500 focus:outline-none placeholder:text-slate-500 shadow-inner"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-white"
                aria-label="Hapus kata kunci pencarian"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Filter Type Tabs & Category Dropdown */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
            {/* Type selector: Semua, Penerimaan, Pengeluaran */}
            <div className="sm:col-span-6 flex items-center p-0.5 rounded-xl bg-black/30 border border-white/10 text-xs">
              <button
                type="button"
                onClick={() => setFilterType('all')}
                className={`flex-1 py-1.5 px-2 rounded-lg font-semibold text-center transition-all ${
                  filterType === 'all'
                    ? 'bg-purple-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Semua ({transactions.length})
              </button>
              <button
                type="button"
                onClick={() => setFilterType('penerimaan')}
                className={`flex-1 py-1.5 px-2 rounded-lg font-semibold text-center transition-all ${
                  filterType === 'penerimaan'
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Masuk ({transactions.filter((t) => t.jenis === 'penerimaan').length})
              </button>
              <button
                type="button"
                onClick={() => setFilterType('pengeluaran')}
                className={`flex-1 py-1.5 px-2 rounded-lg font-semibold text-center transition-all ${
                  filterType === 'pengeluaran'
                    ? 'bg-rose-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Keluar ({transactions.filter((t) => t.jenis === 'pengeluaran').length})
              </button>
            </div>

            {/* Category Filter Dropdown */}
            <div className="sm:col-span-6 relative">
              <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-purple-300">
                <Tag className="w-3.5 h-3.5" />
              </div>
              <select
                aria-label="Filter berdasarkan kategori di Dashboard"
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-black/30 border border-white/15 text-white text-xs focus:border-pink-500 focus:outline-none cursor-pointer"
              >
                <option value="all" className="bg-slate-900 text-white">
                  Semua Kategori ({transactions.length} Transaksi)
                </option>
                <optgroup label="Kategori Penerimaan" className="bg-slate-900 text-emerald-300 font-bold">
                  {['BOK / Kemenkes', 'Dinkes / Pemda', 'BAZNAS & Hibah', 'Swadaya Petugas', 'Penerimaan Lainnya'].map(
                    (cat) => (
                      <option key={cat} value={cat} className="bg-slate-900 text-white font-normal">
                        {cat}
                      </option>
                    )
                  )}
                </optgroup>
                <optgroup label="Kategori Pengeluaran" className="bg-slate-900 text-rose-300 font-bold">
                  {[
                    'Obat & Farmasi',
                    'Alkes & Alat Medis',
                    'Seragam & Administrasi',
                    'Logistik & Konsumsi',
                    'Transportasi & Operasional',
                    'Operasional Lainnya',
                  ].map((cat) => (
                    <option key={cat} value={cat} className="bg-slate-900 text-white font-normal">
                      {cat}
                    </option>
                  ))}
                </optgroup>
              </select>
            </div>
          </div>

          {/* Quick Category Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
            <span className="text-[10px] text-slate-400 font-medium shrink-0 flex items-center gap-1">
              <Filter className="w-3 h-3 text-purple-400" />
              Kategori Cepat:
            </span>
            {['Obat & Farmasi', 'Alkes & Alat Medis', 'BOK / Kemenkes', 'Logistik & Konsumsi'].map((cat) => {
              const isSelected = filterCategory === cat;
              const badge = getCategoryBadgeColor(cat);
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setFilterCategory(isSelected ? 'all' : cat)}
                  className={`text-[10px] px-2.5 py-1 rounded-full border transition-all shrink-0 cursor-pointer ${
                    isSelected
                      ? 'bg-pink-500 text-white border-pink-400 font-bold shadow-md shadow-pink-500/30'
                      : `${badge.bg} ${badge.text} ${badge.border} hover:bg-white/10`
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </div>

        {/* Transaction Items List */}
        <div className="space-y-2 pt-1">
          {displayTransactions.length === 0 ? (
            <div className="text-center py-8 px-4 rounded-xl bg-white/5 border border-dashed border-white/10 text-slate-400 text-xs space-y-2">
              <Search className="w-6 h-6 mx-auto text-purple-400 opacity-60" />
              <div className="font-semibold text-slate-200">
                Tidak ada transaksi yang cocok
              </div>
              <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                {isFilterActive
                  ? 'Tidak ditemukan transaksi dengan kata kunci atau kategori yang dipilih.'
                  : 'Belum ada transaksi yang dicatat dalam sistem.'}
              </p>
              {isFilterActive && (
                <button
                  type="button"
                  onClick={resetFilters}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-pink-600/30 hover:bg-pink-600/50 text-pink-200 text-xs font-semibold border border-pink-500/30 transition-all cursor-pointer mt-1"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset Filter & Pencarian</span>
                </button>
              )}
            </div>
          ) : (
            displayTransactions.map((trx) => {
              const cat = getTransactionCategory(trx);
              const badge = getCategoryBadgeColor(cat);

              return (
                <div
                  key={trx.id}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 border border-white/5 hover:border-white/15 transition-all text-xs group"
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
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-100 truncate">
                          {trx.jenis === 'penerimaan' ? trx.sumber_dana : trx.nama_penerima}
                        </span>
                        <span
                          className={`text-[9px] font-semibold px-2 py-0.5 rounded-full border shrink-0 ${badge.bg} ${badge.text} ${badge.border}`}
                        >
                          {cat}
                        </span>
                      </div>
                      <div className="text-[10px] text-purple-200/70 truncate mt-0.5">
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
              );
            })
          )}
        </div>

        {/* Expand / Show More toggle */}
        {sortedFiltered.length > 5 && !showExpanded && !searchTerm && filterCategory === 'all' && filterType === 'all' && (
          <div className="text-center pt-1">
            <button
              type="button"
              onClick={() => setShowExpanded(true)}
              className="text-[11px] text-purple-300 hover:text-pink-300 font-semibold px-3 py-1 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
            >
              Tampilkan Lebih Banyak ({sortedFiltered.length - 5} lainnya) ↓
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
