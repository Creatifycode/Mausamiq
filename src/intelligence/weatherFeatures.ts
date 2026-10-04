import type { CurrentWeather } from '../types';

export interface WeatherFeatures {
  isHot: boolean;
  isVeryHot: boolean;
  isCold: boolean;
  isHumid: boolean;
  isVeryHumid: boolean;
  isWindy: boolean;
  isHeavyRain: boolean;
  isThunderstorm: boolean;
  isPoorVisibility: boolean;
  isDenseFog: boolean;
  isHighUv: boolean;
  isPoorAirQuality: boolean;
}

export const extractWeatherFeatures = (
  weather: CurrentWeather
): WeatherFeatures => {
  const condition = weather.condition.toLowerCase();

  return {
    isHot: weather.temp >= 28,
    isVeryHot: weather.temp >= 35,

    isCold: weather.temp <= 10,

    isHumid: weather.humidity >= 70,
    isVeryHumid: weather.humidity >= 85,

    isWindy: weather.windSpeed >= 25,

    isHeavyRain:
      condition.includes('heavy rain') ||
      weather.rainfall24h >= 20,

    isThunderstorm:
      condition.includes('thunderstorm'),

    isPoorVisibility:
      weather.visibility > 0 && weather.visibility < 4,

    isDenseFog:
      condition.includes('dense fog') ||
      (weather.visibility > 0 && weather.visibility < 1),

    isHighUv:
      weather.uvIndex >= 8,

    isPoorAirQuality:
      weather.aqi >= 100,
  };
};