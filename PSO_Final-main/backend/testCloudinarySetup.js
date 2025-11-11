/**
 * Test Script - Verify Cloudinary Configuration
 * 
 * Usage:
 *   node testCloudinarySetup.js
 */

require('dotenv').config();
const cloudinary = require('cloudinary').v2;

console.log('╔════════════════════════════════════════════════════════════╗');
console.log('║  Cloudinary Configuration Test                            ║');
console.log('╚════════════════════════════════════════════════════════════╝\n');

// Check environment variables
console.log('📋 Environment Variables Check:\n');

const requiredVars = [
  'CLOUDINARY_CLOUD_NAME',
  'CLOUDINARY_API_KEY',
  'CLOUDINARY_API_SECRET'
];

let allConfigured = true;

requiredVars.forEach(varName => {
  const value = process.env[varName];
  const status = value ? '✅' : '❌';
  const display = value ? value.substring(0, 10) + '...' : 'NOT SET';
  console.log(`${status} ${varName}: ${display}`);
  if (!value) allConfigured = false;
});

console.log('\n');

if (!allConfigured) {
  console.log('❌ CONFIGURATION ERROR:\n');
  console.log('Missing Cloudinary credentials in .env file!\n');
  console.log('Steps to fix:');
  console.log('1. Create a .env file in the backend folder');
  console.log('2. Copy content from .env.example');
  console.log('3. Fill in your Cloudinary credentials:');
  console.log('   - CLOUDINARY_CLOUD_NAME (from https://console.cloudinary.com)');
  console.log('   - CLOUDINARY_API_KEY (from https://console.cloudinary.com/settings/api)');
  console.log('   - CLOUDINARY_API_SECRET (from https://console.cloudinary.com/settings/api)');
  console.log('\n4. Run this test again to verify\n');
  process.exit(1);
}

// Test Cloudinary connection
console.log('🔌 Testing Cloudinary Connection...\n');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Test API authentication
cloudinary.api.resources({ type: 'upload', max_results: 1 }, (error, result) => {
  if (error) {
    console.log('❌ Cloudinary Connection Failed:\n');
    console.log('Error:', error.message);
    console.log('\nTroubleshooting:');
    console.log('1. Verify your credentials are correct');
    console.log('2. Check your internet connection');
    console.log('3. Visit https://cloudinary.com/console to verify your account');
    console.log('4. If credentials are correct, wait a moment and try again\n');
    process.exit(1);
  } else {
    console.log('✅ Cloudinary Connection Successful!\n');
    console.log('📊 Account Information:');
    console.log(`   Cloud Name: ${process.env.CLOUDINARY_CLOUD_NAME}`);
    console.log(`   Total Resources: ${result.total_count || 0}\n`);
    
    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║  ✅ All Checks Passed! Ready to upload images             ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');
    
    console.log('You can now:');
    console.log('1. Start the backend: npm start (or node server.js)');
    console.log('2. Start the frontend: npm start');
    console.log('3. Login and test image uploads in Materials form\n');
    
    process.exit(0);
  }
});
