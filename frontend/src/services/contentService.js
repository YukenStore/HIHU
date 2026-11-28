import api from './api';
import { PUSMENDIK_MATERI } from '../data/pusmendikData';
import { PUSMENDIK_LATIHAN } from '../data/latihanData';
import { PUSMENDIK_TRYOUT } from '../data/tryoutData';

const STORAGE_KEY = 'tka_sd_custom_contents_v1';

// Simpan salinan awal (baseline) dari kode bawaan agar selalu bisa di-reset ke default
const BASE_MATERI = JSON.parse(JSON.stringify(PUSMENDIK_MATERI));
const BASE_LATIHAN = JSON.parse(JSON.stringify(PUSMENDIK_LATIHAN));
const BASE_TRYOUT = JSON.parse(JSON.stringify(PUSMENDIK_TRYOUT));

export const DEFAULT_SUBJECT_KEYS = ['bahasa_indonesia', 'matematika'];

/**
 * Palet tema warna untuk kartu & peta mata pelajaran (Mapel Wajib & Mapel Pilihan)
 */
export const SUBJECT_COLOR_THEMES = {
  emerald: {
    id: 'emerald',
    label: 'Hijau',
    primaryHex: '#047857',
    hoverHex: '#065F46',
    darkHex: '#064E3B',
    softBgHex: '#ECFDF5',
    softBorderHex: '#A7F3D0',
    accentRgba: 'rgba(4, 120, 87, 0.1)',
    scrollbarClass: 'emerald-scrollbar',
  },
  rose: {
    id: 'rose',
    label: 'Merah',
    primaryHex: '#881337',
    hoverHex: '#700D2B',
    darkHex: '#4C0519',
    softBgHex: '#FFF1F2',
    softBorderHex: '#FECDD3',
    accentRgba: 'rgba(136, 19, 55, 0.1)',
    scrollbarClass: 'rose-scrollbar',
  },
  blue: {
    id: 'blue',
    label: 'Biru',
    primaryHex: '#1D4ED8',
    hoverHex: '#1E40AF',
    darkHex: '#1E3A8A',
    softBgHex: '#EFF6FF',
    softBorderHex: '#BFDBFE',
    accentRgba: 'rgba(29, 78, 216, 0.1)',
    scrollbarClass: 'slate-scrollbar',
  },
  purple: {
    id: 'purple',
    label: 'Ungu',
    primaryHex: '#6D28D9',
    hoverHex: '#5B21B6',
    darkHex: '#4C1D95',
    softBgHex: '#F5F3FF',
    softBorderHex: '#DDD6FE',
    accentRgba: 'rgba(109, 40, 217, 0.1)',
    scrollbarClass: 'slate-scrollbar',
  },
  amber: {
    id: 'amber',
    label: 'Oranye',
    primaryHex: '#B45309',
    hoverHex: '#92400E',
    darkHex: '#78350F',
    softBgHex: '#FFFBEB',
    softBorderHex: '#FDE68A',
    accentRgba: 'rgba(180, 83, 9, 0.1)',
    scrollbarClass: 'exam-nav-scrollbar',
  },
  teal: {
    id: 'teal',
    label: 'Merah Muda',
    primaryHex: '#e21393ff',
    hoverHex: '#e21393ff',
    darkHex: '#e21393ff',
    softBgHex: '#F0FDFA',
    softBorderHex: '#99F6E4',
    accentRgba: 'rgba(15, 118, 110, 0.1)',
    scrollbarClass: 'emerald-scrollbar',
  },
};

/**
 * Membersihkan tag [H] atau [horizontal] secara rekursif pada objek data
 */
const stripHorizontalTagsDeep = (val) => {
  if (typeof val === 'string') {
    return val.replace(/\[h(?:orizontal)?\]\s*/gi, '');
  }
  if (Array.isArray(val)) {
    return val.map(stripHorizontalTagsDeep);
  }
  if (val && typeof val === 'object') {
    const cleaned = {};
    for (const [k, v] of Object.entries(val)) {
      cleaned[k] = stripHorizontalTagsDeep(v);
    }
    return cleaned;
  }
  return val;
};

/**
 * Mengambil daftar override dari localStorage
 */
