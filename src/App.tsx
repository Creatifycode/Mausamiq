import React, { useState, useMemo, useEffect } from 'react';
import type { PersonaId, CurrentWeather, HourlyForecast, DailyForecast } from './types';
import { PERSONAS, MOCK_WEATHER_DATA, WEATHER_SCENARIOS, MOCK_SEVERE_ALERT, LOCATIONS } from './data/mockData';
import { getSuitabilityForPersona } from './smart/suitabilityCalculators';
import { calculateWidgetPriorities } from './engine/personalizationEngine';
import { AppShell } from './components/AppShell';
import { AppBar } from './components/AppBar';
import { HeroBand } from './components/HeroBand';
import { PersonaSelector } from './components/PersonaSelector';
import { PrioritizedGrid } from './components/PrioritizedGrid';
import { ExplainabilityModal } from './components/ExplainabilityModal';
import { fetchCurrentWeather, fetchForecast } from './services/weatherApi';
import type { BackendForecast } from './services/weatherApi';
import { normalizeWeather, normalizeHourlyForecast, normalizeDailyForecast } from './data/weatherAdapter';
import { resolveCoordinates } from './services/locationResolver';
import { extractWeatherFeatures } from './intelligence/weatherFeatures';
import { analyzeWeatherRisks } from './intelligence/riskEngine';
import { generateRecommendation } from './intelligence/recommendationEngine';

