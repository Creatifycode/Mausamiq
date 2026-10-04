import type { LocationData } from '../types';
import { searchLocations } from './weatherApi';

/**
 * Resolves a curated UI location to real coordinates via the backend geocoding
 * service.
 *
 * Why this exists: `LOCATIONS` in src/data/mockData.ts is a UI concern — it has
 * an `id` and an `isDestination` flag but NO latitude/longitude. The weather
 * endpoint requires coordinates, and the brief is explicit that coordinates must
 * not be invented. So the city name from the existing curated list is sent to
 * `/api/location?city=...` and the coordinates come back from the backend.
 *
 * This does not add a second HTTP client: it calls `searchLocations()` from
 * src/services/weatherApi.ts, which remains the only fetch call site.
 */

export interface Coordinates {
  latitude: number;
  longitude: number;
}

/**
 * Successful resolutions only. A city resolves to the same coordinates for the
 * lifetime of the session, so repeat city switches must not re-hit the
 * geocoder (and must not re-render weather from a second network round-trip).
 */
const resolutionCache = new Map<string, Coordinates>();

const normalizeName = (value: string): string => value.trim().toLowerCase();

export async function resolveCoordinates(location: LocationData): Promise<Coordinates> {
  const cached = resolutionCache.get(location.id);
  if (cached) {
    return cached;
  }

  const results = await searchLocations(location.name);

  if (results.length === 0) {
    throw new Error(`No location match for "${location.name}"`);
  }

  // Prefer an exact name match so "Panaji" (curated, Goa) cannot silently
  // resolve to some other Panaji; otherwise trust the backend's own ranking.
  const target = normalizeName(location.name);
  const match = results.find((result) => normalizeName(result.name) === target) ?? results[0];

  const coordinates: Coordinates = {
    latitude: match.latitude,
    longitude: match.longitude,
  };

  resolutionCache.set(location.id, coordinates);

  return coordinates;
}

/** Test seam — clears memoised coordinates. */
export function clearCoordinateCache(): void {
  resolutionCache.clear();
}