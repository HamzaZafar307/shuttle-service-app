/**
 * Location Utilities
 * Provides helper functions for location-related operations
 */

/**
 * Calculate distance between two coordinates in kilometers
 * Uses the Haversine formula
 * 
 * @param {Object} coord1 - First coordinate {latitude, longitude}
 * @param {Object} coord2 - Second coordinate {latitude, longitude}
 * @returns {number} Distance in kilometers
 */
export const calculateDistance = (coord1, coord2) => {
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
};

/**
 * Convert degrees to radians
 * 
 * @param {number} degrees - Value in degrees
 * @returns {number} Value in radians
 */
const toRad = (degrees) => {
  return degrees * Math.PI / 180;
};

/**
 * Generate a random coordinate within a specified radius of a center point
 * 
 * @param {Object} center - Center coordinate {latitude, longitude}
 * @param {number} radiusKm - Radius in kilometers
 * @returns {Object} Random coordinate {latitude, longitude}
 */
export const generateRandomCoordinate = (center, radiusKm) => {
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
};

/**
 * Calculate bearing between two coordinates
 * 
 * @param {Object} start - Starting coordinate {latitude, longitude}
 * @param {Object} end - Ending coordinate {latitude, longitude}
 * @returns {number} Bearing in degrees (0-360)
 */
export const calculateBearing = (start, end) => {
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
};

/**
 * Move a point towards another point by a certain amount
 * 
 * @param {Object} start - Starting coordinate {latitude, longitude}
 * @param {Object} end - Ending coordinate {latitude, longitude}
 * @param {number} amount - Amount to move (in coordinate units)
 * @returns {Object} New coordinate {latitude, longitude}
 */
export const moveTowardsPoint = (start, end, amount) => {
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
};