export const App: React.FC = () => {
  const [activePersonaId, setActivePersonaId] = useState<PersonaId>('fitness');
  const [currentCityId, setCurrentCityId] = useState<string>('delhi');
  const [activeScenario, setActiveScenario] = useState<string>('normal');
  const [isSafetyOverrideActive, setIsSafetyOverrideActive] = useState<boolean>(false);
  const [isExplainabilityOpen, setIsExplainabilityOpen] = useState<boolean>(false);

  /*
   * Live backend weather for the selected city.
   *
   * `null` means "no live data yet" OR "live data unavailable" — in both cases
   * the curated mock below is used, so the dashboard is never left empty and a
   * backend outage degrades to mock rather than to a blank screen.
   */
  const [liveWeather, setLiveWeather] = useState<CurrentWeather | null>(null);
  const [isWeatherLoading, setIsWeatherLoading] = useState<boolean>(false);

  /*
   * Live forecast for the selected city, kept in its RAW backend shape.
   *
   * Normalization is deferred to the `hourlyForecast` / `dailyForecast` memos
   * below so the adapter stays a pure function of the payload and nothing is
   * re-derived inside a render. `null` means "not loaded yet" or "unavailable";
   * both let the forecast cards fall back to the curated sample.
   */
  const [liveForecast, setLiveForecast] = useState<BackendForecast | null>(null);
  const [isForecastLoading, setIsForecastLoading] = useState<boolean>(false);

  const activeLocation = useMemo(
    () => LOCATIONS.find((location) => location.id === currentCityId) ?? LOCATIONS[0],
    [currentCityId]
  );

  /*
   * Live current-weather AND forecast fetch.
   *
   * Chain: selected location -> backend geocoding (real coordinates, none
   * invented) -> /api/weather + /api/weather/forecast -> adapter -> domain models.
   *
   * Both requests deliberately share ONE `resolveCoordinates` call so the current
   * weather and the forecast can never describe different places, and so a city
   * switch costs one geocode rather than two.
   *
   * They are issued together but settled SEPARATELY (`Promise.allSettled`): a
   * forecast fault must never suppress the current weather that suitability,
   * ranking and the intelligence layer all depend on.
   *
   * Dependencies are the location only. Persona is deliberately absent, so
   * switching persona re-scores and re-ranks without touching the network.
   *
   * `cancelled` guards against a stale response overwriting a newer one when
   * the user switches cities faster than the network responds.
   */
  useEffect(() => {
    let cancelled = false;

    const loadLiveWeather = async () => {
      setIsWeatherLoading(true);
      setIsForecastLoading(true);

      try {
        const { latitude, longitude } = await resolveCoordinates(activeLocation);

        if (cancelled) return;

        // Country is taken from the existing curated entry rather than hardcoded.
        const baseMock = MOCK_WEATHER_DATA[currentCityId] ?? MOCK_WEATHER_DATA['delhi'];

        const [weatherResult, forecastResult] = await Promise.allSettled([
          fetchCurrentWeather(latitude, longitude),
          fetchForecast(latitude, longitude),
        ]);

        if (cancelled) return;

        if (weatherResult.status === 'fulfilled') {
          setLiveWeather(
            normalizeWeather(weatherResult.value, {
              city: activeLocation.name,
              state: activeLocation.state,
              country: baseMock.country,
            })
          );
        } else {
          // Non-fatal: fall back to the curated mock for this city so the
          // dashboard still renders. Never let a backend fault escape as an
          // unhandled rejection.
          setLiveWeather(null);
          console.warn(
            '[MausamIQ] Live weather unavailable, using curated data:',
            weatherResult.reason instanceof Error
              ? weatherResult.reason.message
              : weatherResult.reason
          );
        }

        if (forecastResult.status === 'fulfilled') {
          setLiveForecast(forecastResult.value);
        } else {
          // Forecast is non-critical: the cards fall back to curated data.
          setLiveForecast(null);
          console.warn(
            '[MausamIQ] Live forecast unavailable, using curated data:',
            forecastResult.reason instanceof Error
              ? forecastResult.reason.message
              : forecastResult.reason
          );
        }
      } catch (error) {
        // Only reachable when geocoding itself fails, which invalidates both.
        if (cancelled) return;

        const message =
          error instanceof Error ? error.message : 'Live weather unavailable';

        setLiveWeather(null);
        setLiveForecast(null);
        console.warn('[MausamIQ] Location resolution failed, using curated data:', message);
      } finally {
        if (!cancelled) {
          setIsWeatherLoading(false);
          setIsForecastLoading(false);
        }
      }
    };

    void loadLiveWeather();

    return () => {
      cancelled = true;
    };
  }, [activeLocation, currentCityId]);

  /*
   * Forecast rows for the selected city.
   *
   * Derived from `liveForecast` only, so neither depends on the persona and
   * neither re-runs on a persona change. Each returns an empty array when the
   * payload cannot be adapted, which is exactly the signal the cards use to fall
   * back to the curated sample.
   */
  const hourlyForecast = useMemo<HourlyForecast[]>(
    () => (liveForecast ? normalizeHourlyForecast(liveForecast) : []),
    [liveForecast]
  );

  const dailyForecast = useMemo<DailyForecast[]>(
    () => (liveForecast ? normalizeDailyForecast(liveForecast) : []),
    [liveForecast]
  );

  /*
   * Effective weather.
   *
   * The mock/scenario architecture is preserved exactly:
   *   1. A non-empty WEATHER_SCENARIOS entry is a deliberate override used to
   *      exercise the safety ranking path, so it always wins.
   *   2. Otherwise prefer live backend data.
   *   3. Otherwise fall back to the curated mock (first load, or backend down).
   */
  const currentWeather = useMemo(() => {
    const base = MOCK_WEATHER_DATA[currentCityId] || MOCK_WEATHER_DATA['delhi'];
    const scenario = WEATHER_SCENARIOS[activeScenario] || {};
    const withScenario = { ...base, ...scenario };
    const isScenarioOverride = Object.keys(scenario).length > 0;

    return !isScenarioOverride && liveWeather ? liveWeather : withScenario;
  }, [currentCityId, activeScenario, liveWeather]);

  // Derive Persona Suitability metrics
  const suitability = useMemo(() => {
    return getSuitabilityForPersona(activePersonaId, currentWeather);
  }, [activePersonaId, currentWeather]);

  // Active persona profile
  const activePersona = useMemo(() => {
    return PERSONAS.find(p => p.id === activePersonaId) || PERSONAS[0];
  }, [activePersonaId]);

  // Compute prioritized homepage widget list from ranking engine
  const prioritizedWidgets = useMemo(() => {
    return calculateWidgetPriorities({
      personaId: activePersonaId,
      weather: currentWeather,
      alert: MOCK_SEVERE_ALERT,
      isSafetyOverrideActive
    });
  }, [activePersonaId, currentWeather, isSafetyOverrideActive]);

  /*
   * Weather intelligence layer.
   *
   * Consumes the SAME effective `currentWeather` as suitability and ranking, so
   * the scenario override and the live -> curated-mock fallback apply here too.
   * There is no second weather source, no second risk calculation and no second
   * ranking: this only calls the existing intelligence modules and surfaces
   * their output alongside the existing suitability result.
   *
   * Recomputes automatically on city change, live weather change and persona
   * change because both dependencies are reactive.
   *
   * Wrapped in try/catch so an unexpected payload degrades to "no
   * recommendation" rather than taking the dashboard down.
   */
  const intelligence = useMemo(() => {
    try {
      const features = extractWeatherFeatures(currentWeather);
      const risks = analyzeWeatherRisks(currentWeather, features);
      const recommendation = generateRecommendation(
        activePersonaId,
        currentWeather,
        risks
      );

      return { recommendation, risks };
    } catch (error) {
      console.warn('[MausamIQ] Intelligence pipeline unavailable:', error);

      return { recommendation: null, risks: null };
    }
  }, [currentWeather, activePersonaId]);

  return (
    <AppShell personaId={activePersonaId} accentColor={activePersona.accentColor}>
      {/* Header & Controls */}
      <AppBar
        currentCityId={currentCityId}
        onCityChange={setCurrentCityId}
        activeScenario={activeScenario}
        onScenarioChange={setActiveScenario}
        isSafetyOverrideActive={isSafetyOverrideActive}
        onToggleSafetyOverride={() => setIsSafetyOverrideActive(!isSafetyOverrideActive)}
        onOpenExplainability={() => setIsExplainabilityOpen(true)}
      />

      {/*
        aria-busy exposes the in-flight live weather load to assistive tech
        without adding any visible chrome to the Phase 4 layout. The forecast
        request rides on the same signal rather than introducing new loading UI.
      */}
      <main
        className="app-container page-main"
        id="main-content"
        aria-busy={isWeatherLoading || isForecastLoading}
      >
        {/* Persona Selection Rail */}
        <PersonaSelector
          activePersonaId={activePersonaId}
          onSelectPersona={setActivePersonaId}
        />

        {/* Personalized Weather Intelligence Hero */}
        <HeroBand
          persona={activePersona}
          suitability={suitability}
          weather={currentWeather}
          onOpenExplainability={() => setIsExplainabilityOpen(true)}
          recommendation={intelligence.recommendation}
          riskAnalysis={intelligence.risks}
        />

        {/* Dynamically Reordered Homepage Grid */}
        <PrioritizedGrid
          prioritizedWidgets={prioritizedWidgets}
          currentWeather={currentWeather}
          suitability={suitability}
          activePersona={activePersona}
          alert={MOCK_SEVERE_ALERT}
          isSafetyOverrideActive={isSafetyOverrideActive}
          onToggleSimulation={() => setIsSafetyOverrideActive(!isSafetyOverrideActive)}
          hourlyForecast={hourlyForecast}
          dailyForecast={dailyForecast}
        />
      </main>

      {/* Prioritization Logic & Score Breakdown Modal */}
      <ExplainabilityModal
        isOpen={isExplainabilityOpen}
        onClose={() => setIsExplainabilityOpen(false)}
        prioritizedWidgets={prioritizedWidgets}
        activePersonaId={activePersonaId}
        isSafetyOverrideActive={isSafetyOverrideActive}
      />
    </AppShell>
  );
};

export default App;