export const getCachedCustomContents = () => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch (_) {
    return [];
  }
};

/**
 * Menyimpan daftar override ke localStorage
 */
const setCachedCustomContents = (items) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch (e) {
    console.warn('Gagal menyimpan cache konten kustom:', e);
  }
};

/**
 * Memastikan struktur objek mapel tersedia di PUSMENDIK_MATERI dan PUSMENDIK_LATIHAN
 */
const ensureSubjectContainer = (subjectKey, meta = {}) => {
  const title =
    meta.title ||
    PUSMENDIK_MATERI[subjectKey]?.title ||
    PUSMENDIK_LATIHAN[subjectKey]?.nama ||
    subjectKey
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase());
  const category =
    meta.category ||
    (DEFAULT_SUBJECT_KEYS.includes(subjectKey) ? 'wajib' : 'pilihan');
  const colorTheme =
    meta.colorTheme ||
    (subjectKey === 'bahasa_indonesia'
      ? 'emerald'
      : subjectKey === 'matematika'
      ? 'rose'
      : 'blue');
  const deskripsi =
    meta.deskripsi ||
    `Kumpulan materi dan latihan soal bertahap untuk mata pelajaran ${title}.`;

  if (!PUSMENDIK_MATERI[subjectKey]) {
    PUSMENDIK_MATERI[subjectKey] = {
      title,
      category,
      colorTheme,
      isCustomSubject: !DEFAULT_SUBJECT_KEYS.includes(subjectKey),
      deskripsi,
      elemen: [
        {
          id: `${subjectKey}_el_1`,
          namaElemen: `Kompetensi ${title}`,
          deskripsi,
          bab: [],
        },
      ],
    };
  } else {
    PUSMENDIK_MATERI[subjectKey].title = title;
    PUSMENDIK_MATERI[subjectKey].category = category;
    PUSMENDIK_MATERI[subjectKey].colorTheme = colorTheme;
    if (meta.deskripsi) {
      PUSMENDIK_MATERI[subjectKey].deskripsi = meta.deskripsi;
    }
  }

  if (!PUSMENDIK_LATIHAN[subjectKey]) {
    PUSMENDIK_LATIHAN[subjectKey] = {
      nama: title,
      category,
      colorTheme,
      isCustomSubject: !DEFAULT_SUBJECT_KEYS.includes(subjectKey),
      deskripsi,
      levels: [],
    };
  } else {
    PUSMENDIK_LATIHAN[subjectKey].nama = title;
    PUSMENDIK_LATIHAN[subjectKey].category = category;
    PUSMENDIK_LATIHAN[subjectKey].colorTheme = colorTheme;
    if (meta.deskripsi) {
      PUSMENDIK_LATIHAN[subjectKey].deskripsi = meta.deskripsi;
    }
  }

  if (!PUSMENDIK_TRYOUT[subjectKey]) {
    PUSMENDIK_TRYOUT[subjectKey] = {
      nama: title,
      deskripsi,
      paket: [],
    };
  } else {
    PUSMENDIK_TRYOUT[subjectKey].nama = title;
    if (meta.deskripsi) {
      PUSMENDIK_TRYOUT[subjectKey].deskripsi = meta.deskripsi;
    }
  }
};

/**
 * Menerapkan daftar kustomisasi (Mapel, Materi, Latihan Soal & Tryout) langsung ke objek data aplikasi
 */
