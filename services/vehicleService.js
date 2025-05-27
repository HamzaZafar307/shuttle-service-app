/**
 * Vehicle Service
 * Provides functions for vehicle data management and simulation
 */

import { generateVehicleRoute } from './mapService';
import { moveTowardsPoint, calculateBearing, calculateDistance } from '../utils/locationUtils';
import { FEATURES } from '../config';

// Store for simulated vehicles and their routes
let simulatedVehicles = [];
let simulationInterval = null;

/**
 * Start vehicle movement simulation
 * 
 * @param {Array} vehicles - Array of vehicle objects
 * @param {Object} userLocation - User's location
 * @param {Function} updateCallback - Callback to update vehicle positions
 */
export const startVehicleSimulation = async (vehicles, userLocation, updateCallback) => {
  // Stop any existing simulation
  stopVehicleSimulation();
  
  // Initialize simulated vehicles with fixed routes
  const vehiclePromises = vehicles.map(async (vehicle) => {
    try {
      // Generate a fixed route for this vehicle (now async)
      const routeInfo = await generateVehicleRoute(vehicle, userLocation);
      
      // Store the original location to restore it when the vehicle completes the route
      const originalLocation = { ...vehicle.location };
      
      // Create a bidirectional route by duplicating the route in reverse
      let bidirectionalRoute = null;
      if (routeInfo.route && routeInfo.route.coordinates) {
        // Create forward route
        const forwardRoute = [...routeInfo.route.coordinates];
        // Create reverse route (excluding the last point to avoid duplication)
        const reverseRoute = [...routeInfo.route.coordinates].reverse().slice(1);
        // Combine for a complete bidirectional route
        bidirectionalRoute = [...forwardRoute, ...reverseRoute];
        
        console.log(`Created bidirectional route for ${vehicle.name} with ${bidirectionalRoute.length} points`);
        console.log(`Route starts at: ${JSON.stringify(bidirectionalRoute[0])}`);
        console.log(`Route ends at: ${JSON.stringify(bidirectionalRoute[bidirectionalRoute.length - 1])}`);
      }
      
      return {
        ...vehicle,
        routeInfo: routeInfo,
        currentRouteIndex: 0,
        originalLocation: originalLocation,
        // Speed in coordinates per second (adjusted for simulation)
        speed: Math.round(vehicle.speed || 30), // Keep the original speed in km/h for display
        simulationSpeed: 0.0001, // Very slow fixed speed for smooth movement
        // Store the bidirectional route to ensure it doesn't change
        fixedRoute: bidirectionalRoute || null,
        // Direction flag (1 for forward, -1 for backward)
        direction: 1,
        // Progress between current and next point (0 to 1)
        progress: 0
      };
    } catch (error) {
      console.error(`Error generating route for vehicle ${vehicle.id}:`, error);
      // Return vehicle without route in case of error
      return {
        ...vehicle,
        routeInfo: { route: null, busStop: null },
        currentRouteIndex: 0,
        originalLocation: { ...vehicle.location },
        speed: Math.round(vehicle.speed || 30),
        simulationSpeed: 0.0001, // Very slow fixed speed for smooth movement
        fixedRoute: null,
        direction: 1,
        progress: 0
      };
    }
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
          
          // Log movement for debugging
          console.log(`${vehicle.name} moving from ${JSON.stringify(currentPoint)} to ${JSON.stringify(nextPoint)}, progress: ${vehicle.progress.toFixed(2)}, heading: ${bearing.toFixed(2)}`);
          
          // Update vehicle with new location and bearing
          return {
            ...vehicle,
            location: newLocation,
            heading: bearing,
            lastUpdated: new Date().toISOString()
          };
        } else {
          // This should not happen, but just in case
          console.warn(`${vehicle.name} has invalid next index: ${nextIndex}, resetting direction`);
          return {
            ...vehicle,
            direction: vehicle.direction * -1,
            currentRouteIndex: vehicle.direction === 1 ? route.length - 1 : 0,
            progress: 0
          };
        }
      }
      
      return vehicle;
    });
    
    // Log vehicle positions for debugging
    console.log('Updated vehicle positions:', 
      simulatedVehicles.map(v => ({
        id: v.id,
        name: v.name,
        lat: v.location.latitude,
        lng: v.location.longitude,
        heading: v.heading,
        progress: v.progress
      }))
    );
    
    // Call the update callback with the updated vehicles
    if (updateCallback) {
      updateCallback(simulatedVehicles);
    }
  }, FEATURES.SIMULATION_UPDATE_INTERVAL);
  
  // Return the initial vehicles
  return simulatedVehicles;
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
 * Get the current simulated vehicles
 * 
 * @returns {Array} Array of simulated vehicle objects
 */
export const getSimulatedVehicles = () => {
  return [...simulatedVehicles];
};
