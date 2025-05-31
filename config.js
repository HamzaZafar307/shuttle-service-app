/**
 * Application Configuration
 * 
 * This file contains configuration settings for the vehicle tracking application.
 */

import { Platform } from 'react-native';

// Socket.io configuration
export const SOCKET_CONFIG = {
  // Use IP address instead of localhost for mobile devices
  // For Android emulator, use 10.0.2.2 to access host machine
  // For iOS simulator, use localhost
  // For physical devices, use your computer's IP address on the network
  SERVER_URL: Platform.select({
    web: 'http://192.168.18.74:3001',
    android: 'http://192.168.18.74:3001', // Using current IP address
    ios: 'http://192.168.18.74:3001',     // Using current IP address
    default: 'http://192.168.18.74:3001'  // Fallback for any other platform
  }),
  OPTIONS: {
    reconnectionDelayMax: 10000,
    autoConnect: true,
    transports: ['websocket']
  }
};

// Map configuration
export const MAP_CONFIG = {
  // Default map region (Mobily C11, Riyadh)
  DEFAULT_REGION: {
    latitude: 24.710616,
    longitude: 46.6855285,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  },
  // Map display options
  OPTIONS: {
    showsUserLocation: true,
    showsMyLocationButton: true,
    showsCompass: true,
    zoomEnabled: true,
    rotateEnabled: true,
  }
};

// Google Maps API key - replace with your actual API key if needed
// For production, this should be stored in environment variables
export const GOOGLE_MAPS_API_KEY = 'AIzaSyAZwVRCmrkePL3HhXwNEMBkbyRFHO1BDHY';

// Feature flags
export const FEATURES = {
  // Use real data from the WebSocket server
  // Set to true to use mock data instead of real data from the server
  USE_MOCK_DATA: false,  // Changed to false to use real socket server
  // Enable route simulation for vehicles
  ENABLE_ROUTE_SIMULATION: true,
  // Update interval for vehicle movement simulation (in milliseconds)
  SIMULATION_UPDATE_INTERVAL: 30, // Faster update interval for smoother animation
};

// Bus routes data
export const BUS_ROUTES = [
  {
    id: 'route-1',
    name: 'Bus #1',
    startPoint: 'Al Urubah Station',
    endPoint: 'Olaya buildings',
    startCoordinates: {
      latitude: 24.715722,
      longitude: 46.672611
    },
    endCoordinates: {
      latitude: 24.711389, // Approximate coordinates for Al Wurud, Exit 17
      longitude: 46.674444
    },
    stops: 8,
    color: '#2ecc71' // Green
  },
  {
    id: 'route-2',
    name: 'Bus #2',
    startPoint: 'Al Urubah Station',
    endPoint: 'Sulimaniyah buildings',
    startCoordinates: {
      latitude: 24.7175, // PM7G+93 Al Wurud, Riyadh Saudi Arabia
      longitude: 46.6726
    },
    endCoordinates: {
      latitude: 24.7244, // PP72+44 As Sulimaniyah, Riyadh Saudi Arabia
      longitude: 46.6872
    },
    stops: 5,
    color: '#3498db' // Blue
  },
  {
    id: 'route-3',
    name: 'Bus #3',
    startPoint: 'Sulimaniyah Station',
    endPoint: 'Sulimaniyah Buildings',
    startCoordinates: {
      latitude: 24.7244, // PP72+44 As Sulimaniyah, Riyadh Saudi Arabia
      longitude: 46.6872
    },
    endCoordinates: {
      latitude: 24.7165, // PM6P+65M, Al Muhandis Masaid Al Anqari, As Sulimaniyah, Riyadh 12245, Saudi Arabia
      longitude: 46.6765
    },
    stops: 7,
    color: '#e74c3c' // Red
  },
  {
    id: 'route-4',
    name: 'Bus #4',
    startPoint: 'Kingdom Tower parking (Basement 2)',
    endPoint: 'Olaya buildings',
    startCoordinates: {
      latitude: 24.7165, // PM6P+65M, Al Muhandis Masaid Al Anqari, As Sulimaniyah, Riyadh 12245, Saudi Arabia
      longitude: 46.6765
    },
    endCoordinates: {
      latitude: 24.7155, // PM5F+VX Al Olaya, Riyadh Saudi Arabia
      longitude: 46.6705
    },
    stops: 6,
    color: '#9b59b6' // Purple
  },
  {
    id: 'route-5',
    name: 'Bus #5',
    startPoint: 'Olaya buildings',
    endPoint: 'Sulimaniyah Buildings',
    startCoordinates: {
      latitude: 24.7155, // PM5F+VX Al Olaya, Riyadh Saudi Arabia
      longitude: 46.6705
    },
    endCoordinates: {
      latitude: 24.7244, // PP72+44 As Sulimaniyah, Riyadh Saudi Arabia
      longitude: 46.6872
    },
    stops: 9,
    color: '#f39c12' // Orange
  }
];
