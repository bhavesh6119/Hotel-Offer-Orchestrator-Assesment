import "dotenv/config";
import app from "./src/app";
import { env } from "./src/config/env";
import { logger } from "./src/config/logger";

const server = app.listen(env.PORT, () => {
  logger.info(
    { port: env.PORT, env: env.NODE_ENV },
    "Hotel Offer Orchestrator server started",
  );
});

// Graceful shutdown
process.on("SIGTERM", () => {
  logger.info("SIGTERM received - shutting down gracefully");
  server.close(() => {
    logger.info("Server closed");
    process.exit(0);
  });
});

process.on("SIGINT", () => {
  logger.info("SIGINT received - shutting down gracefully");
  server.close(() => {
    logger.info("Server closed");
    process.exit(0);
  });
});
