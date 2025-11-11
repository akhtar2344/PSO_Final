const express = require('express');
const router = express.Router();
const Dropdown = require('../models/Dropdown');
const Material = require('../models/Material');
const { isAuthenticated } = require('../middleware/auth');

// ======================================
// GET /api/dropdowns/:type
// Get all dropdowns by type (division or placement)
// ======================================
router.get('/:type', isAuthenticated, async (req, res) => {
  try {
    const { type } = req.params;

    // Validasi type
    if (type !== 'division' && type !== 'placement') {
      return res.status(400).json({ error: 'Type must be "division" or "placement"' });
    }

    // Ambil dropdown berdasarkan type
    const dropdowns = await Dropdown.find({ type, isActive: true }).sort({ label: 1 });

    res.json(dropdowns);
  } catch (error) {
    console.error('Get dropdowns error:', error);
    res.status(500).json({ error: 'Failed to fetch dropdowns' });
  }
});

// ======================================
// GET /api/dropdowns/all/options
// Get all dropdowns (both types)
// ======================================
router.get('/all/options', isAuthenticated, async (req, res) => {
  try {
    const divisions = await Dropdown.find({ type: 'division', isActive: true }).sort({ label: 1 });
    const placements = await Dropdown.find({ type: 'placement', isActive: true }).sort({ label: 1 });

    res.json({
      divisions,
      placements,
    });
  } catch (error) {
    console.error('Get all dropdowns error:', error);
    res.status(500).json({ error: 'Failed to fetch dropdowns' });
  }
});

// ======================================
// POST /api/dropdowns
// Create new dropdown option
// ======================================
router.post('/', isAuthenticated, async (req, res) => {
  try {
    const { type, label, value } = req.body;

    // Validasi input
    if (!type || !label || !value) {
      return res.status(400).json({ error: 'Please provide type, label, and value' });
    }

    // Validasi type
    if (type !== 'division' && type !== 'placement') {
      return res.status(400).json({ error: 'Type must be "division" or "placement"' });
    }

    // Cek apakah kombinasi type dan value sudah ada
    const existing = await Dropdown.findOne({ type, value });
    if (existing) {
      return res.status(400).json({ error: `${type} with value "${value}" already exists` });
    }

    // Buat dropdown baru
    const newDropdown = new Dropdown({
      type,
      label,
      value,
    });

    await newDropdown.save();

    res.status(201).json({
      success: true,
      dropdown: newDropdown,
    });

    console.log(`✅ Dropdown created: ${label} (${type})`);
  } catch (error) {
    console.error('Create dropdown error:', error);
    res.status(500).json({ error: 'Failed to create dropdown' });
  }
});

// ======================================
// PUT /api/dropdowns/:id
// Update dropdown option
// ======================================
router.put('/:id', isAuthenticated, async (req, res) => {
  try {
    const { label, value } = req.body;

    // Cari dropdown
    const dropdown = await Dropdown.findById(req.params.id);
    if (!dropdown) {
      return res.status(404).json({ error: 'Dropdown not found' });
    }

    // Cek apakah value sudah dipakai dropdown lain dengan type yang sama
    if (value && value !== dropdown.value) {
      const existing = await Dropdown.findOne({
        type: dropdown.type,
        value,
        _id: { $ne: req.params.id },
      });

      if (existing) {
        return res.status(400).json({ error: `${dropdown.type} with value "${value}" already exists` });
      }
    }

    // Update fields
    if (label) dropdown.label = label;
    if (value) dropdown.value = value;

    await dropdown.save();

    res.json({
      success: true,
      dropdown,
    });

    console.log(`✅ Dropdown updated: ${dropdown.label}`);
  } catch (error) {
    console.error('Update dropdown error:', error);
    res.status(500).json({ error: 'Failed to update dropdown' });
  }
});

// ======================================
// DELETE /api/dropdowns/:id
// Delete dropdown (hanya jika tidak dipakai)
// ======================================
router.delete('/:id', isAuthenticated, async (req, res) => {
  try {
    const dropdown = await Dropdown.findById(req.params.id);
    if (!dropdown) {
      return res.status(404).json({ error: 'Dropdown not found' });
    }

    // Cek apakah dropdown sedang dipakai oleh material
    const field = dropdown.type === 'division' ? 'divisionId' : 'placementId';
    const usedCount = await Material.countDocuments({ [field]: dropdown._id });

    if (usedCount > 0) {
      return res.status(400).json({
        error: `Cannot delete. This ${dropdown.type} is used by ${usedCount} material(s)`,
      });
    }

    // Hapus dropdown
    await Dropdown.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Dropdown deleted successfully',
    });

    console.log(`✅ Dropdown deleted: ${dropdown.label}`);
  } catch (error) {
    console.error('Delete dropdown error:', error);
    res.status(500).json({ error: 'Failed to delete dropdown' });
  }
});

module.exports = router;
