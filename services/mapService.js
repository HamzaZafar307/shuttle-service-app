/**
 * Map Service
 * Provides functions for map-related operations and route generation
 */

import * as Location from 'expo-location';
import { Platform } from 'react-native';
import { generateRandomCoordinate, calculateDistance } from '../utils/locationUtils';
import { MAP_CONFIG, BUS_ROUTES, GOOGLE_MAPS_API_KEY } from '../config';

// Store fixed routes for each vehicle to ensure consistency
const vehicleFixedRoutes = {};

/**
 * Fetch directions from Google Maps Directions API
 * 
 * @param {Object} origin - Origin coordinate {latitude, longitude}
 * @param {Object} destination - Destination coordinate {latitude, longitude}
 * @returns {Promise<Array>} Array of coordinates representing the route
 */
export const fetchDirections = async (origin, destination) => {
  try {
    // Format coordinates for the API
    const originStr = `${origin.latitude},${origin.longitude}`;
    const destinationStr = `${destination.latitude},${destination.longitude}`;
    
    // Build the API URL
    const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${originStr}&destination=${destinationStr}&key=${GOOGLE_MAPS_API_KEY}`;
    
    console.log('Fetching directions from Google Maps API...');
    
    // Fetch directions from the API
    const response = await fetch(url);
    const data = await response.json();
    
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
};

/**
 * Decode a Google Maps encoded polyline
 * 
 * @param {string} encoded - Encoded polyline string
 * @returns {Array} Array of {lat, lng} objects
 */
const decodePolyline = (encoded) => {
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
};

/**
 * Get current user location
 * 
 * @returns {Promise<Object>} Location object {latitude, longitude}
 */
export const getCurrentLocation = async () => {
  // Always return the Mobily C11 location
  return MAP_CONFIG.DEFAULT_REGION;
};

/**
 * Generate a route for a vehicle using Google Maps Directions API
 * 
 * @param {Object} vehicle - Vehicle object
 * @param {Object} userLocation - User's location
 * @returns {Promise<Object>} Route information
 */
export const generateVehicleRoute = async (vehicle, userLocation) => {
  if (!vehicle || !userLocation) {
    console.warn('Missing vehicle or user location for route generation');
    return { 
      route: {
        coordinates: [],
        distance: 0,
        duration: 0,
        routeName: 'Unknown Route',
        routeId: 'R0',
        stops: 0,
        startName: 'Unknown',
        endName: 'Unknown',
        color: '#3498db'
      }, 
      busStop: null 
    };
  }
  
  // Ensure vehicle has a valid location
  if (!vehicle.location || !vehicle.location.latitude || !vehicle.location.longitude) {
    console.warn('Vehicle has invalid location data');
    return { 
      route: {
        coordinates: [],
        distance: 0,
        duration: 0,
        routeName: 'Unknown Route',
        routeId: 'R0',
        stops: 0,
        startName: 'Unknown',
        endName: 'Unknown',
        color: '#3498db'
      }, 
      busStop: null 
    };
  }
  
  // Check if we already have a fixed route for this vehicle
  if (vehicleFixedRoutes[vehicle.id]) {
    const fixedRoute = vehicleFixedRoutes[vehicle.id];
    
    // Calculate route metrics
    const distance = calculateRouteDistance(fixedRoute.coordinates);
    const duration = calculateRouteDuration(fixedRoute.coordinates, vehicle.speed || 30);
    
    return {
      route: {
        coordinates: fixedRoute.coordinates,
        distance: distance,
        duration: duration,
        routeName: vehicle.route || 'Unknown Route',
        routeId: vehicle.routeId || 'R0',
        stops: vehicle.stops || 0,
        startName: fixedRoute.startName,
        endName: fixedRoute.endName,
        color: fixedRoute.color
      },
      busStop: fixedRoute.busStop,
    };
  }
  
  // Find the route data for this vehicle
  const routeData = BUS_ROUTES.find(r => r.id === vehicle.routeId) || BUS_ROUTES[0];
  
  // Use predefined coordinates if available, otherwise generate random ones
  let startPoint = vehicle.location; // Default to vehicle's current location
  let endPoint;
  
  if (routeData.startCoordinates && routeData.endCoordinates) {
    // Use the predefined coordinates from the route data
    startPoint = routeData.startCoordinates;
    endPoint = routeData.endCoordinates;
    console.log(`Using predefined coordinates for ${routeData.name}: Start: ${JSON.stringify(startPoint)}, End: ${JSON.stringify(endPoint)}`);
  } else {
    // Generate a bus stop much further from the user for more visible movement
    endPoint = generateRandomCoordinate(userLocation, 3.0); // 3km radius for longer routes
  }
  
  try {
    // Use Google Maps Directions API to get a real route
    const directionsResult = await fetchDirections(startPoint, endPoint);
    
    if (directionsResult && directionsResult.coordinates && directionsResult.coordinates.length > 0) {
      console.log('Successfully fetched directions from Google Maps API');
      
      // Store the fixed route for this vehicle
      vehicleFixedRoutes[vehicle.id] = {
        coordinates: directionsResult.coordinates,
        busStop: endPoint,
        startName: routeData.startPoint,
        endName: routeData.endPoint,
        color: routeData.color,
        distance: directionsResult.distance,
        duration: directionsResult.duration
      };
      
      return {
        vehicleId: vehicle.id,
        route: {
          coordinates: directionsResult.coordinates,
          distance: directionsResult.distance,
          duration: directionsResult.duration,
          routeName: vehicle.route || 'Unknown Route',
          routeId: vehicle.routeId || 'R0',
          stops: vehicle.stops || 0,
          startName: routeData.startPoint,
          endName: routeData.endPoint,
          color: routeData.color
        },
        busStop: endPoint,
      };
    } else {
      console.warn('Failed to fetch directions, falling back to direct line');
    }
  } catch (error) {
    console.error('Error fetching directions:', error);
    console.warn('Falling back to direct line route');
  }
  
  // Fallback to direct line if Google Maps API fails
  console.log('Using fallback direct line route');
  
  // Generate route coordinates (direct line with just start and end points)
  const routeCoordinates = [
    { ...startPoint }, // Start point
    { ...endPoint }    // End point
  ];
  
  // Store the fixed route for this vehicle
  vehicleFixedRoutes[vehicle.id] = {
    coordinates: routeCoordinates,
    busStop: endPoint,
    startName: routeData.startPoint,
    endName: routeData.endPoint,
    color: routeData.color
  };
  
  // Calculate route metrics
  const distance = calculateRouteDistance(routeCoordinates);
  const duration = calculateRouteDuration(routeCoordinates, vehicle.speed || 30);
  
  return {
    vehicleId: vehicle.id,
    route: {
      coordinates: routeCoordinates,
      distance: distance,
      duration: duration,
      routeName: vehicle.route || 'Unknown Route',
      routeId: vehicle.routeId || 'R0',
      stops: vehicle.stops || 0,
      startName: routeData.startPoint,
      endName: routeData.endPoint,
      color: routeData.color
    },
    busStop: endPoint,
  };
};

/**
 * Calculate the total distance of a route
 * 
 * @param {Array} coordinates - Array of coordinates
 * @returns {number} Distance in kilometers
 */
const calculateRouteDistance = (coordinates) => {
  if (!coordinates || coordinates.length < 2) return 0;
  
  let distance = 0;
  
  for (let i = 1; i < coordinates.length; i++) {
    distance += calculateDistance(coordinates[i-1], coordinates[i]);
  }
  
  return distance;
};

/**
 * Calculate the estimated duration of a route
 * 
 * @param {Array} coordinates - Array of coordinates
 * @param {number} speed - Speed in km/h
 * @returns {number} Duration in minutes
 */
const calculateRouteDuration = (coordinates, speed) => {
  const distance = calculateRouteDistance(coordinates);
  
  // If no distance or speed, return 0
  if (distance === 0 || !speed) return 0;
  
  // Convert km/h to km/min and calculate duration
  const speedInKmPerMin = speed / 60;
  return distance / speedInKmPerMin;
};

/**
 * Generate mock vehicles around a given location
 * 
 * @param {Object} centerLocation - Center location {latitude, longitude}
 * @returns {Array} Array of mock vehicle objects
 */
export const generateMockVehicles = (centerLocation) => {
  if (!centerLocation) {
    console.warn('No center location provided for mock vehicles');
    // Default to Mobily C11 location if no location is provided
    centerLocation = MAP_CONFIG.DEFAULT_REGION;
  }
  
  const vehicles = [];
  
  // Create 5 buses as per requirements
  for (let i = 0; i < 5; i++) {
    // Use the predefined route data
    const routeData = BUS_ROUTES[i];
    
    // For the first bus (Bus #1), use the predefined start coordinates if available
    let location;
    if (i === 0 && routeData.startCoordinates) {
      location = { ...routeData.startCoordinates };
      console.log(`Using predefined start coordinates for ${routeData.name}: ${JSON.stringify(location)}`);
    } else {
      // Generate a random location within 3km of the center for other buses
      location = generateRandomCoordinate(centerLocation, 3.0);
    }
    
    vehicles.push({
      id: `vehicle-${i}`,
      name: `Bus ${i+1}`, // Changed to match the display in BusList component
      type: 'bus',
      route: routeData.name,
      routeId: routeData.id,
      stops: 1, // Set all buses to have 1 stop
      speed: 20 + Math.floor(Math.random() * 40), // 20-60 km/h
      heading: Math.floor(Math.random() * 360),
      location: location,
      startPoint: routeData.startPoint,
      endPoint: routeData.endPoint,
      lastUpdated: new Date().toISOString()
    });
  }
  
  return vehicles;
};

/**
 * Get map style for Google Maps
 * 
 * @param {string} theme - Theme ('light' or 'dark')
 * @returns {Object} Map style options
 */
export const getMapStyle = (theme = 'light') => {
  // For web, return a style object
  return {
    styles: theme === 'dark' ? DARK_MAP_STYLE : [],
  };
};

// Dark map style for Google Maps
const DARK_MAP_STYLE = [
  { stylers: [{ hue: "#222222" }, { saturation: -100 }, { lightness: -50 }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#000000" }] },
  { featureType: "landscape", elementType: "geometry", stylers: [{ color: "#222222" }] },
  { featureType: "poi", elementType: "geometry", stylers: [{ color: "#333333" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#444444" }] },
  { featureType: "road.arterial", elementType: "geometry", stylers: [{ color: "#333333" }] },
  { featureType: "road.local", elementType: "geometry", stylers: [{ color: "#222222" }] },
  { featureType: "transit", elementType: "geometry", stylers: [{ color: "#333333" }] },
];
