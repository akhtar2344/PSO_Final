const mongoose = require('mongoose');

// Schema untuk Dropdown
// Menyimpan opsi dropdown untuk divisi dan lokasi penempatan
const dropdownSchema = new mongoose.Schema(
  {
    // Tipe dropdown: "division" atau "placement"
    type: {
      type: String,
      required: true,
      enum: ['division', 'placement'], // Hanya boleh 2 nilai ini
    },

    // Label yang ditampilkan (contoh: "IT Division")
    label: {
      type: String,
      required: true,
      trim: true,
    },

    // Value untuk data (contoh: "it")
    value: {
      type: String,
      required: true,
      trim: true,
    },

    // Status aktif/tidak aktif
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true, // Otomatis menambahkan createdAt dan updatedAt
  }
);

// Index untuk kombinasi type dan value agar unik
dropdownSchema.index({ type: 1, value: 1 }, { unique: true });

// Export model
module.exports = mongoose.model('Dropdown', dropdownSchema);
