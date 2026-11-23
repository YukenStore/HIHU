import React, { useState, useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { isAdminUser, ADMIN_EMAILS } from '../config/adminConfig';
import Navbar from '../components/Navbar';
import { PUSMENDIK_MATERI } from '../data/pusmendikData';
import { PUSMENDIK_LATIHAN } from '../data/latihanData';
import {
  syncCustomContentFromServer,
  saveAdminContentItem,
  resetAdminContentItem,
  isDefaultContentItem,
  hasCustomOverride,
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
} from 'lucide-react';

/**
 * Halaman Khusus Admin Panel TKA SD
 * Hanya dapat diakses oleh akun yang email-nya terdaftar di frontend/src/config/adminConfig.js
 */
const AdminPanel = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // State tab utama: 'materi' | 'latihan'
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

  // State status simpan / notifikasi
  const [isSaving, setIsSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

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

  // Ambil daftar Materi untuk mapel terpilih
  const materiList =
    PUSMENDIK_MATERI[selectedSubject]?.elemen?.flatMap((e) => e.bab) || [];

  // Ambil daftar Level Latihan untuk mapel terpilih
  const latihanList = PUSMENDIK_LATIHAN[selectedSubject]?.levels || [];

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
    const prefix = selectedSubject === 'matematika' ? 'mtk' : 'bi';
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
    setLatihanForm({
      level: lvl.level,
      namaLevel: lvl.namaLevel || `Level ${lvl.level}`,
      subjudul: lvl.subjudul || '',
      deskripsi: lvl.deskripsi || '',
      targetSoal: Array.isArray(lvl.soal) ? lvl.soal.length : lvl.targetSoal || 5,
      soal: Array.isArray(lvl.soal) ? JSON.parse(JSON.stringify(lvl.soal)) : [],
    });
  };

  // Buat Level Latihan Baru
  const handleCreateNewLatihanLevel = () => {
    const maxLevel = latihanList.reduce(
      (max, l) => Math.max(max, Number(l.level) || 0),
      0
    );
    const nextLevel = maxLevel + 1;
    const prefix = selectedSubject === 'matematika' ? 'mtk' : 'bi';
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
    const prefix = selectedSubject === 'matematika' ? 'mtk' : 'bi';
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
        const foundIdx = opts.findIndex((o) => o === jawabanBenar);
        if (foundIdx !== -1) {
          answerIndex = foundIdx;
        } else if (typeof answerIndex === 'number' && opts[answerIndex] !== undefined) {
          jawabanBenar = opts[answerIndex];
        } else {
          answerIndex = 0;
          jawabanBenar = opts[0] || '';
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
              <span>Mode Pengelola Konten Web (Tersembunyi dari Siswa)</span>
            </div>
            <h1 className="text-lg sm:text-2xl font-bold text-white tracking-tight">
              Admin Panel Materi & Latihan Soal
            </h1>
            <p className="text-xs text-blue-200">
              Buat atau edit materi pelajaran beserta latihan soal langsung dari web. Daftar admin diatur di{' '}
              <code className="px-1.5 py-0.5 rounded bg-[#0F2042] text-amber-300 font-mono text-[11px]">
                frontend/src/config/adminConfig.js
              </code>{' '}
              ({ADMIN_EMAILS.length} email terdaftar).
            </p>
          </div>

          {/* Tab Switcher: Materi vs Latihan Soal */}
          <div className="flex items-center bg-[#0F2042] p-1.5 rounded-xl border border-blue-500/40 self-start md:self-center flex-shrink-0">
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
          </div>
        </div>

        {/* Layout 2 Kolom: Sidebar Daftar Item (Kiri) & Form Editor (Kanan) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* KOLOM KIRI: Pilihan Mapel & Daftar Materi/Level */}
          <div className="lg:col-span-4 bg-[#162E5B] border-2 border-blue-500/40 rounded-2xl p-4 text-white space-y-4 shadow-lg">
            {/* Pilihan Mata Pelajaran */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setSelectedSubject('matematika');
                  setSelectedMateriId(null);
                  setMateriForm(null);
                  setSelectedLatihanLevel(null);
                  setLatihanForm(null);
                }}
                className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center space-x-1.5 transition-all cursor-pointer ${
                  selectedSubject === 'matematika'
                    ? 'bg-[#881337] border-rose-400 text-white shadow-sm'
                    : 'bg-[#0F2042] border-blue-500/30 text-blue-200 hover:text-white'
                }`}
              >
                <Calculator className="w-3.5 h-3.5" />
                <span>Matematika</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedSubject('bahasa_indonesia');
                  setSelectedMateriId(null);
                  setMateriForm(null);
                  setSelectedLatihanLevel(null);
                  setLatihanForm(null);
                }}
                className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center space-x-1.5 transition-all cursor-pointer ${
                  selectedSubject === 'bahasa_indonesia'
                    ? 'bg-[#047857] border-emerald-400 text-white shadow-sm'
                    : 'bg-[#0F2042] border-blue-500/30 text-blue-200 hover:text-white'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>B. Indonesia</span>
              </button>
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
                      : 'Cari level latihan...'
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
              ) : (
                <button
                  type="button"
                  onClick={handleCreateNewLatihanLevel}
                  className="w-full py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center justify-center space-x-1.5 transition-all cursor-pointer shadow-sm active:scale-98"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tambah Level Latihan Baru</span>
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
              ) : (
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
                          Editor Materi •{' '}
                          {selectedSubject === 'matematika'
                            ? 'Matematika'
                            : 'Bahasa Indonesia'}
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
                        <textarea
                          rows={2}
                          value={materiForm.ringkasan}
                          onChange={(e) =>
                            setMateriForm({
                              ...materiForm,
                              ringkasan: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 rounded-lg bg-[#162E5B] border border-blue-500/50 text-white text-xs focus:outline-none focus:border-blue-300"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-blue-200 mb-1">
                          Tujuan Pembelajaran
                        </label>
                        <textarea
                          rows={2}
                          value={materiForm.tujuan}
                          onChange={(e) =>
                            setMateriForm({ ...materiForm, tujuan: e.target.value })
                          }
                          className="w-full px-3 py-2 rounded-lg bg-[#162E5B] border border-blue-500/50 text-white text-xs focus:outline-none focus:border-blue-300"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-blue-200 mb-1">
                          Konsep Kunci (Gunakan baris baru atau awali dengan &quot;-&gt;&quot; untuk poin)
                        </label>
                        <textarea
                          rows={3}
                          value={materiForm.konsepKunci}
                          onChange={(e) =>
                            setMateriForm({
                              ...materiForm,
                              konsepKunci: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 rounded-lg bg-[#162E5B] border border-blue-500/50 text-white text-xs font-mono focus:outline-none focus:border-blue-300"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-blue-200 mb-1">
                          Tips Juara
                        </label>
                        <input
                          type="text"
                          value={materiForm.tipsJuara}
                          onChange={(e) =>
                            setMateriForm({
                              ...materiForm,
                              tipsJuara: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 rounded-lg bg-[#162E5B] border border-blue-500/50 text-white text-xs focus:outline-none focus:border-blue-300"
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
                              <textarea
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
                                className="w-full px-3 py-1.5 rounded-lg bg-[#0F2042] border border-blue-500/40 text-white text-xs"
                              />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                              <div>
                                <label className="block text-[11px] font-semibold text-blue-200 mb-1">
                                  Kotak Rumus / Pola (Opsional)
                                </label>
                                <input
                                  type="text"
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
                                  className="w-full px-3 py-1.5 rounded-lg bg-[#0F2042] border border-blue-500/40 text-white text-xs"
                                />
                              </div>
                              <div>
                                <label className="block text-[11px] font-semibold text-blue-200 mb-1">
                                  Contoh Penerapan (Opsional)
                                </label>
                                <input
                                  type="text"
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
                                  className="w-full px-3 py-1.5 rounded-lg bg-[#0F2042] border border-blue-500/40 text-white text-xs"
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
                        <textarea
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
                          className="w-full px-3 py-2 rounded-lg bg-[#162E5B] border border-blue-500/50 text-white text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-blue-200 mb-1">
                          Penyelesaian / Pembahasan Contoh Soal
                        </label>
                        <textarea
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
                          className="w-full px-3 py-2 rounded-lg bg-[#162E5B] border border-blue-500/50 text-white text-xs"
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
                              <textarea
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
                                className="w-full px-3 py-1.5 rounded-lg bg-[#0F2042] border border-blue-500/40 text-white text-xs"
                              />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {(q.pilihan || ['', '', '', '']).map((opt, oIdx) => (
                                <div
                                  key={oIdx}
                                  className={`p-2 rounded-lg border flex items-center space-x-2 ${
                                    Number(q.jawabanBenar) === oIdx
                                      ? 'bg-emerald-950/60 border-emerald-400'
                                      : 'bg-[#0F2042] border-blue-500/30'
                                  }`}
                                >
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
                                    {String.fromCharCode(65 + oIdx)}.
                                  </span>
                                  <input
                                    type="text"
                                    value={opt}
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
                                    className="flex-1 bg-transparent text-white text-xs focus:outline-none"
                                    placeholder={`Opsi ${String.fromCharCode(65 + oIdx)}`}
                                  />
                                </div>
                              ))}
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
                          Editor Latihan Soal •{' '}
                          {selectedSubject === 'matematika'
                            ? 'Matematika'
                            : 'Bahasa Indonesia'}
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
                                  <span className="text-xs text-blue-100 truncate">
                                    {q.pertanyaan || '(Pertanyaan belum diisi)'}
                                  </span>
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
                                    <textarea
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
                                      className="w-full px-3 py-1.5 rounded-lg bg-[#0F2042] border border-blue-500/40 text-white text-xs"
                                    />
                                  </div>

                                  <div>
                                    <label className="block text-[11px] font-semibold text-blue-200 mb-1">
                                      Pertanyaan Soal *
                                    </label>
                                    <textarea
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
                                      className="w-full px-3 py-1.5 rounded-lg bg-[#0F2042] border border-blue-500/40 text-white text-xs"
                                    />
                                  </div>

                                  {/* Opsi Jawaban untuk MCQ */}
                                  {qType === 'mcq' && (
                                    <div className="space-y-2">
                                      <label className="block text-[11px] font-semibold text-emerald-300">
                                        Pilihan Jawaban (Klik bulatan radio untuk menentukan Kunci Jawaban Benar)
                                      </label>
                                      {(q.pilihan || ['', '', '', '']).map(
                                        (opt, oIdx) => {
                                          const isCorrect =
                                            q.jawabanBenar === opt ||
                                            q.answerIndex === oIdx;
                                          return (
                                            <div
                                              key={oIdx}
                                              className={`p-2 rounded-lg border flex items-center space-x-2 ${
                                                isCorrect
                                                  ? 'bg-emerald-950/60 border-emerald-400'
                                                  : 'bg-[#0F2042] border-blue-500/30'
                                              }`}
                                            >
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
                                                {String.fromCharCode(65 + oIdx)}.
                                              </span>
                                              <input
                                                type="text"
                                                value={opt}
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
                                                    next[qIdx].jawabanBenar ===
                                                      opt ||
                                                    next[qIdx].answerIndex ===
                                                      oIdx;
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
                                                className="flex-1 bg-transparent text-white text-xs focus:outline-none"
                                              />
                                            </div>
                                          );
                                        }
                                      )}
                                    </div>
                                  )}

                                  {/* Opsi Jawaban untuk MCMA */}
                                  {qType === 'mcma' && (
                                    <div className="space-y-2">
                                      <label className="block text-[11px] font-semibold text-emerald-300">
                                        Pilihan Jawaban Kompleks (Centang semua kunci jawaban yang benar)
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
                                              className={`p-2 rounded-lg border flex items-center space-x-2 ${
                                                isChecked
                                                  ? 'bg-emerald-950/60 border-emerald-400'
                                                  : 'bg-[#0F2042] border-blue-500/30'
                                              }`}
                                            >
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
                                                {String.fromCharCode(65 + oIdx)}.
                                              </span>
                                              <input
                                                type="text"
                                                value={opt}
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
                                                className="flex-1 bg-transparent text-white text-xs focus:outline-none"
                                              />
                                            </div>
                                          );
                                        }
                                      )}
                                    </div>
                                  )}

                                  {/* Pernyataan Benar / Salah untuk Category */}
                                  {qType === 'category' && (
                                    <div className="space-y-2">
                                      <div className="flex items-center justify-between">
                                        <label className="block text-[11px] font-semibold text-emerald-300">
                                          Daftar Pernyataan Benar / Salah
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
                                            className="p-2 rounded-lg bg-[#0F2042] border border-blue-500/30 flex items-center gap-2"
                                          >
                                            <input
                                              type="text"
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
                                              className="flex-1 bg-transparent text-white text-xs focus:outline-none"
                                            />
                                            <button
                                              type="button"
                                              onClick={() => {
                                                const next = [
                                                  ...latihanForm.soal,
                                                ];
                                                const stmts = [
                                                  ...(next[qIdx].statements ||
                                                    []),
                                                ];
                                                stmts[sIdx] = {
                                                  ...stmts[sIdx],
                                                  answer: !stmts[sIdx].answer,
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
                                              {stmt.answer ? 'Benar' : 'Salah'}
                                            </button>
                                            {(q.statements || []).length > 1 && (
                                              <button
                                                type="button"
                                                onClick={() => {
                                                  const next = [
                                                    ...latihanForm.soal,
                                                  ];
                                                  const stmts = (
                                                    next[qIdx].statements || []
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
                                              >
                                                <Trash2 className="w-3.5 h-3.5" />
                                              </button>
                                            )}
                                          </div>
                                        )
                                      )}
                                    </div>
                                  )}

                                  <div>
                                    <label className="block text-[11px] font-semibold text-blue-200 mb-1">
                                      Penjelasan / Pembahasan Soal
                                    </label>
                                    <textarea
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
                                      className="w-full px-3 py-1.5 rounded-lg bg-[#0F2042] border border-blue-500/40 text-white text-xs"
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
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminPanel;
