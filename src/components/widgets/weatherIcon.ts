import {
  CloudFog,
  CloudLightning,
  CloudRain,
  CloudSun,
  Cloudy,
  Flame,
  Sun,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

/**
 * Single condition-to-icon mapping shared by the current, hourly and daily
 * widgets so the same condition always renders the same glyph.
 * CurrentWeather.condition is a fixed union; the forecast conditions are plain
 * strings, so a few extra cases are handled and anything unknown falls back.
 */
export function getWeatherIcon(condition: string): LucideIcon {
  switch (condition) {
    case 'Thunderstorm':
      return CloudLightning;
    case 'Heavy Rain':
    case 'Light Rain':
      return CloudRain;
    case 'Dense Fog':
    case 'Haze':
    case 'Smoke':
      return CloudFog;
    case 'Extreme Heat':
      return Flame;
    case 'Cloudy':
    case 'Overcast':
      return Cloudy;
    case 'Partly Cloudy':
    case 'Mostly Cloudy':
      return CloudSun;
    case 'Sunny':
    case 'Clear':
    default:
      return Sun;
  }
}

/** Standard UV index bands, used to label the existing uvIndex value. */
export function getUvBand(uvIndex: number): string {
  if (uvIndex >= 11) return 'Extreme';
  if (uvIndex >= 8) return 'Very high';
  if (uvIndex >= 6) return 'High';
  if (uvIndex >= 3) return 'Moderate';
  return 'Low';
}
