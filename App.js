/**
 * Vehicle Tracker App
 * Cross-platform application for tracking vehicles in real-time
 */

import React, { useEffect, useState } from 'react';
import * as Font from 'expo-font';
import { 
  StyleSheet, 
  View, 
  Text, 
  SafeAreaView, 
  TouchableOpacity, 
  ActivityIndicator, 
  ScrollView,
  Dimensions
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import CrossPlatformMap from './components/CrossPlatformMap';
import BusList from './components/BusList';
import { getCurrentLocation, generateVehicleRoute } from './services/mapService';
import { connectToSocket, sendUserLocation, subscribeToVehicleUpdates, disconnectSocket, subscribeToConnectionStatus } from './utils/socketUtils';
import { MAP_CONFIG, FEATURES } from './config';
import { FONTS, FONT_STYLES } from './utils/fontUtils';

// Get screen dimensions
const { width, height } = Dimensions.get('window');

export default function App() {
  // App view mode: 'list' or 'map'
  const [viewMode, setViewMode] = useState('list');
  
  // State for user location
  const [userLocation, setUserLocation] = useState(null);
  
  // State for vehicles data
  const [vehicles, setVehicles] = useState([]);
  
  // State for selected vehicle
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  
  // State for route information
  const [routeInfo, setRouteInfo] = useState(null);
  
  // Loading state
  const [loading, setLoading] = useState(true);
  // Font loading state
  const [fontsLoaded, setFontsLoaded] = useState(false);

  // Load custom fonts
  useEffect(() => {
    async function loadFonts() {
      try {
        await Font.loadAsync({
          // OpenSans fonts
          [FONTS.OPEN_SANS.REGULAR]: require('./fonts/OpenSans/OpenSans-Regular.ttf'),
          [FONTS.OPEN_SANS.LIGHT]: require('./fonts/OpenSans/OpenSans-Light.ttf'),
          [FONTS.OPEN_SANS.SEMI_BOLD]: require('./fonts/OpenSans/OpenSans-Semibold.ttf'),
          [FONTS.OPEN_SANS.BOLD]: require('./fonts/OpenSans/OpenSans-Bold.ttf'),
          [FONTS.OPEN_SANS.EXTRA_BOLD]: require('./fonts/OpenSans/OpenSans-ExtraBold.ttf'),
          
          // Scandia fonts
          [FONTS.SCANDIA.REGULAR]: require('./fonts/Scandia/Scandia-Regular.otf'),
          [FONTS.SCANDIA.LIGHT]: require('./fonts/Scandia/Scandia-Light.otf'),
          [FONTS.SCANDIA.MEDIUM]: require('./fonts/Scandia/Scandia-Medium.otf'),
          [FONTS.SCANDIA.BOLD]: require('./fonts/Scandia/Scandia-Bold.otf'),
          
          // SimplonNorm fonts
          [FONTS.SIMPLON_NORM.REGULAR]: require('./fonts/SimplonNorm/SimplonNorm-Regular.otf'),
          [FONTS.SIMPLON_NORM.LIGHT]: require('./fonts/SimplonNorm/SimplonNorm-Light.otf'),
          [FONTS.SIMPLON_NORM.MEDIUM]: require('./fonts/SimplonNorm/SimplonNorm-Medium.otf'),
          [FONTS.SIMPLON_NORM.BOLD]: require('./fonts/SimplonNorm/SimplonNorm-Bold.otf'),
          
          // Arabic fonts
          [FONTS.ARABIC.MEDIUM]: require('./fonts/Arabic/sst-arabic/sst-arabic-medium.ttf'),
          [FONTS.ARABIC.ROMAN]: require('./fonts/Arabic/sst-arabic-roman/SSTArabicRoman.ttf'),
        });
        
        console.log('Fonts loaded successfully');
        setFontsLoaded(true);
      } catch (error) {
        console.error('Error loading fonts:', error);
        // Continue without custom fonts if there's an error
        setFontsLoaded(true);
      }
    }
    
    loadFonts();
  }, []);

  // State for connection status
  const [connectionStatus, setConnectionStatus] = useState('connecting');
  
  // Get user location and connect to socket server
  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Get user location
        const location = await getCurrentLocation();
        console.log('Got user location:', location);
        setUserLocation(location);
        
        // Connect to socket server with retry logic
        const socket = connectToSocket({
          // Add a timeout to detect connection issues faster
          timeout: 3000
        });
        
        // Track connection status
        const unsubscribeStatus = subscribeToConnectionStatus((status) => {
          console.log('Socket connection status:', status);
          setConnectionStatus(status);
          
          // If connected, send user location
          if (status === 'connected') {
            sendUserLocation(location);
          }
        });
        
        // Send user location to server
        if (socket && socket.connected) {
          sendUserLocation(location);
        } 
        
        // Always use mock data as a fallback
        if (FEATURES.USE_MOCK_DATA) {
          console.log('Using mock data, simulating user location send');
          // The mock socket will handle this in socketUtils.js
          setTimeout(() => sendUserLocation(location), 500);
        }
        
        // Subscribe to vehicle updates
        const unsubscribeVehicles = subscribeToVehicleUpdates((updatedVehicles) => {
          console.log('Received vehicle updates:', updatedVehicles.length, 'vehicles');
          
          if (updatedVehicles && updatedVehicles.length > 0) {
            // Create a new array with deep copies of each vehicle to ensure React detects the change
            const vehiclesCopy = updatedVehicles.map(vehicle => ({
              ...vehicle,
              // Create a new location object to ensure it's a new reference
              location: { ...vehicle.location }
            }));
            
            // Log the first vehicle's location for debugging
            if (vehiclesCopy.length > 0) {
              console.log('First vehicle location:', 
                vehiclesCopy[0].id, 
                vehiclesCopy[0].location.latitude.toFixed(6), 
                vehiclesCopy[0].location.longitude.toFixed(6)
              );
            }
            
            // Update the vehicles state
            setVehicles(vehiclesCopy);
            
            // If we have a selected vehicle, update its route info
            if (selectedVehicle) {
              const updatedSelectedVehicle = vehiclesCopy.find(v => v.id === selectedVehicle.id);
              if (updatedSelectedVehicle) {
                setSelectedVehicle(updatedSelectedVehicle);
              }
            }
          } else {
            console.warn('No vehicles received from update');
            
            // If no vehicles received, try to generate mock vehicles directly
            if (FEATURES.USE_MOCK_DATA) {
              console.log('Generating mock vehicles directly');
              const { generateMockVehicles } = require('./utils/socketUtils');
              const mockVehicles = generateMockVehicles(location);
              setVehicles(mockVehicles);
            }
          }
        });
        
        setLoading(false);
        
        // Clean up on unmount
        return () => {
          unsubscribeVehicles();
          unsubscribeStatus();
          disconnectSocket();
        };
      } catch (error) {
        console.error('Error initializing app:', error);
        // Fallback to default location
        setUserLocation(MAP_CONFIG.DEFAULT_REGION);
        setConnectionStatus('error');
        
        // Generate mock vehicles directly if there's an error
        if (FEATURES.USE_MOCK_DATA) {
          console.log('Generating mock vehicles after error');
          const { generateMockVehicles } = require('./utils/socketUtils');
          const mockVehicles = generateMockVehicles(MAP_CONFIG.DEFAULT_REGION);
          setVehicles(mockVehicles);
        }
        
        setLoading(false);
      }
    };
    
    initializeApp();
  }, []);

  // Handle vehicle selection from the list
  const handleSelectVehicleFromList = async (vehicle) => {
    // Find the vehicle in the vehicles array to ensure we have the latest data
    const updatedVehicle = vehicles.find(v => v.id === vehicle.id) || vehicle;
    setSelectedVehicle(updatedVehicle);
    
    // Generate route information
    if (updatedVehicle && userLocation) {
      try {
        // Generate vehicle route
        let newRouteInfo = await generateVehicleRoute(updatedVehicle, userLocation);
        
        // Ensure vehicleId is set in routeInfo
        newRouteInfo = {
          ...newRouteInfo,
          vehicleId: updatedVehicle.id
        };
        
        // If we have route coordinates, fetch the path from user location to start point
        if (newRouteInfo && newRouteInfo.route && newRouteInfo.route.coordinates && 
            newRouteInfo.route.coordinates.length > 0) {
          
          // Import the fetchDirections function from mapService
          const { fetchDirections } = require('./services/mapService');
          
          // Fetch directions from user location to route start
          const userToStartDirections = await fetchDirections(
            userLocation,
            newRouteInfo.route.coordinates[0]
          );
          
          // Add the path to the route info
          if (userToStartDirections && userToStartDirections.coordinates) {
            newRouteInfo.userToStartPath = userToStartDirections.coordinates;
          }
        }
        
        console.log('Generated route info for vehicle:', updatedVehicle.id, newRouteInfo);
        setRouteInfo(newRouteInfo);
      } catch (error) {
        console.error('Error generating route:', error);
      }
    }
    
    setViewMode('map');
  };
  
  // Handle back button press from map view
  const handleBackToList = () => {
    setViewMode('list');
  };
  
  // Handle vehicle selection on the map
  const handleSelectVehicle = async (vehicle) => {
    // Find the vehicle in the vehicles array to ensure we have the latest data
    const updatedVehicle = vehicles.find(v => v.id === vehicle.id) || vehicle;
    setSelectedVehicle(updatedVehicle);
    
    // Generate route information
    if (updatedVehicle && userLocation) {
      try {
        // Generate vehicle route
        let newRouteInfo = await generateVehicleRoute(updatedVehicle, userLocation);
        
        // Ensure vehicleId is set in routeInfo
        newRouteInfo = {
          ...newRouteInfo,
          vehicleId: updatedVehicle.id
        };
        
        // If we have route coordinates, fetch the path from user location to start point
        if (newRouteInfo && newRouteInfo.route && newRouteInfo.route.coordinates && 
            newRouteInfo.route.coordinates.length > 0) {
          
          // Import the fetchDirections function from mapService
          const { fetchDirections } = require('./services/mapService');
          
          // Fetch directions from user location to route start
          const userToStartDirections = await fetchDirections(
            userLocation,
            newRouteInfo.route.coordinates[0]
          );
          
          // Add the path to the route info
          if (userToStartDirections && userToStartDirections.coordinates) {
            newRouteInfo.userToStartPath = userToStartDirections.coordinates;
          }
        }
        
        console.log('Generated route info for vehicle:', updatedVehicle.id, newRouteInfo);
        setRouteInfo(newRouteInfo);
      } catch (error) {
        console.error('Error generating route:', error);
      }
    }
  };

  // Show loading screen while getting location or fonts are loading
  if (loading || !fontsLoaded) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading Shuttles...</Text>
          <ActivityIndicator size="large" color="#008cff" style={{ marginTop: 20 }} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>Mobily's Shuttle </Text>
          <Text style={styles.subtitle}>
            Real-time Mobily's Shuttle Monitoring
          </Text>
        </View>
        
        {/* Connection status indicator */}
        <View style={[
          styles.connectionIndicator, 
          { backgroundColor: connectionStatus === 'connected' ? '#2ecc71' : 
                            connectionStatus === 'connecting' ? '#f39c12' : '#e74c3c' }
        ]}>
          <Text style={styles.connectionText}>
            {connectionStatus === 'connected' ? 'Connected' : 
             connectionStatus === 'connecting' ? 'Connecting...' : 'Connection Error'}
          </Text>
        </View>
      </View>
      
      {viewMode === 'list' ? (
        // Bus List View
        <View style={styles.contentContainer}>
          <View style={styles.listHeaderContainer}>
            <Text style={styles.listHeaderTitle}>All Shuttles</Text>
          </View>
          
          <BusList 
            vehicles={vehicles}
            onSelectVehicle={handleSelectVehicleFromList}
          />
        </View>
      ) : (
        // Map View
        <ScrollView style={styles.contentContainer} contentContainerStyle={styles.mapContentContainer}>
          {/* Back button */}
          <TouchableOpacity 
            style={styles.backButton}
            onPress={handleBackToList}
          >
            <Text style={styles.backButtonText}>← Back to List</Text>
          </TouchableOpacity>
          
          {/* Map container */}
          <View style={styles.mapContainer}>
            <CrossPlatformMap
              location={userLocation}
              vehicles={vehicles}
              onSelectVehicle={handleSelectVehicle}
              routeInfo={routeInfo}
            />
          </View>
          
          {/* Vehicle details panel */}
          {selectedVehicle && (
            <View style={styles.vehicleDetailsPanel}>
              <View style={styles.vehicleDetailsPanelHeader}>
                <View style={styles.vehicleHeaderLeft}>
                  <Text style={styles.vehicleName}>{selectedVehicle.name}</Text>
                  <View style={styles.vehicleBadge}>
                    <Text style={styles.vehicleBadgeText}>{selectedVehicle.type || 'bus'}</Text>
                  </View>
                </View>
                
                <View style={styles.vehicleStats}>
                  <View style={styles.vehicleStatItem}>
                    <Text style={styles.vehicleStatLabel}>Speed</Text>
                    <Text style={styles.vehicleStatValue}>{(selectedVehicle.speed || 0).toFixed(1)} km/h</Text>
                  </View>
                  
                  <View style={styles.vehicleStatItem}>
                    <Text style={styles.vehicleStatLabel}>Stops</Text>
                    <Text style={styles.vehicleStatValue}>{selectedVehicle.stops || 0}</Text>
                  </View>
                </View>
              </View>
              
              {routeInfo && routeInfo.route && (
                <View style={styles.routeInfoContainer}>
                  <View style={styles.routeInfoRow}>
                    <View style={styles.routeInfoItem}>
                      <Text style={styles.routeInfoLabel}>Distance</Text>
                      <Text style={styles.routeInfoValue}>
                        {routeInfo.route.distance.toFixed(1)} km
                      </Text>
                    </View>
                    
                    <View style={styles.routeInfoItem}>
                      <Text style={styles.routeInfoLabel}>Duration</Text>
                      <Text style={styles.routeInfoValue}>
                        {Math.round(routeInfo.route.duration)} min
                      </Text>
                    </View>
                  </View>
                  
                  <View style={styles.routeEndpointsContainer}>
                    <View style={styles.routeEndpointItem}>
                      <View style={[styles.routeEndpointDot, { backgroundColor: '#2ecc71' }]} />
                      <Text style={styles.routeEndpointText}>
                        {routeInfo.route.startName || 'Start'}
                      </Text>
                    </View>
                    
                    <View style={styles.routeEndpointItem}>
                      <View style={[styles.routeEndpointDot, { backgroundColor: '#e74c3c' }]} />
                      <Text style={styles.routeEndpointText}>
                        {routeInfo.route.endName || 'End'}
                      </Text>
                    </View>
                  </View>
                </View>
              )}
            </View>
          )}
        </ScrollView>
      )}
      
      <StatusBar style="light" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 0,
    width: '100%',
    maxWidth: '100%',
    marginHorizontal: 0,
  },
  mapContentContainer: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  loadingText: {
    fontFamily: FONTS.SCANDIA.MEDIUM,
    fontSize: 20,
    textAlign: 'center',
    color: '#008cff',
    fontWeight: '500',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 24, // Increased vertical padding
    paddingHorizontal: 28, // Increased horizontal padding
    backgroundColor: '#008cff',
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    width: '100%',
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontFamily: FONTS.SCANDIA.REGULAR,
    fontSize: 32,
    fontWeight: 'normal',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  subtitle: {
    fontFamily: FONTS.SCANDIA.REGULAR,
    fontSize: 16,
    marginTop: 6,
    color: 'rgba(255, 255, 255, 0.9)',
    letterSpacing: 0.3,
  },
  contentContainer: {
    flex: 1,
    padding: 0,
    width: '100%',
    marginTop: 12, // Added spacing between blue header and content
    backgroundColor: '#FFFFFF',
  },
  listHeaderContainer: {
    marginBottom: 20,
    paddingHorizontal: 20,
    marginTop: 8, // Added spacing at the top
  },
  listHeaderTitle: {
    fontFamily: FONTS.SCANDIA.REGULAR,
    fontSize: 24,
    fontWeight: 'normal',
    color: '#000000',
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  listHeaderSubtitle: {
    fontFamily: FONTS.SCANDIA.REGULAR,
    fontSize: 16,
    color: '#000000',
    letterSpacing: 0.3,
  },
  backButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(0, 140, 255, 0.1)',
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 16,
    marginLeft: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  backButtonText: {
    fontFamily: FONTS.SCANDIA.MEDIUM,
    color: '#008cff',
    fontWeight: '600',
    fontSize: 16,
  },
  mapContainer: {
    flex: 1,
    height: 450,
    borderRadius: 0,
    overflow: 'hidden',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    width: '100%',
    marginHorizontal: -16,
  },
  vehicleDetailsPanel: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  vehicleDetailsPanelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  vehicleHeaderLeft: {
    flex: 1,
  },
  vehicleName: {
    fontFamily: FONTS.SCANDIA.REGULAR,
    fontSize: 22,
    fontWeight: 'normal',
    color: '#000000',
    marginBottom: 8,
  },
  vehicleBadge: {
    backgroundColor: '#008cff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: 'flex-start',
  },
  vehicleBadgeText: {
    fontFamily: FONTS.SCANDIA.REGULAR,
    color: 'white',
    fontWeight: 'normal',
    fontSize: 12,
    textTransform: 'uppercase',
  },
  vehicleStats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
    marginLeft: 16,
  },
  vehicleStatItem: {
    alignItems: 'center',
    marginLeft: 16,
    marginBottom: 8,
  },
  vehicleStatLabel: {
    fontFamily: FONTS.SCANDIA.REGULAR,
    fontSize: 12,
    color: '#000000',
    marginBottom: 4,
  },
  vehicleStatValue: {
    fontFamily: FONTS.SCANDIA.REGULAR,
    fontSize: 16,
    fontWeight: 'normal',
    color: '#000000',
  },
  routeInfoContainer: {
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
    padding: 16,
  },
  routeInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    flexWrap: 'wrap',
  },
  routeInfoItem: {
    alignItems: 'center',
    marginHorizontal: 16,
    marginVertical: 8,
  },
  routeInfoLabel: {
    fontFamily: FONTS.SCANDIA.REGULAR,
    fontSize: 14,
    color: '#000000',
    marginBottom: 4,
  },
  routeInfoValue: {
    fontFamily: FONTS.SCANDIA.REGULAR,
    fontSize: 18,
    fontWeight: 'normal',
    color: '#000000',
  },
  routeEndpointsContainer: {
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#EEEEEE',
    paddingTop: 12,
  },
  routeEndpointItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  routeEndpointDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 10,
  },
  routeEndpointText: {
    fontFamily: FONTS.SCANDIA.REGULAR,
    fontSize: 14,
    color: '#000000',
  },
  connectionIndicator: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginLeft: 10,
    alignSelf: 'flex-start',
  },
  connectionText: {
    fontFamily: FONTS.SCANDIA.REGULAR,
    color: 'white',
    fontWeight: 'normal',
    fontSize: 12,
    textTransform: 'uppercase',
  },
});
