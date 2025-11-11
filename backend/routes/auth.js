const express = require('express');
const router = express.Router();
const User = require('../models/User');

// ======================================
// POST /api/auth/login
// Login user dengan email dan password
// ======================================
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validasi input
    if (!email || !password) {
      return res.status(400).json({ error: 'Please provide email and password' });
    }

    // Cari user berdasarkan email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Cek password menggunakan method comparePassword dari model
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Buat session untuk user
    req.session.userId = user._id;

    // Kirim response sukses (jangan kirim password!)
    res.json({
      success: true,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });

    console.log(`✅ User logged in: ${user.email}`);
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed. Please try again' });
  }
});

// ======================================
// POST /api/auth/logout
// Logout user dan hapus session
// ======================================
router.post('/logout', (req, res) => {
  try {
    // Hapus session
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ error: 'Logout failed' });
      }

      // Clear cookie
      res.clearCookie('connect.sid');

      res.json({
        success: true,
        message: 'Logged out successfully',
      });

      console.log('✅ User logged out');
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Logout failed' });
  }
});

// ======================================
// GET /api/auth/check
// Cek apakah user masih login
// ======================================
router.get('/check', async (req, res) => {
  try {
    // Cek apakah ada session userId
    if (!req.session.userId) {
      return res.json({ isAuthenticated: false });
    }

    // Ambil data user dari database
    const user = await User.findById(req.session.userId).select('-password');

    if (!user) {
      return res.json({ isAuthenticated: false });
    }

    // User masih login
    res.json({
      isAuthenticated: true,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Check auth error:', error);
    res.json({ isAuthenticated: false });
  }
});

// ======================================
// POST /api/auth/register
// Register user baru (opsional)
// ======================================
router.post('/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;

    // Validasi input
    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Please provide all required fields' });
    }

    // Cek apakah email sudah terdaftar
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Buat user baru (password akan otomatis di-hash oleh pre-save hook)
    const newUser = new User({
      email,
      password,
      name,
    });

    await newUser.save();

    // Kirim response sukses
    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      user: {
        id: newUser._id,
        email: newUser.email,
        name: newUser.name,
      },
    });

    console.log(`✅ New user registered: ${newUser.email}`);
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Registration failed. Please try again' });
  }
});

module.exports = router;
