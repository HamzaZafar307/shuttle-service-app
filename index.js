/**
 * Vehicle Tracker App Entry Point
 */

import { registerRootComponent } from 'expo';
import { LogBox, Platform, NativeModules } from 'react-native';

import App from './App';

// Create a mock implementation of the RNMapsAirModule
const mockRNMapsAirModule = {
  create: () => {},
  animateToRegion: () => {},
  animateToCoordinate: () => {},
  fitToElements: () => {},
  fitToSuppliedMarkers: () => {},
  fitToCoordinates: () => {},
  setMapBoundaries: () => {},
  takeSnapshot: () => Promise.resolve(''),
  pointForCoordinate: () => Promise.resolve({ x: 0, y: 0 }),
  coordinateForPoint: () => Promise.resolve({ latitude: 0, longitude: 0 }),
};

// Safely handle the native module registration
if (Platform.OS !== 'web') {
  // Only set the module if it doesn't already exist
  if (!NativeModules.RNMapsAirModule) {
    try {
      // Use Object.defineProperty to avoid conflicts
      Object.defineProperty(NativeModules, 'RNMapsAirModule', {
        value: mockRNMapsAirModule,
        writable: false,
        configurable: true
      });
    } catch (error) {
      console.warn('Failed to register mock RNMapsAirModule:', error);
    }
  }
}

// Ignore specific warnings that might be related to third-party libraries
LogBox.ignoreLogs([
  'Require cycle:',
  'Remote debugger',
  'Unrecognized WebSocket',
  'Non-serializable values were found in the navigation state',
  'Possible Unhandled Promise Rejection',
  'Sending `onAnimatedValueUpdate`',
  'TurboModuleRegistry',
  'RNMapsAirModule',
  'Invariant Violation',
  'Unable to deserialize cloned data',
  // Add any other warnings that should be ignored
]);

// Register the root component
// This ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
