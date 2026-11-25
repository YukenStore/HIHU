import React, { useState, useEffect, useRef } from 'react';
import katex from 'katex';
import MathEquationPanel from './MathEquationPanel';
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
  ImagePlus,
  Upload,
  Link2,
  Trash2,
  ArrowUp,
  ArrowDown,
  X,
  Move,
  Check,
  Loader2,
  Sigma,
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
 * Opsi Penempatan (Tata Letak) Gambar di dalam Teks / Soal / Jawaban
 */
export const IMAGE_POSITION_OPTIONS = [
  {
    id: 'block-left',
    label: 'Kiri',
    desc: 'Rata kiri (baris sendiri)',
    css: 'display: block; margin: 8px auto 8px 0;',
  },
  {
    id: 'block-center',
    label: 'Tengah',
    desc: 'Rata tengah (baris sendiri)',
    css: 'display: block; margin: 8px auto;',
  },
  {
    id: 'block-right',
    label: 'Kanan',
    desc: 'Rata kanan (baris sendiri)',
    css: 'display: block; margin: 8px 0 8px auto;',
  },
  {
    id: 'float-left',
    label: 'Kiri Teks',
    desc: 'Gambar di kiri, teks mengalir di kanan',
    css: 'float: left; margin: 4px 14px 8px 0;',
  },
  {
    id: 'float-right',
    label: 'Kanan Teks',
    desc: 'Gambar di kanan, teks mengalir di kiri',
    css: 'float: right; margin: 4px 0 8px 14px;',
  },
  {
    id: 'inline',
    label: 'Sejajar Teks',
    desc: 'Menyatu sebaris di tengah teks/rumus',
    css: 'display: inline-block; vertical-align: middle; margin: 2px 6px;',
  },
];

const buildImgStyle = (pos = 'block-center', widthVal = '260px') => {
  const found =
    IMAGE_POSITION_OPTIONS.find((p) => p.id === pos) ||
    IMAGE_POSITION_OPTIONS[1];
  const safeWidth =
    typeof widthVal === 'number'
      ? `${widthVal}px`
      : String(widthVal || '260px').trim();
  return `${found.css} width: ${safeWidth}; max-width: 100%; height: auto; border-radius: 10px;`;
};

const detectImgPos = (imgEl) => {
  if (!imgEl) return 'block-center';
  const attrPos = imgEl.getAttribute('data-pos');
  if (attrPos && IMAGE_POSITION_OPTIONS.some((p) => p.id === attrPos)) {
    return attrPos;
  }
  const fl = (imgEl.style?.float || '').toLowerCase();
  if (fl === 'left') return 'float-left';
  if (fl === 'right') return 'float-right';
  const disp = (imgEl.style?.display || '').toLowerCase();
  if (disp === 'inline-block' || disp === 'inline') return 'inline';
  const ml = imgEl.style?.marginLeft || '';
  const mr = imgEl.style?.marginRight || '';
  if (ml === 'auto' && mr === 'auto') return 'block-center';
  if (ml === 'auto' && mr !== 'auto') return 'block-right';
  return 'block-left';
};

const detectImgWidthInfo = (imgEl, isCompact = false) => {
  const defaultPx = isCompact ? 160 : 280;
  if (!imgEl) return { widthVal: `${defaultPx}px`, widthPx: defaultPx, isFull: false };
  const rawW = (
    imgEl.getAttribute('data-width') ||
    imgEl.style?.width ||
    ''
  ).trim();
  if (rawW === '100%') {
    return { widthVal: '100%', widthPx: isCompact ? 320 : 520, isFull: true };
  }
  const parsed = parseInt(rawW, 10);
  if (!Number.isNaN(parsed) && parsed >= 40) {
    return { widthVal: `${parsed}px`, widthPx: parsed, isFull: false };
  }
  const rectW = Math.round(imgEl.getBoundingClientRect?.().width || defaultPx);
  const clamped = Math.max(60, Math.min(560, rectW || defaultPx));
  return { widthVal: `${clamped}px`, widthPx: clamped, isFull: false };
};

/**
 * Mengoptimalkan & mengompresi file gambar di sisi browser agar tetap tajam (diagram matematika/bangun datar)
 * namun ukurannya ringan untuk disimpan ke Cloudflare D1 & localStorage.
 */
const optimizeImageFile = (file, isCompact = false) =>
  new Promise((resolve, reject) => {
    if (!file || !file.type?.startsWith('image/')) {
      reject(new Error('File harus berupa gambar (PNG, JPG, WebP, GIF, atau SVG).'));
      return;
    }

    // Jika SVG atau GIF ringan, baca langsung tanpa kanvas agar animasi/vektor tetap utuh
    if (
      file.type === 'image/svg+xml' ||
      (file.type === 'image/gif' && file.size <= 350 * 1024)
    ) {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(new Error('Gagal membaca file gambar.'));
      reader.readAsDataURL(file);
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      try {
        const maxW = isCompact ? 420 : 720;
        const maxH = isCompact ? 340 : 560;

        // Jika gambar sudah sangat kecil & ringan (<= 45 KB), simpan apa adanya
        if (file.size <= 45 * 1024 && img.width <= maxW && img.height <= maxH) {
          URL.revokeObjectURL(objectUrl);
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.onerror = () => reject(new Error('Gagal membaca gambar.'));
          reader.readAsDataURL(file);
          return;
        }

        const scale = Math.min(1, maxW / img.width, maxH / img.height);
        const targetW = Math.max(1, Math.round(img.width * scale));
        const targetH = Math.max(1, Math.round(img.height * scale));

        const canvas = document.createElement('canvas');
        canvas.width = targetW;
        canvas.height = targetH;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          URL.revokeObjectURL(objectUrl);
          reject(new Error('Browser tidak mendukung pengolahan gambar.'));
          return;
        }

        // Isi latar putih agar gambar transparan/diagram garis hitam tetap sangat jelas
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, targetW, targetH);
        ctx.drawImage(img, 0, 0, targetW, targetH);

        // Prioritaskan WebP (ukuran super hemat + sangat tajam untuk diagram matematika)
        let dataUrl = canvas.toDataURL('image/webp', 0.84);
        if (!dataUrl.startsWith('data:image/webp')) {
          dataUrl = canvas.toDataURL('image/jpeg', 0.84);
        }

        // Jika masih terlalu besar (> 260 KB base64), turunkan kualitas sedikit
        if (dataUrl.length > 260 * 1024) {
          const retry = canvas.toDataURL('image/webp', 0.68);
          dataUrl = retry.startsWith('data:image/webp')
            ? retry
            : canvas.toDataURL('image/jpeg', 0.72);
        }

        URL.revokeObjectURL(objectUrl);
        resolve(dataUrl);
      } catch (err) {
        URL.revokeObjectURL(objectUrl);
        reject(err);
      }
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Gambar gagal dimuat. Pastikan format gambar valid.'));
    };
    img.src = objectUrl;
  });

