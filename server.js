/**
 * Vehicle Tracking WebSocket Server
 * Provides real-time vehicle location updates via Socket.io
 */

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Import the bus routes from a separate file to match the client configuration
const BUS_ROUTES = [
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
      latitude: 24.711389,
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
      latitude: 24.7175,
      longitude: 46.6726
    },
    endCoordinates: {
      latitude: 24.7244,
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
      latitude: 24.7244,
      longitude: 46.6872
    },
    endCoordinates: {
      latitude: 24.7165,
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
      latitude: 24.7165,
      longitude: 46.6765
    },
    endCoordinates: {
      latitude: 24.7155,
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
      latitude: 24.7155,
      longitude: 46.6705
    },
    endCoordinates: {
      latitude: 24.7244,
      longitude: 46.6872
    },
    stops: 9,
    color: '#f39c12' // Orange
  }
];

// Default map region (Mobily C11, Riyadh)
const DEFAULT_REGION = {
  latitude: 24.710616,
  longitude: 46.6855285,
  latitudeDelta: 0.0922,
  longitudeDelta: 0.0421,
};

// Store vehicles data
let vehicles = [];
// Store vehicle routes and simulation data
let simulatedVehicles = [];
let simulationInterval = null;

/**
 * Generate vehicles based on the predefined bus routes
 * 
 * @param {Object} centerLocation - Center location {latitude, longitude}
 * @param {number} count - Number of vehicles to generate (max 5 for predefined routes)
 * @returns {Array} Array of vehicle objects
 */
function generateVehicles(centerLocation, count = 5) {
  if (!centerLocation) {
    console.warn('No center location provided for vehicles');
    // Default to Mobily C11 location if none provided
    centerLocation = DEFAULT_REGION;
  }
  
  const vehicles = [];
  
  // Limit count to the number of available routes
  const actualCount = Math.min(count, BUS_ROUTES.length);
  
  for (let i = 0; i < actualCount; i++) {
    // Use the predefined route data
    const routeData = BUS_ROUTES[i];
    
    // Use the start coordinates from the route data if available
    let location;
    if (routeData.startCoordinates) {
      // Add a small random offset to avoid all vehicles being at the exact same spot
      location = {
        latitude: routeData.startCoordinates.latitude + (Math.random() - 0.5) * 0.001,
        longitude: routeData.startCoordinates.longitude + (Math.random() - 0.5) * 0.001
      };
    } else {
      // Generate a random location within 3km of the center
      location = {
        latitude: centerLocation.latitude + (Math.random() - 0.5) * 0.03,
        longitude: centerLocation.longitude + (Math.random() - 0.5) * 0.03
      };
    }
    
    vehicles.push({
      id: `vehicle-${i}`,
      name: `Bus ${i+1}`,
      type: 'bus',
      route: routeData.name,
      routeId: routeData.id,
      stops: routeData.stops,
      speed: 20 + Math.floor(Math.random() * 40), // 20-60 km/h
      heading: Math.floor(Math.random() * 360),
      location: location,
      lastUpdated: new Date().toISOString()
    });
  }
  
  return vehicles;
}

/**
 * Calculate distance between two coordinates in kilometers
 * Uses the Haversine formula
 * 
 * @param {Object} coord1 - First coordinate {latitude, longitude}
 * @param {Object} coord2 - Second coordinate {latitude, longitude}
 * @returns {number} Distance in kilometers
 */
