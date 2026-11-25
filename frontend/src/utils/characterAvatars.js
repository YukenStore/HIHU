import alienGif from '../assets/character/alien.gif';
import babyBoyGif from '../assets/character/baby-boy.gif';
import babyDragonGif from '../assets/character/baby-dragon.gif';
import babyGirlGif from '../assets/character/baby-girl.gif';
import boyGif from '../assets/character/boy.gif';
import childBoyGif from '../assets/character/child-boy.gif';
import childGirlGif from '../assets/character/child-girl.gif';
import cowGif from '../assets/character/cow.gif';
import cowboyGif from '../assets/character/cowboy.gif';
import dragonGif from '../assets/character/dragon.gif';
import foxGif from '../assets/character/fox.gif';
import frogGif from '../assets/character/frog.gif';
import girlGif from '../assets/character/girl.gif';
import kingGif from '../assets/character/king.gif';
import knightGif from '../assets/character/knight.gif';
import mermaidGif from '../assets/character/mermaid.gif';
import ninjaGif from '../assets/character/ninja.gif';
import pandaGif from '../assets/character/panda.gif';
import queenGif from '../assets/character/queen.gif';
import redWolfGif from '../assets/character/red-wolf.gif';
import sheepGif from '../assets/character/sheep.gif';
import teddyBearHeartGif from '../assets/character/teddy-bear-heart.gif';
import unicornGif from '../assets/character/unicorn.gif';

/**
 * Registri Karakter Avatar TKA SD
 * Dilengkapi informasi paket hadiah materi/latihan dan kategori Fantasi (Gacha Tryout min. 80%)
 */
