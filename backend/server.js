// Import packages yang dibutuhkan
const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

// Import routes
const authRoutes = require('./routes/auth');
const materialRoutes = require('./routes/materials');
const dropdownRoutes = require('./routes/dropdowns');
const dashboardRoutes = require('./routes/dashboard');

// Inisialisasi Express app
const app = express();
const PORT = process.env.PORT || 5000;

// ======================================
// MIDDLEWARE SETUP
// ======================================

// CORS - mengizinkan request dari frontend
app.use(
  cors({
    origin: 'http://localhost:3000', // URL frontend React
    credentials: true, // Penting untuk session cookies
  })
);

// Body parser - untuk membaca request body
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session setup - untuk authentication
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'your-secret-key-here',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: process.env.MONGODB_URI,
      touchAfter: 24 * 3600, // lazy session update
    }),
    cookie: {
      maxAge: 24 * 60 * 60 * 1000, // 24 jam
      httpOnly: true,
      secure: false, // Set true jika pakai HTTPS
      sameSite: 'lax', // Penting untuk CORS
    },
  })
);

// Debug middleware - untuk lihat session
app.use((req, res, next) => {
  console.log('Session ID:', req.sessionID);
  console.log('Session Data:', req.session);
  next();
});

// Static folder untuk serve uploaded images
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ======================================
// MONGODB CONNECTION
// ======================================

mongoose
  .connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/material-management', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log('✅ MongoDB connected successfully');
  })
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err);
  });

// ======================================
// ROUTES
// ======================================

// Health check endpoint
app.get('/', (req, res) => {
  res.json({ message: 'Material Management API is running!' });
});

// Mount API routes
app.use('/api/auth', authRoutes);
app.use('/api/materials', materialRoutes);
app.use('/api/dropdowns', dropdownRoutes);
app.use('/api/dashboard', dashboardRoutes);

// ======================================
// ERROR HANDLING
// ======================================

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
  });
});

// ======================================
// START SERVER
// ======================================

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
