import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Lock, UserPlus, LogIn, X, Sparkles, CheckCircle2 } from 'lucide-react';

/**
 * Modal Pop-up Pembatasan Mode Guest (Tamu)
 * Muncul ketika pengguna Guest mencoba membuka Materi 2+, Latihan 2+,
 * Tryout Paket 2+, atau fitur khusus akun terdaftar lainnya.
 */
const GuestRestrictedModal = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [featureName, setFeatureName] = useState('');
  const { logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const handleRestricted = (e) => {
      setFeatureName(e.detail?.featureName || 'Fitur Lanjutan');
      setIsOpen(true);
    };

    window.addEventListener('tka_guest_restricted', handleRestricted);
    return () => {
      window.removeEventListener('tka_guest_restricted', handleRestricted);
    };
  }, []);

  if (!isOpen) return null;

  const handleGoToRegister = () => {
    setIsOpen(false);
    logout();
    navigate('/register');
  };

  const handleGoToLogin = () => {
    setIsOpen(false);
    logout();
    navigate('/');
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#162E5B] text-white rounded-2xl border-2 border-blue-400 shadow-2xl max-w-md w-full overflow-hidden relative animate-scale-up">
        {/* Tombol Tutup */}
        <button
          type="button"
          onClick={() => setIsOpen(false)}
          className="absolute right-4 top-4 w-8 h-8 rounded-lg bg-[#0F2042] hover:bg-[#1E3A8A] text-blue-200 hover:text-white border border-blue-500/40 flex items-center justify-center transition-colors cursor-pointer"
          title="Tutup"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header & Icon */}
        <div className="p-6 pb-4 text-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border-2 border-amber-400 text-amber-300 flex items-center justify-center mx-auto shadow-md">
            <Lock className="w-7 h-7" />
          </div>

          <div className="inline-flex items-center space-x-1.5 px-3 py-0.5 rounded-full bg-[#0F2042] border border-amber-400/50 text-amber-300 text-[11px] font-bold">
            <Sparkles className="w-3 h-3" />
            <span>Batas Mode Tamu</span>
          </div>

          <h3 className="text-lg sm:text-xl font-bold text-white leading-snug">
            Masuk atau Daftar untuk Membuka {featureName}
          </h3>

          <p className="text-xs sm:text-sm text-blue-100 leading-relaxed">
            Saat ini kamu sedang mencoba mode <strong>Tamu</strong>, jadi baru bisa membuka <strong>Materi 1</strong>, <strong>Latihan 1</strong>, dan <strong>Tryout Paket 1</strong>.
          </p>
        </div>

        {/* Keuntungan Daftar Akun */}
        <div className="px-6">
          <div className="p-3.5 rounded-xl bg-[#0F2042] border border-blue-500/40 space-y-2 text-xs text-blue-100">
            <p className="font-bold text-amber-300 text-[11px] uppercase tracking-wider">
              Kalau Punya Akun, Kamu Bisa:
            </p>
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
              <span>Buka semua materi, 10 level latihan soal, dan 5 paket tryout</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
              <span>Simpan EXP, level, streak belajar, dan koleksi karaktermu</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
              <span>Ikut tampil di Papan Peringkat bareng teman-teman lain</span>
            </div>
          </div>
        </div>

        {/* Tombol Aksi */}
        <div className="p-6 pt-5 space-y-2.5">
          <button
            type="button"
            onClick={handleGoToRegister}
            className="w-full py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs sm:text-sm transition-all flex items-center justify-center space-x-2 cursor-pointer shadow-md active:scale-98"
          >
            <UserPlus className="w-4 h-4" />
            <span>Buat Akun Gratis</span>
          </button>

          <button
            type="button"
            onClick={handleGoToLogin}
            className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs sm:text-sm transition-all flex items-center justify-center space-x-2 cursor-pointer shadow-sm active:scale-98"
          >
            <LogIn className="w-4 h-4" />
            <span>Sudah Punya Akun? Masuk</span>
          </button>

          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="w-full py-2 rounded-xl bg-transparent hover:bg-[#0F2042] text-blue-300 hover:text-white font-semibold text-xs transition-colors cursor-pointer"
          >
            Nanti Saja
          </button>
        </div>
      </div>
    </div>
  );
};

export default GuestRestrictedModal;
