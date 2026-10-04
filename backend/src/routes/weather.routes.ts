import { Router } from "express";
import {
  getWeather,
  getForecast,
} from "../services/weather.service";

const router = Router();

// Current weather
router.get("/", async (req, res) => {
  try {
    const lat = Number(req.query.lat);
    const lon = Number(req.query.lon);

    if (isNaN(lat) || isNaN(lon)) {
      return res.status(400).json({
        error: "lat and lon are required and must be valid numbers",
      });
    }

    const weather = await getWeather(lat, lon);

    res.json({
      success: true,
      data: weather,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Unable to fetch weather data",
    });
  }
});

// Weather forecast
router.get("/forecast", async (req, res) => {
  try {
    const lat = Number(req.query.lat);
    const lon = Number(req.query.lon);

    if (isNaN(lat) || isNaN(lon)) {
      return res.status(400).json({
        error: "lat and lon are required and must be valid numbers",
      });
    }

    const forecast = await getForecast(lat, lon);

    res.json({
      success: true,
      data: forecast,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Unable to fetch forecast data",
    });
  }
});

export default router;