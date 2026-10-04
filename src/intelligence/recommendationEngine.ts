import type { PersonaId, CurrentWeather } from '../types';
import type { RiskAnalysis } from './riskEngine';

export type RecommendationStatus =
  | 'recommended'
  | 'conditional'
  | 'not_recommended';

export interface WeatherRecommendation {
  status: RecommendationStatus;
  title: string;
  recommendation: string;
  reason: string;
  score: number;
  actionTips: string[];
}

export const generateRecommendation = (
  personaId: PersonaId,
  weather: CurrentWeather,
  riskAnalysis: RiskAnalysis
): WeatherRecommendation => {
  const { overallLevel, overallScore, risks } = riskAnalysis;

  if (overallLevel === 'extreme') {
    return {
      status: 'not_recommended',
      title: 'Avoid outdoor activity',
      recommendation:
        'Outdoor activity is not recommended under the current conditions.',
      reason:
        risks[0]?.reason ??
        'Severe weather conditions have been detected.',
      score: Math.max(0, 100 - overallScore),
      actionTips: [
        'Consider staying indoors.',
        'Check weather conditions again before going outside.',
      ],
    };
  }

  if (overallLevel === 'high') {
    return {
      status: 'not_recommended',
      title: 'Use extra caution',
      recommendation:
        'Consider postponing or modifying outdoor plans until conditions improve.',
      reason:
        risks[0]?.reason ??
        'Significant weather risks have been detected.',
      score: Math.max(0, 100 - overallScore),
      actionTips: [
        'Consider choosing a safer time.',
        'Monitor weather conditions before heading outside.',
      ],
    };
  }

  if (overallLevel === 'moderate') {
    return {
      status: 'conditional',
      title: 'Suitable with precautions',
      recommendation: getPersonaRecommendation(personaId, weather),
      reason:
        risks[0]?.reason ??
        'Some weather factors may affect your activity.',
      score: Math.max(0, 100 - overallScore),
      actionTips: [
        'Take appropriate precautions for the weather.',
        'Stay aware of changing conditions.',
      ],
    };
  }

  return {
    status: 'recommended',
    title: 'Good conditions',
    recommendation: getPersonaRecommendation(personaId, weather),
    reason: 'No significant weather risks were detected.',
    score: 100,
    actionTips: [
      'Current conditions are generally favorable.',
      'Continue monitoring the forecast if you plan to stay outdoors for a long time.',
    ],
  };
};

const getPersonaRecommendation = (
  personaId: PersonaId,
  weather: CurrentWeather
): string => {
  switch (personaId) {
    case 'fitness':
      return weather.temp > 28
        ? 'Outdoor exercise is possible, but consider a shorter or lighter workout.'
        : 'Good conditions for outdoor exercise.';

    case 'traveler':
      return 'Travel plans can proceed, while keeping an eye on changing weather conditions.';

    case 'commuter':
      return 'Commuting conditions are generally manageable. Allow extra time if conditions change.';

    case 'agriculture':
      return 'Conditions are generally suitable for agricultural activities.';

    case 'event':
      return 'Outdoor events are generally suitable under the current conditions.';

    case 'health':
      return 'Outdoor activity is generally suitable, with normal weather precautions.';

    case 'beach':
      return 'Beach activities are generally suitable under the current conditions.';

    case 'family':
      return 'Outdoor family activities are generally suitable under the current conditions.';

    default:
      return 'Conditions are generally suitable for outdoor activity.';
  }
};