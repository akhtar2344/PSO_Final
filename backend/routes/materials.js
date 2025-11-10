const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Material = require('../models/Material');
const { isAuthenticated } = require('../middleware/auth');

// ======================================
// MULTER SETUP untuk Upload Image
// ======================================

// Storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/materials';
    // Buat folder jika belum ada
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Buat nama file unik: timestamp + random + extension
    const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1e9) + path.extname(file.originalname);
    cb(null, uniqueName);
  },
});

// File filter - hanya terima jpg dan png
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    cb(null, true);
  } else {
    cb(new Error('Only .jpg, .jpeg, and .png files are allowed'));
  }
};

// Multer upload instance
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // Max 5MB
});

// ======================================
// GET /api/materials
// Get all materials dengan pagination dan filter
// ======================================
router.get('/', isAuthenticated, async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', divisionId, placementId } = req.query;

    // Build query filter - TAMPILKAN SEMUA MATERIAL (active dan inactive)
    const filter = {};

    // Search by name or number
    if (search) {
      filter.$or = [{ materialName: { $regex: search, $options: 'i' } }, { materialNumber: { $regex: search, $options: 'i' } }];
    }

    // Filter by division
    if (divisionId) {
      filter.divisionId = divisionId;
    }

    // Filter by placement
    if (placementId) {
      filter.placementId = placementId;
    }

    // Execute query dengan pagination
    const materials = await Material.find(filter)
      .populate('divisionId', 'label value')
      .populate('placementId', 'label value')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    // Count total documents
    const total = await Material.countDocuments(filter);

    res.json({
      materials,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('Get materials error:', error);
    res.status(500).json({ error: 'Failed to fetch materials' });
  }
});

// ======================================
// GET /api/materials/:id
// Get single material by ID
// ======================================
router.get('/:id', isAuthenticated, async (req, res) => {
  try {
    const material = await Material.findById(req.params.id).populate('divisionId placementId');

    if (!material) {
      return res.status(404).json({ error: 'Material not found' });
    }

    res.json(material);
  } catch (error) {
    console.error('Get material error:', error);
    res.status(500).json({ error: 'Failed to fetch material' });
  }
});

// ======================================
// POST /api/materials
// Create new material
// ======================================
router.post('/', isAuthenticated, async (req, res) => {
  try {
    console.log('📦 Received material data:', req.body);
    const { materialName, materialNumber, divisionId, placementId, function: materialFunction } = req.body;

    // Validasi input
    if (!materialName || !materialNumber || !divisionId || !placementId) {
      console.log('❌ Validation failed:', { materialName, materialNumber, divisionId, placementId });
      return res.status(400).json({ 
        error: 'Please provide all required fields',
        received: { materialName, materialNumber, divisionId, placementId }
      });
    }

    // Cek apakah material number sudah ada
    const existing = await Material.findOne({ materialNumber });
    if (existing) {
      return res.status(400).json({ error: 'Material number already exists' });
    }

    // Buat material baru
    const newMaterial = new Material({
      materialName,
      materialNumber,
      divisionId,
      placementId,
      function: materialFunction,
    });

    await newMaterial.save();

    // Populate references
    await newMaterial.populate('divisionId placementId');

    res.status(201).json(newMaterial);

    console.log(`✅ Material created: ${newMaterial.materialName}`);
  } catch (error) {
    console.error('Create material error:', error);
    res.status(500).json({ error: 'Failed to create material' });
  }
});

// ======================================
// PUT /api/materials/:id
// Update material
// ======================================
router.put('/:id', isAuthenticated, async (req, res) => {
  try {
    const { materialName, materialNumber, divisionId, placementId, function: materialFunction } = req.body;

    // Cari material
    const material = await Material.findById(req.params.id);
    if (!material) {
      return res.status(404).json({ error: 'Material not found' });
    }

    // Cek apakah material number sudah dipakai material lain
    if (materialNumber && materialNumber !== material.materialNumber) {
      const existing = await Material.findOne({ materialNumber, _id: { $ne: req.params.id } });
      if (existing) {
        return res.status(400).json({ error: 'Material number already exists' });
      }
    }

    // Update fields
    if (materialName) material.materialName = materialName;
    if (materialNumber) material.materialNumber = materialNumber;
    if (divisionId) material.divisionId = divisionId;
    if (placementId) material.placementId = placementId;
    if (materialFunction !== undefined) material.function = materialFunction;

    await material.save();
    await material.populate('divisionId placementId');

    res.json(material);

    console.log(`✅ Material updated: ${material.materialName}`);
  } catch (error) {
    console.error('Update material error:', error);
    res.status(500).json({ error: 'Failed to update material' });
  }
});

