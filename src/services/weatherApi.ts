/**
 * MausamIQ Backend API client — the single entry point to the Express backend.
 *
 * Every network call in the app goes through here. Widgets and components must
 * never call `fetch` directly, and there is deliberately no second weather
 * client: `BackendWeather` below is the ONE authoritative description of the
 * backend payload, and `normalizeWeather()` (src/data/weatherAdapter.ts)
 * consumes that same type.
 *
 * Endpoint map (backend/src/server.ts):
 *   GET /api/weather?lat=&lon=   -> { success, data: BackendWeather }
 *   GET /api/weather/forecast     -> { success, data: BackendForecast }  (daily + hourly)
 *   GET /api/location?city=       -> { success, data: LocationSearchResult[] }
 *
 * SOURCE UNITS — these are Open-Meteo defaults, asserted against
 * backend/src/services/weather.service.ts. Do not re-convert downstream.
 *   temperature / apparentTemperature / dewPoint : degrees Celsius
 *   humidity                                     : percent
 *   windSpeed                                    : km/h   (wind_speed_10m default)
 *   windDirection                                : degrees (0 = North)
 *   precipitation / rainfall24h                  : mm
 *   pressure                                     : hPa    (surface_pressure)
 *   visibility                                   : METRES  <-- not km
 *   uvIndex                                      : dimensionless
 *   aqi                                          : US EPA AQI (0..500), backend now
 *                                                 requests `us_aqi` from Open-Meteo
 *   pm25                                         : ug/m3
 *   weatherCode                                  : WMO code
 *   sunrise / sunset                             : local ISO strings, no zone
 */
const API_BASE_URL = 'http://localhost:5000';

/**
 * Raw current-weather payload exactly as the backend returns it.
 *
 * Fields the backend can legitimately omit are typed as optional-nullable,
 * because Open-Meteo omits individual keys (notably `visibility` and
 * `uv_index`) depending on station coverage. The adapter is responsible for
 * degrading these safely; the client only reports the truth about the wire.
 */
export interface BackendWeather {
  temperature: number;
  apparentTemperature: number;
  humidity: number;

  windSpeed: number;
  windDirection: number;

  /** Current precipitation, mm. Not represented in CurrentWeather. */
  precipitation: number;
  weatherCode: number;

  pressure: number;
  /** METRES. Convert to km exactly once, in the adapter. */
  visibility?: number | null;
  uvIndex?: number | null;
  dewPoint?: number | null;

  /** Local ISO datetime strings, e.g. "2026-10-04T06:12". */
  sunrise?: string | null;
  sunset?: string | null;

  /** Daily precipitation_sum for today, mm. */
  rainfall24h: number;

  /**
   * US EPA AQI, as returned by the backend from Open-Meteo's `us_aqi`.
   *
   * This is the scale the frontend thresholds (`> 100`, `> 150`, `> 200`) and
   * the `aqiCategory` labels were always written against, so the two sides now
   * agree without any conversion.
   */
  aqi?: number | null;
  /** PM2.5 in ug/m3. */
  pm25?: number | null;
}

/** Parallel-array block the backend returns for the upcoming hours. */
export interface BackendHourlyForecast {
  /** Local ISO datetime strings, e.g. "2026-10-04T14:00". Index 0 is the current hour. */
  times: string[];
  temperature: (number | null)[];
  precipitationProbability: (number | null)[];
  weatherCode: (number | null)[];
}

/**
 * Raw forecast payload.
 *
 * Daily values arrive as parallel arrays indexed by day, not as objects, and are
 * transposed by the adapter. Hourly is the same shape and is `null` when the
 * upstream provider omits it, so consumers must treat it as optional.
 *
 * Only the fields the existing forecast cards actually render are requested —
 * see the note in backend/src/services/weather.service.ts.
 */
export interface BackendForecast {
  dates: string[];
  maxTemperature: (number | null)[];
  minTemperature: (number | null)[];
  precipitationProbability: (number | null)[];
  weatherCode: (number | null)[];

  /** Upcoming hourly block, or `null` when unavailable. */
  hourly: BackendHourlyForecast | null;
}

/**
 * Dedicated DTO for /api/location results.
 *
 * This is intentionally NOT the app's `LocationData` (src/types/index.ts).
 * `LocationData` models a curated UI dropdown entry (`id`, `isDestination`);
 * this models a geocoding hit, which carries coordinates the UI type has no
 * field for and lacks the `id` the UI depends on. Keeping them separate avoids
 * forcing either shape into the other.
 */
export interface LocationSearchResult {
  name: string;
  latitude: number;
  longitude: number;
  country: string;
  state?: string;
}

/** Envelope every backend route wraps its payload in. */
interface ApiEnvelope<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Single shared request helper — the only `fetch` call site in the app.
 * Unwraps the `{ success, data }` envelope and normalises errors.
 */
async function request<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`);

  if (!response.ok) {
    throw new Error(`MausamIQ backend request failed (${response.status}) for ${path}`);
  }

  const result = (await response.json()) as ApiEnvelope<T>;

  if (!result.success || result.data === undefined) {
    throw new Error(result.error || 'MausamIQ backend returned an unsuccessful response');
  }

  return result.data;
}

export async function fetchCurrentWeather(lat: number, lon: number): Promise<BackendWeather> {
  return request<BackendWeather>(`/api/weather?lat=${lat}&lon=${lon}`);
}

/**
 * Daily AND hourly forecast from the single `/api/weather/forecast` endpoint.
 * Parallel arrays are transposed by the adapter in src/data/weatherAdapter.ts.
 */
export async function fetchForecast(lat: number, lon: number): Promise<BackendForecast> {
  return request<BackendForecast>(`/api/weather/forecast?lat=${lat}&lon=${lon}`);
}

/** City search / geocoding. See `LocationSearchResult` for why this is its own DTO. */
export async function searchLocations(city: string): Promise<LocationSearchResult[]> {
  return request<LocationSearchResult[]>(
    `/api/location?city=${encodeURIComponent(city)}`
  );
}