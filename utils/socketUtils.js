/**
 * Socket Utilities
 * Provides functions for socket.io connection and communication
 */

import { io } from 'socket.io-client';
import { SOCKET_CONFIG, FEATURES } from '../config';
import { generateVehicleRoute } from '../services/mapService';
import { calculateBearing } from './locationUtils';

// Socket.io server URLs from configuration
const SOCKET_SERVER_URL = SOCKET_CONFIG.SERVER_URL;

// Fallback URLs to try if the main URL fails
// This is useful for development when testing on different devices
const FALLBACK_URLS = [
  'http://localhost:3001',
  'http://127.0.0.1:3001',       // Another localhost alternative
  'http://10.0.2.2:3001',        // Android emulator special IP
  'http://192.168.225.230:3001', // Current IP address
  'http://192.168.225.1:3001',   // Possible gateway IP
  'http://192.168.1.103:3001',   // Previous IP address
  'http://192.168.0.103:3001'    // Common home network IP pattern
];

// Socket instance that will be reused
let socketInstance = null;
let connectionAttempts = 0;

// Store for simulated vehicles and their routes
let simulatedVehicles = [];
let simulationInterval = null;

/**
 * Connect to the socket.io server
 * Creates a singleton socket instance
 * 
 * @param {Object} options - Connection options
 * @returns {Object} Socket.io client instance
 */
export const connectToSocket = (options = {}) => {
  // If we already have a socket instance and it's connected, return it
  if (socketInstance && socketInstance.connected) {
    connectionAttempts = 0; // Reset connection attempts on successful connection
    return socketInstance;
  }
  
  // If we have a disconnected instance, reconnect it
  if (socketInstance) {
    socketInstance.connect();
    return socketInstance;
  }
  
  // Determine which URL to use based on connection attempts
  let serverUrl = SOCKET_SERVER_URL;
  
  // If we've already tried the main URL, try a fallback
  if (connectionAttempts > 0 && connectionAttempts <= FALLBACK_URLS.length) {
    serverUrl = FALLBACK_URLS[connectionAttempts - 1];
    console.log(`Trying fallback URL: ${serverUrl}`);
  }
  
  // Create a new socket instance with options from config
  socketInstance = io(serverUrl, {
    ...SOCKET_CONFIG.OPTIONS,
    ...options // Allow overriding config options
  });
  
  // Set up default error handling with fallback logic
  socketInstance.on('connect_error', (error) => {
    console.error(`Socket connection error (${serverUrl}):`, error);
    
    // Increment connection attempts
    connectionAttempts++;
    
    // If we have more fallbacks to try
    if (connectionAttempts <= FALLBACK_URLS.length) {
      console.log(`Connection failed. Trying fallback URL #${connectionAttempts}`);
      
      // Disconnect the current socket
      socketInstance.disconnect();
      socketInstance = null;
      
      // Try connecting with the next fallback URL
      setTimeout(() => {
        connectToSocket(options);
      }, 1000); // Wait 1 second before trying the next URL
    } else {
      console.warn('All connection attempts failed. Using mock data instead.');
      // Reset connection attempts for next time
      connectionAttempts = 0;
    }
  });
  
  // Reset connection attempts when successfully connected
  socketInstance.on('connect', () => {
    console.log(`Successfully connected to ${serverUrl}`);
    connectionAttempts = 0;
  });
  
  return socketInstance;
};

/**
 * Disconnect from the socket.io server
 */
export const disconnectSocket = () => {
  if (socketInstance) {
    socketInstance.disconnect();
  }
  
  // Stop any ongoing simulation
  stopVehicleSimulation();
};

/**
 * Send user location to the server
 * 
 * @param {Object} location - User's location {latitude, longitude}
 */
export const sendUserLocation = (location) => {
  if (!socketInstance || !socketInstance.connected) {
    console.warn('Socket not connected. Cannot send location.');
    return;
  }
  
  socketInstance.emit('userLocation', location);
};

/**
 * Subscribe to vehicle updates
 * 
 * @param {Function} callback - Function to call when updates are received
 * @returns {Function} Unsubscribe function
 */
