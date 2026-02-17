/**
 * Calculate the distance between two coordinates using the Haversine formula
 * Returns distance in meters
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000; // Earth's radius in meters
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return distance;
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Check if a location is within the allowed radius
 */
export function isWithinRadius(
  userLat: number,
  userLng: number,
  allowedLat: number,
  allowedLng: number,
  radius: number
): boolean {
  const distance = calculateDistance(userLat, userLng, allowedLat, allowedLng);
  return distance <= radius;
}

/**
 * Get user's current geolocation
 */
export async function getCurrentLocation(): Promise<{
  latitude: number;
  longitude: number;
} | null> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      console.warn("Geolocation is not supported by this browser");
      resolve(null);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      (error) => {
        // Handle different geolocation error types
        let errorMessage = "Unknown geolocation error";
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = "Geolocation permission denied by user";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = "Location information unavailable";
            break;
          case error.TIMEOUT:
            errorMessage = "Geolocation request timed out";
            break;
          default:
            errorMessage = `Geolocation error: ${error.message || "Unknown error"}`;
            break;
        }
        console.warn("Geolocation error:", errorMessage);
        resolve(null);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  });
}
