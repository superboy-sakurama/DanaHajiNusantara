import React from 'react';
import { Home, ArrowDownLeft, ArrowUpRight, FileSpreadsheet, Plus } from 'lucide-react';

export type NavTab = 'dashboard' | 'penerimaan' | 'pengeluaran' | 'laporan';

interface BottomNavProps {
  currentTab: NavTab;
  onChangeTab: (tab: NavTab) => void;
  isAdmin: boolean;
  onOpenAddModal: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentTab,
  onChangeTab,
  isAdmin,
  onOpenAddModal,
}) => {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 bg-slate-950/85 backdrop-blur-2xl border-t border-white/10 pb-[env(safe-area-inset-bottom,0px)]"
      aria-label="Navigasi Bawah"
    >
      <div className="max-w-md mx-auto px-4 py-2 flex items-center justify-around relative">
        {/* Tab 1: Dashboard */}
        <button
          type="button"
          onClick={() => onChangeTab('dashboard')}
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all ${
            currentTab === 'dashboard'
              ? 'text-pink-400 font-semibold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
          aria-label="Menu Dashboard"
        >
          <Home className={`w-5 h-5 transition-transform ${currentTab === 'dashboard' ? 'scale-110' : ''}`} />
          <span className="text-[11px] mt-1">Beranda</span>
        </button>

        {/* Tab 2: Penerimaan */}
        <button
          type="button"
          onClick={() => onChangeTab('penerimaan')}
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all ${
            currentTab === 'penerimaan'
              ? 'text-emerald-400 font-semibold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
          aria-label="Menu Penerimaan Dana Masuk"
        >
          <ArrowDownLeft className={`w-5 h-5 transition-transform ${currentTab === 'penerimaan' ? 'scale-110' : ''}`} />
          <span className="text-[11px] mt-1">Penerimaan</span>
        </button>

        {/* Center Quick Add Button (Admin Only) */}
        {isAdmin && (
          <div className="relative -top-4 flex flex-col items-center">
            <button
              type="button"
              onClick={onOpenAddModal}
              className="w-12 h-12 rounded-full bg-gradient-to-tr from-purple-600 via-fuchsia-500 to-pink-500 text-white shadow-lg shadow-pink-500/40 border-2 border-white/30 flex items-center justify-center active:scale-95 hover:scale-105 transition-transform cursor-pointer"
              aria-label="Tambah Transaksi Baru"
              title="Tambah Transaksi Baru (Admin)"
            >
              <Plus className="w-6 h-6 stroke-[2.5]" />
            </button>
            <span className="text-[10px] font-medium text-pink-300 mt-0.5">Catat</span>
          </div>
        )}

        {/* Tab 3: Pengeluaran */}
        <button
          type="button"
          onClick={() => onChangeTab('pengeluaran')}
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all ${
            currentTab === 'pengeluaran'
              ? 'text-rose-400 font-semibold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
          aria-label="Menu Pengeluaran Dana Keluar"
        >
          <ArrowUpRight className={`w-5 h-5 transition-transform ${currentTab === 'pengeluaran' ? 'scale-110' : ''}`} />
          <span className="text-[11px] mt-1">Pengeluaran</span>
        </button>

        {/* Tab 4: Laporan PDF */}
        <button
          type="button"
          onClick={() => onChangeTab('laporan')}
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all ${
            currentTab === 'laporan'
              ? 'text-purple-400 font-semibold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
          aria-label="Menu Laporan dan Ekspor PDF"
        >
          <FileSpreadsheet className={`w-5 h-5 transition-transform ${currentTab === 'laporan' ? 'scale-110' : ''}`} />
          <span className="text-[11px] mt-1">Laporan PDF</span>
        </button>
      </div>
    </nav>
  );
};
