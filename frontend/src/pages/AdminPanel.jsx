import React, { useState, useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { isAdminUser, ADMIN_EMAILS } from '../config/adminConfig';
import Navbar from '../components/Navbar';
import RichTextEditor from '../components/RichTextEditor';
import { PUSMENDIK_MATERI } from '../data/pusmendikData';
import { PUSMENDIK_LATIHAN } from '../data/latihanData';
import { PUSMENDIK_TRYOUT } from '../data/tryoutData';
import {
  syncCustomContentFromServer,
  saveAdminContentItem,
  resetAdminContentItem,
  isDefaultContentItem,
  hasCustomOverride,
  getAllSubjects,
  getSubjectByKey,
  saveAdminSubject,
  deleteAdminSubject,
  SUBJECT_COLOR_THEMES,
  DEFAULT_SUBJECT_KEYS,
} from '../services/contentService';
import {
  ShieldCheck,
  BookOpen,
  ClipboardCheck,
  Calculator,
  Plus,
  Trash2,
  Save,
  RotateCcw,
  Check,
  AlertCircle,
  Loader2,
  ChevronDown,
  ChevronUp,
  LayoutDashboard,
  Search,
  Sparkles,
  FileText,
  HelpCircle,
  Pencil,
  Layers,
  X,
  Trophy,
  Clock,
} from 'lucide-react';

/**
 * Halaman Khusus Admin Panel TKA SD
 * Hanya dapat diakses oleh akun yang email-nya terdaftar di frontend/src/config/adminConfig.js
 */
const AdminPanel = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // State tab utama: 'materi' | 'latihan' | 'tryout'
  const [activeTab, setActiveTab] = useState('materi');
  // State mata pelajaran: 'matematika' | 'bahasa_indonesia'
  const [selectedSubject, setSelectedSubject] = useState('matematika');
  const [searchQuery, setSearchQuery] = useState('');
  const [, setRefreshTick] = useState(0);

  // State item terpilih & form editor
  const [selectedMateriId, setSelectedMateriId] = useState(null);
  const [materiForm, setMateriForm] = useState(null);

  const [selectedLatihanLevel, setSelectedLatihanLevel] = useState(null);
  const [latihanForm, setLatihanForm] = useState(null);
  const [openQuestionIdx, setOpenQuestionIdx] = useState(0);

  const [selectedTryoutPaket, setSelectedTryoutPaket] = useState(null);
  const [tryoutForm, setTryoutForm] = useState(null);
  const [openTryoutQuestionIdx, setOpenTryoutQuestionIdx] = useState(0);
  const [tryoutQuestionSearch, setTryoutQuestionSearch] = useState('');

  // State status simpan / notifikasi
  const [isSaving, setIsSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  // State Modal Tambah / Edit Mata Pelajaran
  const [isSubjectModalOpen, setIsSubjectModalOpen] = useState(false);
  const [editingSubjectKey, setEditingSubjectKey] = useState(null);
  const [subjectForm, setSubjectForm] = useState({
    title: '',
    category: 'pilihan',
    deskripsi: '',
    colorTheme: 'blue',
    seedStarterContent: true,
  });

  // Muat data kustom terbaru dari database saat halaman dibuka
  useEffect(() => {
    syncCustomContentFromServer().then(() => {
      setRefreshTick((t) => t + 1);
    });
  }, []);

  // Proteksi ketat: jika bukan admin, langsung alihkan ke Dashboard (tersembunyi dari user biasa)
  if (!isAdminUser(user)) {
    return <Navigate to="/dashboard" replace />;
  }

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Ambil daftar seluruh Mata Pelajaran (Wajib & Pilihan)
  const allSubjects = getAllSubjects();
  const wajibSubjects = allSubjects.filter((s) => s.category === 'wajib');
  const pilihanSubjects = allSubjects.filter((s) => s.category !== 'wajib');
  const activeSubjectMeta =
    getSubjectByKey(selectedSubject) || allSubjects[0] || null;

  // Ambil daftar Materi untuk mapel terpilih
  const materiList =
    PUSMENDIK_MATERI[selectedSubject]?.elemen?.flatMap((e) => e.bab) || [];

  // Ambil daftar Level Latihan untuk mapel terpilih
  const latihanList = PUSMENDIK_LATIHAN[selectedSubject]?.levels || [];

  // Ambil daftar Paket Tryout untuk mapel terpilih
  const tryoutList = PUSMENDIK_TRYOUT[selectedSubject]?.paket || [];

  // Buka Modal Tambah Mapel Baru
  const handleOpenCreateSubject = (defaultCategory = 'pilihan') => {
    setErrorMessage('');
    setEditingSubjectKey(null);
    setSubjectForm({
      title: '',
      category: defaultCategory,
      deskripsi: '',
      colorTheme: defaultCategory === 'wajib' ? 'emerald' : 'blue',
      seedStarterContent: true,
    });
    setIsSubjectModalOpen(true);
  };

  // Buka Modal Edit Mapel Kustom
  const handleOpenEditSubject = (subj) => {
    if (!subj) return;
    setErrorMessage('');
    setEditingSubjectKey(subj.key);
    setSubjectForm({
      title: subj.title || '',
      category: subj.category || 'pilihan',
      deskripsi: subj.deskripsi || '',
      colorTheme: subj.colorTheme || 'blue',
      seedStarterContent: false,
    });
    setIsSubjectModalOpen(true);
  };

  // Simpan Mapel Baru / Perubahan Mapel ke Database
  const handleSaveSubject = async (e) => {
    if (e) e.preventDefault();
    if (!subjectForm.title.trim()) {
      setErrorMessage('Nama mata pelajaran wajib diisi.');
      return;
    }

    try {
      setIsSaving(true);
      setErrorMessage('');
      const savedMeta = await saveAdminSubject({
        key: editingSubjectKey || undefined,
        title: subjectForm.title.trim(),
        category: subjectForm.category,
        deskripsi: subjectForm.deskripsi.trim(),
        colorTheme: subjectForm.colorTheme,
      });

      const subjKey = savedMeta.key;

      // Jika mapel baru dan opsi buat contoh Materi 1 & Latihan 1 dicentang
      if (!editingSubjectKey && subjectForm.seedStarterContent) {
        const currentMat =
          PUSMENDIK_MATERI[subjKey]?.elemen?.flatMap((el) => el.bab) || [];
        const currentLat = PUSMENDIK_LATIHAN[subjKey]?.levels || [];

        if (currentMat.length === 0) {
          const firstMateriId = `${subjKey}_1`;
          await saveAdminContentItem({
            contentType: 'materi',
            subject: subjKey,
            itemId: firstMateriId,
            action: 'upsert',
            payload: {
              id: firstMateriId,
              no: 1,
              judul: `Pengenalan & Konsep Dasar ${savedMeta.title}`,
              ringkasan: `Materi dasar dan konsep pengantar untuk mata pelajaran ${savedMeta.title}.`,
              tujuan: `Murid mampu memahami konsep dasar pada mata pelajaran ${savedMeta.title}.`,
              konsepKunci: `-> Konsep dasar ${savedMeta.title} bagian 1\n-> Konsep dasar ${savedMeta.title} bagian 2`,
              uraianMateri: [
                {
                  subjudul: `Pengantar ${savedMeta.title}`,
                  konten: `Tulis penjelasan materi ${savedMeta.title} di sini.\n-> Poin penting 1\n-> Poin penting 2`,
                  rumus: '',
                  contoh: 'Contoh penerapan singkat...',
                },
              ],
              contohSoal: {
                soal: `Contoh soal pemahaman ${savedMeta.title}...`,
                penjelasan: 'Langkah penyelesaian contoh soal...',
              },
              tipsJuara: `Pahami konsep kunci ${savedMeta.title} dengan teliti!`,
              soalLatihan: [
                {
                  id: 1,
                  pertanyaan: `Pertanyaan kuis pemahaman 1 ${savedMeta.title}...`,
                  pilihan: ['Pilihan A', 'Pilihan B', 'Pilihan C', 'Pilihan D'],
                  jawabanBenar: 0,
                  hint: 'Petunjuk untuk membantu siswa menjawab soal 1.',
                },
                {
                  id: 2,
                  pertanyaan: `Pertanyaan kuis pemahaman 2 ${savedMeta.title}...`,
                  pilihan: ['Pilihan A', 'Pilihan B', 'Pilihan C', 'Pilihan D'],
                  jawabanBenar: 0,
                  hint: 'Petunjuk untuk membantu siswa menjawab soal 2.',
                },
                {
                  id: 3,
                  pertanyaan: `Pertanyaan kuis pemahaman 3 ${savedMeta.title}...`,
                  pilihan: ['Pilihan A', 'Pilihan B', 'Pilihan C', 'Pilihan D'],
                  jawabanBenar: 0,
                  hint: 'Petunjuk untuk membantu siswa menjawab soal 3.',
                },
              ],
            },
          });
        }

        if (currentLat.length === 0) {
          await saveAdminContentItem({
            contentType: 'latihan',
            subject: subjKey,
            itemId: '1',
            action: 'upsert',
            payload: {
              level: 1,
              namaLevel: 'Level 1',
              subjudul: `Fondasi Dasar ${savedMeta.title}`,
              deskripsi: `Latihan soal tingkat dasar untuk mata pelajaran ${savedMeta.title}.`,
              targetSoal: 1,
              soal: [
                {
                  id: `${subjKey}_lvl1_q1_${Date.now()}`,
                  type: 'mcq',
                  level: 1,
                  kesulitan: 'Mudah',
                  pertanyaan: `Pertanyaan latihan soal 1 ${savedMeta.title}...`,
                  stimulus: '',
                  indicator: `Memahami konsep dasar ${savedMeta.title}`,
                  pilihan: ['Pilihan A', 'Pilihan B', 'Pilihan C', 'Pilihan D'],
                  jawabanBenar: 'Pilihan A',
                  answerIndex: 0,
                  statements: [],
                  penjelasan: 'Pembahasan lengkap soal 1...',
                  nomor: 1,
                },
              ],
            },
          });
        }
      }

      setRefreshTick((t) => t + 1);
      setSelectedSubject(subjKey);
      setSelectedMateriId(null);
      setMateriForm(null);
      setSelectedLatihanLevel(null);
      setLatihanForm(null);
      setIsSubjectModalOpen(false);
      showToast(
        editingSubjectKey
          ? `Mata pelajaran "${savedMeta.title}" berhasil diperbarui!`
          : `Mata pelajaran "${savedMeta.title}" (${
              savedMeta.category === 'wajib' ? 'Mapel Wajib' : 'Mapel Pilihan'
            }) berhasil ditambahkan!`
      );
    } catch (err) {
      setErrorMessage(
        err.response?.data?.message ||
          err.message ||
          'Gagal menyimpan mata pelajaran.'
      );
    } finally {
      setIsSaving(false);
    }
  };

  // Hapus Mapel Kustom
  const handleDeleteCustomSubject = async (subj) => {
    if (!subj || subj.isDefault) return;
    if (
      !window.confirm(
        `Hapus mata pelajaran "${subj.title}" dari daftar ${
          subj.category === 'wajib' ? 'Mapel Wajib' : 'Mapel Pilihan'
        }?`
      )
    ) {
      return;
    }

    try {
      setIsSaving(true);
      await deleteAdminSubject(subj.key);
      setRefreshTick((t) => t + 1);
      setSelectedSubject('matematika');
      setSelectedMateriId(null);
      setMateriForm(null);
      setSelectedLatihanLevel(null);
      setLatihanForm(null);
      setSelectedTryoutPaket(null);
      setTryoutForm(null);
      showToast(`Mata pelajaran "${subj.title}" berhasil dihapus.`);
    } catch (err) {
      setErrorMessage(
        err.response?.data?.message ||
          err.message ||
          'Gagal menghapus mata pelajaran.'
      );
    } finally {
      setIsSaving(false);
    }
  };

  // Pilih Materi untuk diedit
  const handleSelectMateri = (bab) => {
    setErrorMessage('');
    setSelectedMateriId(bab.id);
    setMateriForm({
      id: bab.id,
      no: bab.no,
      judul: bab.judul || '',
      ringkasan: bab.ringkasan || '',
      tujuan: bab.tujuan || '',
      konsepKunci: bab.konsepKunci || '',
      uraianMateri: Array.isArray(bab.uraianMateri)
        ? JSON.parse(JSON.stringify(bab.uraianMateri))
        : [{ subjudul: 'Bagian 1', konten: '', rumus: '', contoh: '' }],
      contohSoal: bab.contohSoal
        ? {
            soal: bab.contohSoal.soal || '',
            penjelasan: bab.contohSoal.penjelasan || '',
          }
        : { soal: '', penjelasan: '' },
      tipsJuara: bab.tipsJuara || '',
      soalLatihan: Array.isArray(bab.soalLatihan)
        ? JSON.parse(JSON.stringify(bab.soalLatihan))
        : [
            {
              id: 1,
              pertanyaan: '',
              pilihan: ['', '', '', ''],
              jawabanBenar: 0,
              hint: '',
            },
          ],
    });
  };

  // Buat Materi Baru
  const handleCreateNewMateri = () => {
    const prefix =
      selectedSubject === 'matematika'
        ? 'mtk'
        : selectedSubject === 'bahasa_indonesia'
        ? 'bi'
        : selectedSubject;
    const nextNo = materiList.length + 1;
    const newId = `${prefix}_${Date.now()}`;
    const newBab = {
      id: newId,
      no: nextNo,
      judul: `Materi Baru ${nextNo}`,
      ringkasan: 'Ringkasan singkat materi pembelajaran...',
      tujuan: 'Murid mampu memahami konsep utama pada materi ini.',
      konsepKunci: '-> Poin konsep penting 1\n-> Poin konsep penting 2',
      uraianMateri: [
        {
          subjudul: 'Pengertian & Konsep Dasar',
          konten: 'Tulis penjelasan materi di sini.\n-> Poin penjelasan 1\n-> Poin penjelasan 2',
          rumus: '',
          contoh: 'Contoh penerapan singkat...',
        },
      ],
      contohSoal: {
        soal: 'Contoh pertanyaan latihan...',
        penjelasan: 'Langkah penyelesaian contoh soal...',
      },
      tipsJuara: 'Tips cepat menyelesaikan soal topik ini!',
      soalLatihan: [
        {
          id: 1,
          pertanyaan: 'Pertanyaan kuis pemahaman 1...',
          pilihan: ['Pilihan A', 'Pilihan B', 'Pilihan C', 'Pilihan D'],
          jawabanBenar: 0,
          hint: 'Petunjuk untuk membantu siswa menjawab soal 1.',
        },
        {
          id: 2,
          pertanyaan: 'Pertanyaan kuis pemahaman 2...',
          pilihan: ['Pilihan A', 'Pilihan B', 'Pilihan C', 'Pilihan D'],
          jawabanBenar: 0,
          hint: 'Petunjuk untuk membantu siswa menjawab soal 2.',
        },
        {
          id: 3,
          pertanyaan: 'Pertanyaan kuis pemahaman 3...',
          pilihan: ['Pilihan A', 'Pilihan B', 'Pilihan C', 'Pilihan D'],
          jawabanBenar: 0,
          hint: 'Petunjuk untuk membantu siswa menjawab soal 3.',
        },
      ],
    };
    handleSelectMateri(newBab);
  };

  // Simpan Materi ke Database
  const handleSaveMateri = async (e) => {
    if (e) e.preventDefault();
    if (!materiForm) return;
    setErrorMessage('');

    if (!materiForm.judul.trim()) {
      setErrorMessage('Judul materi wajib diisi.');
      return;
    }

    try {
      setIsSaving(true);
      await saveAdminContentItem({
        contentType: 'materi',
        subject: selectedSubject,
        itemId: materiForm.id,
        action: 'upsert',
        payload: materiForm,
      });
      setRefreshTick((t) => t + 1);
      showToast(`Materi "${materiForm.judul}" berhasil disimpan!`);
    } catch (err) {
      setErrorMessage(
        err.response?.data?.message || err.message || 'Gagal menyimpan materi.'
      );
    } finally {
      setIsSaving(false);
    }
  };

  // Reset atau Hapus Materi
  const handleResetOrDeleteMateri = async () => {
    if (!materiForm) return;
    const isDefault = isDefaultContentItem(
      'materi',
      selectedSubject,
      materiForm.id
    );

    const confirmMsg = isDefault
      ? `Kembalikan materi "${materiForm.judul}" ke isi default awal?`
      : `Hapus materi tambahan "${materiForm.judul}"?`;

    if (!window.confirm(confirmMsg)) return;

    try {
      setIsSaving(true);
      await resetAdminContentItem({
        contentType: 'materi',
        subject: selectedSubject,
        itemId: materiForm.id,
      });
      setRefreshTick((t) => t + 1);
      setSelectedMateriId(null);
      setMateriForm(null);
      showToast(
        isDefault
          ? 'Materi berhasil dikembalikan ke default!'
          : 'Materi tambahan berhasil dihapus!'
      );
    } catch (err) {
      setErrorMessage(
        err.response?.data?.message || err.message || 'Gagal mereset materi.'
      );
    } finally {
      setIsSaving(false);
    }
  };

  // Pilih Level Latihan untuk diedit
  const handleSelectLatihan = (lvl) => {
    setErrorMessage('');
    setSelectedLatihanLevel(lvl.level);
    setOpenQuestionIdx(0);
    const clonedSoal = Array.isArray(lvl.soal)
      ? JSON.parse(JSON.stringify(lvl.soal)).map((q) => {
          if ((q.type || 'mcq') === 'mcq') {
            const opts = Array.isArray(q.pilihan) ? q.pilihan : ['', '', '', ''];
            let resolvedIdx =
              typeof q.answerIndex === 'number' && opts[q.answerIndex] !== undefined
                ? q.answerIndex
                : opts.findIndex((o) => o === q.jawabanBenar);
            if (resolvedIdx === -1 && typeof q.jawabanBenar === 'number') {
              resolvedIdx = q.jawabanBenar;
            }
            if (resolvedIdx === -1) resolvedIdx = 0;
            return {
              ...q,
              answerIndex: resolvedIdx,
              jawabanBenar: opts[resolvedIdx] ?? q.jawabanBenar ?? '',
            };
          }
          return q;
        })
      : [];

    setLatihanForm({
      level: lvl.level,
      namaLevel: lvl.namaLevel || `Level ${lvl.level}`,
      subjudul: lvl.subjudul || '',
      deskripsi: lvl.deskripsi || '',
      targetSoal: clonedSoal.length || lvl.targetSoal || 5,
      soal: clonedSoal,
    });
  };

  // Buat Level Latihan Baru
  const handleCreateNewLatihanLevel = () => {
    const maxLevel = latihanList.reduce(
      (max, l) => Math.max(max, Number(l.level) || 0),
      0
    );
    const nextLevel = maxLevel + 1;
    const prefix =
      selectedSubject === 'matematika'
        ? 'mtk'
        : selectedSubject === 'bahasa_indonesia'
        ? 'bi'
        : selectedSubject;
    const newLvl = {
      level: nextLevel,
      namaLevel: `Level ${nextLevel}`,
      subjudul: `Latihan Tambahan Level ${nextLevel}`,
      deskripsi: `Latihan soal kustom Level ${nextLevel}`,
      targetSoal: 1,
      soal: [
        {
          id: `${prefix}_lvl${nextLevel}_q1_${Date.now()}`,
          type: 'mcq',
          level: nextLevel,
          kesulitan: 'Sedang',
          pertanyaan: 'Tulis pertanyaan soal di sini...',
          stimulus: '',
          indicator: 'Indikator pencapaian kompetensi soal',
          pilihan: ['Pilihan A', 'Pilihan B', 'Pilihan C', 'Pilihan D'],
          jawabanBenar: 'Pilihan A',
          answerIndex: 0,
          statements: [],
          penjelasan: 'Tulis pembahasan lengkap soal di sini...',
          nomor: 1,
        },
      ],
    };
    handleSelectLatihan(newLvl);
  };

  // Tambah Soal Baru di Level Latihan yang sedang dibuka
  const handleAddLatihanQuestion = () => {
    if (!latihanForm) return;
    const prefix =
      selectedSubject === 'matematika'
        ? 'mtk'
        : selectedSubject === 'bahasa_indonesia'
        ? 'bi'
        : selectedSubject;
    const nextNo = latihanForm.soal.length + 1;
    const newQuestion = {
      id: `${prefix}_lvl${latihanForm.level}_q${nextNo}_${Date.now()}`,
      type: 'mcq',
      level: latihanForm.level,
      kesulitan: 'Sedang',
      pertanyaan: '',
      stimulus: '',
      indicator: '',
      pilihan: ['Pilihan A', 'Pilihan B', 'Pilihan C', 'Pilihan D'],
      jawabanBenar: 'Pilihan A',
      answerIndex: 0,
      statements: [
        { text: 'Pernyataan 1', answer: true },
        { text: 'Pernyataan 2', answer: false },
      ],
      penjelasan: '',
      nomor: nextNo,
    };

    const nextSoal = [...latihanForm.soal, newQuestion];
    setLatihanForm({
      ...latihanForm,
      targetSoal: nextSoal.length,
      soal: nextSoal,
    });
    setOpenQuestionIdx(nextSoal.length - 1);
  };

  // Simpan Level Latihan ke Database
  const handleSaveLatihan = async (e) => {
    if (e) e.preventDefault();
    if (!latihanForm) return;
    setErrorMessage('');

    if (!latihanForm.subjudul.trim()) {
      setErrorMessage('Subjudul level latihan wajib diisi.');
      return;
    }

    const normalizedSoal = latihanForm.soal.map((q, idx) => {
      const qType = q.type || 'mcq';
      let jawabanBenar = q.jawabanBenar;
      let answerIndex = q.answerIndex ?? 0;

      if (qType === 'mcq') {
        const opts = Array.isArray(q.pilihan) ? q.pilihan : ['', '', '', ''];
        if (typeof q.answerIndex === 'number' && opts[q.answerIndex] !== undefined) {
          answerIndex = q.answerIndex;
          jawabanBenar = opts[q.answerIndex];
        } else {
          const foundIdx = opts.findIndex((o) => o === jawabanBenar);
          if (foundIdx !== -1) {
            answerIndex = foundIdx;
          } else {
            answerIndex = 0;
            jawabanBenar = opts[0] || '';
          }
        }
      } else if (qType === 'mcma') {
        if (!Array.isArray(jawabanBenar)) {
          jawabanBenar = jawabanBenar ? [jawabanBenar] : [];
        }
      }

      return {
        ...q,
        nomor: idx + 1,
        jawabanBenar,
        answerIndex,
      };
    });

    const payloadToSave = {
      ...latihanForm,
      targetSoal: normalizedSoal.length,
      soal: normalizedSoal,
    };

    try {
      setIsSaving(true);
      await saveAdminContentItem({
        contentType: 'latihan',
        subject: selectedSubject,
        itemId: String(latihanForm.level),
        action: 'upsert',
        payload: payloadToSave,
      });
      setLatihanForm(payloadToSave);
      setRefreshTick((t) => t + 1);
      showToast(
        `${latihanForm.namaLevel} (${latihanForm.subjudul}) berhasil disimpan!`
      );
    } catch (err) {
      setErrorMessage(
        err.response?.data?.message ||
          err.message ||
          'Gagal menyimpan latihan soal.'
      );
    } finally {
      setIsSaving(false);
    }
  };

  // Reset atau Hapus Level Latihan
  const handleResetOrDeleteLatihan = async () => {
    if (!latihanForm) return;
    const isDefault = isDefaultContentItem(
      'latihan',
      selectedSubject,
      latihanForm.level
    );

    const confirmMsg = isDefault
      ? `Kembalikan ${latihanForm.namaLevel} ke soal-soal default awal?`
      : `Hapus ${latihanForm.namaLevel} tambahan ini?`;

    if (!window.confirm(confirmMsg)) return;

    try {
      setIsSaving(true);
      await resetAdminContentItem({
        contentType: 'latihan',
        subject: selectedSubject,
        itemId: String(latihanForm.level),
      });
      setRefreshTick((t) => t + 1);
      setSelectedLatihanLevel(null);
      setLatihanForm(null);
      showToast(
        isDefault
          ? 'Level latihan berhasil dikembalikan ke default!'
          : 'Level latihan tambahan berhasil dihapus!'
      );
    } catch (err) {
      setErrorMessage(
        err.response?.data?.message || err.message || 'Gagal mereset latihan.'
      );
    } finally {
      setIsSaving(false);
    }
  };

  const filteredMateri = materiList.filter((b) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      b.judul?.toLowerCase().includes(q) ||
      `materi ${b.no}`.includes(q) ||
      b.ringkasan?.toLowerCase().includes(q)
    );
  });

  const filteredLatihan = latihanList.filter((l) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      l.namaLevel?.toLowerCase().includes(q) ||
      l.subjudul?.toLowerCase().includes(q) ||
      `level ${l.level}`.includes(q)
    );
  });

  // ========================================================
  // HANDLER KELOLA TRYOUT (PILIH, TAMBAH, SIMPAN, RESET)
  // ========================================================
  const handleSelectTryout = (pkg) => {
    setErrorMessage('');
    setSelectedTryoutPaket(pkg.nomorPaket);
    setOpenTryoutQuestionIdx(0);
    setTryoutQuestionSearch('');

    const clonedSoal = (pkg.soal || []).map((q, idx) => {
      const qType = q.type || q.tipe || 'mcq';
      const opts = Array.isArray(q.options)
        ? [...q.options]
        : Array.isArray(q.pilihan)
        ? [...q.pilihan]
        : ['Pilihan A', 'Pilihan B', 'Pilihan C', 'Pilihan D'];

      const rawAns = q.answer !== undefined ? q.answer : q.jawabanBenar;
      let answer = rawAns;
      let answerIndex = typeof q.answerIndex === 'number' ? q.answerIndex : 0;

      if (qType === 'mcq') {
        if (typeof rawAns === 'number' && opts[rawAns] !== undefined) {
          answerIndex = rawAns;
          answer = opts[rawAns];
        } else {
          const foundIdx = opts.findIndex(
            (o) => String(o).trim() === String(rawAns ?? '').trim()
          );
          if (foundIdx !== -1) {
            answerIndex = foundIdx;
            answer = opts[foundIdx];
          } else if (typeof q.answerIndex === 'number' && opts[q.answerIndex] !== undefined) {
            answerIndex = q.answerIndex;
            answer = opts[q.answerIndex];
          } else {
            answerIndex = 0;
            answer = opts[0] || '';
          }
        }
      } else if (qType === 'mcma') {
        answer = Array.isArray(rawAns) ? [...rawAns] : rawAns ? [rawAns] : [];
      } else if (qType === 'isian') {
        answer = rawAns !== undefined && rawAns !== null ? String(rawAns) : '';
      }

      return {
        ...q,
        id: q.id ?? idx + 1,
        type: qType,
        level: Number(q.level) || 3,
        kesulitan: q.kesulitan || 'Sedang',
        stimulus: q.stimulus || '',
        question: q.question || q.pertanyaan || '',
        indicator: q.indicator || '',
        options: opts,
        answer,
        answerIndex,
        statements: Array.isArray(q.statements)
          ? q.statements.map((s) => ({ text: s.text || '', answer: Boolean(s.answer) }))
          : [],
        explanation: q.explanation || q.penjelasan || '',
      };
    });

    setTryoutForm({
      nomorPaket: Number(pkg.nomorPaket) || 1,
      namaPaket: pkg.namaPaket || `Paket ${pkg.nomorPaket || 1}`,
      kode:
        pkg.kode ||
        `TO-${selectedSubject.toUpperCase().slice(0, 3)}-${String(
          pkg.nomorPaket || 1
        ).padStart(2, '0')}`,
      deskripsi: pkg.deskripsi || `Paket Simulasi Tryout ${pkg.nomorPaket || 1}`,
      durasiMenit: Number(pkg.durasiMenit) || 60,
      totalSoal: clonedSoal.length,
      soal: clonedSoal,
    });
  };

  // Buat Paket Tryout Baru
  const handleCreateNewTryoutPaket = () => {
    const maxPaket = tryoutList.reduce(
      (max, p) => Math.max(max, Number(p.nomorPaket) || 0),
      0
    );
    const nextNum = maxPaket + 1;
    const subjCode =
      selectedSubject === 'matematika'
        ? 'MTK'
        : selectedSubject === 'bahasa_indonesia'
        ? 'BI'
        : selectedSubject.toUpperCase().slice(0, 4);

    const newPkg = {
      nomorPaket: nextNum,
      namaPaket: `Paket ${nextNum}`,
      kode: `TO-${subjCode}-${String(nextNum).padStart(2, '0')}`,
      deskripsi: `Simulasi Tryout Paket ${nextNum} (Tambahan Admin)`,
      durasiMenit: 60,
      totalSoal: 1,
      soal: [
        {
          id: 1,
          type: 'mcq',
          level: 3,
          kesulitan: 'Sedang',
          stimulus: '',
          question: 'Tulis pertanyaan soal tryout di sini...',
          indicator: 'Indikator soal tryout',
          options: ['Pilihan A', 'Pilihan B', 'Pilihan C', 'Pilihan D'],
          answer: 'Pilihan A',
          answerIndex: 0,
          statements: [],
          explanation: 'Tulis pembahasan soal tryout di sini...',
        },
      ],
    };
    handleSelectTryout(newPkg);
  };

  // Tambah Soal Baru di Paket Tryout aktif
  const handleAddTryoutQuestion = () => {
    if (!tryoutForm) return;
    const nextNo = tryoutForm.soal.length + 1;
    const newQuestion = {
      id: nextNo,
      type: 'mcq',
      level: 3,
      kesulitan: 'Sedang',
      stimulus: '',
      question: '',
      indicator: '',
      options: ['Pilihan A', 'Pilihan B', 'Pilihan C', 'Pilihan D'],
      answer: 'Pilihan A',
      answerIndex: 0,
      statements: [
        { text: 'Pernyataan 1', answer: true },
        { text: 'Pernyataan 2', answer: false },
      ],
      explanation: '',
    };
    const nextSoal = [...tryoutForm.soal, newQuestion];
    setTryoutForm({
      ...tryoutForm,
      totalSoal: nextSoal.length,
      soal: nextSoal,
    });
    setTryoutQuestionSearch('');
    setOpenTryoutQuestionIdx(nextSoal.length - 1);
  };

  // Simpan Paket Tryout ke Database
  const handleSaveTryout = async (e) => {
    if (e) e.preventDefault();
    if (!tryoutForm) return;
    setErrorMessage('');

    if (!tryoutForm.namaPaket.trim()) {
      setErrorMessage('Nama Paket Tryout wajib diisi.');
      return;
    }
    if (!tryoutForm.soal || tryoutForm.soal.length === 0) {
      setErrorMessage('Minimal harus ada 1 soal pada paket tryout.');
      return;
    }

    const normalizedSoal = tryoutForm.soal.map((q, idx) => {
      const qType = q.type || 'mcq';
      const opts = Array.isArray(q.options) ? q.options : ['', '', '', ''];
      let answer = q.answer;
      let answerIndex = q.answerIndex ?? 0;

      if (qType === 'mcq') {
        if (typeof q.answerIndex === 'number' && opts[q.answerIndex] !== undefined) {
          answerIndex = q.answerIndex;
          answer = opts[q.answerIndex];
        } else {
          const foundIdx = opts.findIndex((o) => o === answer);
          if (foundIdx !== -1) {
            answerIndex = foundIdx;
            answer = opts[foundIdx];
          } else {
            answerIndex = 0;
            answer = opts[0] || '';
          }
        }
      } else if (qType === 'mcma') {
        answer = Array.isArray(answer) ? answer : answer ? [answer] : [];
      } else if (qType === 'isian') {
        answer = String(answer ?? '').trim();
      } else if (qType === 'category') {
        answer = undefined;
      }

      return {
        ...q,
        id: idx + 1,
        type: qType,
        level: Number(q.level) || 3,
        kesulitan: q.kesulitan || 'Sedang',
        stimulus: q.stimulus || '',
        question: q.question || '',
        indicator: q.indicator || '',
        options: qType === 'mcq' || qType === 'mcma' ? opts : undefined,
        answer,
        answerIndex: qType === 'mcq' ? answerIndex : undefined,
        statements:
          qType === 'category'
            ? (q.statements || []).map((s) => ({
                text: s.text || '',
                answer: Boolean(s.answer),
              }))
            : undefined,
        explanation: q.explanation || '',
      };
    });

    const payloadToSave = {
      ...tryoutForm,
      nomorPaket: Number(tryoutForm.nomorPaket) || 1,
      durasiMenit: Math.max(5, Number(tryoutForm.durasiMenit) || 60),
      totalSoal: normalizedSoal.length,
      soal: normalizedSoal,
    };

    try {
      setIsSaving(true);
      await saveAdminContentItem({
        contentType: 'tryout',
        subject: selectedSubject,
        itemId: String(payloadToSave.nomorPaket),
        action: 'upsert',
        payload: payloadToSave,
      });
      setTryoutForm(payloadToSave);
      setRefreshTick((t) => t + 1);
      showToast(
        `${payloadToSave.namaPaket} (${activeSubjectMeta?.title || selectedSubject}) berhasil disimpan!`
      );
    } catch (err) {
      setErrorMessage(
        err.response?.data?.message ||
          err.message ||
          'Gagal menyimpan paket tryout.'
      );
    } finally {
      setIsSaving(false);
    }
  };

  // Reset atau Hapus Paket Tryout
  const handleResetOrDeleteTryout = async () => {
    if (!tryoutForm) return;
    const isDefault = isDefaultContentItem(
      'tryout',
      selectedSubject,
      tryoutForm.nomorPaket
    );

    const confirmMsg = isDefault
      ? `Kembalikan ${tryoutForm.namaPaket} ke soal-soal tryout default awal?`
      : `Hapus ${tryoutForm.namaPaket} tambahan ini?`;

    if (!window.confirm(confirmMsg)) return;

    try {
      setIsSaving(true);
      await resetAdminContentItem({
        contentType: 'tryout',
        subject: selectedSubject,
        itemId: String(tryoutForm.nomorPaket),
      });
      setRefreshTick((t) => t + 1);
      setSelectedTryoutPaket(null);
      setTryoutForm(null);
      showToast(
        isDefault
          ? 'Paket Tryout berhasil dikembalikan ke default!'
          : 'Paket Tryout tambahan berhasil dihapus!'
      );
    } catch (err) {
      setErrorMessage(
        err.response?.data?.message ||
          err.message ||
          'Gagal mereset paket tryout.'
      );
    } finally {
      setIsSaving(false);
    }
  };

  const filteredTryout = tryoutList.filter((p) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      p.namaPaket?.toLowerCase().includes(q) ||
      p.kode?.toLowerCase().includes(q) ||
      p.deskripsi?.toLowerCase().includes(q) ||
      `paket ${p.nomorPaket}`.includes(q)
    );
  });

  return (
    <div className="min-h-screen flex flex-col bg-transparent text-slate-800 pb-12">
      <Navbar />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-emerald-600 text-white px-4 py-3 rounded-xl shadow-xl border border-emerald-400 flex items-center space-x-2 text-xs sm:text-sm font-bold animate-fade-in">
          <Check className="w-4 h-4 flex-shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 py-4 sm:py-6 space-y-5">
        {/* Top Breadcrumb & Info Admin */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-2 text-xs text-blue-200">
            <button
              onClick={() => navigate('/dashboard')}
              className="hover:text-white font-medium flex items-center space-x-1 cursor-pointer transition-colors"
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>Dashboard</span>
            </button>
            <span className="text-blue-300/50">/</span>
            <span className="text-white font-bold flex items-center space-x-1">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
              <span>Admin Panel</span>
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <span className="px-3 py-1 rounded-lg bg-[#162E5B] border border-amber-400/50 text-amber-300 text-xs font-semibold flex items-center space-x-1.5 shadow-xs">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Admin: {user?.email}</span>
            </span>
          </div>
        </div>

        {/* Banner Header Admin Panel */}
        <div className="p-4 sm:p-5 rounded-2xl bg-[#162E5B] border-2 border-blue-500/40 shadow-lg text-white flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-300 text-[11px] font-bold">
              <Sparkles className="w-3 h-3" />
              <span>Panel Pengelola Konten (Khusus Admin)</span>
            </div>
            <h1 className="text-lg sm:text-2xl font-bold text-white tracking-tight">
              Admin Panel Materi, Latihan & Tryout
            </h1>
          </div>

          {/* Tab Switcher: Materi vs Latihan Soal vs Tryout */}
          <div className="flex flex-wrap items-center gap-1 bg-[#0F2042] p-1.5 rounded-xl border border-blue-500/40 self-start md:self-center flex-shrink-0">
            <button
              type="button"
              onClick={() => {
                setActiveTab('materi');
                setErrorMessage('');
              }}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold flex items-center space-x-1.5 transition-all cursor-pointer ${
                activeTab === 'materi'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-blue-200 hover:text-white'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Kelola Materi</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('latihan');
                setErrorMessage('');
              }}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold flex items-center space-x-1.5 transition-all cursor-pointer ${
                activeTab === 'latihan'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-blue-200 hover:text-white'
              }`}
            >
              <ClipboardCheck className="w-3.5 h-3.5" />
              <span>Kelola Latihan Soal</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('tryout');
                setErrorMessage('');
              }}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold flex items-center space-x-1.5 transition-all cursor-pointer ${
                activeTab === 'tryout'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'text-blue-200 hover:text-white'
              }`}
            >
              <Trophy className="w-3.5 h-3.5" />
              <span>Kelola Tryout</span>
            </button>
          </div>
        </div>

        {/* Layout 2 Kolom: Sidebar Daftar Item (Kiri) & Form Editor (Kanan) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* KOLOM KIRI: Pilihan Mapel (Wajib & Pilihan) & Daftar Materi/Level */}
          <div className="lg:col-span-4 bg-[#162E5B] border-2 border-blue-500/40 rounded-2xl p-4 text-white space-y-4 shadow-lg">
            {/* Header Kelola Mata Pelajaran + Tombol Tambah Mapel */}
            <div className="space-y-3 pb-3 border-b border-blue-800/60">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-blue-200 flex items-center space-x-1.5">
                  <Layers className="w-3.5 h-3.5 text-amber-400" />
                  <span>Pilih Mata Pelajaran</span>
                </span>
                <button
                  type="button"
                  onClick={() => handleOpenCreateSubject('pilihan')}
                  className="px-2.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-[11px] font-extrabold flex items-center space-x-1 transition-all cursor-pointer shadow-xs active:scale-95"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Tambah Mapel</span>
                </button>
              </div>

              {/* Kelompok 1: Mapel Wajib */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-300/90">
                    Mapel Wajib ({wajibSubjects.length})
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {wajibSubjects.map((subj) => {
                    const isSelected = selectedSubject === subj.key;
                    const IconComp =
                      subj.key === 'matematika' ? Calculator : BookOpen;
                    return (
                      <button
                        key={subj.key}
                        type="button"
                        onClick={() => {
                          setSelectedSubject(subj.key);
                          setSelectedMateriId(null);
                          setMateriForm(null);
                          setSelectedLatihanLevel(null);
                          setLatihanForm(null);
                          setSelectedTryoutPaket(null);
                          setTryoutForm(null);
                        }}
                        style={
                          isSelected
                            ? {
                                backgroundColor: subj.theme.primaryHex,
                                borderColor: subj.theme.softBorderHex,
                              }
                            : undefined
                        }
                        className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center space-x-1.5 transition-all cursor-pointer ${
                          isSelected
                            ? 'text-white shadow-sm'
                            : 'bg-[#0F2042] border-blue-500/30 text-blue-200 hover:text-white hover:border-blue-400/60'
                        }`}
                      >
                        <IconComp className="w-3.5 h-3.5 flex-shrink-0" />
                        <span className="truncate">
                          {subj.key === 'bahasa_indonesia'
                            ? 'B. Indonesia'
                            : subj.title}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Kelompok 2: Mapel Pilihan */}
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-300/90">
                    Mapel Pilihan ({pilihanSubjects.length})
                  </span>
                </div>

                {pilihanSubjects.length === 0 ? (
                  <div className="p-2.5 rounded-xl bg-[#0F2042]/70 border border-dashed border-blue-500/30 text-[11px] text-blue-300 text-center">
                    Belum ada Mapel Pilihan. Klik{' '}
                    <button
                      type="button"
                      onClick={() => handleOpenCreateSubject('pilihan')}
                      className="text-amber-300 font-bold underline cursor-pointer hover:text-amber-200"
                    >
                      + Tambah Mapel
                    </button>{' '}
                    untuk menambahkan mapel pilihan baru.
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    {pilihanSubjects.map((subj) => {
                      const isSelected = selectedSubject === subj.key;
                      return (
                        <button
                          key={subj.key}
                          type="button"
                          onClick={() => {
                            setSelectedSubject(subj.key);
                            setSelectedMateriId(null);
                            setMateriForm(null);
                            setSelectedLatihanLevel(null);
                            setLatihanForm(null);
                            setSelectedTryoutPaket(null);
                            setTryoutForm(null);
                          }}
                          style={
                            isSelected
                              ? {
                                  backgroundColor: subj.theme.primaryHex,
                                  borderColor: subj.theme.softBorderHex,
                                }
                              : undefined
                          }
                          className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center space-x-1.5 transition-all cursor-pointer ${
                            isSelected
                              ? 'text-white shadow-sm'
                              : 'bg-[#0F2042] border-blue-500/30 text-blue-200 hover:text-white hover:border-blue-400/60'
                          }`}
                        >
                          <BookOpen className="w-3.5 h-3.5 flex-shrink-0" />
                          <span className="truncate">{subj.title}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Info Mapel Aktif & Aksi Edit/Hapus jika Mapel Kustom */}
              {activeSubjectMeta && (
                <div className="p-2.5 rounded-xl bg-[#0F2042] border border-blue-500/30 flex items-center justify-between gap-2 text-xs">
                  <div className="min-w-0">
                    <div className="flex items-center space-x-1.5">
                      <span
                        className={`px-1.5 py-0.2 rounded text-[9px] font-bold uppercase ${
                          activeSubjectMeta.category === 'wajib'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-400/40'
                            : 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40'
                        }`}
                      >
                        {activeSubjectMeta.category === 'wajib'
                          ? 'Mapel Wajib'
                          : 'Mapel Pilihan'}
                      </span>
                      <span className="font-bold text-white truncate">
                        {activeSubjectMeta.title}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-1 flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => handleOpenEditSubject(activeSubjectMeta)}
                      className="p-1.5 rounded-lg bg-[#162E5B] hover:bg-blue-700 text-blue-200 hover:text-white border border-blue-500/30 cursor-pointer transition-colors"
                      title="Edit Informasi Mapel"
                    >
                      <Pencil className="w-3 h-3" />
                    </button>
                    {!activeSubjectMeta.isDefault && (
                      <button
                        type="button"
                        onClick={() =>
                          handleDeleteCustomSubject(activeSubjectMeta)
                        }
                        className="p-1.5 rounded-lg bg-rose-950/80 hover:bg-rose-800 text-rose-300 hover:text-white border border-rose-500/40 cursor-pointer transition-colors"
                        title="Hapus Mapel Ini"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Pencarian & Tombol Tambah Baru */}
            <div className="space-y-2.5">
              <div className="relative">
                <Search className="w-4 h-4 text-blue-300 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={
                    activeTab === 'materi'
                      ? 'Cari judul materi...'
                      : activeTab === 'latihan'
                      ? 'Cari level latihan...'
                      : 'Cari paket tryout...'
                  }
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#0F2042] border border-blue-500/40 text-xs text-white placeholder-blue-300/60 focus:outline-none focus:border-blue-400"
                />
              </div>

              {activeTab === 'materi' ? (
                <button
                  type="button"
                  onClick={handleCreateNewMateri}
                  className="w-full py-2.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center justify-center space-x-1.5 transition-all cursor-pointer shadow-sm active:scale-98"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tambah Topik Materi Baru</span>
                </button>
              ) : activeTab === 'latihan' ? (
                <button
                  type="button"
                  onClick={handleCreateNewLatihanLevel}
                  className="w-full py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center justify-center space-x-1.5 transition-all cursor-pointer shadow-sm active:scale-98"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tambah Level Latihan Baru</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleCreateNewTryoutPaket}
                  className="w-full py-2.5 px-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold flex items-center justify-center space-x-1.5 transition-all cursor-pointer shadow-sm active:scale-98"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tambah Paket Tryout Baru</span>
                </button>
              )}
            </div>

            {/* Daftar Item Scrollable */}
            <div className="space-y-2 max-h-[540px] overflow-y-auto navy-scrollbar pr-1">
              {activeTab === 'materi' ? (
                filteredMateri.map((bab) => {
                  const isSelected = selectedMateriId === bab.id;
                  const isModified = hasCustomOverride(
                    'materi',
                    selectedSubject,
                    bab.id
                  );
                  const isDefault = isDefaultContentItem(
                    'materi',
                    selectedSubject,
                    bab.id
                  );

                  return (
                    <button
                      key={bab.id}
                      type="button"
                      onClick={() => handleSelectMateri(bab)}
                      className={`w-full text-left p-3 rounded-xl border transition-all cursor-pointer flex items-start justify-between gap-2 ${
                        isSelected
                          ? 'bg-[#1E3A8A] border-blue-400 text-white shadow-sm'
                          : 'bg-[#0F2042] border-blue-500/30 text-blue-100 hover:border-blue-400/60'
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="flex items-center space-x-1.5 flex-wrap gap-y-1">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-900/80 text-blue-200 border border-blue-500/30">
                            Materi {bab.no}
                          </span>
                          {!isDefault ? (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-900/80 text-emerald-300 border border-emerald-500/40">
                              Baru
                            </span>
                          ) : isModified ? (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-900/80 text-amber-300 border border-amber-500/40">
                              Diedit
                            </span>
                          ) : null}
                        </div>
                        <h4 className="text-xs sm:text-sm font-bold text-white mt-1 truncate">
                          {bab.judul}
                        </h4>
                        <p className="text-[11px] text-blue-300 line-clamp-1 mt-0.5">
                          {bab.uraianMateri?.length || 0} Slide •{' '}
                          {bab.soalLatihan?.length || 0} Soal Kuis
                        </p>
                      </div>
                    </button>
                  );
                })
              ) : activeTab === 'latihan' ? (
                filteredLatihan.map((lvl) => {
                  const isSelected =
                    String(selectedLatihanLevel) === String(lvl.level);
                  const isModified = hasCustomOverride(
                    'latihan',
                    selectedSubject,
                    lvl.level
                  );
                  const isDefault = isDefaultContentItem(
                    'latihan',
                    selectedSubject,
                    lvl.level
                  );

                  return (
                    <button
                      key={lvl.level}
                      type="button"
                      onClick={() => handleSelectLatihan(lvl)}
                      className={`w-full text-left p-3 rounded-xl border transition-all cursor-pointer flex items-start justify-between gap-2 ${
                        isSelected
                          ? 'bg-[#1E3A8A] border-blue-400 text-white shadow-sm'
                          : 'bg-[#0F2042] border-blue-500/30 text-blue-100 hover:border-blue-400/60'
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="flex items-center space-x-1.5 flex-wrap gap-y-1">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-900/80 text-emerald-200 border border-emerald-500/30">
                            {lvl.namaLevel || `Level ${lvl.level}`}
                          </span>
                          <span className="text-[10px] font-semibold text-blue-300">
                            {lvl.soal?.length || 0} Soal
                          </span>
                          {!isDefault ? (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-900/80 text-emerald-300 border border-emerald-500/40">
                              Baru
                            </span>
                          ) : isModified ? (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-900/80 text-amber-300 border border-amber-500/40">
                              Diedit
                            </span>
                          ) : null}
                        </div>
                        <h4 className="text-xs sm:text-sm font-bold text-white mt-1 truncate">
                          {lvl.subjudul}
                        </h4>
                        <p className="text-[11px] text-blue-300 line-clamp-1 mt-0.5">
                          {lvl.deskripsi}
                        </p>
                      </div>
                    </button>
                  );
                })
              ) : filteredTryout.length === 0 ? (
                <div className="p-4 rounded-xl bg-[#0F2042] border border-dashed border-blue-500/40 text-center text-xs text-blue-200 space-y-1.5">
                  <Trophy className="w-7 h-7 text-amber-400/80 mx-auto" />
                  <p className="font-semibold text-white">
                    Belum ada paket tryout di mapel ini.
                  </p>
                  <p className="text-[11px] text-blue-300">
                    Pilih Matematika / B. Indonesia atau klik tombol &ldquo;Tambah Paket Tryout Baru&rdquo;.
                  </p>
                </div>
              ) : (
                filteredTryout.map((pkg) => {
                  const isSelected =
                    String(selectedTryoutPaket) === String(pkg.nomorPaket);
                  const isModified = hasCustomOverride(
                    'tryout',
                    selectedSubject,
                    pkg.nomorPaket
                  );
                  const isDefault = isDefaultContentItem(
                    'tryout',
                    selectedSubject,
                    pkg.nomorPaket
                  );

                  return (
                    <button
                      key={pkg.nomorPaket}
                      type="button"
                      onClick={() => handleSelectTryout(pkg)}
                      className={`w-full text-left p-3 rounded-xl border transition-all cursor-pointer flex items-start justify-between gap-2 ${
                        isSelected
                          ? 'bg-[#1E3A8A] border-amber-400 text-white shadow-sm'
                          : 'bg-[#0F2042] border-blue-500/30 text-blue-100 hover:border-amber-400/60'
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="flex items-center space-x-1.5 flex-wrap gap-y-1">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-900/80 text-amber-200 border border-amber-500/40">
                            {pkg.namaPaket || `Paket ${pkg.nomorPaket}`}
                          </span>
                          <span className="text-[10px] font-semibold text-blue-300">
                            {pkg.soal?.length || 0} Soal • {pkg.durasiMenit || 60} Menit
                          </span>
                          {!isDefault ? (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-900/80 text-emerald-300 border border-emerald-500/40">
                              Baru
                            </span>
                          ) : isModified ? (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-900/80 text-amber-300 border border-amber-500/40">
                              Diedit
                            </span>
                          ) : null}
                        </div>
                        <h4 className="text-xs sm:text-sm font-bold text-white mt-1 truncate">
                          {pkg.deskripsi || `Simulasi Tryout Paket ${pkg.nomorPaket}`}
                        </h4>
                        <p className="text-[11px] text-blue-300 line-clamp-1 mt-0.5">
                          Kode: {pkg.kode || `TO-${pkg.nomorPaket}`}
                        </p>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* KOLOM KANAN: Form Editor Materi atau Latihan Soal */}
          <div className="lg:col-span-8 bg-[#162E5B] border-2 border-blue-500/40 rounded-2xl p-4 sm:p-6 text-white shadow-lg">
            {errorMessage && (
              <div className="mb-4 p-3.5 rounded-xl bg-rose-950/80 border border-rose-500 text-rose-200 text-xs flex items-start space-x-2">
                <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* ==================== EDITOR MATERI ==================== */}
            {activeTab === 'materi' && (
              <>
                {!materiForm ? (
                  <div className="py-16 text-center space-y-3">
                    <BookOpen className="w-12 h-12 text-blue-400 mx-auto opacity-80" />
                    <h3 className="text-base sm:text-lg font-bold text-white">
                      Pilih Materi di Sebelah Kiri atau Buat Materi Baru
                    </h3>
                    <p className="text-xs text-blue-200 max-w-md mx-auto">
                      Klik salah satu topik materi untuk mengedit isi slide bacaan, rumus, contoh soal, hingga kuis pemahaman 3 soal di akhir materi.
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleSaveMateri} className="space-y-6">
                    {/* Header Form Materi */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-blue-800/60">
                      <div>
                        <span className="text-[11px] font-bold uppercase tracking-wider text-blue-300">
                          Editor Materi • {activeSubjectMeta?.title || selectedSubject} (
                          {activeSubjectMeta?.category === 'wajib'
                            ? 'Mapel Wajib'
                            : 'Mapel Pilihan'}
                          )
                        </span>
                        <h2 className="text-base sm:text-xl font-bold text-white">
                          Materi {materiForm.no}: {materiForm.judul}
                        </h2>
                      </div>

                      <div className="flex items-center space-x-2">
                        {(hasCustomOverride(
                          'materi',
                          selectedSubject,
                          materiForm.id
                        ) ||
                          !isDefaultContentItem(
                            'materi',
                            selectedSubject,
                            materiForm.id
                          )) && (
                          <button
                            type="button"
                            disabled={isSaving}
                            onClick={handleResetOrDeleteMateri}
                            className="px-3 py-2 rounded-xl bg-rose-900/70 hover:bg-rose-800 text-rose-200 border border-rose-500/50 text-xs font-bold flex items-center space-x-1.5 transition-all cursor-pointer"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>
                              {isDefaultContentItem(
                                'materi',
                                selectedSubject,
                                materiForm.id
                              )
                                ? 'Reset Default'
                                : 'Hapus Materi'}
                            </span>
                          </button>
                        )}

                        <button
                          type="submit"
                          disabled={isSaving}
                          className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white text-xs font-bold flex items-center space-x-1.5 transition-all cursor-pointer shadow-md"
                        >
                          {isSaving ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              <span>Menyimpan...</span>
                            </>
                          ) : (
                            <>
                              <Save className="w-4 h-4" />
                              <span>Simpan Materi</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    {/* 1. Informasi Pokok Materi */}
                    <div className="p-4 rounded-xl bg-[#0F2042] border border-blue-500/40 space-y-3.5">
                      <h3 className="text-xs sm:text-sm font-bold text-blue-300 uppercase tracking-wider flex items-center space-x-1.5">
                        <FileText className="w-4 h-4" />
                        <span>1. Informasi Umum & Konsep Inti</span>
                      </h3>

                      <div>
                        <label className="block text-xs font-semibold text-blue-200 mb-1">
                          Judul Materi *
                        </label>
                        <input
                          type="text"
                          value={materiForm.judul}
                          onChange={(e) =>
                            setMateriForm({ ...materiForm, judul: e.target.value })
                          }
                          className="w-full px-3 py-2 rounded-lg bg-[#162E5B] border border-blue-500/50 text-white text-xs sm:text-sm font-semibold focus:outline-none focus:border-blue-300"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-blue-200 mb-1">
                          Ringkasan Singkat (Ditampilkan di Kartu Peta)
                        </label>
                        <RichTextEditor
                          rows={2}
                          value={materiForm.ringkasan}
                          onChange={(e) =>
                            setMateriForm({
                              ...materiForm,
                              ringkasan: e.target.value,
                            })
                          }
                          bgClass="bg-[#162E5B]"
                          placeholder="Tulis ringkasan singkat materi..."
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-blue-200 mb-1">
                          Tujuan Pembelajaran
                        </label>
                        <RichTextEditor
                          rows={2}
                          value={materiForm.tujuan}
                          onChange={(e) =>
                            setMateriForm({ ...materiForm, tujuan: e.target.value })
                          }
                          bgClass="bg-[#162E5B]"
                          placeholder="Tulis tujuan pembelajaran..."
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-blue-200 mb-1">
                          Konsep Kunci (Gunakan baris baru, tombol Poin, atau Penomoran)
                        </label>
                        <RichTextEditor
                          rows={3}
                          value={materiForm.konsepKunci}
                          onChange={(e) =>
                            setMateriForm({
                              ...materiForm,
                              konsepKunci: e.target.value,
                            })
                          }
                          bgClass="bg-[#162E5B]"
                          placeholder="Tulis konsep kunci materi..."
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-blue-200 mb-1">
                          Tips Juara
                        </label>
                        <RichTextEditor
                          rows={2}
                          value={materiForm.tipsJuara}
                          onChange={(e) =>
                            setMateriForm({
                              ...materiForm,
                              tipsJuara: e.target.value,
                            })
                          }
                          bgClass="bg-[#162E5B]"
                          placeholder="Tulis tips cepat menyelesaikan soal..."
                        />
                      </div>
                    </div>

                    {/* 2. Slide Uraian Materi */}
                    <div className="p-4 rounded-xl bg-[#0F2042] border border-blue-500/40 space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-xs sm:text-sm font-bold text-blue-300 uppercase tracking-wider">
                          2. Slide Bagian Uraian Materi ({materiForm.uraianMateri.length} Bagian)
                        </h3>
                        <button
                          type="button"
                          onClick={() =>
                            setMateriForm({
                              ...materiForm,
                              uraianMateri: [
                                ...materiForm.uraianMateri,
                                {
                                  subjudul: `Bagian ${materiForm.uraianMateri.length + 1}`,
                                  konten: '',
                                  rumus: '',
                                  contoh: '',
                                },
                              ],
                            })
                          }
                          className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center space-x-1 cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Tambah Slide Bagian</span>
                        </button>
                      </div>

                      <div className="space-y-3">
                        {materiForm.uraianMateri.map((bagian, bIdx) => (
                          <div
                            key={bIdx}
                            className="p-3.5 rounded-xl bg-[#162E5B] border border-blue-500/40 space-y-3"
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-amber-300">
                                Slide Bagian #{bIdx + 1}
                              </span>
                              {materiForm.uraianMateri.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    const next = materiForm.uraianMateri.filter(
                                      (_, i) => i !== bIdx
                                    );
                                    setMateriForm({
                                      ...materiForm,
                                      uraianMateri: next,
                                    });
                                  }}
                                  className="text-rose-300 hover:text-rose-200 text-xs flex items-center space-x-1 cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  <span>Hapus Bagian</span>
                                </button>
                              )}
                            </div>

                            <div>
                              <label className="block text-[11px] font-semibold text-blue-200 mb-1">
                                Subjudul Bagian
                              </label>
                              <input
                                type="text"
                                value={bagian.subjudul || ''}
                                onChange={(e) => {
                                  const next = [...materiForm.uraianMateri];
                                  next[bIdx] = {
                                    ...next[bIdx],
                                    subjudul: e.target.value,
                                  };
                                  setMateriForm({
                                    ...materiForm,
                                    uraianMateri: next,
                                  });
                                }}
                                className="w-full px-3 py-1.5 rounded-lg bg-[#0F2042] border border-blue-500/40 text-white text-xs font-semibold"
                              />
                            </div>

                            <div>
                              <label className="block text-[11px] font-semibold text-blue-200 mb-1">
                                Isi Penjelasan Materi
                              </label>
                              <RichTextEditor
                                rows={4}
                                value={bagian.konten || ''}
                                onChange={(e) => {
                                  const next = [...materiForm.uraianMateri];
                                  next[bIdx] = {
                                    ...next[bIdx],
                                    konten: e.target.value,
                                  };
                                  setMateriForm({
                                    ...materiForm,
                                    uraianMateri: next,
                                  });
                                }}
                                bgClass="bg-[#0F2042]"
                                placeholder="Tulis penjelasan materi di sini..."
                              />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                              <div>
                                <label className="block text-[11px] font-semibold text-blue-200 mb-1">
                                  Kotak Rumus / Pola (Opsional)
                                </label>
                                <RichTextEditor
                                  rows={2}
                                  value={bagian.rumus || ''}
                                  onChange={(e) => {
                                    const next = [...materiForm.uraianMateri];
                                    next[bIdx] = {
                                      ...next[bIdx],
                                      rumus: e.target.value,
                                    };
                                    setMateriForm({
                                      ...materiForm,
                                      uraianMateri: next,
                                    });
                                  }}
                                  bgClass="bg-[#0F2042]"
                                  placeholder="Tulis rumus atau kaidah pokok..."
                                />
                              </div>
                              <div>
                                <label className="block text-[11px] font-semibold text-blue-200 mb-1">
                                  Contoh Penerapan (Opsional)
                                </label>
                                <RichTextEditor
                                  rows={2}
                                  value={bagian.contoh || ''}
                                  onChange={(e) => {
                                    const next = [...materiForm.uraianMateri];
                                    next[bIdx] = {
                                      ...next[bIdx],
                                      contoh: e.target.value,
                                    };
                                    setMateriForm({
                                      ...materiForm,
                                      uraianMateri: next,
                                    });
                                  }}
                                  bgClass="bg-[#0F2042]"
                                  placeholder="Tulis contoh penerapan..."
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* 3. Contoh Soal & Pembahasan di Materi */}
                    <div className="p-4 rounded-xl bg-[#0F2042] border border-blue-500/40 space-y-3">
                      <h3 className="text-xs sm:text-sm font-bold text-blue-300 uppercase tracking-wider">
                        3. Contoh Soal & Pembahasan Materi
                      </h3>
                      <div>
                        <label className="block text-xs font-semibold text-blue-200 mb-1">
                          Pertanyaan Contoh Soal
                        </label>
                        <RichTextEditor
                          rows={2}
                          value={materiForm.contohSoal?.soal || ''}
                          onChange={(e) =>
                            setMateriForm({
                              ...materiForm,
                              contohSoal: {
                                ...materiForm.contohSoal,
                                soal: e.target.value,
                              },
                            })
                          }
                          bgClass="bg-[#162E5B]"
                          placeholder="Tulis pertanyaan contoh soal..."
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-blue-200 mb-1">
                          Penyelesaian / Pembahasan Contoh Soal
                        </label>
                        <RichTextEditor
                          rows={2}
                          value={materiForm.contohSoal?.penjelasan || ''}
                          onChange={(e) =>
                            setMateriForm({
                              ...materiForm,
                              contohSoal: {
                                ...materiForm.contohSoal,
                                penjelasan: e.target.value,
                              },
                            })
                          }
                          bgClass="bg-[#162E5B]"
                          placeholder="Tulis langkah penyelesaian contoh soal..."
                        />
                      </div>
                    </div>

                    {/* 4. Kuis Pemahaman Akhir Materi */}
                    <div className="p-4 rounded-xl bg-[#0F2042] border border-blue-500/40 space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-xs sm:text-sm font-bold text-blue-300 uppercase tracking-wider flex items-center space-x-1.5">
                          <HelpCircle className="w-4 h-4" />
                          <span>
                            4. Kuis Pemahaman Akhir Materi ({materiForm.soalLatihan.length} Soal)
                          </span>
                        </h3>
                        <button
                          type="button"
                          onClick={() =>
                            setMateriForm({
                              ...materiForm,
                              soalLatihan: [
                                ...materiForm.soalLatihan,
                                {
                                  id: materiForm.soalLatihan.length + 1,
                                  pertanyaan: '',
                                  pilihan: ['Pilihan A', 'Pilihan B', 'Pilihan C', 'Pilihan D'],
                                  jawabanBenar: 0,
                                  hint: '',
                                },
                              ],
                            })
                          }
                          className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center space-x-1 cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Tambah Soal Kuis</span>
                        </button>
                      </div>

                      <div className="space-y-3">
                        {materiForm.soalLatihan.map((q, qIdx) => (
                          <div
                            key={qIdx}
                            className="p-3.5 rounded-xl bg-[#162E5B] border border-blue-500/40 space-y-3"
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-emerald-300">
                                Soal Kuis #{qIdx + 1}
                              </span>
                              {materiForm.soalLatihan.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    const next = materiForm.soalLatihan.filter(
                                      (_, i) => i !== qIdx
                                    );
                                    setMateriForm({
                                      ...materiForm,
                                      soalLatihan: next,
                                    });
                                  }}
                                  className="text-rose-300 hover:text-rose-200 text-xs flex items-center space-x-1 cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  <span>Hapus Soal</span>
                                </button>
                              )}
                            </div>

                            <div>
                              <label className="block text-[11px] font-semibold text-blue-200 mb-1">
                                Pertanyaan Kuis
                              </label>
                              <RichTextEditor
                                rows={2}
                                value={q.pertanyaan || ''}
                                onChange={(e) => {
                                  const next = [...materiForm.soalLatihan];
                                  next[qIdx] = {
                                    ...next[qIdx],
                                    pertanyaan: e.target.value,
                                  };
                                  setMateriForm({
                                    ...materiForm,
                                    soalLatihan: next,
                                  });
                                }}
                                bgClass="bg-[#0F2042]"
                                placeholder="Tulis pertanyaan kuis pemahaman..."
                              />
                            </div>

                            <div className="space-y-2.5">
                              <label className="block text-[11px] font-semibold text-emerald-300">
                                Pilihan Jawaban Kuis (Bisa diisi teks, rumus, maupun gambar)
                              </label>
                              <div className="grid grid-cols-1 gap-2.5">
                                {(q.pilihan || ['', '', '', '']).map((opt, oIdx) => (
                                  <div
                                    key={oIdx}
                                    className={`p-2.5 rounded-xl border space-y-2 ${
                                      Number(q.jawabanBenar) === oIdx
                                        ? 'bg-emerald-950/60 border-emerald-400'
                                        : 'bg-[#0F2042] border-blue-500/30'
                                    }`}
                                  >
                                    <label className="flex items-center space-x-2 cursor-pointer">
                                      <input
                                        type="radio"
                                        name={`materi_quiz_ans_${qIdx}`}
                                        checked={Number(q.jawabanBenar) === oIdx}
                                        onChange={() => {
                                          const next = [...materiForm.soalLatihan];
                                          next[qIdx] = {
                                            ...next[qIdx],
                                            jawabanBenar: oIdx,
                                          };
                                          setMateriForm({
                                            ...materiForm,
                                            soalLatihan: next,
                                          });
                                        }}
                                        title="Pilih sebagai kunci jawaban benar"
                                        className="cursor-pointer"
                                      />
                                      <span className="text-xs font-bold text-blue-300">
                                        Opsi {String.fromCharCode(65 + oIdx)}
                                      </span>
                                      {Number(q.jawabanBenar) === oIdx && (
                                        <span className="px-1.5 py-0.5 rounded bg-emerald-600/90 text-white text-[10px] font-bold">
                                          Kunci Jawaban
                                        </span>
                                      )}
                                    </label>
                                    <RichTextEditor
                                      compact
                                      rows={1}
                                      value={opt || ''}
                                      onChange={(e) => {
                                        const next = [...materiForm.soalLatihan];
                                        const nextOpts = [...(next[qIdx].pilihan || [])];
                                        nextOpts[oIdx] = e.target.value;
                                        next[qIdx] = {
                                          ...next[qIdx],
                                          pilihan: nextOpts,
                                        };
                                        setMateriForm({
                                          ...materiForm,
                                          soalLatihan: next,
                                        });
                                      }}
                                      bgClass="bg-[#162E5B]"
                                      placeholder={`Ketik jawaban ${String.fromCharCode(65 + oIdx)} atau klik tombol Gambar / Ctrl+V...`}
                                    />
                                  </div>
                                ))}
                              </div>
                            </div>

                            <div>
                              <label className="block text-[11px] font-semibold text-blue-200 mb-1">
                                Petunjuk (Hint saat siswa menjawab salah)
                              </label>
                              <input
                                type="text"
                                value={q.hint || ''}
                                onChange={(e) => {
                                  const next = [...materiForm.soalLatihan];
                                  next[qIdx] = {
                                    ...next[qIdx],
                                    hint: e.target.value,
                                  };
                                  setMateriForm({
                                    ...materiForm,
                                    soalLatihan: next,
                                  });
                                }}
                                className="w-full px-3 py-1.5 rounded-lg bg-[#0F2042] border border-blue-500/40 text-white text-xs"
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </form>
                )}
              </>
            )}

            {/* ==================== EDITOR LATIHAN SOAL ==================== */}
            {activeTab === 'latihan' && (
              <>
                {!latihanForm ? (
                  <div className="py-16 text-center space-y-3">
                    <ClipboardCheck className="w-12 h-12 text-emerald-400 mx-auto opacity-80" />
                    <h3 className="text-base sm:text-lg font-bold text-white">
                      Pilih Level Latihan di Sebelah Kiri atau Buat Level Baru
                    </h3>
                    <p className="text-xs text-blue-200 max-w-md mx-auto">
                      Klik salah satu Level Latihan untuk mengedit soal Pilihan Ganda, Pilihan Ganda Kompleks (MCMA), maupun Benar/Salah beserta pembahasannya.
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleSaveLatihan} className="space-y-6">
                    {/* Header Form Latihan */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-blue-800/60">
                      <div>
                        <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-300">
                          Editor Latihan Soal • {activeSubjectMeta?.title || selectedSubject} (
                          {activeSubjectMeta?.category === 'wajib'
                            ? 'Mapel Wajib'
                            : 'Mapel Pilihan'}
                          )
                        </span>
                        <h2 className="text-base sm:text-xl font-bold text-white">
                          {latihanForm.namaLevel}: {latihanForm.subjudul}
                        </h2>
                      </div>

                      <div className="flex items-center space-x-2">
                        {(hasCustomOverride(
                          'latihan',
                          selectedSubject,
                          latihanForm.level
                        ) ||
                          !isDefaultContentItem(
                            'latihan',
                            selectedSubject,
                            latihanForm.level
                          )) && (
                          <button
                            type="button"
                            disabled={isSaving}
                            onClick={handleResetOrDeleteLatihan}
                            className="px-3 py-2 rounded-xl bg-rose-900/70 hover:bg-rose-800 text-rose-200 border border-rose-500/50 text-xs font-bold flex items-center space-x-1.5 transition-all cursor-pointer"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>
                              {isDefaultContentItem(
                                'latihan',
                                selectedSubject,
                                latihanForm.level
                              )
                                ? 'Reset Default'
                                : 'Hapus Level'}
                            </span>
                          </button>
                        )}

                        <button
                          type="submit"
                          disabled={isSaving}
                          className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white text-xs font-bold flex items-center space-x-1.5 transition-all cursor-pointer shadow-md"
                        >
                          {isSaving ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              <span>Menyimpan...</span>
                            </>
                          ) : (
                            <>
                              <Save className="w-4 h-4" />
                              <span>Simpan Level Latihan</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    {/* 1. Informasi Level Latihan */}
                    <div className="p-4 rounded-xl bg-[#0F2042] border border-blue-500/40 space-y-3">
                      <h3 className="text-xs sm:text-sm font-bold text-emerald-300 uppercase tracking-wider">
                        1. Informasi Level Latihan
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-blue-200 mb-1">
                            Nama Level
                          </label>
                          <input
                            type="text"
                            value={latihanForm.namaLevel}
                            onChange={(e) =>
                              setLatihanForm({
                                ...latihanForm,
                                namaLevel: e.target.value,
                              })
                            }
                            className="w-full px-3 py-2 rounded-lg bg-[#162E5B] border border-blue-500/50 text-white text-xs font-semibold"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-blue-200 mb-1">
                            Subjudul Level *
                          </label>
                          <input
                            type="text"
                            value={latihanForm.subjudul}
                            onChange={(e) =>
                              setLatihanForm({
                                ...latihanForm,
                                subjudul: e.target.value,
                              })
                            }
                            className="w-full px-3 py-2 rounded-lg bg-[#162E5B] border border-blue-500/50 text-white text-xs font-semibold"
                            required
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-blue-200 mb-1">
                          Deskripsi Level
                        </label>
                        <input
                          type="text"
                          value={latihanForm.deskripsi}
                          onChange={(e) =>
                            setLatihanForm({
                              ...latihanForm,
                              deskripsi: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 rounded-lg bg-[#162E5B] border border-blue-500/50 text-white text-xs"
                        />
                      </div>
                    </div>

                    {/* 2. Daftar Butir Soal dalam Level Ini */}
                    <div className="p-4 rounded-xl bg-[#0F2042] border border-blue-500/40 space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-xs sm:text-sm font-bold text-emerald-300 uppercase tracking-wider">
                          2. Daftar Butir Soal ({latihanForm.soal.length} Soal)
                        </h3>
                        <button
                          type="button"
                          onClick={handleAddLatihanQuestion}
                          className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center space-x-1 cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Tambah Soal Baru</span>
                        </button>
                      </div>

                      <div className="space-y-3">
                        {latihanForm.soal.map((q, qIdx) => {
                          const isOpen = openQuestionIdx === qIdx;
                          const qType = q.type || 'mcq';

                          return (
                            <div
                              key={q.id || qIdx}
                              className="rounded-xl bg-[#162E5B] border border-blue-500/40 overflow-hidden"
                            >
                              {/* Header Accordion Soal */}
                              <div
                                onClick={() =>
                                  setOpenQuestionIdx(isOpen ? -1 : qIdx)
                                }
                                className="p-3.5 flex items-center justify-between cursor-pointer hover:bg-[#1E3A8A]/60 transition-colors"
                              >
                                <div className="flex items-center space-x-2.5 min-w-0">
                                  <span className="px-2 py-0.5 rounded bg-blue-600 text-white text-xs font-bold flex-shrink-0">
                                    Soal #{qIdx + 1}
                                  </span>
                                  <span className="px-2 py-0.5 rounded bg-[#0F2042] border border-blue-400/40 text-blue-200 text-[10px] font-semibold flex-shrink-0">
                                    {qType === 'mcma'
                                      ? 'PG Kompleks'
                                      : qType === 'category'
                                      ? 'Benar / Salah'
                                      : 'Pilihan Ganda'}
                                  </span>
                                  {(() => {
                                    const hasImageInQ =
                                      /<(?:img|svg)\b/i.test(q.pertanyaan || '') ||
                                      /<(?:img|svg)\b/i.test(q.stimulus || '') ||
                                      (q.pilihan || []).some((o) =>
                                        /<(?:img|svg)\b/i.test(o || '')
                                      ) ||
                                      (q.statements || []).some(
                                        (s) =>
                                          /<(?:img|svg)\b/i.test(s?.text || '') ||
                                          /<(?:img|svg)\b/i.test(s?.image || '')
                                      );
                                    const plainQ = (q.pertanyaan || '')
                                      .replace(/<[^>]*>/g, '')
                                      .trim();
                                    return (
                                      <>
                                        {hasImageInQ && (
                                          <span className="px-1.5 py-0.5 rounded bg-emerald-900/80 border border-emerald-400/50 text-emerald-200 text-[10px] font-bold flex-shrink-0">
                                            🖼️ Gambar
                                          </span>
                                        )}
                                        <span className="text-xs text-blue-100 truncate">
                                          {plainQ ||
                                            (hasImageInQ
                                              ? '(Soal dengan ilustrasi gambar)'
                                              : '(Pertanyaan belum diisi)')}
                                        </span>
                                      </>
                                    );
                                  })()}
                                </div>

                                <div className="flex items-center space-x-2 flex-shrink-0">
                                  {latihanForm.soal.length > 1 && (
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        if (
                                          !window.confirm(
                                            `Hapus Soal #${qIdx + 1}?`
                                          )
                                        )
                                          return;
                                        const nextSoal =
                                          latihanForm.soal.filter(
                                            (_, i) => i !== qIdx
                                          );
                                        setLatihanForm({
                                          ...latihanForm,
                                          targetSoal: nextSoal.length,
                                          soal: nextSoal,
                                        });
                                      }}
                                      className="p-1.5 rounded-lg bg-rose-950/80 hover:bg-rose-800 text-rose-300 border border-rose-500/40 cursor-pointer"
                                      title="Hapus Soal"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                  {isOpen ? (
                                    <ChevronUp className="w-4 h-4 text-blue-300" />
                                  ) : (
                                    <ChevronDown className="w-4 h-4 text-blue-300" />
                                  )}
                                </div>
                              </div>

                              {/* Body Detail Soal */}
                              {isOpen && (
                                <div className="p-4 border-t border-blue-800/60 space-y-3.5 bg-[#12264B]">
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div>
                                      <label className="block text-[11px] font-semibold text-blue-200 mb-1">
                                        Tipe Soal
                                      </label>
                                      <select
                                        value={qType}
                                        onChange={(e) => {
                                          const newType = e.target.value;
                                          const next = [...latihanForm.soal];
                                          const currentOpts =
                                            Array.isArray(q.pilihan) &&
                                            q.pilihan.length > 0
                                              ? q.pilihan
                                              : [
                                                  'Pilihan A',
                                                  'Pilihan B',
                                                  'Pilihan C',
                                                  'Pilihan D',
                                                ];
                                          next[qIdx] = {
                                            ...next[qIdx],
                                            type: newType,
                                            pilihan: currentOpts,
                                            jawabanBenar:
                                              newType === 'mcma'
                                                ? [currentOpts[0]]
                                                : currentOpts[0],
                                            answerIndex: 0,
                                            statements:
                                              Array.isArray(q.statements) &&
                                              q.statements.length > 0
                                                ? q.statements
                                                : [
                                                    {
                                                      text: 'Pernyataan 1',
                                                      answer: true,
                                                    },
                                                    {
                                                      text: 'Pernyataan 2',
                                                      answer: false,
                                                    },
                                                  ],
                                          };
                                          setLatihanForm({
                                            ...latihanForm,
                                            soal: next,
                                          });
                                        }}
                                        className="w-full px-3 py-1.5 rounded-lg bg-[#0F2042] border border-blue-500/40 text-white text-xs font-semibold"
                                      >
                                        <option value="mcq">
                                          Pilihan Ganda Tunggal (MCQ)
                                        </option>
                                        <option value="mcma">
                                          Pilihan Ganda Kompleks (Lebih dari 1 Jawaban)
                                        </option>
                                        <option value="category">
                                          Benar / Salah (Pernyataan Kategori)
                                        </option>
                                      </select>
                                    </div>

                                    <div>
                                      <label className="block text-[11px] font-semibold text-blue-200 mb-1">
                                        Indikator Kompetensi (Opsional)
                                      </label>
                                      <input
                                        type="text"
                                        value={q.indicator || ''}
                                        onChange={(e) => {
                                          const next = [...latihanForm.soal];
                                          next[qIdx] = {
                                            ...next[qIdx],
                                            indicator: e.target.value,
                                          };
                                          setLatihanForm({
                                            ...latihanForm,
                                            soal: next,
                                          });
                                        }}
                                        placeholder="Contoh: Menghitung operasi campuran..."
                                        className="w-full px-3 py-1.5 rounded-lg bg-[#0F2042] border border-blue-500/40 text-white text-xs"
                                      />
                                    </div>
                                  </div>

                                  <div>
                                    <label className="block text-[11px] font-semibold text-blue-200 mb-1">
                                      Teks Stimulus / Bacaan Cerita (Kosongkan jika tidak ada)
                                    </label>
                                    <RichTextEditor
                                      rows={2}
                                      value={q.stimulus || ''}
                                      onChange={(e) => {
                                        const next = [...latihanForm.soal];
                                        next[qIdx] = {
                                          ...next[qIdx],
                                          stimulus: e.target.value,
                                        };
                                        setLatihanForm({
                                          ...latihanForm,
                                          soal: next,
                                        });
                                      }}
                                      bgClass="bg-[#0F2042]"
                                      placeholder="Tulis teks stimulus atau bacaan cerita..."
                                    />
                                  </div>

                                  <div>
                                    <label className="block text-[11px] font-semibold text-blue-200 mb-1">
                                      Pertanyaan Soal *
                                    </label>
                                    <RichTextEditor
                                      rows={3}
                                      value={q.pertanyaan || ''}
                                      onChange={(e) => {
                                        const next = [...latihanForm.soal];
                                        next[qIdx] = {
                                          ...next[qIdx],
                                          pertanyaan: e.target.value,
                                        };
                                        setLatihanForm({
                                          ...latihanForm,
                                          soal: next,
                                        });
                                      }}
                                      bgClass="bg-[#0F2042]"
                                      placeholder="Tulis pertanyaan soal di sini..."
                                    />
                                  </div>

                                  {/* Opsi Jawaban untuk MCQ */}
                                  {qType === 'mcq' && (
                                    <div className="space-y-2.5">
                                      <label className="block text-[11px] font-semibold text-emerald-300">
                                        Pilihan Jawaban (Klik bulatan radio untuk Kunci Jawaban • Mendukung teks, rumus, & gambar)
                                      </label>
                                      {(q.pilihan || ['', '', '', '']).map(
                                        (opt, oIdx) => {
                                          const isCorrect =
                                            typeof q.answerIndex === 'number'
                                              ? q.answerIndex === oIdx
                                              : q.jawabanBenar === opt;
                                          return (
                                            <div
                                              key={oIdx}
                                              className={`p-2.5 rounded-xl border space-y-2 ${
                                                isCorrect
                                                  ? 'bg-emerald-950/60 border-emerald-400'
                                                  : 'bg-[#0F2042] border-blue-500/30'
                                              }`}
                                            >
                                              <label className="flex items-center space-x-2 cursor-pointer">
                                                <input
                                                  type="radio"
                                                  name={`lat_mcq_${qIdx}`}
                                                  checked={isCorrect}
                                                  onChange={() => {
                                                    const next = [
                                                      ...latihanForm.soal,
                                                    ];
                                                    next[qIdx] = {
                                                      ...next[qIdx],
                                                      jawabanBenar: opt,
                                                      answerIndex: oIdx,
                                                    };
                                                    setLatihanForm({
                                                      ...latihanForm,
                                                      soal: next,
                                                    });
                                                  }}
                                                  className="cursor-pointer"
                                                />
                                                <span className="text-xs font-bold text-blue-300">
                                                  Pilihan {String.fromCharCode(65 + oIdx)}
                                                </span>
                                                {isCorrect && (
                                                  <span className="px-1.5 py-0.5 rounded bg-emerald-600/90 text-white text-[10px] font-bold">
                                                    Kunci Jawaban Benar
                                                  </span>
                                                )}
                                              </label>
                                              <RichTextEditor
                                                compact
                                                rows={1}
                                                value={opt || ''}
                                                onChange={(e) => {
                                                  const newVal = e.target.value;
                                                  const next = [
                                                    ...latihanForm.soal,
                                                  ];
                                                  const nextOpts = [
                                                    ...(next[qIdx].pilihan ||
                                                      []),
                                                  ];
                                                  const wasCorrect =
                                                    typeof next[qIdx]
                                                      .answerIndex === 'number'
                                                      ? next[qIdx]
                                                          .answerIndex === oIdx
                                                      : next[qIdx]
                                                          .jawabanBenar === opt;
                                                  nextOpts[oIdx] = newVal;
                                                  next[qIdx] = {
                                                    ...next[qIdx],
                                                    pilihan: nextOpts,
                                                    ...(wasCorrect && {
                                                      jawabanBenar: newVal,
                                                      answerIndex: oIdx,
                                                    }),
                                                  };
                                                  setLatihanForm({
                                                    ...latihanForm,
                                                    soal: next,
                                                  });
                                                }}
                                                bgClass="bg-[#162E5B]"
                                                placeholder={`Tulis jawaban ${String.fromCharCode(65 + oIdx)} atau klik tombol Gambar / Ctrl+V...`}
                                              />
                                            </div>
                                          );
                                        }
                                      )}
                                    </div>
                                  )}

                                  {/* Opsi Jawaban untuk MCMA */}
                                  {qType === 'mcma' && (
                                    <div className="space-y-2.5">
                                      <label className="block text-[11px] font-semibold text-emerald-300">
                                        Pilihan Jawaban Kompleks (Centang semua kunci jawaban benar • Mendukung gambar)
                                      </label>
                                      {(q.pilihan || ['', '', '', '']).map(
                                        (opt, oIdx) => {
                                          const currentCorrect = Array.isArray(
                                            q.jawabanBenar
                                          )
                                            ? q.jawabanBenar
                                            : [];
                                          const isChecked =
                                            currentCorrect.includes(opt);
                                          return (
                                            <div
                                              key={oIdx}
                                              className={`p-2.5 rounded-xl border space-y-2 ${
                                                isChecked
                                                  ? 'bg-emerald-950/60 border-emerald-400'
                                                  : 'bg-[#0F2042] border-blue-500/30'
                                              }`}
                                            >
                                              <label className="flex items-center space-x-2 cursor-pointer">
                                                <input
                                                  type="checkbox"
                                                  checked={isChecked}
                                                  onChange={(e) => {
                                                    const next = [
                                                      ...latihanForm.soal,
                                                    ];
                                                    const nextCorrect = e.target
                                                      .checked
                                                      ? [...currentCorrect, opt]
                                                      : currentCorrect.filter(
                                                          (item) => item !== opt
                                                        );
                                                    next[qIdx] = {
                                                      ...next[qIdx],
                                                      jawabanBenar: nextCorrect,
                                                    };
                                                    setLatihanForm({
                                                      ...latihanForm,
                                                      soal: next,
                                                    });
                                                  }}
                                                  className="cursor-pointer"
                                                />
                                                <span className="text-xs font-bold text-blue-300">
                                                  Pilihan {String.fromCharCode(65 + oIdx)}
                                                </span>
                                                {isChecked && (
                                                  <span className="px-1.5 py-0.5 rounded bg-emerald-600/90 text-white text-[10px] font-bold">
                                                    Termasuk Kunci Benar
                                                  </span>
                                                )}
                                              </label>
                                              <RichTextEditor
                                                compact
                                                rows={1}
                                                value={opt || ''}
                                                onChange={(e) => {
                                                  const newVal = e.target.value;
                                                  const next = [
                                                    ...latihanForm.soal,
                                                  ];
                                                  const nextOpts = [
                                                    ...(next[qIdx].pilihan ||
                                                      []),
                                                  ];
                                                  nextOpts[oIdx] = newVal;
                                                  const nextCorrect =
                                                    currentCorrect.map((c) =>
                                                      c === opt ? newVal : c
                                                    );
                                                  next[qIdx] = {
                                                    ...next[qIdx],
                                                    pilihan: nextOpts,
                                                    jawabanBenar: nextCorrect,
                                                  };
                                                  setLatihanForm({
                                                    ...latihanForm,
                                                    soal: next,
                                                  });
                                                }}
                                                bgClass="bg-[#162E5B]"
                                                placeholder={`Tulis jawaban ${String.fromCharCode(65 + oIdx)} atau sisipkan gambar...`}
                                              />
                                            </div>
                                          );
                                        }
                                      )}
                                    </div>
                                  )}

                                  {/* Pernyataan Benar / Salah untuk Category */}
                                  {qType === 'category' && (
                                    <div className="space-y-2.5">
                                      <div className="flex items-center justify-between">
                                        <label className="block text-[11px] font-semibold text-emerald-300">
                                          Daftar Pernyataan Benar / Salah (Mendukung teks, rumus, & gambar)
                                        </label>
                                        <button
                                          type="button"
                                          onClick={() => {
                                            const next = [...latihanForm.soal];
                                            const stmts = Array.isArray(
                                              q.statements
                                            )
                                              ? [...q.statements]
                                              : [];
                                            stmts.push({
                                              text: 'Pernyataan baru...',
                                              answer: true,
                                            });
                                            next[qIdx] = {
                                              ...next[qIdx],
                                              statements: stmts,
                                            };
                                            setLatihanForm({
                                              ...latihanForm,
                                              soal: next,
                                            });
                                          }}
                                          className="text-[11px] font-bold text-blue-300 hover:text-white flex items-center space-x-1 cursor-pointer"
                                        >
                                          <Plus className="w-3 h-3" />
                                          <span>Tambah Pernyataan</span>
                                        </button>
                                      </div>

                                      {(q.statements || []).map(
                                        (stmt, sIdx) => (
                                          <div
                                            key={sIdx}
                                            className="p-2.5 rounded-xl bg-[#0F2042] border border-blue-500/30 space-y-2"
                                          >
                                            <div className="flex items-center justify-between gap-2">
                                              <span className="text-[11px] font-bold text-blue-300">
                                                Pernyataan #{sIdx + 1}
                                              </span>
                                              <div className="flex items-center space-x-2">
                                                <button
                                                  type="button"
                                                  onClick={() => {
                                                    const next = [
                                                      ...latihanForm.soal,
                                                    ];
                                                    const stmts = [
                                                      ...(next[qIdx]
                                                        .statements || []),
                                                    ];
                                                    stmts[sIdx] = {
                                                      ...stmts[sIdx],
                                                      answer:
                                                        !stmts[sIdx].answer,
                                                    };
                                                    next[qIdx] = {
                                                      ...next[qIdx],
                                                      statements: stmts,
                                                    };
                                                    setLatihanForm({
                                                      ...latihanForm,
                                                      soal: next,
                                                    });
                                                  }}
                                                  className={`px-2.5 py-1 rounded text-[11px] font-bold cursor-pointer ${
                                                    stmt.answer
                                                      ? 'bg-emerald-600 text-white'
                                                      : 'bg-rose-600 text-white'
                                                  }`}
                                                >
                                                  Kunci: {stmt.answer ? 'Benar' : 'Salah'}
                                                </button>
                                                {(q.statements || []).length >
                                                  1 && (
                                                  <button
                                                    type="button"
                                                    onClick={() => {
                                                      const next = [
                                                        ...latihanForm.soal,
                                                      ];
                                                      const stmts = (
                                                        next[qIdx].statements ||
                                                        []
                                                      ).filter(
                                                        (_, i) => i !== sIdx
                                                      );
                                                      next[qIdx] = {
                                                        ...next[qIdx],
                                                        statements: stmts,
                                                      };
                                                      setLatihanForm({
                                                        ...latihanForm,
                                                        soal: next,
                                                      });
                                                    }}
                                                    className="text-rose-400 hover:text-rose-200 cursor-pointer"
                                                    title="Hapus Pernyataan"
                                                  >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                  </button>
                                                )}
                                              </div>
                                            </div>
                                            <RichTextEditor
                                              compact
                                              rows={1}
                                              value={stmt.text || ''}
                                              onChange={(e) => {
                                                const next = [
                                                  ...latihanForm.soal,
                                                ];
                                                const stmts = [
                                                  ...(next[qIdx].statements ||
                                                    []),
                                                ];
                                                stmts[sIdx] = {
                                                  ...stmts[sIdx],
                                                  text: e.target.value,
                                                };
                                                next[qIdx] = {
                                                  ...next[qIdx],
                                                  statements: stmts,
                                                };
                                                setLatihanForm({
                                                  ...latihanForm,
                                                  soal: next,
                                                });
                                              }}
                                              bgClass="bg-[#162E5B]"
                                              placeholder={`Tulis pernyataan #${sIdx + 1} atau sisipkan gambar...`}
                                            />
                                          </div>
                                        )
                                      )}
                                    </div>
                                  )}

                                  <div>
                                    <label className="block text-[11px] font-semibold text-blue-200 mb-1">
                                      Penjelasan / Pembahasan Soal
                                    </label>
                                    <RichTextEditor
                                      rows={2}
                                      value={q.penjelasan || ''}
                                      onChange={(e) => {
                                        const next = [...latihanForm.soal];
                                        next[qIdx] = {
                                          ...next[qIdx],
                                          penjelasan: e.target.value,
                                        };
                                        setLatihanForm({
                                          ...latihanForm,
                                          soal: next,
                                        });
                                      }}
                                      bgClass="bg-[#0F2042]"
                                      placeholder="Tulis penjelasan / pembahasan lengkap soal..."
                                    />
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </form>
                )}
              </>
            )}

            {/* ==================== EDITOR TRYOUT ==================== */}
            {activeTab === 'tryout' && (
              <>
                {!tryoutForm ? (
                  <div className="py-16 text-center space-y-3">
                    <Trophy className="w-12 h-12 text-amber-400 mx-auto opacity-85" />
                    <h3 className="text-base sm:text-lg font-bold text-white">
                      Pilih Paket Tryout di Sebelah Kiri atau Buat Paket Baru
                    </h3>
                    <p className="text-xs text-blue-200 max-w-md mx-auto">
                      Klik salah satu paket tryout (Paket 1 s.d. 5) untuk mengedit durasi, bacaan/stimulus, pertanyaan, gambar, kunci jawaban, dan pembahasan setiap butir soal.
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleSaveTryout} className="space-y-6">
                    {/* Header Form Tryout */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-blue-800/60">
                      <div>
                        <span className="text-[11px] font-bold uppercase tracking-wider text-amber-300">
                          Editor Tryout • {activeSubjectMeta?.title || selectedSubject}
                        </span>
                        <h2 className="text-base sm:text-xl font-bold text-white">
                          {tryoutForm.namaPaket}: {tryoutForm.deskripsi || tryoutForm.kode}
                        </h2>
                      </div>

                      <div className="flex items-center space-x-2">
                        {(hasCustomOverride(
                          'tryout',
                          selectedSubject,
                          tryoutForm.nomorPaket
                        ) ||
                          !isDefaultContentItem(
                            'tryout',
                            selectedSubject,
                            tryoutForm.nomorPaket
                          )) && (
                          <button
                            type="button"
                            disabled={isSaving}
                            onClick={handleResetOrDeleteTryout}
                            className="px-3 py-2 rounded-xl bg-rose-900/70 hover:bg-rose-800 text-rose-200 border border-rose-500/50 text-xs font-bold flex items-center space-x-1.5 transition-all cursor-pointer"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>
                              {isDefaultContentItem(
                                'tryout',
                                selectedSubject,
                                tryoutForm.nomorPaket
                              )
                                ? 'Reset Default'
                                : 'Hapus Paket'}
                            </span>
                          </button>
                        )}

                        <button
                          type="submit"
                          disabled={isSaving}
                          className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 disabled:opacity-60 text-white text-xs font-bold flex items-center space-x-1.5 transition-all cursor-pointer shadow-md"
                        >
                          {isSaving ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              <span>Menyimpan...</span>
                            </>
                          ) : (
                            <>
                              <Save className="w-4 h-4" />
                              <span>Simpan Paket Tryout</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    {/* 1. Informasi Paket Tryout */}
                    <div className="p-4 rounded-xl bg-[#0F2042] border border-blue-500/40 space-y-3">
                      <h3 className="text-xs sm:text-sm font-bold text-amber-300 uppercase tracking-wider flex items-center space-x-1.5">
                        <Trophy className="w-4 h-4" />
                        <span>1. Informasi Paket Tryout</span>
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-blue-200 mb-1">
                            Nama Paket *
                          </label>
                          <input
                            type="text"
                            value={tryoutForm.namaPaket}
                            onChange={(e) =>
                              setTryoutForm({
                                ...tryoutForm,
                                namaPaket: e.target.value,
                              })
                            }
                            className="w-full px-3 py-2 rounded-lg bg-[#162E5B] border border-blue-500/50 text-white text-xs font-semibold"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-blue-200 mb-1">
                            Kode Paket
                          </label>
                          <input
                            type="text"
                            value={tryoutForm.kode}
                            onChange={(e) =>
                              setTryoutForm({
                                ...tryoutForm,
                                kode: e.target.value,
                              })
                            }
                            className="w-full px-3 py-2 rounded-lg bg-[#162E5B] border border-blue-500/50 text-white text-xs font-mono"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-blue-200 mb-1">
                            Durasi Ujian (Menit)
                          </label>
                          <div className="relative">
                            <Clock className="w-3.5 h-3.5 text-amber-300 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                            <input
                              type="number"
                              min={5}
                              max={180}
                              value={tryoutForm.durasiMenit}
                              onChange={(e) =>
                                setTryoutForm({
                                  ...tryoutForm,
                                  durasiMenit: Number(e.target.value) || 60,
                                })
                              }
                              className="w-full pl-8 pr-3 py-2 rounded-lg bg-[#162E5B] border border-blue-500/50 text-white text-xs font-semibold"
                            />
                          </div>
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-blue-200 mb-1">
                          Deskripsi Paket Tryout
                        </label>
                        <input
                          type="text"
                          value={tryoutForm.deskripsi}
                          onChange={(e) =>
                            setTryoutForm({
                              ...tryoutForm,
                              deskripsi: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 rounded-lg bg-[#162E5B] border border-blue-500/50 text-white text-xs"
                        />
                      </div>
                    </div>

                    {/* 2. Daftar Butir Soal Tryout */}
                    <div className="p-4 rounded-xl bg-[#0F2042] border border-blue-500/40 space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                        <h3 className="text-xs sm:text-sm font-bold text-amber-300 uppercase tracking-wider">
                          2. Daftar Butir Soal Tryout ({tryoutForm.soal.length} Soal)
                        </h3>
                        <button
                          type="button"
                          onClick={handleAddTryoutQuestion}
                          className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold flex items-center space-x-1 cursor-pointer self-start sm:self-auto"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Tambah Soal Baru</span>
                        </button>
                      </div>

                      {/* Filter & Navigasi Cepat Nomor Soal */}
                      <div className="space-y-2.5 p-3 rounded-xl bg-[#162E5B]/70 border border-blue-500/30">
                        <div className="relative">
                          <Search className="w-3.5 h-3.5 text-blue-300 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                          <input
                            type="text"
                            value={tryoutQuestionSearch}
                            onChange={(e) => setTryoutQuestionSearch(e.target.value)}
                            placeholder="Cari nomor soal (mis. 12) atau kata kunci pertanyaan..."
                            className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-[#0F2042] border border-blue-500/40 text-xs text-white placeholder-blue-300/60 focus:outline-none focus:border-amber-400"
                          />
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {tryoutForm.soal.map((_, idx) => {
                            const isActive = openTryoutQuestionIdx === idx;
                            return (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => {
                                  setTryoutQuestionSearch('');
                                  setOpenTryoutQuestionIdx(idx);
                                }}
                                className={`w-7 h-7 rounded-lg text-[11px] font-bold border transition-all cursor-pointer ${
                                  isActive
                                    ? 'bg-amber-500 border-amber-300 text-slate-950 shadow-xs'
                                    : 'bg-[#0F2042] border-blue-500/40 text-blue-200 hover:border-amber-400 hover:text-white'
                                }`}
                                title={`Buka Soal #${idx + 1}`}
                              >
                                {idx + 1}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div className="space-y-3">
                        {tryoutForm.soal.map((q, qIdx) => {
                          if (tryoutQuestionSearch.trim()) {
                            const term = tryoutQuestionSearch.trim().toLowerCase();
                            const plainQuestion = (q.question || '')
                              .replace(/<[^>]*>/g, '')
                              .toLowerCase();
                            const plainStimulus = (q.stimulus || '')
                              .replace(/<[^>]*>/g, '')
                              .toLowerCase();
                            const matches =
                              String(qIdx + 1) === term ||
                              `soal ${qIdx + 1}`.includes(term) ||
                              `#${qIdx + 1}`.includes(term) ||
                              plainQuestion.includes(term) ||
                              plainStimulus.includes(term) ||
                              (q.indicator || '').toLowerCase().includes(term);
                            if (!matches) return null;
                          }

                          const isOpen = openTryoutQuestionIdx === qIdx;
                          const qType = q.type || 'mcq';

                          return (
                            <div
                              key={`${tryoutForm.nomorPaket}_q_${qIdx}`}
                              className="rounded-xl bg-[#162E5B] border border-blue-500/40 overflow-hidden"
                            >
                              {/* Header Accordion Soal Tryout */}
                              <div
                                onClick={() =>
                                  setOpenTryoutQuestionIdx(isOpen ? -1 : qIdx)
                                }
                                className="p-3.5 flex items-center justify-between cursor-pointer hover:bg-[#1E3A8A]/60 transition-colors"
                              >
                                <div className="flex items-center space-x-2 min-w-0">
                                  <span className="px-2 py-0.5 rounded bg-amber-600 text-white text-xs font-bold flex-shrink-0">
                                    Soal #{qIdx + 1}
                                  </span>
                                  <span className="px-2 py-0.5 rounded bg-[#0F2042] border border-blue-400/40 text-blue-200 text-[10px] font-semibold flex-shrink-0">
                                    {qType === 'mcma'
                                      ? 'PG Kompleks'
                                      : qType === 'category'
                                      ? 'Benar / Salah'
                                      : qType === 'isian'
                                      ? 'Isian Singkat'
                                      : 'Pilihan Ganda'}
                                  </span>
                                  <span className="px-1.5 py-0.5 rounded bg-blue-950/90 border border-blue-500/30 text-amber-200 text-[10px] font-semibold flex-shrink-0">
                                    {q.kesulitan || 'Sedang'}
                                  </span>
                                  {(() => {
                                    const hasImageInQ =
                                      /<(?:img|svg)\b/i.test(q.question || '') ||
                                      /<(?:img|svg)\b/i.test(q.stimulus || '') ||
                                      (q.options || []).some((o) =>
                                        /<(?:img|svg)\b/i.test(o || '')
                                      ) ||
                                      (q.statements || []).some((s) =>
                                        /<(?:img|svg)\b/i.test(s?.text || '')
                                      );
                                    const plainQ = (q.question || '')
                                      .replace(/<[^>]*>/g, '')
                                      .trim();
                                    return (
                                      <>
                                        {hasImageInQ && (
                                          <span className="px-1.5 py-0.5 rounded bg-emerald-900/80 border border-emerald-400/50 text-emerald-200 text-[10px] font-bold flex-shrink-0">
                                            🖼️ Gambar
                                          </span>
                                        )}
                                        <span className="text-xs text-blue-100 truncate">
                                          {plainQ ||
                                            (hasImageInQ
                                              ? '(Soal dengan ilustrasi gambar)'
                                              : '(Pertanyaan belum diisi)')}
                                        </span>
                                      </>
                                    );
                                  })()}
                                </div>

                                <div className="flex items-center space-x-2 flex-shrink-0">
                                  {tryoutForm.soal.length > 1 && (
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        if (
                                          !window.confirm(
                                            `Hapus Soal Tryout #${qIdx + 1}?`
                                          )
                                        )
                                          return;
                                        const nextSoal = tryoutForm.soal.filter(
                                          (_, i) => i !== qIdx
                                        );
                                        setTryoutForm({
                                          ...tryoutForm,
                                          totalSoal: nextSoal.length,
                                          soal: nextSoal,
                                        });
                                        if (openTryoutQuestionIdx >= nextSoal.length) {
                                          setOpenTryoutQuestionIdx(
                                            Math.max(0, nextSoal.length - 1)
                                          );
                                        }
                                      }}
                                      className="p-1.5 rounded-lg bg-rose-950/80 hover:bg-rose-800 text-rose-300 border border-rose-500/40 cursor-pointer"
                                      title="Hapus Soal"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                  {isOpen ? (
                                    <ChevronUp className="w-4 h-4 text-blue-300" />
                                  ) : (
                                    <ChevronDown className="w-4 h-4 text-blue-300" />
                                  )}
                                </div>
                              </div>

                              {/* Body Detail Soal Tryout */}
                              {isOpen && (
                                <div className="p-4 border-t border-blue-800/60 space-y-3.5 bg-[#12264B]">
                                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                    <div>
                                      <label className="block text-[11px] font-semibold text-blue-200 mb-1">
                                        Tipe Soal
                                      </label>
                                      <select
                                        value={qType}
                                        onChange={(e) => {
                                          const newType = e.target.value;
                                          const next = [...tryoutForm.soal];
                                          const currentOpts =
                                            Array.isArray(q.options) &&
                                            q.options.length > 0
                                              ? q.options
                                              : [
                                                  'Pilihan A',
                                                  'Pilihan B',
                                                  'Pilihan C',
                                                  'Pilihan D',
                                                ];
                                          next[qIdx] = {
                                            ...next[qIdx],
                                            type: newType,
                                            options: currentOpts,
                                            answer:
                                              newType === 'mcma'
                                                ? [currentOpts[0]]
                                                : newType === 'isian'
                                                ? ''
                                                : currentOpts[0],
                                            answerIndex: 0,
                                            statements:
                                              Array.isArray(q.statements) &&
                                              q.statements.length > 0
                                                ? q.statements
                                                : [
                                                    {
                                                      text: 'Pernyataan 1',
                                                      answer: true,
                                                    },
                                                    {
                                                      text: 'Pernyataan 2',
                                                      answer: false,
                                                    },
                                                  ],
                                          };
                                          setTryoutForm({
                                            ...tryoutForm,
                                            soal: next,
                                          });
                                        }}
                                        className="w-full px-3 py-1.5 rounded-lg bg-[#0F2042] border border-blue-500/40 text-white text-xs font-semibold"
                                      >
                                        <option value="mcq">
                                          Pilihan Ganda Tunggal (MCQ)
                                        </option>
                                        <option value="mcma">
                                          Pilihan Ganda Kompleks (MCMA)
                                        </option>
                                        <option value="category">
                                          Benar / Salah (Kategori)
                                        </option>
                                        <option value="isian">
                                          Isian Singkat
                                        </option>
                                      </select>
                                    </div>

                                    <div>
                                      <label className="block text-[11px] font-semibold text-blue-200 mb-1">
                                        Tingkat Kesulitan
                                      </label>
                                      <select
                                        value={q.kesulitan || 'Sedang'}
                                        onChange={(e) => {
                                          const val = e.target.value;
                                          const next = [...tryoutForm.soal];
                                          next[qIdx] = {
                                            ...next[qIdx],
                                            kesulitan: val,
                                            level:
                                              val === 'Mudah'
                                                ? 1
                                                : val === 'HOTS'
                                                ? 5
                                                : 3,
                                          };
                                          setTryoutForm({
                                            ...tryoutForm,
                                            soal: next,
                                          });
                                        }}
                                        className="w-full px-3 py-1.5 rounded-lg bg-[#0F2042] border border-blue-500/40 text-white text-xs font-semibold"
                                      >
                                        <option value="Mudah">Mudah</option>
                                        <option value="Sedang">Sedang</option>
                                        <option value="HOTS">HOTS (Menantang)</option>
                                      </select>
                                    </div>

                                    <div>
                                      <label className="block text-[11px] font-semibold text-blue-200 mb-1">
                                        Indikator Kompetensi (Opsional)
                                      </label>
                                      <input
                                        type="text"
                                        value={q.indicator || ''}
                                        onChange={(e) => {
                                          const next = [...tryoutForm.soal];
                                          next[qIdx] = {
                                            ...next[qIdx],
                                            indicator: e.target.value,
                                          };
                                          setTryoutForm({
                                            ...tryoutForm,
                                            soal: next,
                                          });
                                        }}
                                        placeholder="Contoh: Menghitung skala peta..."
                                        className="w-full px-3 py-1.5 rounded-lg bg-[#0F2042] border border-blue-500/40 text-white text-xs"
                                      />
                                    </div>
                                  </div>

                                  <div>
                                    <label className="block text-[11px] font-semibold text-blue-200 mb-1">
                                      Teks Stimulus / Bacaan Cerita (Kosongkan jika tidak ada)
                                    </label>
                                    <RichTextEditor
                                      rows={2}
                                      value={q.stimulus || ''}
                                      onChange={(e) => {
                                        const next = [...tryoutForm.soal];
                                        next[qIdx] = {
                                          ...next[qIdx],
                                          stimulus: e.target.value,
                                        };
                                        setTryoutForm({
                                          ...tryoutForm,
                                          soal: next,
                                        });
                                      }}
                                      bgClass="bg-[#0F2042]"
                                      placeholder="Tulis teks stimulus atau bacaan cerita..."
                                    />
                                  </div>

                                  <div>
                                    <label className="block text-[11px] font-semibold text-blue-200 mb-1">
                                      Pertanyaan Soal *
                                    </label>
                                    <RichTextEditor
                                      rows={3}
                                      value={q.question || ''}
                                      onChange={(e) => {
                                        const next = [...tryoutForm.soal];
                                        next[qIdx] = {
                                          ...next[qIdx],
                                          question: e.target.value,
                                        };
                                        setTryoutForm({
                                          ...tryoutForm,
                                          soal: next,
                                        });
                                      }}
                                      bgClass="bg-[#0F2042]"
                                      placeholder="Tulis pertanyaan soal tryout di sini..."
                                    />
                                  </div>

                                  {/* Opsi Jawaban untuk MCQ */}
                                  {qType === 'mcq' && (
                                    <div className="space-y-2.5">
                                      <label className="block text-[11px] font-semibold text-amber-300">
                                        Pilihan Jawaban (Klik bulatan radio untuk Kunci Jawaban • Mendukung teks, rumus, &amp; gambar)
                                      </label>
                                      {(q.options || ['', '', '', '']).map(
                                        (opt, oIdx) => {
                                          const isCorrect =
                                            typeof q.answerIndex === 'number'
                                              ? q.answerIndex === oIdx
                                              : q.answer === opt;
                                          return (
                                            <div
                                              key={oIdx}
                                              className={`p-2.5 rounded-xl border space-y-2 ${
                                                isCorrect
                                                  ? 'bg-emerald-950/60 border-emerald-400'
                                                  : 'bg-[#0F2042] border-blue-500/30'
                                              }`}
                                            >
                                              <label className="flex items-center space-x-2 cursor-pointer">
                                                <input
                                                  type="radio"
                                                  name={`tryout_mcq_${qIdx}`}
                                                  checked={isCorrect}
                                                  onChange={() => {
                                                    const next = [
                                                      ...tryoutForm.soal,
                                                    ];
                                                    next[qIdx] = {
                                                      ...next[qIdx],
                                                      answer: opt,
                                                      answerIndex: oIdx,
                                                    };
                                                    setTryoutForm({
                                                      ...tryoutForm,
                                                      soal: next,
                                                    });
                                                  }}
                                                  className="cursor-pointer"
                                                />
                                                <span className="text-xs font-bold text-blue-300">
                                                  Pilihan {String.fromCharCode(65 + oIdx)}
                                                </span>
                                                {isCorrect && (
                                                  <span className="px-1.5 py-0.5 rounded bg-emerald-600/90 text-white text-[10px] font-bold">
                                                    Kunci Jawaban Benar
                                                  </span>
                                                )}
                                              </label>
                                              <RichTextEditor
                                                compact
                                                rows={1}
                                                value={opt || ''}
                                                onChange={(e) => {
                                                  const newVal = e.target.value;
                                                  const next = [
                                                    ...tryoutForm.soal,
                                                  ];
                                                  const nextOpts = [
                                                    ...(next[qIdx].options ||
                                                      []),
                                                  ];
                                                  const wasCorrect =
                                                    typeof next[qIdx]
                                                      .answerIndex === 'number'
                                                      ? next[qIdx]
                                                          .answerIndex === oIdx
                                                      : next[qIdx].answer ===
                                                        opt;
                                                  nextOpts[oIdx] = newVal;
                                                  next[qIdx] = {
                                                    ...next[qIdx],
                                                    options: nextOpts,
                                                    ...(wasCorrect && {
                                                      answer: newVal,
                                                      answerIndex: oIdx,
                                                    }),
                                                  };
                                                  setTryoutForm({
                                                    ...tryoutForm,
                                                    soal: next,
                                                  });
                                                }}
                                                bgClass="bg-[#162E5B]"
                                                placeholder={`Tulis jawaban ${String.fromCharCode(65 + oIdx)} atau klik tombol Gambar / Ctrl+V...`}
                                              />
                                            </div>
                                          );
                                        }
                                      )}
                                    </div>
                                  )}

                                  {/* Opsi Jawaban untuk MCMA */}
                                  {qType === 'mcma' && (
                                    <div className="space-y-2.5">
                                      <label className="block text-[11px] font-semibold text-amber-300">
                                        Pilihan Jawaban Kompleks (Centang semua kunci jawaban benar • Mendukung gambar)
                                      </label>
                                      {(q.options || ['', '', '', '']).map(
                                        (opt, oIdx) => {
                                          const currentCorrect = Array.isArray(
                                            q.answer
                                          )
                                            ? q.answer
                                            : [];
                                          const isChecked =
                                            currentCorrect.includes(opt);
                                          return (
                                            <div
                                              key={oIdx}
                                              className={`p-2.5 rounded-xl border space-y-2 ${
                                                isChecked
                                                  ? 'bg-emerald-950/60 border-emerald-400'
                                                  : 'bg-[#0F2042] border-blue-500/30'
                                              }`}
                                            >
                                              <label className="flex items-center space-x-2 cursor-pointer">
                                                <input
                                                  type="checkbox"
                                                  checked={isChecked}
                                                  onChange={(e) => {
                                                    const next = [
                                                      ...tryoutForm.soal,
                                                    ];
                                                    const nextCorrect = e.target
                                                      .checked
                                                      ? [...currentCorrect, opt]
                                                      : currentCorrect.filter(
                                                          (item) => item !== opt
                                                        );
                                                    next[qIdx] = {
                                                      ...next[qIdx],
                                                      answer: nextCorrect,
                                                    };
                                                    setTryoutForm({
                                                      ...tryoutForm,
                                                      soal: next,
                                                    });
                                                  }}
                                                  className="cursor-pointer"
                                                />
                                                <span className="text-xs font-bold text-blue-300">
                                                  Pilihan {String.fromCharCode(65 + oIdx)}
                                                </span>
                                                {isChecked && (
                                                  <span className="px-1.5 py-0.5 rounded bg-emerald-600/90 text-white text-[10px] font-bold">
                                                    Termasuk Kunci Benar
                                                  </span>
                                                )}
                                              </label>
                                              <RichTextEditor
                                                compact
                                                rows={1}
                                                value={opt || ''}
                                                onChange={(e) => {
                                                  const newVal = e.target.value;
                                                  const next = [
                                                    ...tryoutForm.soal,
                                                  ];
                                                  const nextOpts = [
                                                    ...(next[qIdx].options ||
                                                      []),
                                                  ];
                                                  nextOpts[oIdx] = newVal;
                                                  const nextCorrect =
                                                    currentCorrect.map((c) =>
                                                      c === opt ? newVal : c
                                                    );
                                                  next[qIdx] = {
                                                    ...next[qIdx],
                                                    options: nextOpts,
                                                    answer: nextCorrect,
                                                  };
                                                  setTryoutForm({
                                                    ...tryoutForm,
                                                    soal: next,
                                                  });
                                                }}
                                                bgClass="bg-[#162E5B]"
                                                placeholder={`Tulis jawaban ${String.fromCharCode(65 + oIdx)} atau sisipkan gambar...`}
                                              />
                                            </div>
                                          );
                                        }
                                      )}
                                    </div>
                                  )}

                                  {/* Pernyataan Benar / Salah untuk Category */}
                                  {qType === 'category' && (
                                    <div className="space-y-2.5">
                                      <div className="flex items-center justify-between">
                                        <label className="block text-[11px] font-semibold text-amber-300">
                                          Daftar Pernyataan Benar / Salah (Mendukung teks, rumus, &amp; gambar)
                                        </label>
                                        <button
                                          type="button"
                                          onClick={() => {
                                            const next = [...tryoutForm.soal];
                                            const stmts = Array.isArray(
                                              q.statements
                                            )
                                              ? [...q.statements]
                                              : [];
                                            stmts.push({
                                              text: 'Pernyataan baru...',
                                              answer: true,
                                            });
                                            next[qIdx] = {
                                              ...next[qIdx],
                                              statements: stmts,
                                            };
                                            setTryoutForm({
                                              ...tryoutForm,
                                              soal: next,
                                            });
                                          }}
                                          className="text-[11px] font-bold text-blue-300 hover:text-white flex items-center space-x-1 cursor-pointer"
                                        >
                                          <Plus className="w-3 h-3" />
                                          <span>Tambah Pernyataan</span>
                                        </button>
                                      </div>

                                      {(q.statements || []).map(
                                        (stmt, sIdx) => (
                                          <div
                                            key={sIdx}
                                            className="p-2.5 rounded-xl bg-[#0F2042] border border-blue-500/30 space-y-2"
                                          >
                                            <div className="flex items-center justify-between gap-2">
                                              <span className="text-[11px] font-bold text-blue-300">
                                                Pernyataan #{sIdx + 1}
                                              </span>
                                              <div className="flex items-center space-x-2">
                                                <button
                                                  type="button"
                                                  onClick={() => {
                                                    const next = [
                                                      ...tryoutForm.soal,
                                                    ];
                                                    const stmts = [
                                                      ...(next[qIdx]
                                                        .statements || []),
                                                    ];
                                                    stmts[sIdx] = {
                                                      ...stmts[sIdx],
                                                      answer:
                                                        !stmts[sIdx].answer,
                                                    };
                                                    next[qIdx] = {
                                                      ...next[qIdx],
                                                      statements: stmts,
                                                    };
                                                    setTryoutForm({
                                                      ...tryoutForm,
                                                      soal: next,
                                                    });
                                                  }}
                                                  className={`px-2.5 py-1 rounded text-[11px] font-bold cursor-pointer ${
                                                    stmt.answer
                                                      ? 'bg-emerald-600 text-white'
                                                      : 'bg-rose-600 text-white'
                                                  }`}
                                                >
                                                  Kunci: {stmt.answer ? 'Benar' : 'Salah'}
                                                </button>
                                                {(q.statements || []).length >
                                                  1 && (
                                                  <button
                                                    type="button"
                                                    onClick={() => {
                                                      const next = [
                                                        ...tryoutForm.soal,
                                                      ];
                                                      const stmts = (
                                                        next[qIdx].statements ||
                                                        []
                                                      ).filter(
                                                        (_, i) => i !== sIdx
                                                      );
                                                      next[qIdx] = {
                                                        ...next[qIdx],
                                                        statements: stmts,
                                                      };
                                                      setTryoutForm({
                                                        ...tryoutForm,
                                                        soal: next,
                                                      });
                                                    }}
                                                    className="text-rose-400 hover:text-rose-200 cursor-pointer"
                                                    title="Hapus Pernyataan"
                                                  >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                  </button>
                                                )}
                                              </div>
                                            </div>
                                            <RichTextEditor
                                              compact
                                              rows={1}
                                              value={stmt.text || ''}
                                              onChange={(e) => {
                                                const next = [
                                                  ...tryoutForm.soal,
                                                ];
                                                const stmts = [
                                                  ...(next[qIdx].statements ||
                                                    []),
                                                ];
                                                stmts[sIdx] = {
                                                  ...stmts[sIdx],
                                                  text: e.target.value,
                                                };
                                                next[qIdx] = {
                                                  ...next[qIdx],
                                                  statements: stmts,
                                                };
                                                setTryoutForm({
                                                  ...tryoutForm,
                                                  soal: next,
                                                });
                                              }}
                                              bgClass="bg-[#162E5B]"
                                              placeholder={`Tulis pernyataan #${sIdx + 1} atau sisipkan gambar...`}
                                            />
                                          </div>
                                        )
                                      )}
                                    </div>
                                  )}

                                  {/* Kunci Jawaban untuk Isian Singkat */}
                                  {qType === 'isian' && (
                                    <div>
                                      <label className="block text-[11px] font-semibold text-amber-300 mb-1">
                                        Kunci Jawaban Isian Singkat *
                                      </label>
                                      <input
                                        type="text"
                                        value={
                                          typeof q.answer === 'string'
                                            ? q.answer
                                            : ''
                                        }
                                        onChange={(e) => {
                                          const next = [...tryoutForm.soal];
                                          next[qIdx] = {
                                            ...next[qIdx],
                                            answer: e.target.value,
                                          };
                                          setTryoutForm({
                                            ...tryoutForm,
                                            soal: next,
                                          });
                                        }}
                                        placeholder="Tulis kunci jawaban singkat yang tepat..."
                                        className="w-full px-3 py-2 rounded-lg bg-[#0F2042] border border-emerald-400/60 text-white text-xs font-semibold"
                                      />
                                    </div>
                                  )}

                                  <div>
                                    <label className="block text-[11px] font-semibold text-blue-200 mb-1">
                                      Penjelasan / Pembahasan Soal
                                    </label>
                                    <RichTextEditor
                                      rows={2}
                                      value={q.explanation || ''}
                                      onChange={(e) => {
                                        const next = [...tryoutForm.soal];
                                        next[qIdx] = {
                                          ...next[qIdx],
                                          explanation: e.target.value,
                                        };
                                        setTryoutForm({
                                          ...tryoutForm,
                                          soal: next,
                                        });
                                      }}
                                      bgClass="bg-[#0F2042]"
                                      placeholder="Tulis penjelasan / pembahasan lengkap soal tryout..."
                                    />
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      <div className="pt-2 flex justify-end">
                        <button
                          type="submit"
                          disabled={isSaving}
                          className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 disabled:opacity-60 text-white text-xs font-bold flex items-center space-x-1.5 transition-all cursor-pointer shadow-md"
                        >
                          {isSaving ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              <span>Menyimpan...</span>
                            </>
                          ) : (
                            <>
                              <Save className="w-4 h-4" />
                              <span>Simpan Paket Tryout</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </form>
                )}
              </>
            )}
          </div>
        </div>
      </main>

      {/* MODAL TAMBAH / EDIT MATA PELAJARAN (MAPEL WAJIB / MAPEL PILIHAN) */}
      {isSubjectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm overflow-y-auto navy-scrollbar animate-fade-in">
          <div className="bg-[#162E5B] text-white rounded-2xl border-2 border-blue-400 shadow-2xl max-w-md w-full overflow-hidden relative my-auto">
            <div className="p-4 sm:p-5 border-b border-blue-800/70 flex items-center justify-between bg-[#0F2042]">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-400/50 text-amber-300 flex items-center justify-center">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    {editingSubjectKey
                      ? 'Edit Mata Pelajaran'
                      : 'Tambah Mata Pelajaran Baru'}
                  </h3>
                  <p className="text-[11px] text-blue-200">
                    Atur nama, kategori (Wajib / Pilihan), dan tema warna mapel
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsSubjectModalOpen(false)}
                className="w-8 h-8 rounded-lg bg-[#162E5B] hover:bg-blue-800 text-blue-200 hover:text-white border border-blue-500/40 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveSubject} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-blue-200 mb-1">
                  Nama Mata Pelajaran *
                </label>
                <input
                  type="text"
                  value={subjectForm.title}
                  onChange={(e) =>
                    setSubjectForm({ ...subjectForm, title: e.target.value })
                  }
                  placeholder="Contoh: IPA (Sains), IPS, Bahasa Inggris, PPKn..."
                  className="w-full px-3 py-2 rounded-xl bg-[#0F2042] border border-blue-500/50 text-white text-xs sm:text-sm font-semibold placeholder-blue-300/40 focus:outline-none focus:border-blue-300"
                  required
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-blue-200 mb-1.5">
                  Kategori Mata Pelajaran *
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    disabled={DEFAULT_SUBJECT_KEYS.includes(editingSubjectKey)}
                    onClick={() =>
                      setSubjectForm({ ...subjectForm, category: 'pilihan' })
                    }
                    className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center text-center transition-all cursor-pointer ${
                      subjectForm.category === 'pilihan'
                        ? 'bg-emerald-700 border-emerald-300 text-white shadow-sm'
                        : 'bg-[#0F2042] border-blue-500/30 text-blue-200 hover:text-white'
                    } ${
                      DEFAULT_SUBJECT_KEYS.includes(editingSubjectKey)
                        ? 'opacity-50 cursor-not-allowed'
                        : ''
                    }`}
                  >
                    <span className='teks-[20px] font-bold mt-1'>Mapel Pilihan</span>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setSubjectForm({ ...subjectForm, category: 'wajib' })
                    }
                    className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center text-center transition-all cursor-pointer ${
                      subjectForm.category === 'wajib'
                        ? 'bg-amber-600 border-amber-300 text-white shadow-sm'
                        : 'bg-[#0F2042] border-blue-500/30 text-blue-200 hover:text-white'
                    }`}
                  >
                    <span className='teks-[20px] font-bold mt-1'>Mapel Wajib</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-blue-200 mb-1.5">
                  Tema Warna Kartu Mapel
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {Object.values(SUBJECT_COLOR_THEMES).map((themeItem) => {
                    const isSelected = subjectForm.colorTheme === themeItem.id;
                    return (
                      <button
                        key={themeItem.id}
                        type="button"
                        onClick={() =>
                          setSubjectForm({
                            ...subjectForm,
                            colorTheme: themeItem.id,
                          })
                        }
                        className={`p-2 rounded-xl border text-[11px] font-bold flex items-center space-x-2 transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-[#1E3A8A] border-white text-white ring-2 ring-blue-300/40'
                            : 'bg-[#0F2042] border-blue-500/30 text-blue-200 hover:text-white'
                        }`}
                      >
                        <span
                          className="w-3.5 h-3.5 rounded-full flex-shrink-0 border border-white/60"
                          style={{ backgroundColor: themeItem.primaryHex }}
                        />
                        <span className="truncate">{themeItem.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-blue-200 mb-1">
                  Deskripsi Singkat Mata Pelajaran
                </label>
                <textarea
                  rows={2}
                  value={subjectForm.deskripsi}
                  onChange={(e) =>
                    setSubjectForm({
                      ...subjectForm,
                      deskripsi: e.target.value,
                    })
                  }
                  placeholder="Ringkasan topik yang dipelajari pada mata pelajaran ini..."
                  className="w-full px-3 py-2 rounded-xl bg-[#0F2042] border border-blue-500/50 text-white text-xs placeholder-blue-300/40 focus:outline-none focus:border-blue-300 navy-scrollbar"
                />
              </div>

              {!editingSubjectKey && (
                <label className="flex items-start space-x-2.5 p-3 rounded-xl bg-[#0F2042] border border-blue-500/30 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={subjectForm.seedStarterContent}
                    onChange={(e) =>
                      setSubjectForm({
                        ...subjectForm,
                        seedStarterContent: e.target.checked,
                      })
                    }
                    className="mt-0.5 cursor-pointer"
                  />
                  <div className="text-xs">
                    <span className="font-bold text-white block">
                      Buat otomatis Materi 1 & Latihan Level 1 awal
                    </span>
                  </div>
                </label>
              )}

              <div className="pt-2 flex items-center justify-end space-x-2.5">
                <button
                  type="button"
                  onClick={() => setIsSubjectModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-[#0F2042] hover:bg-slate-800 text-blue-200 text-xs font-semibold border border-blue-500/40 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-60 text-slate-950 text-xs font-extrabold flex items-center space-x-1.5 cursor-pointer shadow-md"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4 stroke-[2.5]" />
                      <span>
                        {editingSubjectKey ? 'Simpan Perubahan' : 'Tambah Mapel'}
                      </span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
