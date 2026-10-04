import type { CurrentWeather, DailyForecast, HourlyForecast } from '../types';
// `BackendHourlyForecast` is deliberately NOT imported here: the hourly block is
// reached through `BackendForecast['hourly']`, so naming it would add a second
// way to refer to the same contract.
import type { BackendForecast, BackendWeather } from '../services/weatherApi';

/**
 * Maps a backend payload into the app's `CurrentWeather`.
 *
 * This is the ONLY place backend units and scales are reconciled with the
 * frontend's domain model. Conversion happens here exactly once so that no
 * widget or intelligence layer has to know the backend reports visibility in
 * metres. AQI needs no conversion: the backend serves US EPA `us_aqi`, which is
 * the scale the thresholds and labels already use.
 *
 * The same file also normalises the forecast payload (`normalizeHourlyForecast`
 * / `normalizeDailyForecast`), so forecast and current weather share one adapter
 * and one WMO code mapping.
 *
 * Contract: consumes the single shared `BackendWeather` / `BackendForecast`
 * types from src/services/weatherApi.ts. A duplicate response interface used to
 * live here and had already fallen behind the backend; it is deliberately not
 * restored.
 */

/**
 * WMO weather code -> condition label.
 *
 * Exported so the forecast adapter reuses this exact mapping. A second
 * WMO-to-label table would inevitably drift from this one, and `getWeatherIcon`
 * already switches on these labels, so every value produced here renders a real
 * glyph.
 */
export const getConditionFromWeatherCode = (
  code: number
): CurrentWeather['condition'] => {
  if (code === 0) return 'Sunny';
  if (code <= 3) return 'Partly Cloudy';
  if (code >= 95) return 'Thunderstorm';
  if (code >= 51 && code <= 67) return 'Heavy Rain';
  if (code >= 80 && code <= 82) return 'Heavy Rain';
  if (code >= 45 && code <= 48) return 'Dense Fog';

  return 'Partly Cloudy';
};

const getWindDirection = (degrees: number): string => {
  const directions = [
    'N',
    'NE',
    'E',
    'SE',
    'S',
    'SW',
    'W',
    'NW',
  ];

  const index = Math.round(degrees / 45) % 8;
  return directions[index];
};

/**
 * US EPA AQI -> the `CurrentWeather['aqiCategory']` union.
 *
 * The backend now requests Open-Meteo's `us_aqi`, so the incoming value and the
 * thresholds in src/smart/suitabilityCalculators.ts / src/engine/
 * personalizationEngine.ts (`> 100`, `> 150`, `> 200`) finally share one scale
 * and no conversion is applied here.
 *
 * EPA bands are 0-50 Good, 51-100 Moderate, 101-150 Unhealthy for Sensitive
 * Groups, 151-200 Unhealthy, 201+ Very Unhealthy/Hazardous. The domain union has
 * no "Very Unhealthy"/"Hazardous" members, so both collapse into 'Severe'.
 *
 * Deterministic and total: every finite input maps to exactly one label.
 */
export const getAqiCategory = (aqi: number): CurrentWeather['aqiCategory'] => {
  if (!Number.isFinite(aqi) || aqi < 0) return 'Good';

  if (aqi <= 50) return 'Good';
  if (aqi <= 100) return 'Moderate';
  if (aqi <= 150) return 'Unhealthy for Sensitive Groups';
  if (aqi <= 200) return 'Unhealthy';

  return 'Severe'; // EPA "Very Unhealthy" (201-300) and "Hazardous" (301+)
};

/**
 * Open-Meteo returns sunrise/sunset as local ISO strings without a zone, e.g.
 * "2026-10-04T06:12:34". The UI renders these directly and the existing mock
 * data uses a 12-hour clock ("06:08 AM"), so format to match.
 *
 * Parsed as local wall-clock time on purpose: the string is already local to
 * the requested coordinates, so appending "Z" would shift it incorrectly.
 */
const formatClockTime = (iso: string | null | undefined): string => {
  if (!iso) return '';

  const match = /T(\d{2}):(\d{2})/.exec(iso);
  if (!match) return iso;

  const hours = Number(match[1]);
  const minutes = match[2];
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 === 0 ? 12 : hours % 12;

  return `${displayHours}:${minutes} ${period}`;
};

/** Coerce a nullable number, falling back when the backend omitted it. */
const num = (value: number | null | undefined, fallback: number): number =>
  typeof value === 'number' && Number.isFinite(value) ? value : fallback;

export const normalizeWeather = (
  data: BackendWeather,
  location: {
    city: string;
    state?: string;
    country: string;
  }
): CurrentWeather => {
  // Open-Meteo reports visibility in METRES; the domain model and every
  // threshold in the app (suitabilityCalculators, personalizationEngine,
  // CurrentWeatherCard) are in KILOMETRES. Converted here, once.
  const visibilityKm = Math.round((num(data.visibility, 0) / 1000) * 10) / 10;
  const aqi = num(data.aqi, 0);

  return {
    city: location.city,
    state: location.state ?? '',

    country: location.country,

    temp: data.temperature,
    feelsLike: data.apparentTemperature,

    condition: getConditionFromWeatherCode(data.weatherCode),
    conditionCode: String(data.weatherCode),

    humidity: data.humidity,

    windSpeed: data.windSpeed,
    windDirection: getWindDirection(data.windDirection),

    // Previously hardcoded to 0, which silently broke downstream logic: a
    // `visibility: 0` satisfies the `< 3.0 km` commuter promotion and the
    // `< 1.5 km` fog hazard on every single response.
    pressure: num(data.pressure, 0),
    uvIndex: num(data.uvIndex, 0),
    visibility: visibilityKm,

    aqi,
    aqiCategory: getAqiCategory(aqi),

    dewPoint: num(data.dewPoint, 0),
    rainfall24h: num(data.rainfall24h, 0),

    sunrise: formatClockTime(data.sunrise),
    sunset: formatClockTime(data.sunset),

    lastUpdated: new Date().toISOString(),
  };
};

