const DEFAULT_TRAVEL_INFO = { time: 'N/A', distance: 'N/A' };
const ROAD_DISTANCE_FACTOR = 1.3;
const AVERAGE_TRAVEL_MPH = 35;
const EARTH_RADIUS_MILES = 3958.8;

export const getGoogleMapsUrl = (address) => (
  address ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}` : ''
);

export const getGoogleMapsEmbedUrl = (address) => (
  address ? `https://www.google.com/maps?q=${encodeURIComponent(address)}&output=embed` : ''
);

const getCurrentPosition = () => new Promise((resolve, reject) => {
  if (!navigator.geolocation) {
    reject(new Error('Geolocation not supported'));
    return;
  }

  navigator.geolocation.getCurrentPosition(resolve, reject, {
    enableHighAccuracy: false,
    timeout: 10000,
    maximumAge: 300000,
  });
});

const geocodeAddress = async (address) => {
  const response = await fetch(
    `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`,
    { headers: { Accept: 'application/json' } }
  );
  const results = await response.json();

  if (!Array.isArray(results) || results.length === 0) {
    return null;
  }

  return {
    lat: parseFloat(results[0].lat),
    lng: parseFloat(results[0].lon),
  };
};

const toRad = (deg) => (deg * Math.PI) / 180;

const calculateStraightLineMiles = (origin, destination) => {
  const dLat = toRad(destination.lat - origin.lat);
  const dLng = toRad(destination.lng - origin.lng);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(origin.lat)) * Math.cos(toRad(destination.lat)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);

  return EARTH_RADIUS_MILES * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const formatDistance = (miles) => {
  if (miles < 1) {
    return `${(miles * 5280).toFixed(0)} ft`;
  }

  return miles < 100 ? `${miles.toFixed(1)} miles` : `${Math.round(miles)} miles`;
};

const formatTravelTime = (minutes) => {
  if (minutes < 1) {
    return '< 1 min';
  }

  if (minutes < 60) {
    return `${minutes} min`;
  }

  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours} hr ${mins} min` : `${hours} hr`;
};

export const getEstimatedTravelInfo = async (address) => {
  if (!address) {
    return DEFAULT_TRAVEL_INFO;
  }

  const position = await getCurrentPosition();
  const destination = await geocodeAddress(address);

  if (!destination || Number.isNaN(destination.lat) || Number.isNaN(destination.lng)) {
    return DEFAULT_TRAVEL_INFO;
  }

  const origin = {
    lat: position.coords.latitude,
    lng: position.coords.longitude,
  };
  const roadMiles = calculateStraightLineMiles(origin, destination) * ROAD_DISTANCE_FACTOR;
  const totalMinutes = Math.round((roadMiles / AVERAGE_TRAVEL_MPH) * 60);

  return {
    time: formatTravelTime(totalMinutes),
    distance: formatDistance(roadMiles),
  };
};