export const applyCustomContentsToData = (items = []) => {
  // 1. Bersihkan mapel kustom yang ada dan kembalikan mapel bawaan ke baseline awal
  Object.keys(PUSMENDIK_MATERI).forEach((k) => {
    if (!BASE_MATERI[k]) {
      delete PUSMENDIK_MATERI[k];
    }
  });
  Object.keys(PUSMENDIK_LATIHAN).forEach((k) => {
    if (!BASE_LATIHAN[k]) {
      delete PUSMENDIK_LATIHAN[k];
    }
  });
  Object.keys(PUSMENDIK_TRYOUT).forEach((k) => {
    if (!BASE_TRYOUT[k]) {
      delete PUSMENDIK_TRYOUT[k];
    }
  });

  DEFAULT_SUBJECT_KEYS.forEach((subj) => {
    if (BASE_MATERI[subj]) {
      PUSMENDIK_MATERI[subj] = JSON.parse(JSON.stringify(BASE_MATERI[subj]));
      PUSMENDIK_MATERI[subj].category = 'wajib';
      PUSMENDIK_MATERI[subj].colorTheme =
        subj === 'bahasa_indonesia' ? 'emerald' : 'rose';
    }
    if (BASE_LATIHAN[subj]) {
      PUSMENDIK_LATIHAN[subj] = JSON.parse(JSON.stringify(BASE_LATIHAN[subj]));
      PUSMENDIK_LATIHAN[subj].category = 'wajib';
      PUSMENDIK_LATIHAN[subj].colorTheme =
        subj === 'bahasa_indonesia' ? 'emerald' : 'rose';
    }
    if (BASE_TRYOUT[subj]) {
      PUSMENDIK_TRYOUT[subj] = JSON.parse(JSON.stringify(BASE_TRYOUT[subj]));
    }
  });

  // 2. Tahap Pertama: Terapkan definisi mata pelajaran kustom (contentType === 'subject')
  const deletedSubjects = new Set();
  items.forEach((rawItem) => {
    const item = stripHorizontalTagsDeep(rawItem);
    if (!item || item.contentType !== 'subject' || !item.subject) return;
    const { subject, action, payload } = item;

    if (action === 'delete') {
      deletedSubjects.add(subject);
      if (!DEFAULT_SUBJECT_KEYS.includes(subject)) {
        delete PUSMENDIK_MATERI[subject];
        delete PUSMENDIK_LATIHAN[subject];
        delete PUSMENDIK_TRYOUT[subject];
      }
    } else if (payload) {
      deletedSubjects.delete(subject);
      ensureSubjectContainer(subject, payload);
    }
  });

  // 3. Tahap Kedua: Terapkan setiap item Materi, Latihan Soal, & Tryout
  items.forEach((rawItem) => {
    const item = stripHorizontalTagsDeep(rawItem);
    if (!item || !item.contentType || !item.subject || !item.itemId) return;
    if (item.contentType === 'subject') return;
    const { contentType, subject, itemId, action, payload } = item;

    if (deletedSubjects.has(subject) && !DEFAULT_SUBJECT_KEYS.includes(subject)) {
      return;
    }

    if (!PUSMENDIK_MATERI[subject] || !PUSMENDIK_LATIHAN[subject] || !PUSMENDIK_TRYOUT[subject]) {
      ensureSubjectContainer(subject);
    }

    if (contentType === 'materi' && PUSMENDIK_MATERI[subject]) {
      const elemenList = PUSMENDIK_MATERI[subject].elemen;
      let found = false;

      for (const el of elemenList) {
        const idx = el.bab.findIndex((b) => String(b.id) === String(itemId));
        if (idx !== -1) {
          found = true;
          if (action === 'delete') {
            el.bab.splice(idx, 1);
          } else if (payload) {
            el.bab[idx] = {
              ...el.bab[idx],
              ...payload,
              id: String(itemId),
            };
          }
          break;
        }
      }

      // Jika belum ditemukan dan aksinya upsert -> materi baru tambahan dari Admin
      if (!found && action !== 'delete' && payload) {
        const targetElemen = elemenList[elemenList.length - 1];
        if (targetElemen) {
          targetElemen.bab.push({
            ...payload,
            id: String(itemId),
          });
        }
      }
    } else if (contentType === 'latihan' && PUSMENDIK_LATIHAN[subject]) {
      const levelsList = PUSMENDIK_LATIHAN[subject].levels;
      const idx = levelsList.findIndex(
        (lvl) =>
          String(lvl.level) === String(itemId) ||
          String(lvl.id) === String(itemId)
      );

      if (idx !== -1) {
        if (action === 'delete') {
          levelsList.splice(idx, 1);
        } else if (payload) {
          const levelNum = Number(payload.level || levelsList[idx].level);
          levelsList[idx] = {
            ...levelsList[idx],
            ...payload,
            level: levelNum,
            targetSoal: Array.isArray(payload.soal)
              ? payload.soal.length
              : payload.targetSoal || levelsList[idx].targetSoal,
          };
        }
      } else if (action !== 'delete' && payload) {
        const levelNum = Number(payload.level || itemId) || levelsList.length + 1;
        levelsList.push({
          ...payload,
          level: levelNum,
          namaLevel: payload.namaLevel || `Level ${levelNum}`,
          targetSoal: Array.isArray(payload.soal)
            ? payload.soal.length
            : Number(payload.targetSoal) || 5,
          soal: Array.isArray(payload.soal) ? payload.soal : [],
        });
      }
    } else if (contentType === 'tryout' && PUSMENDIK_TRYOUT[subject]) {
      const paketList = PUSMENDIK_TRYOUT[subject].paket || [];
      PUSMENDIK_TRYOUT[subject].paket = paketList;
      const idx = paketList.findIndex(
        (pkg) =>
          String(pkg.nomorPaket) === String(itemId) ||
          String(pkg.kode) === String(itemId)
      );

      if (idx !== -1) {
        if (action === 'delete') {
          paketList.splice(idx, 1);
        } else if (payload) {
          const pkgNum = Number(payload.nomorPaket || paketList[idx].nomorPaket);
          paketList[idx] = {
            ...paketList[idx],
            ...payload,
            nomorPaket: pkgNum,
            durasiMenit: Number(payload.durasiMenit) || paketList[idx].durasiMenit || 60,
            totalSoal: Array.isArray(payload.soal)
              ? payload.soal.length
              : payload.totalSoal || paketList[idx].totalSoal,
          };
        }
      } else if (action !== 'delete' && payload) {
        const pkgNum = Number(payload.nomorPaket || itemId) || paketList.length + 1;
        paketList.push({
          ...payload,
          nomorPaket: pkgNum,
          namaPaket: payload.namaPaket || `Paket ${pkgNum}`,
          kode: payload.kode || `TO-${subject.toUpperCase().slice(0, 3)}-${String(pkgNum).padStart(2, '0')}`,
          durasiMenit: Number(payload.durasiMenit) || 60,
          totalSoal: Array.isArray(payload.soal)
            ? payload.soal.length
            : Number(payload.totalSoal) || 0,
          soal: Array.isArray(payload.soal) ? payload.soal : [],
        });
      }
    }
  });

  // 4. Rapikan penomoran urut Materi (no: 1..N), Level Latihan, dan Paket Tryout di semua mapel
  Object.keys(PUSMENDIK_MATERI).forEach((subj) => {
    if (PUSMENDIK_MATERI[subj]?.elemen) {
      let counter = 1;
      PUSMENDIK_MATERI[subj].elemen.forEach((el) => {
        el.bab.forEach((b) => {
          b.no = counter++;
        });
      });
    }
  });

  Object.keys(PUSMENDIK_LATIHAN).forEach((subj) => {
    if (PUSMENDIK_LATIHAN[subj]?.levels) {
      PUSMENDIK_LATIHAN[subj].levels.sort(
        (a, b) => Number(a.level) - Number(b.level)
      );
    }
  });

  Object.keys(PUSMENDIK_TRYOUT).forEach((subj) => {
    if (PUSMENDIK_TRYOUT[subj]?.paket) {
      PUSMENDIK_TRYOUT[subj].paket.sort(
        (a, b) => Number(a.nomorPaket) - Number(b.nomorPaket)
      );
    }
  });

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('tka_content_updated'));
  }
};

