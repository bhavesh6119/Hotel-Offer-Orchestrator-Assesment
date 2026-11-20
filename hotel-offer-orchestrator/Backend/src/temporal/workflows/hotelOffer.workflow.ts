/**
 * hotelOffer.workflow.ts
 *
 * DETERMINISM RULES (Temporal requirement):
 *   - No network calls, no Redis, no logger, no Date.now(), no Math.random()
 *   - Only pure helpers and @temporalio/workflow imports are allowed here
 */
import { proxyActivities, ActivityOptions, ApplicationFailure } from "@temporalio/workflow";
import type { fetchSupplierAOffers, fetchSupplierBOffers } from "../activities/supplier.activities";
import type { saveOffersToCache } from "../activities/cache.activities";
import { mergeOffers } from "../../utils/mergeOffers";
import { HotelOffer, WorkflowResult } from "../../types/hotel.types";

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

const acts = proxyActivities<Activities>(activityOptions);

/**
 * @workflow hotelOfferWorkflow
 * @description Runs both supplier activities in parallel, tolerates one failure,
 *              merges surviving offers, caches the result in Redis, and returns
 *              { hotels, warnings }.
 */
export async function hotelOfferWorkflow(city: string): Promise<WorkflowResult> {
  const warnings: string[] = [];
  let offersA: HotelOffer[] | null = null;
  let offersB: HotelOffer[] | null = null;

  const [resA, resB] = await Promise.allSettled([
    acts.fetchSupplierAOffers(city),
    acts.fetchSupplierBOffers(city),
  ]);

  if (resA.status === "fulfilled") {
    offersA = resA.value;
  } else {
    warnings.push("Supplier A unavailable");
  }

  if (resB.status === "fulfilled") {
    offersB = resB.value;
  } else {
    warnings.push("Supplier B unavailable");
  }

  // If BOTH suppliers failed
  if (offersA === null && offersB === null) {
    throw ApplicationFailure.nonRetryable("All suppliers unavailable");
  }

  const validA = offersA ?? [];
  const validB = offersB ?? [];

  // Deterministic pure merge
  const merged = mergeOffers(validA, validB);

  // Persist to Redis via activity
  await acts.saveOffersToCache(city, merged);

  return {
    hotels: merged,
    warnings,
  };
}
