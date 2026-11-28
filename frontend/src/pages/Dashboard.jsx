import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen,
  ClipboardCheck,
  Trophy,
  BarChart3,
  Crown
} from 'lucide-react';

import { useAuth } from '../context/AuthContext';

import Navbar from '../components/Navbar';
import CharacterIllustration from '../components/CharacterIllustration';
import PillMenuButton from '../components/PillMenuButton';
import LeaderboardModal from '../components/LeaderboardModal';
import ProfileModal from '../components/ProfileModal';

import {
  getUserProfileStats,
  getTitleBadgeClass
} from '../utils/activityTracker';

import { getCharacterAvatar } from '../utils/characterAvatars';


/**
 * Halaman Dashboard Utama TKA SD
 */
const Dashboard = () => {
  // Hooks dan Context
  const { user } = useAuth();
  const navigate = useNavigate();

  // State
  const [profileStats, setProfileStats] = useState(() => getUserProfileStats());
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  // Memperbarui statistik profil
  const refreshStats = () => {
    setProfileStats(getUserProfileStats());
  };

  // Event Listener untuk perubahan profil
  useEffect(() => {
    refreshStats();

    window.addEventListener('tka_profile_updated', refreshStats);
    window.addEventListener('storage', refreshStats);

    return () => {
      window.removeEventListener('tka_profile_updated', refreshStats);
      window.removeEventListener('storage', refreshStats);
    };
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-transparent text-slate-800">

      {/* ========================================
          1. NAVBAR
      ======================================== */}
      <Navbar />


      {/* ========================================
          2. AREA UTAMA DASHBOARD
      ======================================== */}
      <main className="flex-1 w-full px-3 py-4 sm:px-6 sm:py-6 lg:px-10 lg:py-8 flex flex-col justify-start lg:justify-center">

        <div className="w-full max-w-6xl mx-auto flex flex-col gap-4 sm:gap-6">

          {/* ========================================
              2.1 PROFIL SISWA
          ======================================== */}
          <div className="w-full relative overflow-hidden p-3.5 sm:p-5 lg:px-6 rounded-2xl bg-[#162E5B] border border-blue-500/40 shadow-lg text-white">

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-5">

              {/* Identitas Siswa */}
              <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">

                {/* Avatar dan Gelar */}
                <div className="relative flex-shrink-0">

                  <button
                    type="button"
                    onClick={() => setIsProfileModalOpen(true)}
                    className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 rounded-2xl bg-white border-2 border-blue-400 hover:border-blue-300 flex items-center justify-center shadow-md cursor-pointer transition-all duration-200 active:scale-95 group overflow-hidden"
                    title="Buka profil & ganti karakter"
                  >
                    <img
                      src={getCharacterAvatar(profileStats?.avatar).image}
                      alt={getCharacterAvatar(profileStats?.avatar).name}
                      className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-110"
                    />
                  </button>

                  {profileStats?.activeTitle?.icon && (
                    <span
                      className={`absolute text-xl sm:text-2xl filter drop-shadow-md select-none pointer-events-none z-20 leading-none inline-block transform ${getTitleBadgeClass(profileStats.activeTitle)}`}
                      title={`Gelar: ${profileStats.activeTitle.name}`}
                    >
                      {profileStats.activeTitle.icon}
                    </span>
                  )}

                </div>


                {/* Nama dan Informasi Siswa */}
                <div className="min-w-0 flex-1">

                  <div className="flex items-center gap-2 flex-wrap">

                    <h1 className="text-base sm:text-xl lg:text-2xl font-bold text-white tracking-tight leading-tight">
                      Halo, {user?.username || user?.email?.split('@')[0] || 'Siswa'}!
                    </h1>

                    {profileStats?.activeTitle && (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[9px] sm:text-[10px] lg:text-xs font-bold bg-blue-600/80 text-blue-50 border border-blue-400/70 shadow-sm whitespace-nowrap">
                        {profileStats.activeTitle.name}
                      </span>
                    )}

                  </div>

                  <p className="text-[11px] sm:text-xs lg:text-sm text-blue-200/90 mt-1.5 leading-relaxed">
                    Mau belajar apa hari ini? Yuk kumpulkan EXP dan naik level!
                  </p>

                </div>
              </div>


              {/* Pemisah Mobile */}
              <div className="w-full h-px bg-blue-400/20 sm:hidden" />


              {/* ========================================
                  Progres Level
              ======================================== */}
              <div className="w-full sm:w-auto sm:min-w-[240px] lg:min-w-[280px] sm:flex-shrink-0">

                {/* Label Progres */}
                <div className="flex items-center justify-between gap-3 mb-2">

                  <span className="text-[11px] sm:text-xs font-semibold text-blue-200 whitespace-nowrap">
                    Progres Level
                  </span>

                  <span className="text-[10px] sm:text-xs text-blue-300 font-medium whitespace-nowrap">
                    {profileStats.isMaxLevel
                      ? 'Level Maksimal 🏆'
                      : `${profileStats.progressPercent}% tercapai`}
                  </span>

                </div>


                {/* Panel Progres */}
                <div className="flex items-center gap-3 px-3.5 py-3 rounded-xl bg-[#0F2042] border border-blue-500/30 shadow-inner">

                  {/* Informasi Level */}
                  <div className="flex flex-col items-center justify-center min-w-[38px] flex-shrink-0">

                    <span className="text-[9px] uppercase tracking-wider text-blue-300 font-semibold">
                      {profileStats.isMaxLevel ? 'Max Lv' : 'Level'}
                    </span>

                    <span
                      className={`text-base sm:text-lg font-extrabold leading-tight ${
                        profileStats.isMaxLevel ? 'text-amber-300' : 'text-blue-400'
                      }`}
                    >
                      {profileStats.level}
                    </span>

                  </div>


                  {/* Progress Bar */}
                  <div className="flex-1 min-w-0">

                    <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">

                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          profileStats.isMaxLevel
                            ? 'bg-gradient-to-r from-amber-400 to-yellow-300'
                            : 'bg-gradient-to-r from-blue-500 to-cyan-400'
                        }`}
                        style={{
                          width: `${Math.min(100, Math.max(0, profileStats.progressPercent))}%`
                        }}
                      />

                    </div>

                    <p className="text-[9px] sm:text-[10px] text-blue-300/80 mt-1.5">
                      {profileStats.isMaxLevel
                        ? 'Keren! Semua bintang & nilai sempurna tercapai!'
                        : 'Sedikit lagi naik level, semangat!'}
                    </p>

                  </div>

                </div>
              </div>

            </div>
          </div>


          {/* ========================================
              2.2 AREA MENU DAN KARAKTER
          ======================================== */}
          <div className="grid grid-cols-[minmax(0,1.02fr)_minmax(0,0.98fr)] sm:grid-cols-2 gap-1.5 sm:gap-5 lg:gap-8 items-center">

            {/* Kolom Menu */}
            <section className="min-w-0 flex flex-col justify-center gap-2 sm:gap-3 lg:gap-4">

              <PillMenuButton
                label="Materi"
                icon={BookOpen}
                accentColor="blue"
                onClick={() => navigate('/materi')}
              />

              <PillMenuButton
                label="Latihan Soal"
                icon={ClipboardCheck}
                accentColor="emerald"
                onClick={() => navigate('/latihan')}
              />

              <PillMenuButton
                label="Tryout"
                icon={Trophy}
                accentColor="amber"
                onClick={() => navigate('/tryout')}
              />

              <PillMenuButton
                label="Rapor"
                icon={BarChart3}
                accentColor="purple"
                onClick={() => navigate('/rapor')}
              />

              <PillMenuButton
                label="Leaderboard"
                icon={Crown}
                accentColor="yellow"
                badgeText={`Lv. ${profileStats.level}`}
                onClick={() => setIsLeaderboardOpen(true)}
              />

            </section>


            {/* Kolom Ilustrasi Karakter */}
            <section className="min-w-0 w-full flex items-center justify-center">

              <div className="w-full max-w-[230px] sm:max-w-[300px] md:max-w-[360px] lg:max-w-[420px] flex justify-center">
                <CharacterIllustration />
              </div>

            </section>

          </div>

        </div>
      </main>


      {/* ========================================
          3. MODAL LEADERBOARD
      ======================================== */}
      <LeaderboardModal
        isOpen={isLeaderboardOpen}
        onClose={() => setIsLeaderboardOpen(false)}
        user={user}
        profileStats={profileStats}
      />


      {/* ========================================
          4. MODAL PROFIL SISWA
      ======================================== */}
      <ProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        user={user}
        profileStats={profileStats}
        onProfileUpdated={refreshStats}
      />

    </div>
  );
};

export default Dashboard;