/**
 * Mengambil Range DOM dari koordinat pointer (untuk fitur drag & drop gambar ke posisi kursor mana saja)
 */
const getCaretRangeFromPoint = (x, y) => {
  if (typeof document === 'undefined') return null;
  if (document.caretRangeFromPoint) {
    return document.caretRangeFromPoint(x, y);
  }
  if (document.caretPositionFromPoint) {
    const pos = document.caretPositionFromPoint(x, y);
    if (pos) {
      const range = document.createRange();
      range.setStart(pos.offsetNode, pos.offset);
      range.collapse(true);
      return range;
    }
  }
  return null;
};

/**
 * Membentuk elemen HTML chip rumus KaTeX visual (clickable & non-editable secara langsung)
 * sehingga admin melihat bentuk pecahan/pangkat/akar asli di dalam editor, bukan kode mentah $\frac{2}{5}$.
 */
const createMathChipHtml = (tex, displayMode = false) => {
  const cleanTex = String(tex || '').trim();
  if (!cleanTex) return '';
  let rendered = cleanTex;
  try {
    rendered = katex.renderToString(cleanTex, {
      displayMode,
      throwOnError: false,
    });
  } catch {
    rendered = cleanTex;
  }
  const encoded = encodeURIComponent(cleanTex);
  const cls = displayMode
    ? 'rich-math-chip rich-math-block'
    : 'rich-math-chip';
  return `<span contenteditable="false" data-math="${encoded}" data-display="${displayMode ? 'true' : 'false'}" class="${cls}" title="Klik untuk edit rumus matematika">${rendered}</span>`;
};

/**
 * Mengubah string tersimpan menjadi HTML yang siap ditampilkan di dalam editor WYSIWYG.
 * Rumus matematika ($...$, $$...$$, dan \frac{a}{b}) otomatis dirender menjadi chip KaTeX visual!
 */
const valueToEditorHtml = (raw) => {
  if (raw === null || raw === undefined || raw === '') return '';
  let str = String(raw)
    .replace(/\[h(?:orizontal)?\]\s*/gi, '')
    .replace(/\r\n/g, '\n');

  // 1. Lindungi tag HTML valid (<img>, <span>, <b>, <ol>, dll.) tanpa menyentuh tanda '<' & '>' matematika
  const protectedTags = [];
  str = str.replace(
    /<\/?[a-zA-Z][a-zA-Z0-9-]*(?:\s[^<>]*?)?\/?>/g,
    (tagMatch) => {
      const token = `__ED_TAG_${protectedTags.length}__`;
      protectedTags.push(tagMatch);
      return token;
    }
  );

  // 2. Render rumus matematika menjadi chip KaTeX visual yang bisa diklik untuk diedit
  const protectedChips = [];
  const stashChip = (tex, displayMode) => {
    const token = `__ED_MATH_${protectedChips.length}__`;
    protectedChips.push(createMathChipHtml(tex, displayMode));
    return token;
  };

  // Display math $$...$$
  str = str.replace(/\$\$([^$]+)\$\$/g, (_, formula) => stashChip(formula, true));
  // Inline math $...$
  str = str.replace(/\$([^$\n]+)\$/g, (_, formula) => stashChip(formula, false));
  // Pecahan mentah tanpa tanda dollar ($) misalnya \frac{1}{2} atau 3\frac{1}{2}
  str = str.replace(/(\d*\\frac\{[^{}]+\}\{[^{}]+\})/g, (_, formula) =>
    stashChip(formula, false)
  );

  // 3. Konversi markdown **bold** menjadi <b>bold</b>
  str = str.replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>');

  // 4. Konversi newline \n menjadi <br>
  str = str.replace(/\n/g, '<br>');

  // 5. Kembalikan chip KaTeX & seluruh tag HTML secara utuh
  str = str.replace(
    /__ED_MATH_(\d+)__/g,
    (_, idx) => protectedChips[Number(idx)] ?? ''
  );
  str = str.replace(
    /__ED_TAG_(\d+)__/g,
    (_, idx) => protectedTags[Number(idx)] ?? ''
  );
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
    .map((line) => {
      if (!line) return '';
      // Jangan membungkus baris yang hanya berisi tag <img> tunggal atau blok rumus $$...$$
      if (/^<img\b[^>]*\/?>$/i.test(line.trim())) return line;
      if (/^\$\$[^$]+\$\$$/.test(line.trim())) return line;
      return `${openTag}${line}${closeTag}`;
    })
    .join('\n');
};

/**
 * Mengonversi DOM di dalam contentEditable kembali menjadi string bersih
 * yang mendukung:
 * - Gambar (<img src="..." data-pos="..." data-width="..." class="rich-content-img" style="..." />)
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

      // Chip Rumus Matematika KaTeX -> kembalikan menjadi sintaks $...$ atau $$...$$ yang bersih
      if (node.hasAttribute && node.hasAttribute('data-math')) {
        let tex = '';
        try {
          tex = decodeURIComponent(node.getAttribute('data-math') || '');
        } catch {
          tex = node.getAttribute('data-math') || '';
        }
        const cleanTex = tex.trim();
        if (!cleanTex) return;
        const isDisplay = node.getAttribute('data-display') === 'true';
        acc += isDisplay ? `$$${cleanTex}$$` : `$${cleanTex}$`;
        return;
      }

      const tag = node.tagName.toUpperCase();

      if (tag === 'BR') {
        acc += insideList ? '<br />' : '\n';
        return;
      }

      // Gambar (<img />) dengan informasi posisi & ukuran yang presisi
      if (tag === 'IMG') {
        const src = node.getAttribute('src') || '';
        if (!src) return;
        const alt = (node.getAttribute('alt') || 'Gambar ilustrasi').replace(
          /"/g,
          '&quot;'
        );
        const pos = detectImgPos(node);
        const rawWidth = (
          node.getAttribute('data-width') ||
          node.style?.width ||
          '260px'
        ).trim();
        const styleStr = buildImgStyle(pos, rawWidth);
        acc += `<img src="${src}" alt="${alt}" data-pos="${pos}" data-width="${rawWidth}" class="rich-content-img" style="${styleStr}" />`;
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

      // Elemen Blok (DIV, P, BLOCKQUOTE, FIGURE)
      const isBlock =
        tag === 'DIV' ||
        tag === 'P' ||
        tag === 'BLOCKQUOTE' ||
        tag === 'SECTION' ||
        tag === 'ARTICLE' ||
        tag === 'FIGURE';

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
 * Mendukung format teks lengkap + Input Gambar (Upload, Paste Ctrl+V, Drag & Drop, URL)
 * serta penempatan & pengaturan ukuran gambar secara bebas.
 */
