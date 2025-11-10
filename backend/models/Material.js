const mongoose = require('mongoose');

// Schema untuk Material
// Menyimpan data material dengan gambar, divisi, dan lokasi penempatan
const materialSchema = new mongoose.Schema(
  {
    // Nama material (wajib diisi)
    materialName: {
      type: String,
      required: true,
      trim: true,
    },

    // Nomor material (wajib diisi dan unik)
    materialNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    // Referensi ke divisi (dari Dropdown collection)
    divisionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Dropdown',
      required: true,
    },

    // Referensi ke lokasi penempatan (dari Dropdown collection)
    placementId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Dropdown',
      required: true,
    },

    // Fungsi atau deskripsi material
    function: {
      type: String,
      trim: true,
    },

    // Array untuk menyimpan gambar material
    images: [
      {
        url: {
          type: String,
          required: true,
        },
        isPrimary: {
          type: Boolean,
          default: false,
        },
      },
    ],

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

// Export model
module.exports = mongoose.model('Material', materialSchema);
