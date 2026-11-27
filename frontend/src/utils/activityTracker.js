import { profileService } from '../services/profileService';
import {
  CHARACTER_AVATARS,
  DEFAULT_AVATAR_ID,
  STARTER_AVATAR_IDS,
  FANTASY_AVATAR_IDS,
} from './characterAvatars';

/**
 * Activity Tracker TKA SD
 * Menyimpan dan mengelola statistik aktivitas belajar murid secara persisten (localStorage + Cloudflare D1)
 * untuk disajikan pada halaman Rapor dan Profil.
 */

const STORAGE_KEY = 'tka_sd_user_activity_v2';
const GUEST_STORAGE_KEY = 'tka_sd_guest_simulation_v1';

/**
 * Memeriksa apakah sesi aktif saat ini adalah akun Guest (simulasi)
 */
export const isGuestSession = () => {
  if (typeof window === 'undefined') return false;
  try {
    if (localStorage.getItem('token') === 'GUEST_SIMULATION_TOKEN') return true;
    const rawUser = localStorage.getItem('user');
    if (rawUser) {
      const parsed = JSON.parse(rawUser);
      return Boolean(parsed?.isGuest);
    }
  } catch (_) {}
  return false;
};

const getActiveStorageKey = () => (isGuestSession() ? GUEST_STORAGE_KEY : STORAGE_KEY);

/**
 * Mereset data simulasi Guest tanpa menyentuh data pengguna asli
 */
export const resetGuestSimulationData = () => {
  if (typeof window === 'undefined') return;
  try {
    const initialGuestData = {
      isGuestSimulation: true,
      materiCompleted: [],
      unlockedMateri: ['mtk_1', 'bi_1'],
      materiStars: {},
      materiBestExp: {},
      latihanCompleted: [],
      unlockedLatihan: ['mtk_lat_1', 'bi_lat_1'],
      latihanStars: {},
      latihanBestExp: {},
      tryoutBestExp: {},
      tryoutBestScore: {},
      latihanHistory: [],
      tryoutHistory: [],
      streak: {
        count: 0,
        lastActiveDate: null,
        activeToday: false,
      },
      exp: 0,
      unlockedTitles: ['pemula'],
      activeTitle: 'pemula',
      avatar: 'baby-boy',
      unlockedAvatars: ['baby-boy', 'baby-girl'],
    };
    localStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify(initialGuestData));
    localStorage.removeItem('tka_sd_guest_completed_tryouts');
  } catch (_) {}
};

// Bersihkan cache lama jika ada di browser
if (typeof window !== 'undefined') {
  try {
    localStorage.removeItem('tka_sd_user_activity_v1');
  } catch (_) {}
}

