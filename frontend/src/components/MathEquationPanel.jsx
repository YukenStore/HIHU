import React, { useState, useEffect, useRef } from 'react';
import katex from 'katex';
import {
  Sigma,
  X,
  Check,
  Trash2,
  Sparkles,
  Calculator,
  Eraser,
} from 'lucide-react';

/**
 * Daftar Operator Matematika untuk Pembuat Perbandingan / Operasi Pecahan
 */
const FRACTION_OPS = [
  { label: '+', tex: '+' },
  { label: '−', tex: '-' },
  { label: '×', tex: '\\times' },
  { label: '÷', tex: '\\div' },
  { label: '=', tex: '=' },
  { label: '<', tex: '<' },
  { label: '>', tex: '>' },
  { label: '≤', tex: '\\le' },
  { label: '≥', tex: '\\ge' },
  { label: '≠', tex: '\\neq' },
];

/**
 * Tombol Simbol 1-Klik untuk Mode Rumus Bebas (Tanpa perlu hafal kode LaTeX)
 */
const MATH_SYMBOL_GROUPS = [
  {
    title: 'Operasi & Banding',
    items: [
      { label: '×', title: 'Kali', insert: ' \\times ' },
      { label: '÷', title: 'Bagi', insert: ' \\div ' },
      { label: '+', title: 'Tambah', insert: ' + ' },
      { label: '−', title: 'Kurang', insert: ' - ' },
      { label: '=', title: 'Sama dengan', insert: ' = ' },
      { label: '≠', title: 'Tidak sama', insert: ' \\neq ' },
      { label: '<', title: 'Lebih kecil', insert: ' < ' },
      { label: '>', title: 'Lebih besar', insert: ' > ' },
      { label: '≤', title: 'Lebih kecil / sama', insert: ' \\le ' },
      { label: '≥', title: 'Lebih besar / sama', insert: ' \\ge ' },
      { label: '±', title: 'Plus Minus', insert: ' \\pm ' },
      { label: '≈', title: 'Kira-kira', insert: ' \\approx ' },
    ],
  },
  {
    title: 'Struktur Pecahan, Pangkat, Akar',
    items: [
      { label: 'a/b', title: 'Pecahan', insert: '\\frac{1}{2}' },
      { label: 'c a/b', title: 'Pecahan Campuran', insert: '1\\frac{1}{2}' },
      { label: 'x²', title: 'Kuadrat (Pangkat 2)', insert: '^2' },
      { label: 'x³', title: 'Kubik (Pangkat 3)', insert: '^3' },
      { label: 'xⁿ', title: 'Pangkat Bebas', insert: '^{n}' },
      { label: '√x', title: 'Akar Kuadrat', insert: '\\sqrt{16}' },
      { label: '∛x', title: 'Akar Pangkat 3', insert: '\\sqrt[3]{27}' },
      { label: '( ... )', title: 'Tanda Kurung Besar', insert: '\\left(  \\right)' },
    ],
  },
  {
    title: 'Geometri & Satuan SD',
    items: [
      { label: '°', title: 'Derajat', insert: '^\\circ' },
      { label: '∠', title: 'Sudut', insert: '\\angle ' },
      { label: 'π', title: 'Pi', insert: '\\pi' },
      { label: '△', title: 'Segitiga', insert: '\\triangle ' },
      { label: '⊥', title: 'Tegak Lurus', insert: ' \\perp ' },
      { label: '∥', title: 'Sejajar', insert: ' \\parallel ' },
      { label: 'cm²', title: 'Sentimeter Persegi', insert: '\\text{ cm}^2' },
      { label: 'cm³', title: 'Sentimeter Kubik', insert: '\\text{ cm}^3' },
      { label: 'm²', title: 'Meter Persegi', insert: '\\text{ m}^2' },
      { label: 'm³', title: 'Meter Kubik', insert: '\\text{ m}^3' },
      { label: '%', title: 'Persen', insert: '\\%' },
      { label: ':', title: 'Rasio / Banding', insert: ' : ' },
    ],
  },
];

/**
 * Template Rumus Matematika SD Siap Pakai (1 Klik Langsung Jadi)
 */
