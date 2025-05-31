/**
 * NativeMarker Component
 * Marker implementation for native platforms (iOS/Android) using react-native-maps
 */

import React from 'react';
import { Marker } from 'react-native-maps';
import { Image, Platform } from 'react-native';

/**
 * NativeMarker Component
 * 
 * @param {Object} props - Component props
 * @param {Object} props.coordinate - Marker coordinate {latitude, longitude}
 * @param {string} props.title - Marker title
 * @param {string} props.description - Marker description
 * @param {string} props.pinColor - Marker pin color
 * @param {Function} props.onPress - Callback when marker is pressed
 * @param {number} props.heading - Direction the vehicle is heading (0-360 degrees)
 * @param {string} props.vehicleType - Type of vehicle ('bus' or 'shuttle')
 */
const NativeMarker = ({
  coordinate,
  title,
  description,
  pinColor = 'red',
  onPress,
  heading,
  vehicleType,
  ...otherProps
}) => {
  // Validate coordinate to prevent crashes
  if (!coordinate || typeof coordinate.latitude !== 'number' || typeof coordinate.longitude !== 'number') {
    console.warn(`Invalid coordinate for marker "${title}":`, coordinate);
    return null; // Don't render the marker if coordinate is invalid
  }
  
  // Log marker rendering for debugging
  // console.log(`Rendering marker for ${title}:`, {
  //   coordinate,
  //   vehicleType,
  //   heading
  // });
  // Get marker color based on pinColor
  const getMarkerColor = () => {
    switch(pinColor) {
      case 'blue': return '#008cff';
      case 'orange': return '#FF8C00';
      case 'yellow': return '#FFD700';
      case 'green': return '#2ecc71';
      case 'red': 
      default: return '#FF0000';
    }
  };
  
  // Determine if this is a vehicle marker
  // Only consider it a vehicle if vehicleType is explicitly set
  // This prevents route start/end markers from showing vehicle icons
  const isVehicle = vehicleType === 'bus' || vehicleType === 'shuttle';
  
  // Determine vehicle type
  const isBus = vehicleType === 'bus' || (isVehicle && !vehicleType && !title.toLowerCase().includes('shuttle'));
  const isShuttle = vehicleType === 'shuttle' || (isVehicle && title.toLowerCase().includes('shuttle'));
  
  // For Android, use custom markers with rotation for vehicles
  if (Platform.OS === 'android') {
    // Log marker details for debugging
    if (isVehicle) {
      // console.log('Rendering vehicle marker:', {
      //   title,
      //   coordinate,
      //   isVehicle,
      //   vehicleType,
      //   heading
      // });
    }
    
    // Use different marker approach for Android
    return (
      <Marker
        coordinate={coordinate}
        title={title}
        description={description}
        onPress={onPress ? () => onPress() : undefined}
        tracksViewChanges={true} // Force tracking view changes on Android
        key={`${coordinate.latitude.toFixed(6)}-${coordinate.longitude.toFixed(6)}`} // Use fixed precision for stable keys
        // Use different icons based on vehicle type
        icon={
          isBus ? require('../assets/icon-bus.png') : 
          isShuttle ? require('../assets/icon-bus.png') : 
          null
        }
        // Apply rotation if heading is provided and this is a vehicle
        rotation={isVehicle && heading ? heading : 0}
        anchor={isVehicle ? { x: 0.5, y: 0.5 } : null}
        pinColor={!isVehicle ? pinColor : null} // Use pinColor only for non-vehicle markers
        zIndex={isVehicle ? 2 : 1} // Make vehicle markers appear on top
        {...otherProps}
      />
    );
  }
  
  // For iOS, use custom markers with rotation for vehicles
  if (Platform.OS === 'ios') {
    if (isVehicle) {
      // Log marker details for debugging
      console.log('Rendering iOS vehicle marker:', {
        title,
        coordinate,
        isVehicle,
        vehicleType,
        heading
      });
      
      return (
        <Marker
          coordinate={coordinate}
          title={title}
          description={description}
          onPress={onPress ? () => onPress() : undefined}
          // Use different icons based on vehicle type
          image={
            isBus ? require('../assets/icon-bus.png') : 
            isShuttle ? require('../assets/icon-bus.png') : 
            null
          }
          // Apply rotation if heading is provided
          rotation={heading || 0}
          anchor={{ x: 0.5, y: 0.5 }}
          key={`${coordinate.latitude.toFixed(6)}-${coordinate.longitude.toFixed(6)}`} // Use fixed precision for stable keys
          {...otherProps}
        />
      );
    }
    
    // For non-vehicle markers on iOS, use the default marker with pinColor
    return (
      <Marker
        coordinate={coordinate}
        title={title}
        description={description}
        pinColor={pinColor}
        onPress={onPress ? () => onPress() : undefined}
        {...otherProps}
      />
    );
  }
  
  // For other platforms, use the default marker with pinColor
  return (
    <Marker
      coordinate={coordinate}
      title={title}
      description={description}
      pinColor={pinColor}
      onPress={onPress ? () => onPress() : undefined}
      {...otherProps}
    />
  );
};

export default NativeMarker;
