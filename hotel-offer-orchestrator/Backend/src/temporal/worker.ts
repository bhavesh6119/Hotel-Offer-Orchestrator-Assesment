import "dotenv/config";
import { Worker } from "@temporalio/worker";
import { env } from "../config/env";
import { logger } from "../config/logger";
import { redis } from "../config/redis";
import { fetchSupplierAOffers, fetchSupplierBOffers } from "./activities/supplier.activities";
import { saveOffersToCache } from "./activities/cache.activities";

async function run(): Promise<void> {
  const worker = await Worker.create({
    workflowsPath: require.resolve("./workflows/hotelOffer.workflow"),
    activities: {
      fetchSupplierAOffers,
      fetchSupplierBOffers,
      saveOffersToCache,
    },
    taskQueue: env.TEMPORAL_TASK_QUEUE,
  });

  logger.info(
    { taskQueue: env.TEMPORAL_TASK_QUEUE },
    "Temporal worker starting",
  );

  let isShuttingDown = false;
  const gracefulShutdown = async (signal: string): Promise<void> => {
    if (isShuttingDown) return;
    isShuttingDown = true;
    logger.info({ signal }, `${signal} received - shutting down worker gracefully`);
    worker.shutdown();
    try {
      await redis.quit();
      logger.info("Redis client disconnected");
    } catch (err) {
      logger.error({ err }, "Error closing Redis connection");
    }
  };

  process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
  process.on("SIGINT", () => gracefulShutdown("SIGINT"));

  await worker.run();
}

run().catch((err) => {
  logger.error({ err }, "Worker failed");
  process.exit(1);
});
