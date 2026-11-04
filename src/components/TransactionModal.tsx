import React, { useState, useEffect } from 'react';
import { Transaction, TransactionType } from '../types/index.ts';
import { formatRupiah, parseRupiah } from '../utils/finance.ts';
import { X, Save, ArrowDownLeft, ArrowUpRight } from 'lucide-react';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Omit<Transaction, 'id' | 'created_at'>) => Promise<void>;
  initialData?: Transaction | null;
  defaultType?: TransactionType;
}

export const TransactionModal: React.FC<TransactionModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  defaultType = 'penerimaan',
}) => {
  const [jenis, setJenis] = useState<TransactionType>(defaultType);
  const [tanggal, setTanggal] = useState<string>('');
  const [nominalStr, setNominalStr] = useState<string>('');
  const [sumberDana, setSumberDana] = useState<string>('');
  const [namaPenerima, setNamaPenerima] = useState<string>('');
  const [keterangan, setKeterangan] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) {
      setJenis(initialData.jenis);
      setTanggal(initialData.tanggal);
      setNominalStr(initialData.nominal.toString());
      setSumberDana(initialData.sumber_dana || '');
      setNamaPenerima(initialData.nama_penerima || '');
      setKeterangan(initialData.keterangan || '');
    } else {
      setJenis(defaultType);
      setTanggal(new Date().toISOString().split('T')[0]);
      setNominalStr('');
      setSumberDana('');
      setNamaPenerima('');
      setKeterangan('');
    }
    setErrorMsg(null);
  }, [initialData, defaultType, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const nominalNum = parseRupiah(nominalStr);
    if (!tanggal) {
      setErrorMsg('Tanggal transaksi wajib dipilih');
      return;
    }
    if (nominalNum <= 0) {
      setErrorMsg('Nominal transaksi harus lebih besar dari 0');
      return;
    }
    if (jenis === 'penerimaan' && !sumberDana.trim()) {
      setErrorMsg('Sumber dana penerimaan wajib diisi');
      return;
    }
    if (jenis === 'pengeluaran' && !namaPenerima.trim()) {
      setErrorMsg('Nama penerima pengeluaran wajib diisi');
      return;
    }
    if (!keterangan.trim()) {
      setErrorMsg('Keterangan transaksi wajib diisi');
      return;
    }

    try {
      setLoading(true);
      await onSubmit({
        tanggal,
        jenis,
        nominal: nominalNum,
        sumber_dana: jenis === 'penerimaan' ? sumberDana.trim() : undefined,
        nama_penerima: jenis === 'pengeluaran' ? namaPenerima.trim() : undefined,
        keterangan: keterangan.trim(),
      });
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal menyimpan transaksi');
    } finally {
      setLoading(false);
    }
  };

  const parsedNominal = parseRupiah(nominalStr);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-lg rounded-2xl bg-gradient-to-b from-slate-900/95 via-purple-950/95 to-slate-950/95 border border-white/20 shadow-2xl p-5 sm:p-6 overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              {initialData ? 'Edit Data Transaksi' : 'Catat Transaksi Keuangan'}
            </h3>
            <p className="text-xs text-purple-200/70">
              {initialData
                ? `Mengubah rincian ID: ${initialData.id}`
                : 'Pencatatan kas operasional Petugas Haji Puskesmas'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-colors"
            aria-label="Tutup Modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error notification */}
        {errorMsg && (
          <div className="mt-4 p-3 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-200 text-xs">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Toggle Jenis Transaksi */}
          <div>
            <label className="block text-xs font-semibold text-purple-200 mb-1.5">
              Jenis Transaksi <span className="text-rose-400">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-black/40 border border-white/10">
              <button
                type="button"
                onClick={() => setJenis('penerimaan')}
                className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition-all ${
                  jenis === 'penerimaan'
                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <ArrowDownLeft className="w-4 h-4" />
                <span>Penerimaan (Masuk)</span>
              </button>
              <button
                type="button"
                onClick={() => setJenis('pengeluaran')}
                className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition-all ${
                  jenis === 'pengeluaran'
                    ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <ArrowUpRight className="w-4 h-4" />
                <span>Pengeluaran (Keluar)</span>
              </button>
            </div>
          </div>

          {/* Grid Tanggal & Nominal */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="trx-tanggal" className="block text-xs font-semibold text-purple-200 mb-1">
                Tanggal Transaksi <span className="text-rose-400">*</span>
              </label>
              <input
                id="trx-tanggal"
                type="date"
                required
                value={tanggal}
                onChange={(e) => setTanggal(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-black/30 border border-white/15 text-white text-xs sm:text-sm focus:border-pink-500 focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="trx-nominal" className="block text-xs font-semibold text-purple-200 mb-1">
                Nominal (Rp) <span className="text-rose-400">*</span>
              </label>
              <input
                id="trx-nominal"
                type="text"
                required
                placeholder="Contoh: 1.500.000"
                value={nominalStr}
                onChange={(e) => setNominalStr(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-black/30 border border-white/15 text-white text-xs sm:text-sm focus:border-pink-500 focus:outline-none"
              />
              {parsedNominal > 0 && (
                <div className="text-[11px] text-pink-300 font-medium mt-1">
                  Terbaca: {formatRupiah(parsedNominal)}
                </div>
              )}
            </div>
          </div>

          {/* Conditional field: Sumber Dana vs Nama Penerima */}
          {jenis === 'penerimaan' ? (
            <div>
              <label htmlFor="trx-sumber" className="block text-xs font-semibold text-emerald-300 mb-1">
                Sumber Dana Penerimaan <span className="text-rose-400">*</span>
              </label>
              <input
                id="trx-sumber"
                type="text"
                required
                placeholder="Contoh: BOK Puskesmas / Hibah BAZNAS / Iuran Petugas"
                value={sumberDana}
                onChange={(e) => setSumberDana(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-black/30 border border-white/15 text-white text-xs sm:text-sm focus:border-emerald-500 focus:outline-none"
              />
              {/* Quick suggestions */}
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                {['BOK Puskesmas', 'Iuran Swadaya Petugas', 'Bantuan Dinkes', 'Hibah BAZNAS'].map(
                  (item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => setSumberDana(item)}
                      className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20 border border-emerald-500/20"
                    >
                      + {item}
                    </button>
                  )
                )}
              </div>
            </div>
          ) : (
            <div>
              <label htmlFor="trx-penerima" className="block text-xs font-semibold text-rose-300 mb-1">
                Nama Penerima Pengeluaran <span className="text-rose-400">*</span>
              </label>
              <input
                id="trx-penerima"
                type="text"
                required
                placeholder="Contoh: PT Kimia Farma / Koperasi Sehat / Petugas Logistik"
                value={namaPenerima}
                onChange={(e) => setNamaPenerima(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-black/30 border border-white/15 text-white text-xs sm:text-sm focus:border-rose-500 focus:outline-none"
              />
              {/* Quick suggestions */}
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                {['Apotek Kimia Farma', 'Koperasi Puskesmas', 'Logistik Kloter Makkah', 'Sewa Transport Medis'].map(
                  (item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => setNamaPenerima(item)}
                      className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-300 hover:bg-rose-500/20 border border-rose-500/20"
                    >
                      + {item}
                    </button>
                  )
                )}
              </div>
            </div>
          )}

          {/* Keterangan */}
          <div>
            <label htmlFor="trx-ket" className="block text-xs font-semibold text-purple-200 mb-1">
              Keterangan & Rincian <span className="text-rose-400">*</span>
            </label>
            <textarea
              id="trx-ket"
              rows={2}
              required
              placeholder="Jelaskan kebutuhan pengeluaran atau rincian penerimaan dana haji..."
              value={keterangan}
              onChange={(e) => setKeterangan(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-black/30 border border-white/15 text-white text-xs sm:text-sm focus:border-pink-500 focus:outline-none resize-none"
            />
          </div>

          {/* Modal Action Buttons */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-slate-300 text-xs font-medium transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white text-xs font-bold shadow-lg shadow-pink-500/30 transition-all cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{loading ? 'Menyimpan...' : 'Simpan Transaksi'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