export const getTodayDateStr = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const getYesterdayDateStr = () => {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Daftar Gelar Pembelajaran TKA SD yang bisa didapatkan siswa
 */
/**
 * Konfigurasi posisi dan sudut kemiringan (tilt) yang presisi untuk setiap icon gelar
 * disesuaikan dengan proporsi, bobot visual & bentuk emoji masing-masing.
 */
export const TITLE_BADGE_CONFIG = {
  pemula: {
    // 🌱 Tunas: tumbuh keluar dari sudut kiri atas
    className: '-top-3 -left-2.5 -rotate-[15deg]',
  },
  literasi_fondasi: {
    // 📖 Buku: stiker buku terbuka
    className: '-top-2.5 -left-2.5 -rotate-[10deg]',
  },
  numerasi_dasar: {
    // 🔢 Angka: balok keypad angka rapi
    className: '-top-2 -left-2 -rotate-[8deg]',
  },
  pejuang_latihan: {
    // ⚔️ Pedang: pedang ksatria pejuang latihan
    className: '-top-2.5 -left-2.5 -rotate-[10deg]',
  },
  bintang_tryout: {
    // ⭐ Bintang: bintang emas dinamis
    className: '-top-2.5 -left-2.5 -rotate-[15deg]',
  },
  streak_master: {
    // 🔥 Api: kobaran api semangat
    className: '-top-3 -left-2 -rotate-[8deg]',
  },
  juara_skor: {
    // 👑 Mahkota: mahkota raja bertengger di atas kepala
    className: '-top-3.5 -left-2 -rotate-[15deg]',
  },
  cendekiawan_muda: {
    // 🎓 Toga: topi wisuda cendekiawan
    className: '-top-3 -left-2 -rotate-[12deg]',
  },
  legenda_sd: {
    // 🏆 Piala: piala emas juara nusantara
    className: '-top-3 -left-2 -rotate-[10deg]',
  },
  default: {
    className: '-top-2.5 -left-2 -rotate-[12deg]',
  },
};

/**
 * Mendapatkan class Tailwind posisi & rotasi yang pas untuk icon gelar tertentu
 */
export const getTitleBadgeClass = (titleOrId) => {
  if (!titleOrId) return TITLE_BADGE_CONFIG.default.className;
  const titleId = typeof titleOrId === 'string' ? titleOrId : titleOrId?.id;
  return (TITLE_BADGE_CONFIG[titleId] || TITLE_BADGE_CONFIG.default).className;
};

export const AVAILABLE_TITLES = [
  {
    id: 'pemula',
    name: 'Siswa Penjelajah',
    icon: '🌱',
    color: 'emerald',
    badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-300',
    badgeClassName: '-top-3 -left-2.5 -rotate-[15deg]',
    desc: 'Gelar awal buat kamu yang baru mulai belajar di MyAkademika.',
    requirement: 'Otomatis terbuka untuk semua siswa',
    isUnlocked: () => true,
  },
  {
    id: 'literasi_fondasi',
    name: 'Penjelajah Literasi',
    icon: '📖',
    color: 'blue',
    badgeColor: 'bg-blue-50 text-blue-700 border-blue-300',
    badgeClassName: '-top-2.5 -left-2.5 -rotate-[10deg]',
    desc: 'Sudah mulai lancar memahami bacaan Bahasa Indonesia.',
    requirement: 'Selesaikan minimal 1 materi atau latihan Bahasa Indonesia',
    isUnlocked: (data) =>
      (data.materiCompleted || []).some((id) => id.startsWith('bi_')) ||
      (data.latihanCompleted || []).some((id) => id.startsWith('bi_')),
  },
  {
    id: 'numerasi_dasar',
    name: 'Jago Hitung Cepat',
    icon: '🔢',
    color: 'teal',
    badgeColor: 'bg-teal-50 text-teal-700 border-teal-300',
    badgeClassName: '-top-2 -left-2 -rotate-[8deg]',
    desc: 'Sudah mulai jago berhitung dan memecahkan soal Matematika.',
    requirement: 'Selesaikan minimal 1 materi atau latihan Matematika',
    isUnlocked: (data) =>
      (data.materiCompleted || []).some((id) => id.startsWith('mtk_')) ||
      (data.latihanCompleted || []).some((id) => id.startsWith('mtk_')),
  },
  {
    id: 'pejuang_latihan',
    name: 'Rajin Latihan',
    icon: '⚔️',
    color: 'indigo',
    badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-300',
    badgeClassName: '-top-2.5 -left-2.5 -rotate-[10deg]',
    desc: 'Sudah rajin mengerjakan berbagai paket latihan soal.',
    requirement: 'Selesaikan minimal 3 sesi Latihan Soal',
    isUnlocked: (data) =>
      (data.latihanCompleted || []).length >= 3 || (data.latihanHistory || []).length >= 3,
  },
  {
    id: 'bintang_tryout',
    name: 'Bintang Tryout',
    icon: '⭐',
    color: 'amber',
    badgeColor: 'bg-amber-50 text-amber-700 border-amber-300',
    badgeClassName: '-top-2.5 -left-2.5 -rotate-[15deg]',
    desc: 'Sudah menyelesaikan paket tryout dengan tuntas.',
    requirement: 'Selesaikan minimal 1 paket Tryout',
    isUnlocked: (data) => (data.tryoutHistory || []).length >= 1,
  },
  {
    id: 'streak_master',
    name: 'Konsisten Belajar',
    icon: '🔥',
    color: 'orange',
    badgeColor: 'bg-orange-50 text-orange-700 border-orange-300',
    badgeClassName: '-top-3 -left-2 -rotate-[8deg]',
    desc: 'Belajar rutin setiap hari tanpa putus.',
    requirement: 'Jaga streak belajar minimal 3 hari berturut-turut',
    isUnlocked: (data) => (data.streak?.count || 0) >= 3,
  },
  {
    id: 'juara_skor',
    name: 'Nilai Sempurna',
    icon: '👑',
    color: 'yellow',
    badgeColor: 'bg-yellow-50 text-yellow-800 border-yellow-300',
    badgeClassName: '-top-3.5 -left-2 -rotate-[15deg]',
    desc: 'Berhasil meraih nilai 100 di latihan soal atau nilai 95+ di tryout.',
    requirement: 'Raih nilai 100 di Latihan Soal atau minimal 95 di Tryout',
    isUnlocked: (data) =>
      (data.latihanHistory || []).some((l) => (l.score || 0) >= 100) ||
      (data.tryoutHistory || []).some((t) => (t.score || 0) >= 95),
  },
  {
    id: 'cendekiawan_muda',
    name: 'Pelajar Teladan',
    icon: '🎓',
    color: 'purple',
    badgeColor: 'bg-purple-50 text-purple-700 border-purple-300',
    badgeClassName: '-top-3 -left-2 -rotate-[12deg]',
    desc: 'Berhasil menembus Level 5 berkat rajin belajar.',
    requirement: 'Capai Level 5 (kumpulkan minimal 1.400 EXP)',
    isUnlocked: (data) => calculateLevelInfo(data.exp || 0).level >= 5,
  },
  {
    id: 'legenda_sd',
    name: 'Juara Puncak',
    icon: '🏆',
    color: 'rose',
    badgeColor: 'bg-rose-50 text-rose-700 border-rose-300',
    badgeClassName: '-top-3 -left-2 -rotate-[10deg]',
    desc: 'Gelar tertinggi buat kamu yang berhasil mencapai Level 10 Maksimal.',
    requirement: 'Capai Level 10 Maksimal (kumpulkan 9.470 EXP dari semua bintang & Tryout nilai 100)',
    isUnlocked: (data) => calculateLevelInfo(data.exp || 0).level >= 10,
  },
];

/**
 * Konfigurasi sistem EXP berbasis bintang & tier nilai Tryout (Anti-Spam / Delta EXP):
 * - Materi (33 bab × 3 bintang = 99★): 30 EXP / bintang → maks 90 EXP / materi (total 2.970 EXP)
 * - Latihan Soal (20 level × 3 bintang = 60★): 50 EXP / bintang → maks 150 EXP / latihan (total 3.000 EXP)
 * - Tryout (10 paket):
 *     • nilai < 30          → 0 EXP
 *     • 30 <= nilai < 60    → 100 EXP (Tier 1)
 *     • 60 <= nilai < 80    → 200 EXP (Tier 2)
 *     • 80 <= nilai < 100   → 300 EXP (Tier 3)
 *     • nilai = 100         → 350 EXP (Tier 3 + Bonus Nilai Sempurna 50 EXP)
 *   Total 10 Tryout nilai 100 = 3.500 EXP
 * - Total EXP Maksimal = 2.970 + 3.000 + 3.500 = 9.470 EXP (Level 10 Maksimal)
 */
export const EXP_CONFIG = {
  MATERI_EXP_PER_STAR: 30,
  MATERI_MAX_EXP: 90,
  LATIHAN_EXP_PER_STAR: 50,
  LATIHAN_MAX_EXP: 150,
  TRYOUT_TIERS: {
    TIER_1_MIN: 30,
    TIER_1_EXP: 100,
    TIER_2_MIN: 60,
    TIER_2_EXP: 200,
    TIER_3_MIN: 80,
    TIER_3_EXP: 300,
    PERFECT_SCORE: 100,
    PERFECT_EXP: 350,
  },
  MAX_LEVEL: 10,
  MAX_LEVEL_EXP: 9470,
};

/**
 * Menghitung total EXP kumulatif untuk jumlah bintang Materi (0..3)
 */
export const getMateriExpForStars = (stars = 0) => {
  const clamped = Math.max(0, Math.min(3, Math.floor(Number(stars) || 0)));
  return clamped * EXP_CONFIG.MATERI_EXP_PER_STAR;
};

/**
 * Menghitung total EXP kumulatif untuk jumlah bintang Latihan Soal (0..3)
 */
export const getLatihanExpForStars = (stars = 0) => {
  const clamped = Math.max(0, Math.min(3, Math.floor(Number(stars) || 0)));
  return clamped * EXP_CONFIG.LATIHAN_EXP_PER_STAR;
};

/**
 * Menghitung tier & total EXP kumulatif Tryout berdasarkan nilai (0..100)
 */
export const getTryoutExpInfo = (score = 0, correct = null, total = null) => {
  const numScore = Number(score) || 0;
  const isPerfect =
    numScore >= EXP_CONFIG.TRYOUT_TIERS.PERFECT_SCORE ||
    (typeof total === 'number' && total > 0 && correct === total);

  if (isPerfect) {
    return {
      tier: 4,
      exp: EXP_CONFIG.TRYOUT_TIERS.PERFECT_EXP,
      label: 'Nilai Sempurna (100)',
      isPerfect: true,
    };
  }
  if (numScore >= EXP_CONFIG.TRYOUT_TIERS.TIER_3_MIN) {
    return {
      tier: 3,
      exp: EXP_CONFIG.TRYOUT_TIERS.TIER_3_EXP,
      label: 'Tier 3 (Nilai 80–99)',
      isPerfect: false,
    };
  }
  if (numScore >= EXP_CONFIG.TRYOUT_TIERS.TIER_2_MIN) {
    return {
      tier: 2,
      exp: EXP_CONFIG.TRYOUT_TIERS.TIER_2_EXP,
      label: 'Tier 2 (Nilai 60–79)',
      isPerfect: false,
    };
  }
  if (numScore >= EXP_CONFIG.TRYOUT_TIERS.TIER_1_MIN) {
    return {
      tier: 1,
      exp: EXP_CONFIG.TRYOUT_TIERS.TIER_1_EXP,
      label: 'Tier 1 (Nilai 30–59)',
      isPerfect: false,
    };
  }
  return {
    tier: 0,
    exp: 0,
    label: 'Di bawah 30',
    isPerfect: false,
  };
};

/**
 * Tabel ambang batas kumulatif EXP untuk setiap level (Level 1 s.d. Level 10 Maksimal).
 * Level 10 tepat tercapai pada 9.470 EXP (seluruh bintang Materi + Latihan + semua Tryout nilai 100).
 */
export const LEVEL_EXP_TABLE = [
  { level: 1, requiredExp: 0, nextLevelExp: 150 },       // Level 1: butuh 150 EXP menuju Lv 2 (total 150)
  { level: 2, requiredExp: 150, nextLevelExp: 250 },     // Level 2: butuh 250 EXP menuju Lv 3 (total 400)
  { level: 3, requiredExp: 400, nextLevelExp: 400 },     // Level 3: butuh 400 EXP menuju Lv 4 (total 800)
  { level: 4, requiredExp: 800, nextLevelExp: 600 },     // Level 4: butuh 600 EXP menuju Lv 5 (total 1.400)
  { level: 5, requiredExp: 1400, nextLevelExp: 900 },    // Level 5: butuh 900 EXP menuju Lv 6 (total 2.300)
  { level: 6, requiredExp: 2300, nextLevelExp: 1200 },   // Level 6: butuh 1.200 EXP menuju Lv 7 (total 3.500)
  { level: 7, requiredExp: 3500, nextLevelExp: 1600 },   // Level 7: butuh 1.600 EXP menuju Lv 8 (total 5.100)
  { level: 8, requiredExp: 5100, nextLevelExp: 2000 },   // Level 8: butuh 2.000 EXP menuju Lv 9 (total 7.100)
  { level: 9, requiredExp: 7100, nextLevelExp: 2370 },   // Level 9: butuh 2.370 EXP menuju Lv 10 MAX (total 9.470)
  { level: 10, requiredExp: 9470, nextLevelExp: 0 },     // Level 10: Level Maksimal
];

/**
 * Menghitung detail level dan progres EXP (maksimal Level 10 pada 9.470 EXP)
 */
export const calculateLevelInfo = (exp = 0) => {
  const currentExp = Math.max(0, Number(exp) || 0);

  // Level Maksimal (Level 10 pada >= 9.470 EXP)
  if (currentExp >= EXP_CONFIG.MAX_LEVEL_EXP) {
    return {
      level: EXP_CONFIG.MAX_LEVEL,
      maxLevel: EXP_CONFIG.MAX_LEVEL,
      isMaxLevel: true,
      totalExp: currentExp,
      currentLevelExp: EXP_CONFIG.MAX_LEVEL_EXP,
      nextLevelExp: EXP_CONFIG.MAX_LEVEL_EXP,
      expRemaining: 0,
      progressPercent: 100,
    };
  }

  let currentLevel = 1;
  let levelBaseExp = 0;
  let nextLevelExp = 150;

  for (let i = LEVEL_EXP_TABLE.length - 1; i >= 0; i--) {
    if (currentExp >= LEVEL_EXP_TABLE[i].requiredExp) {
      currentLevel = LEVEL_EXP_TABLE[i].level;
      levelBaseExp = LEVEL_EXP_TABLE[i].requiredExp;
      nextLevelExp = LEVEL_EXP_TABLE[i].nextLevelExp;
      break;
    }
  }

  const currentLevelExp = currentExp - levelBaseExp;
  const progressPercent =
    nextLevelExp > 0
      ? Math.min(100, Math.max(0, Math.round((currentLevelExp / nextLevelExp) * 100)))
      : 100;

  return {
    level: currentLevel,
    maxLevel: EXP_CONFIG.MAX_LEVEL,
    isMaxLevel: false,
    totalExp: currentExp,
    currentLevelExp,
    nextLevelExp,
    expRemaining: Math.max(0, nextLevelExp - currentLevelExp),
    progressPercent,
  };
};

export const notifyProfileUpdate = () => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('tka_profile_updated'));
  }
};