// ======================================
// PATCH /api/materials/:id/toggle-status
// Toggle active/inactive status
// ======================================
router.patch('/:id/toggle-status', isAuthenticated, async (req, res) => {
  try {
    const material = await Material.findById(req.params.id);
    if (!material) {
      return res.status(404).json({ error: 'Material not found' });
    }

    material.isActive = !material.isActive;
    await material.save();
    await material.populate('divisionId placementId');

    res.json(material);
    console.log(`✅ Material status toggled: ${material.materialName} - Active: ${material.isActive}`);
  } catch (error) {
    console.error('Toggle status error:', error);
    res.status(500).json({ error: 'Failed to toggle status' });
  }
});

// ======================================
// DELETE /api/materials/:id
// Delete material dan gambarnya
// ======================================
router.delete('/:id', isAuthenticated, async (req, res) => {
  try {
    const material = await Material.findById(req.params.id);
    if (!material) {
      return res.status(404).json({ error: 'Material not found' });
    }

    // Hapus semua gambar dari filesystem
    material.images.forEach((image) => {
      const imagePath = path.join(__dirname, '..', image.url);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    });

    // Hapus material dari database
    await Material.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Material deleted successfully',
    });

    console.log(`✅ Material deleted: ${material.materialName}`);
  } catch (error) {
    console.error('Delete material error:', error);
    res.status(500).json({ error: 'Failed to delete material' });
  }
});

// ======================================
// POST /api/materials/:id/images
// Upload images untuk material (max 5 images)
// ======================================
router.post('/:id/images', isAuthenticated, upload.array('images', 5), async (req, res) => {
  try {
    const material = await Material.findById(req.params.id);
    if (!material) {
      return res.status(404).json({ error: 'Material not found' });
    }

    // Cek jumlah gambar yang sudah ada
    if (material.images.length + req.files.length > 5) {
      return res.status(400).json({ error: 'Maximum 5 images allowed per material' });
    }

    // Tambahkan gambar baru
    const newImages = req.files.map((file, index) => ({
      url: `/uploads/materials/${file.filename}`,
      isPrimary: material.images.length === 0 && index === 0, // Set first image as primary if no images exist
    }));

    material.images.push(...newImages);
    await material.save();

    res.json({
      success: true,
      material,
    });

    console.log(`✅ ${req.files.length} image(s) uploaded for material: ${material.materialName}`);
  } catch (error) {
    console.error('Upload images error:', error);
    res.status(500).json({ error: 'Failed to upload images' });
  }
});

// ======================================
// DELETE /api/materials/:id/images/:imageId
// Delete single image
// ======================================
router.delete('/:id/images/:imageId', isAuthenticated, async (req, res) => {
  try {
    const material = await Material.findById(req.params.id);
    if (!material) {
      return res.status(404).json({ error: 'Material not found' });
    }

    // Cari image
    const image = material.images.id(req.params.imageId);
    if (!image) {
      return res.status(404).json({ error: 'Image not found' });
    }

    // Hapus file dari filesystem
    const imagePath = path.join(__dirname, '..', image.url);
    if (fs.existsSync(imagePath)) {
      fs.unlinkSync(imagePath);
    }

    // Hapus dari database
    material.images.pull(req.params.imageId);
    await material.save();

    res.json({
      success: true,
      message: 'Image deleted successfully',
    });

    console.log(`✅ Image deleted from material: ${material.materialName}`);
  } catch (error) {
    console.error('Delete image error:', error);
    res.status(500).json({ error: 'Failed to delete image' });
  }
});

// ======================================
// PUT /api/materials/:id/images/:imageId/primary
// Set image as primary
// ======================================
router.put('/:id/images/:imageId/primary', isAuthenticated, async (req, res) => {
  try {
    const material = await Material.findById(req.params.id);
    if (!material) {
      return res.status(404).json({ error: 'Material not found' });
    }

    // Reset semua isPrimary ke false
    material.images.forEach((img) => {
      img.isPrimary = false;
    });

    // Set image yang dipilih jadi primary
    const image = material.images.id(req.params.imageId);
    if (!image) {
      return res.status(404).json({ error: 'Image not found' });
    }

    image.isPrimary = true;
    await material.save();

    res.json({
      success: true,
      material,
    });
  } catch (error) {
    console.error('Set primary image error:', error);
    res.status(500).json({ error: 'Failed to set primary image' });
  }
});

module.exports = router;
