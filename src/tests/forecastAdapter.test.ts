import { describe, expect, it } from 'vitest';
import { CloudFog, CloudLightning, CloudRain, CloudSun, Sun } from 'lucide-react';
import {
  getConditionFromWeatherCode,
  normalizeDailyForecast,
  normalizeHourlyForecast,
  HOURLY_WINDOW_SIZE,
} from '../data/weatherAdapter';
import { getWeatherIcon } from '../components/widgets/weatherIcon';
import type { BackendForecast } from '../services/weatherApi';

/**
 * The forecast endpoint returns parallel arrays; the domain model wants one
 * object per slot. These suites pin the transposition, the shared WMO code
 * mapping, and — most importantly — the empty-array signal the forecast cards
 * rely on to fall back to curated data.
 */

const dailyPayload = (
  overrides: Partial<BackendForecast> = {}
): BackendForecast => ({
  dates: ['2026-10-04', '2026-10-05'],
  maxTemperature: [32, 30],
  minTemperature: [22, 21],
  precipitationProbability: [65, 80],
  weatherCode: [3, 95],
  hourly: null,
  ...overrides,
});

const hourlyPayload = (
  times: string[],
  overrides: Partial<BackendForecast['hourly']> = {}
): BackendForecast =>
  dailyPayload({
    hourly: {
      times,
      temperature: times.map((_, index) => 20 + index),
      precipitationProbability: times.map((_, index) => index * 10),
      weatherCode: times.map(() => 0),
      ...overrides,
    },
  });

describe('normalizeHourlyForecast', () => {
  it('transposes the parallel arrays into one row per hour', () => {
    const rows = normalizeHourlyForecast(hourlyPayload(['2026-10-04T14:00', '2026-10-04T15:00']));

    expect(rows).toHaveLength(2);
    expect(rows[0]).toEqual({
      time: '2:00 PM',
      temp: 20,
      condition: 'Sunny',
      rainProbability: 0,
    });
    expect(rows[1]?.temp).toBe(21);
    expect(rows[1]?.rainProbability).toBe(10);
  });

  it('formats times with the shared clock formatter used for sunrise/sunset', () => {
    const rows = normalizeHourlyForecast(
      hourlyPayload(['2026-10-04T00:00', '2026-10-04T09:00', '2026-10-04T12:00'])
    );

    expect(rows.map((row) => row.time)).toEqual(['12:00 AM', '9:00 AM', '12:00 PM']);
  });

  it('reuses the single WMO code mapping rather than inventing labels', () => {
    const rows = normalizeHourlyForecast(
      hourlyPayload(['2026-10-04T10:00', '2026-10-04T11:00'], {
        weatherCode: [95, 45],
      })
    );

    expect(rows[0]?.condition).toBe('Thunderstorm');
    expect(rows[1]?.condition).toBe('Dense Fog');
  });

  it('limits the window to the curated strip size by default', () => {
    const times = Array.from({ length: 24 }, (_, index) =>
      `2026-10-04T${String(index).padStart(2, '0')}:00`
    );

    const rows = normalizeHourlyForecast(hourlyPayload(times));

    expect(HOURLY_WINDOW_SIZE).toBe(9);
    expect(rows).toHaveLength(HOURLY_WINDOW_SIZE);
  });

  it('honours an explicit limit without exceeding what the provider returned', () => {
    const times = ['2026-10-04T10:00', '2026-10-04T11:00', '2026-10-04T12:00'];

    expect(normalizeHourlyForecast(hourlyPayload(times), 2)).toHaveLength(2);
    expect(normalizeHourlyForecast(hourlyPayload(times), 99)).toHaveLength(3);
  });

  it('returns an empty array when the provider sent no hourly block', () => {
    expect(normalizeHourlyForecast(dailyPayload())).toEqual([]);
  });

  it('drops slots with no usable temperature instead of rendering a placeholder', () => {
    const rows = normalizeHourlyForecast(
      hourlyPayload(['2026-10-04T10:00', '2026-10-04T11:00'], {
        temperature: [null, 24],
      })
    );

    expect(rows).toHaveLength(1);
    expect(rows[0]?.time).toBe('11:00 AM');
    expect(rows[0]?.temp).toBe(24);
  });

  it('treats a missing precipitation probability as zero rather than NaN', () => {
    const rows = normalizeHourlyForecast(
      hourlyPayload(['2026-10-04T10:00'], { precipitationProbability: [null] })
    );

    expect(rows[0]?.rainProbability).toBe(0);
    expect(Number.isNaN(rows[0]?.rainProbability ?? NaN)).toBe(false);
  });
});