/**
 * Cek dan tambahkan gelar baru yang terbuka ke data pengguna
 */
export const checkAndUnlockTitles = (data) => {
  if (!data.unlockedTitles) data.unlockedTitles = ['pemula'];
  let hasNew = false;

  AVAILABLE_TITLES.forEach((title) => {
    if (!data.unlockedTitles.includes(title.id)) {
      if (title.isUnlocked(data)) {
        data.unlockedTitles.push(title.id);
        hasNew = true;
      }
    }
  });

  return hasNew;
};

export const getActivityData = () => {
  let data = null;
  const activeKey = getActiveStorageKey();
  try {
    const raw = localStorage.getItem(activeKey);
    if (raw) data = JSON.parse(raw);
  } catch (e) {
    console.error('Gagal membaca aktivitas:', e);
  }

  if (!data) {
    data = {
      materiCompleted: [],
      unlockedMateri: ['mtk_1', 'bi_1'],
      materiStars: {},
      materiBestExp: {},
      latihanCompleted: [],
      unlockedLatihan: ['mtk_lat_1', 'bi_lat_1'],
      latihanStars: {},
      latihanBestExp: {},
      latihanHistory: [],
      tryoutHistory: [],
      tryoutBestExp: {},
      tryoutBestScore: {},
      streak: {
        count: 0,
        lastActiveDate: null,
        activeToday: false,
      },
      exp: 0,
      unlockedTitles: ['pemula'],
      activeTitle: 'pemula',
      avatar: 'baby-boy',
      unlockedAvatars: ['baby-boy', 'baby-girl'],
    };
  }

  // Pastikan properti dasar selalu tersedia
  if (!data.materiCompleted) data.materiCompleted = [];
  if (!data.unlockedMateri) data.unlockedMateri = ['mtk_1', 'bi_1'];
  if (!data.materiStars) data.materiStars = {};
  if (!data.materiBestExp) data.materiBestExp = {};
  if (!data.latihanCompleted) data.latihanCompleted = [];
  if (!data.unlockedLatihan) data.unlockedLatihan = ['mtk_lat_1', 'bi_lat_1'];
  if (!data.latihanStars) data.latihanStars = {};
  if (!data.latihanBestExp) data.latihanBestExp = {};
  if (!data.latihanHistory) data.latihanHistory = [];
  if (!data.tryoutHistory) data.tryoutHistory = [];
  if (!data.tryoutBestExp) data.tryoutBestExp = {};
  if (!data.tryoutBestScore) data.tryoutBestScore = {};

  // Filter sample dummy jika pernah tersimpan di cache
  data.latihanHistory = (data.latihanHistory || []).filter(
    (l) => !l.id?.startsWith('lat_sample_')
  );
  data.tryoutHistory = (data.tryoutHistory || []).filter(
    (t) => !t.id?.startsWith('to_sample_')
  );

  // Inisialisasi Fitur Streak (Reset otomatis pada jam 12 malam)
  const today = getTodayDateStr();
  const yesterday = getYesterdayDateStr();

  if (!data.streak) {
    data.streak = {
      count: 0,
      lastActiveDate: null,
      activeToday: false,
    };
  } else {
    if (data.streak.lastActiveDate === today) {
      data.streak.activeToday = true;
    } else if (data.streak.lastActiveDate === yesterday) {
      data.streak.activeToday = false;
    } else {
      // Sudah lewat jam 12 malam -> streak reset ke 0
      data.streak.count = 0;
      data.streak.activeToday = false;
    }
  }

  // Inisialisasi Total EXP
  if (data.exp === undefined || data.exp === null) {
    // Hitung baseline EXP berdasarkan bintang Materi/Latihan dan nilai terbaik Tryout
    const materiExp = (data.materiCompleted || []).reduce((sum, babId) => {
      const stars =
        data.materiStars?.[babId] !== undefined ? Number(data.materiStars[babId]) || 0 : 3;
      return sum + getMateriExpForStars(stars);
    }, 0);
    const latihanExp = (data.latihanCompleted || []).reduce((sum, latId) => {
      const stars =
        data.latihanStars?.[latId] !== undefined ? Number(data.latihanStars[latId]) || 0 : 3;
      return sum + getLatihanExpForStars(stars);
    }, 0);
    const tryoutBestMap = {};
    (data.tryoutHistory || [])
      .filter((t) => t.isCompletedAll !== false)
      .forEach((t) => {
        const key = `${t.subject}_${t.packageNum}`;
        const tierExp = getTryoutExpInfo(t.score || 0, t.correct, t.total).exp;
        tryoutBestMap[key] = Math.max(tryoutBestMap[key] || 0, tierExp);
      });
    const tryoutExp = Object.values(tryoutBestMap).reduce((sum, v) => sum + v, 0);
    data.exp = materiExp + latihanExp + tryoutExp;
  }

  // Inisialisasi Gelar (Titles)
  if (!data.unlockedTitles || !Array.isArray(data.unlockedTitles)) {
    data.unlockedTitles = ['pemula'];
  }
  if (!data.activeTitle) {
    data.activeTitle = 'pemula';
  }

  if (!data.avatar || data.avatar === 'boy') {
    data.avatar = 'baby-boy';
  }

  if (!data.unlockedAvatars || !Array.isArray(data.unlockedAvatars)) {
    data.unlockedAvatars = ['baby-boy', 'baby-girl'];
  }

  // Cek apakah ada gelar baru yang memenuhi syarat
  checkAndUnlockTitles(data);

  // Cek apakah ada karakter avatar / paket hadiah baru yang memenuhi syarat
  checkAndUnlockAvatars(data);

  // Pastikan avatar aktif selalu valid dan berada di daftar avatar yang sudah terbuka
  if (!data.unlockedAvatars.includes(data.avatar)) {
    data.avatar = 'baby-boy';
  }

  return data;
};

let syncTimeout = null;

/**
 * Menyinkronkan data profil dan statistik belajar ke Cloudflare D1 (debounced)
 */
export const syncProfileToDatabase = (data) => {
  if (typeof window === 'undefined') return;
  // Guest tidak pernah menyimpan data simulasi ke database asli
  if (isGuestSession()) return;
  const token = localStorage.getItem('token');
  if (!token) return;

  if (syncTimeout) clearTimeout(syncTimeout);
  syncTimeout = setTimeout(async () => {
    try {
      const payload = {
        exp: data.exp || 0,
        level: calculateLevelInfo(data.exp || 0).level,
        activeTitle: data.activeTitle || 'pemula',
        unlockedTitles: data.unlockedTitles || ['pemula'],
        streak: data.streak || { count: 0, lastActiveDate: null, activeToday: false },
        activityData: {
          avatar: data.avatar || 'baby-boy',
          unlockedAvatars: data.unlockedAvatars || ['baby-boy', 'baby-girl'],
          materiCompleted: data.materiCompleted || [],
          unlockedMateri: data.unlockedMateri || ['mtk_1', 'bi_1'],
          materiStars: data.materiStars || {},
          materiBestExp: data.materiBestExp || {},
          latihanCompleted: data.latihanCompleted || [],
          unlockedLatihan: data.unlockedLatihan || ['mtk_lat_1', 'bi_lat_1'],
          latihanStars: data.latihanStars || {},
          latihanBestExp: data.latihanBestExp || {},
          latihanHistory: data.latihanHistory || [],
          tryoutHistory: data.tryoutHistory || [],
          tryoutBestExp: data.tryoutBestExp || {},
          tryoutBestScore: data.tryoutBestScore || {},
        },
      };
      await profileService.saveProfile(payload);
    } catch (err) {
      console.warn('Sinkronisasi ke Cloudflare D1 tertunda:', err?.message || err);
    }
  }, 600);
};

/**
 * Mengambil dan menggabungkan data profil dari Cloudflare D1 ke penyimpanan lokal
 */
