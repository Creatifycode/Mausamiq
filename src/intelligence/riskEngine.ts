import type { CurrentWeather } from '../types';
import type { WeatherFeatures } from './weatherFeatures';

export type RiskLevel = 'low' | 'moderate' | 'high' | 'extreme';

export interface WeatherRisk {
  type: string;
  level: RiskLevel;
  score: number;
  reason: string;
}

export interface RiskAnalysis {
  overallLevel: RiskLevel;
  overallScore: number;
  risks: WeatherRisk[];
  summary: string;
}

export const analyzeWeatherRisks = (
  weather: CurrentWeather,
  features: WeatherFeatures
): RiskAnalysis => {
  const risks: WeatherRisk[] = [];

  if (features.isThunderstorm) {
    risks.push({
      type: 'Thunderstorm',
      level: 'extreme',
      score: 90,
      reason: 'Thunderstorm conditions can make outdoor activities unsafe.',
    });
  }

  if (features.isHeavyRain) {
    risks.push({
      type: 'Rain',
      level: weather.rainfall24h >= 40 ? 'high' : 'moderate',
      score: weather.rainfall24h >= 40 ? 75 : 50,
      reason: `Recent precipitation is ${weather.rainfall24h.toFixed(1)} mm.`,
    });
  }

  if (features.isVeryHot) {
    risks.push({
      type: 'Heat',
      level: weather.temp >= 40 ? 'extreme' : 'high',
      score: weather.temp >= 40 ? 90 : 70,
      reason: `Temperature is ${weather.temp}°C.`,
    });
  } else if (features.isHot) {
    risks.push({
      type: 'Heat',
      level: 'moderate',
      score: 40,
      reason: `Temperature is ${weather.temp}°C.`,
    });
  }

  if (features.isWindy) {
    risks.push({
      type: 'Wind',
      level: weather.windSpeed >= 40 ? 'high' : 'moderate',
      score: weather.windSpeed >= 40 ? 70 : 45,
      reason: `Wind speed is ${weather.windSpeed} km/h.`,
    });
  }

  if (features.isDenseFog) {
    risks.push({
      type: 'Visibility',
      level: 'high',
      score: 80,
      reason: `Visibility is only ${weather.visibility} km.`,
    });
  } else if (features.isPoorVisibility) {
    risks.push({
      type: 'Visibility',
      level: 'moderate',
      score: 45,
      reason: `Visibility is ${weather.visibility} km.`,
    });
  }

  if (features.isHighUv) {
    risks.push({
      type: 'UV',
      level: weather.uvIndex >= 11 ? 'high' : 'moderate',
      score: weather.uvIndex >= 11 ? 70 : 45,
      reason: `UV index is ${weather.uvIndex}.`,
    });
  }

  if (features.isPoorAirQuality) {
    risks.push({
      type: 'Air Quality',
      level: weather.aqi >= 200 ? 'high' : 'moderate',
      score: weather.aqi >= 200 ? 75 : 45,
      reason: `AQI is ${weather.aqi}.`,
    });
  }

  const overallScore =
    risks.length === 0
      ? 0
      : Math.max(...risks.map((risk) => risk.score));

  const overallLevel: RiskLevel =
    overallScore >= 85
      ? 'extreme'
      : overallScore >= 65
        ? 'high'
        : overallScore >= 40
          ? 'moderate'
          : 'low';

  const summary =
    risks.length === 0
      ? 'No significant weather risks detected.'
      : `${risks.length} weather risk${risks.length > 1 ? 's' : ''} detected.`;

  return {
    overallLevel,
    overallScore,
    risks,
    summary,
  };
};