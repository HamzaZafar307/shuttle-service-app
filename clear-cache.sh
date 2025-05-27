#!/bin/bash

echo "Clearing Metro Bundler cache..."
echo

# Remove Metro cache directories
if [ -d "node_modules/.cache" ]; then
  echo "Removing node_modules/.cache..."
  rm -rf node_modules/.cache
fi

if [ -d "node_modules/metro-cache" ]; then
  echo "Removing node_modules/metro-cache..."
  rm -rf node_modules/metro-cache
fi

if [ -d ".expo" ]; then
  echo "Removing .expo cache..."
  rm -rf .expo
fi

echo
echo "Cache cleared successfully!"
echo
echo "Starting Expo with clean cache..."
echo

# Start Expo with clean cache
npx expo start --clear

echo
echo "If you still encounter issues, try:"
echo "1. Delete the node_modules folder and run 'npm install'"
echo "2. Run 'npm start -- --reset-cache'"
echo