export const subscribeToVehicleUpdates = (callback) => {
  if (!socketInstance) {
    console.warn('Socket not initialized. Cannot subscribe to updates.');
    
    // Generate mock data if socket is not initialized
    if (callback && FEATURES.USE_MOCK_DATA) {
      console.log('Generating mock vehicles for subscription');
      
      // Get user location from the mock socket emit if available
      const mockUserLocation = {
        latitude: 24.710616, // Using Riyadh coordinates from config
        longitude: 46.6855285
      };
      
      // Generate mock vehicles
      const mockVehicles = generateMockVehicles(mockUserLocation);
      
      // Call the callback with mock data
      setTimeout(() => {
        console.log('Sending initial mock vehicles:', mockVehicles.length);
        callback(mockVehicles);
      }, 500);
      
      // Start simulation for continuous updates
      startVehicleSimulation(mockVehicles, mockUserLocation, (updatedVehicles) => {
        console.log('Sending updated mock vehicles:', updatedVehicles.length);
        callback(updatedVehicles);
      });
    }
    
    return () => {
      // Stop simulation when unsubscribing
      stopVehicleSimulation();
    };
  }
  
  // Listen for vehicle updates
  socketInstance.on('vehicleUpdates', callback);
  
  // Return unsubscribe function
  return () => {
    socketInstance.off('vehicleUpdates', callback);
  };
};

/**
 * Subscribe to connection status changes
 * 
 * @param {Function} callback - Function to call when connection status changes
 * @returns {Function} Unsubscribe function
 */
export const subscribeToConnectionStatus = (callback) => {
  if (!socketInstance) {
    console.warn('Socket not initialized. Cannot subscribe to status.');
    
    // If socket is not initialized but callback is provided, 
    // simulate a connected status after a short delay
    if (callback) {
      setTimeout(() => {
        callback('connected');
      }, 500);
    }
    
    return () => {};
  }
  
  // Define handler functions
  const handleConnect = () => callback('connected');
  const handleDisconnect = () => callback('disconnected');
  const handleError = () => callback('error');
  
  // Set up listeners
  socketInstance.on('connect', handleConnect);
  socketInstance.on('disconnect', handleDisconnect);
  socketInstance.on('connect_error', handleError);
  
  // Return unsubscribe function
  return () => {
    socketInstance.off('connect', handleConnect);
    socketInstance.off('disconnect', handleDisconnect);
    socketInstance.off('connect_error', handleError);
  };
};

/**
 * Get current connection status
 * 
 * @returns {string} Connection status: 'connected', 'disconnected', or 'not_initialized'
 */
export const getConnectionStatus = () => {
  if (!socketInstance) return 'not_initialized';
  return socketInstance.connected ? 'connected' : 'disconnected';
};

/**
 * Start vehicle movement simulation
 * 
 * @param {Array} vehicles - Array of vehicle objects
 * @param {Object} userLocation - User's location
 * @param {Function} updateCallback - Callback to update vehicle positions
 */
export const startVehicleSimulation = (vehicles, userLocation, updateCallback) => {
  // Stop any existing simulation
  stopVehicleSimulation();
  
  // Initialize simulated vehicles with fixed routes
  const initializeVehicles = async () => {
    const vehiclePromises = vehicles.map(async (vehicle) => {
      try {
        // Generate a fixed route for this vehicle
        const routeInfo = await generateVehicleRoute(vehicle, userLocation);
        
        // Store the original location to restore it when the vehicle completes the route
        const originalLocation = { ...vehicle.location };
        
        return {
          ...vehicle,
          routeInfo: routeInfo,
          currentRouteIndex: 0,
          originalLocation: originalLocation,
          // Speed in coordinates per second (adjusted for simulation)
          speed: (vehicle.speed || 30) / 3600 * 0.0001 * 20, // Adjusted for smoother movement
          // Store the fixed route to ensure it doesn't change
          fixedRoute: routeInfo.route ? [...routeInfo.route.coordinates] : null
        };
      } catch (error) {
        console.error(`Error generating route for vehicle ${vehicle.id}:`, error);
        // Return vehicle without route in case of error
        return {
          ...vehicle,
          routeInfo: { route: null, busStop: null },
          currentRouteIndex: 0,
          originalLocation: { ...vehicle.location },
          speed: (vehicle.speed || 30) / 3600 * 0.0001 * 20, // Adjusted for smoother movement
          fixedRoute: null
        };
      }
    });
    
    // Wait for all route generation to complete
    simulatedVehicles = await Promise.all(vehiclePromises);
    
    // Start the simulation interval
    startSimulationInterval(updateCallback);
  };
  
  // Start the initialization process
  initializeVehicles();
};

/**
 * Start the simulation interval for vehicle movement
 * 
 * @param {Function} updateCallback - Callback to update vehicle positions
 */