export const syncProfileFromDatabase = async () => {
  if (typeof window === 'undefined') return null;
  if (isGuestSession()) return null;
  const token = localStorage.getItem('token');
  if (!token) return null;

  try {
    const dbProfile = await profileService.getProfile();
    if (!dbProfile) return null;

    const data = getActivityData();

    if (dbProfile.exp !== undefined && dbProfile.exp !== null) {
      data.exp = dbProfile.exp;
    }
    if (dbProfile.activeTitle) {
      data.activeTitle = dbProfile.activeTitle;
    }
    if (Array.isArray(dbProfile.unlockedTitles) && dbProfile.unlockedTitles.length > 0) {
      data.unlockedTitles = dbProfile.unlockedTitles;
    }
    if (dbProfile.streak) {
      data.streak = {
        ...data.streak,
        ...dbProfile.streak,
      };
    }
    if (dbProfile.activityData && typeof dbProfile.activityData === 'object') {
      const act = dbProfile.activityData;
      if (Array.isArray(act.materiCompleted)) data.materiCompleted = act.materiCompleted;
      if (Array.isArray(act.unlockedMateri)) data.unlockedMateri = act.unlockedMateri;
      if (act.materiStars) data.materiStars = act.materiStars;
      if (act.materiBestExp) data.materiBestExp = act.materiBestExp;
      if (Array.isArray(act.latihanCompleted)) data.latihanCompleted = act.latihanCompleted;
      if (Array.isArray(act.unlockedLatihan)) data.unlockedLatihan = act.unlockedLatihan;
      if (act.latihanStars) data.latihanStars = act.latihanStars;
      if (act.latihanBestExp) data.latihanBestExp = act.latihanBestExp;
      if (act.avatar) data.avatar = act.avatar;
      if (Array.isArray(act.unlockedAvatars)) {
        data.unlockedAvatars = act.unlockedAvatars;
      }
      if (Array.isArray(act.latihanHistory)) data.latihanHistory = act.latihanHistory;
      if (Array.isArray(act.tryoutHistory)) data.tryoutHistory = act.tryoutHistory;
      if (act.tryoutBestExp) data.tryoutBestExp = act.tryoutBestExp;
      if (act.tryoutBestScore) data.tryoutBestScore = act.tryoutBestScore;
    }

    checkAndUnlockTitles(data);
    saveActivityData(data, false);
    notifyProfileUpdate();
    return data;
  } catch (err) {
    console.warn('Gagal memuat profil dari Cloudflare D1:', err?.message || err);
    return null;
  }
};

/**
 * Menyimpan data aktivitas ke localStorage dan menyinkronkannya ke Cloudflare D1
 */
export const saveActivityData = (data, shouldSync = true) => {
  try {
    const activeKey = getActiveStorageKey();
    localStorage.setItem(activeKey, JSON.stringify(data));
    if (shouldSync && !isGuestSession()) {
      syncProfileToDatabase(data);
    }
  } catch (e) {
    console.error('Gagal menyimpan aktivitas:', e);
  }
};

/**
 * Memicu pop-up ajakan Register / Login ketika user Guest mengakses fitur yang dibatasi
 */
export const triggerGuestRestrictionModal = (featureName = 'Fitur ini') => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('tka_guest_restricted', {
        detail: { featureName },
      })
    );
  }
};

export const unlockMateri = (babId) => {
  if (isGuestSession() && babId !== 'mtk_1' && babId !== 'bi_1') {
    return;
  }
  const data = getActivityData();
  if (!data.unlockedMateri) data.unlockedMateri = ['mtk_1', 'bi_1'];
  if (!data.unlockedMateri.includes(babId)) {
    data.unlockedMateri.push(babId);
    saveActivityData(data);
  }
};

export const resetMateriProgress = (subject = null) => {
  const data = getActivityData();
  if (!data.materiStars) data.materiStars = {};
  if (!subject) {
    data.materiCompleted = [];
    data.unlockedMateri = ['mtk_1', 'bi_1'];
    data.materiStars = {};
  } else {
    const prefix =
      subject === 'matematika'
        ? 'mtk_'
        : subject === 'bahasa_indonesia'
        ? 'bi_'
        : `${subject}_`;
    const firstId = `${prefix}1`;
    data.materiCompleted = (data.materiCompleted || []).filter(
      (id) => !id.startsWith(prefix)
    );
    data.unlockedMateri = (data.unlockedMateri || []).filter(
      (id) => !id.startsWith(prefix)
    );
    data.unlockedMateri.push(firstId);
    Object.keys(data.materiStars).forEach((key) => {
      if (key.startsWith(prefix)) delete data.materiStars[key];
    });
  }
  saveActivityData(data);
  return data;
};

/**
 * Memicu pop-up reward perolehan EXP dan Level Up Duolingo-style
 */
export const triggerRewardCelebration = (detail) => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('tka_reward_earned', { detail }));
  }
};

export const recordUserActivity = (actionType = 'general', expEarned = 50) => {
  const data = getActivityData();
  const prevExp = data.exp || 0;
  const prevLevelInfo = calculateLevelInfo(prevExp);
  const prevLevel = prevLevelInfo.level;
  const prevUnlocked = [...(data.unlockedTitles || ['pemula'])];

  const today = getTodayDateStr();
  const yesterday = getYesterdayDateStr();

  // 1. Update streak
  if (!data.streak) {
    data.streak = { count: 1, lastActiveDate: today, activeToday: true };
  } else {
    if (data.streak.lastActiveDate === today) {
      data.streak.activeToday = true;
    } else if (data.streak.lastActiveDate === yesterday) {
      data.streak.count = (data.streak.count || 0) + 1;
      data.streak.lastActiveDate = today;
      data.streak.activeToday = true;
    } else {
      data.streak.count = 1;
      data.streak.lastActiveDate = today;
      data.streak.activeToday = true;
    }
  }

  // 2. Tambah EXP
  data.exp = (data.exp || 0) + expEarned;
  const newLevelInfo = calculateLevelInfo(data.exp);
  const leveledUp = newLevelInfo.level > prevLevel;

  // 3. Cek gelar baru
  checkAndUnlockTitles(data);
  const newTitlesUnlocked = (data.unlockedTitles || [])
    .filter((id) => !prevUnlocked.includes(id))
    .map((id) => AVAILABLE_TITLES.find((t) => t.id === id))
    .filter(Boolean);

  saveActivityData(data);
  notifyProfileUpdate();

  // 4. Memicu Event Pop-up Duolingo Reward
  triggerRewardCelebration({
    expEarned,
    prevExp,
    newExp: data.exp,
    prevLevelInfo,
    newLevelInfo,
    leveledUp,
    streak: data.streak,
    actionType,
    newTitlesUnlocked,
  });

  return { data, leveledUp, expEarned, newLevelInfo };
};

export const setActiveTitle = (titleId) => {
  const data = getActivityData();
  const valid = AVAILABLE_TITLES.find((t) => t.id === titleId);
  if (valid && (data.unlockedTitles || []).includes(titleId)) {
    data.activeTitle = titleId;
    saveActivityData(data);
    notifyProfileUpdate();
    return true;
  }
  return false;
};

export const getUserProfileStats = () => {
  const data = getActivityData();
  const levelInfo = calculateLevelInfo(data.exp || 0);
  const activeTitleObj =
    AVAILABLE_TITLES.find((t) => t.id === data.activeTitle) || AVAILABLE_TITLES[0];

  return {
    ...levelInfo,
    streak: data.streak || { count: 0, lastActiveDate: null, activeToday: false },
    activeTitle: activeTitleObj,
    unlockedTitles: data.unlockedTitles || ['pemula'],
    avatar: data.avatar || 'baby-boy',
    unlockedAvatars: data.unlockedAvatars || ['baby-boy', 'baby-girl'],
    allTitles: AVAILABLE_TITLES.map((t) => ({
      ...t,
      unlocked: (data.unlockedTitles || []).includes(t.id),
      isActive: (data.activeTitle || 'pemula') === t.id,
    })),
  };
};

/**
 * Memeriksa dan membuka kunci karakter avatar berdasarkan capaian materi dan latihan soal.
 * Membedakan capaian antara Bahasa Indonesia dan Matematika:
 * - Starter: 'baby-boy' (Bayi Cowo) & 'baby-girl' (Bayi Cewe)
 * - Paket Bocil Cowo & Cewe ('boy' & 'girl'): Peti Materi 5 Bahasa Indonesia
 * - Paket Anak Cowo & Cewe ('child-boy' & 'child-girl'): Peti Materi 4 Matematika
 * - Paket Raja & Ratu ('king' & 'queen'): Piala Puncak Materi 21 Bahasa Indonesia
 * - Pahlawan ('knight', 'ninja', 'cowboy'): Latihan Soal Matematika (1, 3, 5 sesi)
 * - Hewan ('fox', 'red-wolf', 'cow', 'teddy-bear-heart', 'panda', 'sheep', 'frog'): Materi & Latihan B. Indo / Matematika
 * - Fantasi: Spesial Gacha Tryout (min. 80% benar)
 */
