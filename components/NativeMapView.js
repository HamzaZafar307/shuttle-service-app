/**
 * NativeMapView Component
 * Map implementation for native platforms (iOS/Android) using react-native-maps
 */

import React, { useEffect, useState } from 'react';
import { StyleSheet, Platform, View, Text, ActivityIndicator } from 'react-native';
import MapView from 'react-native-maps';
import { getMapStyle } from '../services/mapService';
import { FONTS } from '../utils/fontUtils';

/**
 * NativeMapView Component
 * 
 * @param {Object} props - Component props
 * @param {Object} props.region - Map region {latitude, longitude, latitudeDelta, longitudeDelta}
 * @param {boolean} props.showsUserLocation - Whether to show the user's location
 * @param {boolean} props.showsMyLocationButton - Whether to show the my location button
 * @param {string} props.theme - Map theme ('light' or 'dark')
 * @param {Object} props.children - Child components (markers, polylines, etc.)
 */
const NativeMapView = ({
  region,
  showsUserLocation = true,
  showsMyLocationButton = true,
  theme = 'light',
  children,
  ...otherProps
}) => {
  // Get map style based on theme
  const customMapStyle = getMapStyle(theme);
  
  // State to track map loading
  const [isMapReady, setIsMapReady] = useState(false);
  const [mapError, setMapError] = useState(null);
  
  // Validate region to prevent crashes
  const isValidRegion = region && 
    typeof region.latitude === 'number' && 
    typeof region.longitude === 'number' &&
    typeof region.latitudeDelta === 'number' &&
    typeof region.longitudeDelta === 'number';
  
  // If region is invalid, use a default region
  const safeRegion = isValidRegion ? region : {
    latitude: 37.7749,
    longitude: -122.4194,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  };

  // Log region for debugging
  console.log('NativeMapView - Using region:', safeRegion);
  
  // Handle map load
  const handleMapReady = () => {
    console.log('Map is ready');
    setIsMapReady(true);
  };
  
  // Handle map error
  const handleMapError = (error) => {
    console.error('Map error:', error);
    setMapError(error);
  };
  
  // If map fails to load after a timeout, force it to be ready
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (!isMapReady) {
        console.warn('Map load timeout, forcing ready state');
        setIsMapReady(true);
      }
    }, 3000); // Reduced timeout to 3 seconds for faster loading
    
    return () => clearTimeout(timeout);
  }, [isMapReady]);

  // Force map ready state for Android after a short delay to ensure markers are displayed
  useEffect(() => {
    if (Platform.OS === 'android') {
      const forceReadyTimeout = setTimeout(() => {
        if (!isMapReady) {
          console.log('Forcing map ready state for Android');
          setIsMapReady(true);
        }
      }, 1000); // Force ready after 1 second on Android
      
      return () => clearTimeout(forceReadyTimeout);
    }
  }, []);
  
  // If there's an error, show error message
  if (mapError) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Error loading map</Text>
        <Text style={styles.errorDetail}>{mapError.toString()}</Text>
      </View>
    );
  }
  
  // Show loading indicator while map is loading
  if (!isMapReady && Platform.OS === 'android') {
    return (
      <View style={[styles.map, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="#3498db" />
        <Text style={styles.loadingText}>Loading map...</Text>
      </View>
    );
  }
  
  try {
    return (
      <MapView
        style={styles.map}
        region={safeRegion}
        initialRegion={safeRegion}
        showsUserLocation={showsUserLocation}
        showsMyLocationButton={showsMyLocationButton}
        showsCompass={true}
        showsScale={Platform.OS === 'ios'} // Scale only works on iOS
        showsTraffic={false}
        showsBuildings={true}
        showsIndoors={false}
        toolbarEnabled={Platform.OS === 'android'} // Toolbar only on Android
        zoomEnabled={true}
        rotateEnabled={true}
        scrollEnabled={true}
        pitchEnabled={Platform.OS !== 'ios'} // Disable pitch on iOS
        customMapStyle={customMapStyle}
        onMapReady={handleMapReady}
        onError={handleMapError}
        provider="google" // Explicitly use Google Maps
        {...otherProps}
      >
        {(isMapReady || Platform.OS === 'android') && children}
      </MapView>
    );
  } catch (error) {
    console.error('Error rendering MapView:', error);
    return (
      <View style={[styles.map, styles.errorContainer]}>
        <Text style={styles.errorText}>Error loading map</Text>
        <Text style={styles.errorDetail}>{error.toString()}</Text>
      </View>
    );
  }
};

const styles = StyleSheet.create({
  map: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    fontFamily: FONTS.SCANDIA.REGULAR,
    marginTop: 10,
    fontSize: 16,
    color: '#3498db',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 20,
  },
  errorText: {
    fontFamily: FONTS.SCANDIA.MEDIUM,
    fontSize: 18,
    color: '#e74c3c',
    marginBottom: 10,
  },
  errorDetail: {
    fontFamily: FONTS.SCANDIA.REGULAR,
    fontSize: 14,
    color: '#7f8c8d',
    textAlign: 'center',
  },
});

export default NativeMapView;
