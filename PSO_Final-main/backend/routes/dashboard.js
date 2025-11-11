const express = require('express');
const router = express.Router();
const Material = require('../models/Material');
const Dropdown = require('../models/Dropdown');
const { isAuthenticated } = require('../middleware/auth');

// ======================================
// GET /api/dashboard/stats
// Get dashboard statistics
// ======================================
router.get('/stats', isAuthenticated, async (req, res) => {
  try {
    // 1. Total materials (all)
    const totalMaterials = await Material.countDocuments();
    
    // 2. Active materials only
    const activeMaterials = await Material.countDocuments({ isActive: true });

    // 3. Count materials per division (active only)
    const materialsByDivision = await Material.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: '$divisionId',
          count: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: 'dropdowns',
          localField: '_id',
          foreignField: '_id',
          as: 'division',
        },
      },
      {
        $unwind: '$division',
      },
      {
        $project: {
          division: '$division.label',
          count: 1,
        },
      },
      {
        $sort: { count: -1 },
      },
    ]);

    // 4. Get recent 12 materials (all, regardless of status)
    const recentMaterials = await Material.find()
      .populate('divisionId', 'label')
      .populate('placementId', 'label')
      .sort({ createdAt: -1 })
      .limit(12);

    // 5. Total divisions dan placements
    const totalDivisions = await Dropdown.countDocuments({ type: 'division' });

    res.json({
      totalMaterials,
      activeMaterials,
      totalDivisions,
      materialsByDivision,
      recentMaterials,
    });

    console.log('✅ Dashboard stats fetched');
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard statistics' });
  }
});

module.exports = router;
