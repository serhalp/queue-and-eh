interface GeoData {
  country: string | null
  countryName: string | null
}

declare global {
  interface Window {
    __GEO_DATA__?: GeoData
  }
}

/**
 * Composable to access geo location data injected by the geo middleware edge function
 * @returns Reactive geo data state
 */
export const useGeo = () => {
  const geoState = useState<GeoData | null>('geo', () => null)
  
  // Check for geo data on client side and update state if needed
  if (import.meta.client && typeof window !== 'undefined') {
    console.log('[useGeo] Checking for geo data on client');
    
    if (window.__GEO_DATA__ && !geoState.value) {
      console.log('[useGeo] Geo data found, updating state:', window.__GEO_DATA__);
      geoState.value = window.__GEO_DATA__;
    } else if (!window.__GEO_DATA__) {
      console.log('[useGeo] No geo data available on window');
    } else {
      console.log('[useGeo] Geo data already in state:', geoState.value);
    }
  } else {
    console.log('[useGeo] Running on server side');
  }
  
  return geoState
}

/**
 * Get a formatted location string from geo data
 * @param geo - Geo data object
 * @returns Formatted location string
 */
export const formatLocation = (geo: GeoData | null): string => {
  if (!geo) return 'Unknown location';
  
  const parts = [];
  if (geo.countryName) parts.push(geo.countryName);
  
  return parts.length > 0 ? parts.join(', ') : 'Unknown location';
}

/**
 * Check if user is from a specific country
 * @param countryCode - ISO country code (e.g., 'US', 'CA', 'GB')
 * @returns Boolean indicating if user is from the specified country
 */
export const isFromCountry = (countryCode: string): boolean => {
  const geo = useGeo();
  return geo.value?.country?.toUpperCase() === countryCode.toUpperCase();
}