export const checkAndUnlockAvatars = (data) => {
  // Ambil karakter fantasi yang sebelumnya sudah sah di-gacha
  const existingGacha = (data.unlockedAvatars || []).filter((id) =>
    FANTASY_AVATAR_IDS.includes(id)
  );

  // Set avatar yang sah terbuka: starter ('baby-boy', 'baby-girl') + gacha fantasi yang sudah didapat
  const legitUnlocked = new Set(['baby-boy', 'baby-girl', ...existingGacha]);

  const materiCompleted = data.materiCompleted || [];
  const materiStars = data.materiStars || {};
  const latihanCompleted = data.latihanCompleted || [];
  const latihanStars = data.latihanStars || {};

  // Helper ketat: cek apakah SEMUA ID materi/latihan pada daftar sudah meraih 3 bintang penuh
  const hasAllStarsForIds = (ids, completedList, starsMap) => {
    for (const id of ids) {
      const stars =
        starsMap[id] !== undefined
          ? Number(starsMap[id]) || 0
          : completedList.includes(id)
          ? 3
          : 0;
      if (stars < 3) return false;
    }
    return ids.length > 0;
  };

  // Helper ketat: cek apakah SEMUA materi/latihan dari 1 s.d. count sudah meraih 3 bintang penuh
  const hasAllStarsUpTo = (prefix, count, completedList, starsMap) => {
    const ids = [];
    for (let i = 1; i <= count; i++) {
      ids.push(`${prefix}${i}`);
    }
    return hasAllStarsForIds(ids, completedList, starsMap);
  };

  // Urutan aktual ID materi Matematika pada peta belajar (Pengukuran/mtk_5 berada di urutan ke-2 sebelum Perbandingan & Skala/mtk_2)
  const MTK_MATERI_ORDERED_IDS = [
    'mtk_1',
    'mtk_5',
    'mtk_2',
    'mtk_3',
    'mtk_4',
    'mtk_6',
    'mtk_7',
    'mtk_8',
    'mtk_9',
    'mtk_10',
    'mtk_11',
    'mtk_12',
  ];

  // 1. Peti Materi 5 Bahasa Indonesia (Semua 15 Bintang Materi 1-5): Paket Bocil Cowo & Cewe ('boy' & 'girl')
  if (hasAllStarsUpTo('bi_', 5, materiCompleted, materiStars)) {
    legitUnlocked.add('boy');
    legitUnlocked.add('girl');
  }

  // 2. Peti Materi 10 Bahasa Indonesia (Semua 30 Bintang Materi 1-10): Rubah ('fox')
  if (hasAllStarsUpTo('bi_', 10, materiCompleted, materiStars)) {
    legitUnlocked.add('fox');
  }

  // 3. Peti Materi 15 Bahasa Indonesia (Semua 45 Bintang Materi 1-15): Serigala ('red-wolf')
  if (hasAllStarsUpTo('bi_', 15, materiCompleted, materiStars)) {
    legitUnlocked.add('red-wolf');
  }

  // 4. Piala Puncak Materi 21 Bahasa Indonesia (Semua 63 Bintang Materi 1-21): Paket Raja & Ratu ('king' & 'queen')
  if (hasAllStarsUpTo('bi_', 21, materiCompleted, materiStars)) {
    legitUnlocked.add('king');
    legitUnlocked.add('queen');
  }

  // 5. Peti Materi 4 Matematika (Semua 12 Bintang Materi urutan 1-4: Operasi Hitung, Pengukuran, Perbandingan & Skala, KPK & FPB)
  if (hasAllStarsForIds(MTK_MATERI_ORDERED_IDS.slice(0, 4), materiCompleted, materiStars)) {
    legitUnlocked.add('child-boy');
    legitUnlocked.add('child-girl');
  }

  // 6. Peti Materi 8 Matematika (Semua 24 Bintang Materi urutan 1-8): Domba ('sheep')
  if (hasAllStarsForIds(MTK_MATERI_ORDERED_IDS.slice(0, 8), materiCompleted, materiStars)) {
    legitUnlocked.add('sheep');
  }

  // 7. Piala Puncak Materi 12 Matematika (Semua 36 Bintang Materi 1-12): Ksatria ('knight')
  if (hasAllStarsForIds(MTK_MATERI_ORDERED_IDS, materiCompleted, materiStars)) {
    legitUnlocked.add('knight');
  }

  // 8. Peti Latihan 4 Matematika (Semua 12 Bintang Latihan 1-4): Katak ('frog')
  if (hasAllStarsUpTo('mtk_lat_', 4, latihanCompleted, latihanStars)) {
    legitUnlocked.add('frog');
  }

  // 9. Peti Latihan 7 Matematika (Semua 21 Bintang Latihan 1-7): Panda ('panda')
  if (hasAllStarsUpTo('mtk_lat_', 7, latihanCompleted, latihanStars)) {
    legitUnlocked.add('panda');
  }

  // 10. Piala Puncak Latihan 10 Matematika (Semua 30 Bintang Latihan 1-10): Koboi ('cowboy')
  if (hasAllStarsUpTo('mtk_lat_', 10, latihanCompleted, latihanStars)) {
    legitUnlocked.add('cowboy');
  }

  // 11. Peti Latihan 4 Bahasa Indonesia (Semua 12 Bintang Latihan 1-4): Sapi ('cow')
  if (hasAllStarsUpTo('bi_lat_', 4, latihanCompleted, latihanStars)) {
    legitUnlocked.add('cow');
  }

  // 12. Peti Latihan 7 Bahasa Indonesia (Semua 21 Bintang Latihan 1-7): Beruang ('teddy-bear-heart')
  if (hasAllStarsUpTo('bi_lat_', 7, latihanCompleted, latihanStars)) {
    legitUnlocked.add('teddy-bear-heart');
  }

  // 13. Piala Puncak Latihan 10 Bahasa Indonesia (Semua 30 Bintang Latihan 1-10): Ninja ('ninja')
  if (hasAllStarsUpTo('bi_lat_', 10, latihanCompleted, latihanStars)) {
    legitUnlocked.add('ninja');
  }

  const prevList = data.unlockedAvatars || ['baby-boy', 'baby-girl'];
  const nextList = Array.from(legitUnlocked);

  const newlyUnlocked = nextList
    .filter((id) => !prevList.includes(id))
    .map((id) => CHARACTER_AVATARS.find((c) => c.id === id))
    .filter(Boolean);

  data.unlockedAvatars = nextList;

  // Pastikan avatar aktif selalu valid
  if (!data.unlockedAvatars.includes(data.avatar)) {
    data.avatar = 'baby-boy';
  }

  return newlyUnlocked;
};

/**
 * Mengundi (gacha) 1 karakter kategori Fantasi secara acak
 * ketika siswa menyelesaikan Tryout dengan nilai minimal 80% benar.
 */
export const rollFantasyGacha = (data) => {
  const fantasyAvatars = CHARACTER_AVATARS.filter((c) => c.category === 'Fantasi');
  const unlocked = data.unlockedAvatars || ['baby-boy', 'baby-girl'];
  const lockedFantasy = fantasyAvatars.filter((c) => !unlocked.includes(c.id));

  if (lockedFantasy.length === 0) {
    return null; // Seluruh karakter fantasi sudah berhasil dikoleksi
  }

  // Pilih secara acak dari karakter fantasi yang masih terkunci
  const randomIndex = Math.floor(Math.random() * lockedFantasy.length);
  const wonAvatar = lockedFantasy[randomIndex];

  if (!data.unlockedAvatars) data.unlockedAvatars = ['baby-boy', 'baby-girl'];
  data.unlockedAvatars.push(wonAvatar.id);

  saveActivityData(data, true);
  notifyProfileUpdate();

  // Memicu notifikasi modal perayaan gacha fantasi
  if (typeof window !== 'undefined') {
    setTimeout(() => {
      window.dispatchEvent(
        new CustomEvent('tka_fantasy_gacha_reward', {
          detail: { character: wonAvatar },
        })
      );
    }, 600);
  }

  return wonAvatar;
};

/**
 * Menyimpan karakter avatar aktif yang dipilih oleh pengguna
 * @param {string} avatarId
 */
export const setActiveAvatar = (avatarId) => {
  const data = getActivityData();
  const unlocked = data.unlockedAvatars || ['baby-boy', 'baby-girl'];

  // Pastikan hanya karakter yang sudah terbuka yang bisa dipasang
  if (!unlocked.includes(avatarId)) {
    return false;
  }

  data.avatar = avatarId;
  saveActivityData(data, true);
  notifyProfileUpdate();
  return true;
};

