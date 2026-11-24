import React, { useState, useEffect, useRef } from 'react';
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Type,
  RotateCcw,
  CornerDownRight,
  List,
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Indent,
  Outdent,
  Highlighter,
  Palette,
  Superscript,
  Subscript,
  Undo2,
  Redo2,
  Sparkles,
} from 'lucide-react';

/**
 * Daftar Pilihan Font (Mirip Microsoft Word)
 */
export const FONT_OPTIONS = [
  { label: 'Poppins (Default)', value: 'Poppins, sans-serif' },
  { label: 'Calibri', value: 'Calibri, Candara, Segoe, sans-serif' },
  { label: 'Arial', value: 'Arial, Helvetica, sans-serif' },
  { label: 'Times New Roman', value: "'Times New Roman', Times, serif" },
  { label: 'Georgia', value: 'Georgia, serif' },
  { label: 'Verdana', value: 'Verdana, Geneva, sans-serif' },
  { label: 'Trebuchet MS', value: "'Trebuchet MS', sans-serif" },
  { label: 'Courier New', value: "'Courier New', Courier, monospace" },
  { label: 'Comic Sans MS', value: "'Comic Sans MS', cursive, sans-serif" },
];

/**
 * Daftar Pilihan Ukuran Huruf (Mirip Microsoft Word)
 */
export const FONT_SIZE_OPTIONS = [
  { label: '10 pt (Kecil)', value: '0.88em' },
  { label: '12 pt (Normal)', value: '1em' },
  { label: '14 pt (Sedang)', value: '1.12em' },
  { label: '16 pt (Besar)', value: '1.25em' },
  { label: '18 pt (Subjudul)', value: '1.4em' },
  { label: '22 pt (Judul)', value: '1.65em' },
];

/**
 * Pilihan Warna Tulisan (Text Color)
 */
export const TEXT_COLOR_OPTIONS = [
  { label: 'Default (Otomatis)', value: '' },
  { label: 'Merah Penting', value: '#DC2626', preview: '#EF4444' },
  { label: 'Biru Fokus', value: '#2563EB', preview: '#3B82F6' },
  { label: 'Hijau Kunci', value: '#047857', preview: '#10B981' },
  { label: 'Oranye / Emas', value: '#D97706', preview: '#F59E0B' },
  { label: 'Ungu Konsep', value: '#7C3AED', preview: '#8B5CF6' },
];

/**
 * Pilihan Warna Stabilo (Highlight Poin Penting)
 */
export const HIGHLIGHT_COLOR_OPTIONS = [
  { label: 'Tanpa Stabilo', bg: '', text: '' },
  { label: 'Stabilo Kuning', bg: '#FEF08A', text: '#1E293B' },
  { label: 'Stabilo Hijau', bg: '#BBF7D0', text: '#064E3B' },
  { label: 'Stabilo Biru', bg: '#BFDBFE', text: '#1E3A8A' },
  { label: 'Stabilo Merah Muda', bg: '#FECDD3', text: '#881337' },
  { label: 'Stabilo Oranye', bg: '#FED7AA', text: '#7C2D12' },
];

/**
 * Mengubah string tersimpan menjadi HTML yang siap ditampilkan di dalam editor WYSIWYG.
 */
const valueToEditorHtml = (raw) => {
  if (raw === null || raw === undefined || raw === '') return '';
  let str = String(raw)
    .replace(/\[h(?:orizontal)?\]\s*/gi, '')
    .replace(/\r\n/g, '\n');

  // Konversi markdown **bold** menjadi <b>bold</b>
  str = str.replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>');

  // Konversi newline \n menjadi <br>
  str = str.replace(/\n/g, '<br>');
  return str;
};

/**
 * Membungkus setiap baris (dipisahkan oleh \n) dengan tag pembuka & penutup
 * agar setiap baris tetap memiliki tag HTML yang utuh dan valid.
 */
const wrapEachLine = (text, openTag, closeTag) => {
  if (!text) return '';
  return text
    .split('\n')
    .map((line) => (line ? `${openTag}${line}${closeTag}` : ''))
    .join('\n');
};

/**
 * Mengonversi DOM di dalam contentEditable kembali menjadi string bersih
 * yang mendukung:
 * - Baris baru (\n)
 * - Bold (<b>), Italic (<i>), Underline (<u>), Strikethrough (<s>), Superscript (<sup>), Subscript (<sub>)
 * - Font family, font size, warna teks, & stabilo (<span style="...">)
 * - Penomoran otomatis (<ol class="ms-word-ol"><li>...</li></ol>) & Daftar Poin (<ul class="ms-word-ul"><li>...</li></ul>)
 * - Perataan tulisan (text-align: left/center/right/justify) & Indentasi
 */