const SD_MATH_TEMPLATES = [
  { label: 'Luas Persegi', tex: 'L = s \\times s' },
  { label: 'Luas Persegi Panjang', tex: 'L = p \\times l' },
  { label: 'Luas Segitiga', tex: 'L = \\frac{1}{2} \\times a \\times t' },
  { label: 'Luas Lingkaran', tex: 'L = \\pi \\times r^2' },
  { label: 'Keliling Lingkaran', tex: 'K = 2 \\times \\pi \\times r' },
  { label: 'Volume Kubus', tex: 'V = s^3' },
  { label: 'Volume Balok', tex: 'V = p \\times l \\times t' },
  { label: 'Volume Tabung', tex: 'V = \\pi \\times r^2 \\times t' },
  { label: 'Skala Peta', tex: '\\text{Skala} = \\frac{\\text{JP}}{\\text{JS}}' },
  { label: 'Kecepatan', tex: 'v = \\frac{s}{t}' },
  { label: 'Pecahan Senilai', tex: '\\frac{2}{5} = \\frac{4}{10}' },
  { label: 'Rata-rata', tex: '\\bar{x} = \\frac{\\text{Jumlah Data}}{\\text{Banyak Data}}' },
];

/**
 * Mencoba mengenali struktur rumus sederhana (pecahan, campuran, perbandingan, pangkat, akar)
 * agar ketika Admin mengklik rumus yang sudah ada, kotak isian visual langsung terisi otomatis!
 */
const parseInitialTexToVisual = (rawTex = '') => {
  const tex = rawTex.trim();
  if (!tex) {
    return { mode: 'pecahan', fields: { num: '1', den: '2' } };
  }

  // 1. Pecahan tunggal: \frac{a}{b}
  const singleFrac = tex.match(/^\\frac\{([^{}]+)\}\{([^{}]+)\}$/);
  if (singleFrac) {
    return {
      mode: 'pecahan',
      fields: { num: singleFrac[1].trim(), den: singleFrac[2].trim() },
    };
  }

  // 2. Pecahan campuran: c\frac{a}{b}
  const mixedFrac = tex.match(/^([^{}\s\\]+)\s*\\frac\{([^{}]+)\}\{([^{}]+)\}$/);
  if (mixedFrac) {
    return {
      mode: 'campuran',
      fields: {
        whole: mixedFrac[1].trim(),
        num: mixedFrac[2].trim(),
        den: mixedFrac[3].trim(),
      },
    };
  }

  // 3. Operasi / Perbandingan 2 Pecahan: \frac{a}{b} op \frac{c}{d}
  const compFrac = tex.match(
    /^\\frac\{([^{}]+)\}\{([^{}]+)\}\s*([+\-=<>]|\\times|\\div|\\le|\\ge|\\neq)\s*\\frac\{([^{}]+)\}\{([^{}]+)\}$/
  );
  if (compFrac) {
    return {
      mode: 'operasi_pecahan',
      fields: {
        num1: compFrac[1].trim(),
        den1: compFrac[2].trim(),
        op: compFrac[3].trim(),
        num2: compFrac[4].trim(),
        den2: compFrac[5].trim(),
      },
    };
  }

  // 4. Pangkat: a^{b} atau a^b
  const powMatch = tex.match(/^([^{}\s\\^]+)\^\{?([^{}\s]+)\}?$/);
  if (powMatch && powMatch[2] !== '\\circ') {
    return {
      mode: 'pangkat',
      fields: { base: powMatch[1].trim(), exp: powMatch[2].trim() },
    };
  }

  // 5. Akar: \sqrt{a} atau \sqrt[3]{a}
  const rootMatch = tex.match(/^\\sqrt(?:\[([^\]]+)\])?\{([^{}]+)\}$/);
  if (rootMatch) {
    return {
      mode: 'akar',
      fields: {
        rootIdx: (rootMatch[1] || '2').trim(),
        radicand: rootMatch[2].trim(),
      },
    };
  }

  // Selain pola di atas -> buka di mode Editor Bebas + Simbol Visual
  return { mode: 'bebas', fields: { freeTex: tex } };
};

const renderKatexPreview = (tex, displayMode = false) => {
  if (!tex || !tex.trim()) return '';
  try {
    return katex.renderToString(tex.trim(), {
      displayMode,
      throwOnError: false,
    });
  } catch {
    return tex;
  }
};

