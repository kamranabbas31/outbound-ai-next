#!/usr/bin/env node

/**
 * Script to generate a larger favicon.ico file
 * 
 * Prerequisites:
 * - Install ImageMagick: https://imagemagick.org/script/download.php
 * - Or use online tools like favicon.io
 * 
 * Usage:
 * 1. Place your source image (PNG/JPG) in the public/ directory
 * 2. Run: node scripts/generate-favicon.js
 * 3. The script will generate favicon.ico with multiple sizes
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const sourceImage = 'public/source-favicon.png'; // Change this to your source image
const outputFavicon = 'public/favicon.ico';

console.log('🎨 Generating larger favicon...');

// Check if source image exists
if (!fs.existsSync(sourceImage)) {
  console.log(`❌ Source image not found: ${sourceImage}`);
  console.log('📝 Please place your source image in the public/ directory and update the sourceImage variable');
  process.exit(1);
}

try {
  // Generate favicon.ico with multiple sizes using ImageMagick
  const command = `magick convert "${sourceImage}" -define icon:auto-resize=16,32,48,64,128,256 "${outputFavicon}"`;
  
  console.log('🔧 Running ImageMagick command...');
  execSync(command, { stdio: 'inherit' });
  
  console.log(`✅ Favicon generated successfully: ${outputFavicon}`);
  console.log('📱 The favicon now includes multiple sizes: 16x16, 32x32, 48x48, 64x64, 128x128, 256x256');
  
} catch (error) {
  console.log('❌ Error generating favicon.ico');
  console.log('💡 Alternative solutions:');
  console.log('   1. Install ImageMagick: https://imagemagick.org/script/download.php');
  console.log('   2. Use online tools like favicon.io or realfavicongenerator.net');
  console.log('   3. Use the SVG favicon approach (already implemented)');
}
