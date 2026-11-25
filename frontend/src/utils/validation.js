/**
 * Validasi form pendaftaran (Register)
 * @param {Object} data { username, email, password, confirmPassword }
 * @returns {{ errors: Object, isValid: boolean }}
 */
export const validateRegisterForm = ({ username, email, password, confirmPassword }) => {
  const errors = {};

  // Validasi Username
  if (!username || !username.trim()) {
    errors.username = 'Username belum diisi.';
  } else {
    const trimmedUser = username.trim();
    if (trimmedUser.includes('@')) {
      errors.username = 'Username jangan pakai alamat email ya (tanpa tanda @).';
    } else if (email && trimmedUser.toLowerCase() === email.trim().toLowerCase()) {
      errors.username = 'Username harus beda dari alamat email.';
    } else {
      const userRegex = /^[a-zA-Z0-9._-]{3,20}$/;
      if (!userRegex.test(trimmedUser)) {
        errors.username = 'Username minimal 3–20 karakter (huruf, angka, titik, atau underscore tanpa spasi).';
      }
    }
  }

  // Validasi Email (Bebas domain apapun)
  if (!email || !email.trim()) {
    errors.email = 'Email belum diisi.';
  } else {
    const trimmed = email.trim().toLowerCase();
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(trimmed)) {
      errors.email = 'Format email belum sesuai (contoh: nama@gmail.com).';
    }
  }

  // Validasi Password
  if (!password) {
    errors.password = 'Password belum diisi.';
  } else if (password.length < 8) {
    errors.password = 'Password minimal 8 karakter ya.';
  }

  // Validasi Konfirmasi Password
  if (!confirmPassword) {
    errors.confirmPassword = 'Tulis ulang password di kolom konfirmasi.';
  } else if (password !== confirmPassword) {
    errors.confirmPassword = 'Kedua password belum sama.';
  }

  return {
    errors,
    isValid: Object.keys(errors).length === 0,
  };
};

/**
 * Validasi form login
 * @param {Object} data { identifier, password }
 * @returns {{ errors: Object, isValid: boolean }}
 */
export const validateLoginForm = ({ identifier, password }) => {
  const errors = {};

  if (!identifier || !identifier.trim()) {
    errors.identifier = 'Username atau email belum diisi.';
  }

  if (!password) {
    errors.password = 'Password belum diisi.';
  }

  return {
    errors,
    isValid: Object.keys(errors).length === 0,
  };
};

/**
 * Validasi kode OTP (6 digit angka)
 * @param {string} otp
 * @returns {boolean}
 */
export const isValidOtp = (otp) => {
  if (!otp) return false;
  return /^\d{6}$/.test(otp.trim());
};


