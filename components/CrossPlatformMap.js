/**
 * CrossPlatformMap Component
 * Provides a unified interface for maps across platforms (web, iOS, Android)
 */

import React, { useState } from 'react';
import { StyleSheet, View, Text, Platform, TouchableOpacity } from 'react-native';
import WebMap from './WebMap';
import NativeMapView from './NativeMapView';
import NativeMarker from './NativeMarker';
import NativePolyline from './NativePolyline';
import { MAP_CONFIG } from '../config';
import { FONTS } from '../utils/fontUtils';

/**
 * CrossPlatformMap Component
 * 
 * @param {Object} props - Component props
 * @param {Object} props.location - User's location {latitude, longitude}
 * @param {Array} props.vehicles - Array of vehicle objects
 * @param {Function} props.onSelectVehicle - Callback when a vehicle is selected
 * @param {Object} props.routeInfo - Route information for selected vehicle
 * @param {string} props.theme - Map theme ('light' or 'dark')
 */
const CrossPlatformMap = ({ 
  location, 
  vehicles = [], 
  onSelectVehicle, 
  routeInfo = null,
  theme = 'light' 
}) => {
  // State to track if legend is minimized
  const [isLegendMinimized, setIsLegendMinimized] = useState(false);
  
  // Toggle legend visibility
  const toggleLegend = () => {
    setIsLegendMinimized(!isLegendMinimized);
  };
  // If location is not available yet, use default location from config
  if (!location) {
    console.warn('No location provided to CrossPlatformMap, using default');
    location = MAP_CONFIG.DEFAULT_REGION;
  }
  
  // Generate a stable key based on vehicles length
  const mapKey = `map-${vehicles.length}`;
  
  // For web platform, use WebMap component
  if (Platform.OS === 'web') {
    return (
      <WebMap
        key={mapKey}
        location={location}
        vehicles={vehicles}
        onSelectVehicle={onSelectVehicle}
        routeInfo={routeInfo}
        theme={theme}
      />
    );
  }
  
  // For native platforms (iOS, Android), use the NativeMapView component
  // Show only the selected vehicle if routeInfo is available, otherwise show all vehicles
  const vehiclesToShow = routeInfo && routeInfo.vehicleId 
    ? vehicles.filter(v => v.id === routeInfo.vehicleId) 
    : vehicles;
  
  // console.log('RouteInfo:', routeInfo);
  // console.log('All vehicles:', vehicles.map(v => ({ id: v.id, name: v.name, location: v.location })));
  
  // Determine map region based on selected route or user location
  const mapRegion = routeInfo && routeInfo.route && routeInfo.route.coordinates && 
    routeInfo.route.coordinates.length > 0 ? 
    {
      latitude: routeInfo.route.coordinates[0].latitude,
      longitude: routeInfo.route.coordinates[0].longitude,
      latitudeDelta: 0.02, // Zoom in more when showing a route
      longitudeDelta: 0.02,
    } : 
    {
      latitude: location.latitude,
      longitude: location.longitude,
      latitudeDelta: 0.0922,
      longitudeDelta: 0.0421,
    };
  
  console.log('Map region:', mapRegion);
  console.log('Showing vehicles:', vehiclesToShow.map(v => v.id));
  
  return (
    <View style={{ flex: 1 }}>
      <NativeMapView
        key={mapKey}
        region={mapRegion}
        showsUserLocation={true}
        showsMyLocationButton={true}
        theme={theme}
      >
        {/* Render vehicle markers */}
        {vehiclesToShow.map((vehicle) => {
          // Ensure vehicle has valid location data
          if (!vehicle || !vehicle.location || 
              typeof vehicle.location.latitude !== 'number' || 
              typeof vehicle.location.longitude !== 'number') {
            console.warn('Invalid vehicle location data:', vehicle);
            return null;
          }
          
          // Generate a stable key based on vehicle ID and position
          const markerKey = `${vehicle.id}-${vehicle.location.latitude.toFixed(6)}-${vehicle.location.longitude.toFixed(6)}`;
          
          return (
            <NativeMarker
              key={markerKey}
              coordinate={{
                latitude: vehicle.location.latitude,
                longitude: vehicle.location.longitude,
              }}
              title={vehicle.name}
              description={`Speed: ${vehicle.speed} km/h`}
              pinColor="blue"
              onPress={() => onSelectVehicle && onSelectVehicle(vehicle)}
              heading={vehicle.heading}
              vehicleType={vehicle.type || 'bus'}
            />
          );
        })}

        {/* Render route polyline if routeInfo is available */}
        {routeInfo && routeInfo.route && routeInfo.route.coordinates && 
         routeInfo.route.coordinates.length > 0 && 
         routeInfo.route.coordinates.every(coord => 
           coord && typeof coord.latitude === 'number' && typeof coord.longitude === 'number'
         ) && (
          <NativePolyline
            coordinates={routeInfo.route.coordinates}
            strokeWidth={4}
            strokeColor="#3498db"
          />
        )}
        
        {/* Render user location marker with a different color */}
        {location && (
          <NativeMarker
            coordinate={{
              latitude: location.latitude,
              longitude: location.longitude,
            }}
            title="Your Location"
            description="Your current position"
            pinColor="orange"
          />
        )}
        
        {/* COMMENTED OUT: Render path from user location to route start if routeInfo is available */}
        {/* 
        {routeInfo && routeInfo.route && routeInfo.route.coordinates && 
         routeInfo.route.coordinates.length > 0 && location && routeInfo.userToStartPath && (
          <NativePolyline
            coordinates={routeInfo.userToStartPath}
            strokeWidth={3}
            strokeColor="#f39c12" // Orange color for the path to starting point
            strokeDashPattern={[5, 5]} // Dashed line pattern
          />
        )}
        */}

        {/* Render route start and end markers if routeInfo is available */}
        {routeInfo && routeInfo.route && routeInfo.route.coordinates && 
         routeInfo.route.coordinates.length > 1 && (
          <>
            {/* Start marker */}
            {routeInfo.route.coordinates[0] && 
             typeof routeInfo.route.coordinates[0].latitude === 'number' && 
             typeof routeInfo.route.coordinates[0].longitude === 'number' && (
              <NativeMarker
                coordinate={routeInfo.route.coordinates[0]}
                title={routeInfo.route.startName || "Start"}
                pinColor="green"
              />
            )}
            
            {/* End marker */}
            {routeInfo.route.coordinates[routeInfo.route.coordinates.length - 1] && 
             typeof routeInfo.route.coordinates[routeInfo.route.coordinates.length - 1].latitude === 'number' && 
             typeof routeInfo.route.coordinates[routeInfo.route.coordinates.length - 1].longitude === 'number' && (
              <NativeMarker
                coordinate={routeInfo.route.coordinates[routeInfo.route.coordinates.length - 1]}
                title={routeInfo.route.endName || "End"}
                pinColor="red"
              />
            )}
          </>
        )}
      </NativeMapView>
      
      {/* Map Legend */}
      <View style={[styles.legendContainer, isLegendMinimized && styles.legendMinimized]}>
        <View style={styles.legendHeader}>
          <Text style={styles.legendTitle}>{isLegendMinimized ? "Legend" : "Map Legend"}</Text>
          <TouchableOpacity onPress={toggleLegend} style={styles.legendToggleButton}>
            <Text style={styles.legendToggleText}>{isLegendMinimized ? "+" : "-"}</Text>
          </TouchableOpacity>
        </View>
        
        {!isLegendMinimized && (
          <View style={styles.legendContent}>
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: 'blue' }]} />
              <Text style={styles.legendText}>Bus</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: 'orange' }]} />
              <Text style={styles.legendText}>Your Location</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: 'green' }]} />
              <Text style={styles.legendText}>Route Start</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: 'red' }]} />
              <Text style={styles.legendText}>Route End</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: '#3498db' }]} />
              <Text style={styles.legendText}>Bus Route</Text>
            </View>
            {/* COMMENTED OUT: Path to Route legend item
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: '#f39c12', borderStyle: 'dashed', borderWidth: 1 }]} />
              <Text style={styles.legendText}>Path to Route</Text>
            </View>
            */}
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    overflow: 'hidden',
  },
  text: {
    fontFamily: FONTS.SCANDIA.BOLD,
    fontSize: 16,
    fontWeight: 'bold',
    color: '#3498db',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtext: {
    fontFamily: FONTS.SCANDIA.REGULAR,
    fontSize: 14,
    color: '#7f8c8d',
    textAlign: 'center',
  },
  legendContainer: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    width: 150,
    maxHeight: 200,
    overflow: 'hidden',
  },
  legendMinimized: {
    width: 100,
    height: 40,
  },
  legendHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  legendTitle: {
    fontFamily: FONTS.SCANDIA.BOLD,
    fontWeight: 'bold',
    fontSize: 14,
    textAlign: 'center',
  },
  legendToggleButton: {
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
  },
  legendToggleText: {
    fontFamily: FONTS.SCANDIA.BOLD,
    fontSize: 16,
    fontWeight: 'bold',
    lineHeight: 20,
    textAlign: 'center',
  },
  legendContent: {
    padding: 10,
    maxHeight: 150,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 3,
  },
  legendColor: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 8,
  },
  legendText: {
    fontFamily: FONTS.SCANDIA.REGULAR,
    fontSize: 12,
  }
});

export default CrossPlatformMap;