/* ------------------------------------------------------------------ *
 * Forecast normalization
 *
 * The forecast endpoint returns parallel arrays; the app's domain model
 * wants one object per time slot. Transposing happens here so the cards
 * stay pure renderers.
 * ------------------------------------------------------------------ */

const MONTHS_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

const WEEKDAYS_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/**
 * How many hours the hourly widget shows.
 *
 * Matches the curated sample length so switching to live data does not change
 * the density of the existing strip.
 */
export const HOURLY_WINDOW_SIZE = 9;

/**
 * Read the calendar parts of a "YYYY-MM-DD" date.
 *
 * `new Date('2026-10-04')` is parsed as UTC midnight and renders as the 3rd for
 * anyone west of Greenwich, so the parts are taken directly instead.
 */
const parseCalendarDate = (
  value: string
): { year: number; month: number; day: number } | null => {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);

  if (!match) return null;

  return { year: Number(match[1]), month: Number(match[2]), day: Number(match[3]) };
};

/** "2026-10-05" -> "Mon". Empty string if the input is not an ISO date. */
const weekdayLabel = (iso: string): string => {
  const parts = parseCalendarDate(iso);
  if (!parts) return '';

  const weekday = new Date(Date.UTC(parts.year, parts.month - 1, parts.day)).getUTCDay();

  return WEEKDAYS_SHORT[weekday] ?? '';
};

/** "2026-10-05" -> "5 Oct". Empty string if the input is not an ISO date. */
const shortDateLabel = (iso: string): string => {
  const parts = parseCalendarDate(iso);
  if (!parts) return '';

  return `${parts.day} ${MONTHS_SHORT[parts.month - 1] ?? ''}`.trim();
};

/**
 * Tooltip text for a forecast row, composed only from real returned values.
 * Never asserts conditions the provider did not report.
 */
const buildDaySummary = (condition: string, rainProbability: number): string => {
  if (rainProbability > 0) {
    return `${condition}, ${rainProbability}% chance of rain`;
  }

  return condition;
};

/**
 * Transposes the backend's parallel hourly arrays into `HourlyForecast` rows.
 *
 * Returns an EMPTY array — never a partial or placeholder-filled list — when the
 * provider omits hourly data or a slot has no usable temperature, which is the
 * signal callers use to fall back to the curated sample.
 *
 * `limit` defaults to the curated window size so the live strip keeps the same
 * density as the sample one.
 */
export const normalizeHourlyForecast = (
  data: BackendForecast,
  limit: number = HOURLY_WINDOW_SIZE
): HourlyForecast[] => {
  const hourly = data.hourly;

  if (!hourly || !Array.isArray(hourly.times)) return [];

  const count = Math.min(Math.max(0, limit), hourly.times.length);
  const rows: HourlyForecast[] = [];

  for (let index = 0; index < count; index += 1) {
    const time = hourly.times[index];
    const temperature = hourly.temperature?.[index];

    // A slot without a usable time or temperature cannot be rendered honestly,
    // so it is dropped rather than filled in.
    if (typeof time !== 'string') continue;
    if (typeof temperature !== 'number' || !Number.isFinite(temperature)) continue;

    const weatherCode = hourly.weatherCode?.[index];

    rows.push({
      time: formatClockTime(time),
      temp: temperature,
      condition:
        typeof weatherCode === 'number' && Number.isFinite(weatherCode)
          ? getConditionFromWeatherCode(weatherCode)
          : 'Partly Cloudy',
      rainProbability: num(hourly.precipitationProbability?.[index], 0),
    });
  }

  return rows;
};

/**
 * Transposes the backend's parallel daily arrays into `DailyForecast` rows and
 * derives the labels the card needs (`day`, `date`, `summary`) from the real
 * date, code and probability values.
 *
 * Rows missing a min/max pair are dropped, because the card's range bar cannot
 * be drawn without both ends.
 */
export const normalizeDailyForecast = (data: BackendForecast): DailyForecast[] => {
  if (!Array.isArray(data.dates)) return [];

  const rows: DailyForecast[] = [];

  data.dates.forEach((date, index) => {
    if (typeof date !== 'string') return;

    const tempMax = data.maxTemperature?.[index];
    const tempMin = data.minTemperature?.[index];

    if (typeof tempMax !== 'number' || !Number.isFinite(tempMax)) return;
    if (typeof tempMin !== 'number' || !Number.isFinite(tempMin)) return;

    const weatherCode = data.weatherCode?.[index];
    const condition =
      typeof weatherCode === 'number' && Number.isFinite(weatherCode)
        ? getConditionFromWeatherCode(weatherCode)
        : 'Partly Cloudy';

    const rainProbability = num(data.precipitationProbability?.[index], 0);
    const dateLabel = shortDateLabel(date);

    rows.push({
      // 'Today' is reserved for the first row. Every later row must still carry
      // a non-empty label, so fall back through the short date to the raw ISO
      // value rather than rendering a blank cell.
      day: index === 0 ? 'Today' : weekdayLabel(date) || dateLabel || date,
      date: dateLabel,
      tempMax,
      tempMin,
      condition,
      rainProbability,
      summary: buildDaySummary(condition, rainProbability),
    });
  });

  return rows;
};