export const markMateriComplete = (babId, stars = 3) => {
  const data = getActivityData();
  if (!data.materiCompleted) data.materiCompleted = [];
  if (!data.materiStars) data.materiStars = {};
  if (!data.materiBestExp) data.materiBestExp = {};

  const isFirstTime = !data.materiCompleted.includes(babId);
  const clampedStars = Math.max(0, Math.min(3, Math.floor(Number(stars) || 0)));

  // Rekor bintang & EXP terbaik sebelumnya (mencegah spam EXP saat ulang materi dengan bintang sama/lebih rendah)
  const prevStars =
    data.materiStars[babId] !== undefined
      ? Number(data.materiStars[babId]) || 0
      : !isFirstTime
      ? 3
      : 0;
  const prevBestExp = Math.max(
    Number(data.materiBestExp[babId]) || 0,
    getMateriExpForStars(prevStars)
  );

  const newBestStars = Math.max(prevStars, clampedStars);
  const targetExp = getMateriExpForStars(clampedStars);
  const newBestExp = Math.max(prevBestExp, targetExp);
  const expEarned = Math.max(0, newBestExp - prevBestExp);

  if (clampedStars >= 1 && isFirstTime) {
    data.materiCompleted.push(babId);
  }
  if (!data.unlockedMateri) data.unlockedMateri = ['mtk_1', 'bi_1'];
  if (!data.unlockedMateri.includes(babId)) {
    data.unlockedMateri.push(babId);
  }

  if (clampedStars >= 1) {
    data.materiStars[babId] = newBestStars;
    data.materiBestExp[babId] = newBestExp;
  }

  checkAndUnlockTitles(data);
  checkAndUnlockAvatars(data);
  saveActivityData(data);

  // EXP diberikan sesuai bintang yang baru dicapai (selisih terhadap rekor terbaik sebelumnya)
  if (expEarned > 0) {
    recordUserActivity('materi', expEarned);
  } else {
    notifyProfileUpdate();
  }

  return {
    isFirstTime,
    isStarImproved: !isFirstTime && newBestStars > prevStars,
    prevStars,
    earnedStars: clampedStars,
    newStars: newBestStars,
    expEarned,
    totalItemExp: newBestExp,
    maxExp: EXP_CONFIG.MATERI_MAX_EXP,
  };
};

export const unlockLatihan = (latihanId) => {
  if (isGuestSession() && latihanId !== 'mtk_lat_1' && latihanId !== 'bi_lat_1') {
    return;
  }
  const data = getActivityData();
  if (!data.unlockedLatihan) data.unlockedLatihan = ['mtk_lat_1', 'bi_lat_1'];
  if (!data.unlockedLatihan.includes(latihanId)) {
    data.unlockedLatihan.push(latihanId);
    saveActivityData(data);
  }
};

export const markLatihanComplete = (latihanId, stars = 3, awardExp = true) => {
  const data = getActivityData();
  if (!data.latihanCompleted) data.latihanCompleted = [];
  if (!data.latihanStars) data.latihanStars = {};
  if (!data.latihanBestExp) data.latihanBestExp = {};

  const isFirstTime = !data.latihanCompleted.includes(latihanId);
  const clampedStars = Math.max(0, Math.min(3, Math.floor(Number(stars) || 0)));

  // Rekor bintang & EXP terbaik sebelumnya (anti-spam, namun naik bintang tetap mendapat selisih EXP)
  const prevStars =
    data.latihanStars[latihanId] !== undefined
      ? Number(data.latihanStars[latihanId]) || 0
      : !isFirstTime
      ? 3
      : 0;
  const prevBestExp = Math.max(
    Number(data.latihanBestExp[latihanId]) || 0,
    getLatihanExpForStars(prevStars)
  );

  const newBestStars = Math.max(prevStars, clampedStars);
  const targetExp = getLatihanExpForStars(clampedStars);
  const newBestExp = Math.max(prevBestExp, targetExp);
  const expEarned = awardExp ? Math.max(0, newBestExp - prevBestExp) : 0;

  if (clampedStars >= 1 && isFirstTime) {
    data.latihanCompleted.push(latihanId);
  }
  if (!data.unlockedLatihan) data.unlockedLatihan = ['mtk_lat_1', 'bi_lat_1'];
  if (!data.unlockedLatihan.includes(latihanId)) {
    data.unlockedLatihan.push(latihanId);
  }

  if (clampedStars >= 1) {
    data.latihanStars[latihanId] = newBestStars;
    data.latihanBestExp[latihanId] = newBestExp;
  }

  checkAndUnlockTitles(data);
  checkAndUnlockAvatars(data);
  saveActivityData(data);

  if (expEarned > 0) {
    recordUserActivity('latihan', expEarned);
  } else {
    notifyProfileUpdate();
  }

  return {
    isFirstTime,
    isStarImproved: !isFirstTime && newBestStars > prevStars,
    prevStars,
    earnedStars: clampedStars,
    newStars: newBestStars,
    expEarned,
    totalItemExp: newBestExp,
    maxExp: EXP_CONFIG.LATIHAN_MAX_EXP,
  };
};

export const resetLatihanProgress = (subject = null) => {
  const data = getActivityData();
  if (!data.latihanStars) data.latihanStars = {};
  if (!subject) {
    data.latihanCompleted = [];
    data.unlockedLatihan = ['mtk_lat_1', 'bi_lat_1'];
    data.latihanStars = {};
  } else {
    const prefix =
      subject === 'matematika'
        ? 'mtk_lat_'
        : subject === 'bahasa_indonesia'
        ? 'bi_lat_'
        : `${subject}_lat_`;
    const firstId = `${prefix}1`;
    data.latihanCompleted = (data.latihanCompleted || []).filter(
      (id) => !id.startsWith(prefix)
    );
    data.unlockedLatihan = (data.unlockedLatihan || []).filter(
      (id) => !id.startsWith(prefix)
    );
    data.unlockedLatihan.push(firstId);
    Object.keys(data.latihanStars).forEach((key) => {
      if (key.startsWith(prefix)) delete data.latihanStars[key];
    });
  }
  saveActivityData(data);
  return data;
};

export const recordLatihan = ({
  subject,
  level,
  score,
  correct,
  total,
  isCompletedAll = false,
  expEarned = 0,
  awardExp = true,
}) => {
  const data = getActivityData();
  const finalExp = awardExp
    ? isCompletedAll
      ? Math.max(0, Number(expEarned) || 0)
      : 0
    : Math.max(0, Number(expEarned) || 0);
  const newRecord = {
    id: `lat_${Date.now()}`,
    subject,
    level,
    score,
    correct,
    total,
    isCompletedAll,
    expEarned: finalExp,
    date: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }),
  };
  data.latihanHistory.unshift(newRecord);
  checkAndUnlockTitles(data);
  saveActivityData(data);

  // EXP hanya diberikan jika awardExp true dan user menyelesaikan semua soal latihan
  if (awardExp && isCompletedAll && finalExp > 0) {
    recordUserActivity('latihan', finalExp);
  }

  return newRecord;
};

export const recordTryout = ({
  subject,
  packageNum,
  score,
  correct,
  total,
  userAnswers = {},
  isCompletedAll = false,
}) => {
  const data = getActivityData();
  if (!data.tryoutBestExp) data.tryoutBestExp = {};
  if (!data.tryoutBestScore) data.tryoutBestScore = {};

  const tryoutKey = `${subject}_${packageNum}`;
  const effectiveScore =
    typeof total === 'number' && total > 0 && correct === total ? 100 : Number(score) || 0;
  const tierInfo = getTryoutExpInfo(effectiveScore, correct, total);

  // Cari rekor terbaik sebelumnya dari tryoutBestExp atau fallback riwayat lama (anti-spam)
  const legacySamePkg = (data.tryoutHistory || []).filter(
    (h) =>
      h.subject === subject &&
      String(h.packageNum) === String(packageNum) &&
      h.isCompletedAll !== false
  );
  const legacyBestScore = legacySamePkg.reduce(
    (max, h) => Math.max(max, Number(h.score) || 0),
    0
  );
  const prevBestScore = Math.max(
    Number(data.tryoutBestScore[tryoutKey]) || 0,
    legacyBestScore
  );
  const prevBestExp =
    data.tryoutBestExp[tryoutKey] !== undefined
      ? Number(data.tryoutBestExp[tryoutKey]) || 0
      : getTryoutExpInfo(legacyBestScore).exp;

  const targetExp = isCompletedAll ? tierInfo.exp : 0;
  const newBestExp = isCompletedAll ? Math.max(prevBestExp, targetExp) : prevBestExp;
  const finalExp = isCompletedAll ? Math.max(0, newBestExp - prevBestExp) : 0;

  if (isCompletedAll) {
    data.tryoutBestExp[tryoutKey] = newBestExp;
    data.tryoutBestScore[tryoutKey] = Math.max(prevBestScore, effectiveScore);
  }

  const newRecord = {
    id: `to_${Date.now()}`,
    subject,
    packageNum,
    score: effectiveScore,
    correct,
    total,
    userAnswers,
    isCompletedAll,
    expEarned: finalExp,
    tier: tierInfo.tier,
    date: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }),
  };
  data.tryoutHistory.unshift(newRecord);
  checkAndUnlockTitles(data);
  saveActivityData(data);

  // EXP hanya diberikan jika user menjawab semua soal dan melampaui rekor tier EXP sebelumnya
  if (isCompletedAll && finalExp > 0) {
    recordUserActivity('tryout', finalExp);
  } else {
    notifyProfileUpdate();
  }

  // SISTEM GACHA KATEGORI FANTASI: Didapat jika Tryout selesai dan nilai min. 80% benar
  // Baca ulang data terbaru agar tidak menimpa EXP, streak, atau gelar yang baru disimpan recordUserActivity
  const latestData = getActivityData();
  let fantasyReward = null;
  const percentScore = total > 0 ? (correct / total) * 100 : effectiveScore;
  if (isCompletedAll && (effectiveScore >= 80 || percentScore >= 80)) {
    fantasyReward = rollFantasyGacha(latestData);
  }

  checkAndUnlockAvatars(latestData);

  return {
    ...newRecord,
    expEarned: finalExp,
    prevBestExp,
    prevBestScore,
    newBestExp,
    maxTryoutExp: EXP_CONFIG.TRYOUT_TIERS.PERFECT_EXP,
    tierInfo,
    fantasyReward,
  };
};

