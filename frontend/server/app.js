import express from 'express';
import cors from 'cors';
import { env } from './config/env.js';
import authRoutes from './routes/auth.routes.js';
import profileRoutes from './routes/profile.routes.js';
import contentRoutes from './routes/content.routes.js';
import { notFoundHandler, errorHandler } from './middlewares/error.middleware.js';

const app = express();

// Konfigurasi CORS
app.use(
  cors({
    origin: (origin, callback) => {
      // Izinkan jika tanpa origin (seperti Postman, curl, server-to-server)
      if (!origin) return callback(null, true);

      const allowedExact = [
        env.frontendUrl,
        'https://prams43.github.io',
        'http://localhost:5173',
        'http://127.0.0.1:5173',
        'http://localhost:5174',
        'http://127.0.0.1:5174',
        'http://localhost:5175',
        'http://127.0.0.1:5175',
      ];

      // Izinkan origin exact match, domain vercel.app, atau domain github.io
      if (
        allowedExact.includes(origin) ||
        origin.endsWith('.vercel.app') ||
        origin.endsWith('.github.io')
      ) {
        return callback(null, true);
      }

      return callback(null, true); // Fallback izinkan untuk kemudahan deployment
    },
    credentials: true,
  })
);

// Middleware parsing request body (diperbesar untuk mendukung gambar pada Materi & Latihan Soal)
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// Endpoint cek kesehatan di root (/)
app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Backend API TKA SD siap melayani request di Vercel.',
    timestamp: new Date().toISOString(),
  });
});

// Endpoint cek kesehatan server (/api/health dan /health)
app.get(['/api/health', '/health'], (req, res) => {
  res.json({
    status: 'ok',
    message: 'Backend API TKA SD siap melayani request.',
    timestamp: new Date().toISOString(),
  });
});

// Pendaftaran route autentikasi, profil, dan manajemen konten (mendukung prefix /api maupun root /)
app.use('/api', authRoutes);
app.use('/api', profileRoutes);
app.use('/api', contentRoutes);
app.use('/', authRoutes);
app.use('/', profileRoutes);
app.use('/', contentRoutes);


// Middleware penanganan 404
app.use(notFoundHandler);

// Middleware penanganan error terpusat
app.use(errorHandler);

export default app;
