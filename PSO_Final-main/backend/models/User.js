const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

// Schema untuk User
// Menyimpan data user dengan password terenkripsi
const userSchema = new mongoose.Schema(
  {
    // Email user (wajib diisi dan unik)
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    // Password terenkripsi dengan bcrypt
    password: {
      type: String,
      required: true,
    },

    // Nama lengkap user
    name: {
      type: String,
      required: true,
      trim: true,
    },

    // Role user (default: "user")
    role: {
      type: String,
      default: 'user',
      enum: ['user', 'admin'],
    },
  },
  {
    timestamps: true, // Otomatis menambahkan createdAt dan updatedAt
  }
);

// Method untuk hash password sebelum save
userSchema.pre('save', async function (next) {
  // Hanya hash password jika password baru atau diubah
  if (!this.isModified('password')) return next();

  try {
    // Hash password dengan salt rounds 10
    this.password = await bcrypt.hash(this.password, 10);
    next();
  } catch (error) {
    next(error);
  }
});

// Method untuk membandingkan password saat login
userSchema.methods.comparePassword = async function (candidatePassword) {
  try {
    const isMatch = await bcrypt.compare(candidatePassword, this.password);
    console.log('Compare password:', candidatePassword, 'with hash:', this.password);
    console.log('Result:', isMatch);
    return isMatch;
  } catch (error) {
    console.error('comparePassword error:', error);
    throw error;
  }
};

// Export model
module.exports = mongoose.model('User', userSchema);
