import { describe, expect, it } from 'vitest';
import { generateRecommendation } from '../intelligence/recommendationEngine';
import type { CurrentWeather } from '../types';
import type { RiskAnalysis } from '../intelligence/riskEngine';

const weather: CurrentWeather = {
  city: 'Test City',
  state: '',
  country: 'India',
  temp: 24,
  feelsLike: 24,
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

describe('Recommendation Engine', () => {
  it('recommends activity when risk is low', () => {
    const riskAnalysis: RiskAnalysis = {
      overallLevel: 'low',
      overallScore: 0,
      risks: [],
      summary: 'No significant weather risks detected.',
    };

    const result = generateRecommendation(
      'fitness',
      weather,
      riskAnalysis
    );

    expect(result.status).toBe('recommended');
    expect(result.score).toBe(100);
  });

  it('does not recommend activity during extreme risk', () => {
    const riskAnalysis: RiskAnalysis = {
      overallLevel: 'extreme',
      overallScore: 90,
      risks: [
        {
          type: 'Thunderstorm',
          level: 'extreme',
          score: 90,
          reason: 'Thunderstorm conditions detected.',
        },
      ],
      summary: '1 weather risk detected.',
    };

    const result = generateRecommendation(
      'fitness',
      weather,
      riskAnalysis
    );

    expect(result.status).toBe('not_recommended');
    expect(result.score).toBe(10);
  });

  it('returns conditional recommendation for moderate risk', () => {
    const riskAnalysis: RiskAnalysis = {
      overallLevel: 'moderate',
      overallScore: 45,
      risks: [
        {
          type: 'UV',
          level: 'moderate',
          score: 45,
          reason: 'UV index is high.',
        },
      ],
      summary: '1 weather risk detected.',
    };

    const result = generateRecommendation(
      'traveler',
      weather,
      riskAnalysis
    );

    expect(result.status).toBe('conditional');
    expect(result.score).toBe(55);
  });
});