import React from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { GoogleSheetsConfig } from '../types/index.ts';
import { LogOut, Database, ShieldCheck, UserCheck } from 'lucide-react';

interface NavbarProps {
  sheetConfig?: GoogleSheetsConfig | null;
  onOpenSheetModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ sheetConfig, onOpenSheetModal }) => {
  const { user, isAdmin, logout } = useAuth();

  return (
    <header className="sticky top-0 z-40 w-full bg-gradient-to-r from-purple-950/80 via-slate-900/80 to-pink-950/80 backdrop-blur-xl border-b border-white/10 px-4 py-2.5 sm:px-6">
      <div className="max-w-5xl mx-auto flex items-center justify-between gap-3">
        {/* Left: Brand & Title */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-600 via-fuchsia-500 to-pink-500 p-0.5 shadow-lg shadow-purple-500/25 flex items-center justify-center shrink-0">
            <div className="w-full h-full bg-slate-950/60 rounded-[10px] flex items-center justify-center text-base">
              🕋
            </div>
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h1 className="text-sm sm:text-base font-bold text-white tracking-tight truncate">
                Keuangan Haji Puskesmas
              </h1>
              <span className="hidden xs:inline-block text-[10px] uppercase font-semibold tracking-wider px-1.5 py-0.5 rounded bg-pink-500/20 text-pink-300 border border-pink-500/30">
                1447 H / 2026 M
              </span>
            </div>
            <p className="text-[11px] text-purple-200/70 truncate">
              Tim Penyelenggara Kesehatan Haji Indonesia
            </p>
          </div>
        </div>

        {/* Right: Google Sheets Status, Role Badge & Logout */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Google Sheets Status Pill */}
          <button
            type="button"
            onClick={onOpenSheetModal}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-all cursor-pointer ${
              sheetConfig?.status === 'connected'
                ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/25'
                : sheetConfig?.status === 'error'
                ? 'bg-rose-500/20 border-rose-400/40 text-rose-300 hover:bg-rose-500/30'
                : 'bg-purple-500/20 border-purple-400/30 text-purple-200 hover:bg-purple-500/30'
            }`}
            title="Klik untuk melihat konfigurasi Google Spreadsheet"
            aria-label="Status Google Spreadsheet"
          >
            <Database className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">
              {sheetConfig?.status === 'connected'
                ? 'Sheets Terhubung'
                : sheetConfig?.status === 'error'
                ? 'Periksa Sheets'
                : 'Data Lokal'}
            </span>
            <span
              className={`w-2 h-2 rounded-full ${
                sheetConfig?.status === 'connected'
                  ? 'bg-emerald-400 animate-pulse'
                  : sheetConfig?.status === 'error'
                  ? 'bg-rose-400'
                  : 'bg-purple-400'
              }`}
            />
          </button>

          {/* User Role Pill */}
          <div
            className={`hidden md:flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${
              isAdmin
                ? 'bg-amber-500/15 border-amber-400/30 text-amber-200'
                : 'bg-sky-500/15 border-sky-400/30 text-sky-200'
            }`}
          >
            {isAdmin ? <ShieldCheck className="w-3.5 h-3.5 text-amber-300" /> : <UserCheck className="w-3.5 h-3.5 text-sky-300" />}
            <span>{isAdmin ? 'ADMIN (Full Akses)' : 'ANGGOTA (Read Only)'}</span>
          </div>

          {/* Logout Button */}
          <button
            type="button"
            onClick={logout}
            className="p-1.5 sm:px-2.5 sm:py-1 rounded-lg bg-white/10 hover:bg-white/20 border border-white/15 text-slate-200 hover:text-white transition-all text-xs font-medium flex items-center gap-1.5"
            title="Keluar dari akun"
            aria-label="Logout"
          >
            <LogOut className="w-3.5 h-3.5 text-pink-300" />
            <span className="hidden sm:inline">Keluar</span>
          </button>
        </div>
      </div>
    </header>
  );
};
