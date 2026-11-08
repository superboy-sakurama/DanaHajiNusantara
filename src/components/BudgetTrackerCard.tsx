import React, { useState, useEffect, useMemo } from 'react';
import { Transaction } from '../types/index.ts';
import {
  formatRupiah,
  parseRupiah,
  calculateBudgetStatus,
  calculatePeriodExpenditure,
  getAvailableMonths,
} from '../utils/finance.ts';
import {
  Wallet,
  AlertTriangle,
  CheckCircle2,
  TrendingDown,
  Calendar,
  Settings2,
  X,
  Check,
  ChevronDown,
  Sparkles,
  ShieldAlert,
} from 'lucide-react';

interface BudgetTrackerCardProps {
  transactions: Transaction[];
  isAdmin: boolean;
}

const STORAGE_KEY = 'haji_budget_limit';
const DEFAULT_BUDGET_LIMIT = 15000000; // Rp 15.000.000 default

export const BudgetTrackerCard: React.FC<BudgetTrackerCardProps> = ({
  transactions,
  isAdmin,
}) => {
  // Budget limit state with localStorage persistence
  const [budgetLimit, setBudgetLimit] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = parseInt(saved, 10);
        if (!isNaN(parsed) && parsed > 0) return parsed;
      }
    } catch {
      // Fallback
    }
    return DEFAULT_BUDGET_LIMIT;
  });

  // Period filter: 'all' = Seluruh Musim Haji, or 'YYYY-MM'
  const [selectedPeriod, setSelectedPeriod] = useState<string>('all');
  const [isEditingLimit, setIsEditingLimit] = useState<boolean>(false);
  const [inputLimit, setInputLimit] = useState<string>(budgetLimit.toString());
  const [saveSuccessNotice, setSaveSuccessNotice] = useState<boolean>(false);

  // Available months
  const availableMonths = useMemo(() => getAvailableMonths(transactions), [transactions]);

  // Selected period expenditure
  const currentExpenditure = useMemo(
    () => calculatePeriodExpenditure(transactions, selectedPeriod),
    [transactions, selectedPeriod]
  );

  // Budget status calculation
  const budgetStatus = useMemo(
    () => calculateBudgetStatus(currentExpenditure, budgetLimit),
    [currentExpenditure, budgetLimit]
  );

  // Quick preset chips for budget limit
  const presetLimits = [5000000, 10000000, 15000000, 20000000, 25000000];

  const handleSaveLimit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseRupiah(inputLimit);
    if (parsed > 0) {
      setBudgetLimit(parsed);
      try {
        localStorage.setItem(STORAGE_KEY, parsed.toString());
      } catch {
        // Ignore storage error
      }
      setIsEditingLimit(false);
      setSaveSuccessNotice(true);
      setTimeout(() => setSaveSuccessNotice(false), 3000);
    }
  };

  const selectedPeriodLabel = useMemo(() => {
    if (selectedPeriod === 'all') return 'Seluruh Musim Haji';
    const found = availableMonths.find((m) => m.value === selectedPeriod);
    return found ? found.label : selectedPeriod;
  }, [selectedPeriod, availableMonths]);

  // Visual bar width (capped at 100% for bar container, while percentage number displays true ratio)
  const barWidth = Math.min(100, Math.max(0, budgetStatus.percentage));

  // Determine color accents based on status
  const themeColors = useMemo(() => {
    if (budgetStatus.status === 'danger') {
      return {
        bgBadge: 'bg-rose-500/20 border-rose-500/40 text-rose-300',
        barGradient: 'from-amber-500 via-rose-500 to-red-600',
        textHighlight: 'text-rose-400',
        borderCard: 'border-rose-500/30',
        glow: 'shadow-rose-500/20',
      };
    }
    if (budgetStatus.status === 'warning') {
      return {
        bgBadge: 'bg-amber-500/20 border-amber-500/40 text-amber-300',
        barGradient: 'from-yellow-400 via-amber-500 to-orange-500',
        textHighlight: 'text-amber-400',
        borderCard: 'border-amber-500/30',
        glow: 'shadow-amber-500/20',
      };
    }
    return {
      bgBadge: 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300',
      barGradient: 'from-teal-400 via-emerald-500 to-green-500',
      textHighlight: 'text-emerald-400',
      borderCard: 'border-emerald-500/20',
      glow: 'shadow-emerald-500/20',
    };
  }, [budgetStatus.status]);

  return (
    <div
      className={`rounded-2xl p-4 sm:p-5 bg-gradient-to-br from-slate-900/80 via-purple-950/40 to-slate-900/80 backdrop-blur-xl border ${themeColors.borderCard} shadow-xl relative transition-all duration-300`}
    >
      {/* Header with Title, Period Filter & Limit Config Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-gradient-to-br from-pink-500/20 to-purple-500/20 border border-pink-500/30 text-pink-300">
            <Wallet className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                Pelacak Plafon Anggaran
              </h3>
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${themeColors.bgBadge}`}
              >
                {budgetStatus.status === 'danger' ? (
                  <ShieldAlert className="w-3 h-3" />
                ) : budgetStatus.status === 'warning' ? (
                  <AlertTriangle className="w-3 h-3" />
                ) : (
                  <CheckCircle2 className="w-3 h-3" />
                )}
                {budgetStatus.statusLabel}
              </span>
            </div>
            <p className="text-[11px] text-purple-200/60 mt-0.5">
              Kontrol realisasi dana keluar terhadap batas anggaran posko
            </p>
          </div>
        </div>

        {/* Right Action: Period Dropdown & Edit Limit */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          {/* Period Selector */}
          <div className="relative">
            <select
              aria-label="Pilih Periode Anggaran"
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="appearance-none bg-white/10 hover:bg-white/15 border border-white/15 text-white text-xs rounded-xl pl-7 pr-7 py-1.5 focus:outline-none focus:ring-1 focus:ring-pink-400 cursor-pointer font-medium"
            >
              <option value="all" className="bg-slate-900 text-white">
                Seluruh Musim Haji
              </option>
              {availableMonths.map((m) => (
                <option key={m.value} value={m.value} className="bg-slate-900 text-white">
                  {m.label}
                </option>
              ))}
            </select>
            <Calendar className="w-3.5 h-3.5 text-pink-400 absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none" />
            <ChevronDown className="w-3 h-3 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Edit Budget Limit Button (Admin only or all) */}
          <button
            type="button"
            onClick={() => {
              setInputLimit(budgetLimit.toString());
              setIsEditingLimit(!isEditingLimit);
            }}
            title={isAdmin ? 'Ubah batas plafon pengeluaran' : 'Lihat pengaturan batas plafon'}
            className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-purple-200 hover:text-white transition-all flex items-center gap-1 text-xs"
          >
            <Settings2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline text-[11px]">Plafon</span>
          </button>
        </div>
      </div>

      {/* Edit Limit Inline Form */}
      {isEditingLimit && (
        <form
          onSubmit={handleSaveLimit}
          className="my-3 p-3.5 rounded-xl bg-purple-950/60 border border-pink-500/30 space-y-3"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-bold text-white">
              <Sparkles className="w-3.5 h-3.5 text-pink-400" />
              <span>Atur Batas Plafon Anggaran ({selectedPeriodLabel})</span>
            </div>
            <button
              type="button"
              onClick={() => setIsEditingLimit(false)}
              className="text-slate-400 hover:text-white p-1 rounded-lg"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div>
            <label className="block text-[11px] text-purple-200 mb-1 font-medium">
              Nominal Plafon Pengeluaran (Rupiah):
            </label>
            <div className="relative">
              <input
                type="text"
                value={inputLimit}
                onChange={(e) => setInputLimit(e.target.value)}
                placeholder="Contoh: 15000000"
                className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/20 text-white text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-pink-400"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-pink-300 font-bold">
                {formatRupiah(parseRupiah(inputLimit))}
              </span>
            </div>
          </div>

          {/* Quick preset chips */}
          <div>
            <span className="text-[10px] text-slate-300 block mb-1">Preset Cepat:</span>
            <div className="flex flex-wrap gap-1.5">
              {presetLimits.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setInputLimit(preset.toString())}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold border transition-all ${
                    parseRupiah(inputLimit) === preset
                      ? 'bg-pink-500/30 border-pink-400 text-pink-200'
                      : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/15'
                  }`}
                >
                  {formatRupiah(preset)}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setIsEditingLimit(false)}
              className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-slate-300 text-xs font-medium"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white text-xs font-bold shadow flex items-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5" />
              Simpan Plafon
            </button>
          </div>
        </form>
      )}

      {/* Save Success Notice */}
      {saveSuccessNotice && (
        <div className="my-2 p-2 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>Batas plafon anggaran berhasil diperbarui!</span>
        </div>
      )}

      {/* Main Budget Progress Section */}
      <div className="mt-3.5 space-y-2">
        <div className="flex items-baseline justify-between">
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl sm:text-2xl font-black text-white tracking-tight">
              {budgetStatus.percentage}%
            </span>
            <span className="text-xs text-purple-200/70 font-medium">terpakai</span>
          </div>

          <div className="text-right">
            <span className="text-[11px] text-slate-400 block">Batas Plafon:</span>
            <span className="text-xs sm:text-sm font-bold text-white">
              {formatRupiah(budgetStatus.limit)}
            </span>
          </div>
        </div>

        {/* Animated Progress Bar */}
        <div className="relative">
          <div className="h-4 w-full bg-black/50 rounded-full overflow-hidden p-0.5 border border-white/15 shadow-inner">
            <div
              style={{ width: `${barWidth}%` }}
              className={`h-full rounded-full bg-gradient-to-r ${themeColors.barGradient} transition-all duration-700 relative`}
            >
              {/* Subtle animated shine / highlight */}
              <div className="absolute inset-0 bg-white/20 opacity-40 rounded-full animate-pulse" />
            </div>
          </div>

          {/* 70% and 90% Threshold Markers */}
          <div
            className="absolute top-0 bottom-0 left-[70%] border-r border-dashed border-amber-400/50 pointer-events-none"
            title="Batas Waspada: 70%"
          />
          <div
            className="absolute top-0 bottom-0 left-[90%] border-r border-dashed border-rose-400/60 pointer-events-none"
            title="Batas Kritis: 90%"
          />
        </div>

        {/* Marker labels */}
        <div className="flex justify-between text-[10px] text-slate-400 px-0.5 pt-0.5">
          <span>0%</span>
          <span className="text-amber-400/80">70% Waspada</span>
          <span className="text-rose-400/80">90% Kritis</span>
          <span>100% Plafon</span>
        </div>
      </div>

      {/* 3-Column Key Metrics Grid */}
      <div className="mt-4 grid grid-cols-3 gap-2 pt-3 border-t border-white/10 text-center">
        {/* Metric 1: Realisasi Pengeluaran */}
        <div className="p-2.5 rounded-xl bg-white/5 border border-white/5">
          <span className="text-[10px] text-purple-200/70 block uppercase tracking-wider font-semibold">
            Realisasi
          </span>
          <span className="text-xs sm:text-sm font-bold text-rose-300 block mt-0.5">
            {formatRupiah(budgetStatus.expenditure)}
          </span>
          <span className="text-[9px] text-slate-400 block mt-0.5 truncate">
            {selectedPeriod === 'all' ? 'Total musim' : selectedPeriodLabel}
          </span>
        </div>

        {/* Metric 2: Plafon Target */}
        <div className="p-2.5 rounded-xl bg-white/5 border border-white/5">
          <span className="text-[10px] text-purple-200/70 block uppercase tracking-wider font-semibold">
            Plafon
          </span>
          <span className="text-xs sm:text-sm font-bold text-white block mt-0.5">
            {formatRupiah(budgetStatus.limit)}
          </span>
          <span className="text-[9px] text-purple-300/80 block mt-0.5 truncate">
            Batas belanja
          </span>
        </div>

        {/* Metric 3: Sisa Anggaran / Defisit */}
        <div
          className={`p-2.5 rounded-xl border ${
            budgetStatus.isOverBudget
              ? 'bg-rose-500/10 border-rose-500/30'
              : 'bg-emerald-500/10 border-emerald-500/30'
          }`}
        >
          <span className="text-[10px] text-purple-200/70 block uppercase tracking-wider font-semibold">
            {budgetStatus.isOverBudget ? 'Defisit' : 'Sisa Plafon'}
          </span>
          <span
            className={`text-xs sm:text-sm font-bold block mt-0.5 ${
              budgetStatus.isOverBudget ? 'text-rose-400' : 'text-emerald-300'
            }`}
          >
            {budgetStatus.isOverBudget ? '-' : '+'}
            {formatRupiah(Math.abs(budgetStatus.remaining))}
          </span>
          <span className="text-[9px] text-slate-400 block mt-0.5 truncate">
            {budgetStatus.isOverBudget ? 'Melebihi target' : 'Siap digunakan'}
          </span>
        </div>
      </div>

      {/* Advisory Insight Banner */}
      <div className="mt-3 p-2.5 rounded-xl bg-white/5 border border-white/10 flex items-start gap-2 text-[11px] text-slate-300">
        <TrendingDown
          className={`w-4 h-4 mt-0.5 shrink-0 ${
            budgetStatus.isOverBudget
              ? 'text-rose-400'
              : budgetStatus.status === 'warning'
              ? 'text-amber-400'
              : 'text-emerald-400'
          }`}
        />
        <div className="leading-relaxed">
          {budgetStatus.isOverBudget ? (
            <span>
              <strong className="text-rose-300">Peringatan:</strong> Pengeluaran periode{' '}
              {selectedPeriodLabel} telah melebihi plafon sebesar{' '}
              <strong className="text-white">
                {formatRupiah(Math.abs(budgetStatus.remaining))}
              </strong>
              . Harap verifikasi pos belanja darurat dengan bendahara kloter.
            </span>
          ) : budgetStatus.status === 'warning' ? (
            <span>
              <strong className="text-amber-300">Perhatian:</strong> Realisasi telah mencapai{' '}
              {budgetStatus.percentage}%. Sisa plafon{' '}
              <strong className="text-white">{formatRupiah(budgetStatus.remaining)}</strong> perlu
              diprioritaskan untuk kebutuhan obat mendesak di Mina & Arafah.
            </span>
          ) : (
            <span>
              <strong className="text-emerald-300">Kondisi Ideal:</strong> Anggaran belanja periode{' '}
              {selectedPeriodLabel} terkendali dengan baik ({budgetStatus.percentage}% terpakai). Sisa{' '}
              <strong className="text-white">{formatRupiah(budgetStatus.remaining)}</strong> aman
              untuk operasional lanjutan.
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