const RichTextEditor = ({
  value = '',
  onChange,
  rows = 3,
  placeholder = 'Ketik teks di sini...',
  bgClass = 'bg-[#0F2042]',
  className = '',
  compact = false,
}) => {
  const editorRef = useRef(null);
  const fileInputRef = useRef(null);
  const lastEmittedRef = useRef(value);
  const savedRangeRef = useRef(null);
  const selectedImgRef = useRef(null);
  const draggedImgRef = useRef(null);
  const selectedMathRef = useRef(null);

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

  // State Fitur Input & Pengaturan Gambar
  const [showImagePanel, setShowImagePanel] = useState(false);
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [imageInsertPos, setImageInsertPos] = useState(
    compact ? 'block-left' : 'block-center'
  );
  const [imageInsertWidth, setImageInsertWidth] = useState(
    compact ? '160px' : '280px'
  );
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const [imageError, setImageError] = useState('');
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  // State Gambar yang Sedang Diklik/Dipilih di dalam Editor
  const [selectedImgState, setSelectedImgState] = useState(null); // { pos, widthVal, widthPx, isFull }

  // State Pembuat & Editor Rumus Matematika Visual
  const [showMathPanel, setShowMathPanel] = useState(false);
  const [editingMathState, setEditingMathState] = useState(null); // { tex, displayMode } | null

  // Bersihkan highlight pemilihan chip rumus
  const clearSelectedMath = () => {
    if (selectedMathRef.current) {
      selectedMathRef.current.removeAttribute('data-selected');
      selectedMathRef.current = null;
    }
    setEditingMathState(null);
  };

  // Tandai chip rumus yang diklik agar langsung bisa diedit di MathEquationPanel
  const selectMathChipElement = (chipEl) => {
    if (!editorRef.current || !chipEl) return;
    editorRef.current
      .querySelectorAll('[data-math][data-selected]')
      .forEach((el) => el.removeAttribute('data-selected'));
    chipEl.setAttribute('data-selected', 'true');
    selectedMathRef.current = chipEl;

    let tex = '';
    try {
      tex = decodeURIComponent(chipEl.getAttribute('data-math') || '');
    } catch {
      tex = chipEl.getAttribute('data-math') || '';
    }
    const displayMode = chipEl.getAttribute('data-display') === 'true';
    setEditingMathState({ tex, displayMode });
    setShowMathPanel(true);
    setShowImagePanel(false);
    setShowColorMenu(false);
    setShowHighlightMenu(false);
  };

  // Sisipkan rumus baru atau perbarui chip rumus yang sedang dipilih
  const handleInsertOrUpdateMath = (tex, displayMode = false) => {
    const cleanTex = String(tex || '').trim();
    if (!editorRef.current || !cleanTex) return;

    // Jika sedang mengedit chip rumus yang sudah ada -> perbarui langsung di tempat
    if (
      selectedMathRef.current &&
      editorRef.current.contains(selectedMathRef.current)
    ) {
      const chip = selectedMathRef.current;
      chip.setAttribute('data-math', encodeURIComponent(cleanTex));
      chip.setAttribute('data-display', displayMode ? 'true' : 'false');
      chip.className = displayMode
        ? 'rich-math-chip rich-math-block'
        : 'rich-math-chip';
      try {
        chip.innerHTML = katex.renderToString(cleanTex, {
          displayMode,
          throwOnError: false,
        });
      } catch {
        chip.textContent = cleanTex;
      }
      clearSelectedMath();
      setShowMathPanel(false);
      emitChange();
      return;
    }

    // Sisipkan chip rumus baru di posisi kursor
    const chip = document.createElement('span');
    chip.setAttribute('contenteditable', 'false');
    chip.setAttribute('data-math', encodeURIComponent(cleanTex));
    chip.setAttribute('data-display', displayMode ? 'true' : 'false');
    chip.setAttribute('title', 'Klik untuk edit rumus matematika');
    chip.className = displayMode
      ? 'rich-math-chip rich-math-block'
      : 'rich-math-chip';
    try {
      chip.innerHTML = katex.renderToString(cleanTex, {
        displayMode,
        throwOnError: false,
      });
    } catch {
      chip.textContent = cleanTex;
    }

    editorRef.current.focus();
    const sel = window.getSelection();
    let targetRange = null;
    if (
      savedRangeRef.current &&
      editorRef.current.contains(savedRangeRef.current.commonAncestorContainer)
    ) {
      targetRange = savedRangeRef.current.cloneRange();
    } else if (sel && sel.rangeCount > 0) {
      const curr = sel.getRangeAt(0);
      if (editorRef.current.contains(curr.commonAncestorContainer)) {
        targetRange = curr.cloneRange();
      }
    }

    const trailingSpace = document.createTextNode(' ');

    if (targetRange) {
      try {
        targetRange.deleteContents();
        targetRange.insertNode(chip);
        if (!displayMode && chip.parentNode) {
          chip.parentNode.insertBefore(trailingSpace, chip.nextSibling);
        }
        const afterRange = document.createRange();
        afterRange.setStartAfter(displayMode ? chip : trailingSpace);
        afterRange.collapse(true);
        if (sel) {
          sel.removeAllRanges();
          sel.addRange(afterRange);
        }
        savedRangeRef.current = afterRange.cloneRange();
      } catch (_) {
        editorRef.current.appendChild(chip);
        if (!displayMode) editorRef.current.appendChild(trailingSpace);
      }
    } else {
      editorRef.current.appendChild(chip);
      if (!displayMode) editorRef.current.appendChild(trailingSpace);
    }

    setShowMathPanel(false);
    clearSelectedMath();
    emitChange();
  };

  // Hapus chip rumus yang sedang dipilih
  const handleDeleteSelectedMath = () => {
    if (selectedMathRef.current) {
      selectedMathRef.current.remove();
    }
    clearSelectedMath();
    setShowMathPanel(false);
    emitChange();
  };

  // Bersihkan highlight pemilihan gambar di dalam DOM editor
  const clearSelectedImage = () => {
    if (selectedImgRef.current) {
      selectedImgRef.current.removeAttribute('data-selected');
      selectedImgRef.current = null;
    }
    setSelectedImgState(null);
  };

  // Tandai gambar di dalam editor agar muncul panel kontrol penempatan & ukuran
  const selectImageElement = (imgEl) => {
    if (!editorRef.current || !imgEl) return;
    editorRef.current.querySelectorAll('img[data-selected]').forEach((el) => {
      el.removeAttribute('data-selected');
    });
    imgEl.setAttribute('data-selected', 'true');
    imgEl.setAttribute('draggable', 'true');
    selectedImgRef.current = imgEl;

    const pos = detectImgPos(imgEl);
    const { widthVal, widthPx, isFull } = detectImgWidthInfo(imgEl, compact);
    setSelectedImgState({ pos, widthVal, widthPx, isFull });
  };

  // Sinkronkan properti draggable pada semua img di editor
  const ensureImagesInteractive = () => {
    if (!editorRef.current) return;
    editorRef.current.querySelectorAll('img').forEach((imgEl) => {
      imgEl.setAttribute('draggable', 'true');
    });
  };

  // Sinkronkan isi editor ketika prop value berubah dari luar (misal ganti materi/soal)
  useEffect(() => {
    if (!editorRef.current) return;
    if (value !== lastEmittedRef.current) {
      clearSelectedImage();
      clearSelectedMath();
      setShowMathPanel(false);
      editorRef.current.innerHTML = valueToEditorHtml(value);
      ensureImagesInteractive();
      lastEmittedRef.current = value;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  // Set inisialisasi awal saat komponen pertama kali dimuat
  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.innerHTML = valueToEditorHtml(value);
      ensureImagesInteractive();
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
    const hasPlainText = serialized.replace(/<img\b[^>]*\/?>/gi, '').trim().length > 0;
    if (
      hasPlainText &&
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

  // Sisipkan elemen <img> tepat di posisi kursor (atau di posisi range tertentu)
  const insertImageAtPosition = (
    srcUrl,
    pos = imageInsertPos,
    widthVal = imageInsertWidth,
    customRange = null
  ) => {
    if (!editorRef.current || !srcUrl) return;

    const imgEl = document.createElement('img');
    imgEl.src = srcUrl;
    imgEl.alt = 'Gambar soal / materi';
    imgEl.className = 'rich-content-img';
    imgEl.setAttribute('data-pos', pos);
    imgEl.setAttribute('data-width', widthVal);
    imgEl.setAttribute('draggable', 'true');
    imgEl.style.cssText = buildImgStyle(pos, widthVal);

    editorRef.current.focus();
    const sel = window.getSelection();
    let targetRange = customRange;

    if (!targetRange && savedRangeRef.current) {
      if (editorRef.current.contains(savedRangeRef.current.commonAncestorContainer)) {
        targetRange = savedRangeRef.current.cloneRange();
      }
    }
    if (!targetRange && sel && sel.rangeCount > 0) {
      const currentR = sel.getRangeAt(0);
      if (editorRef.current.contains(currentR.commonAncestorContainer)) {
        targetRange = currentR.cloneRange();
      }
    }

    if (targetRange) {
      try {
        targetRange.deleteContents();
        targetRange.insertNode(imgEl);
        // Pindahkan kursor tepat sesudah gambar agar admin bisa langsung lanjut mengetik
        const afterRange = document.createRange();
        afterRange.setStartAfter(imgEl);
        afterRange.collapse(true);
        if (sel) {
          sel.removeAllRanges();
          sel.addRange(afterRange);
        }
        savedRangeRef.current = afterRange.cloneRange();
      } catch (_) {
        editorRef.current.appendChild(imgEl);
      }
    } else {
      editorRef.current.appendChild(imgEl);
    }

    selectImageElement(imgEl);
    setShowImagePanel(false);
    setImageUrlInput('');
    setImageError('');
    emitChange();
  };

  // Proses upload file gambar dari tombol pilih file / paste / drag & drop
  const handleProcessImageFile = async (file, customRange = null) => {
    if (!file) return;
    setImageError('');
    setIsProcessingImage(true);
    try {
      const optimizedDataUrl = await optimizeImageFile(file, compact);
      insertImageAtPosition(
        optimizedDataUrl,
        imageInsertPos,
        imageInsertWidth,
        customRange
      );
    } catch (err) {
      setImageError(err?.message || 'Gagal memproses gambar.');
    } finally {
      setIsProcessingImage(false);
    }
  };

  // Handler input file dari perangkat
  const handleFileInputChange = async (e) => {
    const file = e.target.files?.[0];
    if (file) {
      await handleProcessImageFile(file);
    }
    // Reset input agar file yang sama bisa dipilih ulang jika diperlukan
    e.target.value = '';
  };

  // Handler sisipkan gambar dari URL
  const handleInsertImageUrl = () => {
    const cleanUrl = imageUrlInput.trim();
    if (!cleanUrl) {
      setImageError('Masukkan alamat URL gambar terlebih dahulu.');
      return;
    }
    if (!/^https?:\/\/|^data:image\//i.test(cleanUrl)) {
      setImageError('URL gambar harus diawali dengan https:// atau http://');
      return;
    }
    insertImageAtPosition(cleanUrl, imageInsertPos, imageInsertWidth);
  };

  // Ubah tata letak / posisi gambar yang sedang dipilih
  const handleUpdateSelectedImgPos = (newPos) => {
    const imgEl = selectedImgRef.current;
    if (!imgEl || !editorRef.current?.contains(imgEl)) return;
    const widthVal =
      selectedImgState?.widthVal || (compact ? '160px' : '280px');
    imgEl.setAttribute('data-pos', newPos);
    imgEl.style.cssText = buildImgStyle(newPos, widthVal);
    setSelectedImgState((prev) => (prev ? { ...prev, pos: newPos } : prev));
    emitChange();
  };

  // Ubah ukuran gambar yang sedang dipilih (preset maupun slider)
  const handleUpdateSelectedImgWidth = (newWidthVal) => {
    const imgEl = selectedImgRef.current;
    if (!imgEl || !editorRef.current?.contains(imgEl)) return;
    const pos = selectedImgState?.pos || detectImgPos(imgEl);
    const widthStr =
      typeof newWidthVal === 'number' ? `${newWidthVal}px` : String(newWidthVal);
    imgEl.setAttribute('data-width', widthStr);
    imgEl.style.cssText = buildImgStyle(pos, widthStr);
    const isFull = widthStr === '100%';
    const widthPx = isFull
      ? compact
        ? 320
        : 520
      : parseInt(widthStr, 10) || (compact ? 160 : 280);
    setSelectedImgState((prev) =>
      prev ? { ...prev, widthVal: widthStr, widthPx, isFull } : prev
    );
    emitChange();
  };

  // Pindahkan gambar ke atas / ke bawah relatif terhadap teks atau paragraf di sekitarnya
  const handleMoveSelectedImage = (direction) => {
    const imgEl = selectedImgRef.current;
    const root = editorRef.current;
    if (!imgEl || !root || !root.contains(imgEl)) return;

    const parent = imgEl.parentNode;
    if (!parent) return;

    if (direction === 'up') {
      // Cari node saudara sebelumnya yang berarti
      let prev = imgEl.previousSibling;
      while (prev && prev.nodeType === Node.TEXT_NODE && !prev.nodeValue) {
        prev = prev.previousSibling;
      }
      if (prev) {
        // Lewati <br> agar lompat melewati 1 baris teks sekaligus
        if (prev.nodeName === 'BR' && prev.previousSibling) {
          parent.insertBefore(imgEl, prev.previousSibling);
        } else {
          parent.insertBefore(imgEl, prev);
        }
      } else if (parent !== root && parent.parentNode) {
        // Jika di awal blok (div/p), keluarkan ke atas blok tersebut
        parent.parentNode.insertBefore(imgEl, parent);
      }
    } else if (direction === 'down') {
      let next = imgEl.nextSibling;
      while (next && next.nodeType === Node.TEXT_NODE && !next.nodeValue) {
        next = next.nextSibling;
      }
      if (next) {
        if (next.nodeName === 'BR' && next.nextSibling) {
          parent.insertBefore(imgEl, next.nextSibling.nextSibling);
        } else {
          parent.insertBefore(imgEl, next.nextSibling);
        }
      } else if (parent !== root && parent.parentNode) {
        parent.parentNode.insertBefore(imgEl, parent.nextSibling);
      }
    } else if (direction === 'top') {
      root.insertBefore(imgEl, root.firstChild);
    } else if (direction === 'bottom') {
      root.appendChild(imgEl);
    }

    selectImageElement(imgEl);
    emitChange();
  };

  // Hapus gambar yang sedang dipilih
  const handleDeleteSelectedImage = () => {
    const imgEl = selectedImgRef.current;
    if (!imgEl) return;
    imgEl.remove();
    clearSelectedImage();
    emitChange();
  };

  // Tempel (Paste Ctrl+V) screenshot / gambar langsung ke dalam editor
  const handlePaste = async (e) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.type && item.type.startsWith('image/')) {
        e.preventDefault();
        const file = item.getAsFile();
        if (file) {
          saveCurrentSelection();
          await handleProcessImageFile(file);
        }
        return;
      }
    }
  };

  // Drag mulai untuk memindahkan gambar yang sudah ada di dalam editor
  const handleEditorDragStart = (e) => {
    if (e.target && e.target.tagName === 'IMG') {
      draggedImgRef.current = e.target;
      selectImageElement(e.target);
      try {
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', 'internal-editor-img');
      } catch (_) {}
    }
  };

  // Drag over editor (untuk drop file gambar dari komputer atau pindahkan gambar di dalam editor)
  const handleEditorDragOver = (e) => {
    const hasFiles = e.dataTransfer?.types?.includes('Files');
    if (hasFiles || draggedImgRef.current) {
      e.preventDefault();
      if (hasFiles) setIsDraggingOver(true);
    }
  };

  // Drop gambar ke posisi kursor mana saja di dalam editor
  const handleEditorDrop = async (e) => {
    setIsDraggingOver(false);
    const dropRange = getCaretRangeFromPoint(e.clientX, e.clientY);

    // 1. Jika memindahkan gambar yang sudah ada di dalam editor (Reposisi Drag & Drop)
    if (
      draggedImgRef.current &&
      editorRef.current?.contains(draggedImgRef.current)
    ) {
      e.preventDefault();
      const movingImg = draggedImgRef.current;
      draggedImgRef.current = null;

      if (
        dropRange &&
        editorRef.current.contains(dropRange.commonAncestorContainer) &&
        dropRange.commonAncestorContainer !== movingImg
      ) {
        try {
          dropRange.insertNode(movingImg);
          selectImageElement(movingImg);
          emitChange();
        } catch (_) {}
      }
      return;
    }

    // 2. Jika drag & drop file gambar baru dari perangkat komputer
    const files = e.dataTransfer?.files;
    if (files && files.length > 0) {
      const imageFile = Array.from(files).find((f) =>
        f.type?.startsWith('image/')
      );
      if (imageFile) {
        e.preventDefault();
        const validRange =
          dropRange &&
          editorRef.current?.contains(dropRange.commonAncestorContainer)
            ? dropRange
            : null;
        await handleProcessImageFile(imageFile, validRange);
      }
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
      ensureImagesInteractive();
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

  // Bersihkan seluruh format pada teks yang diblok (atau seluruh kotak, tetap pertahankan gambar & rumus)
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
      // Serialisasi dulu agar rumus matematika ($...$) & gambar (<img>) tetap utuh
      const serialized = serializeNodesToValue(editorRef.current);
      const preservedImgs = [];
      let cleaned = serialized.replace(/<img\b[^>]*\/?>/gi, (m) => {
        const token = `__KEEP_IMG_${preservedImgs.length}__`;
        preservedImgs.push(m);
        return token;
      });
      // Hapus hanya tag format teks HTML (<b>, <i>, <span>, <div>, dll.)
      cleaned = cleaned.replace(/<\/?[a-zA-Z][a-zA-Z0-9-]*(?:\s[^<>]*?)?\/?>/g, '');
      cleaned = cleaned.replace(
        /__KEEP_IMG_(\d+)__/g,
        (_, idx) => preservedImgs[Number(idx)] ?? ''
      );

      editorRef.current.innerHTML = valueToEditorHtml(cleaned);
      ensureImagesInteractive();
      clearSelectedImage();
      clearSelectedMath();
      setSelectedFont(FONT_OPTIONS[0].value);
      setSelectedSize(FONT_SIZE_OPTIONS[1].value);
    }
    refreshToolbarState();
    emitChange(FONT_OPTIONS[0].value);
  };

  const minHeightPx = compact
    ? Math.max(40, Number(rows || 1) * 28)
    : Math.max(64, Number(rows || 3) * 24);

  const sizePresets = compact
    ? [
        { label: 'Kecil', val: '100px' },
        { label: 'Sedang', val: '160px' },
        { label: 'Besar', val: '240px' },
        { label: 'Penuh', val: '100%' },
      ]
    : [
        { label: 'Kecil', val: '160px' },
        { label: 'Sedang', val: '280px' },
        { label: 'Besar', val: '420px' },
        { label: 'Penuh', val: '100%' },
      ];

  return (
    <div
      className={`rounded-xl border transition-colors overflow-visible ${
        isDraggingOver
          ? 'border-amber-400 ring-2 ring-amber-400/40'
          : 'border-blue-500/50 focus-within:border-blue-300'
      } ${bgClass} ${className}`}
    >
      {/* Hidden File Input untuk Upload Gambar dari Perangkat */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml"
        onChange={handleFileInputChange}
        className="hidden"
      />

      {/* RIBBON TOOLBAR BERGAYA MICROSOFT WORD (Full Mode vs Compact Mode untuk Opsi Jawaban) */}
      <div
        className={`${
          compact ? 'px-2 py-1' : 'px-2.5 py-1.5'
        } bg-[#0A1733] border-b border-blue-500/30 rounded-t-xl flex flex-col gap-1.5`}
      >
        <div className="flex items-center flex-wrap gap-1">
          {/* Jika bukan compact: Dropdown Font & Ukuran Huruf */}
          {!compact && (
            <>
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
            </>
          )}

          {/* Tombol Sisipkan Gambar (Tersedia di Full maupun Compact Mode) */}
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              saveCurrentSelection();
              setShowImagePanel((prev) => !prev);
              setShowMathPanel(false);
              clearSelectedMath();
              setShowColorMenu(false);
              setShowHighlightMenu(false);
              setImageError('');
            }}
            title="Sisipkan Gambar (Upload dari perangkat, Link URL, atau Paste Ctrl+V)"
            className={`${
              compact ? 'h-6 px-2 text-[10px]' : 'h-7 px-2.5 text-[11px]'
            } rounded-lg flex items-center space-x-1 font-bold transition-all cursor-pointer border ${
              showImagePanel
                ? 'bg-emerald-600 text-white border-emerald-300 shadow-xs'
                : 'bg-emerald-900/70 hover:bg-emerald-700 text-emerald-200 hover:text-white border-emerald-500/50'
            }`}
          >
            {isProcessingImage ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <ImagePlus className="w-3.5 h-3.5" />
            )}
            <span>{compact ? 'Gambar' : 'Sisipkan Gambar'}</span>
          </button>

          {/* Tombol Pembuat Rumus Matematika Visual (Pecahan, Pangkat, Akar, Simbol) */}
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              saveCurrentSelection();
              clearSelectedImage();
              if (showMathPanel && !editingMathState) {
                setShowMathPanel(false);
              } else {
                clearSelectedMath();
                setShowMathPanel(true);
              }
              setShowImagePanel(false);
              setShowColorMenu(false);
              setShowHighlightMenu(false);
            }}
            title="Buat Rumus Matematika Visual (Pecahan, Campuran, Pangkat, Akar, Simbol tanpa kode)"
            className={`${
              compact ? 'h-6 px-2 text-[10px]' : 'h-7 px-2.5 text-[11px]'
            } rounded-lg flex items-center space-x-1 font-bold transition-all cursor-pointer border ${
              showMathPanel
                ? 'bg-indigo-600 text-white border-indigo-300 shadow-xs'
                : 'bg-indigo-900/75 hover:bg-indigo-700 text-indigo-100 hover:text-white border-indigo-400/50'
            }`}
          >
            <Sigma className="w-3.5 h-3.5 text-amber-300" />
            <span>{compact ? 'Rumus' : 'Rumus MTK'}</span>
          </button>

          <div className="h-4 w-px bg-blue-500/30 mx-0.5" />

          {/* Bold, Italic, Underline */}
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              handleCommand('bold');
            }}
            title="Tebal (Bold / Ctrl+B)"
            className={`${
              compact ? 'w-6 h-6' : 'w-7 h-7'
            } rounded-lg flex items-center justify-center transition-all cursor-pointer border ${
              isBoldActive
                ? 'bg-blue-600 text-white border-blue-300 shadow-xs'
                : 'bg-[#162E5B] hover:bg-blue-800/80 text-blue-200 hover:text-white border-blue-500/30'
            }`}
          >
            <Bold className="w-3 h-3 stroke-[2.7]" />
          </button>

          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              handleCommand('italic');
            }}
            title="Miring (Italic / Ctrl+I)"
            className={`${
              compact ? 'w-6 h-6' : 'w-7 h-7'
            } rounded-lg flex items-center justify-center transition-all cursor-pointer border ${
              isItalicActive
                ? 'bg-blue-600 text-white border-blue-300 shadow-xs'
                : 'bg-[#162E5B] hover:bg-blue-800/80 text-blue-200 hover:text-white border-blue-500/30'
            }`}
          >
            <Italic className="w-3 h-3 stroke-[2.5]" />
          </button>

          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              handleCommand('underline');
            }}
            title="Garis Bawah (Underline / Ctrl+U)"
            className={`${
              compact ? 'w-6 h-6' : 'w-7 h-7'
            } rounded-lg flex items-center justify-center transition-all cursor-pointer border ${
              isUnderlineActive
                ? 'bg-blue-600 text-white border-blue-300 shadow-xs'
                : 'bg-[#162E5B] hover:bg-blue-800/80 text-blue-200 hover:text-white border-blue-500/30'
            }`}
          >
            <Underline className="w-3 h-3 stroke-[2.5]" />
          </button>

          {!compact && (
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
          )}

          {/* Superscript (x²) & Subscript (x₂) - sangat berguna untuk Matematika */}
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              handleCommand('superscript');
            }}
            title="Pangkat Atas (Superscript x²)"
            className={`${
              compact ? 'w-6 h-6' : 'w-7 h-7'
            } rounded-lg flex items-center justify-center transition-all cursor-pointer border ${
              isSupActive
                ? 'bg-blue-600 text-white border-blue-300 shadow-xs'
                : 'bg-[#162E5B] hover:bg-blue-800/80 text-blue-200 hover:text-white border-blue-500/30'
            }`}
          >
            <Superscript className="w-3 h-3" />
          </button>

          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              handleCommand('subscript');
            }}
            title="Indeks Bawah (Subscript x₂)"
            className={`${
              compact ? 'w-6 h-6' : 'w-7 h-7'
            } rounded-lg flex items-center justify-center transition-all cursor-pointer border ${
              isSubActive
                ? 'bg-blue-600 text-white border-blue-300 shadow-xs'
                : 'bg-[#162E5B] hover:bg-blue-800/80 text-blue-200 hover:text-white border-blue-500/30'
            }`}
          >
            <Subscript className="w-3 h-3" />
          </button>

          {!compact && (
            <>
              {/* Warna Huruf */}
              <div className="relative">
                <button
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    setShowColorMenu((prev) => !prev);
                    setShowHighlightMenu(false);
                    setShowImagePanel(false);
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

              {/* Stabilo */}
              <div className="relative">
                <button
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    setShowHighlightMenu((prev) => !prev);
                    setShowColorMenu(false);
                    setShowImagePanel(false);
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

              {/* Bullets, Penomoran, Indentasi */}
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

              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleCommand('outdent');
                }}
                title="Kurangi Indentasi"
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
                title="Tambah Indentasi"
                className="w-7 h-7 rounded-lg bg-[#162E5B] hover:bg-blue-800/80 text-blue-200 hover:text-white border border-blue-500/30 flex items-center justify-center cursor-pointer"
              >
                <Indent className="w-3.5 h-3.5" />
              </button>

              <div className="h-4 w-px bg-blue-500/30 mx-0.5" />
            </>
          )}

          {/* Perataan Tulisan */}
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              handleCommand('justifyLeft');
            }}
            title="Rata Kiri (Align Left)"
            className={`${
              compact ? 'w-6 h-6' : 'w-7 h-7'
            } rounded-lg flex items-center justify-center transition-all cursor-pointer border ${
              activeAlign === 'left'
                ? 'bg-blue-600 text-white border-blue-300 shadow-xs'
                : 'bg-[#162E5B] hover:bg-blue-800/80 text-blue-200 hover:text-white border-blue-500/30'
            }`}
          >
            <AlignLeft className="w-3 h-3" />
          </button>

          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              handleCommand('justifyCenter');
            }}
            title="Rata Tengah (Align Center)"
            className={`${
              compact ? 'w-6 h-6' : 'w-7 h-7'
            } rounded-lg flex items-center justify-center transition-all cursor-pointer border ${
              activeAlign === 'center'
                ? 'bg-blue-600 text-white border-blue-300 shadow-xs'
                : 'bg-[#162E5B] hover:bg-blue-800/80 text-blue-200 hover:text-white border-blue-500/30'
            }`}
          >
            <AlignCenter className="w-3 h-3" />
          </button>

          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              handleCommand('justifyRight');
            }}
            title="Rata Kanan (Align Right)"
            className={`${
              compact ? 'w-6 h-6' : 'w-7 h-7'
            } rounded-lg flex items-center justify-center transition-all cursor-pointer border ${
              activeAlign === 'right'
                ? 'bg-blue-600 text-white border-blue-300 shadow-xs'
                : 'bg-[#162E5B] hover:bg-blue-800/80 text-blue-200 hover:text-white border-blue-500/30'
            }`}
          >
            <AlignRight className="w-3 h-3" />
          </button>

          {!compact && (
            <>
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
            </>
          )}
        </div>

        {/* BARIS 2 (Khusus Mode Penuh): Pintasan Poin Penting & Reset Format */}
        {!compact && (
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
        )}

        {/* PANEL INPUT GAMBAR (UPLOAD PERANGKAT / LINK URL / PILIH POSISI & UKURAN AWAL) */}
        {showImagePanel && (
          <div className="mt-1 p-3 rounded-xl bg-[#0F2042] border border-emerald-400/60 space-y-2.5 animate-fade-in">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center space-x-1.5 text-[11px] font-bold text-emerald-300">
                <ImagePlus className="w-3.5 h-3.5" />
                <span>Sisipkan Gambar di Posisi Kursor</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowImagePanel(false);
                  setImageError('');
                }}
                className="p-1 rounded-md text-blue-300 hover:text-white hover:bg-[#162E5B] cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Pilihan Posisi Awal & Ukuran Awal */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10px]">
              <div>
                <span className="block text-blue-200 font-semibold mb-1">
                  Posisi Gambar:
                </span>
                <div className="flex flex-wrap gap-1">
                  {IMAGE_POSITION_OPTIONS.map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setImageInsertPos(opt.id)}
                      title={opt.desc}
                      className={`px-2 py-1 rounded-md border font-semibold cursor-pointer transition-all ${
                        imageInsertPos === opt.id
                          ? 'bg-emerald-600 text-white border-emerald-300'
                          : 'bg-[#162E5B] text-blue-200 border-blue-500/30 hover:text-white'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <span className="block text-blue-200 font-semibold mb-1">
                  Ukuran Awal:
                </span>
                <div className="flex flex-wrap gap-1">
                  {sizePresets.map((sz) => (
                    <button
                      key={sz.label}
                      type="button"
                      onClick={() => setImageInsertWidth(sz.val)}
                      className={`px-2 py-1 rounded-md border font-semibold cursor-pointer transition-all ${
                        imageInsertWidth === sz.val
                          ? 'bg-blue-600 text-white border-blue-300'
                          : 'bg-[#162E5B] text-blue-200 border-blue-500/30 hover:text-white'
                      }`}
                    >
                      {sz.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Opsi 1: Upload File dari Komputer + Tips Paste/Drag */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <button
                type="button"
                disabled={isProcessingImage}
                onClick={() => fileInputRef.current?.click()}
                className="px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white text-[11px] font-bold flex items-center justify-center space-x-1.5 cursor-pointer shadow-xs flex-shrink-0"
              >
                {isProcessingImage ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Memproses...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-3.5 h-3.5" />
                    <span>Pilih Gambar dari Komputer</span>
                  </>
                )}
              </button>

              {/* Opsi 2: Masukkan URL Gambar */}
              <div className="flex-1 flex items-center gap-1.5">
                <div className="relative flex-1">
                  <Link2 className="w-3.5 h-3.5 text-blue-300 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={imageUrlInput}
                    onChange={(e) => setImageUrlInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleInsertImageUrl();
                      }
                    }}
                    placeholder="Atau tempel URL gambar (https://...)"
                    className="w-full pl-8 pr-2.5 py-1.5 rounded-lg bg-[#162E5B] border border-blue-500/40 text-white text-[11px] placeholder-blue-300/50 focus:outline-none focus:border-emerald-400"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleInsertImageUrl}
                  className="px-2.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-bold flex items-center space-x-1 cursor-pointer flex-shrink-0"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Pasang</span>
                </button>
              </div>
            </div>

            <p className="text-[10px] text-blue-300/85">
              💡 <strong>Tips Cepat:</strong> Anda juga bisa langsung <strong>Ctrl+V</strong> (tempel screenshot) atau <strong>tarik file gambar</strong> ke dalam kotak teks. Klik gambar kapan saja untuk mengubah posisi & ukurannya!
            </p>

            {imageError && (
              <div className="p-2 rounded-lg bg-rose-950/80 border border-rose-500/60 text-rose-200 text-[11px]">
                {imageError}
              </div>
            )}
          </div>
        )}

        {/* PANEL PEMBUAT & EDITOR RUMUS MATEMATIKA VISUAL */}
        {showMathPanel && (
          <MathEquationPanel
            initialTex={editingMathState?.tex || ''}
            initialDisplay={editingMathState?.displayMode || false}
            isEditing={Boolean(editingMathState)}
            onInsert={handleInsertOrUpdateMath}
            onDelete={editingMathState ? handleDeleteSelectedMath : null}
            onClose={() => {
              setShowMathPanel(false);
              clearSelectedMath();
            }}
          />
        )}

        {/* PANEL KONTROL GAMBAR TERPILIH (POSISI, UKURAN SLIDER, PINDAH ATAS/BAWAH, HAPUS) */}
        {selectedImgState && (
          <div className="mt-1 p-2.5 rounded-xl bg-amber-950/60 border border-amber-400/70 space-y-2 animate-fade-in">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <span className="text-[11px] font-bold text-amber-300 flex items-center space-x-1.5">
                <Move className="w-3.5 h-3.5" />
                <span>Atur Posisi & Ukuran Gambar (Bisa juga diseret dengan mouse)</span>
              </span>
              <div className="flex items-center space-x-1">
                <button
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    handleMoveSelectedImage('up');
                  }}
                  title="Pindahkan gambar naik ke atas teks/baris sebelumnya"
                  className="px-2 py-1 rounded-md bg-[#162E5B] hover:bg-blue-700 text-blue-100 border border-blue-400/40 text-[10px] font-bold flex items-center space-x-1 cursor-pointer"
                >
                  <ArrowUp className="w-3 h-3" />
                  <span>Naik</span>
                </button>
                <button
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    handleMoveSelectedImage('down');
                  }}
                  title="Pindahkan gambar turun ke bawah teks/baris berikutnya"
                  className="px-2 py-1 rounded-md bg-[#162E5B] hover:bg-blue-700 text-blue-100 border border-blue-400/40 text-[10px] font-bold flex items-center space-x-1 cursor-pointer"
                >
                  <ArrowDown className="w-3 h-3" />
                  <span>Turun</span>
                </button>
                <button
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    handleDeleteSelectedImage();
                  }}
                  title="Hapus gambar ini"
                  className="px-2 py-1 rounded-md bg-rose-900/80 hover:bg-rose-700 text-rose-100 border border-rose-400/50 text-[10px] font-bold flex items-center space-x-1 cursor-pointer"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Hapus</span>
                </button>
                <button
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    clearSelectedImage();
                  }}
                  title="Tutup pengaturan gambar"
                  className="p-1 rounded-md bg-[#0F2042] hover:bg-[#162E5B] text-amber-200 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Kontrol Penempatan (6 Posisi Fleksibel) */}
            <div className="flex items-center flex-wrap gap-1 text-[10px]">
              <span className="text-amber-200 font-semibold mr-1">Posisi:</span>
              {IMAGE_POSITION_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    handleUpdateSelectedImgPos(opt.id);
                  }}
                  title={opt.desc}
                  className={`px-2 py-1 rounded-md border font-bold cursor-pointer transition-all ${
                    selectedImgState.pos === opt.id
                      ? 'bg-amber-500 text-slate-950 border-amber-200 shadow-xs'
                      : 'bg-[#0F2042] text-blue-100 border-blue-500/40 hover:bg-[#162E5B]'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {/* Kontrol Ukuran Cepat + Slider Lebar Gambar */}
            <div className="flex items-center flex-wrap gap-2 text-[10px]">
              <span className="text-amber-200 font-semibold">Ukuran:</span>
              <div className="flex items-center gap-1">
                {sizePresets.map((sz) => (
                  <button
                    key={sz.label}
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      handleUpdateSelectedImgWidth(sz.val);
                    }}
                    className={`px-2 py-0.5 rounded-md border font-bold cursor-pointer transition-all ${
                      selectedImgState.widthVal === sz.val
                        ? 'bg-blue-600 text-white border-blue-300'
                        : 'bg-[#0F2042] text-blue-100 border-blue-500/40 hover:bg-[#162E5B]'
                    }`}
                  >
                    {sz.label}
                  </button>
                ))}
              </div>
              <div className="flex items-center space-x-2 flex-1 min-w-[130px]">
                <input
                  type="range"
                  min={60}
                  max={compact ? 340 : 560}
                  step={10}
                  value={selectedImgState.widthPx}
                  onChange={(e) =>
                    handleUpdateSelectedImgWidth(Number(e.target.value))
                  }
                  className="flex-1 accent-amber-400 cursor-pointer h-1.5"
                />
                <span className="text-amber-200 font-mono font-bold min-w-[44px] text-right">
                  {selectedImgState.isFull ? '100%' : `${selectedImgState.widthPx}px`}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* AREA KETIK WYSIWYG (Mendukung Teks, Rumus, & Gambar Bebas) */}
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={() => {
          ensureImagesInteractive();
          // Jika gambar yang sedang dipilih terhapus lewat Backspace/Delete, tutup bar pengaturan
          if (
            selectedImgRef.current &&
            !editorRef.current?.contains(selectedImgRef.current)
          ) {
            clearSelectedImage();
          }
          if (
            selectedMathRef.current &&
            !editorRef.current?.contains(selectedMathRef.current)
          ) {
            clearSelectedMath();
            setShowMathPanel(false);
          }
          emitChange();
        }}
        onKeyUp={refreshToolbarState}
        onMouseUp={refreshToolbarState}
        onPaste={handlePaste}
        onDragStart={handleEditorDragStart}
        onDragOver={handleEditorDragOver}
        onDragLeave={() => setIsDraggingOver(false)}
        onDrop={handleEditorDrop}
        onClick={(e) => {
          setShowColorMenu(false);
          setShowHighlightMenu(false);
          const clickedMath = e.target?.closest?.('[data-math]');
          if (clickedMath && editorRef.current?.contains(clickedMath)) {
            clearSelectedImage();
            selectMathChipElement(clickedMath);
            return;
          }
          if (e.target && e.target.tagName === 'IMG') {
            clearSelectedMath();
            setShowMathPanel(false);
            selectImageElement(e.target);
          } else {
            clearSelectedImage();
            if (editingMathState) {
              clearSelectedMath();
              setShowMathPanel(false);
            }
          }
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
        className={`ms-word-editor w-full px-3 py-2 text-white text-xs sm:text-sm leading-relaxed focus:outline-none overflow-y-auto ${
          compact ? 'max-h-64' : 'max-h-96'
        } navy-scrollbar rounded-b-xl empty:before:content-[attr(data-placeholder)] empty:before:text-blue-300/40`}
      />
    </div>
  );
};

export default RichTextEditor;
