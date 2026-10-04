# MausamIQ

**A personalized weather intelligence platform that adapts forecasts, risk analysis, and recommendations to who you are and what you are planning to do.**

MausamIQ does more than display raw weather data. It takes live conditions for a
location, works out what actually matters in them, and then presents that
judgement through the lens of a chosen persona — a commuter, a farmer, a
beachgoer, an event planner — so the answer is actionable rather than merely
numerical.

### Live Deployment

- **Frontend:** [mausamiq.vercel.app](https://mausamiq.vercel.app) — deployed on Vercel.
- **Backend:** [mausamiq-backend.onrender.com](https://mausamiq-backend.onrender.com/) — deployed on Render.
- **Production flow:** Vercel frontend → Render backend → Open-Meteo weather and air-quality APIs.
- The production frontend uses `VITE_API_BASE_URL` to target the deployed Render backend, while local development falls back to `http://localhost:5000` when the variable is unset.

The production deployment is built from the repository's `main` branch.

---

## Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Personas](#personas)
- [How It Works](#how-it-works)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Weather Intelligence](#weather-intelligence)
- [Backend / API](#backend--api)
- [Getting Started](#getting-started)
- [Running the Project](#running-the-project)
- [Testing](#testing)
- [Design](#design)
- [Future Improvements](#future-improvements)
- [Contributing](#contributing)

---

## Overview

MausamIQ is a persona-aware weather dashboard. Most weather products answer
*"what is the weather?"* MausamIQ is built around a different question: *"given
this weather, what does it mean for you?"*

The application resolves a location to real coordinates, retrieves current
conditions, normalizes them into a single internal weather model, and then runs
them through a small intelligence pipeline. The result is layered into the
interface in three distinct parts:

| Layer | Question it answers | Source |
| --- | --- | --- |
| **Suitability** | How good is this weather for this persona? | `src/smart/suitabilityCalculators.ts` |
| **Risk** | What hazards are present right now? | `src/intelligence/riskEngine.ts` |
| **Recommendation** | Given those risks, what should I actually do? | `src/intelligence/recommendationEngine.ts` |

On top of that, a ranking engine (`src/engine/personalizationEngine.ts`) scores
and orders the dashboard widgets for the active persona, and any widget can
explain *why* it was placed where it was.

Switching persona re-scores suitability, re-ranks the widget grid, and
regenerates the recommendation from the same weather reading — the weather does
not change, the interpretation of it does.

---

## Key Features

**Live weather integration**
- Current conditions are fetched from the MausamIQ backend, which proxies the
  [Open-Meteo](https://open-meteo.com/) forecast and air-quality APIs.
- Air quality is requested on the **US EPA AQI scale**, matching the thresholds
  and category labels used throughout the frontend.

**Location-based weather**
- A curated set of selectable Indian cities and destinations.
- Selected locations are resolved to real coordinates through a geocoding
  service, with a resolved-coordinate cache so repeat selections are instant.
- No hardcoded or invented coordinates — every lookup is a real geocode result.

**Persona-based personalization**
- Eight built-in personas, each with its own accent color, tagline, priorities,
  and dedicated widget set.
- Suitability scores, widget ordering, and recommendations all recompute on
  persona change.

**Weather suitability scoring**
- Per-persona scoring out of 100 with a label, status, summary, contributing key
  factors, a suggested best window, and concrete action tips.

**Weather risk analysis**
- Detects thunderstorms, heavy rain, heat, strong wind, reduced visibility, high
  UV, and poor air quality. (Cold and dense fog are extracted as feature signals;
  fog is ultimately reported as a visibility risk.)
- Produces an overall risk level and score alongside the individual risks.

**Personalized recommendations**
- Turns the risk analysis into a status, a headline, and a plain-language
  recommendation tailored to the active persona.
- Surfaced in the hero band next to the suitability score, and kept deliberately
  distinct from it: the gauge rates the conditions, the advisory says what to do
  about them.

**Current conditions, hourly and daily outlook**
- A detailed current-conditions card (temperature, feels-like, humidity, wind,
  pressure, UV, visibility, dew point, AQI, sunrise/sunset, 24-hour rainfall).
- Hourly and daily forecast cards for at-a-glance planning, populated from the
  live backend forecast endpoint. Both cards fall back to curated sample data if
  the live request fails or has not landed yet.

**Safety alerts**
- A prominent banner for severe conditions, with severity levels from `minor`
  through `extreme` and category tagging (heatwave, thunderstorm, flood, fog,
  cyclone, air quality).
- Severe alerts can override normal widget ranking so safety information is
  surfaced first. The alert data is currently curated sample data, with a
  simulation toggle for demonstrating the override behaviour.

**Explainability — "Why this card?"**
- Every widget exposes the reasoning behind its priority score.
- An explainability modal presents the ranking breakdown, and the hero's "Why
  this card?" control opens it.

**More weather insights**
- A disclosure section that keeps secondary widgets one interaction away, with a
  live count and persona-aware labelling.

**Responsive, modern interface**
- A dark, glass-inspired dashboard layout that adapts from wide desktop grids
  down to narrow mobile screens.
- Accessible focus handling, semantic landmarks, and reduced-motion support.

---

## Personas

Selecting a persona re-themes the accent color and re-frames every judgement in
the dashboard.

| Persona | Focus |
| --- | --- |
| **Fitness & Outdoor** | Whether conditions suit exercise and outdoor training. |
| **Traveler & Explorer** | Travel feasibility and destination comparison. |
| **Daily Commuter** | Disruptions to the morning and evening commute. |
| **Agriculture & Garden** | Field and growing conditions. |
| **Event Planner** | Suitability for outdoor events. |
| **Health & Respiratory** | Air quality and conditions affecting respiratory health. |
| **Beach & Coastal** | Coastal and beach conditions. |
| **Family & Parent** | Outdoor family activity and safety. |

Each persona defines its own suitability calculator, its own set of prioritized
widgets, and its own accent color — which is injected into the interface at
runtime as a CSS custom property.

---

## How It Works

```
Selected location
       │
       ▼
  Geocoding service ──► resolved latitude / longitude
       │
       ▼
  GET /api/weather ──► MausamIQ backend ──► Open-Meteo (weather + air quality)
       │
       ▼
  Weather normalization ──► a single CurrentWeather model
       │                    (units, WMO code → condition, US EPA AQI band)
       ▼
  Feature extraction ──► boolean weather features
       │                 (isVeryHot, isWindy, isDenseFog, isPoorAirQuality, …)
       ▼
  Risk analysis ──► RiskAnalysis
       │            (overallLevel, overallScore, individual risks, summary)
       ├──────────────────────────────┐
       ▼                              ▼
  Suitability scoring            Recommendation generation
  (persona-specific)             (persona + weather + risks)
       │                              │
       └──────────────┬───────────────┘
                      ▼
            Widget ranking (personalization engine)
                      │
                      ▼
        Personalized dashboard + explainability
```

Two details worth noting:

- **One weather source.** Intelligence, suitability, and ranking all consume the
  *same* resolved `CurrentWeather` object, so there is no possibility of two
  panels disagreeing about the conditions.
- **Graceful degradation.** If the live fetch fails, the dashboard falls back to
  curated sample data for the selected city. Weather simulation scenarios can
  override conditions for demonstration. If the intelligence pipeline itself
  throws, the recommendation simply does not render — the rest of the dashboard
  is unaffected.

---

## Tech Stack

### Frontend

| Technology | Version | Role |
| --- | --- | --- |
| React | ^19.2.8 | UI runtime |
| React DOM | ^19.2.8 | DOM renderer |
| TypeScript | ~6.0.2 | Static typing |
| Vite | ^8.3.0 | Dev server and build |
| @vitejs/plugin-react | ^6.1.1 | React integration / Fast Refresh |
| lucide-react | ^1.45.0 | Icon set |
| oxlint | ^1.81.0 | Linting |
| Vitest | ^5.0.0 | Unit testing |

Styling is hand-written CSS organised into design tokens and per-area
stylesheets — there is no CSS framework or preprocessor in the project.

### Backend

| Technology | Version | Role |
| --- | --- | --- |
| Express | ^5.2.1 | HTTP server and routing |
| cors | ^2.8.6 | Cross-origin access for the frontend |
| TypeScript | ^7.0.2 | Static typing |
| tsx | ^4.23.13 | TypeScript execution for development |

The backend uses the platform's built-in `fetch` to call Open-Meteo. No database
or ORM is present; the service is stateless.

---

## Project Structure

```
mausamiq/
├── backend/
│   ├── src/
│   │   ├── routes/
│   │   │   ├── weather.routes.ts      # /api/weather, /api/weather/forecast
│   │   │   └── location.routes.ts     # /api/location
│   │   ├── services/
│   │   │   ├── weather.service.ts     # Open-Meteo weather + air quality
│   │   │   └── location.service.ts    # Open-Meteo geocoding
│   │   └── server.ts                  # App wiring, CORS, port 5000
│   └── package.json
│
├── src/
│   ├── components/
│   │   ├── ui/                        # ScoreGauge, StatusPill, AdvisoryBox,
│   │   │                              # MetricPill, RankBadge
│   │   ├── widgets/                   # Dashboard cards (suitability, forecast,
│   │   │                              # persona-specific, best-time, …)
│   │   ├── AppShell.tsx               # Layout + persona accent injection
│   │   ├── AppBar.tsx                 # Top bar
│   │   ├── HeroBand.tsx               # Persona hero + suitability + advisory
│   │   ├── PersonaSelector.tsx        # Persona switching
│   │   ├── PrioritizedGrid.tsx        # Ranked grid + "More weather insights"
│   │   ├── SafetyAlertBanner.tsx      # Severe weather banner
│   │   └── ExplainabilityModal.tsx    # "Why this card?" dialog
│   │
│   ├── intelligence/                  # The weather intelligence pipeline
│   │   ├── weatherFeatures.ts         # Feature extraction
│   │   ├── riskEngine.ts              # Risk analysis
│   │   └── recommendationEngine.ts    # Recommendation generation
│   │
│   ├── smart/
│   │   └── suitabilityCalculators.ts  # Per-persona suitability scoring
│   ├── engine/
│   │   └── personalizationEngine.ts  # Widget prioritization / ranking
│   │
│   ├── services/
│   │   ├── weatherApi.ts              # Backend client + response types
│   │   └── locationResolver.ts        # Location → coordinates + cache
│   │
│   ├── data/
│   │   ├── mockData.ts                # Personas, locations, fallback data
│   │   └── weatherAdapter.ts          # Backend payload → domain models
│   │                                  # (current weather + forecast)
│   │
│   ├── styles/                        # tokens, reset, typography, layout,
│   │                                  # components, widgets
│   ├── tests/                         # Vitest suites
│   ├── types/                         # Shared domain types
│   └── App.tsx                        # Application composition
│
├── package.json
└── vite.config.ts
```

---

## Weather Intelligence

The intelligence layer lives in `src/intelligence/` and is deliberately kept
separate from both the API layer and the presentation layer. It is pure,
synchronous logic over a single weather object.

### 1. Feature extraction — `weatherFeatures.ts`

`extractWeatherFeatures(weather)` converts raw measurements into a compact set of
boolean signals, so that later stages compare flags rather than re-deriving
thresholds from numbers:

`isHot`, `isVeryHot`, `isCold`, `isHumid`, `isVeryHumid`, `isWindy`,
`isHeavyRain`, `isThunderstorm`, `isPoorVisibility`, `isDenseFog`, `isHighUv`,
`isPoorAirQuality`

### 2. Risk analysis — `riskEngine.ts`

`analyzeWeatherRisks(weather, features)` consumes the extracted features and
returns a `RiskAnalysis`:

- `risks` — each detected hazard with its type, level, score, and a
  human-readable reason
- `overallLevel` — `low` | `moderate` | `high` | `extreme`
- `overallScore`
- `summary` — a short natural-language description

### 3. Recommendation generation — `recommendationEngine.ts`

`generateRecommendation(personaId, weather, riskAnalysis)` combines the risk
analysis with the active persona and returns a `WeatherRecommendation` carrying
a status, headline, plain-language recommendation, supporting reason, score, and
action tips.

### 4. Persona-based presentation

The intelligence layer produces one shared weather judgement; the persona
determines how it is *interpreted and framed* for the user. Presentation happens
in the UI, where severity is mapped onto the existing advisory tones rather than
recomputed. The distinction between the two headline results is kept explicit:

- **Suitability score** → *"How good is this for me?"*
- **Intelligence advisory** → *"What should I actually do?"*

---

## Backend / API

The Express server listens on **port 5000** and enables CORS for all origins.

### Endpoints

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/` | Root health check. Returns a status message confirming the service is running. |
| `GET` | `/api/weather` | Current weather and air quality for a coordinate pair. |
| `GET` | `/api/weather/forecast` | Daily and upcoming hourly forecast for a coordinate pair. |
| `GET` | `/api/location` | Geocoding search for a city name. |

### `GET /api/weather`

**Query parameters:** `lat`, `lon` (both required, numeric).

Aggregates the Open-Meteo forecast API with the Open-Meteo air-quality API. The
`data` object contains:

| Group | Fields |
| --- | --- |
| Temperature | `temperature`, `apparentTemperature` |
| Humidity | `humidity`, `dewPoint` |
| Wind | `windSpeed`, `windDirection` |
| Precipitation | `precipitation`, `rainfall24h` |
| Conditions | `weatherCode` |
| Pressure | `pressure` |
| Visibility | `visibility` (metres — converted to km by the frontend adapter) |
| UV | `uvIndex` |
| Sun | `sunrise`, `sunset` |
| Air quality | `aqi` (US EPA scale), `pm25` |

### `GET /api/weather/forecast`

**Query parameters:** `lat`, `lon` (both required, numeric).

Returns daily **and** upcoming hourly values as parallel arrays.

| Group | Fields |
| --- | --- |
| Daily | `dates`, `maxTemperature`, `minTemperature`, `precipitationProbability`, `weatherCode` |
| Hourly (`hourly`) | `times`, `temperature`, `precipitationProbability`, `weatherCode` |

The daily block covers 7 days; the `hourly` block covers the next 24 hours from
the current hour. `hourly` is `null` if the upstream provider omits it, in which
case the daily forecast is still returned and the UI uses its hourly fallback.
Only the fields the forecast cards actually render are requested.

### `GET /api/location`

**Query parameters:** `city` (required).

Geocoding search returning up to five matches. Each result contains `name`,
`latitude`, `longitude`, `country`, and `state`.

### Response format and errors

Successful responses are wrapped in an envelope:

```json
{
  "success": true,
  "data": { }
}
```

Invalid or missing parameters return HTTP `400`; upstream provider failures
return HTTP `500` with `success: false` and an `error` message. The root `/`
endpoint is the exception and returns a plain message object.

---

## Getting Started

### Prerequisites

- **Node.js** (a version supported by Vite 8)
- **npm**

### Setup

The frontend and backend are independent packages and must be installed
separately.

**Frontend**

```bash
npm install
```

**Backend**

```bash
cd backend
npm install
```

### Environment variables

**No API keys or secrets are required.** The backend calls Open-Meteo, which is a
keyless public API.

One optional variable configures which backend the frontend calls:

| Variable | Purpose |
| --- | --- |
| `VITE_API_BASE_URL` | Base URL of the MausamIQ backend. |

It is read in `src/services/weatherApi.ts` and typed in `src/vite-env.d.ts`:

- **Production** — `.env.production` sets it to the deployed Render service, so
  `npm run build` targets `https://mausamiq-backend.onrender.com`.
- **Local development** — the variable is unset in development mode, so the
  client falls back to `http://localhost:5000`.

Because Vite inlines every `VITE_*` value into the client bundle, this variable
can only ever hold a public URL. Never place a secret in a `.env` file.

---

## Running the Project

The two services run in separate terminals.

### Frontend

```bash
npm run dev
```

Serves the app at **http://localhost:5173**.

### Backend

```bash
cd backend
npm run dev
```

Starts the API server at **http://localhost:5000**.

Run the backend first so that live weather lookups resolve; if it is unavailable
the dashboard falls back to curated sample data automatically.

### Other frontend scripts

| Command | Description |
| --- | --- |
| `npm run build` | Type-check and build for production |
| `npm run preview` | Preview the production build |
| `npm run test` | Run the test suite |
| `npm run lint` | Lint the source |

### Other backend scripts

| Command | Description |
| --- | --- |
| `npm run build` | Compile TypeScript to `dist/` |
| `npm start` | Run the compiled server from `dist/` |

---

## Testing

The frontend uses **Vitest**, with suites co-located in `src/tests/`:

| Suite | Covers |
| --- | --- |
| `suitabilityCalculators.test.ts` | Per-persona suitability scoring |
| `personalizationEngine.test.ts` | Widget prioritization and ranking |
| `weatherIntelligence.test.ts` | Feature extraction and risk analysis |
| `recommendationEngine.test.ts` | Recommendation generation |
| `forecastAdapter.test.ts` | Forecast response adaptation and WMO code mapping |

```bash
npm test
```

These suites cover the pure decision logic — scoring, ranking, and the
intelligence pipeline. The backend currently has no test suite configured.

---

## Design

MausamIQ uses a **midnight instrument-panel** visual language rather than a
conventional weather-app aesthetic.

- **Dark glass surfaces.** A near-black base with translucent, layered card
  surfaces, hairline borders, soft elevation shadows, and inner top-edge
  highlights that read as light catching a glass edge.
- **Persona-tinted accents.** Accent color is not hardcoded in the stylesheets.
  It is injected at runtime from the active persona's `accentColor`, and every
  derived tint — soft fills, borders, glows, and readable text inks — is computed
  from that single value with `color-mix()`. Changing persona re-themes the entire
  interface from one source of truth.
- **Instrument-panel feel.** Compact uppercase eyebrow labels, tabular numerals,
  gauges, status pills, rank badges, and structured metadata rows give the
  dashboard the density and precision of monitoring equipment.
- **Semantic status color.** A consistent status scale (`optimal`, `moderate`,
  `warning`, `danger`, `info`) is shared across the hero, widgets, and advisory
  regions, so a given status always reads the same way.
- **Responsive layout.** Multi-breakpoint layouts from wide desktop grids down to
  narrow single-column mobile views, with fluid display type.
- **Typography.** A minor-third type scale pairing `Inter` for body text with
  `Outfit` for display and headings.
- **Accessibility.** Semantic landmarks and headings, a skip link, visible
  `:focus-visible` outlines, `aria-expanded` / `aria-controls` on the insights
  disclosure, `aria-busy` on the live region while weather loads, labelled gauge
  and status text rather than colour alone, 44px minimum tap targets, and
  `prefers-reduced-motion` handling.

---

## Future Improvements

The following are **possible future directions**, not features that exist today:

- **Live severe-alert feed.** Replace the curated safety alert with a real
  alerting source.
- **Automatic location detection,** using the browser geolocation API in place of
  manual city selection.
- **User-selectable personas,** persisted in local storage.
- **Server-side caching** for upstream weather and geocoding responses.
- **Backend test coverage** alongside the existing frontend suites.
- **Additional locales** beyond the current set of Indian cities.

---

## Contributing

Contributions are welcome.

1. **Fork** the repository to your own GitHub account.
2. **Create a branch** from `main` with a descriptive name:

   ```bash
   git checkout -b feature/your-change
   ```

3. **Make your changes**, keeping them focused on a single concern.
4. **Verify your work** before opening a pull request:

   ```bash
   npm run lint
   npm test
   npm run build
   ```

5. **Commit** with a clear, descriptive message.
6. **Push** your branch and **open a pull request** describing what changed and
   why.

### Guidelines

- Preserve the existing architecture: the intelligence layer stays pure, the
  decision engines stay free of presentation concerns, and components render
  values rather than recomputing them.
- Do not duplicate logic across layers. If two panels need the same judgement,
  derive it once and pass it down.
- Match the surrounding code style and reuse existing design tokens and
  components before introducing new ones.
- If you change the suitability, ranking, or intelligence algorithms, please
  update or extend the corresponding test suite in `src/tests/`.
