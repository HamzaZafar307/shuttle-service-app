/**
 * Font Utilities
 * Provides functions for font management and loading
 */

// Define font families
export const FONTS = {
  // OpenSans font family
  OPEN_SANS: {
    REGULAR: 'OpenSans-Regular',
    LIGHT: 'OpenSans-Light',
    SEMI_BOLD: 'OpenSans-Semibold',
    BOLD: 'OpenSans-Bold',
    EXTRA_BOLD: 'OpenSans-ExtraBold',
  },
  // Scandia font family
  SCANDIA: {
    REGULAR: 'Scandia-Regular',
    LIGHT: 'Scandia-Light',
    MEDIUM: 'Scandia-Medium',
    BOLD: 'Scandia-Bold',
  },
  // SimplonNorm font family
  SIMPLON_NORM: {
    REGULAR: 'SimplonNorm-Regular',
    LIGHT: 'SimplonNorm-Light',
    MEDIUM: 'SimplonNorm-Medium',
    BOLD: 'SimplonNorm-Bold',
  },
  // Arabic font family
  ARABIC: {
    MEDIUM: 'sst-arabic-medium',
    ROMAN: 'SSTArabicRoman',
  }
};

// Font styles for different text elements
export const FONT_STYLES = {
  // Headings
  H1: {
    fontFamily: FONTS.SCANDIA.BOLD,
    fontSize: 32,
    letterSpacing: 0.5,
  },
  H2: {
    fontFamily: FONTS.SCANDIA.MEDIUM,
    fontSize: 24,
    letterSpacing: 0.3,
  },
  H3: {
    fontFamily: FONTS.SCANDIA.MEDIUM,
    fontSize: 20,
    letterSpacing: 0.2,
  },
  
  // Body text
  BODY_LARGE: {
    fontFamily: FONTS.SCANDIA.REGULAR,
    fontSize: 18,
  },
  BODY: {
    fontFamily: FONTS.SCANDIA.REGULAR,
    fontSize: 16,
  },
  BODY_SMALL: {
    fontFamily: FONTS.SCANDIA.REGULAR,
    fontSize: 14,
  },
  
  // Labels and buttons
  LABEL: {
    fontFamily: FONTS.SCANDIA.MEDIUM,
    fontSize: 14,
    letterSpacing: 0.2,
  },
  BUTTON: {
    fontFamily: FONTS.SCANDIA.BOLD,
    fontSize: 16,
    letterSpacing: 0.5,
  },
  
  // Special text
  CAPTION: {
    fontFamily: FONTS.SCANDIA.REGULAR,
    fontSize: 12,
  },
  SUBTITLE: {
    fontFamily: FONTS.SCANDIA.REGULAR,
    fontSize: 16,
    letterSpacing: 0.3,
  }
};
