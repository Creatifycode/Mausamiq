import { Router } from "express";
import { searchLocation } from "../services/location.service";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const city = String(req.query.city || "").trim();

    if (!city) {
      return res.status(400).json({
        success: false,
        error: "city is required",
      });
    }

    const locations = await searchLocation(city);

    res.json({
      success: true,
      data: locations,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Unable to search location",
    });
  }
});

export default router;