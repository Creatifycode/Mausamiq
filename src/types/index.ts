export type PersonaId = 
  | 'fitness'
  | 'traveler'
  | 'commuter'
  | 'agriculture'
  | 'event'
  | 'health'
  | 'beach'
  | 'family';

export interface PersonaProfile {
  id: PersonaId;
  name: string;
  shortDesc: string;
  iconName: string;
  tagline: string;
  accentColor: string;
  primaryMetrics: string[];
  sampleRecommendation: string;
}

export type AlertSeverity = 'minor' | 'moderate' | 'severe' | 'extreme';

export interface WeatherAlert {
  id: string;
  title: string;
  severity: AlertSeverity;
  category: 'heatwave' | 'thunderstorm' | 'flood' | 'fog' | 'cyclone' | 'air_quality';
  headline: string;
  description: string;
  instruction: string;
  issuedAt: string;
  effectiveUntil: string;
}

export interface CurrentWeather {
  city: string;
  state: string;
  country: string;
  temp: number; // in Celsius
  feelsLike: number;
  condition: 'Sunny' | 'Partly Cloudy' | 'Thunderstorm' | 'Heavy Rain' | 'Dense Fog' | 'Extreme Heat';
  conditionCode: string;
  humidity: number; // percentage
  windSpeed: number; // km/h
  windDirection: string;
  pressure: number; // hPa
  uvIndex: number;
  visibility: number; // km
  aqi: number; // Air Quality Index
  aqiCategory: 'Good' | 'Moderate' | 'Unhealthy for Sensitive Groups' | 'Unhealthy' | 'Severe';
  dewPoint: number;
  rainfall24h: number; // mm
  sunrise: string;
  sunset: string;
  lastUpdated: string;
}

export interface HourlyForecast {
  time: string; // e.g. "06:00 AM"
  temp: number;
  condition: string;
  rainProbability: number;
  /**
   * Optional because the forecast endpoint only supplies the four fields above —
   * the hourly widget renders none of these. The curated sample data still sets
   * them, so both sources satisfy this type without inventing values.
   */
  humidity?: number;
  windSpeed?: number;
  uvIndex?: number;
}

export interface DailyForecast {
  day: string; // e.g. "Today", "Mon", "Tue"
  date: string;
  tempMax: number;
  tempMin: number;
  condition: string;
  rainProbability: number;
  summary: string;
}

export type WidgetId =
  | 'safety_alert'
  | 'current_weather'
  | 'persona_suitability'
  | 'best_time_window'
  | 'hourly_forecast'
  | 'daily_forecast'
  | 'commuter_advisory'
  | 'traveler_comparison'
  | 'agriculture_insights'
  | 'health_environment'
  | 'beach_coastal'
  | 'event_planner'
  | 'family_outdoor';

export interface SuitabilityMetric {
  score: number; // 0 to 100
  label: string; // e.g. "Excellent", "Fair", "Hazardous"
  status: 'optimal' | 'moderate' | 'warning' | 'danger';
  summary: string;
  keyFactors: { name: string; impact: 'positive' | 'negative' | 'neutral'; detail: string }[];
  bestWindow?: { start: string; end: string; note: string };
  actionTips: string[];
}

export interface PrioritizedWidget {
  id: WidgetId;
  title: string;
  category: 'safety' | 'core' | 'smart_persona' | 'forecast';
  priorityScore: number;
  reason: string;
  isSafetyOverride: boolean;
}

export interface LocationData {
  id: string;
  name: string;
  state: string;
  isDestination?: boolean;
}
