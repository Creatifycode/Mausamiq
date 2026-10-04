import express from "express";
import cors from "cors";
import weatherRoutes from "./routes/weather.routes";
import locationRoutes from "./routes/location.routes";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    message: "MausamIQ Backend is running!",
  });
});

app.use("/api/weather", weatherRoutes);
app.use("/api/location", locationRoutes);

const PORT = 5000;

app.listen(PORT, () => {
  console.log(`MausamIQ Backend running on http://localhost:${PORT}`);
});