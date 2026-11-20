/**
 * hotelOffer.workflow.ts
 *
 * DETERMINISM RULES (Temporal requirement):
 *   - No network calls, no Redis, no logger, no Date.now(), no Math.random()
 *   - Only pure helpers and @temporalio/workflow imports are allowed here
 */
import { proxyActivities, ActivityOptions } from "@temporalio/workflow";
import type { fetchSupplierAOffers, fetchSupplierBOffers } from "../activities/supplier.activities";
import type { saveOffersToCache } from "../activities/cache.activities";
import { mergeOffers } from "../../utils/mergeOffers";
import { HotelOffer } from "../../types/hotel.types";

/** Shared type describing all activities used by this workflow */
type Activities = {
  fetchSupplierAOffers: typeof fetchSupplierAOffers;
  fetchSupplierBOffers: typeof fetchSupplierBOffers;
  saveOffersToCache: typeof saveOffersToCache;
};

const activityOptions: ActivityOptions = {
  startToCloseTimeout: "10 seconds",
  retry: {
    maximumAttempts: 3,
    initialInterval: "1 second",
    backoffCoefficient: 2,
  },
};

// All three activities proxied through a single call — no name shadowing
const acts = proxyActivities<Activities>(activityOptions);

/**
 * @workflow hotelOfferWorkflow
 * @description Fetches offers from both suppliers in parallel, dedupes by name
 *              keeping the cheaper price, then caches the result in Redis.
 */
export async function hotelOfferWorkflow(city: string): Promise<HotelOffer[]> {
  // Fetch both suppliers IN PARALLEL
  const [offersA, offersB] = await Promise.all([
    acts.fetchSupplierAOffers(),
    acts.fetchSupplierBOffers(),
  ]);

  // Pure merge — no I/O, deterministic
  const merged = mergeOffers(offersA, offersB);

  // Persist to Redis via activity (5 s timeout, default retry)
  await acts.saveOffersToCache(city, merged);

  return merged;
}
