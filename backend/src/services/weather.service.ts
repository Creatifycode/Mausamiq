const WEATHER_API_URL =
  "https://api.open-meteo.com/v1/forecast";

const AIR_QUALITY_API_URL =
  "https://air-quality-api.open-meteo.com/v1/air-quality";

// Get current weather
export async function getWeather(lat: number, lon: number) {
  const weatherUrl =
    `${WEATHER_API_URL}` +
    `?latitude=${lat}` +
    `&longitude=${lon}` +
    `&current=` +
    `temperature_2m,relative_humidity_2m,apparent_temperature,` +
    `wind_speed_10m,wind_direction_10m,precipitation,weather_code,` +
    `surface_pressure,visibility,uv_index,dew_point_2m` +
    `&daily=sunrise,sunset,precipitation_sum` +
    `&timezone=auto`;

  const airQualityUrl =
    `${AIR_QUALITY_API_URL}` +
    `?latitude=${lat}` +
    `&longitude=${lon}` +
    // US EPA AQI (us_aqi) rather than european_aqi: the frontend thresholds in
    // suitabilityCalculators.ts / personalizationEngine.ts (>100, >150, >200)
    // and the aqiCategory labels are all defined on the US EPA scale. Requesting
    // us_aqi keeps the wire field name `aqi` unchanged, so no frontend change
    // is needed beyond treating the value as US EPA.
    `&current=us_aqi,pm2_5` +
    `&timezone=auto`;

  const [weatherResponse, airQualityResponse] =
    await Promise.all([
      fetch(weatherUrl),
      fetch(airQualityUrl),
    ]);

  if (!weatherResponse.ok) {
    throw new Error("Weather service is currently unavailable");
  }

  if (!airQualityResponse.ok) {
    throw new Error("Air quality service is currently unavailable");
  }

  const data = await weatherResponse.json();
  const airQualityData = await airQualityResponse.json();

  if (!data.current) {
    throw new Error("Current weather data is not available");
  }

  if (!data.daily) {
    throw new Error("Daily weather data is not available");
  }

  if (!airQualityData.current) {
    throw new Error("Air quality data is not available");
  }

  return {
    temperature: data.current.temperature_2m,
    apparentTemperature: data.current.apparent_temperature,
    humidity: data.current.relative_humidity_2m,

    windSpeed: data.current.wind_speed_10m,
    windDirection: data.current.wind_direction_10m,

    precipitation: data.current.precipitation,
    weatherCode: data.current.weather_code,

    pressure: data.current.surface_pressure,
    visibility: data.current.visibility,
    uvIndex: data.current.uv_index,
    dewPoint: data.current.dew_point_2m,

    sunrise: data.daily.sunrise?.[0],
    sunset: data.daily.sunset?.[0],

    rainfall24h: data.daily.precipitation_sum?.[0] ?? 0,

    // US EPA AQI. Field name intentionally stays `aqi` so the frontend
    // contract is unchanged; only the underlying scale is now US EPA.
    aqi: airQualityData.current.us_aqi,
    pm25: airQualityData.current.pm2_5,
  };
}

// Get weather forecast (daily + upcoming hourly, from the single forecast endpoint)
export async function getForecast(lat: number, lon: number) {
  const url =
    `${WEATHER_API_URL}` +
    `?latitude=${lat}` +
    `&longitude=${lon}` +
    `&daily=temperature_2m_max,temperature_2m_min,` +
    `precipitation_probability_max,weather_code` +
    // Hourly fields below are the ONLY ones the existing HourlyForecastCard
    // renders (time, temperature, precipitation probability, condition). The
    // card does not display humidity, wind speed or UV, so those are not
    // requested and not sent.
    `&hourly=temperature_2m,precipitation_probability,weather_code` +
    // 7 days of daily values, but only the next 24 hours of hourly values.
    // `forecast_hours` anchors the hourly window to the current hour, so index 0
    // is "now" and the frontend can take an upcoming window without having to
    // compare local timestamps against the browser's timezone.
    `&forecast_days=7` +
    `&forecast_hours=24` +
    `&timezone=auto`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error("Forecast service is currently unavailable");
  }

  const data = await response.json();

  if (!data.daily) {
    throw new Error("Forecast data is not available");
  }

  // Hourly is additive: this endpoint already existed for daily data, and the
  // frontend reads `hourly` defensively, so a provider that omits it still
  // yields a usable daily forecast rather than a 500.
  const hourly = data.hourly;

  return {
    dates: data.daily.time,
    maxTemperature: data.daily.temperature_2m_max,
    minTemperature: data.daily.temperature_2m_min,
    precipitationProbability:
      data.daily.precipitation_probability_max,
    weatherCode: data.daily.weather_code,

    hourly: hourly
      ? {
          times: hourly.time,
          temperature: hourly.temperature_2m,
          precipitationProbability: hourly.precipitation_probability,
          weatherCode: hourly.weather_code,
        }
      : null,
  };
}