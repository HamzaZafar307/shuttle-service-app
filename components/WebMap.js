/**
 * WebMap Component
 * Map implementation for web platform using @react-google-maps/api
 */

import React, { useCallback, useRef, useState, useEffect } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { GoogleMap, Marker, Polyline, useJsApiLoader } from '@react-google-maps/api';
import { getMapStyle } from '../services/mapService';
import { GOOGLE_MAPS_API_KEY, MAP_CONFIG } from '../config';
import { FONTS } from '../utils/fontUtils';

// Default map container style
const mapContainerStyle = {
  width: '100%',
  height: '100%',
};

/**
 * WebMap Component
 * 
 * @param {Object} props - Component props
 * @param {Object} props.location - User's location {latitude, longitude}
 * @param {Array} props.vehicles - Array of vehicle objects
 * @param {Function} props.onSelectVehicle - Callback when a vehicle is selected
 * @param {Object} props.routeInfo - Route information for selected vehicle
 * @param {string} props.theme - Map theme ('light' or 'dark')
 */
const WebMap = ({ 
  location, 
  vehicles = [], 
  onSelectVehicle, 
  routeInfo = null,
  theme = 'light' 
}) => {
  // Load Google Maps JavaScript API
  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
  });
  
  // Map reference
  const mapRef = useRef(null);
  
  // Selected vehicle state
  const [selectedVehicleId, setSelectedVehicleId] = useState(null);
  
  // We'll use a more stable approach to track vehicle updates
  // without causing infinite re-renders
  
  // Map options
  const mapOptions = {
    disableDefaultUI: false,
    zoomControl: true,
    mapTypeControl: false,
    streetViewControl: false,
    fullscreenControl: false,
    ...getMapStyle(theme),
  };
  
  // Handle map load
  const onMapLoad = useCallback((map) => {
    mapRef.current = map;
  }, []);
  
  // Handle map unload
  const onMapUnmount = useCallback(() => {
    mapRef.current = null;
  }, []);
  
  // Handle vehicle selection
  const handleVehicleSelect = (vehicle) => {
    setSelectedVehicleId(vehicle.id);
    
    // Call the parent's onSelectVehicle callback
    if (onSelectVehicle) {
      onSelectVehicle(vehicle);
    }
    
    // Center the map on the selected vehicle
    if (mapRef.current) {
      mapRef.current.panTo({
        lat: vehicle.location.latitude,
        lng: vehicle.location.longitude,
      });
      mapRef.current.setZoom(15);
    }
    
    console.log('Selected vehicle:', vehicle.id, 'at', 
      vehicle.location.latitude.toFixed(6), 
      vehicle.location.longitude.toFixed(6)
    );
  };
  
  // Update when vehicles change
  useEffect(() => {
    // Log vehicle positions for debugging
    if (vehicles.length > 0) {
      console.log('WebMap received updated vehicles:', 
        vehicles.map(v => ({
          id: v.id,
          lat: v.location.latitude.toFixed(6),
          lng: v.location.longitude.toFixed(6)
        }))
      );
    }
  }, [vehicles]);
  
  // If the API is not loaded yet, show a loading message
  if (loadError) {
    console.error('Error loading Google Maps API:', loadError);
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Error loading maps</Text>
      </View>
    );
  }
  
  if (!isLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading maps...</Text>
      </View>
    );
  }
  
  // Ensure we have a valid location
  if (!location || !location.latitude || !location.longitude) {
    console.warn('Invalid location provided to WebMap, using default');
    location = MAP_CONFIG.DEFAULT_REGION;
  }
  
  // Find the selected vehicle
  const selectedVehicle = vehicles.find(v => v.id === selectedVehicleId);
  
  // Prepare route data for rendering
  let routeCoordinates = [];
  let routeColor = '#FF8C00'; // Default orange
  
  if (routeInfo && routeInfo.route && routeInfo.route.coordinates) {
    // Convert coordinates format for Google Maps (latitude/longitude to lat/lng)
    routeCoordinates = routeInfo.route.coordinates.map(coord => ({
      lat: coord.latitude,
      lng: coord.longitude
    }));
    
    // Use route color if available
    if (routeInfo.route.color) {
      routeColor = routeInfo.route.color;
    }
  }
  
  return (
    <View style={styles.container}>
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={{ lat: location.latitude, lng: location.longitude }}
        zoom={13}
        options={mapOptions}
        onLoad={onMapLoad}
        onUnmount={onMapUnmount}
      >
        {/* User location marker with pulsing effect */}
        <Marker
          position={{ lat: location.latitude, lng: location.longitude }}
          icon={{
            path: 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z',
            fillColor: '#FF5722', // Bright orange for better visibility
            fillOpacity: 0.9,
            strokeColor: '#FFFFFF',
            strokeWeight: 2,
            scale: 2.0, // Larger scale for better visibility
            anchor: { x: 12, y: 24 },
          }}
          title="Your Current Location"
          label={{
            text: "You",
            color: 'white',
            fontSize: '10px',
            fontWeight: 'bold',
            fontFamily: 'Scandia-Bold, Scandia, sans-serif'
          }}
        />
        
        {/* Add a circular pulse effect around user location */}
        <Marker
          position={{ lat: location.latitude, lng: location.longitude }}
          icon={{
            path: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z',
            fillColor: '#FF5722',
            fillOpacity: 0.2,
            strokeColor: '#FF5722',
            strokeOpacity: 0.5,
            strokeWeight: 1,
            scale: 5.0,
            anchor: { x: 12, y: 12 },
          }}
          clickable={false}
        />
        
        {/* Vehicle markers - show only selected vehicle if routeInfo is available */}
        {(routeInfo && routeInfo.vehicleId ? vehicles.filter(v => v.id === routeInfo.vehicleId) : vehicles).map((vehicle) => {
          // Bus path SVG
          const busPath = 'M4 16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2v-8c0-1.1-.9-2-2-2H6c-1.1 0-2 .9-2 2v8zm3.5-6c.8 0 1.5.7 1.5 1.5S8.3 13 7.5 13 6 12.3 6 11.5 6.7 10 7.5 10zm9 0c.8 0 1.5.7 1.5 1.5s-.7 1.5-1.5 1.5-1.5-.7-1.5-1.5.7-1.5 1.5-1.5z';
          
          // Choose color based on selection state
          const fillColor = vehicle.id === selectedVehicleId ? '#FF8C00' : '#008cff';
          
          // Generate a key based on vehicle ID and position
          const markerKey = `${vehicle.id}-${vehicle.location.latitude.toFixed(6)}-${vehicle.location.longitude.toFixed(6)}`;
          
          return (
            <Marker
              key={markerKey}
              position={{ lat: vehicle.location.latitude, lng: vehicle.location.longitude }}
              icon={{
                path: busPath,
                fillColor: fillColor,
                fillOpacity: 1,
                strokeColor: '#FFFFFF',
                strokeWeight: 2,
                scale: 1.5,
                anchor: { x: 12, y: 12 },
                // Rotate icon based on vehicle heading
                rotation: vehicle.heading || 0
              }}
              onClick={() => handleVehicleSelect(vehicle)}
              title={vehicle.name}
            />
          );
        })}
        
        {/* Bus route polyline */}
        {routeCoordinates.length > 0 && (
          <Polyline
            path={routeCoordinates}
            options={{
              strokeColor: routeColor,
              strokeOpacity: 0.8,
              strokeWeight: 4,
            }}
          />
        )}
        
        {/* Path from current location to route start */}
        {routeCoordinates.length > 0 && (
          <Polyline
            path={[
              { lat: location.latitude, lng: location.longitude },
              routeCoordinates[0]
            ]}
            options={{
              strokeColor: '#FF5722', // Match user location color
              strokeOpacity: 0.7,
              strokeWeight: 3,
              strokePattern: [10, 5], // Dashed line pattern
            }}
          />
        )}
        
        {/* Route start point marker */}
        {routeCoordinates.length > 0 && (
          <Marker
            position={routeCoordinates[0]}
            icon={{
              path: 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z',
              fillColor: '#2ecc71', // Green
              fillOpacity: 1,
              strokeColor: '#FFFFFF',
              strokeWeight: 2,
              scale: 1.5,
              anchor: { x: 12, y: 24 },
            }}
            title={routeInfo?.route?.startName || "Route Start"}
            label={{
              text: "S",
              color: 'white',
              fontSize: '10px',
              fontWeight: 'bold',
              fontFamily: 'Scandia-Bold, Scandia, sans-serif'
            }}
          />
        )}
        
        {/* Route end point marker */}
        {routeCoordinates.length > 1 && (
          <Marker
            position={routeCoordinates[routeCoordinates.length - 1]}
            icon={{
              path: 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z',
              fillColor: '#e74c3c', // Red
              fillOpacity: 1,
              strokeColor: '#FFFFFF',
              strokeWeight: 2,
              scale: 1.5,
              anchor: { x: 12, y: 24 },
            }}
            title={routeInfo?.route?.endName || "Route End"}
            label={{
              text: "E",
              color: 'white',
              fontSize: '10px',
              fontWeight: 'bold',
              fontFamily: 'Scandia-Bold, Scandia, sans-serif'
            }}
          />
        )}
      </GoogleMap>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
    overflow: 'hidden',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    fontFamily: FONTS.SCANDIA.REGULAR,
    fontSize: 16,
    color: '#3498db',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  errorText: {
    fontFamily: FONTS.SCANDIA.REGULAR,
    fontSize: 16,
    color: '#e74c3c',
  },
});

export default WebMap;