// Terapkan cache saat file pertama kali di-import
applyCustomContentsToData(getCachedCustomContents());

/**
 * Sinkronisasi data kustomisasi Materi & Latihan Soal dari server (Cloudflare D1)
 */
export const syncCustomContentFromServer = async () => {
  try {
    const response = await api.get('/content');
    if (response.data?.success && Array.isArray(response.data.data)) {
      setCachedCustomContents(response.data.data);
      applyCustomContentsToData(response.data.data);
      return response.data.data;
    }
  } catch (err) {
    // Tetap gunakan cache localStorage jika sedang offline
    console.warn('Menggunakan cache lokal untuk konten Materi & Latihan:', err.message);
  }
  return getCachedCustomContents();
};

/**
 * Simpan perubahan / penambahan / penghapusan Materi atau Latihan Soal (Khusus Admin)
 */
export const saveAdminContentItem = async ({
  contentType,
  subject,
  itemId,
  action = 'upsert',
  payload,
}) => {
  const id = `${contentType}:${subject}:${itemId}`;
  const currentList = getCachedCustomContents();
  const nextItem = {
    id,
    contentType,
    subject,
    itemId: String(itemId),
    action,
    payload,
    updatedAt: new Date().toISOString(),
  };

  const existingIdx = currentList.findIndex((i) => i.id === id);
  const updatedList =
    existingIdx !== -1
      ? currentList.map((item, idx) => (idx === existingIdx ? nextItem : item))
      : [...currentList, nextItem];

  // Update tampilan & cache lokal secara instan, namun rollback jika backend menolak (mis. 401/403/500)
  setCachedCustomContents(updatedList);
  applyCustomContentsToData(updatedList);

  try {
    // Simpan ke database Cloudflare D1 lewat API backend
    const response = await api.put('/admin/content', {
      contentType,
      subject,
      itemId: String(itemId),
      action,
      payload,
    });
    return response.data;
  } catch (err) {
    setCachedCustomContents(currentList);
    applyCustomContentsToData(currentList);
    throw err;
  }
};

