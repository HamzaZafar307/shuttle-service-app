#!/bin/bash
echo "Starting Vehicle Tracker App on Web Platform..."
echo
echo "This script will run the app on the web platform, which doesn't require Android SDK setup."
echo "IMPORTANT: The app is now configured to use the real socket server."
echo "Please make sure to run the server first using run-server.sh before starting the web app."
echo
echo "Press any key to continue..."
read -n 1 -s

echo
echo "Clearing cache..."
npm run clear-cache

echo
echo "Starting web server..."
expo start --web