describe('normalizeDailyForecast', () => {
  it('transposes the daily arrays and labels the first row as today', () => {
    const rows = normalizeDailyForecast(dailyPayload());

    expect(rows).toHaveLength(2);
    expect(rows[0]).toEqual({
      day: 'Today',
      date: '4 Oct',
      tempMax: 32,
      tempMin: 22,
      condition: 'Partly Cloudy',
      rainProbability: 65,
      summary: 'Partly Cloudy, 65% chance of rain',
    });
  });

  it('derives weekday labels from the ISO date without a timezone shift', () => {
    // Every parallel array must be as long as `dates`, otherwise the adapter
    // correctly drops the short rows and there is nothing to assert on.
    const rows = normalizeDailyForecast(
      dailyPayload({
        dates: ['2026-10-04', '2026-10-05', '2026-10-07'],
        maxTemperature: [32, 30, 31],
        minTemperature: [22, 21, 22],
      })
    );

    expect(rows).toHaveLength(3);

    // 2026-10-04 is a Sunday, so the following rows must read Mon and Wed. A
    // `new Date('2026-10-05')` parse would slip a day west of Greenwich.
    expect(rows[0]?.day).toBe('Today');
    expect(rows[1]?.day).toBe('Mon');
    expect(rows[2]?.day).toBe('Wed');
  });

  it('maps WMO codes through the shared mapping', () => {
    const rows = normalizeDailyForecast(dailyPayload());

    expect(rows[0]?.condition).toBe('Partly Cloudy'); // code 3
    expect(rows[1]?.condition).toBe('Thunderstorm'); // code 95
  });

  it('builds a summary only from values the provider returned', () => {
    const rows = normalizeDailyForecast(
      dailyPayload({ precipitationProbability: [0, 0], weatherCode: [0, 0] })
    );

    expect(rows[0]?.summary).toBe('Sunny');
    expect(rows[1]?.summary).toBe('Sunny');
  });

  it('omits the rain clause from the summary when probability is zero', () => {
    const rows = normalizeDailyForecast(dailyPayload({ precipitationProbability: [0, 0] }));

    expect(rows[0]?.summary).not.toContain('chance of rain');
  });

  it('drops rows missing a min/max pair, which the range bar cannot draw', () => {
    const rows = normalizeDailyForecast(
      dailyPayload({ minTemperature: [null, 21] })
    );

    expect(rows).toHaveLength(1);
    expect(rows[0]?.date).toBe('5 Oct');
  });

  it('returns an empty array when dates are absent', () => {
    expect(normalizeDailyForecast(dailyPayload({ dates: undefined }))).toEqual([]);
  });

  it('never emits NaN values into the UI', () => {
    const rows = normalizeDailyForecast(
      dailyPayload({ precipitationProbability: [null, null] })
    );

    for (const row of rows) {
      expect(Number.isNaN(row.tempMax)).toBe(false);
      expect(Number.isNaN(row.tempMin)).toBe(false);
      expect(Number.isNaN(row.rainProbability)).toBe(false);
    }
  });
});

describe('WMO weather-code mapping', () => {
  it('is shared by the current-weather and forecast paths', () => {
    expect(getConditionFromWeatherCode(0)).toBe('Sunny');
    expect(getConditionFromWeatherCode(3)).toBe('Partly Cloudy');
    expect(getConditionFromWeatherCode(95)).toBe('Thunderstorm');
    expect(getConditionFromWeatherCode(45)).toBe('Dense Fog');
    expect(getConditionFromWeatherCode(61)).toBe('Heavy Rain');
  });

  /*
   * `getWeatherIcon` returns a `LucideIcon`, which is a React
   * ForwardRefExoticComponent — an OBJECT at runtime, not a function. These
   * assertions therefore pin identity against the real glyphs instead of
   * guessing the helper's runtime shape.
   */
  it('resolves through the existing helper to the expected icon components', () => {
    expect(getWeatherIcon(getConditionFromWeatherCode(0))).toBe(Sun);
    expect(getWeatherIcon(getConditionFromWeatherCode(1))).toBe(CloudSun);
    expect(getWeatherIcon(getConditionFromWeatherCode(3))).toBe(CloudSun);
    expect(getWeatherIcon(getConditionFromWeatherCode(45))).toBe(CloudFog);
    expect(getWeatherIcon(getConditionFromWeatherCode(61))).toBe(CloudRain);
    expect(getWeatherIcon(getConditionFromWeatherCode(95))).toBe(CloudLightning);
  });

  it('never yields an undefined icon for any WMO code', () => {
    for (const code of [0, 1, 2, 3, 45, 48, 51, 61, 80, 95, 99]) {
      expect(getWeatherIcon(getConditionFromWeatherCode(code))).toBeDefined();
    }
  });
});
