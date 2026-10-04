import { describe, expect, it } from 'vitest';
import { extractWeatherFeatures } from '../intelligence/weatherFeatures';
import { analyzeWeatherRisks } from '../intelligence/riskEngine';
import type { CurrentWeather } from '../types';

const baseWeather: CurrentWeather = {
  city: 'Test City',
  state: '',
  country: 'India',
  temp: 22,
  feelsLike: 22,
  condition: 'Sunny',
  conditionCode: '0',
  humidity: 50,
  windSpeed: 10,
  windDirection: 'N',
  pressure: 1010,
  uvIndex: 5,
  visibility: 10,
  aqi: 40,
  aqiCategory: 'Good',
  dewPoint: 12,
  rainfall24h: 0,
  sunrise: '',
  sunset: '',
  lastUpdated: new Date().toISOString(),
};

describe('Weather Intelligence', () => {
  it('detects hot, humid and windy conditions', () => {
    const weather: CurrentWeather = {
      ...baseWeather,
      temp: 36,
      humidity: 90,
      windSpeed: 30,
    };

    const features = extractWeatherFeatures(weather);

    expect(features.isVeryHot).toBe(true);
    expect(features.isVeryHumid).toBe(true);
    expect(features.isWindy).toBe(true);
  });

  it('detects heavy rain and thunderstorm risk', () => {
    const weather: CurrentWeather = {
      ...baseWeather,
      condition: 'Thunderstorm',
      rainfall24h: 50,
    };

    const features = extractWeatherFeatures(weather);
    const analysis = analyzeWeatherRisks(weather, features);

    expect(features.isThunderstorm).toBe(true);
    expect(features.isHeavyRain).toBe(true);
    expect(analysis.overallLevel).toBe('extreme');
  });

  it('detects poor visibility', () => {
    const weather: CurrentWeather = {
      ...baseWeather,
      visibility: 2,
    };

    const features = extractWeatherFeatures(weather);
    const analysis = analyzeWeatherRisks(weather, features);

    expect(features.isPoorVisibility).toBe(true);
    expect(analysis.risks.some((risk) => risk.type === 'Visibility')).toBe(true);
  });

  it('reports low risk for normal weather', () => {
    const features = extractWeatherFeatures(baseWeather);
    const analysis = analyzeWeatherRisks(baseWeather, features);

    expect(analysis.overallLevel).toBe('low');
    expect(analysis.overallScore).toBe(0);
    expect(analysis.risks).toHaveLength(0);
  });
});