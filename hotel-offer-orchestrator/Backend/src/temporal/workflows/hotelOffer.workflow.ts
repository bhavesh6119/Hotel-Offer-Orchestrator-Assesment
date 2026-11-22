// Temporal workflows must be deterministic for replay execution.
// All side effects and network I/O must run inside activities.
import { proxyActivities, ActivityOptions, ApplicationFailure } from "@temporalio/workflow";
import type { fetchSupplierAOffers, fetchSupplierBOffers } from "../activities/supplier.activities";
import type { saveOffersToCache } from "../activities/cache.activities";
import { mergeOffers } from "../../utils/mergeOffers";
import { HotelOffer, WorkflowResult } from "../../types/hotel.types";

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

  if (offersA === null && offersB === null) {
    throw ApplicationFailure.nonRetryable("All suppliers unavailable");
  }

  const validA = offersA ?? [];
  const validB = offersB ?? [];

  const merged = mergeOffers(validA, validB);
  const isPartial = warnings.length > 0;

  await acts.saveOffersToCache(city, merged, isPartial);

  return {
    hotels: merged,
    warnings,
  };
}