/**
 * Menghitung rekapitulasi statistik komprehensif untuk Rapor
 */
export const getFullStats = () => {
  const data = getActivityData();

  // 1. Statistik Materi
  const totalMateriTersedia = 33; // 12 Level MTK + 21 Level BI
  const materiSelesai = Math.min(totalMateriTersedia, (data.materiCompleted || []).length);
  const persenMateri = Math.min(100, Math.round((materiSelesai / totalMateriTersedia) * 100));

  let totalBintangMateri = 0;
  if (data.materiStars) {
    Object.values(data.materiStars).forEach((s) => {
      totalBintangMateri += Number(s) || 0;
    });
  }
  // Tambahkan fallback bintang jika materiCompleted ada tapi materiStars belum tercatat
  (data.materiCompleted || []).forEach((id) => {
    if (!data.materiStars || !data.materiStars[id]) {
      totalBintangMateri += 3;
    }
  });
  const maxBintangMateri = totalMateriTersedia * 3;

  // 2. Statistik Latihan
  const totalLatihanTersedia = 20; // 10 Level MTK + 10 Level BI
  const latihanSelesai = Math.min(totalLatihanTersedia, (data.latihanCompleted || []).length);
  const persenLatihan = Math.min(100, Math.round((latihanSelesai / totalLatihanTersedia) * 100));

  let totalBintangLatihan = 0;
  if (data.latihanStars) {
    Object.values(data.latihanStars).forEach((s) => {
      totalBintangLatihan += Number(s) || 0;
    });
  }
  // Fallback bintang jika latihanCompleted ada tapi latihanStars belum tercatat
  (data.latihanCompleted || []).forEach((id) => {
    if (!data.latihanStars || !data.latihanStars[id]) {
      totalBintangLatihan += 3;
    }
  });
  const maxBintangLatihan = totalLatihanTersedia * 3;

  const totalLatihan = data.latihanHistory.length;
  let totalSoalDijawab = 0;
  let totalSoalBenar = 0;
  data.latihanHistory.forEach((item) => {
    totalSoalDijawab += item.total || 0;
    totalSoalBenar += item.correct || 0;
  });
  const akurasiLatihan =
    totalSoalDijawab > 0 ? Math.round((totalSoalBenar / totalSoalDijawab) * 100) : 0;

  // 3. Statistik Tryout (Keseluruhan & Terpisah per Mata Pelajaran)
  const totalTryout = data.tryoutHistory.length;
  const rataRataTryout =
    totalTryout > 0
      ? (data.tryoutHistory.reduce((acc, curr) => acc + (curr.score || 0), 0) / totalTryout).toFixed(1)
      : '0.0';

  // Rata-rata & Paket Selesai: Bahasa Indonesia (5 Paket Tersedia)
  const tryoutHistoryBI = data.tryoutHistory.filter((t) => t.subject === 'bahasa_indonesia');
  const totalTryoutBI = tryoutHistoryBI.length;
  const uniquePaketBI = new Set(tryoutHistoryBI.map((t) => t.packageNum)).size;
  const paketTryoutSelesaiBI = Math.min(5, uniquePaketBI);
  const totalPaketBITersedia = 5;
  const rataRataTryoutBI =
    totalTryoutBI > 0
      ? (tryoutHistoryBI.reduce((acc, curr) => acc + (curr.score || 0), 0) / totalTryoutBI).toFixed(1)
      : '0.0';

  // Rata-rata & Paket Selesai: Matematika (5 Paket Tersedia)
  const tryoutHistoryMTK = data.tryoutHistory.filter((t) => t.subject === 'matematika');
  const totalTryoutMTK = tryoutHistoryMTK.length;
  const uniquePaketMTK = new Set(tryoutHistoryMTK.map((t) => t.packageNum)).size;
  const paketTryoutSelesaiMTK = Math.min(5, uniquePaketMTK);
  const totalPaketMTKTersedia = 5;
  const rataRataTryoutMTK =
    totalTryoutMTK > 0
      ? (tryoutHistoryMTK.reduce((acc, curr) => acc + (curr.score || 0), 0) / totalTryoutMTK).toFixed(1)
      : '0.0';

  // Total Paket Tryout Selesai Gabungan
  const totalPaketTryoutTersedia = 10; // 5 Paket BI + 5 Paket MTK
  const totalPaketTryoutSelesai = paketTryoutSelesaiBI + paketTryoutSelesaiMTK;
  const persenTryout = Math.min(
    100,
    Math.round((totalPaketTryoutSelesai / totalPaketTryoutTersedia) * 100)
  );

  // 4. Penguasaan Topik Materi (%) Dinamis Tersinkronisasi
  const topicMastery = calculateTopicMastery(data);

  return {
    materiSelesai,
    totalMateriTersedia,
    persenMateri,
    totalBintangMateri,
    maxBintangMateri,
    latihanSelesai,
    totalLatihanTersedia,
    persenLatihan,
    totalBintangLatihan,
    maxBintangLatihan,
    totalLatihan,
    totalSoalDijawab,
    totalSoalBenar,
    akurasiLatihan,
    totalTryout,
    rataRataTryout,
    totalTryoutBI,
    rataRataTryoutBI,
    totalTryoutMTK,
    rataRataTryoutMTK,
    paketTryoutSelesaiBI,
    totalPaketBITersedia,
    paketTryoutSelesaiMTK,
    totalPaketMTKTersedia,
    totalPaketTryoutSelesai,
    totalPaketTryoutTersedia,
    persenTryout,
    tryoutStats: {
      total: totalTryout,
      rataRata: rataRataTryout,
      bi: {
        total: totalTryoutBI,
        paketSelesai: paketTryoutSelesaiBI,
        totalPaket: totalPaketBITersedia,
        rataRata: rataRataTryoutBI,
      },
      mtk: {
        total: totalTryoutMTK,
        paketSelesai: paketTryoutSelesaiMTK,
        totalPaket: totalPaketMTKTersedia,
        rataRata: rataRataTryoutMTK,
      },
    },
    latihanHistory: data.latihanHistory,
    tryoutHistory: data.tryoutHistory,
    kompetensi: topicMastery.kompetensi,
    rekomendasi: topicMastery.rekomendasi,
  };
};

/**
 * Definisi Topik Belajar Utama
 * 3 Topik Bahasa Indonesia & 3 Topik Matematika
 */
export const TOPIC_DEFINITIONS = [
  {
    id: 'bi_tekstual',
    nama: 'Pemahaman Tekstual',
    mapel: 'Bahasa Indonesia',
    subjectKey: 'bahasa_indonesia',
    deskripsi: 'Ejaan, Tanda Baca, Kata Berimbuhan, Frasa, dan Makna Kata',
    materiBabs: ['bi_1', 'bi_2', 'bi_3', 'bi_4', 'bi_5', 'bi_6', 'bi_7', 'bi_8', 'bi_9', 'bi_10'],
    latihanLevels: [1, 2, 3, 4],
    latihanIds: ['bi_lat_1', 'bi_lat_2', 'bi_lat_3', 'bi_lat_4'],
  },
  {
    id: 'bi_inferensial',
    nama: 'Pemahaman Inferensial',
    mapel: 'Bahasa Indonesia',
    subjectKey: 'bahasa_indonesia',
    deskripsi: 'Informasi Tersurat/Tersirat, Ide Pokok, Menarik Kesimpulan, dan Analisis Hubungan Teks',
    materiBabs: ['bi_16', 'bi_17', 'bi_18', 'bi_19', 'bi_20', 'bi_21'],
    latihanLevels: [8, 9, 10],
    latihanIds: ['bi_lat_8', 'bi_lat_9', 'bi_lat_10'],
  },
  {
    id: 'bi_sastra',
    nama: 'Evaluasi & Apresiasi',
    mapel: 'Bahasa Indonesia',
    subjectKey: 'bahasa_indonesia',
    deskripsi: 'Menyimak, Menulis, Puisi, Prosa, Respon Teks Fiksi, dan Nilai Sastra',
    materiBabs: ['bi_11', 'bi_12', 'bi_13', 'bi_14', 'bi_15'],
    latihanLevels: [5, 6, 7],
    latihanIds: ['bi_lat_5', 'bi_lat_6', 'bi_lat_7'],
  },
  {
    id: 'mtk_bilangan',
    nama: 'Bilangan',
    mapel: 'Matematika',
    subjectKey: 'matematika',
    deskripsi: 'Operasi Hitung Bilangan, Perbandingan & Skala, KPK/FPB, dan Bilangan Pangkat',
    materiBabs: ['mtk_1', 'mtk_2', 'mtk_3', 'mtk_4'],
    latihanLevels: [1, 2, 3, 4],
    latihanIds: ['mtk_lat_1', 'mtk_lat_2', 'mtk_lat_3', 'mtk_lat_4'],
  },
  {
    id: 'mtk_geometri',
    nama: 'Geometri & Pengukuran',
    mapel: 'Matematika',
    subjectKey: 'matematika',
    deskripsi: 'Pengukuran, Jarak & Kecepatan, Bangun Datar, Bangun Ruang, Sudut, dan Penaksiran',
    materiBabs: ['mtk_5', 'mtk_6', 'mtk_7', 'mtk_8', 'mtk_11', 'mtk_12'],
    latihanLevels: [5, 6, 7, 8],
    latihanIds: ['mtk_lat_5', 'mtk_lat_6', 'mtk_lat_7', 'mtk_lat_8'],
  },
  {
    id: 'mtk_data',
    nama: 'Pengolahan Data',
    mapel: 'Matematika',
    subjectKey: 'matematika',
    deskripsi: 'Koordinat Kartesius, Pengelolaan Data, Tabel, Diagram, dan Statistika Dasar',
    materiBabs: ['mtk_9', 'mtk_10'],
    latihanLevels: [9, 10],
    latihanIds: ['mtk_lat_9', 'mtk_lat_10'],
  },
];

