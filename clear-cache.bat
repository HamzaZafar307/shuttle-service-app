@echo off
echo Clearing Metro Bundler cache...
echo.

REM Remove Metro cache directories
if exist node_modules\.cache (
  echo Removing node_modules\.cache...
  rmdir /s /q node_modules\.cache
)

if exist node_modules\metro-cache (
  echo Removing node_modules\metro-cache...
  rmdir /s /q node_modules\metro-cache
)

if exist .expo (
  echo Removing .expo cache...
  rmdir /s /q .expo
)

echo.
echo Cache cleared successfully!
echo.
echo Starting Expo with clean cache...
echo.

REM Start Expo with clean cache
call npx expo start --clear

echo.
echo If you still encounter issues, try:
echo 1. Delete the node_modules folder and run 'npm install'
echo 2. Run 'npm start -- --reset-cache'
echo.

pause
