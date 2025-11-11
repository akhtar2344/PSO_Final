/**
 * Migration Script - Migrate local images to Cloudinary
 * 
 * Usage:
 *   node migrateImagesToCloudinary.js
 * 
 * Before running:
 * 1. Backup your database: mongodump --uri "your_mongodb_uri" --out ./backup
 * 2. Ensure .env file has CLOUDINARY credentials
 * 3. Make sure you have all local images in /uploads/materials folder
 */

require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const Material = require('./models/Material');
const { uploadImage } = require('./utils/cloudinary');

// Configuration
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/material-management';
const LOCAL_UPLOADS_DIR = path.join(__dirname, 'uploads', 'materials');

// Migration stats
const stats = {
  materialsProcessed: 0,
  imagesProcessed: 0,
  imagesMigrated: 0,
  imagesFailed: 0,
  errors: [],
};

/**
 * Migrate all images untuk one material
 */
async function migrateMaterialImages(material) {
  console.log(`\n📦 Processing material: ${material.materialName} (${material._id})`);
  
  if (!material.images || material.images.length === 0) {
    console.log('  → No images to migrate');
    return;
  }

  const updatedImages = [];

  for (const image of material.images) {
    try {
      // Check if image is already from Cloudinary (has https://res.cloudinary.com)
      if (image.url && image.url.includes('cloudinary.com')) {
        console.log(`  ✓ Already on Cloudinary: ${image.url}`);
        updatedImages.push(image);
        stats.imagesProcessed++;
        continue;
      }

      // Try to find local file
      const localPath = path.join(LOCAL_UPLOADS_DIR, path.basename(image.url));
      
      if (!fs.existsSync(localPath)) {
        console.warn(`  ⚠ Local file not found: ${localPath}`);
        stats.imagesFailed++;
        stats.errors.push({
          material: material.materialName,
          originalUrl: image.url,
          error: 'File not found',
        });
        // Keep original URL if file not found
        updatedImages.push(image);
        continue;
      }

      // Read file
      console.log(`  → Uploading: ${path.basename(localPath)}`);
      const buffer = fs.readFileSync(localPath);

      // Upload to Cloudinary
      const cloudinaryImage = await uploadImage(buffer, path.basename(localPath));

      // Update image with new Cloudinary URL
      updatedImages.push({
        url: cloudinaryImage.url,
        isPrimary: image.isPrimary,
        cloudinaryPublicId: cloudinaryImage.publicId,
      });

      stats.imagesMigrated++;
      console.log(`  ✅ Migrated: ${cloudinaryImage.url}`);
    } catch (error) {
      console.error(`  ❌ Failed to migrate image:`, error.message);
      stats.imagesFailed++;
      stats.errors.push({
        material: material.materialName,
        originalUrl: image.url,
        error: error.message,
      });
      // Keep original image if upload fails
      updatedImages.push(image);
    }

    stats.imagesProcessed++;
  }

  // Update material dengan image URLs baru
  if (updatedImages.length > 0) {
    material.images = updatedImages;
    await material.save();
    console.log(`  💾 Material saved with ${updatedImages.length} images`);
  }
  
  stats.materialsProcessed++;
}

/**
 * Main migration function
 */
async function migrate() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║  Material Management - Image Migration to Cloudinary       ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  try {
    // Validate Cloudinary config
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      throw new Error('Missing Cloudinary credentials in .env file');
    }

    console.log('📋 Configuration:');
    console.log(`  MongoDB: ${MONGODB_URI}`);
    console.log(`  Cloudinary Cloud: ${process.env.CLOUDINARY_CLOUD_NAME}`);
    console.log(`  Local uploads dir: ${LOCAL_UPLOADS_DIR}\n`);

    // Connect to MongoDB
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ MongoDB connected\n');

    // Fetch all materials
    console.log('📊 Fetching materials from database...');
    const materials = await Material.find({});
    console.log(`Found ${materials.length} materials\n`);

    if (materials.length === 0) {
      console.log('No materials to migrate. Exiting.');
      process.exit(0);
    }

    // Migrate each material's images
    for (const material of materials) {
      await migrateMaterialImages(material);
    }

    // Print summary
    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║  Migration Summary                                         ║');
    console.log('╚════════════════════════════════════════════════════════════╝');
    console.log(`\n📊 Statistics:`);
    console.log(`  Materials processed: ${stats.materialsProcessed}`);
    console.log(`  Images processed: ${stats.imagesProcessed}`);
    console.log(`  Images migrated: ${stats.imagesMigrated}`);
    console.log(`  Images failed: ${stats.imagesFailed}`);

    if (stats.errors.length > 0) {
      console.log(`\n⚠️  Errors encountered:\n`);
      stats.errors.forEach((error, index) => {
        console.log(`${index + 1}. ${error.material}`);
        console.log(`   Original URL: ${error.originalUrl}`);
        console.log(`   Error: ${error.error}\n`);
      });
    }

    if (stats.imagesFailed === 0) {
      console.log('\n✅ Migration completed successfully!');
    } else {
      console.log(`\n⚠️  Migration completed with ${stats.imagesFailed} failed images.`);
      console.log('   Check local files and retry if needed.');
    }

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    console.log('\nTroubleshooting:');
    console.log('  1. Check your Cloudinary credentials in .env');
    console.log('  2. Verify MongoDB connection string');
    console.log('  3. Ensure local images exist in:', LOCAL_UPLOADS_DIR);
    console.log('  4. Check your internet connection');
    process.exit(1);
  } finally {
    // Disconnect from MongoDB
    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
      console.log('\n🔌 MongoDB disconnected');
    }
  }
}

// Run migration
migrate();
