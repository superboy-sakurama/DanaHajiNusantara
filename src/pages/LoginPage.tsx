import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { Kabah4DScene } from '../components/Kabah4DScene.tsx';
import { Lock, User, LogIn, ShieldAlert, Sparkles, CheckCircle2 } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!username.trim() || !password) {
      setErrorMsg('Harap masukkan nama pengguna dan kata sandi');
      return;
    }

    try {
      setLoading(true);
      await login(username.trim(), password);
    } catch (err: any) {
      setErrorMsg(err.message || 'Login gagal. Periksa kembali akun Anda.');
    } finally {
      setLoading(false);
    }
  };

  const quickFill = (u: string, p: string) => {
    setUsername(u);
    setPassword(p);
    setErrorMsg(null);
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 sm:p-6 bg-gradient-to-br from-purple-950 via-slate-950 to-pink-950 text-slate-100 relative overflow-hidden">
      {/* Background celestial glow rings */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-purple-600/25 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-pink-600/25 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10 flex flex-col items-center">
        {/* Visual 4D Ka'bah Cartoon Element */}
        <div className="w-full mb-1">
          <Kabah4DScene size="large" interactive={true} />
        </div>

        {/* Login Glassmorphism Card */}
        <div className="w-full rounded-3xl p-6 sm:p-7 bg-white/10 backdrop-blur-2xl border border-white/20 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
          <div className="text-center mb-5">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-pink-500/20 text-pink-300 border border-pink-500/30 text-xs font-semibold uppercase tracking-wider mb-2">
              <Sparkles className="w-3.5 h-3.5 text-pink-300" />
              Sistem Keuangan Haji
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Tim Petugas Haji Puskesmas
            </h2>
            <p className="text-xs text-purple-200/80 mt-1">
              Manajemen kas operasional medis & logistik jamaah haji 1447 H / 2026 M
            </p>
          </div>

          {errorMsg && (
            <div className="mb-4 p-3 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-200 text-xs flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="login-username" className="block text-xs font-semibold text-purple-200 mb-1.5">
                Username Petugas
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-purple-300/70">
                  <User className="w-4 h-4" />
                </div>
                <input
                  id="login-username"
                  type="text"
                  required
                  autoCapitalize="none"
                  placeholder="Masukkan username (contoh: admin / petugas)"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-black/40 border border-white/15 text-white text-sm focus:border-pink-500 focus:outline-none transition-all placeholder:text-slate-500"
                />
              </div>
            </div>

            <div>
              <label htmlFor="login-password" className="block text-xs font-semibold text-purple-200 mb-1.5">
                Kata Sandi
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-purple-300/70">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="login-password"
                  type="password"
                  required
                  placeholder="Masukkan kata sandi..."
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-black/40 border border-white/15 text-white text-sm focus:border-pink-500 focus:outline-none transition-all placeholder:text-slate-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 via-fuchsia-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold text-sm shadow-xl shadow-pink-600/30 flex items-center justify-center gap-2 active:scale-98 transition-all cursor-pointer mt-2"
            >
              <LogIn className="w-4 h-4" />
              <span>{loading ? 'Memverifikasi...' : 'Masuk ke Aplikasi'}</span>
            </button>
          </form>

          {/* Quick Demo Fill Buttons */}
          <div className="mt-5 pt-4 border-t border-white/10">
            <div className="text-[11px] font-medium text-slate-400 mb-2 text-center">
              Akses Cepat Pengujian Role (Demo):
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => quickFill('admin', 'admin123')}
                className="p-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-200 text-xs font-semibold flex flex-col items-center justify-center gap-0.5 transition-all text-center"
              >
                <span className="flex items-center gap-1 text-[11px]">
                  <CheckCircle2 className="w-3 h-3 text-amber-300" /> Admin
                </span>
                <span className="text-[10px] text-amber-300/80 font-normal">Full Akses CRUD</span>
              </button>

              <button
                type="button"
                onClick={() => quickFill('petugas', 'petugas123')}
                className="p-2 rounded-xl bg-sky-500/15 hover:bg-sky-500/25 border border-sky-500/30 text-sky-200 text-xs font-semibold flex flex-col items-center justify-center gap-0.5 transition-all text-center"
              >
                <span className="flex items-center gap-1 text-[11px]">
                  <CheckCircle2 className="w-3 h-3 text-sky-300" /> Anggota
                </span>
                <span className="text-[10px] text-sky-300/80 font-normal">Read-Only View</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <p className="text-[11px] text-slate-400/80 text-center mt-4">
          UPTD Puskesmas • Tim Kesehatan Kloter Haji Makkah Al-Mukarramah
        </p>
      </div>
    </div>
  );
};