/**
 * Reset suatu Materi, Latihan Soal, atau Paket Tryout ke data default bawaan aplikasi
 */
export const resetAdminContentItem = async ({ contentType, subject, itemId }) => {
  const id = `${contentType}:${subject}:${itemId}`;
  const currentList = getCachedCustomContents();
  const updatedList = currentList.filter((i) => i.id !== id);

  setCachedCustomContents(updatedList);
  applyCustomContentsToData(updatedList);

  try {
    const response = await api.delete(
      `/admin/content/${encodeURIComponent(contentType)}/${encodeURIComponent(subject)}/${encodeURIComponent(itemId)}`
    );
    return response.data;
  } catch (err) {
    setCachedCustomContents(currentList);
    applyCustomContentsToData(currentList);
    throw err;
  }
};

/**
 * Memeriksa apakah suatu item adalah item bawaan (default) atau tambahan baru
 */
export const isDefaultContentItem = (contentType, subject, itemId) => {
  if (contentType === 'materi') {
    const babs = BASE_MATERI[subject]?.elemen?.flatMap((e) => e.bab) || [];
    return babs.some((b) => String(b.id) === String(itemId));
  }
  if (contentType === 'latihan') {
    const levels = BASE_LATIHAN[subject]?.levels || [];
    return levels.some((l) => String(l.level) === String(itemId));
  }
  if (contentType === 'tryout') {
    const paketList = BASE_TRYOUT[subject]?.paket || [];
    return paketList.some((p) => String(p.nomorPaket) === String(itemId));
  }
  return false;
};

/**
 * Memeriksa apakah suatu item memiliki modifikasi kustom dari Admin
 */
export const hasCustomOverride = (contentType, subject, itemId) => {
  const id = `${contentType}:${subject}:${itemId}`;
  return getCachedCustomContents().some((i) => i.id === id);
};

/**
 * Mengambil seluruh daftar Mata Pelajaran (Mapel Wajib & Mapel Pilihan) beserta metadatanya
 */
