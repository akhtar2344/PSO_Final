// Middleware untuk mengecek apakah user sudah login
// Digunakan untuk protect routes yang membutuhkan authentication

function isAuthenticated(req, res, next) {
  // Cek apakah ada userId di session
  if (req.session && req.session.userId) {
    // User sudah login, lanjutkan ke route berikutnya
    return next();
  }

  // User belum login, kirim error response
  return res.status(401).json({
    error: 'Please login first',
    isAuthenticated: false,
  });
}

// Export middleware
module.exports = { isAuthenticated };