/**
 * Menghitung tingkat penguasaan 6 topik belajar secara dinamis
 * berdasarkan sinkronisasi kemajuan Materi, Latihan Soal, dan Tryout
 */
export const calculateTopicMastery = (data = {}) => {
  const materiCompleted = data.materiCompleted || [];
  const materiStars = data.materiStars || {};
  const latihanCompleted = data.latihanCompleted || [];
  const latihanStars = data.latihanStars || {};
  const latihanHistory = data.latihanHistory || [];
  const tryoutHistory = data.tryoutHistory || [];

  const topics = TOPIC_DEFINITIONS.map((topic) => {
    // 1. Pilar Materi (Teori & Konsep)
    const completedBabs = topic.materiBabs.filter((b) => materiCompleted.includes(b));
    const materiCount = completedBabs.length;
    const materiTotal = topic.materiBabs.length;
    let skorMateri = null;

    if (materiCount > 0) {
      let totalStars = 0;
      completedBabs.forEach((b) => {
        totalStars += materiStars[b] ? Number(materiStars[b]) : 3;
      });
      const avgStars = totalStars / materiCount;
      const starQuality = Math.min(1, Math.max(0.65, avgStars / 3));
      skorMateri = Math.min(100, Math.round((materiCount / materiTotal) * starQuality * 100));
    }

    // 2. Pilar Latihan (Drill & Pemecahan Soal)
    const completedLevels = topic.latihanIds.filter((id) => latihanCompleted.includes(id));
    const latihanCount = completedLevels.length;
    const latihanTotal = topic.latihanLevels.length;
    const topicHistory = latihanHistory.filter((h) => {
      if (h.subject !== topic.subjectKey) return false;
      const lvlNum =
        typeof h.level === 'number'
          ? h.level
          : parseInt(String(h.level).replace(/\D/g, ''), 10) || 0;
      return topic.latihanLevels.includes(lvlNum);
    });

    let skorLatihan = null;
    if (latihanCount > 0 || topicHistory.length > 0) {
      let scoreAcc = 0;
      if (topicHistory.length > 0) {
        scoreAcc =
          topicHistory.reduce((acc, h) => acc + (h.score || 0), 0) / topicHistory.length;
      } else {
        let starsTotal = 0;
        completedLevels.forEach((id) => {
          starsTotal += latihanStars[id] ? Number(latihanStars[id]) : 3;
        });
        const avgS = starsTotal / (latihanCount || 1);
        scoreAcc = avgS === 3 ? 100 : avgS === 2 ? 80 : 65;
      }
      const completionRatio = latihanCount / latihanTotal;
      skorLatihan = Math.min(100, Math.round(scoreAcc * 0.6 + completionRatio * 100 * 0.4));
    }

    // 3. Pilar Tryout (Simulasi Ujian Komprehensif)
    const subjectTryouts = tryoutHistory.filter((t) => t.subject === topic.subjectKey);
    let skorTryout = null;
    if (subjectTryouts.length > 0) {
      const avgTo =
        subjectTryouts.reduce((acc, t) => acc + (t.score || 0), 0) / subjectTryouts.length;
      skorTryout = Math.min(100, Math.round(avgTo));
    }

    // 4. Agregasi Terbobot Sinkron
    let nilai = 0;
    if (skorTryout === null) {
      if (skorMateri === null && skorLatihan === null) {
        nilai = 0;
      } else if (skorMateri !== null && skorLatihan === null) {
        nilai = Math.round(skorMateri * 0.8);
      } else if (skorMateri === null && skorLatihan !== null) {
        nilai = Math.round(skorLatihan * 0.85);
      } else {
        nilai = Math.round(skorMateri * 0.45 + skorLatihan * 0.55);
      }
    } else {
      if (skorMateri === null && skorLatihan === null) {
        nilai = Math.round(skorTryout * 0.3); // Tryout saja tanpa materi/drill topik
      } else if (skorMateri !== null && skorLatihan === null) {
        nilai = Math.round(skorMateri * 0.5 + skorTryout * 0.35);
      } else if (skorMateri === null && skorLatihan !== null) {
        nilai = Math.round(skorLatihan * 0.6 + skorTryout * 0.35);
      } else {
        nilai = Math.round(skorMateri * 0.35 + skorLatihan * 0.4 + skorTryout * 0.25);
      }
    }

    nilai = Math.max(0, Math.min(100, nilai));

    let status = 'Belum Dimulai';
    if (nilai >= 85) status = 'Sangat Mahir';
    else if (nilai >= 70) status = 'Mahir';
    else if (nilai >= 50) status = 'Cukup Mahir';
    else if (nilai > 0) status = 'Perlu Latihan';

    let summary = 'Belum ada aktivitas';
    if (nilai > 0) {
      const parts = [];
      if (materiCount > 0) parts.push(`Materi ${materiCount}/${materiTotal}`);
      if (latihanCount > 0) parts.push(`Latihan ${latihanCount}/${latihanTotal}`);
      if (skorTryout !== null) parts.push(`TO ${skorTryout}%`);
      summary = parts.length > 0 ? parts.join(' • ') : `Skor ${nilai}%`;
    }

    return {
      id: topic.id,
      nama: topic.nama,
      mapel: topic.mapel,
      nilai,
      status,
      deskripsi: topic.deskripsi,
      detail: {
        materiSelesai: materiCount,
        totalMateri: materiTotal,
        latihanSelesai: latihanCount,
        totalLatihan: latihanTotal,
        skorMateri,
        skorLatihan,
        skorTryout,
        summary,
      },
    };
  });

  // 5. Rekomendasi Belajar Dinamis
  const activeTopics = topics.filter((t) => t.nilai > 0);
  let kuat = 'Belum ada catatan';
  let lemah = 'Yuk mulai dari materi dasar dulu';
  let saranAksi =
    'Coba buka materi pertama atau kerjakan latihan soal ringan supaya perkembangan belajarmu mulai tercatat.';

  if (activeTopics.length > 0) {
    const sortedDesc = [...topics].sort((a, b) => b.nilai - a.nilai);
    const sortedAsc = [...topics].sort((a, b) => a.nilai - b.nilai);

    const bestTopics = sortedDesc.filter((t) => t.nilai >= 70);
    if (bestTopics.length >= 2) {
      kuat = `${bestTopics[0].nama} & ${bestTopics[1].nama}`;
    } else if (bestTopics.length === 1) {
      kuat = `${bestTopics[0].nama} (${bestTopics[0].nilai}%)`;
    } else {
      kuat = `${sortedDesc[0].nama} (${sortedDesc[0].nilai}%)`;
    }

    const weakCandidates = sortedAsc.filter((t) => t.nilai < 70);
    if (weakCandidates.length >= 2) {
      lemah = `${weakCandidates[0].nama} & ${weakCandidates[1].nama}`;
    } else if (weakCandidates.length === 1) {
      lemah = weakCandidates[0].nama;
    } else {
      lemah = 'Semua topik sudah bagus, tinggal dijaga!';
    }

    const targetLemah = sortedAsc[0];
    if (targetLemah && targetLemah.nilai === 0) {
      saranAksi = `Selanjutnya coba pelajari topik ${targetLemah.nama} (${targetLemah.mapel}) supaya nilaimu makin merata.`;
    } else if (targetLemah && targetLemah.nilai < 70) {
      saranAksi = `Boleh diulang lagi materi dan latihan soal di topik ${targetLemah.nama} biar makin lancar ya.`;
    } else {
      saranAksi =
        'Keren! Semua topik sudah kamu kuasai dengan baik. Tetap latihan rutin lewat paket tryout supaya makin mantap.';
    }
  }

  return { kompetensi: topics, rekomendasi: { kuat, lemah, saranAksi } };
};
