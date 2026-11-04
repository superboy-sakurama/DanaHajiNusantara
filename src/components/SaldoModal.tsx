import React, { useState, useEffect } from 'react';
import { SaldoRecord } from '../types/index.ts';
import { formatRupiah, parseRupiah } from '../utils/finance.ts';
import { X, Save, History } from 'lucide-react';

interface SaldoModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentSaldo: SaldoRecord | null;
  onUpdateSaldo: (data: { saldo_awal_tahun_lalu: number; tahun?: string; catatan?: string }) => Promise<void>;
}

export const SaldoModal: React.FC<SaldoModalProps> = ({
  isOpen,
  onClose,
  currentSaldo,
  onUpdateSaldo,
}) => {
  const [nominalStr, setNominalStr] = useState<string>('');
  const [tahun, setTahun] = useState<string>('');
  const [catatan, setCatatan] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (currentSaldo) {
      setNominalStr(currentSaldo.saldo_awal_tahun_lalu.toString());
      setTahun(currentSaldo.tahun || '1447 H / 2026 M');
      setCatatan(currentSaldo.catatan || '');
    }
    setErrorMsg(null);
  }, [currentSaldo, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const nominal = parseRupiah(nominalStr);
    if (isNaN(nominal) || nominal < 0) {
      setErrorMsg('Nominal saldo awal harus berupa angka valid');
      return;
    }

    try {
      setLoading(true);
      await onUpdateSaldo({
        saldo_awal_tahun_lalu: nominal,
        tahun: tahun.trim(),
        catatan: catatan.trim(),
      });
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal memperbarui saldo awal');
    } finally {
      setLoading(false);
    }
  };

  const parsedNominal = parseRupiah(nominalStr);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-md rounded-2xl bg-gradient-to-b from-slate-900/95 via-purple-950/95 to-slate-950/95 border border-white/20 shadow-2xl p-5 sm:p-6">
        <div className="flex items-center justify-between pb-3.5 border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-purple-500/20 text-purple-300">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Atur Saldo Awal Tahun Lalu</h3>
              <p className="text-[11px] text-purple-200/70">Wewenang Khusus Administrator</p>
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

        {errorMsg && (
          <div className="mt-3 p-3 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-200 text-xs">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-3.5">
          <div>
            <label htmlFor="saldo-nominal" className="block text-xs font-semibold text-purple-200 mb-1">
              Nominal Saldo Awal (Rp)
            </label>
            <input
              id="saldo-nominal"
              type="text"
              required
              placeholder="Contoh: 12.500.000"
              value={nominalStr}
              onChange={(e) => setNominalStr(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-black/30 border border-white/15 text-white text-sm focus:border-pink-500 focus:outline-none"
            />
            <div className="text-[11px] text-pink-300 font-medium mt-1">
              Terbaca: {formatRupiah(parsedNominal)}
            </div>
          </div>

          <div>
            <label htmlFor="saldo-tahun" className="block text-xs font-semibold text-purple-200 mb-1">
              Tahun / Musim Haji
            </label>
            <input
              id="saldo-tahun"
              type="text"
              required
              placeholder="Contoh: 1447 H / 2026 M"
              value={tahun}
              onChange={(e) => setTahun(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-black/30 border border-white/15 text-white text-sm focus:border-pink-500 focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="saldo-catatan" className="block text-xs font-semibold text-purple-200 mb-1">
              Catatan / Dasar Penetapan
            </label>
            <textarea
              id="saldo-catatan"
              rows={2}
              placeholder="Contoh: Sisa kas operasional haji tahun 1446 H"
              value={catatan}
              onChange={(e) => setCatatan(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-black/30 border border-white/15 text-white text-xs focus:border-pink-500 focus:outline-none resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-slate-300 text-xs font-medium"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white text-xs font-bold shadow-lg shadow-pink-500/30"
            >
              <Save className="w-4 h-4" />
              <span>{loading ? 'Menyimpan...' : 'Simpan Saldo Awal'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