const startSimulationInterval = (updateCallback) => {
  console.log('Starting simulation interval with', simulatedVehicles.length, 'vehicles');
  
  // Update vehicle positions more frequently for smoother animation
  simulationInterval = setInterval(() => {
    // Update each vehicle's position along its fixed route
    const updatedVehicles = simulatedVehicles.map(vehicle => {
      // If vehicle has a fixed route
      if (vehicle.fixedRoute && vehicle.fixedRoute.length > 1) {
        const route = vehicle.fixedRoute;
        
        // If vehicle has reached the end of the route, reset to beginning
        if (vehicle.currentRouteIndex >= route.length - 1) {
          vehicle.currentRouteIndex = 0;
          // Reset location to original starting point
          vehicle.location = { ...vehicle.originalLocation };
          return {
            ...vehicle,
            location: { ...vehicle.originalLocation },
            heading: 0,
            lastUpdated: new Date().toISOString()
          };
        }
        
        // Get current and next points on the route
        const currentPoint = route[vehicle.currentRouteIndex];
        const nextPoint = route[vehicle.currentRouteIndex + 1];
        
        // Calculate bearing (direction) between points
        const bearing = calculateBearing(currentPoint, nextPoint);
        
        // Use progress-based interpolation for smoother movement
        // Increment progress extremely slightly for super smooth movement
        vehicle.progress += 0.0005; // Extremely small increment for ultra-smooth movement
        
        // If progress reaches or exceeds 1, move to the next point
        if (vehicle.progress >= 1) {
          // Reset progress
          vehicle.progress = 0;
          // Move to next point on route
          vehicle.currentRouteIndex++;
          
          // Log point transition
          console.log(`Vehicle ${vehicle.id} reached waypoint ${vehicle.currentRouteIndex}`);
        }
        
        // Interpolate between current and next point based on progress
        const newLocation = {
          latitude: currentPoint.latitude + (nextPoint.latitude - currentPoint.latitude) * vehicle.progress,
          longitude: currentPoint.longitude + (nextPoint.longitude - currentPoint.longitude) * vehicle.progress
        };
        
        // Log vehicle movement for debugging
        console.log(`Vehicle ${vehicle.id} moved:`, {
          from: {
            lat: currentPoint.latitude.toFixed(6),
            lng: currentPoint.longitude.toFixed(6)
          },
          heading: bearing,
          routeIndex: vehicle.currentRouteIndex,
          routeLength: route.length,
          to: {
            lat: nextPoint.latitude.toFixed(6),
            lng: nextPoint.longitude.toFixed(6)
          }
        });
        
        // Update vehicle with new location and bearing
        return {
          ...vehicle,
          location: newLocation,
          heading: bearing,
          lastUpdated: new Date().toISOString()
        };
      }
      
      return vehicle;
    });
    
    // Update the simulatedVehicles array with the new positions
    simulatedVehicles = updatedVehicles;
    
    // Call the update callback with the updated vehicles
    if (updateCallback) {
      updateCallback(updatedVehicles);
    }
  }, 30); // Set to 30ms for optimal balance between smoothness and performance
};

/**
 * Stop vehicle movement simulation
 */
export const stopVehicleSimulation = () => {
  if (simulationInterval) {
    clearInterval(simulationInterval);
    simulationInterval = null;
  }
  simulatedVehicles = [];
};

/**
 * Move a point towards another point by a certain amount
 * 
 * @param {Object} start - Starting coordinate {latitude, longitude}
 * @param {Object} end - Ending coordinate {latitude, longitude}
 * @param {number} amount - Amount to move (in coordinate units)
 * @returns {Object} New coordinate {latitude, longitude}
 */
const moveTowardsPoint = (start, end, amount) => {
  // Calculate direction vector
  const dx = end.longitude - start.longitude;
  const dy = end.latitude - start.latitude;
  
  // Calculate distance
  const distance = Math.sqrt(dx * dx + dy * dy);
  
  // If already at destination, return end point
  if (distance < 0.0000001) {
    return { ...end };
  }
  
  // Calculate normalized direction
  const nx = dx / distance;
  const ny = dy / distance;
  
  // Calculate movement amount (don't overshoot)
  const moveAmount = Math.min(amount, distance);
  
  // Calculate new position
  return {
    latitude: start.latitude + ny * moveAmount,
    longitude: start.longitude + nx * moveAmount
  };
};

/**
 * Calculate distance between two coordinates
 * 
 * @param {Object} coord1 - First coordinate {latitude, longitude}
 * @param {Object} coord2 - Second coordinate {latitude, longitude}
 * @returns {number} Distance in coordinate units
 */
