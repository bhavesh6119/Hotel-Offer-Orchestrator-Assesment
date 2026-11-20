import "dotenv/config";
import { Worker } from "@temporalio/worker";
import { env } from "../config/env";
import { logger } from "../config/logger";
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

  await worker.run();
}

run().catch((err) => {
  logger.error({ err }, "Worker failed");
  process.exit(1);
});
