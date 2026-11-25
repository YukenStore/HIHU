import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { LogOut, ShieldCheck, Menu, X, ChevronRight } from 'lucide-react';
import { getUserProfileStats } from '../utils/activityTracker';
import { getCharacterAvatar } from '../utils/characterAvatars';
import { isAdminUser } from '../config/adminConfig';
import ProfileModal from './ProfileModal';

/**
 * Komponen Navbar dengan Indikator Streak (Api Belajar) dan Menu Dropdown Garis Tiga di Pojok Kanan
 */
const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [profileStats, setProfileStats] = useState(() => getUserProfileStats());
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef(null);

  const refreshStats = () => {
    setProfileStats(getUserProfileStats());
  };

  useEffect(() => {
    refreshStats();

    // Dengar event saat ada perubahan aktivitas belajar (EXP, level, gelar, streak)
    window.addEventListener('tka_profile_updated', refreshStats);
    window.addEventListener('storage', refreshStats);

    return () => {
      window.removeEventListener('tka_profile_updated', refreshStats);
      window.removeEventListener('storage', refreshStats);
    };
  }, []);

  // Tutup dropdown otomatis ketika klik di luar area menu atau tekan tombol Escape
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setIsMenuOpen(false);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsMenuOpen(false);
      }
    };

    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isMenuOpen]);

  const handleLogout = () => {
    setIsMenuOpen(false);
    logout();
    navigate('/');
  };

  const displayName =
    user?.username || (user?.email ? user.email.split('@')[0] : 'Siswa');

  return (
    <>
      <nav className="bg-slate-200/95 backdrop-blur-md border-b border-slate-300 shadow-xs sticky top-0 z-30 pt-safe">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14 sm:h-16 gap-2 sm:gap-4">
            {/* Logo & Judul Aplikasi */}
            <div
              onClick={() => navigate('/dashboard')}
              className="flex items-center space-x-2 cursor-pointer flex-shrink-0 active:scale-95 transition-transform"
            >
              <img
                src="/logo.png"
                alt="Logo MyAkademika"
                className="h-8 sm:h-9 w-auto object-contain rounded-md"
              />
              <span className="font-bold text-sm sm:text-base text-slate-800 tracking-tight">
                MyAkademika
              </span>
            </div>

            {/* Bagian Kanan: Indikator Api (Streak) & Tombol Garis Tiga (Dropdown Menu) */}
            <div className="flex items-center space-x-2 sm:space-x-2.5">
              {/* 1. Indikator Streak Belajar (Tetap tampil di luar dropdown) */}
              <div
                className={`inline-flex h-10 box-border items-center space-x-1 sm:space-x-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold select-none border transition-all duration-300 shadow-sm bg-[#162E5B] border-[#1E3A8A] flex-shrink-0 ${
                  profileStats.streak.activeToday
                    ? 'text-amber-300'
                    : 'text-slate-300'
                }`}
                title={
                  profileStats.streak.activeToday
                    ? `Belajar rutin ${profileStats.streak.count} hari berturut-turut!`
                    : `Catatan belajar ${profileStats.streak.count} hari`
                }
              >
                <span
                  className={
                    profileStats.streak.activeToday
                      ? 'text-sm'
                      : 'grayscale opacity-60 text-sm'
                  }
                >
                  🔥
                </span>
                <span className="font-semibold text-white text-[11px] sm:text-xs">
                  {profileStats.streak.count}
                  <span className="hidden xs:inline"> Hari</span>
                </span>
              </div>

              {/* 2. Tombol Garis Tiga (Hamburger Menu) beserta Dropdown di Pojok Kanan */}
              <div className="relative" ref={menuRef}>
                <button
                  type="button"
                  onClick={() => setIsMenuOpen((prev) => !prev)}
                  className={`inline-flex h-10 w-10 box-border items-center justify-center rounded-lg text-white bg-[#162E5B] hover:bg-[#1E3A8A] border transition-all cursor-pointer shadow-sm active:scale-95 ${
                    isMenuOpen
                      ? 'border-blue-400 ring-2 ring-blue-400/30'
                      : 'border-[#1E3A8A]'
                  }`}
                  title="Menu & Profil"
                  aria-label="Menu"
                  aria-expanded={isMenuOpen}
                >
                  {isMenuOpen ? (
                    <X className="w-5 h-5 text-blue-200" />
                  ) : (
                    <Menu className="w-5 h-5 text-white" />
                  )}
                </button>

                {/* Dropdown Menu */}
                {isMenuOpen && (
                  <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-[#162E5B] border-2 border-blue-500/50 shadow-2xl p-2 text-white z-50 space-y-1.5 animate-fade-in">
                    {/* Item 1: Profil Pengguna (Avatar, Nama, Level, Gelar) */}
                    <button
                      type="button"
                      onClick={() => {
                        setIsMenuOpen(false);
                        setIsProfileModalOpen(true);
                      }}
                      className="w-full p-2.5 rounded-xl bg-[#0F2042] hover:bg-[#1E3A8A] border border-blue-500/30 hover:border-blue-400 transition-all cursor-pointer flex items-center justify-between gap-2.5 text-left group"
                    >
                      <div className="flex items-center space-x-2.5 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-white border-2 border-blue-400 flex items-center justify-center flex-shrink-0 overflow-hidden shadow-xs">
                          <img
                            src={getCharacterAvatar(profileStats?.avatar).image}
                            alt={getCharacterAvatar(profileStats?.avatar).name}
                            className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                          />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center space-x-1.5">
                            <span className="font-bold text-xs sm:text-sm text-white truncate">
                              {displayName}
                            </span>
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#1D4ED8] text-white flex-shrink-0">
                              Lv.{profileStats.level}
                            </span>
                          </div>
                          <span className="text-[11px] text-blue-200 block truncate mt-0.5">
                            {profileStats?.activeTitle?.icon}{' '}
                            {profileStats?.activeTitle?.name || 'Lihat Profil'}
                          </span>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-blue-300 group-hover:text-white group-hover:translate-x-0.5 transition-all flex-shrink-0" />
                    </button>

                    {/* Item 2: Admin Panel (Khusus akun Admin, tersembunyi dari user biasa) */}
                    {isAdminUser(user) && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsMenuOpen(false);
                          navigate('/admin');
                        }}
                        className="w-full px-3 py-2.5 rounded-xl bg-[#0F2042] hover:bg-[#1E3A8A] border border-amber-400/50 text-amber-300 hover:text-amber-200 text-xs font-bold flex items-center justify-between transition-all cursor-pointer group"
                      >
                        <div className="flex items-center space-x-2">
                          <ShieldCheck className="w-4 h-4 text-amber-400 flex-shrink-0" />
                          <span>Admin Panel</span>
                        </div>
                        <ChevronRight className="w-3.5 h-3.5 text-amber-400/80 group-hover:translate-x-0.5 transition-transform" />
                      </button>
                    )}

                    <div className="h-px bg-blue-800/70 my-1" />

                    {/* Item 3: Tombol Keluar (Logout) */}
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="w-full px-3 py-2.5 rounded-xl bg-[#0F2042]/80 hover:bg-rose-900/80 border border-transparent hover:border-rose-500/50 text-rose-200 hover:text-white text-xs font-semibold flex items-center space-x-2 transition-all cursor-pointer"
                    >
                      <LogOut className="w-4 h-4 text-rose-400 flex-shrink-0" />
                      <span>Keluar</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Modal Detail Profil, EXP, Streak & Koleksi Gelar */}
      <ProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        user={user}
        profileStats={profileStats}
        onProfileUpdated={refreshStats}
      />
    </>
  );
};

export default Navbar;
