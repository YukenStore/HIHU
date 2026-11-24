import katex from 'katex';

/**
 * Utility untuk memformat dan merender rumus matematika (LaTeX / KaTeX)
 * serta format teks (markdown bold, breaks) menjadi HTML yang rapi dan benar.
 */
export function formatMath(text) {
  if (text === null || text === undefined) return '';
  if (typeof text !== 'string') return String(text);

  // Bersihkan tag [H] atau [horizontal] jika masih ada, serta samakan format baris baru
  let result = text
    .replace(/\[h(?:orizontal)?\]\s*/gi, '')
    .replace(/\r\n/g, '\n');

  // 1. Render display math $$ ... $$
  result = result.replace(/\$\$([^$]+)\$\$/g, (match, formula) => {
    try {
      return katex.renderToString(formula.trim(), {
        displayMode: true,
        throwOnError: false,
      });
    } catch {
      return match;
    }
  });

  // 2. Render inline math $ ... $
  result = result.replace(/\$([^$\n]+)\$/g, (match, formula) => {
    try {
      return katex.renderToString(formula.trim(), {
        displayMode: false,
        throwOnError: false,
      });
    } catch {
      return match;
    }
  });

  // 3. Tangani kasus pecahan LaTeX mentah tanpa tanda dollar ($) misalnya \frac{1}{2} atau 3\frac{1}{2}
  result = result.replace(/(\d*\\frac\{[^{}]+\}\{[^{}]+\})/g, (match, formula) => {
    try {
      return katex.renderToString(formula.trim(), {
        displayMode: false,
        throwOnError: false,
      });
    } catch {
      return match;
    }
  });

  // 4. Konversi format markdown bold **teks** menjadi <strong>teks</strong>
  result = result.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');

  // 5. Konversi newline \n menjadi <br /> agar baris baru sesuai dengan ketikan di Admin Panel
  result = result.replace(/\n/g, '<br />');

  return result;
}

export default formatMath;
