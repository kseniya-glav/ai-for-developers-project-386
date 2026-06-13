import express from "express";
import cors from "cors";
import ownerRouter from "./routes/owner.js";
import eventTypesRouter from "./routes/eventTypes.js";
import bookingsRouter from "./routes/bookings.js";

const app = express();
const PORT = 3000;

app.use(cors({ origin: "http://localhost:5173" }));
app.use(express.json());

app.use(ownerRouter);
app.use(eventTypesRouter);
app.use(bookingsRouter);

app.listen(PORT, () => {
  console.log(`Booking API running on http://localhost:${PORT}`);
});
