import React, { useState, useEffect } from 'react';
import originalImage from '../assets/mascot.png';

/**
 * Komponen Karakter Siswa TKA SD (Ilustrasi Bersih)
 * Responsif: dapat tampil rapi di sebelah kanan bahkan pada layar HP (mobile)
 */
const CharacterIllustration = () => {
  const [processedSrc, setProcessedSrc] = useState(null);

  useEffect(() => {
    let isMounted = true;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = originalImage;

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const w = img.naturalWidth || 800;
        const h = img.naturalHeight || 800;
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);

        const imgData = ctx.getImageData(0, 0, w, h);
        const data = imgData.data;

        // BFS flood fill dari sudut gambar untuk menghapus background putih luar
        const visited = new Uint8Array(w * h);
        const queue = new Int32Array(w * h);
        let head = 0;
        let tail = 0;

        const startPoints = [0, w - 1, (h - 1) * w, (h - 1) * w + (w - 1)];

        for (const p of startPoints) {
          visited[p] = 1;
          queue[tail++] = p;
        }

        while (head < tail) {
          const idx = queue[head++];
          const x = idx % w;
          const y = (idx / w) | 0;
          const pixelIdx = idx * 4;

          const r = data[pixelIdx];
          const g = data[pixelIdx + 1];
          const b = data[pixelIdx + 2];

          if (r > 240 && g > 240 && b > 240) {
            data[pixelIdx + 3] = 0;

            if (x > 0) {
              const left = idx - 1;
              if (!visited[left]) {
                visited[left] = 1;
                queue[tail++] = left;
              }
            }
            if (x < w - 1) {
              const right = idx + 1;
              if (!visited[right]) {
                visited[right] = 1;
                queue[tail++] = right;
              }
            }
            if (y > 0) {
              const up = idx - w;
              if (!visited[up]) {
                visited[up] = 1;
                queue[tail++] = up;
              }
            }
            if (y < h - 1) {
              const down = idx + w;
              if (!visited[down]) {
                visited[down] = 1;
                queue[tail++] = down;
              }
            }
          }
        }

        ctx.putImageData(imgData, 0, 0);

        // Pangkas area transparan di tepi gambar agar ukuran karakter tampil maksimal & proporsional di mobile
        let minX = w;
        let minY = h;
        let maxX = 0;
        let maxY = 0;
        let hasOpaque = false;

        for (let y = 0; y < h; y++) {
          const rowOffset = y * w;
          for (let x = 0; x < w; x++) {
            if (data[(rowOffset + x) * 4 + 3] > 10) {
              if (x < minX) minX = x;
              if (x > maxX) maxX = x;
              if (y < minY) minY = y;
              if (y > maxY) maxY = y;
              hasOpaque = true;
            }
          }
        }

        let outputCanvas = canvas;
        if (hasOpaque && maxX > minX && maxY > minY) {
          const pad = Math.round(Math.max(w, h) * 0.015);
          const sx = Math.max(0, minX - pad);
          const sy = Math.max(0, minY - pad);
          const sw = Math.min(w - sx, maxX - minX + 1 + pad * 2);
          const sh = Math.min(h - sy, maxY - minY + 1 + pad * 2);

          const cropped = document.createElement('canvas');
          cropped.width = sw;
          cropped.height = sh;
          const croppedCtx = cropped.getContext('2d');
          croppedCtx.drawImage(canvas, sx, sy, sw, sh, 0, 0, sw, sh);
          outputCanvas = cropped;
        }

        if (isMounted) {
          setProcessedSrc(outputCanvas.toDataURL('image/png'));
        }
      } catch (err) {
        console.warn('Gagal memproses transparansi gambar:', err);
      }
    };

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="relative flex flex-col items-center justify-center select-none w-full max-w-[230px] sm:max-w-[300px] md:max-w-[360px] lg:max-w-[420px]">
      {/* Character Container (Murni Ilustrasi Bersih Tanpa Button & Tulisan Klik) */}
      <div className="relative z-10 w-full flex justify-center">
        <img
          src={processedSrc || originalImage}
          alt="Ilustrasi Siswa MyAkademika"
          className="w-full h-[300px] sm:h-[350px] md:h-[400px] lg:h-[440px] object-contain transition-all duration-200 max-w-full drop-shadow-sm pointer-events-none"
          draggable="false"
        />
      </div>
    </div>
  );
};

export default CharacterIllustration;
