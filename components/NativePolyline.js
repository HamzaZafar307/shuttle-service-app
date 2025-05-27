/**
 * NativePolyline Component
 * Polyline implementation for native platforms (iOS/Android) using react-native-maps
 */

import React from 'react';
import { Polyline } from 'react-native-maps';

/**
 * NativePolyline Component
 * 
 * @param {Object} props - Component props
 * @param {Array} props.coordinates - Array of coordinates [{latitude, longitude}, ...]
 * @param {string} props.strokeColor - Polyline stroke color
 * @param {number} props.strokeWidth - Polyline stroke width
 * @param {number} props.strokeOpacity - Polyline stroke opacity
 * @param {Array} props.lineDashPattern - Polyline dash pattern [dash, gap, ...]
 */
const NativePolyline = ({
  coordinates,
  strokeColor = '#000',
  strokeWidth = 3,
  strokeOpacity = 1,
  lineDashPattern,
  ...otherProps
}) => {
  return (
    <Polyline
      coordinates={coordinates}
      strokeColor={strokeColor}
      strokeWidth={strokeWidth}
      strokeOpacity={strokeOpacity}
      lineDashPattern={lineDashPattern}
      {...otherProps}
    />
  );
};

export default NativePolyline;
