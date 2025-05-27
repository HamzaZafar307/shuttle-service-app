/**
 * Empty Module
 * 
 * This is an empty module used as a replacement for native-only modules in web builds.
 * It provides mock implementations of the required modules to prevent errors.
 */

// For react-native-maps
const mockMapView = () => null;
mockMapView.Marker = () => null;
mockMapView.Polyline = () => null;
mockMapView.Polygon = () => null;
mockMapView.Circle = () => null;
mockMapView.Callout = () => null;
mockMapView.PROVIDER_GOOGLE = 'google';
mockMapView.PROVIDER_DEFAULT = 'default';

// Export the mock implementations
module.exports = {
  default: mockMapView,
  Marker: mockMapView.Marker,
  Polyline: mockMapView.Polyline,
  Polygon: mockMapView.Polygon,
  Circle: mockMapView.Circle,
  Callout: mockMapView.Callout,
  PROVIDER_GOOGLE: mockMapView.PROVIDER_GOOGLE,
  PROVIDER_DEFAULT: mockMapView.PROVIDER_DEFAULT,
  // Add any other components that might be needed
};

// For other native modules, add mock implementations as needed
