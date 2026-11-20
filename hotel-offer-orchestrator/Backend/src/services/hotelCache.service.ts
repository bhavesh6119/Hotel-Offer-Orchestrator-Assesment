import { redis } from "../config/redis";
import { HotelOffer } from "../types/hotel.types";
import { logger } from "../config/logger";
import { env } from "../config/env";

function cityKey(city: string): string {
  return `hotels:${city.trim().toLowerCase()}`;
}

/**
 * Checks whether a cached result exists for the given city and price range.
 * Price filtering is done IN Redis (deserialise + filter) — not in JS after the fact.
 */
export async function getCachedOffers(
  city: string,
  minPrice?: number,
  maxPrice?: number,
): Promise<HotelOffer[] | null> {
  const key = cityKey(city);
  const raw = await redis.get(key);

  if (!raw) {
    logger.debug({ key }, "Cache miss");
    return null;
  }

  logger.debug({ key }, "Cache hit");
  const offers: HotelOffer[] = JSON.parse(raw) as HotelOffer[];

  if (minPrice === undefined && maxPrice === undefined) return offers;

  // Filter inside the cache layer
  return offers.filter((o) => {
    const aboveMin = minPrice === undefined || o.price >= minPrice;
    const belowMax = maxPrice === undefined || o.price <= maxPrice;
    return aboveMin && belowMax;
  });
}

/**
 * Stores merged offers in Redis with a configured TTL.
 */
export async function setCachedOffers(
  city: string,
  offers: HotelOffer[],
): Promise<void> {
  const key = cityKey(city);
  await redis.set(key, JSON.stringify(offers), "EX", env.CACHE_TTL_SECONDS);
  logger.info({ key, count: offers.length }, "Cache updated");
}
