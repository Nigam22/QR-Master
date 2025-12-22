import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function optimizeImages() {
  console.log('Optimizing images using ImageMagick...');
  
  try {
    // Optimize main app icon
    console.log('Optimizing app-icon.jpg...');
    await execAsync('magick public/app-icon.jpg -resize 192x192 -quality 80 public/app-icon-temp.jpg && mv public/app-icon-temp.jpg public/app-icon.jpg');
    
    // Optimize icons
    const icons = ['icon-48*48.jpg', 'icon-192*192.jpg', 'icon-512*512.jpg'];
    for (const icon of icons) {
      console.log(`Optimizing ${icon}...`);
      // Extract target size from filename
      const match = icon.match(/(\d+)x?(\d+)/i);
      if (match) {
        const size = Math.min(parseInt(match[1]), 512);
        await execAsync(`magick "public/icons/${icon}" -resize ${size}x${size} -quality 80 "public/icons/temp-${icon}" && mv "public/icons/temp-${icon}" "public/icons/${icon}"`);
      }
    }
    
    console.log('Image optimization complete!');
  } catch (error) {
    console.log('Error occurred during image optimization:', error.message);
    console.log('Proceeding with build without image optimization.');
  }
}

optimizeImages().catch(console.error);