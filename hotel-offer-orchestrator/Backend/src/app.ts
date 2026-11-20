import express, { Application } from "express";
import { requestLogger } from "./middleware/requestLogger.middleware";
import { errorHandler } from "./middleware/error.middleware";

// Routes
import hotelRoutes from "./routes/hotel.routes";
import supplierRoutes from "./routes/supplier.routes";
import healthRoutes from "./routes/health.routes";

const app: Application = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(requestLogger);

// using all the routes here
app.use("/api/hotels", hotelRoutes);
app.use("/", supplierRoutes);
app.use("/health", healthRoutes);

// Global error handler (must be last)
app.use(errorHandler);

export default app;
