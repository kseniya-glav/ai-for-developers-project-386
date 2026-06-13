import express from "express";
import cors from "cors";
import ownerRouter from "./routes/owner.js";
import eventTypesRouter from "./routes/eventTypes.js";
import bookingsRouter from "./routes/bookings.js";

const app = express();
const PORT = parseInt(process.env.PORT || "3000", 10);

app.use(cors());
app.use(express.json());

// Serve static frontend files
app.use(express.static("public"));

app.use(ownerRouter);
app.use(eventTypesRouter);
app.use(bookingsRouter);

// SPA fallback — serve index.html for any non-API route
app.use((_req, res) => {
  res.sendFile(new URL("../public/index.html", import.meta.url).pathname);
});

app.listen(PORT, () => {
  console.log(`Booking API running on port ${PORT}`);
});