export const getAllSubjects = () => {
  const keys = Array.from(
    new Set([
      ...DEFAULT_SUBJECT_KEYS,
      ...Object.keys(PUSMENDIK_MATERI),
      ...Object.keys(PUSMENDIK_LATIHAN),
    ])
  );

  return keys.map((key) => {
    const materiObj = PUSMENDIK_MATERI[key] || {};
    const latihanObj = PUSMENDIK_LATIHAN[key] || {};
    const isDefault = DEFAULT_SUBJECT_KEYS.includes(key);
    const title =
      materiObj.title ||
      latihanObj.nama ||
      (key === 'bahasa_indonesia'
        ? 'Bahasa Indonesia'
        : key === 'matematika'
        ? 'Matematika'
        : key);
    const category =
      materiObj.category ||
      latihanObj.category ||
      (isDefault ? 'wajib' : 'pilihan');
    const colorThemeId =
      materiObj.colorTheme ||
      latihanObj.colorTheme ||
      (key === 'bahasa_indonesia'
        ? 'emerald'
        : key === 'matematika'
        ? 'rose'
        : 'blue');
    const theme =
      SUBJECT_COLOR_THEMES[colorThemeId] || SUBJECT_COLOR_THEMES.blue;

    const materiList =
      materiObj.elemen?.flatMap((e) => e.bab || []) || [];
    const latihanPrefix =
      key === 'bahasa_indonesia'
        ? 'bi_lat_'
        : key === 'matematika'
        ? 'mtk_lat_'
        : `${key}_lat_`;
    const latihanList = (latihanObj.levels || []).map((lvl) => ({
      ...lvl,
      id: lvl.id || `${latihanPrefix}${lvl.level}`,
      no: lvl.level,
    }));

    const defaultMateriDesc =
      key === 'bahasa_indonesia'
        ? 'Huruf kapital, kata depan, tanda baca, kalimat efektif, sinonim/antonim, puisi, prosa, hingga analisis inferensial teks.'
        : key === 'matematika'
        ? 'Operasi hitung campuran, skala & perbandingan, KPK/FPB, bilangan pangkat, kecepatan, geometri, sudut, dan pengelolaan data.'
        : materiObj.deskripsi ||
          `Materi pembelajaran terstruktur dan kuis pemahaman untuk mata pelajaran ${title}.`;

    const defaultLatihanDesc =
      key === 'bahasa_indonesia'
        ? 'Latihan berjenjang dari Fondasi Dasar hingga Penalaran HOTS Nasional: makna kata, kalimat efektif, sastra, dan teks inferensial.'
        : key === 'matematika'
        ? 'Latihan berjenjang dari Fondasi Dasar hingga Penalaran HOTS: operasi hitung, KPK/FPB, skala, pecahan, geometri, dan statistika.'
        : latihanObj.deskripsi ||
          materiObj.deskripsi ||
          `Latihan soal berjenjang standar asesmen untuk mata pelajaran ${title}.`;

    return {
      key,
      title,
      category, // 'wajib' | 'pilihan'
      isDefault,
      colorTheme: colorThemeId,
      theme,
      deskripsi: materiObj.deskripsi || defaultMateriDesc,
      deskripsiMateri: defaultMateriDesc,
      deskripsiLatihan: defaultLatihanDesc,
      materiList,
      latihanList,
    };
  });
};

/**
 * Mengambil metadata satu mata pelajaran berdasarkan key
 */
export const getSubjectByKey = (subjectKey) => {
  const all = getAllSubjects();
  return all.find((s) => s.key === subjectKey) || null;
};

/**
 * Menambahkan atau memperbarui Mata Pelajaran di Admin Panel
 */
export const saveAdminSubject = async ({
  key,
  title,
  category = 'pilihan',
  deskripsi = '',
  colorTheme = 'blue',
}) => {
  const cleanTitle = String(title || '').trim();
  if (!cleanTitle) {
    throw new Error('Nama mata pelajaran wajib diisi.');
  }

  const subjectKey =
    key ||
    cleanTitle
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '') ||
    `mapel_${Date.now()}`;

  const payload = {
    key: subjectKey,
    title: cleanTitle,
    category: category === 'wajib' ? 'wajib' : 'pilihan',
    deskripsi:
      String(deskripsi || '').trim() ||
      `Materi pembelajaran dan latihan soal berjenjang untuk mata pelajaran ${cleanTitle}.`,
    colorTheme: SUBJECT_COLOR_THEMES[colorTheme] ? colorTheme : 'blue',
  };

  await saveAdminContentItem({
    contentType: 'subject',
    subject: subjectKey,
    itemId: 'meta',
    action: 'upsert',
    payload,
  });

  return payload;
};

/**
 * Menghapus Mata Pelajaran Kustom beserta kontennya (Khusus Mapel Tambahan)
 */
export const deleteAdminSubject = async (subjectKey) => {
  if (DEFAULT_SUBJECT_KEYS.includes(subjectKey)) {
    throw new Error('Mata pelajaran wajib bawaan tidak dapat dihapus.');
  }

  return saveAdminContentItem({
    contentType: 'subject',
    subject: subjectKey,
    itemId: 'meta',
    action: 'delete',
    payload: { deleted: true },
  });
};