export const CHARACTER_AVATARS = [
  // 1. STARTER: Terbuka otomatis sejak awal (Hanya 2 karakter ini)
  {
    id: 'baby-boy',
    name: 'Bayi Cowo',
    category: 'Siswa',
    image: babyBoyGif,
    isStarter: true,
    rewardSource: 'Karakter Awal',
    requirement: 'Langsung terbuka untuk semua pengguna (Bawaan)',
  },
  {
    id: 'baby-girl',
    name: 'Bayi Cewe',
    category: 'Siswa',
    image: babyGirlGif,
    isStarter: true,
    rewardSource: 'Karakter Awal',
    requirement: 'Langsung terbuka untuk semua pengguna',
  },

  // 2. PAKET HADIAH 1: Bocil Cowo & Bocil Cewe (Peti Materi 5 Bahasa Indonesia)
  {
    id: 'boy',
    name: 'Bocil Cowo',
    category: 'Siswa',
    image: boyGif,
    bundleId: 'bundle_siswa_siswi',
    bundleName: 'Paket Bocil Cowo & Cewe',
    rewardSource: 'Peti Materi 5 B. Indo',
    requirement: 'Buka Peti Materi 5 Bahasa Indonesia (Bocil Cowo & Bocil Cewe)',
  },
  {
    id: 'girl',
    name: 'Bocil Cewe',
    category: 'Siswa',
    image: girlGif,
    bundleId: 'bundle_siswa_siswi',
    bundleName: 'Paket Bocil Cowo & Cewe',
    rewardSource: 'Peti Materi 5 B. Indo',
    requirement: 'Buka Peti Materi 5 Bahasa Indonesia (Bocil Cowo & Bocil Cewe)',
  },

  // 3. PAKET HADIAH 2: Anak Cowo & Anak Cewe (Peti Materi 4 Matematika)
  {
    id: 'child-boy',
    name: 'Anak Cowo',
    category: 'Siswa',
    image: childBoyGif,
    bundleId: 'bundle_petualang_ceria',
    bundleName: 'Paket Anak Cowo & Cewe',
    rewardSource: 'Peti Materi 4 Matematika',
    requirement: 'Buka Peti Materi 4 Matematika (Anak Cowo & Anak Cewe)',
  },
  {
    id: 'child-girl',
    name: 'Anak Cewe',
    category: 'Siswa',
    image: childGirlGif,
    bundleId: 'bundle_petualang_ceria',
    bundleName: 'Paket Anak Cowo & Cewe',
    rewardSource: 'Peti Materi 4 Matematika',
    requirement: 'Buka Peti Materi 4 Matematika (Anak Cowo & Anak Cewe)',
  },

  // 4. KATEGORI PAHLAWAN (Peti & Piala Materi / Latihan Soal Matematika)
  {
    id: 'knight',
    name: 'Ksatria',
    category: 'Pahlawan',
    image: knightGif,
    rewardSource: 'Piala Puncak Materi 12 MTK',
    requirement: 'Raih Piala Puncak Materi Matematika (kumpulkan semua 36 bintang)',
  },
  {
    id: 'ninja',
    name: 'Ninja',
    category: 'Pahlawan',
    image: ninjaGif,
    rewardSource: 'Piala Puncak Latihan 10 B. Indo',
    requirement: 'Raih Piala Puncak Latihan Bahasa Indonesia (kumpulkan semua 30 bintang)',
  },
  {
    id: 'cowboy',
    name: 'Koboi',
    category: 'Pahlawan',
    image: cowboyGif,
    rewardSource: 'Piala Puncak Latihan 10 MTK',
    requirement: 'Raih Piala Puncak Latihan Matematika (kumpulkan semua 30 bintang)',
  },

  // 5. PAKET HADIAH 3: Raja & Ratu (Piala Puncak Materi 21 Bahasa Indonesia)
  {
    id: 'king',
    name: 'Raja',
    category: 'Kerajaan',
    image: kingGif,
    bundleId: 'bundle_raja_ratu',
    bundleName: 'Paket Raja & Ratu',
    rewardSource: 'Piala Puncak Materi 21 B. Indo',
    requirement: 'Raih Piala Puncak Materi Bahasa Indonesia (kumpulkan semua 63 bintang)',
  },
  {
    id: 'queen',
    name: 'Ratu',
    category: 'Kerajaan',
    image: queenGif,
    bundleId: 'bundle_raja_ratu',
    bundleName: 'Paket Raja & Ratu',
    rewardSource: 'Piala Puncak Materi 21 B. Indo',
    requirement: 'Raih Piala Puncak Materi Bahasa Indonesia (kumpulkan semua 63 bintang)',
  },

  // 6. KATEGORI HEWAN (Peti & Piala Materi/Latihan B. Indo & Matematika)
  {
    id: 'fox',
    name: 'Rubah',
    category: 'Hewan',
    image: foxGif,
    rewardSource: 'Peti Materi 10 B. Indo',
    requirement: 'Buka Peti Materi 10 Bahasa Indonesia',
  },
  {
    id: 'red-wolf',
    name: 'Serigala',
    category: 'Hewan',
    image: redWolfGif,
    rewardSource: 'Peti Materi 15 B. Indo',
    requirement: 'Buka Peti Materi 15 Bahasa Indonesia',
  },
  {
    id: 'sheep',
    name: 'Domba',
    category: 'Hewan',
    image: sheepGif,
    rewardSource: 'Peti Materi 8 Matematika',
    requirement: 'Buka Peti Materi 8 Matematika',
  },
  {
    id: 'frog',
    name: 'Katak',
    category: 'Hewan',
    image: frogGif,
    rewardSource: 'Peti Latihan 4 Matematika',
    requirement: 'Buka Peti Latihan 4 Matematika',
  },
  {
    id: 'cow',
    name: 'Sapi',
    category: 'Hewan',
    image: cowGif,
    rewardSource: 'Peti Latihan 4 B. Indo',
    requirement: 'Buka Peti Latihan 4 Bahasa Indonesia',
  },
  {
    id: 'teddy-bear-heart',
    name: 'Beruang',
    category: 'Hewan',
    image: teddyBearHeartGif,
    rewardSource: 'Peti Latihan 7 B. Indo',
    requirement: 'Buka Peti Latihan 7 Bahasa Indonesia',
  },
  {
    id: 'panda',
    name: 'Panda',
    category: 'Hewan',
    image: pandaGif,
    rewardSource: 'Peti Latihan 7 Matematika',
    requirement: 'Buka Peti Latihan 7 Matematika',
  },

  // 7. KATEGORI FANTASI (SPESIAL GACHA TRYOUT MINIMAL 80% BENAR)
  {
    id: 'dragon',
    name: 'Naga',
    category: 'Fantasi',
    image: dragonGif,
    isGachaFantasy: true,
    rewardSource: 'Gacha Tryout (>= 80%)',
    requirement: 'Hadiah gacha acak dari Tryout Matematika atau B. Indonesia (nilai minimal 80%)',
  },
  {
    id: 'baby-dragon',
    name: 'Bayi Naga',
    category: 'Fantasi',
    image: babyDragonGif,
    isGachaFantasy: true,
    rewardSource: 'Gacha Tryout (>= 80%)',
    requirement: 'Hadiah gacha acak dari Tryout Matematika atau B. Indonesia (nilai minimal 80%)',
  },
  {
    id: 'unicorn',
    name: 'Unicorn',
    category: 'Fantasi',
    image: unicornGif,
    isGachaFantasy: true,
    rewardSource: 'Gacha Tryout (>= 80%)',
    requirement: 'Hadiah gacha acak dari Tryout Matematika atau B. Indonesia (nilai minimal 80%)',
  },
  {
    id: 'mermaid',
    name: 'Putri Duyung',
    category: 'Fantasi',
    image: mermaidGif,
    isGachaFantasy: true,
    rewardSource: 'Gacha Tryout (>= 80%)',
    requirement: 'Hadiah gacha acak dari Tryout Matematika atau B. Indonesia (nilai minimal 80%)',
  },
  {
    id: 'alien',
    name: 'Alien',
    category: 'Fantasi',
    image: alienGif,
    isGachaFantasy: true,
    rewardSource: 'Gacha Tryout (>= 80%)',
    requirement: 'Hadiah gacha acak dari Tryout Matematika atau B. Indonesia (nilai minimal 80%)',
  },
];

export const DEFAULT_AVATAR_ID = 'baby-boy';
export const STARTER_AVATAR_IDS = ['baby-boy', 'baby-girl'];
export const FANTASY_AVATAR_IDS = ['dragon', 'baby-dragon', 'unicorn', 'mermaid', 'alien'];

/**
 * Mengambil data objek karakter avatar berdasarkan id
 * @param {string} id
 */
export const getCharacterAvatar = (id) => {
  if (!id) return CHARACTER_AVATARS[0];
  const found = CHARACTER_AVATARS.find((c) => c.id === id);
  return found || CHARACTER_AVATARS[0];
};
