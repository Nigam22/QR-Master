#!/bin/bash

echo "Optimizing images..."

# Navigate to the project directory
cd /Users/robin/Desktop/qr-master-pro-main

# Optimize the main app icon (resize and compress)
if [ -f "public/app-icon.jpg" ]; then
  echo "Optimizing app-icon.jpg..."
  # Just note the file for now - we'll handle optimization differently
  ls -lah public/app-icon.jpg
fi

# Optimize icons in the icons directory
if [ -d "public/icons" ]; then
  echo "Checking icons directory..."
  ls -lah public/icons/
fi

echo "Image check complete!"