const serializeNodesToValue = (parentNode) => {
  if (!parentNode) return '';

  const serializeInlineOrBlock = (nodes, insideList = false) => {
    let acc = '';
    nodes.forEach((node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        acc += node.nodeValue || '';
        return;
      }

      if (node.nodeType !== Node.ELEMENT_NODE) return;
      const tag = node.tagName.toUpperCase();

      if (tag === 'BR') {
        acc += insideList ? '<br />' : '\n';
        return;
      }

      // Daftar Penomoran (<ol>) atau Daftar Poin Bullets (<ul>)
      if (tag === 'OL' || tag === 'UL') {
        if (acc.length > 0 && !acc.endsWith('\n') && !insideList) {
          acc += '\n';
        }
        const listClass = tag === 'OL' ? 'ms-word-ol' : 'ms-word-ul';
        const itemsHtml = Array.from(node.childNodes)
          .map((child) => {
            if (
              child.nodeType === Node.ELEMENT_NODE &&
              child.tagName.toUpperCase() === 'LI'
            ) {
              const liContent = serializeInlineOrBlock(
                Array.from(child.childNodes),
                true
              ).trim();
              const liAlign = child.style?.textAlign || '';
              const liStyle =
                liAlign && liAlign !== 'left' && liAlign !== 'start'
                  ? ` style="text-align: ${liAlign}"`
                  : '';
              return `<li${liStyle}>${liContent}</li>`;
            }
            return '';
          })
          .filter(Boolean)
          .join('');

        if (itemsHtml) {
          const listTag = tag.toLowerCase();
          acc += `<${listTag} class="${listClass}">${itemsHtml}</${listTag}>`;
          if (!insideList) acc += '\n';
        }
        return;
      }

      // Elemen Blok (DIV, P, BLOCKQUOTE)
      const isBlock =
        tag === 'DIV' ||
        tag === 'P' ||
        tag === 'BLOCKQUOTE' ||
        tag === 'SECTION' ||
        tag === 'ARTICLE';

      if (isBlock) {
        if (acc.length > 0 && !acc.endsWith('\n') && !insideList) {
          acc += '\n';
        }
        // Jika div hanya berisi <br> tunggal (baris kosong saat tekan Enter)
        if (
          node.childNodes.length === 1 &&
          node.childNodes[0].nodeType === Node.ELEMENT_NODE &&
          node.childNodes[0].tagName.toUpperCase() === 'BR'
        ) {
          return;
        }

        let blockInner = serializeInlineOrBlock(
          Array.from(node.childNodes),
          insideList
        );

        const textAlign =
          node.style?.textAlign || node.getAttribute('align') || '';
        const marginLeft =
          node.style?.marginLeft || node.style?.paddingLeft || '';
        const isBlockquote = tag === 'BLOCKQUOTE';

        const blockStyles = [];
        if (
          textAlign &&
          ['center', 'right', 'justify'].includes(textAlign.toLowerCase())
        ) {
          blockStyles.push(`text-align: ${textAlign.toLowerCase()}`);
        }
        if (marginLeft && parseInt(marginLeft, 10) > 0) {
          blockStyles.push(`padding-left: ${marginLeft}`);
        } else if (isBlockquote) {
          blockStyles.push('padding-left: 1.5rem');
        }

        if (blockStyles.length > 0 && blockInner.trim()) {
          const styleStr = blockStyles.join('; ');
          blockInner = wrapEachLine(
            blockInner,
            `<div style="${styleStr}">`,
            '</div>'
          );
        }

        acc += blockInner;
        return;
      }

      // Elemen Inline (B, STRONG, I, EM, U, S, STRIKE, SUP, SUB, SPAN, FONT)
      let inner = serializeInlineOrBlock(
        Array.from(node.childNodes),
        insideList
      );
      if (!inner) return;

      const styleFontFamily =
        node.style?.fontFamily || node.getAttribute('face') || '';
      const styleFontSize = node.style?.fontSize || '';
      const styleFontWeight = node.style?.fontWeight || '';
      const styleFontStyle = node.style?.fontStyle || '';
      const styleTextDecoration = node.style?.textDecoration || '';
      const styleColor = node.style?.color || node.getAttribute('color') || '';
      const styleBgColor = node.style?.backgroundColor || '';

      const isBold =
        tag === 'B' ||
        tag === 'STRONG' ||
        styleFontWeight === 'bold' ||
        Number(styleFontWeight) >= 600;
      const isItalic =
        tag === 'I' || tag === 'EM' || styleFontStyle === 'italic';
      const isUnderline =
        tag === 'U' || styleTextDecoration.includes('underline');
      const isStrike =
        tag === 'S' ||
        tag === 'STRIKE' ||
        tag === 'DEL' ||
        styleTextDecoration.includes('line-through');
      const isSup = tag === 'SUP';
      const isSub = tag === 'SUB';

      if (isSup) inner = wrapEachLine(inner, '<sup>', '</sup>');
      if (isSub) inner = wrapEachLine(inner, '<sub>', '</sub>');
      if (isStrike) inner = wrapEachLine(inner, '<s>', '</s>');
      if (isUnderline) inner = wrapEachLine(inner, '<u>', '</u>');
      if (isItalic) inner = wrapEachLine(inner, '<i>', '</i>');
      if (isBold) inner = wrapEachLine(inner, '<b>', '</b>');

      const styleParts = [];
      if (styleFontFamily) {
        const cleanFont = styleFontFamily.replace(/"/g, "'");
        styleParts.push(`font-family: ${cleanFont}`);
      }
      if (styleFontSize) {
        styleParts.push(`font-size: ${styleFontSize}`);
      }
      if (styleBgColor && styleBgColor !== 'transparent') {
        styleParts.push(`background-color: ${styleBgColor}`);
        styleParts.push('padding: 1px 5px');
        styleParts.push('border-radius: 4px');
      }
      if (styleColor) {
        styleParts.push(`color: ${styleColor}`);
      }

      if (styleParts.length > 0) {
        const styleAttr = styleParts.join('; ');
        inner = wrapEachLine(inner, `<span style="${styleAttr}">`, '</span>');
      }

      acc += inner;
    });
    return acc;
  };

  const result = serializeInlineOrBlock(Array.from(parentNode.childNodes), false);
  return result.replace(/\u00A0/g, ' ').replace(/\n{3,}/g, '\n\n');
};

