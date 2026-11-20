import { getTemporalClient } from "../config/temporal";
import { getCachedOffers } from "./hotelCache.service";
import { HotelOffer, GetHotelsQuery } from "../types/hotel.types";
import { env } from "../config/env";
import { logger } from "../config/logger";

/**
 * Orchestrates hotel offer retrieval:
 * 1. Check Redis cache first (with optional price filter).
 * 2. On cache miss → start a Temporal workflow to fetch, merge, and cache.
 * 3. Return filtered results from cache after workflow completes.
 */
export async function getHotels(query: GetHotelsQuery): Promise<HotelOffer[]> {
  const { city, minPrice, maxPrice } = query;

  // 1. Try cache first
  const cached = await getCachedOffers(city, minPrice, maxPrice);
  if (cached) {
    logger.info({ city, count: cached.length }, "Returning cached offers");
    return cached;
  }

  // 2. Cache miss -> trigger Temporal workflow
  logger.info({ city }, "Cache miss - starting Temporal workflow");
  const client = await getTemporalClient();

  const workflowId = `hotel-offers-${city.toLowerCase()}-${Date.now()}`;

  const result = await client.workflow.execute("hotelOfferWorkflow", {
    taskQueue: env.TEMPORAL_TASK_QUEUE,
    workflowId,
    args: [city],
  });

  logger.info({ city, workflowId, count: (result as HotelOffer[]).length }, "Workflow complete");

  // 3. Apply price filter to result (workflow already cached the full list)
  const offers = result as HotelOffer[];

  if (minPrice === undefined && maxPrice === undefined) return offers;

  return offers.filter((o) => {
    const aboveMin = minPrice === undefined || o.price >= minPrice;
    const belowMax = maxPrice === undefined || o.price <= maxPrice;
    return aboveMin && belowMax;
  });
}
