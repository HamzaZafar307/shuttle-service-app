/**
 * BusList Component
 * Displays a list of available buses
 */

import React from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  FlatList, 
  TouchableOpacity, 
  Platform 
} from 'react-native';
import { FONTS, FONT_STYLES } from '../utils/fontUtils';
import { BUS_ROUTES } from '../config';

/**
 * Get route endpoints based on routeId
 * 
 * @param {string} routeId - Route ID
 * @returns {Object} Object with start and end points
 */
const getRouteEndpoints = (routeId) => {
  // Find the route data for this routeId
  const routeData = BUS_ROUTES.find(r => r.id === routeId);
  
  if (routeData) {
    return {
      start: routeData.startPoint,
      end: routeData.endPoint
    };
  }
  
  return {
    start: 'Unknown',
    end: 'Unknown'
  };
};

/**
 * BusList Component
 * 
 * @param {Object} props - Component props
 * @param {Array} props.vehicles - Array of vehicle objects
 * @param {Function} props.onSelectVehicle - Callback when a vehicle is selected
 */
const BusList = ({ vehicles = [], onSelectVehicle }) => {
  // Render each bus item
  const renderBusItem = ({ item, index }) => {
    // Determine the bus type icon emoji
    const busIconEmoji = '🚌';
    
    // Get route endpoints if not available in the vehicle data
    const routeEndpoints = item.routeId ? getRouteEndpoints(item.routeId) : { start: 'Unknown', end: 'Unknown' };
    const startPoint = item.startPoint || routeEndpoints.start;
    const endPoint = item.endPoint || routeEndpoints.end;
    
    return (
      <TouchableOpacity
        style={styles.busItemContainer}
        onPress={() => onSelectVehicle(item)}
        activeOpacity={0.7}
      >
        <View style={[styles.busItem, { backgroundColor: '#008cff' }]}>
          <View style={styles.busIconContainer}>
            <Text style={styles.busIconEmoji}>{busIconEmoji}</Text>
          </View>
          
          <View style={styles.busInfoContainer}>
            <Text style={styles.busName}>Bus {index + 1}</Text>
            
            <View style={styles.routeInfoContainer}>
              <Text style={styles.routeInfoText}>
                {startPoint} → {endPoint}
              </Text>
            </View>
          </View>
          
          <View style={styles.busActionContainer}>
            <Text style={styles.viewDetailsText}>View Route</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };
  
  // If no vehicles, show a message
  if (!vehicles || vehicles.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No buses available</Text>
        <Text style={styles.emptySubtext}>Please try again later</Text>
      </View>
    );
  }
  
  return (
    <FlatList
      data={vehicles}
      renderItem={renderBusItem}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.listContainer}
      showsVerticalScrollIndicator={false}
    />
  );
};

const styles = StyleSheet.create({
  listContainer: {
    padding: 0,
    paddingBottom: 32,
    width: '100%',
  },
  busItemContainer: {
    marginBottom: 16,
    marginHorizontal: 16,
    borderRadius: 12,
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    width: 'auto',
  },
  busItem: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 4, // Added spacing between blue and white
  },
  busIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  busIconEmoji: {
    fontSize: 24,
  },
  busInfoContainer: {
    flex: 1,
  },
  busName: {
    fontFamily: FONTS.SCANDIA.REGULAR, // Changed to match the title font
    fontSize: 18,
    // fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  routeInfoContainer: {
    marginBottom: 8,
  },
  routeInfoText: {
    fontFamily: FONTS.SCANDIA.REGULAR,
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    letterSpacing: 0.3,
  },
  busActionContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  viewDetailsText: {
    fontFamily: FONTS.SCANDIA.REGULAR,
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textDecorationLine: 'underline',
    letterSpacing: 0.3,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontFamily: FONTS.SCANDIA.BOLD,
    fontSize: 18,
    // fontWeight: 'bold',
    color: '#000000',
    marginBottom: 8,
  },
  emptySubtext: {
    fontFamily: FONTS.SCANDIA.REGULAR,
    fontSize: 14,
    color: '#000000',
    textAlign: 'center',
  },
});

export default BusList;