const calculateDistanceBetweenCoords = (coord1, coord2) => {
  const dx = coord2.longitude - coord1.longitude;
  const dy = coord2.latitude - coord1.latitude;
  return Math.sqrt(dx * dx + dy * dy);
};

// For development/testing: mock socket functionality
export const createMockSocket = () => {
  // Create a mock socket for testing without a real server
  const mockListeners = {};
  
  const mockSocket = {
    connected: true,
    
    on: (event, callback) => {
      if (!mockListeners[event]) {
        mockListeners[event] = [];
      }
      mockListeners[event].push(callback);
    },
    
    off: (event, callback) => {
      if (mockListeners[event]) {
        mockListeners[event] = mockListeners[event].filter(cb => cb !== callback);
      }
    },
    
    emit: (event, data) => {
      console.log(`Mock socket emitted ${event}:`, data);
      
      // For testing: if emitting 'userLocation', trigger a mock 'vehicleUpdates' response
      if (event === 'userLocation' && mockListeners['vehicleUpdates']) {
        // Generate mock vehicle data
        const mockVehicles = generateMockVehicles(data);
        
        // Start vehicle simulation
        startVehicleSimulation(mockVehicles, data, (updatedVehicles) => {
          // Call all vehicleUpdates listeners with updated vehicles
          if (mockListeners['vehicleUpdates']) {
            mockListeners['vehicleUpdates'].forEach(callback => {
              callback(updatedVehicles);
            });
          }
        });
        
        // Initial call with mock vehicles (reduced delay for faster initial display)
        mockListeners['vehicleUpdates'].forEach(callback => {
          setTimeout(() => callback(mockVehicles), 100);
        });
      }
    },
    
    connect: () => {
      mockSocket.connected = true;
      if (mockListeners['connect']) {
        mockListeners['connect'].forEach(callback => callback());
      }
    },
    
    disconnect: () => {
      mockSocket.connected = false;
      // Stop vehicle simulation
      stopVehicleSimulation();
      if (mockListeners['disconnect']) {
        mockListeners['disconnect'].forEach(callback => callback());
      }
    }
  };
  
  return mockSocket;
};

/**
 * Generate mock vehicles around a given location
 * Used for testing without a real server
 * 
 * @param {Object} centerLocation - Center location {latitude, longitude}
 * @returns {Array} Array of mock vehicle objects
 */
const generateMockVehicles = (centerLocation) => {
  if (!centerLocation) {
    console.warn('No center location provided for mock vehicles');
    // Default to the map's default region from config
    centerLocation = {
      latitude: 24.710616,
      longitude: 46.6855285
    };
  }
  
  // Import BUS_ROUTES from config to ensure we use the correct route IDs
  const { BUS_ROUTES } = require('../config');
  
  const vehicles = [];
  // Use exactly 5 vehicles to match our 5 predefined routes
  const numVehicles = 5;
  
  for (let i = 0; i < numVehicles; i++) {
    // Get the route data from our config
    const routeData = BUS_ROUTES[i];
    
    // Generate a location near the route's start coordinates
    const location = {
      latitude: routeData.startCoordinates.latitude + (Math.random() - 0.5) * 0.005,
      longitude: routeData.startCoordinates.longitude + (Math.random() - 0.5) * 0.005
    };
    
    vehicles.push({
      id: `vehicle-${i}`,
      name: `Bus ${i + 1}`,
      type: 'bus',
      route: routeData.name,
      routeId: routeData.id,
      startPoint: routeData.startPoint,
      endPoint: routeData.endPoint,
      stops: routeData.stops,
      speed: 20 + Math.floor(Math.random() * 40), // 20-60 km/h
      heading: Math.floor(Math.random() * 360),
      location: location,
      lastUpdated: new Date().toISOString()
    });
  }
  
  console.log(`Generated ${vehicles.length} mock vehicles with proper route IDs`);
  return vehicles;
};

// For development: use mock socket instead of real one
// This is controlled by FEATURES.USE_MOCK_DATA in config.js

// Initialize with mock socket if USE_MOCK_DATA is true
if (FEATURES.USE_MOCK_DATA) {
  console.log('Using mock socket for development');
  socketInstance = createMockSocket();
  
  // Immediately trigger a mock connection
  setTimeout(() => {
    if (socketInstance && typeof socketInstance.connect === 'function') {
      socketInstance.connect();
    }
  }, 500);
}

// Export the mock vehicle generator and other functions
export { 
  generateMockVehicles
};