/**
 * Panel Pembuat & Editor Rumus Matematika Visual untuk Admin Panel
 * Memudahkan admin menuliskan pecahan, pecahan campuran, pangkat, akar, perbandingan,
 * dan rumus SD tanpa perlu mengetik kode LaTeX secara manual.
 */
const MathEquationPanel = ({
  initialTex = '',
  initialDisplay = false,
  isEditing = false,
  onInsert,
  onDelete,
  onClose,
}) => {
  const parsed = parseInitialTexToVisual(initialTex);

  const [builderMode, setBuilderMode] = useState(parsed.mode);
  const [isDisplayBlock, setIsDisplayBlock] = useState(Boolean(initialDisplay));

  // Field Mode 1: Pecahan Biasa
  const [num, setNum] = useState(parsed.fields.num || '2');
  const [den, setDen] = useState(parsed.fields.den || '5');

  // Field Mode 2: Pecahan Campuran
  const [whole, setWhole] = useState(parsed.fields.whole || '3');
  const [mixNum, setMixNum] = useState(parsed.fields.num || '1');
  const [mixDen, setMixDen] = useState(parsed.fields.den || '2');

  // Field Mode 3: Operasi / Perbandingan Pecahan
  const [num1, setNum1] = useState(parsed.fields.num1 || '2');
  const [den1, setDen1] = useState(parsed.fields.den1 || '5');
  const [fracOp, setFracOp] = useState(parsed.fields.op || '<');
  const [num2, setNum2] = useState(parsed.fields.num2 || '3');
  const [den2, setDen2] = useState(parsed.fields.den2 || '5');

  // Field Mode 4: Pangkat
  const [powBase, setPowBase] = useState(parsed.fields.base || '5');
  const [powExp, setPowExp] = useState(parsed.fields.exp || '2');

  // Field Mode 5: Akar
  const [rootIdx, setRootIdx] = useState(parsed.fields.rootIdx || '2');
  const [radicand, setRadicand] = useState(parsed.fields.radicand || '64');

  // Field Mode 6: Editor Bebas + Simbol 1-Klik
  const [freeTex, setFreeTex] = useState(
    parsed.fields.freeTex || initialTex || ''
  );
  const freeInputRef = useRef(null);

  // Sinkronkan ketika admin mengklik rumus lain di dalam editor
  useEffect(() => {
    const p = parseInitialTexToVisual(initialTex);
    setBuilderMode(p.mode);
    setIsDisplayBlock(Boolean(initialDisplay));
    if (p.mode === 'pecahan') {
      setNum(p.fields.num);
      setDen(p.fields.den);
    } else if (p.mode === 'campuran') {
      setWhole(p.fields.whole);
      setMixNum(p.fields.num);
      setMixDen(p.fields.den);
    } else if (p.mode === 'operasi_pecahan') {
      setNum1(p.fields.num1);
      setDen1(p.fields.den1);
      setFracOp(p.fields.op);
      setNum2(p.fields.num2);
      setDen2(p.fields.den2);
    } else if (p.mode === 'pangkat') {
      setPowBase(p.fields.base);
      setPowExp(p.fields.exp);
    } else if (p.mode === 'akar') {
      setRootIdx(p.fields.rootIdx);
      setRadicand(p.fields.radicand);
    }
    setFreeTex(initialTex || '');
  }, [initialTex, initialDisplay]);

  // Bangun string LaTeX akhir dari mode aktif
  const buildCurrentTex = () => {
    switch (builderMode) {
      case 'pecahan':
        return `\\frac{${num.trim() || '1'}}{${den.trim() || '2'}}`;
      case 'campuran':
        return `${whole.trim() || '1'}\\frac{${mixNum.trim() || '1'}}{${mixDen.trim() || '2'}}`;
      case 'operasi_pecahan':
        return `\\frac{${num1.trim() || '1'}}{${den1.trim() || '2'}} ${fracOp} \\frac{${num2.trim() || '1'}}{${den2.trim() || '2'}}`;
      case 'pangkat':
        return `${powBase.trim() || '2'}^{${powExp.trim() || '2'}}`;
      case 'akar':
        return rootIdx && rootIdx !== '2'
          ? `\\sqrt[${rootIdx.trim()}]{${radicand.trim() || '27'}}`
          : `\\sqrt{${radicand.trim() || '16'}}`;
      case 'bebas':
      default:
        return freeTex.trim();
    }
  };

  const currentTex = buildCurrentTex();
  const previewHtml = renderKatexPreview(currentTex, isDisplayBlock);

  // Sisipkan simbol ke dalam kotak Editor Bebas pada posisi kursor
  const handleAppendSymbolToFree = (snippet) => {
    const inputEl = freeInputRef.current;
    if (inputEl && typeof inputEl.selectionStart === 'number') {
      const start = inputEl.selectionStart;
      const end = inputEl.selectionEnd;
      const next = freeTex.slice(0, start) + snippet + freeTex.slice(end);
      setFreeTex(next);
      setTimeout(() => {
        inputEl.focus();
        const cursorPos = start + snippet.length;
        inputEl.setSelectionRange(cursorPos, cursorPos);
      }, 0);
    } else {
      setFreeTex((prev) => prev + snippet);
    }
  };

  const handleSubmit = () => {
    if (!currentTex) return;
    onInsert(currentTex, isDisplayBlock);
  };

  const MODE_TABS = [
    { id: 'pecahan', label: 'Pecahan (a/b)' },
    { id: 'campuran', label: 'Campuran (c a/b)' },
    { id: 'operasi_pecahan', label: 'Banding / Hitung Pecahan' },
    { id: 'pangkat', label: 'Pangkat (aⁿ)' },
    { id: 'akar', label: 'Akar (√ / ∛)' },
    { id: 'bebas', label: 'Rumus Lengkap & Simbol' },
  ];

  return (
    <div className="mt-1 p-3 rounded-xl bg-[#0F2042] border-2 border-indigo-400/75 space-y-3 animate-fade-in shadow-xl">
      {/* Header Panel */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center space-x-1.5 text-xs font-bold text-indigo-200">
          <Sigma className="w-4 h-4 text-amber-300" />
          <span>
            {isEditing
              ? 'Edit Rumus Matematika Visual'
              : 'Pembuat Rumus Matematika Visual (Tanpa Perlu Kode)'}
          </span>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-1 rounded-md text-blue-300 hover:text-white hover:bg-[#162E5B] cursor-pointer"
          title="Tutup panel rumus"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Tab Pilihan Bentuk Matematika */}
      <div className="flex flex-wrap gap-1">
        {MODE_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => {
              if (tab.id === 'bebas' && !freeTex.trim() && currentTex) {
                setFreeTex(currentTex);
              }
              setBuilderMode(tab.id);
            }}
            className={`px-2.5 py-1 rounded-lg text-[10px] sm:text-[11px] font-bold border transition-all cursor-pointer ${
              builderMode === tab.id
                ? 'bg-indigo-600 text-white border-indigo-300 shadow-xs'
                : 'bg-[#162E5B] text-blue-200 border-blue-500/30 hover:text-white hover:border-blue-400/60'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* AREA INPUT VISUAL SESUAI TAB */}
      <div className="p-3 rounded-xl bg-[#162E5B]/80 border border-blue-500/40 space-y-3">
        {/* 1. Pecahan Biasa */}
        {builderMode === 'pecahan' && (
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <div className="flex flex-col items-center space-y-1.5">
              <div className="flex flex-col items-center">
                <label className="text-[10px] font-semibold text-blue-200 mb-0.5">
                  Pembilang (Atas)
                </label>
                <input
                  type="text"
                  value={num}
                  onChange={(e) => setNum(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleSubmit();
                    }
                  }}
                  placeholder="2"
                  className="w-24 px-2.5 py-1.5 rounded-lg bg-[#0F2042] border border-blue-400/60 text-white text-center text-sm font-bold focus:outline-none focus:border-amber-300"
                />
              </div>
              <div className="w-24 h-0.5 bg-white rounded-full" />
              <div className="flex flex-col items-center">
                <input
                  type="text"
                  value={den}
                  onChange={(e) => setDen(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleSubmit();
                    }
                  }}
                  placeholder="5"
                  className="w-24 px-2.5 py-1.5 rounded-lg bg-[#0F2042] border border-blue-400/60 text-white text-center text-sm font-bold focus:outline-none focus:border-amber-300"
                />
                <label className="text-[10px] font-semibold text-blue-200 mt-0.5">
                  Penyebut (Bawah)
                </label>
              </div>
            </div>
          </div>
        )}

        {/* 2. Pecahan Campuran */}
        {builderMode === 'campuran' && (
          <div className="flex items-center justify-center gap-3">
            <div className="flex flex-col items-center">
              <label className="text-[10px] font-semibold text-blue-200 mb-0.5">
                Bil. Bulat
              </label>
              <input
                type="text"
                value={whole}
                onChange={(e) => setWhole(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleSubmit();
                  }
                }}
                placeholder="3"
                className="w-16 px-2 py-2 rounded-lg bg-[#0F2042] border border-blue-400/60 text-white text-center text-base font-bold focus:outline-none focus:border-amber-300"
              />
            </div>
            <div className="flex flex-col items-center space-y-1.5">
              <div className="flex flex-col items-center">
                <label className="text-[10px] font-semibold text-blue-200 mb-0.5">
                  Pembilang
                </label>
                <input
                  type="text"
                  value={mixNum}
                  onChange={(e) => setMixNum(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleSubmit();
                    }
                  }}
                  placeholder="1"
                  className="w-20 px-2 py-1 rounded-lg bg-[#0F2042] border border-blue-400/60 text-white text-center text-sm font-bold focus:outline-none focus:border-amber-300"
                />
              </div>
              <div className="w-20 h-0.5 bg-white rounded-full" />
              <div className="flex flex-col items-center">
                <input
                  type="text"
                  value={mixDen}
                  onChange={(e) => setMixDen(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleSubmit();
                    }
                  }}
                  placeholder="2"
                  className="w-20 px-2 py-1 rounded-lg bg-[#0F2042] border border-blue-400/60 text-white text-center text-sm font-bold focus:outline-none focus:border-amber-300"
                />
                <label className="text-[10px] font-semibold text-blue-200 mt-0.5">
                  Penyebut
                </label>
              </div>
            </div>
          </div>
        )}

        {/* 3. Operasi & Perbandingan 2 Pecahan (contoh: 2/5 < 3/5 atau 1/2 + 1/4) */}
        {builderMode === 'operasi_pecahan' && (
          <div className="space-y-2.5">
            <div className="flex items-center justify-center flex-wrap gap-3">
              {/* Pecahan 1 */}
              <div className="flex flex-col items-center space-y-1">
                <input
                  type="text"
                  value={num1}
                  onChange={(e) => setNum1(e.target.value)}
                  className="w-16 px-2 py-1 rounded-lg bg-[#0F2042] border border-blue-400/60 text-white text-center text-sm font-bold focus:outline-none focus:border-amber-300"
                  title="Pembilang 1"
                />
                <div className="w-16 h-0.5 bg-white rounded-full" />
                <input
                  type="text"
                  value={den1}
                  onChange={(e) => setDen1(e.target.value)}
                  className="w-16 px-2 py-1 rounded-lg bg-[#0F2042] border border-blue-400/60 text-white text-center text-sm font-bold focus:outline-none focus:border-amber-300"
                  title="Penyebut 1"
                />
              </div>

              {/* Pilihan Operator di Tengah */}
              <div className="flex flex-col items-center space-y-1">
                <span className="text-[10px] font-semibold text-amber-300">
                  Tanda / Operasi
                </span>
                <div className="grid grid-cols-5 gap-1">
                  {FRACTION_OPS.map((item) => (
                    <button
                      key={item.tex}
                      type="button"
                      onClick={() => setFracOp(item.tex)}
                      className={`w-7 h-7 rounded-lg text-xs font-extrabold border cursor-pointer transition-all ${
                        fracOp === item.tex
                          ? 'bg-amber-500 text-slate-950 border-amber-200'
                          : 'bg-[#0F2042] text-white border-blue-500/40 hover:bg-blue-800'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Pecahan 2 */}
              <div className="flex flex-col items-center space-y-1">
                <input
                  type="text"
                  value={num2}
                  onChange={(e) => setNum2(e.target.value)}
                  className="w-16 px-2 py-1 rounded-lg bg-[#0F2042] border border-blue-400/60 text-white text-center text-sm font-bold focus:outline-none focus:border-amber-300"
                  title="Pembilang 2"
                />
                <div className="w-16 h-0.5 bg-white rounded-full" />
                <input
                  type="text"
                  value={den2}
                  onChange={(e) => setDen2(e.target.value)}
                  className="w-16 px-2 py-1 rounded-lg bg-[#0F2042] border border-blue-400/60 text-white text-center text-sm font-bold focus:outline-none focus:border-amber-300"
                  title="Penyebut 2"
                />
              </div>
            </div>
          </div>
        )}

        {/* 4. Bilangan Berpangkat */}
        {builderMode === 'pangkat' && (
          <div className="flex items-end justify-center gap-2">
            <div className="flex flex-col items-center">
              <label className="text-[10px] font-semibold text-blue-200 mb-0.5">
                Angka Utama
              </label>
              <input
                type="text"
                value={powBase}
                onChange={(e) => setPowBase(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleSubmit();
                  }
                }}
                placeholder="5"
                className="w-24 px-2.5 py-2 rounded-lg bg-[#0F2042] border border-blue-400/60 text-white text-center text-base font-bold focus:outline-none focus:border-amber-300"
              />
            </div>
            <div className="flex flex-col items-center pb-4">
              <label className="text-[10px] font-semibold text-amber-300 mb-0.5">
                Pangkat
              </label>
              <input
                type="text"
                value={powExp}
                onChange={(e) => setPowExp(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleSubmit();
                  }
                }}
                placeholder="2"
                className="w-16 px-2 py-1 rounded-lg bg-[#0F2042] border border-amber-400/70 text-amber-200 text-center text-xs font-bold focus:outline-none focus:border-amber-300"
              />
            </div>
          </div>
        )}

        {/* 5. Akar Kuadrat / Akar Pangkat 3 */}
        {builderMode === 'akar' && (
          <div className="flex flex-wrap items-center justify-center gap-3">
            <div className="flex flex-col items-center">
              <label className="text-[10px] font-semibold text-blue-200 mb-1">
                Jenis Akar
              </label>
              <div className="flex items-center space-x-1">
                {[
                  { id: '2', label: '√ (Akar 2)' },
                  { id: '3', label: '∛ (Akar 3)' },
                ].map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setRootIdx(r.id)}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-bold border cursor-pointer ${
                      rootIdx === r.id
                        ? 'bg-amber-500 text-slate-950 border-amber-200'
                        : 'bg-[#0F2042] text-blue-100 border-blue-500/40'
                    }`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col items-center">
              <label className="text-[10px] font-semibold text-blue-200 mb-1">
                Bilangan di Dalam Akar
              </label>
              <input
                type="text"
                value={radicand}
                onChange={(e) => setRadicand(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleSubmit();
                  }
                }}
                placeholder="64"
                className="w-28 px-3 py-1.5 rounded-lg bg-[#0F2042] border border-blue-400/60 text-white text-center text-sm font-bold focus:outline-none focus:border-amber-300"
              />
            </div>
          </div>
        )}

        {/* 6. Editor Rumus Lengkap + Tombol Simbol 1-Klik + Template SD */}
        {builderMode === 'bebas' && (
          <div className="space-y-2.5">
            {/* Kotak Input Ekspresi + Tombol Bersihkan */}
            <div className="flex items-center gap-1.5">
              <input
                ref={freeInputRef}
                type="text"
                value={freeTex}
                onChange={(e) => setFreeTex(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleSubmit();
                  }
                }}
                placeholder="Klik tombol simbol/template di bawah atau ketik rumus..."
                className="flex-1 px-3 py-2 rounded-lg bg-[#0F2042] border border-blue-400/60 text-white text-xs font-mono focus:outline-none focus:border-amber-300"
              />
              {freeTex && (
                <button
                  type="button"
                  onClick={() => setFreeTex('')}
                  title="Kosongkan rumus"
                  className="p-2 rounded-lg bg-[#0F2042] hover:bg-rose-900/70 text-blue-300 hover:text-rose-200 border border-blue-500/40 cursor-pointer"
                >
                  <Eraser className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Kelompok Tombol Simbol Matematika 1-Klik */}
            <div className="space-y-2">
              {MATH_SYMBOL_GROUPS.map((group) => (
                <div key={group.title} className="space-y-1">
                  <span className="text-[10px] font-semibold text-blue-300 block">
                    {group.title}:
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {group.items.map((sym) => (
                      <button
                        key={sym.label}
                        type="button"
                        onClick={() => handleAppendSymbolToFree(sym.insert)}
                        title={sym.title}
                        className="px-2 py-1 rounded-md bg-[#0F2042] hover:bg-indigo-600 text-white border border-blue-500/40 text-[11px] font-bold cursor-pointer transition-colors"
                      >
                        {sym.label}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Template Rumus Matematika SD Siap Pakai */}
            <div className="pt-1.5 border-t border-blue-500/30 space-y-1">
              <span className="text-[10px] font-semibold text-amber-300 flex items-center space-x-1">
                <Sparkles className="w-3 h-3" />
                <span>Template Rumus Cepat (Klik langsung terisi):</span>
              </span>
              <div className="flex flex-wrap gap-1">
                {SD_MATH_TEMPLATES.map((tpl) => (
                  <button
                    key={tpl.label}
                    type="button"
                    onClick={() => setFreeTex(tpl.tex)}
                    className="px-2 py-1 rounded-md bg-indigo-950/90 hover:bg-indigo-700 text-indigo-100 border border-indigo-400/40 text-[10px] font-semibold cursor-pointer transition-colors"
                  >
                    {tpl.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* KOTAK PRATINJAU HASIL LANGSUNG (PERSIS SEPERTI YANG DILIHAT SISWA) */}
      <div className="p-3 rounded-xl bg-white border-2 border-indigo-300 text-slate-900 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="space-y-0.5 flex-1 min-w-0">
          <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 flex items-center space-x-1">
            <Calculator className="w-3 h-3" />
            <span>Pratinjau Tampilan Siswa:</span>
          </span>
          <div className="py-1 overflow-x-auto">
            {currentTex ? (
              <div
                className="text-base sm:text-lg text-slate-900"
                dangerouslySetInnerHTML={{ __html: previewHtml }}
              />
            ) : (
              <span className="text-xs text-slate-400 italic">
                (Masukkan angka atau pilih simbol di atas untuk melihat hasil)
              </span>
            )}
          </div>
        </div>

        {/* Pilihan Mode Inline vs Blok Tengah */}
        <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-lg border border-slate-200 self-start sm:self-center flex-shrink-0">
          <button
            type="button"
            onClick={() => setIsDisplayBlock(false)}
            className={`px-2 py-1 rounded-md text-[10px] font-bold cursor-pointer transition-all ${
              !isDisplayBlock
                ? 'bg-indigo-600 text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Sejajar Teks
          </button>
          <button
            type="button"
            onClick={() => setIsDisplayBlock(true)}
            className={`px-2 py-1 rounded-md text-[10px] font-bold cursor-pointer transition-all ${
              isDisplayBlock
                ? 'bg-indigo-600 text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Blok Tengah
          </button>
        </div>
      </div>

      {/* Tombol Aksi Bawah */}
      <div className="flex items-center justify-between gap-2 pt-0.5">
        <div>
          {isEditing && onDelete && (
            <button
              type="button"
              onClick={onDelete}
              className="px-3 py-1.5 rounded-lg bg-rose-900/80 hover:bg-rose-700 text-rose-100 border border-rose-400/50 text-[11px] font-bold flex items-center space-x-1 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Hapus Rumus</span>
            </button>
          )}
        </div>

        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg bg-[#162E5B] hover:bg-slate-800 text-blue-200 border border-blue-500/40 text-[11px] font-semibold cursor-pointer"
          >
            Batal
          </button>
          <button
            type="button"
            disabled={!currentTex}
            onClick={handleSubmit}
            className="px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 text-[11px] font-extrabold flex items-center space-x-1 cursor-pointer shadow-xs"
          >
            <Check className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>{isEditing ? 'Perbarui Rumus' : 'Sisipkan ke Teks'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default MathEquationPanel;
