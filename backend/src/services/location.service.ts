const GEOCODING_API_URL =
  "https://geocoding-api.open-meteo.com/v1/search";

export interface LocationData {
  name: string;
  latitude: number;
  longitude: number;
  country: string;
  state?: string;
}

export async function searchLocation(
  city: string
): Promise<LocationData[]> {
  const url =
    `${GEOCODING_API_URL}?name=${encodeURIComponent(city)}` +
    `&count=5&language=en&format=json`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error("Location service is currently unavailable");
  }

  const data = await response.json();

  if (!data.results) {
    return [];
  }

  return data.results.map((location: any) => ({
    name: location.name,
    latitude: location.latitude,
    longitude: location.longitude,
    country: location.country,
    state: location.admin1,
  }));
}