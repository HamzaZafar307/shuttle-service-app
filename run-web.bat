@echo off
echo Starting Vehicle Tracker App on Web Platform...
echo.
echo This script will run the app on the web platform, which doesn't require Android SDK setup.
echo IMPORTANT: The app is now configured to use the real socket server.
echo Please make sure to run the server first using run-server.bat before starting the web app.
echo.
echo Press any key to continue...
pause > nul

echo.
echo Clearing cache...
call npm run clear-cache

echo.
echo Starting web server...
call expo start --web
