import "dotenv/config";
import app from "./src/app";
import { env } from "./src/config/env";
import { logger } from "./src/config/logger";
import { redis } from "./src/config/redis";

const server = app.listen(env.PORT, () => {
  logger.info(
    { port: env.PORT, env: env.NODE_ENV },
    "Hotel Offer Orchestrator server started",
  );
});

// Graceful shutdown
async function gracefulShutdown(signal: string): Promise<void> {
  logger.info({ signal }, `${signal} received - shutting down gracefully`);
  server.close(async () => {
    logger.info("HTTP server closed");
    try {
      await redis.quit();
      logger.info("Redis client disconnected");
    } catch (err) {
      logger.error({ err }, "Error closing Redis connection");
    }
    process.exit(0);
  });
}

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));