function calculateDistance(coord1, coord2) {
  if (!coord1 || !coord2) return 0;
  
  const R = 6371; // Earth's radius in km
  const dLat = toRad(coord2.latitude - coord1.latitude);
  const dLon = toRad(coord2.longitude - coord1.longitude);
  
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(toRad(coord1.latitude)) * Math.cos(toRad(coord2.latitude)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

/**
 * Convert degrees to radians
 * 
 * @param {number} degrees - Value in degrees
 * @returns {number} Value in radians
 */
function toRad(degrees) {
  return degrees * Math.PI / 180;
}

/**
 * Calculate bearing between two coordinates
 * 
 * @param {Object} start - Starting coordinate {latitude, longitude}
 * @param {Object} end - Ending coordinate {latitude, longitude}
 * @returns {number} Bearing in degrees (0-360)
 */
function calculateBearing(start, end) {
  if (!start || !end) return 0;
  
  const startLat = toRad(start.latitude);
  const startLng = toRad(start.longitude);
  const endLat = toRad(end.latitude);
  const endLng = toRad(end.longitude);
  
  const y = Math.sin(endLng - startLng) * Math.cos(endLat);
  const x = Math.cos(startLat) * Math.sin(endLat) -
            Math.sin(startLat) * Math.cos(endLat) * Math.cos(endLng - startLng);
  
  let bearing = Math.atan2(y, x) * 180 / Math.PI;
  bearing = (bearing + 360) % 360; // Normalize to 0-360
  
  return bearing;
}

/**
 * Move a point towards another point by a certain amount
 * 
 * @param {Object} start - Starting coordinate {latitude, longitude}
 * @param {Object} end - Ending coordinate {latitude, longitude}
 * @param {number} amount - Amount to move (in coordinate units)
 * @returns {Object} New coordinate {latitude, longitude}
 */
function moveTowardsPoint(start, end, amount) {
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
  
  // Add a small smoothing factor for smoother movement
  const smoothingFactor = 0.98;
  const smoothedAmount = moveAmount * smoothingFactor;
  
  // Calculate new position
  return {
    latitude: start.latitude + ny * smoothedAmount,
    longitude: start.longitude + nx * smoothedAmount
  };
}

/**
 * Generate a random coordinate within a specified radius of a center point
 * 
 * @param {Object} center - Center coordinate {latitude, longitude}
 * @param {number} radiusKm - Radius in kilometers
 * @returns {Object} Random coordinate {latitude, longitude}
 */
function generateRandomCoordinate(center, radiusKm) {
  const radiusEarth = 6371; // Earth's radius in km
  
  // Convert radius from km to radians
  const radiusRadians = radiusKm / radiusEarth;
  
  // Generate random values
  const u = Math.random();
  const v = Math.random();
  
  // Calculate random point on a sphere
  const w = radiusRadians * Math.sqrt(u);
  const t = 2 * Math.PI * v;
  const x = w * Math.cos(t);
  const y = w * Math.sin(t);
  
  // Adjust for latitude and longitude
  const newLatitude = center.latitude + (y * (180 / Math.PI));
  const newLongitude = center.longitude + (x * (180 / Math.PI) / Math.cos(center.latitude * Math.PI / 180));
  
  return {
    latitude: newLatitude,
    longitude: newLongitude
  };
}

// Import required modules for Google Maps API
const axios = require('axios');

// Google Maps API key - replace with your actual API key if needed
const GOOGLE_MAPS_API_KEY = 'AIzaSyAZwVRCmrkePL3HhXwNEMBkbyRFHO1BDHY';

/**
 * Fetch directions from Google Maps Directions API
 * 
 * @param {Object} origin - Origin coordinate {latitude, longitude}
 * @param {Object} destination - Destination coordinate {latitude, longitude}
 * @returns {Promise<Array>} Array of coordinates representing the route
 */
async function fetchDirections(origin, destination) {
  try {
    // Format coordinates for the API
    const originStr = `${origin.latitude},${origin.longitude}`;
    const destinationStr = `${destination.latitude},${destination.longitude}`;
    
    // Build the API URL
    const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${originStr}&destination=${destinationStr}&key=${GOOGLE_MAPS_API_KEY}`;
    
    console.log('Fetching directions from Google Maps API...');
    
    // Fetch directions from the API
    console.log(`=== GOOGLE MAPS API REQUEST ===`);
    console.log(`Origin: ${originStr}`);
    console.log(`Destination: ${destinationStr}`);
    console.log(`Request timestamp: ${new Date().toISOString()}`);
    
    const response = await axios.get(url);
    const data = response.data;
    
    console.log(`=== GOOGLE MAPS API RESPONSE ===`);
    console.log(`Status code: ${response.status}`);
    console.log(`API status: ${data.status}`);
    console.log(`Response timestamp: ${new Date().toISOString()}`);
    
    // Check if the API returned a valid response
    if (data.status !== 'OK') {
      console.error('Error fetching directions:', data.status);
      return null;
    }
    
    // Extract the route coordinates from the response
    const route = data.routes[0];
    const leg = route.legs[0];
    
    // Decode the polyline to get the coordinates
    const points = decodePolyline(route.overview_polyline.points);
    
    console.log(`Route points: ${points.length}`);
    console.log(`Distance: ${leg.distance.value / 1000} km`);
    console.log(`Duration: ${leg.duration.value / 60} min`);
    console.log(`================================`);
    
    // Convert the points to the format we need
    const coordinates = points.map(point => ({
      latitude: point.lat,
      longitude: point.lng
    }));
    
    // Add distance and duration information
    const routeInfo = {
      coordinates,
      distance: leg.distance.value / 1000, // Convert meters to kilometers
      duration: leg.duration.value / 60, // Convert seconds to minutes
      startName: leg.start_address,
      endName: leg.end_address
    };
    
    return routeInfo;
  } catch (error) {
    console.error('Error fetching directions:', error);
    return null;
  }
}

/**
 * Decode a Google Maps encoded polyline
 * 
 * @param {string} encoded - Encoded polyline string
 * @returns {Array} Array of {lat, lng} objects
 */
function decodePolyline(encoded) {
  const points = [];
  let index = 0, lat = 0, lng = 0;

  while (index < encoded.length) {
    let b, shift = 0, result = 0;
    
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    
    const dlat = ((result & 1) ? ~(result >> 1) : (result >> 1));
    lat += dlat;
    
    shift = 0;
    result = 0;
    
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    
    const dlng = ((result & 1) ? ~(result >> 1) : (result >> 1));
    lng += dlng;
    
    points.push({
      lat: lat / 1e5,
      lng: lng / 1e5
    });
  }
  
  return points;
}

/**
 * Start vehicle movement simulation
 * 
 * @param {Array} vehicles - Array of vehicle objects
 * @param {Object} userLocation - User's location
 * @param {Function} updateCallback - Callback to update vehicle positions
 */
async function startVehicleSimulation(vehicles, userLocation, updateCallback) {
  // Stop any existing simulation
  stopVehicleSimulation();
  
  // Initialize simulated vehicles with fixed routes
  const vehiclePromises = vehicles.map(async (vehicle) => {
    // Find the route data for this vehicle
    const routeData = BUS_ROUTES.find(r => r.id === vehicle.routeId) || BUS_ROUTES[0];
    
    // Use the predefined start and end coordinates from the route data
    let startPoint = vehicle.location; // Default to vehicle's current location
    let endPoint;
    
    if (routeData.startCoordinates && routeData.endCoordinates) {
      // Use the predefined coordinates from the route data
      startPoint = routeData.startCoordinates;
      endPoint = routeData.endCoordinates;
    } else {
      // Fallback to generating a random endpoint
      endPoint = generateRandomCoordinate(userLocation, 3.0);
    }
    
    // Try to fetch directions from Google Maps API
    let routeCoordinates = [];
    try {
      const directionsResult = await fetchDirections(startPoint, endPoint);
      
      if (directionsResult && directionsResult.coordinates && directionsResult.coordinates.length > 0) {
        console.log('Successfully fetched directions from Google Maps API');
        routeCoordinates = directionsResult.coordinates;
      } else {
        console.warn('Failed to fetch directions, falling back to direct line');
        // Fallback to direct line
        routeCoordinates = [
          { ...startPoint }, // Start point
          { ...endPoint }    // End point
        ];
      }
    } catch (error) {
      console.error('Error fetching directions:', error);
      // Fallback to direct line
      routeCoordinates = [
        { ...startPoint }, // Start point
        { ...endPoint }    // End point
      ];
    }
    
    // Store the original location to restore it when the vehicle completes the route
    const originalLocation = { ...vehicle.location };
    
    return {
      ...vehicle,
      currentRouteIndex: 0,
      originalLocation: originalLocation,
      // Speed in coordinates per second (adjusted for simulation)
      speed: (vehicle.speed || 30) / 3600 * 0.0001 * 100, // Significantly increased speed multiplier for more visible movement
      // Store the fixed route to ensure it doesn't change
      fixedRoute: routeCoordinates,
      // Direction flag (1 for forward, -1 for backward)
      direction: 1,
      // Progress between current and next point (0 to 1)
      progress: 0,
      // Add route information
      routeInfo: {
        startPoint: routeData.startPoint,
        endPoint: routeData.endPoint,
        color: routeData.color
      }
    };
  });
  
  // Wait for all route generation to complete
  simulatedVehicles = await Promise.all(vehiclePromises);
  
  // Update vehicle positions at regular intervals
  simulationInterval = setInterval(() => {
    // Update each vehicle's position along its fixed route
    simulatedVehicles = simulatedVehicles.map(vehicle => {
      // If vehicle has a fixed route
      if (vehicle.fixedRoute && vehicle.fixedRoute.length > 1) {
        const route = vehicle.fixedRoute;
        
        // Get current and next points on the route based on direction
        const currentPoint = route[vehicle.currentRouteIndex];
        const nextIndex = vehicle.currentRouteIndex + vehicle.direction;
        
        // Make sure nextIndex is within bounds
        if (nextIndex >= 0 && nextIndex < route.length) {
          const nextPoint = route[nextIndex];
          
          // Calculate bearing (direction) between points
          const bearing = calculateBearing(currentPoint, nextPoint);
          
          // Increment progress
          vehicle.progress += 0.01; // Move 1% of the way to the next point each update
          
          // If progress reaches or exceeds 1, move to the next point
          if (vehicle.progress >= 1) {
            // Reset progress
            vehicle.progress = 0;
            
            // Move to next point on route based on direction
            vehicle.currentRouteIndex += vehicle.direction;
            
            // If vehicle has reached the end of the route, reverse direction
            if (vehicle.currentRouteIndex >= route.length - 1 || vehicle.currentRouteIndex <= 0) {
              // Reverse direction
              vehicle.direction *= -1;
              
              // Adjust index based on new direction
              if (vehicle.direction === -1) {
                vehicle.currentRouteIndex = route.length - 1;
              } else {
                vehicle.currentRouteIndex = 0;
              }
              
              console.log(`${vehicle.name} changed direction to ${vehicle.direction === 1 ? 'forward' : 'backward'}`);
            }
            
            // Return the exact next point
            return {
              ...vehicle,
              location: { ...route[vehicle.currentRouteIndex] },
              heading: bearing,
              lastUpdated: new Date().toISOString()
            };
          }
          
          // Interpolate between current and next point based on progress
          const newLocation = {
            latitude: currentPoint.latitude + (nextPoint.latitude - currentPoint.latitude) * vehicle.progress,
            longitude: currentPoint.longitude + (nextPoint.longitude - currentPoint.longitude) * vehicle.progress
          };
          
          // Update vehicle with new location and bearing
          return {
            ...vehicle,
            location: newLocation,
            heading: bearing,
            lastUpdated: new Date().toISOString()
          };
        }
      }
      
      return vehicle;
    });
    
    // Call the update callback with the updated vehicles
    if (updateCallback) {
      updateCallback(simulatedVehicles);
    }
  }, 100); // Update every 100ms for smooth animation
  
  // Return the initial vehicles
  return simulatedVehicles;
}

/**
 * Stop vehicle movement simulation
 */
function stopVehicleSimulation() {
  if (simulationInterval) {
    clearInterval(simulationInterval);
    simulationInterval = null;
  }
  simulatedVehicles = [];
}

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('=== NEW CLIENT CONNECTION ===');
  console.log('Client connected with ID:', socket.id);
  console.log('Connection timestamp:', new Date().toISOString());
  console.log('==============================');
  
  // Store client-specific data
  const clientData = {
    vehicles: [],
    simulationInterval: null
  };
  
  // When client sends their initial location
  socket.on('userLocation', (data) => {
    console.log('=== RECEIVED USER LOCATION ===');
    console.log('Client ID:', socket.id);
    console.log('Received user location:', data);
    console.log('Timestamp:', new Date().toISOString());
    console.log('===============================');
    
    try {
      // Generate initial vehicles around user
      clientData.vehicles = generateVehicles(data, 5); // Generate 5 vehicles
      
      // Send initial vehicles to client immediately
      socket.emit('vehicleUpdates', clientData.vehicles);
      
      // Start vehicle simulation for this specific client
      startVehicleSimulation(clientData.vehicles, data, (updatedVehicles) => {
        // Store the updated vehicles
        clientData.vehicles = updatedVehicles;
        
        // Emit updated vehicles to this client
        socket.emit('vehicleUpdates', updatedVehicles);
      }).then(simulationResult => {
        // Store any simulation data if needed
        console.log(`Simulation started for client ${socket.id}`);
      }).catch(error => {
        console.error(`Error starting simulation for client ${socket.id}:`, error);
      });
    } catch (error) {
      console.error('Error processing user location:', error);
      // Send an error message to the client
      socket.emit('error', { message: 'Error processing location data' });
    }
  });
  
  // Handle disconnection
  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`);
    
    // Clean up resources for this specific client
    if (clientData.simulationInterval) {
      clearInterval(clientData.simulationInterval);
      clientData.simulationInterval = null;
    }
    
    // Clear client data
    clientData.vehicles = [];
  });
});

// Add a simple status endpoint
app.get('/', (req, res) => {
  res.send('Vehicle Tracking WebSocket Server is running');
});

// Start the server
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Socket server running on port ${PORT}`);
});