/**
 * Komponen RichTextEditor Lengkap Bergaya Microsoft Word untuk Admin Panel
 */
const RichTextEditor = ({
  value = '',
  onChange,
  rows = 3,
  placeholder = 'Ketik teks di sini...',
  bgClass = 'bg-[#0F2042]',
  className = '',
}) => {
  const editorRef = useRef(null);
  const lastEmittedRef = useRef(value);
  const savedRangeRef = useRef(null);

  // State indikator tombol aktif ala MS Word
  const [isBoldActive, setIsBoldActive] = useState(false);
  const [isItalicActive, setIsItalicActive] = useState(false);
  const [isUnderlineActive, setIsUnderlineActive] = useState(false);
  const [isStrikeActive, setIsStrikeActive] = useState(false);
  const [isSupActive, setIsSupActive] = useState(false);
  const [isSubActive, setIsSubActive] = useState(false);
  const [isUlActive, setIsUlActive] = useState(false);
  const [isOlActive, setIsOlActive] = useState(false);
  const [activeAlign, setActiveAlign] = useState('left');

  const [selectedFont, setSelectedFont] = useState(FONT_OPTIONS[0].value);
  const [selectedSize, setSelectedSize] = useState(FONT_SIZE_OPTIONS[1].value);
  const [showColorMenu, setShowColorMenu] = useState(false);
  const [showHighlightMenu, setShowHighlightMenu] = useState(false);

  // Sinkronkan isi editor ketika prop value berubah dari luar (misal ganti materi/soal)
  useEffect(() => {
    if (!editorRef.current) return;
    if (value !== lastEmittedRef.current) {
      editorRef.current.innerHTML = valueToEditorHtml(value);
      lastEmittedRef.current = value;
    }
  }, [value]);

  // Set inisialisasi awal saat komponen pertama kali dimuat
  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.innerHTML = valueToEditorHtml(value);
      lastEmittedRef.current = value;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Simpan posisi seleksi kursor terakhir di dalam editor
  const saveCurrentSelection = () => {
    if (typeof window === 'undefined') return;
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0 && editorRef.current) {
      const range = sel.getRangeAt(0);
      if (editorRef.current.contains(range.commonAncestorContainer)) {
        savedRangeRef.current = range.cloneRange();
      }
    }
  };

  // Kembalikan seleksi kursor yang tersimpan
  const restoreSavedSelection = () => {
    if (typeof window === 'undefined' || !editorRef.current) return false;
    editorRef.current.focus();
    if (savedRangeRef.current) {
      try {
        const sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(savedRangeRef.current);
        return true;
      } catch (_) {
        return false;
      }
    }
    return false;
  };

  // Perbarui indikator tombol aktif pada toolbar saat kursor berpindah
  const refreshToolbarState = () => {
    saveCurrentSelection();
    try {
      setIsBoldActive(document.queryCommandState('bold'));
      setIsItalicActive(document.queryCommandState('italic'));
      setIsUnderlineActive(document.queryCommandState('underline'));
      setIsStrikeActive(document.queryCommandState('strikeThrough'));
      setIsSupActive(document.queryCommandState('superscript'));
      setIsSubActive(document.queryCommandState('subscript'));
      setIsUlActive(document.queryCommandState('insertUnorderedList'));
      setIsOlActive(document.queryCommandState('insertOrderedList'));

      if (document.queryCommandState('justifyCenter')) {
        setActiveAlign('center');
      } else if (document.queryCommandState('justifyRight')) {
        setActiveAlign('right');
      } else if (document.queryCommandState('justifyFull')) {
        setActiveAlign('justify');
      } else {
        setActiveAlign('left');
      }
    } catch (_) {}
  };

  // Pancarkan perubahan isi editor ke state form parent
  const emitChange = (overrideFont = null) => {
    if (!editorRef.current) return;
    let serialized = serializeNodesToValue(editorRef.current);
    const activeFont = overrideFont || selectedFont;

    // Jika user memilih font selain default dan teks belum dibungkus font-family
    if (
      serialized.trim() &&
      activeFont !== FONT_OPTIONS[0].value &&
      !serialized.includes('font-family:')
    ) {
      const cleanFont = activeFont.replace(/"/g, "'");
      serialized = wrapEachLine(
        serialized,
        `<span style="font-family: ${cleanFont}">`,
        '</span>'
      );
    }

    lastEmittedRef.current = serialized;
    if (onChange) {
      onChange({ target: { value: serialized } });
    }
  };

  // Eksekusi perintah standar MS Word (Bold, Italic, Underline, Strikethrough, Lists, Align, Indent, Undo/Redo)
  const handleCommand = (command, arg = null) => {
    if (!editorRef.current) return;
    restoreSavedSelection();
    try {
      document.execCommand('styleWithCSS', false, false);
      document.execCommand(command, false, arg);
    } catch (_) {}
    refreshToolbarState();
    emitChange();
  };

  // Ubah Jenis Font
  const handleFontChange = (e) => {
    const newFont = e.target.value;
    setSelectedFont(newFont);
    if (!editorRef.current) return;

    restoreSavedSelection();
    const sel = window.getSelection();
    const hasHighlight =
      sel &&
      sel.rangeCount > 0 &&
      !sel.getRangeAt(0).collapsed &&
      editorRef.current.contains(sel.getRangeAt(0).commonAncestorContainer);

    if (hasHighlight) {
      try {
        document.execCommand('styleWithCSS', false, true);
        document.execCommand('fontName', false, newFont);
      } catch (_) {}
    } else if (editorRef.current.innerText.trim()) {
      const range = document.createRange();
      range.selectNodeContents(editorRef.current);
      if (sel) {
        sel.removeAllRanges();
        sel.addRange(range);
        try {
          document.execCommand('styleWithCSS', false, true);
          document.execCommand('fontName', false, newFont);
        } catch (_) {}
        sel.collapseToEnd();
      }
    }

    saveCurrentSelection();
    emitChange(newFont);
  };

  // Ubah Ukuran Tulisan
  const handleSizeChange = (e) => {
    const newSize = e.target.value;
    setSelectedSize(newSize);
    if (!editorRef.current) return;

    restoreSavedSelection();
    const sel = window.getSelection();
    const hasHighlight =
      sel &&
      sel.rangeCount > 0 &&
      !sel.getRangeAt(0).collapsed &&
      editorRef.current.contains(sel.getRangeAt(0).commonAncestorContainer);

    if (hasHighlight) {
      const range = sel.getRangeAt(0);
      const span = document.createElement('span');
      span.style.fontSize = newSize;
      try {
        span.appendChild(range.extractContents());
        range.insertNode(span);
        sel.removeAllRanges();
        const nextRange = document.createRange();
        nextRange.selectNodeContents(span);
        sel.addRange(nextRange);
      } catch (_) {}
    } else if (editorRef.current.innerHTML.trim()) {
      editorRef.current.innerHTML = `<span style="font-size: ${newSize}">${editorRef.current.innerHTML}</span>`;
    }

    saveCurrentSelection();
    emitChange();
  };

  // Terapkan Warna Tulisan (Text Color)
  const handleApplyTextColor = (colorVal) => {
    setShowColorMenu(false);
    if (!editorRef.current) return;
    restoreSavedSelection();

    if (!colorVal) {
      try {
        document.execCommand('removeFormat', false, null);
      } catch (_) {}
    } else {
      try {
        document.execCommand('styleWithCSS', false, true);
        document.execCommand('foreColor', false, colorVal);
      } catch (_) {}
    }
    saveCurrentSelection();
    emitChange();
  };

  // Terapkan Stabilo / Highlight pada Poin Penting
  const handleApplyHighlight = (opt) => {
    setShowHighlightMenu(false);
    if (!editorRef.current) return;
    restoreSavedSelection();

    const sel = window.getSelection();
    const hasHighlight =
      sel &&
      sel.rangeCount > 0 &&
      !sel.getRangeAt(0).collapsed &&
      editorRef.current.contains(sel.getRangeAt(0).commonAncestorContainer);

    if (!opt.bg) {
      try {
        document.execCommand('styleWithCSS', false, true);
        document.execCommand('hiliteColor', false, 'transparent');
      } catch (_) {}
    } else if (hasHighlight) {
      const range = sel.getRangeAt(0);
      const span = document.createElement('span');
      span.style.backgroundColor = opt.bg;
      if (opt.text) span.style.color = opt.text;
      span.style.padding = '1px 5px';
      span.style.borderRadius = '4px';
      try {
        span.appendChild(range.extractContents());
        range.insertNode(span);
        sel.removeAllRanges();
        const nextRange = document.createRange();
        nextRange.selectNodeContents(span);
        sel.addRange(nextRange);
      } catch (_) {}
    }
    saveCurrentSelection();
    emitChange();
  };

  // Sisipkan Template Poin Penting Efektif ("-> ", "📌 PENTING: ", "📐 RUMUS: ", "💡 TIPS: ")
  const handleInsertQuickPoint = (prefixText) => {
    if (!editorRef.current) return;
    restoreSavedSelection();
    const currentText = editorRef.current.innerText || '';
    const needsNewline =
      currentText.trim().length > 0 && !currentText.endsWith('\n');
    try {
      if (needsNewline) {
        document.execCommand('insertHTML', false, `<br>${prefixText}`);
      } else {
        document.execCommand('insertHTML', false, prefixText);
      }
    } catch (_) {}
    saveCurrentSelection();
    emitChange();
  };

  // Bersihkan seluruh format pada teks yang diblok (atau seluruh kotak)
  const handleClearFormatting = () => {
    if (!editorRef.current) return;
    restoreSavedSelection();
    const sel = window.getSelection();
    const hasHighlight =
      sel &&
      sel.rangeCount > 0 &&
      !sel.getRangeAt(0).collapsed &&
      editorRef.current.contains(sel.getRangeAt(0).commonAncestorContainer);

    if (hasHighlight) {
      try {
        document.execCommand('removeFormat', false, null);
      } catch (_) {}
    } else {
      const plain = editorRef.current.innerText;
      editorRef.current.innerHTML = valueToEditorHtml(plain);
      setSelectedFont(FONT_OPTIONS[0].value);
      setSelectedSize(FONT_SIZE_OPTIONS[1].value);
    }
    refreshToolbarState();
    emitChange(FONT_OPTIONS[0].value);
  };

  const minHeightPx = Math.max(64, Number(rows || 3) * 24);

  return (
    <div
      className={`rounded-xl border border-blue-500/50 focus-within:border-blue-300 overflow-visible transition-colors ${bgClass} ${className}`}
    >
      {/* RIBBON TOOLBAR BERGAYA MICROSOFT WORD */}
      <div className="px-2.5 py-1.5 bg-[#0A1733] border-b border-blue-500/30 rounded-t-xl flex flex-col gap-1.5">
        {/* BARIS 1: Font, Ukuran, Bold, Italic, Underline, Coret, Pangkat, Warna, Stabilo, Perataan, Penomoran */}
        <div className="flex items-center flex-wrap gap-1">
          {/* 1. Dropdown Pilihan Font */}
          <div className="flex items-center space-x-1 bg-[#162E5B] border border-blue-500/40 rounded-lg px-2 py-1">
            <Type className="w-3.5 h-3.5 text-blue-300 flex-shrink-0" />
            <select
              value={selectedFont}
              onChange={handleFontChange}
              title="Jenis Huruf (Font Family)"
              className="bg-[#162E5B] text-white text-[11px] font-semibold focus:outline-none cursor-pointer pr-1 max-w-[125px] sm:max-w-[145px]"
              style={{ fontFamily: selectedFont }}
            >
              {FONT_OPTIONS.map((f) => (
                <option
                  key={f.label}
                  value={f.value}
                  className="bg-[#0F2042] text-white py-1"
                  style={{ fontFamily: f.value }}
                >
                  {f.label}
                </option>
              ))}
            </select>
          </div>

          {/* 2. Dropdown Ukuran Tulisan */}
          <div className="flex items-center bg-[#162E5B] border border-blue-500/40 rounded-lg px-2 py-1">
            <select
              value={selectedSize}
              onChange={handleSizeChange}
              title="Ukuran Huruf (Font Size)"
              className="bg-[#162E5B] text-white text-[11px] font-semibold focus:outline-none cursor-pointer"
            >
              {FONT_SIZE_OPTIONS.map((s) => (
                <option
                  key={s.label}
                  value={s.value}
                  className="bg-[#0F2042] text-white"
                >
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          <div className="h-4 w-px bg-blue-500/30 mx-0.5" />

          {/* 3. Bold (B) */}
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              handleCommand('bold');
            }}
            title="Tebal (Bold / Ctrl+B)"
            className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all cursor-pointer border ${
              isBoldActive
                ? 'bg-blue-600 text-white border-blue-300 shadow-xs'
                : 'bg-[#162E5B] hover:bg-blue-800/80 text-blue-200 hover:text-white border-blue-500/30'
            }`}
          >
            <Bold className="w-3.5 h-3.5 stroke-[2.7]" />
          </button>

          {/* 4. Italic (I) */}
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              handleCommand('italic');
            }}
            title="Miring (Italic / Ctrl+I)"
            className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all cursor-pointer border ${
              isItalicActive
                ? 'bg-blue-600 text-white border-blue-300 shadow-xs'
                : 'bg-[#162E5B] hover:bg-blue-800/80 text-blue-200 hover:text-white border-blue-500/30'
            }`}
          >
            <Italic className="w-3.5 h-3.5 stroke-[2.5]" />
          </button>

          {/* 5. Underline (U) */}
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              handleCommand('underline');
            }}
            title="Garis Bawah (Underline / Ctrl+U)"
            className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all cursor-pointer border ${
              isUnderlineActive
                ? 'bg-blue-600 text-white border-blue-300 shadow-xs'
                : 'bg-[#162E5B] hover:bg-blue-800/80 text-blue-200 hover:text-white border-blue-500/30'
            }`}
          >
            <Underline className="w-3.5 h-3.5 stroke-[2.5]" />
          </button>

          {/* 6. Strikethrough (Coret) */}
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              handleCommand('strikeThrough');
            }}
            title="Coret Tulisan (Strikethrough)"
            className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all cursor-pointer border ${
              isStrikeActive
                ? 'bg-blue-600 text-white border-blue-300 shadow-xs'
                : 'bg-[#162E5B] hover:bg-blue-800/80 text-blue-200 hover:text-white border-blue-500/30'
            }`}
          >
            <Strikethrough className="w-3.5 h-3.5 stroke-[2.3]" />
          </button>

          {/* 7. Superscript (x²) & Subscript (x₂) */}
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              handleCommand('superscript');
            }}
            title="Pangkat Atas (Superscript x²)"
            className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all cursor-pointer border ${
              isSupActive
                ? 'bg-blue-600 text-white border-blue-300 shadow-xs'
                : 'bg-[#162E5B] hover:bg-blue-800/80 text-blue-200 hover:text-white border-blue-500/30'
            }`}
          >
            <Superscript className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              handleCommand('subscript');
            }}
            title="Indeks Bawah (Subscript x₂)"
            className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all cursor-pointer border ${
              isSubActive
                ? 'bg-blue-600 text-white border-blue-300 shadow-xs'
                : 'bg-[#162E5B] hover:bg-blue-800/80 text-blue-200 hover:text-white border-blue-500/30'
            }`}
          >
            <Subscript className="w-3.5 h-3.5" />
          </button>

          {/* 8. Warna Huruf (Text Color) */}
          <div className="relative">
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                setShowColorMenu((prev) => !prev);
                setShowHighlightMenu(false);
              }}
              title="Warna Huruf (Text Color)"
              className="w-7 h-7 rounded-lg bg-[#162E5B] hover:bg-blue-800/80 text-blue-200 hover:text-white border border-blue-500/30 flex items-center justify-center cursor-pointer"
            >
              <Palette className="w-3.5 h-3.5 text-amber-300" />
            </button>
            {showColorMenu && (
              <div className="absolute left-0 top-8 z-50 w-44 p-1.5 rounded-xl bg-[#0F2042] border-2 border-blue-400 shadow-xl space-y-1">
                {TEXT_COLOR_OPTIONS.map((c) => (
                  <button
                    key={c.label}
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      handleApplyTextColor(c.value);
                    }}
                    className="w-full px-2.5 py-1.5 rounded-lg hover:bg-[#162E5B] text-left text-[11px] font-semibold text-white flex items-center space-x-2 cursor-pointer"
                  >
                    <span
                      className="w-3.5 h-3.5 rounded-full border border-white/50 flex-shrink-0"
                      style={{
                        backgroundColor: c.preview || '#FFFFFF',
                      }}
                    />
                    <span>{c.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 9. Stabilo / Highlight Poin Penting */}
          <div className="relative">
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                setShowHighlightMenu((prev) => !prev);
                setShowColorMenu(false);
              }}
              title="Stabilo Penanda Poin Penting (Text Highlight)"
              className="w-7 h-7 rounded-lg bg-[#162E5B] hover:bg-blue-800/80 text-blue-200 hover:text-white border border-blue-500/30 flex items-center justify-center cursor-pointer"
            >
              <Highlighter className="w-3.5 h-3.5 text-yellow-300" />
            </button>
            {showHighlightMenu && (
              <div className="absolute left-0 top-8 z-50 w-44 p-1.5 rounded-xl bg-[#0F2042] border-2 border-blue-400 shadow-xl space-y-1">
                {HIGHLIGHT_COLOR_OPTIONS.map((h) => (
                  <button
                    key={h.label}
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      handleApplyHighlight(h);
                    }}
                    className="w-full px-2.5 py-1.5 rounded-lg hover:bg-[#162E5B] text-left text-[11px] font-semibold text-white flex items-center space-x-2 cursor-pointer"
                  >
                    <span
                      className="w-3.5 h-3.5 rounded border border-white/50 flex-shrink-0"
                      style={{
                        backgroundColor: h.bg || 'transparent',
                      }}
                    />
                    <span>{h.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="h-4 w-px bg-blue-500/30 mx-0.5" />

          {/* 10. Daftar Poin Bullets (•) & Penomoran Otomatis (1. 2. 3.) */}
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              handleCommand('insertUnorderedList');
            }}
            title="Daftar Poin Bullets (•)"
            className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all cursor-pointer border ${
              isUlActive
                ? 'bg-blue-600 text-white border-blue-300 shadow-xs'
                : 'bg-[#162E5B] hover:bg-blue-800/80 text-blue-200 hover:text-white border-blue-500/30'
            }`}
          >
            <List className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              handleCommand('insertOrderedList');
            }}
            title="Penomoran Otomatis (1. 2. 3.)"
            className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all cursor-pointer border ${
              isOlActive
                ? 'bg-blue-600 text-white border-blue-300 shadow-xs'
                : 'bg-[#162E5B] hover:bg-blue-800/80 text-blue-200 hover:text-white border-blue-500/30'
            }`}
          >
            <ListOrdered className="w-3.5 h-3.5" />
          </button>

          {/* 11. Indentasi (Geser Masuk / Geser Keluar) */}
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              handleCommand('outdent');
            }}
            title="Kurangi Indentasi (Geser ke Kiri)"
            className="w-7 h-7 rounded-lg bg-[#162E5B] hover:bg-blue-800/80 text-blue-200 hover:text-white border border-blue-500/30 flex items-center justify-center cursor-pointer"
          >
            <Outdent className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              handleCommand('indent');
            }}
            title="Tambah Indentasi (Geser Menjorok ke Kanan)"
            className="w-7 h-7 rounded-lg bg-[#162E5B] hover:bg-blue-800/80 text-blue-200 hover:text-white border border-blue-500/30 flex items-center justify-center cursor-pointer"
          >
            <Indent className="w-3.5 h-3.5" />
          </button>

          <div className="h-4 w-px bg-blue-500/30 mx-0.5" />

          {/* 12. Perataan Tulisan (Rata Kiri, Tengah, Kanan, Kiri-Kanan/Justify) */}
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              handleCommand('justifyLeft');
            }}
            title="Rata Kiri (Align Left)"
            className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all cursor-pointer border ${
              activeAlign === 'left'
                ? 'bg-blue-600 text-white border-blue-300 shadow-xs'
                : 'bg-[#162E5B] hover:bg-blue-800/80 text-blue-200 hover:text-white border-blue-500/30'
            }`}
          >
            <AlignLeft className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              handleCommand('justifyCenter');
            }}
            title="Rata Tengah (Align Center)"
            className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all cursor-pointer border ${
              activeAlign === 'center'
                ? 'bg-blue-600 text-white border-blue-300 shadow-xs'
                : 'bg-[#162E5B] hover:bg-blue-800/80 text-blue-200 hover:text-white border-blue-500/30'
            }`}
          >
            <AlignCenter className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              handleCommand('justifyRight');
            }}
            title="Rata Kanan (Align Right)"
            className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all cursor-pointer border ${
              activeAlign === 'right'
                ? 'bg-blue-600 text-white border-blue-300 shadow-xs'
                : 'bg-[#162E5B] hover:bg-blue-800/80 text-blue-200 hover:text-white border-blue-500/30'
            }`}
          >
            <AlignRight className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              handleCommand('justifyFull');
            }}
            title="Rata Kiri-Kanan (Justify)"
            className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all cursor-pointer border ${
              activeAlign === 'justify'
                ? 'bg-blue-600 text-white border-blue-300 shadow-xs'
                : 'bg-[#162E5B] hover:bg-blue-800/80 text-blue-200 hover:text-white border-blue-500/30'
            }`}
          >
            <AlignJustify className="w-3.5 h-3.5" />
          </button>

          <div className="h-4 w-px bg-blue-500/30 mx-0.5" />

          {/* 13. Undo & Redo */}
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              handleCommand('undo');
            }}
            title="Urungkan (Undo / Ctrl+Z)"
            className="w-7 h-7 rounded-lg bg-[#162E5B] hover:bg-blue-800/80 text-blue-200 hover:text-white border border-blue-500/30 flex items-center justify-center cursor-pointer"
          >
            <Undo2 className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              handleCommand('redo');
            }}
            title="Ulangi (Redo / Ctrl+Y)"
            className="w-7 h-7 rounded-lg bg-[#162E5B] hover:bg-blue-800/80 text-blue-200 hover:text-white border border-blue-500/30 flex items-center justify-center cursor-pointer"
          >
            <Redo2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* BARIS 2: Pintasan Pembuat Poin Penting Efektif (Poin Kotak, Konsep Penting, Rumus, Tips, & Reset Format) */}
        <div className="flex items-center flex-wrap gap-1.5 pt-1 border-t border-blue-500/20">
          <span className="text-[10px] font-semibold text-blue-300/80 flex items-center space-x-1 mr-0.5">
            <Sparkles className="w-3 h-3 text-amber-400" />
            <span>Poin Cepat:</span>
          </span>

          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              handleInsertQuickPoint('-&gt; ');
            }}
            title="Sisipkan Kotak Poin (->)"
            className="px-2 py-0.5 rounded-md bg-[#162E5B] hover:bg-blue-700 text-blue-100 hover:text-white border border-blue-500/30 text-[10px] font-bold flex items-center space-x-1 transition-all cursor-pointer"
          >
            <CornerDownRight className="w-3 h-3 text-blue-300" />
            <span>Kotak Poin (-&gt;)</span>
          </button>

          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              handleInsertQuickPoint('📌 <b>PENTING:</b> ');
            }}
            title="Sisipkan Blok Catatan Penting"
            className="px-2 py-0.5 rounded-md bg-[#162E5B] hover:bg-amber-700/80 text-amber-200 hover:text-white border border-amber-500/30 text-[10px] font-bold transition-all cursor-pointer"
          >
            📌 Poin Penting
          </button>

          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              handleInsertQuickPoint('📐 <b>RUMUS KUNCI:</b> ');
            }}
            title="Sisipkan Blok Rumus / Kaidah Kunci"
            className="px-2 py-0.5 rounded-md bg-[#162E5B] hover:bg-indigo-700/80 text-indigo-200 hover:text-white border border-indigo-500/30 text-[10px] font-bold transition-all cursor-pointer"
          >
            📐 Rumus Kunci
          </button>

          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              handleInsertQuickPoint('💡 <b>INGAT:</b> ');
            }}
            title="Sisipkan Blok Pengingat / Tips"
            className="px-2 py-0.5 rounded-md bg-[#162E5B] hover:bg-emerald-700/80 text-emerald-200 hover:text-white border border-emerald-500/30 text-[10px] font-bold transition-all cursor-pointer"
          >
            💡 Ingat / Tips
          </button>

          {/* Tombol Reset Format */}
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              handleClearFormatting();
            }}
            title="Bersihkan Format (Kembalikan ke Huruf Standar)"
            className="px-2 py-0.5 rounded-md bg-[#162E5B] hover:bg-rose-900/70 text-blue-300 hover:text-rose-200 border border-blue-500/30 text-[10px] font-semibold flex items-center space-x-1 transition-all cursor-pointer ml-auto"
          >
            <RotateCcw className="w-2.5 h-2.5" />
            <span>Reset Format</span>
          </button>
        </div>
      </div>

      {/* AREA KETIK WYSIWYG (Bisa Enter baris baru, Penomoran, Perataan, Ctrl+B, Ctrl+I, Ctrl+U) */}
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={() => emitChange()}
        onKeyUp={refreshToolbarState}
        onMouseUp={refreshToolbarState}
        onClick={() => {
          setShowColorMenu(false);
          setShowHighlightMenu(false);
        }}
        onBlur={() => {
          saveCurrentSelection();
          emitChange();
        }}
        data-placeholder={placeholder}
        style={{
          minHeight: `${minHeightPx}px`,
          fontFamily: selectedFont,
        }}
        className="ms-word-editor w-full px-3 py-2 text-white text-xs sm:text-sm leading-relaxed focus:outline-none overflow-y-auto max-h-80 navy-scrollbar rounded-b-xl empty:before:content-[attr(data-placeholder)] empty:before:text-blue-300/40"
      />
    </div>
  );
};

export default RichTextEditor;
