import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { validateLoginForm } from '../utils/validation';
import InputField from '../components/InputField';
import Button from '../components/Button';
import { AlertCircle, CheckCircle2, UserCheck } from 'lucide-react';

/**
 * Mengambil email/username akun yang tersimpan di perangkat lokal
 */
const getSavedIdentifier = () => {
  try {
    if (localStorage.getItem('tka_remember_me') === 'false') return '';
    const saved = localStorage.getItem('tka_saved_user');
    if (saved) {
      const parsed = JSON.parse(saved);
      return parsed?.identifier || parsed?.email || parsed?.username || '';
    }
    return localStorage.getItem('tka_last_identifier') || '';
  } catch {
    return '';
  }
};

/**
 * Halaman Login (Route "/")
 */
const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, loginAsGuest } = useAuth();

  // Pesan sukses dari halaman registrasi (jika baru selesai mendaftar)
  const successNotice = location.state?.message || '';

  // Nilai akun tersimpan awal untuk deteksi autofill warna kuning
  const [initialSavedIdentifier] = useState(() => getSavedIdentifier());

  // Status opsi 'Ingat Saya' (default aktif)
  const [rememberMe, setRememberMe] = useState(() => {
    return localStorage.getItem('tka_remember_me') !== 'false';
  });

  // State untuk form login (otomatis terisi dengan email/username akun tersimpan jika ada)
  const [formData, setFormData] = useState(() => ({
    identifier: getSavedIdentifier(),
    password: '',
  }));

  // Menandakan apakah kolom username/email sedang terisi otomatis dari akun tersimpan
  const isIdentifierAutofilled = Boolean(
    initialSavedIdentifier &&
      formData.identifier.trim() !== '' &&
      formData.identifier === initialSavedIdentifier
  );

  const handleGuestLogin = () => {
    loginAsGuest();
    navigate('/dashboard');
  };

  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
    if (serverError) {
      setServerError('');
    }
  };

  // Submit saat login
  const handleStandardSubmit = async (e) => {
    e.preventDefault();
    setServerError('');

    const validation = validateLoginForm(formData);
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    setIsLoading(true);
    try {
      const res = await login(formData.identifier, formData.password);

      if (rememberMe) {
        localStorage.setItem('tka_remember_me', 'true');
        const userToSave = {
          identifier: formData.identifier.trim(),
          username: res.user?.username || formData.identifier.trim(),
          email: res.user?.email || '',
        };
        localStorage.setItem('tka_saved_user', JSON.stringify(userToSave));
      } else {
        localStorage.setItem('tka_remember_me', 'false');
        localStorage.removeItem('tka_saved_user');
        localStorage.removeItem('tka_last_identifier');
      }

      navigate('/dashboard');
    } catch (err) {
      const errMsg = err.message || 'Username, email, atau password belum sesuai.';
      setServerError(errMsg);
      if (errMsg.toLowerCase().includes('password')) {
        setErrors((prev) => ({ ...prev, password: errMsg }));
      } else {
        setErrors((prev) => ({ ...prev, identifier: errMsg }));
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-transparent text-[#261C14] flex flex-col justify-center items-center p-4 sm:p-6">
      <div className="w-full max-w-md">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center mb-3 p-2 bg-white rounded-2xl shadow-md border border-white/30">
            <img
              src="/logo.png"
              alt="Logo MyAkademika"
              className="h-14 w-auto object-contain"
            />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight drop-shadow-sm">
            Masuk ke MyAkademika
          </h1>
          <p className="text-teal-50/90 text-sm mt-1 font-medium">
            Masuk dulu buat lanjut belajar dan latihan soal.
          </p>
        </div>

        {/* Card Form */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-8 shadow-xl">
          {/* Notifikasi Registrasi Berhasil */}
          {successNotice && (
            <div className="mb-5 p-3 rounded-lg bg-[#EBF7F0] border border-[#287A54]/30 flex items-start space-x-2.5 text-[#287A54] text-sm font-medium">
              <CheckCircle2 className="w-4 h-4 text-[#287A54] flex-shrink-0 mt-0.5" />
              <span>{successNotice}</span>
            </div>
          )}

          {/* Notifikasi Error dari Server */}
          {serverError && (
            <div className="mb-5 p-3 rounded-lg bg-[#FDF1F1] border border-[#C93B3B]/30 flex items-start space-x-2.5 text-[#C93B3B] text-sm font-medium">
              <AlertCircle className="w-4 h-4 text-[#C93B3B] flex-shrink-0 mt-0.5" />
              <span>{serverError}</span>
            </div>
          )}

          {/* FORMULIR LOGIN */}
          <div className="animate-fade-in">
            <form onSubmit={handleStandardSubmit} noValidate>
              <InputField
                label="Username atau Email"
                id="login-identifier"
                name="identifier"
                type="text"
                placeholder="Ketik username atau email"
                value={formData.identifier}
                onChange={handleChange}
                error={errors.identifier}
                required
                autoComplete="username"
                isAutofilled={isIdentifierAutofilled}
              />

              <InputField
                label="Password"
                id="login-password"
                name="password"
                type="password"
                placeholder="Ketik password kamu"
                value={formData.password}
                onChange={handleChange}
                error={errors.password}
                required
                showPasswordToggle
                autoComplete="current-password"
              />

              {/* Checkbox Ingat Saya & Link Lupa Password */}
              <div className="flex items-center justify-between mt-3 mb-1">
                <label
                  htmlFor="remember-me"
                  className="flex items-center space-x-2.5 cursor-pointer group select-none"
                >
                  <input
                    type="checkbox"
                    id="remember-me"
                    name="rememberMe"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 text-[#1E3A8A] border-slate-300 rounded focus:ring-[#1E3A8A] focus:ring-1 cursor-pointer transition-colors"
                  />
                  <span className="text-sm font-medium text-slate-700 group-hover:text-slate-900 transition-colors">
                    Ingat saya
                  </span>
                </label>

                <Link
                  to="/forgot-password"
                  className="text-xs font-semibold text-[#1E3A8A] hover:text-[#172554] hover:underline transition-colors"
                >
                  Lupa password?
                </Link>
              </div>

              <div className="mt-5 space-y-2.5">
                <Button
                  type="submit"
                  variant="primary"
                  fullWidth
                  isLoading={isLoading}
                  loadingText="Sebentar ya..."
                >
                  Masuk
                </Button>

                <button
                  type="button"
                  onClick={handleGuestLogin}
                  disabled={isLoading}
                  className="w-full py-2.5 px-4 rounded-lg border-2 border-[#162E5B]/30 hover:border-[#162E5B] bg-slate-100 hover:bg-blue-50 text-[#162E5B] font-bold text-sm transition-all flex items-center justify-center space-x-2 cursor-pointer shadow-2xs active:scale-[0.99]"
                >
                  <UserCheck className="w-4 h-4 text-[#1E3A8A]" />
                  <span>Coba sebagai Tamu</span>
                </button>
              </div>
            </form>

            {/* Link ke Registrasi */}
            <div className="mt-6 pt-6 border-t border-slate-200 text-center">
              <p className="text-sm text-slate-600">
                Belum punya akun?{' '}
                <Link
                  to="/register"
                  className="font-bold text-[#1E3A8A] hover:text-[#172554] hover:underline transition-colors"
                >
                  Daftar dulu
                </Link>
              </p>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <p className="text-center text-xs text-white mt-6">
          &copy; {new Date().getFullYear()} MyAkademika
        </p>
      </div>
    </div>
  );
};

export default Login;

