import "dotenv/config";
import { NativeConnection, Worker } from "@temporalio/worker";
import { env } from "../config/env";
import { logger } from "../config/logger";
import { redis } from "../config/redis";
import { fetchSupplierAOffers, fetchSupplierBOffers } from "./activities/supplier.activities";
import { saveOffersToCache } from "./activities/cache.activities";

async function run(): Promise<void> {
  logger.info({ address: env.TEMPORAL_ADDRESS }, "Connecting worker to Temporal server");
  const connection = await NativeConnection.connect({
    address: env.TEMPORAL_ADDRESS,
  });

  const worker = await Worker.create({
    connection,
    namespace: env.TEMPORAL_NAMESPACE,
    workflowsPath: require.resolve("./workflows/hotelOffer.workflow"),
    activities: {
      fetchSupplierAOffers,
      fetchSupplierBOffers,
      saveOffersToCache,
    },
    taskQueue: env.TEMPORAL_TASK_QUEUE,
  });

  logger.info(
    { taskQueue: env.TEMPORAL_TASK_QUEUE, namespace: env.TEMPORAL_NAMESPACE },
    "Temporal worker starting",
  );

  let isShuttingDown = false;
  const gracefulShutdown = async (signal: string): Promise<void> => {
    if (isShuttingDown) return;
    isShuttingDown = true;
    logger.info({ signal }, `${signal} received - shutting down worker gracefully`);
    worker.shutdown();
    try {
      await connection.close();
      await redis.quit();
      logger.info("Worker connections closed");
    } catch (err) {
      logger.error({ err }, "Error closing worker connections");
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
