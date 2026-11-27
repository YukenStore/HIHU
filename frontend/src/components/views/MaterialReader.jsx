import React, { useState, useEffect } from 'react';
import {
  Lightbulb,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Target,
  Sparkles,
  BookOpen,
  Check,
  Calculator,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  ArrowDown,
  ArrowUp,
  FileText,
  Compass,
  Layers,
  Award,
  Zap,
  Info,
  Bookmark,
  Search,
} from 'lucide-react';
import { formatMath } from '../../utils/mathRenderer';

/**
 * Komponen Accordion / Tulisan Dropdown Interaktif
 * Memungkinkan siswa membuka/menutup detail penjelasan atau rumus untuk menghindari tampilan bertumpuk.
 */
const InteractiveDropdownList = ({ items, defaultOpenAll = null }) => {
  const [openItems, setOpenItems] = useState(() => {
    const initial = {};
    const shouldOpenAll = defaultOpenAll !== null ? defaultOpenAll : items.length <= 2;
    items.forEach((_, idx) => {
      // Jika item banyak (> 2), buka item pertama saja sebagai contoh isi, sisanya dilipat rapi dalam dropdown
      initial[idx] = shouldOpenAll ? true : idx === 0;
    });
    return initial;
  });

  if (!items || items.length === 0) return null;

  const allOpen =
    Object.values(openItems).every(Boolean) &&
    Object.keys(openItems).length === items.length;

  const toggleItem = (idx) => {
    setOpenItems((prev) => ({
      ...prev,
      [idx]: !prev[idx],
    }));
  };

  const toggleAll = () => {
    if (allOpen) {
      setOpenItems({});
    } else {
      const all = {};
      items.forEach((_, idx) => {
        all[idx] = true;
      });
      setOpenItems(all);
    }
  };

  const isMathFormula = (val) => {
    if (!val) return false;
    const lower = val.toLowerCase();
    return (
      (val.includes('=') || val.includes('²') || val.includes('³') || val.includes('π')) &&
      !lower.includes('contoh') &&
      !lower.includes('adalah') &&
      !lower.includes('yaitu') &&
      !lower.includes('kalimat')
    );
  };

  return (
    <div className="space-y-2.5 my-3 animate-fade-in">
      {items.length > 1 && (
        <div className="flex items-center justify-between pb-1 text-xs">
          <span className="text-slate-600 font-semibold flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded-full bg-blue-600" />
            <span>Poin Materi ({items.length} Bagian):</span>
          </span>
          <button
            type="button"
            onClick={toggleAll}
            className="text-blue-600 hover:text-blue-700 font-bold hover:underline transition-colors cursor-pointer text-[11px] flex items-center space-x-1 bg-blue-50/70 hover:bg-blue-100/70 px-2.5 py-1 rounded-lg border border-blue-200/60"
          >
            <span>{allOpen ? 'Tutup Semua' : 'Buka Semua'}</span>
          </button>
        </div>
      )}

      <div className="space-y-2">
        {items.map((item, idx) => {
          const isOpen = !!openItems[idx];
          const hasFormula = item.formula || (item.value && isMathFormula(item.value));
          const formulaContent = item.formula || (hasFormula ? item.value : null);
          const descContent = item.description || (!hasFormula ? item.value : null);

          return (
            <div
              key={idx}
              className={`border rounded-xl overflow-hidden bg-white shadow-2xs transition-all ${
                isOpen ? 'border-blue-300 ring-1 ring-blue-100' : 'border-slate-200/90 hover:border-blue-200'
              }`}
            >
              <button
                type="button"
                onClick={() => toggleItem(idx)}
                className="w-full p-3 sm:p-3.5 flex items-center justify-between text-left hover:bg-slate-50/80 transition-colors cursor-pointer gap-2"
              >
                <div className="flex items-center space-x-2.5 flex-1 min-w-0">
                  <span className="w-6 h-6 rounded-lg bg-blue-50 text-blue-700 border border-blue-200/60 font-bold text-xs flex items-center justify-center flex-shrink-0">
                    {idx + 1}
                  </span>
                  <span
                    className="font-bold text-slate-800 text-xs sm:text-sm break-words leading-snug flex-1"
                    dangerouslySetInnerHTML={{ __html: formatMath(item.title) }}
                  />
                </div>
                <div className="flex items-center space-x-2 flex-shrink-0">
                  <span className="text-[11px] text-slate-400 font-medium hidden sm:inline">
                    {isOpen ? 'Tutup' : 'Buka Detail'}
                  </span>
                  <div
                    className={`w-6 h-6 rounded-md bg-slate-100 flex items-center justify-center text-slate-500 transition-transform duration-200 ${
                      isOpen ? 'rotate-180 bg-blue-50 text-blue-600' : ''
                    }`}
                  >
                    <ChevronDown className="w-3.5 h-3.5" />
                  </div>
                </div>
              </button>

              {isOpen && (
                <div className="px-3.5 pb-3.5 pt-1.5 border-t border-slate-100 text-xs sm:text-sm text-slate-700 space-y-2 animate-fade-in bg-slate-50/50">
                  {formulaContent && (
                    <div className="p-2.5 rounded-lg bg-white border border-slate-200/90 font-mono text-xs sm:text-sm font-bold text-blue-950 shadow-2xs">
                      <span dangerouslySetInnerHTML={{ __html: formatMath(formulaContent) }} />
                    </div>
                  )}
                  {descContent && (
                    <p
                      className="leading-relaxed font-normal text-slate-700"
                      dangerouslySetInnerHTML={{ __html: formatMath(descContent) }}
                    />
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

/**
 * Parser Konten Materi Tingkat Lanjut:
 * - Menghilangkan simbol `->` yang kaku
 * - Mendeteksi daftar berurutan / urutan prioritas dan menampilkannya sebagai Alur Langkah (Step Pipeline)
 * - Mengelompokkan sifat/aturan yang banyak menjadi Tulisan Dropdown (Accordion) yang rapi
 * - Memformat rumus matematika dengan KaTeX
 */
/**
 * Renderer Konten Materi:
 * Menampilkan teks materi sesuai dengan baris baru (newline) dan format ala MS Word
 * (penomoran <ol>, daftar poin <ul>, perataan teks, garis bawah, stabilo, bold, italic, font)
 * yang diketik di Admin Panel, menghapus tag [H], serta memformat rumus matematika dengan KaTeX.
 */
const EnhancedContentRenderer = ({ content }) => {
  if (!content) return null;

  const cleanedContent = String(content)
    .replace(/\[h(?:orizontal)?\]\s*/gi, '')
    .replace(/\r\n/g, '\n');

  const rawLines = cleanedContent.split('\n');

  return (
    <div className="space-y-1.5 rich-content-display">
      {rawLines.map((rawLine, lineIndex) => {
        const trimmed = rawLine.trim();
        if (!trimmed) {
          return <div key={`empty-${lineIndex}`} className="h-2" />;
        }

        // Ambil teks polos tanpa tag HTML untuk mendeteksi awalan poin ("->", "📌", "📐", "💡")
        const plainText = trimmed.replace(/<[^>]*>/g, '').trim();

        const isImportantPin = plainText.startsWith('📌');
        const isFormulaPin = plainText.startsWith('📐');
        const isTipsPin = plainText.startsWith('💡');
        const isArrowOrBullet =
          plainText.startsWith('->') ||
          plainText.startsWith('→') ||
          plainText.startsWith('•');

        let boxClass = 'text-slate-700 font-normal';
        if (isImportantPin) {
          boxClass =
            'p-3 rounded-xl bg-amber-50/90 border-l-4 border-amber-500 border border-amber-200 text-slate-800 font-medium shadow-2xs';
        } else if (isFormulaPin) {
          boxClass =
            'p-3 rounded-xl bg-blue-50/90 border-l-4 border-blue-600 border border-blue-200 text-slate-800 font-medium shadow-2xs';
        } else if (isTipsPin) {
          boxClass =
            'p-3 rounded-xl bg-emerald-50/90 border-l-4 border-emerald-600 border border-emerald-200 text-slate-800 font-medium shadow-2xs';
        } else if (isArrowOrBullet) {
          boxClass =
            'p-2.5 rounded-lg bg-slate-50 border border-slate-200/80 text-slate-800 font-medium';
        }

        return (
          <div
            key={`line-${lineIndex}`}
            className={`text-xs sm:text-sm leading-relaxed whitespace-pre-line ${boxClass}`}
            dangerouslySetInnerHTML={{ __html: formatMath(rawLine) }}
          />
        );
      })}
    </div>
  );
};

/**
 * Komponen Interaktif Visual Tangga Satuan Panjang (km sampai mm)
 * Mendukung konversi Peta (km ⇄ cm, 5 tangga) & Denah (m ⇄ cm, 2 tangga) termasuk angka desimal
 */
const TanggaSatuanVisual = () => {
  const [kmVal, setKmVal] = useState('2,5');
  const [cmVal, setCmVal] = useState('6.000.000');
  const [mVal, setMVal] = useState('12,5');
  const [cmToMVal, setCmToMVal] = useState('850');
  const [activeTab, setActiveTab] = useState('km-to-cm');

  const STAIRS = [
    { id: 'km', label: 'km', full: 'Kilometer', role: 'Satuan Jarak Sebenarnya (Peta) • Awal', isSpecial: 'km' },
    { id: 'hm', label: 'hm', full: 'Hektometer', role: 'Turun 1: ×10' },
    { id: 'dam', label: 'dam', full: 'Dekameter', role: 'Turun 2: ×100' },
    { id: 'm', label: 'm', full: 'Meter', role: 'Satuan Pokok Internasional / Denah • Turun 3: ×1.000', isSpecial: 'm' },
    { id: 'dm', label: 'dm', full: 'Desimeter', role: 'Turun 4: ×10.000' },
    { id: 'cm', label: 'cm', full: 'Sentimeter', role: 'Satuan Skala & Peta (JP) • Turun 5: ×100.000', isSpecial: 'cm' },
    { id: 'mm', label: 'mm', full: 'Milimeter', role: 'Satuan Terkecil • Turun 6: ×1.000.000' },
  ];

  const presetsKm = ['1', '2,5', '4', '15', '48'];
  const presetsCm = ['250.000', '500.000', '1.200.000', '6.000.000'];
  const presetsM = ['2', '8', '12,5', '25', '40'];
  const presetsCmToM = ['150', '400', '850', '1.250'];

  const parseIndoNumber = (val, allowThousandsDot = false) => {
    const str = String(val ?? '').trim();
    if (!str) return NaN;
    const normalized = allowThousandsDot
      ? str.replace(/\./g, '').replace(',', '.')
      : str.replace(',', '.');
    return parseFloat(normalized);
  };

  const formatIndoNumber = (num) => {
    if (isNaN(num)) return '0';
    const clean = Number(num.toPrecision(12));
    return clean.toLocaleString('id-ID', { maximumFractionDigits: 6 });
  };

  const getKmConverted = () => {
    const n = parseIndoNumber(kmVal, false);
    if (isNaN(n)) return '0';
    return formatIndoNumber(n * 100000);
  };

  const getCmConverted = () => {
    const n = parseIndoNumber(cmVal, true);
    if (isNaN(n)) return '0';
    return formatIndoNumber(n / 100000);
  };

  const getMConverted = () => {
    const n = parseIndoNumber(mVal, false);
    if (isNaN(n)) return '0';
    return formatIndoNumber(n * 100);
  };

  const getCmToMConverted = () => {
    const n = parseIndoNumber(cmToMVal, true);
    if (isNaN(n)) return '0';
    return formatIndoNumber(n / 100);
  };

  return (
    <div className="space-y-3.5 my-3 animate-fade-in">
      {/* 1. Header Banner Aturan Tangga (Geser Koma — Aman untuk Bulat & Desimal) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 flex items-start space-x-2.5 shadow-2xs">
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center flex-shrink-0 font-bold">
            <ArrowDown className="w-4 h-4" />
          </div>
          <div>
            <strong className="block font-bold text-slate-900 text-[11px] uppercase tracking-wider">
              Setiap Turun 1 Tangga:
            </strong>
            <span className="text-slate-600 leading-relaxed">
              Dikali (×) 10 • <strong>Geser koma 1 langkah ke kanan</strong> (untuk bilangan bulat, tambah 0 di belakang)
            </span>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 flex items-start space-x-2.5 shadow-2xs">
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center flex-shrink-0 font-bold">
            <ArrowUp className="w-4 h-4" />
          </div>
          <div>
            <strong className="block font-bold text-slate-900 text-[11px] uppercase tracking-wider">
              Setiap Naik 1 Tangga:
            </strong>
            <span className="text-slate-600 leading-relaxed">
              Dibagi (÷) 10 • <strong>Geser koma 1 langkah ke kiri</strong>
            </span>
          </div>
        </div>
      </div>

      {/* 2. Visualisasi Tangga */}
      <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-3 shadow-2xs">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center space-x-1.5">
            <Layers className="w-4 h-4 text-blue-600" />
            <span>Peta Tangga Satuan Panjang (km sampai mm)</span>
          </span>
          <span className="text-[11px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">
            7 Tingkat
          </span>
        </div>

        <div className="space-y-1.5 pt-1">
          {STAIRS.map((stair, index) => (
            <div
              key={stair.id}
              className={`flex flex-wrap items-center justify-between gap-1.5 p-2 rounded-lg border transition-all ${
                stair.isSpecial === 'cm'
                  ? 'bg-amber-50/70 border-amber-300 font-semibold'
                  : stair.isSpecial === 'km'
                  ? 'bg-blue-50/60 border-blue-200 font-semibold'
                  : stair.isSpecial === 'm'
                  ? 'bg-emerald-50/60 border-emerald-200 font-semibold'
                  : 'bg-slate-50/70 border-slate-200'
              }`}
              style={{
                marginLeft: `${Math.min(index * 4, 24)}%`,
              }}
            >
              <div className="flex items-center flex-wrap gap-1.5">
                <span className="w-10 h-6 rounded bg-white border border-slate-200 text-xs font-mono font-bold flex items-center justify-center text-slate-800">
                  {stair.label}
                </span>
                <span className="text-xs font-bold text-slate-800">{stair.full}</span>
                {stair.isSpecial === 'cm' && (
                  <span className="px-1.5 py-0.5 rounded text-[10px] bg-amber-100 text-amber-800 font-bold">
                    Kunci Skala (cm)
                  </span>
                )}
                {stair.isSpecial === 'km' && (
                  <span className="px-1.5 py-0.5 rounded text-[10px] bg-blue-100 text-blue-800 font-bold">
                    Jarak Peta (km)
                  </span>
                )}
                {stair.isSpecial === 'm' && (
                  <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-100 text-emerald-800 font-bold">
                    Jarak Denah (m)
                  </span>
                )}
              </div>
              <div className="text-[10px] sm:text-[11px] text-slate-600 pr-1">
                {stair.role}
              </div>
            </div>
          ))}
        </div>

        <div className="p-3 rounded-lg bg-blue-50/60 border border-blue-200 text-xs text-blue-900 space-y-1.5 mt-2">
          <div className="flex items-center space-x-1.5 font-bold">
            <Zap className="w-4 h-4 text-blue-600" />
            <span>Trik Cepat Skala: Hitung Jumlah Tangga lalu Geser Koma!</span>
          </div>
          <p className="leading-relaxed text-slate-700">
            <strong>1. Peta (km ⇄ cm — 5 tangga):</strong><br />
            • <strong>km → cm</strong> (turun 5 tangga) = <strong>× 100.000</strong> (geser koma 5 langkah ke kanan). Contoh: 2,5 km = 250.000 cm.<br />
            • <strong>cm → km</strong> (naik 5 tangga) = <strong>÷ 100.000</strong> (geser koma 5 langkah ke kiri). Contoh: 250.000 cm = 2,5 km.<br />
            <strong>2. Denah (m ⇄ cm — 2 tangga):</strong><br />
            • <strong>m → cm</strong> (turun 2 tangga) = <strong>× 100</strong> (geser koma 2 langkah ke kanan). Contoh: 12,5 m = 1.250 cm.<br />
            • <strong>cm → m</strong> (naik 2 tangga) = <strong>÷ 100</strong> (geser koma 2 langkah ke kiri). Contoh: 850 cm = 8,5 m.
          </p>
        </div>
      </div>

      {/* 3. Simulator Interaktif Konversi (km ⇄ cm & m ⇄ cm, mendukung desimal) */}
      <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-3 shadow-2xs">
        <div className="flex flex-col gap-2 pb-2 border-b border-slate-100">
          <div className="flex items-center space-x-2">
            <Calculator className="w-4 h-4 text-blue-600" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-900">
              Latihan Simulator Konversi Skala (Peta &amp; Denah)
            </span>
          </div>

          <div className="flex flex-wrap gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
            {[
              { id: 'km-to-cm', label: 'km → cm (×100.000)' },
              { id: 'cm-to-km', label: 'cm → km (÷100.000)' },
              { id: 'm-to-cm', label: 'm → cm (×100)' },
              { id: 'cm-to-m', label: 'cm → m (÷100)' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                  activeTab === tab.id
                    ? 'bg-white text-blue-700 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {activeTab === 'km-to-cm' && (
          <div className="space-y-2.5">
            <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-600">
              <span className="text-[11px] font-bold text-slate-500 mr-1">Contoh Cepat:</span>
              {presetsKm.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setKmVal(p)}
                  className={`px-2 py-0.5 rounded text-xs font-bold border transition-all cursor-pointer ${
                    kmVal === p
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {p} km
                </button>
              ))}
            </div>

            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex-1 space-y-1">
                <span className="text-[11px] font-bold text-slate-500 uppercase block">Input Jarak (km):</span>
                <input
                  type="text"
                  value={kmVal}
                  onChange={(e) => setKmVal(e.target.value)}
                  placeholder="mis. 2,5"
                  className="w-28 px-3 py-1.5 rounded-lg bg-white text-slate-900 font-bold font-mono text-center text-sm border border-slate-300 outline-none focus:border-blue-500"
                />
              </div>

              <div className="text-blue-600 font-bold text-xs text-center">
                <div>➔ × 100.000</div>
                <div className="text-[10px] font-medium text-slate-500">Geser koma 5 langkah kanan</div>
              </div>

              <div className="flex-1 space-y-1 sm:text-right">
                <span className="text-[11px] font-bold text-blue-700 uppercase block">Hasil (cm):</span>
                <div className="inline-block px-3 py-1.5 rounded-lg bg-white text-blue-900 font-bold font-mono text-sm border border-blue-300">
                  {getKmConverted()} cm
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'cm-to-km' && (
          <div className="space-y-2.5">
            <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-600">
              <span className="text-[11px] font-bold text-slate-500 mr-1">Contoh Cepat:</span>
              {presetsCm.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setCmVal(p)}
                  className={`px-2 py-0.5 rounded text-xs font-bold border transition-all cursor-pointer ${
                    cmVal === p
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {p} cm
                </button>
              ))}
            </div>

            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex-1 space-y-1">
                <span className="text-[11px] font-bold text-slate-500 uppercase block">Input Nilai (cm):</span>
                <input
                  type="text"
                  value={cmVal}
                  onChange={(e) => setCmVal(e.target.value)}
                  className="w-32 px-3 py-1.5 rounded-lg bg-white text-slate-900 font-bold font-mono text-center text-sm border border-slate-300 outline-none focus:border-blue-500"
                />
              </div>

              <div className="text-blue-600 font-bold text-xs text-center">
                <div>➔ ÷ 100.000</div>
                <div className="text-[10px] font-medium text-slate-500">Geser koma 5 langkah kiri</div>
              </div>

              <div className="flex-1 space-y-1 sm:text-right">
                <span className="text-[11px] font-bold text-blue-700 uppercase block">Hasil (km):</span>
                <div className="inline-block px-3 py-1.5 rounded-lg bg-white text-blue-900 font-bold font-mono text-sm border border-blue-300">
                  {getCmConverted()} km
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'm-to-cm' && (
          <div className="space-y-2.5">
            <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-600">
              <span className="text-[11px] font-bold text-slate-500 mr-1">Contoh Cepat:</span>
              {presetsM.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setMVal(p)}
                  className={`px-2 py-0.5 rounded text-xs font-bold border transition-all cursor-pointer ${
                    mVal === p
                      ? 'bg-emerald-600 text-white border-emerald-600'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {p} m
                </button>
              ))}
            </div>

            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex-1 space-y-1">
                <span className="text-[11px] font-bold text-slate-500 uppercase block">Input Ukuran Denah (m):</span>
                <input
                  type="text"
                  value={mVal}
                  onChange={(e) => setMVal(e.target.value)}
                  placeholder="mis. 12,5"
                  className="w-28 px-3 py-1.5 rounded-lg bg-white text-slate-900 font-bold font-mono text-center text-sm border border-slate-300 outline-none focus:border-emerald-500"
                />
              </div>

              <div className="text-emerald-700 font-bold text-xs text-center">
                <div>➔ × 100</div>
                <div className="text-[10px] font-medium text-slate-500">Geser koma 2 langkah kanan</div>
              </div>

              <div className="flex-1 space-y-1 sm:text-right">
                <span className="text-[11px] font-bold text-emerald-700 uppercase block">Hasil (cm):</span>
                <div className="inline-block px-3 py-1.5 rounded-lg bg-white text-emerald-900 font-bold font-mono text-sm border border-emerald-300">
                  {getMConverted()} cm
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'cm-to-m' && (
          <div className="space-y-2.5">
            <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-600">
              <span className="text-[11px] font-bold text-slate-500 mr-1">Contoh Cepat:</span>
              {presetsCmToM.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setCmToMVal(p)}
                  className={`px-2 py-0.5 rounded text-xs font-bold border transition-all cursor-pointer ${
                    cmToMVal === p
                      ? 'bg-emerald-600 text-white border-emerald-600'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {p} cm
                </button>
              ))}
            </div>

            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex-1 space-y-1">
                <span className="text-[11px] font-bold text-slate-500 uppercase block">Input Nilai (cm):</span>
                <input
                  type="text"
                  value={cmToMVal}
                  onChange={(e) => setCmToMVal(e.target.value)}
                  className="w-28 px-3 py-1.5 rounded-lg bg-white text-slate-900 font-bold font-mono text-center text-sm border border-slate-300 outline-none focus:border-emerald-500"
                />
              </div>

              <div className="text-emerald-700 font-bold text-xs text-center">
                <div>➔ ÷ 100</div>
                <div className="text-[10px] font-medium text-slate-500">Geser koma 2 langkah kiri</div>
              </div>

              <div className="flex-1 space-y-1 sm:text-right">
                <span className="text-[11px] font-bold text-emerald-700 uppercase block">Hasil (m):</span>
                <div className="inline-block px-3 py-1.5 rounded-lg bg-white text-emerald-900 font-bold font-mono text-sm border border-emerald-300">
                  {getCmToMConverted()} m
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * Helper parsing & format angka Indonesia (mendukung koma desimal & titik ribuan)
 */
const parseIndoUnitNumber = (val, allowThousandsDot = false) => {
  const str = String(val ?? '').trim();
  if (!str) return NaN;
  const normalized = allowThousandsDot
    ? str.replace(/\./g, '').replace(',', '.')
    : str.replace(',', '.');
  return parseFloat(normalized);
};

const formatIndoUnitNumber = (num) => {
  if (isNaN(num)) return '0';
  const clean = Number(num.toPrecision(12));
  return clean.toLocaleString('id-ID', { maximumFractionDigits: 6 });
};

/**
 * Komponen Interaktif Visual Tangga Satuan Massa / Berat (kg sampai mg)
 * Mendukung aturan geser koma untuk bilangan bulat & desimal serta ton/kuintal/ons
 */
const TanggaBeratVisual = () => {
  const [kgToGVal, setKgToGVal] = useState('2,5');
  const [gToKgVal, setGToKgVal] = useState('1.500');
  const [kgToOnsVal, setKgToOnsVal] = useState('4,5');
  const [tonToKgVal, setTonToKgVal] = useState('2,5');
  const [activeTab, setActiveTab] = useState('kg-to-g');

  const STAIRS = [
    { id: 'kg', label: 'kg', full: 'Kilogram', role: 'Satuan Pokok Berat (SI) • Awal', isSpecial: 'kg' },
    { id: 'hg', label: 'hg', full: 'Hektogram (ons)', role: '1 hg = 1 ons • Turun 1: ×10', isSpecial: 'ons' },
    { id: 'dag', label: 'dag', full: 'Dekagram', role: 'Turun 2: ×100' },
    { id: 'g', label: 'g', full: 'Gram', role: 'Satuan Berat Harian • Turun 3: ×1.000', isSpecial: 'g' },
    { id: 'dg', label: 'dg', full: 'Desigram', role: 'Turun 4: ×10.000' },
    { id: 'cg', label: 'cg', full: 'Sentigram', role: 'Turun 5: ×100.000' },
    { id: 'mg', label: 'mg', full: 'Miligram', role: 'Satuan Terkecil (Obat/Emas) • Turun 6: ×1.000.000' },
  ];

  const presetsKg = ['0,5', '1', '2,5', '4', '12'];
  const presetsG = ['250', '750', '1.500', '4.000'];
  const presetsOns = ['1', '2,5', '4,5', '10'];
  const presetsTon = ['0,5', '1', '2,5', '5'];

  const convertVal = (raw, factor, isDivide = false, allowThousands = false) => {
    const n = parseIndoUnitNumber(raw, allowThousands);
    if (isNaN(n)) return '0';
    return formatIndoUnitNumber(isDivide ? n / factor : n * factor);
  };

  return (
    <div className="space-y-3.5 my-3 animate-fade-in">
      {/* 1. Header Banner Aturan Tangga Massa/Berat */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 flex items-start space-x-2.5 shadow-2xs">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center flex-shrink-0 font-bold">
            <ArrowDown className="w-4 h-4" />
          </div>
          <div>
            <strong className="block font-bold text-slate-900 text-[11px] uppercase tracking-wider">
              Setiap Turun 1 Tangga:
            </strong>
            <span className="text-slate-600 leading-relaxed">
              Dikali (×) 10 • <strong>Geser koma 1 langkah ke kanan</strong> (bilangan bulat: tambah 0 di belakang)
            </span>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 flex items-start space-x-2.5 shadow-2xs">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center flex-shrink-0 font-bold">
            <ArrowUp className="w-4 h-4" />
          </div>
          <div>
            <strong className="block font-bold text-slate-900 text-[11px] uppercase tracking-wider">
              Setiap Naik 1 Tangga:
            </strong>
            <span className="text-slate-600 leading-relaxed">
              Dibagi (÷) 10 • <strong>Geser koma 1 langkah ke kiri</strong>
            </span>
          </div>
        </div>
      </div>

      {/* 2. Visualisasi Tangga Massa / Berat */}
      <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-3 shadow-2xs">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center space-x-1.5">
            <Layers className="w-4 h-4 text-emerald-600" />
            <span>Peta Tangga Satuan Massa / Berat (kg sampai mg)</span>
          </span>
          <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
            7 Tingkat
          </span>
        </div>

        {/* Catatan Satuan Besar (Ton & Kuintal) di atas kg */}
        <div className="flex flex-wrap gap-2 text-[11px]">
          <span className="px-2.5 py-1 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 font-bold">
            1 ton = 1.000 kg = 10 kuintal
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-blue-50 border border-blue-200 text-blue-900 font-bold">
            1 kuintal = 100 kg
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900 font-bold">
            1 hg = 1 ons = 100 g
          </span>
        </div>

        <div className="space-y-1.5 pt-1">
          {STAIRS.map((stair, index) => (
            <div
              key={stair.id}
              className={`flex flex-wrap items-center justify-between gap-1.5 p-2 rounded-lg border transition-all ${
                stair.isSpecial === 'kg'
                  ? 'bg-emerald-50/70 border-emerald-300 font-semibold'
                  : stair.isSpecial === 'ons'
                  ? 'bg-amber-50/70 border-amber-300 font-semibold'
                  : stair.isSpecial === 'g'
                  ? 'bg-blue-50/60 border-blue-200 font-semibold'
                  : 'bg-slate-50/70 border-slate-200'
              }`}
              style={{
                marginLeft: `${Math.min(index * 4, 24)}%`,
              }}
            >
              <div className="flex items-center flex-wrap gap-1.5">
                <span className="w-10 h-6 rounded bg-white border border-slate-200 text-xs font-mono font-bold flex items-center justify-center text-slate-800">
                  {stair.label}
                </span>
                <span className="text-xs font-bold text-slate-800">{stair.full}</span>
                {stair.isSpecial === 'kg' && (
                  <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-100 text-emerald-800 font-bold">
                    Satuan Pokok (kg)
                  </span>
                )}
                {stair.isSpecial === 'ons' && (
                  <span className="px-1.5 py-0.5 rounded text-[10px] bg-amber-100 text-amber-800 font-bold">
                    = 1 ons
                  </span>
                )}
                {stair.isSpecial === 'g' && (
                  <span className="px-1.5 py-0.5 rounded text-[10px] bg-blue-100 text-blue-800 font-bold">
                    Satuan Gram (g)
                  </span>
                )}
              </div>
              <div className="text-[10px] sm:text-[11px] text-slate-600 pr-1">
                {stair.role}
              </div>
            </div>
          ))}
        </div>

        <div className="p-3 rounded-lg bg-emerald-50/60 border border-emerald-200 text-xs text-emerald-950 space-y-1.5 mt-2">
          <div className="flex items-center space-x-1.5 font-bold text-emerald-900">
            <Zap className="w-4 h-4 text-emerald-600" />
            <span>Trik Cepat Satuan Berat: Hitung Tangga lalu Geser Koma!</span>
          </div>
          <p className="leading-relaxed text-slate-700">
            • <strong>kg → g</strong> (turun 3 tangga) = <strong>× 1.000</strong> (geser koma 3 langkah ke kanan). Contoh: 2,5 kg = 2.500 g.<br />
            • <strong>g → kg</strong> (naik 3 tangga) = <strong>÷ 1.000</strong> (geser koma 3 langkah ke kiri). Contoh: 1.500 g = 1,5 kg.<br />
            • <strong>kg → ons (hg)</strong> (turun 1 tangga) = <strong>× 10</strong> (geser koma 1 langkah ke kanan). Contoh: 4,5 kg = 45 ons.<br />
            • <strong>ons (hg) → g</strong> (turun 2 tangga) = <strong>× 100</strong> (geser koma 2 langkah ke kanan). Contoh: 15 ons = 1.500 g.
          </p>
        </div>
      </div>

      {/* 3. Simulator Interaktif Konversi Massa / Berat */}
      <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-3 shadow-2xs">
        <div className="flex flex-col gap-2 pb-2 border-b border-slate-100">
          <div className="flex items-center space-x-2">
            <Calculator className="w-4 h-4 text-emerald-600" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-900">
              Latihan Simulator Konversi Satuan Massa / Berat
            </span>
          </div>

          <div className="flex flex-wrap gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
            {[
              { id: 'kg-to-g', label: 'kg → g (×1.000)' },
              { id: 'g-to-kg', label: 'g → kg (÷1.000)' },
              { id: 'kg-to-ons', label: 'kg → ons (×10)' },
              { id: 'ton-to-kg', label: 'ton → kg (×1.000)' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                  activeTab === tab.id
                    ? 'bg-white text-emerald-700 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {activeTab === 'kg-to-g' && (
          <div className="space-y-2.5">
            <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-600">
              <span className="text-[11px] font-bold text-slate-500 mr-1">Contoh Cepat:</span>
              {presetsKg.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setKgToGVal(p)}
                  className={`px-2 py-0.5 rounded text-xs font-bold border transition-all cursor-pointer ${
                    kgToGVal === p
                      ? 'bg-emerald-600 text-white border-emerald-600'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {p} kg
                </button>
              ))}
            </div>
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex-1 space-y-1">
                <span className="text-[11px] font-bold text-slate-500 uppercase block">Input Berat (kg):</span>
                <input
                  type="text"
                  value={kgToGVal}
                  onChange={(e) => setKgToGVal(e.target.value)}
                  placeholder="mis. 2,5"
                  className="w-28 px-3 py-1.5 rounded-lg bg-white text-slate-900 font-bold font-mono text-center text-sm border border-slate-300 outline-none focus:border-emerald-500"
                />
              </div>
              <div className="text-emerald-700 font-bold text-xs text-center">
                <div>➔ × 1.000</div>
                <div className="text-[10px] font-medium text-slate-500">Geser koma 3 langkah kanan</div>
              </div>
              <div className="flex-1 space-y-1 sm:text-right">
                <span className="text-[11px] font-bold text-emerald-700 uppercase block">Hasil (gram):</span>
                <div className="inline-block px-3 py-1.5 rounded-lg bg-white text-emerald-900 font-bold font-mono text-sm border border-emerald-300">
                  {convertVal(kgToGVal, 1000, false, false)} g
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'g-to-kg' && (
          <div className="space-y-2.5">
            <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-600">
              <span className="text-[11px] font-bold text-slate-500 mr-1">Contoh Cepat:</span>
              {presetsG.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setGToKgVal(p)}
                  className={`px-2 py-0.5 rounded text-xs font-bold border transition-all cursor-pointer ${
                    gToKgVal === p
                      ? 'bg-emerald-600 text-white border-emerald-600'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {p} g
                </button>
              ))}
            </div>
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex-1 space-y-1">
                <span className="text-[11px] font-bold text-slate-500 uppercase block">Input Berat (gram):</span>
                <input
                  type="text"
                  value={gToKgVal}
                  onChange={(e) => setGToKgVal(e.target.value)}
                  className="w-32 px-3 py-1.5 rounded-lg bg-white text-slate-900 font-bold font-mono text-center text-sm border border-slate-300 outline-none focus:border-emerald-500"
                />
              </div>
              <div className="text-emerald-700 font-bold text-xs text-center">
                <div>➔ ÷ 1.000</div>
                <div className="text-[10px] font-medium text-slate-500">Geser koma 3 langkah kiri</div>
              </div>
              <div className="flex-1 space-y-1 sm:text-right">
                <span className="text-[11px] font-bold text-emerald-700 uppercase block">Hasil (kg):</span>
                <div className="inline-block px-3 py-1.5 rounded-lg bg-white text-emerald-900 font-bold font-mono text-sm border border-emerald-300">
                  {convertVal(gToKgVal, 1000, true, true)} kg
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'kg-to-ons' && (
          <div className="space-y-2.5">
            <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-600">
              <span className="text-[11px] font-bold text-slate-500 mr-1">Contoh Cepat:</span>
              {presetsOns.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setKgToOnsVal(p)}
                  className={`px-2 py-0.5 rounded text-xs font-bold border transition-all cursor-pointer ${
                    kgToOnsVal === p
                      ? 'bg-amber-600 text-white border-amber-600'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {p} kg
                </button>
              ))}
            </div>
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex-1 space-y-1">
                <span className="text-[11px] font-bold text-slate-500 uppercase block">Input Berat (kg):</span>
                <input
                  type="text"
                  value={kgToOnsVal}
                  onChange={(e) => setKgToOnsVal(e.target.value)}
                  className="w-28 px-3 py-1.5 rounded-lg bg-white text-slate-900 font-bold font-mono text-center text-sm border border-slate-300 outline-none focus:border-amber-500"
                />
              </div>
              <div className="text-amber-700 font-bold text-xs text-center">
                <div>➔ × 10</div>
                <div className="text-[10px] font-medium text-slate-500">Geser koma 1 langkah kanan (hg = ons)</div>
              </div>
              <div className="flex-1 space-y-1 sm:text-right">
                <span className="text-[11px] font-bold text-amber-700 uppercase block">Hasil (ons / hg):</span>
                <div className="inline-block px-3 py-1.5 rounded-lg bg-white text-amber-900 font-bold font-mono text-sm border border-amber-300">
                  {convertVal(kgToOnsVal, 10, false, false)} ons
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'ton-to-kg' && (
          <div className="space-y-2.5">
            <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-600">
              <span className="text-[11px] font-bold text-slate-500 mr-1">Contoh Cepat:</span>
              {presetsTon.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setTonToKgVal(p)}
                  className={`px-2 py-0.5 rounded text-xs font-bold border transition-all cursor-pointer ${
                    tonToKgVal === p
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {p} ton
                </button>
              ))}
            </div>
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex-1 space-y-1">
                <span className="text-[11px] font-bold text-slate-500 uppercase block">Input Berat (ton):</span>
                <input
                  type="text"
                  value={tonToKgVal}
                  onChange={(e) => setTonToKgVal(e.target.value)}
                  className="w-28 px-3 py-1.5 rounded-lg bg-white text-slate-900 font-bold font-mono text-center text-sm border border-slate-300 outline-none focus:border-blue-500"
                />
              </div>
              <div className="text-blue-700 font-bold text-xs text-center">
                <div>➔ × 1.000</div>
                <div className="text-[10px] font-medium text-slate-500">1 ton = 1.000 kg (geser 3 langkah kanan)</div>
              </div>
              <div className="flex-1 space-y-1 sm:text-right">
                <span className="text-[11px] font-bold text-blue-700 uppercase block">Hasil (kg):</span>
                <div className="inline-block px-3 py-1.5 rounded-lg bg-white text-blue-900 font-bold font-mono text-sm border border-blue-300">
                  {convertVal(tonToKgVal, 1000, false, false)} kg
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * Komponen Interaktif Visual Tangga Satuan Volume / Liter (kL sampai mL)
 * Mendukung aturan geser koma untuk bilangan bulat & desimal serta jembatan ke satuan kubik (m³, dm³, cm³/cc)
 */
const TanggaLiterVisual = () => {
  const [lToMlVal, setLToMlVal] = useState('2,5');
  const [mlToLVal, setMlToLVal] = useState('750');
  const [klToLVal, setKlToLVal] = useState('1,2');
  const [lToDlVal, setLToDlVal] = useState('3,5');
  const [activeTab, setActiveTab] = useState('l-to-ml');

  const STAIRS = [
    { id: 'kL', label: 'kL', full: 'Kiloliter', role: '1 kL = 1 m³ • Awal', isSpecial: 'kL' },
    { id: 'hL', label: 'hL', full: 'Hektoliter', role: 'Turun 1: ×10' },
    { id: 'daL', label: 'daL', full: 'Dekaliter', role: 'Turun 2: ×100' },
    { id: 'L', label: 'L', full: 'Liter', role: 'Satuan Pokok Cairan • 1 L = 1 dm³ • Turun 3: ×1.000', isSpecial: 'L' },
    { id: 'dL', label: 'dL', full: 'Desiliter', role: 'Turun 4: ×10.000' },
    { id: 'cL', label: 'cL', full: 'Sentiliter', role: 'Turun 5: ×100.000' },
    { id: 'mL', label: 'mL', full: 'Mililiter', role: '1 mL = 1 cm³ (cc) • Turun 6: ×1.000.000', isSpecial: 'mL' },
  ];

  const presetsL = ['0,5', '1,25', '2,5', '5', '10'];
  const presetsMl = ['250', '750', '1.500', '3.250'];
  const presetsKl = ['0,5', '1,2', '3', '4,5'];
  const presetsDl = ['1', '2,5', '3,5', '12'];

  const convertVal = (raw, factor, isDivide = false, allowThousands = false) => {
    const n = parseIndoUnitNumber(raw, allowThousands);
    if (isNaN(n)) return '0';
    return formatIndoUnitNumber(isDivide ? n / factor : n * factor);
  };

  return (
    <div className="space-y-3.5 my-3 animate-fade-in">
      {/* 1. Header Banner Aturan Tangga Volume / Liter */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 flex items-start space-x-2.5 shadow-2xs">
          <div className="w-8 h-8 rounded-lg bg-cyan-50 text-cyan-700 border border-cyan-200 flex items-center justify-center flex-shrink-0 font-bold">
            <ArrowDown className="w-4 h-4" />
          </div>
          <div>
            <strong className="block font-bold text-slate-900 text-[11px] uppercase tracking-wider">
              Setiap Turun 1 Tangga:
            </strong>
            <span className="text-slate-600 leading-relaxed">
              Dikali (×) 10 • <strong>Geser koma 1 langkah ke kanan</strong> (bilangan bulat: tambah 0 di belakang)
            </span>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 flex items-start space-x-2.5 shadow-2xs">
          <div className="w-8 h-8 rounded-lg bg-cyan-50 text-cyan-700 border border-cyan-200 flex items-center justify-center flex-shrink-0 font-bold">
            <ArrowUp className="w-4 h-4" />
          </div>
          <div>
            <strong className="block font-bold text-slate-900 text-[11px] uppercase tracking-wider">
              Setiap Naik 1 Tangga:
            </strong>
            <span className="text-slate-600 leading-relaxed">
              Dibagi (÷) 10 • <strong>Geser koma 1 langkah ke kiri</strong>
            </span>
          </div>
        </div>
      </div>

      {/* 2. Visualisasi Tangga Volume / Liter */}
      <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-3 shadow-2xs">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center space-x-1.5">
            <Layers className="w-4 h-4 text-cyan-600" />
            <span>Peta Tangga Satuan Volume / Liter (kL sampai mL)</span>
          </span>
          <span className="text-[11px] font-bold text-cyan-700 bg-cyan-50 border border-cyan-200 px-2 py-0.5 rounded-full">
            7 Tingkat
          </span>
        </div>

        {/* Jembatan Satuan Kubik */}
        <div className="flex flex-wrap gap-2 text-[11px]">
          <span className="px-2.5 py-1 rounded-lg bg-blue-50 border border-blue-200 text-blue-900 font-bold">
            1 kL = 1 m³ = 1.000 L
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-cyan-50 border border-cyan-200 text-cyan-900 font-bold">
            1 L = 1 dm³ = 1.000 mL
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 font-bold">
            1 mL = 1 cm³ = 1 cc
          </span>
        </div>

        <div className="space-y-1.5 pt-1">
          {STAIRS.map((stair, index) => (
            <div
              key={stair.id}
              className={`flex flex-wrap items-center justify-between gap-1.5 p-2 rounded-lg border transition-all ${
                stair.isSpecial === 'kL'
                  ? 'bg-blue-50/60 border-blue-200 font-semibold'
                  : stair.isSpecial === 'L'
                  ? 'bg-cyan-50/70 border-cyan-300 font-semibold'
                  : stair.isSpecial === 'mL'
                  ? 'bg-amber-50/70 border-amber-300 font-semibold'
                  : 'bg-slate-50/70 border-slate-200'
              }`}
              style={{
                marginLeft: `${Math.min(index * 4, 24)}%`,
              }}
            >
              <div className="flex items-center flex-wrap gap-1.5">
                <span className="w-10 h-6 rounded bg-white border border-slate-200 text-xs font-mono font-bold flex items-center justify-center text-slate-800">
                  {stair.label}
                </span>
                <span className="text-xs font-bold text-slate-800">{stair.full}</span>
                {stair.isSpecial === 'kL' && (
                  <span className="px-1.5 py-0.5 rounded text-[10px] bg-blue-100 text-blue-800 font-bold">
                    = 1 m³
                  </span>
                )}
                {stair.isSpecial === 'L' && (
                  <span className="px-1.5 py-0.5 rounded text-[10px] bg-cyan-100 text-cyan-800 font-bold">
                    = 1 dm³ (Utama)
                  </span>
                )}
                {stair.isSpecial === 'mL' && (
                  <span className="px-1.5 py-0.5 rounded text-[10px] bg-amber-100 text-amber-800 font-bold">
                    = 1 cm³ / cc
                  </span>
                )}
              </div>
              <div className="text-[10px] sm:text-[11px] text-slate-600 pr-1">
                {stair.role}
              </div>
            </div>
          ))}
        </div>

        <div className="p-3 rounded-lg bg-cyan-50/60 border border-cyan-200 text-xs text-cyan-950 space-y-1.5 mt-2">
          <div className="flex items-center space-x-1.5 font-bold text-cyan-900">
            <Zap className="w-4 h-4 text-cyan-600" />
            <span>Trik Cepat Satuan Liter: Hitung Tangga lalu Geser Koma!</span>
          </div>
          <p className="leading-relaxed text-slate-700">
            • <strong>L → mL</strong> (turun 3 tangga) = <strong>× 1.000</strong> (geser koma 3 langkah ke kanan). Contoh: 2,5 L = 2.500 mL.<br />
            • <strong>mL → L</strong> (naik 3 tangga) = <strong>÷ 1.000</strong> (geser koma 3 langkah ke kiri). Contoh: 750 mL = 0,75 L.<br />
            • <strong>kL → L</strong> (turun 3 tangga) = <strong>× 1.000</strong> (geser koma 3 langkah ke kanan). Contoh: 1,2 kL = 1.200 L = 1.200 dm³.<br />
            • <strong>L → dL</strong> (turun 1 tangga) = <strong>× 10</strong> (geser koma 1 langkah ke kanan). Contoh: 3,5 L = 35 dL.
          </p>
        </div>
      </div>

      {/* 3. Simulator Interaktif Konversi Volume / Liter */}
      <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-3 shadow-2xs">
        <div className="flex flex-col gap-2 pb-2 border-b border-slate-100">
          <div className="flex items-center space-x-2">
            <Calculator className="w-4 h-4 text-cyan-600" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-900">
              Latihan Simulator Konversi Satuan Volume / Liter
            </span>
          </div>

          <div className="flex flex-wrap gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
            {[
              { id: 'l-to-ml', label: 'L → mL (×1.000)' },
              { id: 'ml-to-l', label: 'mL → L (÷1.000)' },
              { id: 'kl-to-l', label: 'kL → L (×1.000)' },
              { id: 'l-to-dl', label: 'L → dL (×10)' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                  activeTab === tab.id
                    ? 'bg-white text-cyan-700 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {activeTab === 'l-to-ml' && (
          <div className="space-y-2.5">
            <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-600">
              <span className="text-[11px] font-bold text-slate-500 mr-1">Contoh Cepat:</span>
              {presetsL.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setLToMlVal(p)}
                  className={`px-2 py-0.5 rounded text-xs font-bold border transition-all cursor-pointer ${
                    lToMlVal === p
                      ? 'bg-cyan-600 text-white border-cyan-600'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {p} L
                </button>
              ))}
            </div>
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex-1 space-y-1">
                <span className="text-[11px] font-bold text-slate-500 uppercase block">Input Volume (L):</span>
                <input
                  type="text"
                  value={lToMlVal}
                  onChange={(e) => setLToMlVal(e.target.value)}
                  placeholder="mis. 2,5"
                  className="w-28 px-3 py-1.5 rounded-lg bg-white text-slate-900 font-bold font-mono text-center text-sm border border-slate-300 outline-none focus:border-cyan-500"
                />
              </div>
              <div className="text-cyan-700 font-bold text-xs text-center">
                <div>➔ × 1.000</div>
                <div className="text-[10px] font-medium text-slate-500">Geser koma 3 langkah kanan</div>
              </div>
              <div className="flex-1 space-y-1 sm:text-right">
                <span className="text-[11px] font-bold text-cyan-700 uppercase block">Hasil (mL / cc):</span>
                <div className="inline-block px-3 py-1.5 rounded-lg bg-white text-cyan-900 font-bold font-mono text-sm border border-cyan-300">
                  {convertVal(lToMlVal, 1000, false, false)} mL
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'ml-to-l' && (
          <div className="space-y-2.5">
            <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-600">
              <span className="text-[11px] font-bold text-slate-500 mr-1">Contoh Cepat:</span>
              {presetsMl.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setMlToLVal(p)}
                  className={`px-2 py-0.5 rounded text-xs font-bold border transition-all cursor-pointer ${
                    mlToLVal === p
                      ? 'bg-cyan-600 text-white border-cyan-600'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {p} mL
                </button>
              ))}
            </div>
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex-1 space-y-1">
                <span className="text-[11px] font-bold text-slate-500 uppercase block">Input Volume (mL):</span>
                <input
                  type="text"
                  value={mlToLVal}
                  onChange={(e) => setMlToLVal(e.target.value)}
                  className="w-32 px-3 py-1.5 rounded-lg bg-white text-slate-900 font-bold font-mono text-center text-sm border border-slate-300 outline-none focus:border-cyan-500"
                />
              </div>
              <div className="text-cyan-700 font-bold text-xs text-center">
                <div>➔ ÷ 1.000</div>
                <div className="text-[10px] font-medium text-slate-500">Geser koma 3 langkah kiri</div>
              </div>
              <div className="flex-1 space-y-1 sm:text-right">
                <span className="text-[11px] font-bold text-cyan-700 uppercase block">Hasil (L / dm³):</span>
                <div className="inline-block px-3 py-1.5 rounded-lg bg-white text-cyan-900 font-bold font-mono text-sm border border-cyan-300">
                  {convertVal(mlToLVal, 1000, true, true)} L
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'kl-to-l' && (
          <div className="space-y-2.5">
            <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-600">
              <span className="text-[11px] font-bold text-slate-500 mr-1">Contoh Cepat:</span>
              {presetsKl.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setKlToLVal(p)}
                  className={`px-2 py-0.5 rounded text-xs font-bold border transition-all cursor-pointer ${
                    klToLVal === p
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {p} kL
                </button>
              ))}
            </div>
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex-1 space-y-1">
                <span className="text-[11px] font-bold text-slate-500 uppercase block">Input Volume (kL / m³):</span>
                <input
                  type="text"
                  value={klToLVal}
                  onChange={(e) => setKlToLVal(e.target.value)}
                  className="w-28 px-3 py-1.5 rounded-lg bg-white text-slate-900 font-bold font-mono text-center text-sm border border-slate-300 outline-none focus:border-blue-500"
                />
              </div>
              <div className="text-blue-700 font-bold text-xs text-center">
                <div>➔ × 1.000</div>
                <div className="text-[10px] font-medium text-slate-500">Geser koma 3 langkah kanan</div>
              </div>
              <div className="flex-1 space-y-1 sm:text-right">
                <span className="text-[11px] font-bold text-blue-700 uppercase block">Hasil (L):</span>
                <div className="inline-block px-3 py-1.5 rounded-lg bg-white text-blue-900 font-bold font-mono text-sm border border-blue-300">
                  {convertVal(klToLVal, 1000, false, false)} L
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'l-to-dl' && (
          <div className="space-y-2.5">
            <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-600">
              <span className="text-[11px] font-bold text-slate-500 mr-1">Contoh Cepat:</span>
              {presetsDl.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setLToDlVal(p)}
                  className={`px-2 py-0.5 rounded text-xs font-bold border transition-all cursor-pointer ${
                    lToDlVal === p
                      ? 'bg-amber-600 text-white border-amber-600'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {p} L
                </button>
              ))}
            </div>
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex-1 space-y-1">
                <span className="text-[11px] font-bold text-slate-500 uppercase block">Input Volume (L):</span>
                <input
                  type="text"
                  value={lToDlVal}
                  onChange={(e) => setLToDlVal(e.target.value)}
                  className="w-28 px-3 py-1.5 rounded-lg bg-white text-slate-900 font-bold font-mono text-center text-sm border border-slate-300 outline-none focus:border-amber-500"
                />
              </div>
              <div className="text-amber-700 font-bold text-xs text-center">
                <div>➔ × 10</div>
                <div className="text-[10px] font-medium text-slate-500">Geser koma 1 langkah kanan</div>
              </div>
              <div className="flex-1 space-y-1 sm:text-right">
                <span className="text-[11px] font-bold text-amber-700 uppercase block">Hasil (dL):</span>
                <div className="inline-block px-3 py-1.5 rounded-lg bg-white text-amber-900 font-bold font-mono text-sm border border-amber-300">
                  {convertVal(lToDlVal, 10, false, false)} dL
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * Komponen Utama Pembaca Materi Pembelajaran TKA SD
 */
const MaterialReader = ({ bab, onStartQuiz }) => {
  const isMath = Boolean(bab?.id && bab.id.startsWith('mtk'));
  const [currentSlide, setCurrentSlide] = useState(0);
  const [searchBaku, setSearchBaku] = useState('');
  const [openContohDropdown, setOpenContohDropdown] = useState({});

  // Reset slide dan search setiap kali materi bab berganti
  useEffect(() => {
    setCurrentSlide(0);
    setSearchBaku('');
    setOpenContohDropdown({});
  }, [bab?.id]);

  // Navigasi keyboard (Panah Kiri / Panah Kanan)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowRight') {
        setCurrentSlide((prev) => Math.min(prev + 1, slides.length - 1));
      } else if (e.key === 'ArrowLeft') {
        setCurrentSlide((prev) => Math.max(prev - 1, 0));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  if (!bab) return null;

  const toggleContohDropdown = (key) => {
    setOpenContohDropdown((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // --- PEMBENTUKAN STRUKTUR SLIDE DENGAN DESAIN KONSISTEN ---
  const slides = [];

  // SLIDE 1: PENGENALAN & TUJUAN BELAJAR
  slides.push({
    id: 'intro',
    badge: `Materi ${bab.no} • Bagian 1`,
    title: bab.judul,
    subtitle: 'Pengenalan & Tujuan Belajar',
    icon: BookOpen,
    render: () => (
      <div className="p-5 sm:p-6 rounded-lg bg-white border border-slate-200 shadow-sm space-y-4 animate-fade-in">
        {/* Header Bersih & Elegan */}
        <div className="pb-3 border-b border-slate-100">
          <div className="flex items-center space-x-2 text-xs font-bold text-blue-700 uppercase tracking-wider mb-1.5">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span>Materi {bab.no}</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            {bab.judul}
          </h3>
          <div
            className="text-xs sm:text-sm text-slate-600 mt-1.5 leading-relaxed whitespace-pre-line"
            dangerouslySetInnerHTML={{
              __html: formatMath(
                bab.ringkasan ||
                  'Yuk pelajari materi ini pelan-pelan bareng contoh soalnya!'
              ),
            }}
          />
        </div>

        {/* Misi Pembelajaran */}
        {bab.tujuan && (
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 flex items-start space-x-3.5">
            <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 border border-blue-200/60 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Target className="w-4 h-4" />
            </div>
            <div className="space-y-0.5 flex-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700 block">
                Yang Akan Kamu Pelajari:
              </span>
              <div
                className="text-xs sm:text-sm text-slate-700 font-medium leading-relaxed whitespace-pre-line"
                dangerouslySetInnerHTML={{ __html: formatMath(bab.tujuan) }}
              />
            </div>
          </div>
        )}

        {/* Petunjuk Belajar */}
        <div className="p-3.5 rounded-xl bg-slate-50/70 border border-slate-200 text-xs text-slate-600 flex items-center space-x-2.5">
          <Info className="w-4 h-4 text-slate-500 flex-shrink-0" />
          <p className="leading-relaxed">
            Klik tombol <strong>"Lanjut"</strong> di bawah untuk pindah ke halaman berikutnya. Baca pelan-pelan dan pahami contohnya ya.
          </p>
        </div>
      </div>
    ),
  });

  // SLIDE 2: KONSEP KUNCI / KAIDAH POKOK (DESAIN KONSISTEN)
  if (bab.konsepKunci) {
    slides.push({
      id: 'konsep_kunci',
      badge: `Materi ${bab.no} • Bagian 2`,
      title: 'Poin Penting Materi',
      subtitle: 'Dasar yang Perlu Diingat',
      icon: Lightbulb,
      render: () => (
        <div className="p-5 sm:p-6 rounded-lg bg-white border border-slate-200 shadow-sm space-y-4 animate-fade-in">
          {/* Header Konsisten */}
          <div className="flex items-center space-x-3 pb-3 border-b border-slate-100">
            <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 border border-blue-200/60 flex items-center justify-center flex-shrink-0 font-bold">
              <Lightbulb className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider block">
                Inti Materi
              </span>
              <h4 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                Ringkasan {bab.judul}
              </h4>
            </div>
          </div>

          {/* Konten dengan Parser Cerdas & Dropdown */}
          <div className="pt-1">
            <EnhancedContentRenderer content={bab.konsepKunci} />
          </div>

          {/* Catatan Mengapa Konsep Penting */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 flex items-start space-x-2.5">
            <Info className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
            <span className="leading-relaxed">
              <strong className="text-slate-900">Catatan:</strong> Pahami bagian ini baik-baik karena bakal sering dipakai waktu mengerjakan latihan soal dan tryout.
            </span>
          </div>
        </div>
      ),
    });
  }

  // SLIDE 3..N: PEMBAHASAN MENDALAM TIAP SUBMATERI
  const isPengukuranBab =
    bab.id === 'mtk_5' || (bab.judul || '').toLowerCase().includes('pengukuran');
  let hasRenderedTanggaBerat = false;
  let hasRenderedTanggaLiter = false;

  if (bab.uraianMateri && bab.uraianMateri.length > 0) {
    bab.uraianMateri.forEach((item, idx) => {
      const contohKey = `uraian_${idx}_contoh`;
      const isContohOpen = openContohDropdown[contohKey] ?? true; // Default terbuka
      const subLower = (item.subjudul || '').toLowerCase();
      const showTanggaBerat =
        item.tipe === 'tangga_berat' ||
        (subLower.includes('tangga') && (subLower.includes('berat') || subLower.includes('massa'))) ||
        (isPengukuranBab && (subLower.includes('berat') || subLower.includes('massa')));
      const showTanggaLiter =
        item.tipe === 'tangga_liter' ||
        (subLower.includes('tangga') && (subLower.includes('liter') || subLower.includes('volume'))) ||
        (isPengukuranBab && (subLower.includes('liter') || subLower.includes('volume')));
      const showTanggaPanjang =
        !showTanggaBerat &&
        !showTanggaLiter &&
        (item.tipe === 'tangga_satuan' || subLower.includes('tangga'));

      if (showTanggaBerat) hasRenderedTanggaBerat = true;
      if (showTanggaLiter) hasRenderedTanggaLiter = true;

      slides.push({
        id: `uraian_${idx}`,
        badge: `Materi ${bab.no} • Bagian ${idx + 3}`,
        title: item.subjudul || `Pembahasan Bagian ${idx + 1}`,
        subtitle: 'Penjelasan & Contoh',
        icon: Layers,
        render: () => (
          <div className="p-5 sm:p-6 rounded-lg bg-white border border-slate-200 shadow-sm space-y-4 animate-fade-in">
            {/* Header Subtopik Konsisten */}
            <div className="flex items-center space-x-3 pb-3 border-b border-slate-100">
              <span className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 border border-blue-200/60 flex items-center justify-center text-xs font-bold flex-shrink-0">
                {idx + 1}
              </span>
              <div>
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                  Subtopik {idx + 1}
                </span>
                <h4 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                  {item.subjudul}
                </h4>
              </div>
            </div>

            {/* Uraian Konten dengan Dropdown & Alur Rapi */}
            {item.konten && (
              <div className="pt-1">
                <EnhancedContentRenderer content={item.konten} />
              </div>
            )}

            {/* Widget Interaktif Tangga Satuan (Panjang, Massa/Berat, Volume/Liter) */}
            {showTanggaBerat && <TanggaBeratVisual />}
            {showTanggaLiter && <TanggaLiterVisual />}
            {showTanggaPanjang && <TanggaSatuanVisual />}

            {/* Rumus / Kaidah Pokok */}
            {item.rumus && (
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700 flex items-center space-x-1.5">
                  <Calculator className="w-3.5 h-3.5 text-blue-600" />
                  <span>Rumus / Aturan Penting:</span>
                </span>
                <div className="bg-white p-2.5 rounded-lg border border-slate-200/90 text-blue-950 font-mono text-xs sm:text-sm font-bold shadow-2xs rich-content-display">
                  <div dangerouslySetInnerHTML={{ __html: formatMath(item.rumus) }} />
                </div>
              </div>
            )}

            {/* Contoh Soal dengan Tulisan Dropdown (Bisa Buka / Tutup) */}
            {item.contoh && (
              <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-2xs">
                <button
                  type="button"
                  onClick={() => toggleContohDropdown(contohKey)}
                  className="w-full p-3 sm:p-3.5 flex items-center justify-between text-left hover:bg-slate-50/80 transition-colors cursor-pointer gap-2"
                >
                  <div className="flex items-center space-x-2 text-emerald-800">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span className="text-xs sm:text-sm font-bold">
                      Contoh Soal & Cara Mengerjakannya
                    </span>
                  </div>
                  <div className="flex items-center space-x-1.5 text-xs text-slate-500 flex-shrink-0">
                    <span className="text-[11px] hidden sm:inline">
                      {isContohOpen ? 'Tutup' : 'Buka'}
                    </span>
                    <div
                      className={`w-6 h-6 rounded-md bg-slate-100 flex items-center justify-center text-slate-500 transition-transform duration-200 ${
                        isContohOpen ? 'rotate-180 bg-emerald-50 text-emerald-600' : ''
                      }`}
                    >
                      <ChevronDown className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </button>

                {isContohOpen && (
                  <div className="p-3.5 pt-1 border-t border-slate-100 bg-slate-50/40 animate-fade-in">
                    <div className="p-3 rounded-lg bg-white border border-slate-200 text-xs sm:text-sm text-slate-800 leading-relaxed font-medium rich-content-display">
                      <div dangerouslySetInnerHTML={{ __html: formatMath(item.contoh) }} />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Catatan / Poin Tambahan */}
            {item.poin && Array.isArray(item.poin) && item.poin.length > 0 && (
              <div className="space-y-1.5 pt-1">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                  Catatan Penting:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {item.poin.map((p, pIdx) => (
                    <div
                      key={pIdx}
                      className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-700 flex items-start space-x-2"
                    >
                      <Check className="w-3.5 h-3.5 text-blue-600 mt-0.5 flex-shrink-0" />
                      <span dangerouslySetInnerHTML={{ __html: formatMath(p) }} />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ),
      });
    });
  }

  // Fallback khusus materi Pengukuran: jika konten di database/Admin belum memiliki subtopik tangga berat/liter,
  // tetap tampilkan slide interaktif Tangga Satuan Massa/Berat & Volume/Liter agar selalu bisa dipelajari.
  if (isPengukuranBab && !hasRenderedTanggaBerat) {
    const nextBagian = slides.length + 1;
    slides.push({
      id: 'auto_tangga_berat',
      badge: `Materi ${bab.no} • Bagian ${nextBagian}`,
      title: 'Tangga Satuan Massa / Berat (kg sampai mg)',
      subtitle: 'Visual Tangga & Simulator Konversi',
      icon: Layers,
      render: () => (
        <div className="p-5 sm:p-6 rounded-lg bg-white border border-slate-200 shadow-sm space-y-4 animate-fade-in">
          <div className="flex items-center space-x-3 pb-3 border-b border-slate-100">
            <span className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center text-xs font-bold flex-shrink-0">
              kg
            </span>
            <div>
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Visual Interaktif
              </span>
              <h4 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                Tangga Satuan Massa / Berat (kg sampai mg)
              </h4>
            </div>
          </div>
          <TanggaBeratVisual />
        </div>
      ),
    });
  }

  if (isPengukuranBab && !hasRenderedTanggaLiter) {
    const nextBagian = slides.length + 1;
    slides.push({
      id: 'auto_tangga_liter',
      badge: `Materi ${bab.no} • Bagian ${nextBagian}`,
      title: 'Tangga Satuan Volume / Liter (kL sampai mL)',
      subtitle: 'Visual Tangga & Simulator Konversi',
      icon: Layers,
      render: () => (
        <div className="p-5 sm:p-6 rounded-lg bg-white border border-slate-200 shadow-sm space-y-4 animate-fade-in">
          <div className="flex items-center space-x-3 pb-3 border-b border-slate-100">
            <span className="w-8 h-8 rounded-lg bg-cyan-50 text-cyan-700 border border-cyan-200 flex items-center justify-center text-xs font-bold flex-shrink-0">
              L
            </span>
            <div>
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Visual Interaktif
              </span>
              <h4 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                Tangga Satuan Volume / Liter (kL sampai mL)
              </h4>
            </div>
          </div>
          <TanggaLiterVisual />
        </div>
      ),
    });
  }

  // SLIDE KOSAKATA BAKU VS TIDAK BAKU (BAHASA INDONESIA)
  if (bab.daftarBaku && bab.daftarBaku.length > 0) {
    const filteredBaku = bab.daftarBaku.filter(
      (item) =>
        item.baku.toLowerCase().includes(searchBaku.toLowerCase()) ||
        item.tidakBaku.toLowerCase().includes(searchBaku.toLowerCase())
    );

    slides.push({
      id: 'daftar_baku',
      badge: 'Daftar Kosakata',
      title: 'Kosakata Baku vs Tidak Baku',
      subtitle: 'Berdasarkan KBBI',
      icon: FileText,
      render: () => (
        <div className="p-5 sm:p-6 rounded-lg bg-white border border-slate-200 shadow-sm space-y-4 animate-fade-in">
          <div className="pb-3 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-[11px] font-bold text-blue-700 uppercase tracking-wider block">
                Daftar Kata
              </span>
              <h4 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                Kosakata Baku (KBBI) vs Tidak Baku
              </h4>
            </div>

            {/* Input Pencarian Kosakata */}
            <div className="relative w-full sm:w-60">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchBaku}
                onChange={(e) => setSearchBaku(e.target.value)}
                placeholder="Cari kata..."
                className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-800 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-100 transition-all bg-slate-50/60"
              />
            </div>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed">
            Cek perbedaannya di bawah ini. Yang kiri adalah kata <strong>baku</strong> (sesuai KBBI), sedangkan yang kanan adalah bentuk <strong>tidak baku</strong> yang sering keliru ditulis.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[360px] overflow-y-auto slate-scrollbar pr-1">
            {filteredBaku.length > 0 ? (
              filteredBaku.map((item, idx) => (
                <div
                  key={idx}
                  className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between text-xs hover:border-slate-300 transition-all shadow-2xs"
                >
                  <div className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span className="font-bold text-emerald-950">{item.baku}</span>
                  </div>
                  <div className="flex items-center space-x-1.5 text-rose-500 line-through">
                    <XCircle className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>{item.tidakBaku}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-2 text-center py-6 text-xs text-slate-400">
                Tidak ada kata yang cocok dengan pencarian "{searchBaku}".
              </div>
            )}
          </div>
        </div>
      ),
    });
  }

  // SLIDE BEDAH CONTOH SOAL TKA SD DENGAN PEMBAHASAN DETAIL
  if (bab.contohSoal) {
    const isBedahOpen = openContohDropdown['bedah_soal'] ?? true;

    slides.push({
      id: 'contoh_soal',
      badge: 'Contoh Soal',
      title: 'Pembahasan Contoh Soal',
      subtitle: 'Soal & Cara Mengerjakannya',
      icon: HelpCircle,
      render: () => (
        <div className="p-5 sm:p-6 rounded-lg bg-white border border-slate-200 shadow-sm space-y-4 animate-fade-in">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center space-x-2.5">
              <span className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 border border-blue-200/60 flex items-center justify-center text-xs font-bold">
                <FileText className="w-4 h-4 text-blue-600" />
              </span>
              <div>
                <span className="text-[11px] font-bold text-blue-700 uppercase tracking-wider block">
                  Contoh Soal
                </span>
                <h4 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                  Soal & Langkah Penyelesaian
                </h4>
              </div>
            </div>
            <span className="text-[11px] text-slate-500 font-semibold bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
              Kelas 4 - 6 SD
            </span>
          </div>

          {/* Kotak Pertanyaan */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
              Soal:
            </span>
            <div
              className="text-xs sm:text-sm font-bold text-slate-900 leading-relaxed rich-content-display"
              dangerouslySetInnerHTML={{ __html: formatMath(bab.contohSoal.soal) }}
            />
          </div>

          {/* Kotak Pembahasan dengan Tulisan Dropdown */}
          <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-2xs">
            <button
              type="button"
              onClick={() => toggleContohDropdown('bedah_soal')}
              className="w-full p-3 sm:p-3.5 flex items-center justify-between text-left hover:bg-slate-50/80 transition-colors cursor-pointer gap-2"
            >
              <div className="flex items-center space-x-2 text-emerald-800">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span className="text-xs sm:text-sm font-bold">
                  Cara Mengerjakan & Pembahasan
                </span>
              </div>
              <div className="flex items-center space-x-1.5 text-xs text-slate-500 flex-shrink-0">
                <span className="text-[11px] hidden sm:inline">
                  {isBedahOpen ? 'Tutup' : 'Buka'}
                </span>
                <div
                  className={`w-6 h-6 rounded-md bg-slate-100 flex items-center justify-center text-slate-500 transition-transform duration-200 ${
                    isBedahOpen ? 'rotate-180 bg-emerald-50 text-emerald-600' : ''
                  }`}
                >
                  <ChevronDown className="w-3.5 h-3.5" />
                </div>
              </div>
            </button>

            {isBedahOpen && (
              <div className="p-3.5 pt-1 border-t border-slate-100 bg-slate-50/40 animate-fade-in">
                <div className="p-3 rounded-lg bg-white border border-slate-200 text-xs sm:text-sm text-slate-800 leading-relaxed font-medium">
                  <EnhancedContentRenderer content={bab.contohSoal.penjelasan} />
                </div>
              </div>
            )}
          </div>
        </div>
      ),
    });
  }

  // SLIDE TERAKHIR: RANGKUMAN & KUIS PEMAHAMAN
  slides.push({
    id: 'summary',
    badge: 'Langkah Terakhir',
    title: 'Rangkuman & Kuis',
    subtitle: 'Waktunya Cek Pemahaman!',
    icon: Award,
    render: () => (
      <div className="p-5 sm:p-6 rounded-lg bg-white border border-slate-200 shadow-sm space-y-4 animate-fade-in">
        {/* Tips Belajar */}
        {bab.tipsJuara && (
          <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200/80 flex items-start space-x-3">
            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 border border-amber-300 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Sparkles className="w-4 h-4 text-amber-600" />
            </div>
            <div className="space-y-0.5">
              <strong className="text-amber-900 block font-bold text-xs uppercase tracking-wider">
                Tips Ingat Cepat:
              </strong>
              <div
                className="text-xs sm:text-sm text-slate-700 leading-relaxed font-medium rich-content-display"
                dangerouslySetInnerHTML={{ __html: formatMath(bab.tipsJuara) }}
              />
            </div>
          </div>
        )}

        {/* Checklist Pemahaman */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
          <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Yang Sudah Kamu Pelajari:</span>
          </h4>
          <div className="space-y-1.5 text-xs text-slate-700">
            <div className="flex items-center space-x-2 p-2 rounded-lg bg-white border border-slate-200/80">
              <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[3]" />
              <span>Sudah paham dasar materi <strong>{bab.judul}</strong>.</span>
            </div>
            <div className="flex items-center space-x-2 p-2 rounded-lg bg-white border border-slate-200/80">
              <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[3]" />
              <span>Sudah melihat contoh soal dan cara mengerjakannya.</span>
            </div>
            <div className="flex items-center space-x-2 p-2 rounded-lg bg-white border border-slate-200/80">
              <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[3]" />
              <span>Siap mengerjakan kuis untuk membuka materi berikutnya.</span>
            </div>
          </div>
        </div>

        {/* Banner CTA Kuis Pemahaman */}
        <div
          className={`p-4 sm:p-5 rounded-lg text-white shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-center sm:text-left transition-all duration-300 ${
            isMath ? 'bg-[#881337]' : 'bg-[#047857]'
          }`}
        >
          <div>
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider inline-block mb-1 border ${
                isMath
                  ? 'bg-[#700D2B] text-rose-100 border-[#9F1239]'
                  : 'bg-[#065F46] text-emerald-100 border-[#059669]'
              }`}
            >
              Kuis Singkat
            </span>
            <h4 className="text-sm sm:text-base font-bold">
              Sudah selesai baca? Yuk coba kuisnya!
            </h4>
            <p className={`text-xs mt-0.5 leading-relaxed ${isMath ? 'text-rose-100' : 'text-emerald-100'}`}>
              Jawab 3 soal kuis di materi ini buat kumpulkan bintang.
            </p>
          </div>

          <button
            onClick={onStartQuiz}
            className={`w-full sm:w-auto px-4 py-2 rounded-lg bg-white font-semibold text-xs sm:text-sm shadow-xs transition-all duration-300 flex items-center justify-center space-x-1.5 cursor-pointer flex-shrink-0 ${
              isMath
                ? 'text-[#881337] hover:bg-rose-50'
                : 'text-[#047857] hover:bg-emerald-50'
            }`}
          >
            <span>Mulai Kuis (3 Soal)</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    ),
  });

  const totalSlides = slides.length;
  const currentSlideData = slides[currentSlide] || slides[0];
  const progressPercent = Math.round(((currentSlide + 1) / totalSlides) * 100);

  return (
    <div className="max-w-3xl mx-auto space-y-4 pb-2 text-slate-800 animate-fade-in">
      {/* 1. Header Bar Navigasi Slide & Progress Bar */}
      <div className="p-3.5 sm:p-4 rounded-lg bg-white border border-slate-200 shadow-sm space-y-2.5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <span
              className={`px-2.5 py-0.5 rounded text-[11px] font-semibold border transition-colors ${
                isMath
                  ? 'bg-[#FFF1F2] text-[#881337] border-[#FECDD3]'
                  : 'bg-[#ECFDF5] text-[#047857] border-[#A7F3D0]'
              }`}
            >
              Slide {currentSlide + 1} dari {totalSlides}
            </span>
            <span className="text-xs font-semibold text-slate-700 hidden sm:inline">
              {currentSlideData.subtitle}
            </span>
          </div>

          {/* Stepper Dots yang Bisa Diklik */}
          <div className="flex items-center space-x-1.5">
            {slides.map((s, idx) => (
              <button
                key={s.id}
                onClick={() => setCurrentSlide(idx)}
                className={`transition-all duration-300 rounded-full cursor-pointer ${
                  idx === currentSlide
                    ? `w-6 h-2 ${isMath ? 'bg-[#881337]' : 'bg-[#047857]'} shadow-2xs`
                    : idx < currentSlide
                    ? `${isMath ? 'bg-[#FDA4AF]' : 'bg-[#6EE7B7]'} w-2 h-2`
                    : 'w-2 h-2 bg-slate-200 hover:bg-slate-300'
                }`}
                title={`Buka Slide ${idx + 1}: ${s.subtitle}`}
              />
            ))}
          </div>
        </div>

        {/* Bar Progres */}
        <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
          <div
            className={`h-1.5 rounded-full transition-all duration-300 ${
              isMath ? 'bg-[#881337]' : 'bg-[#047857]'
            }`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* 2. Judul Bagian Slide Aktif */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center space-x-2">
          <currentSlideData.icon
            className={`w-4 h-4 ${isMath ? 'text-[#881337]' : 'text-[#047857]'}`}
          />
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            {currentSlideData.badge}
          </span>
        </div>
        <span className="text-xs text-slate-400 font-medium">
          <span className="hidden sm:inline">Tekan tombol panah ← / → di keyboard</span>
          <span className="sm:hidden text-[11px] font-semibold text-slate-500">{currentSlide + 1} / {totalSlides} Slide</span>
        </span>
      </div>

      {/* 3. Konten Utama Slide Terpilih */}
      <div className="min-h-0 sm:min-h-[340px]">
        {currentSlideData.render()}
      </div>

      {/* 4. Footer Bar Tombol Navigasi Antar Slide */}
      <div className="pt-3 border-t border-slate-200 flex items-center justify-between gap-2 sm:gap-3">
        {/* Tombol Sebelumnya */}
        <button
          onClick={() => setCurrentSlide((prev) => Math.max(0, prev - 1))}
          disabled={currentSlide === 0}
          className={`px-3 sm:px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center space-x-1 sm:space-x-1.5 transition-all active:scale-95 ${
            currentSlide === 0
              ? 'opacity-40 cursor-not-allowed bg-slate-100 text-slate-400'
              : 'bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 cursor-pointer shadow-2xs'
          }`}
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Sebelumnya</span>
        </button>

        {/* Indikator Posisi di Tengah */}
        <div className="text-[11px] font-semibold text-slate-500 hidden sm:block">
          {currentSlide + 1} / {totalSlides} Slide
        </div>

        {/* Tombol Selanjutnya */}
        {currentSlide < totalSlides - 1 ? (
          <button
            onClick={() => setCurrentSlide((prev) => Math.min(totalSlides - 1, prev + 1))}
            className={`px-3.5 sm:px-4 py-2 rounded-lg text-white font-semibold text-xs shadow-xs transition-all duration-300 flex items-center space-x-1 sm:space-x-1.5 cursor-pointer active:scale-95 ${
              isMath
                ? 'bg-[#881337] hover:bg-[#700D2B]'
                : 'bg-[#047857] hover:bg-[#065F46]'
            }`}
          >
            <span>Lanjut <span className="hidden xs:inline">Slide</span></span>
            <ChevronRight className="w-4 h-4" />
          </button>
        ) : (
          <div
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold select-none border ${
              isMath
                ? 'bg-[#FFF1F2] text-[#881337] border-[#FECDD3]'
                : 'bg-[#ECFDF5] text-[#047857] border-[#A7F3D0]'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Slide Terakhir</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default MaterialReader;
