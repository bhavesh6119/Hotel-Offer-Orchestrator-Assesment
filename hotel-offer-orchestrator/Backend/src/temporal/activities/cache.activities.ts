import { HotelOffer } from "../../types/hotel.types";
import { redis } from "../../config/redis";
import { env } from "../../config/env";
import { logger } from "../../config/logger";

/** Redis key pattern: hotels:<normalised-city> */
function cityKey(city: string): string {
  return `hotels:${city.trim().toLowerCase()}`;
}

/**
 * Saves the merged hotel offers list to Redis as a JSON string.
 * TTL is controlled by CACHE_TTL_SECONDS env var.
 */
export async function saveOffersToCache(
  city: string,
  offers: HotelOffer[],
): Promise<void> {
  const key = cityKey(city);
  const payload = JSON.stringify(offers);
  await redis.set(key, payload, "EX", env.CACHE_TTL_SECONDS);
  logger.info({ key, count: offers.length, ttl: env.CACHE_TTL_SECONDS }, "Offers cached");
}

/**
 * Retrieves filtered hotel offers from Redis using ZRANGEBYSCORE
 * when min/max price are provided, otherwise returns the full list.
 *
 * We store the list as a flat JSON array (not a sorted set) so price
 * filtering is done by deserialising and filtering in JS — this keeps
 * the cache model simple while still living entirely in the cache layer.
 */
export async function getOffersFromCache(
  city: string,
  minPrice?: number,
  maxPrice?: number,
): Promise<HotelOffer[] | null> {
  const key = cityKey(city);
  const raw = await redis.get(key);
  if (!raw) return null;

  const offers: HotelOffer[] = JSON.parse(raw) as HotelOffer[];

  if (minPrice === undefined && maxPrice === undefined) {
    return offers;
  }

  return offers.filter((o) => {
    const aboveMin = minPrice === undefined || o.price >= minPrice;
    const belowMax = maxPrice === undefined || o.price <= maxPrice;
    return aboveMin && belowMax;
  });
}
