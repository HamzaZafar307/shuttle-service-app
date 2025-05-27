# Vehicle Tracker App

A cross-platform React Native application for tracking vehicles in real-time. This app works on iOS, Android, and Web platforms.

## Features

- Real-time vehicle tracking
- Cross-platform compatibility (iOS, Android, Web)
- Interactive map interface
- Vehicle details and information
- Connection status indicators
- Mock data support for development

## Setup and Configuration

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)
- For mobile development: Expo Go app on your device or emulator

### Installation

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
   or
   ```
   yarn install
   ```

### Configuration

The app uses a central configuration file (`config.js`) to manage environment-specific settings. Before running the app, you need to update this file with your specific configuration:

1. Open `config.js` in the root directory
2. Update the `DEV_MACHINE_IP` with your development machine's IP address:

```javascript
// Replace this with your computer's IP address (e.g., '192.168.1.100')
export const DEV_MACHINE_IP = '192.168.1.100'; // REPLACE THIS WITH YOUR ACTUAL IP
```

#### Finding Your IP Address

- **Windows**: Run `ipconfig` in Command Prompt and look for the IPv4 Address
- **macOS/Linux**: Run `ifconfig` in Terminal and look for the inet address
- **Alternative**: Visit [whatismyipaddress.com](https://whatismyipaddress.com/) on your development machine

### Running the WebSocket Server

The app now uses a WebSocket server to provide real-time vehicle location updates. You need to start this server before running the app:

**Using the provided scripts:**
- Windows: Double-click `run-server.bat` or run it from the command line
- macOS/Linux: Run `./run-server.sh` (you may need to make it executable first with `chmod +x run-server.sh`)

**Or manually:**
```
node server.js
```

The server will start on port 3001 and provide real-time vehicle location updates to connected clients.

### Running the App

#### Web (Recommended)

The easiest way to run the app is on the web platform, which doesn't require any mobile development environment setup:

**Using the provided scripts:**
- Windows: Double-click `run-web.bat` or run it from the command line
- macOS/Linux: Run `./run-web.sh` (you may need to make it executable first with `chmod +x run-web.sh`)

**Or manually:**
```
npm run web
```
or
```
expo start --web
```

**Important:** Make sure the WebSocket server is running before starting the app.

#### iOS

```
npm run ios
```
or
```
expo start --ios
```

#### Android

```
npm run android
```
or
```
expo start --android
```

**Note:** Running on Android requires Android SDK setup. If you encounter Android environment issues, use the web version instead.

## Troubleshooting

### Android Development Environment Issues

If you encounter Android development environment issues (like SDK path not found or ADB not recognized), you can use the app's mock data feature instead of setting up the full Android development environment.

**Using Mock Data:**

The app is now configured to always use mock data, which means:
1. You don't need a real socket server running
2. The app will generate random vehicle data around your location
3. All features will work without any external dependencies

**Recommended Approach:**
- Run the app on the web platform using `npm run web` or `expo start --web`
- This avoids Android-specific setup issues while still allowing you to test the app

### "localhost refused to connect" Error on Android

If you still want to run on Android and encounter a "localhost refused to connect" error, this happens because the Android device is trying to connect to its own localhost instead of your development machine.

**Solution:**

1. Make sure you've updated the `DEV_MACHINE_IP` in `config.js` with your actual development machine's IP address
2. Ensure your Android device and development machine are on the same network
3. Check if any firewall settings are blocking the connection
4. Verify that the socket server is running on your development machine

### Clearing Cache

If you encounter any issues with the app, try clearing the cache:

```
npm run clear-cache
```
or manually:
```
expo start --clear
```

## Development

### WebSocket Server vs. Mock Data

The app can operate in two modes:

1. **WebSocket Server Mode (Default)**: The app connects to the WebSocket server to receive real-time vehicle updates.
2. **Mock Data Mode**: The app generates random vehicle data locally without requiring a server.

You can toggle between these modes in the `config.js` file:

```javascript
FEATURES: {
  USE_MOCK_DATA: false, // Set to true to use mock data instead of the WebSocket server
  // ...other features
}
```

When `USE_MOCK_DATA` is set to `false`, the app will attempt to connect to the WebSocket server at the URL specified in `SOCKET_CONFIG.SERVER_URL`. Make sure the server is running before starting the app in this mode.

When `USE_MOCK_DATA` is set to `true`, the app will generate random vehicle data locally and you don't need to run the WebSocket server.

### Project Structure

- `/components` - React components
- `/services` - Service modules for external APIs
- `/utils` - Utility functions
- `/assets` - Static assets like images

## License

[MIT License](LICENSE)
