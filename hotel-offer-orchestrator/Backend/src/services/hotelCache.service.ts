import { redis } from "../config/redis";
import { HotelOffer, Supplier } from "../types/hotel.types";
import { normalizeName } from "../utils/normalizeName";
import { env } from "../config/env";
import { logger } from "../config/logger";

function metaKey(normCity: string): string {
  return `hotels:${normCity}:cached`;
}

function zsetKey(normCity: string): string {
  return `hotels:${normCity}:by_price`;
}

function hotelHashKey(normCity: string, normName: string): string {
  return `hotel:${normCity}:${normName}`;
}

export async function hasCity(city: string): Promise<boolean> {
  const normCity = normalizeName(city);
  const exists = await redis.exists(metaKey(normCity));
  return exists === 1;
}

/**
 * Saves hotel offers for a city using a Redis sorted set + hotel hashes.
 * Storing price as the score enables range queries directly in Redis via ZRANGEBYSCORE,
 * avoiding the need to load and scan all hotels in Node.js application memory.
 */
export async function saveHotels(
  city: string,
  hotels: HotelOffer[],
  partial = false,
): Promise<void> {
  const normCity = normalizeName(city);
  const ttl = partial ? env.PARTIAL_CACHE_TTL_SECONDS : env.CACHE_TTL_SECONDS;
  const zKey = zsetKey(normCity);
  const mKey = metaKey(normCity);

  const existingMembers = await redis.zrange(zKey, 0, -1);
  const pipeline = redis.multi();

  for (const member of existingMembers) {
    pipeline.del(hotelHashKey(normCity, member));
  }
  pipeline.del(zKey);

  for (const hotel of hotels) {
    const normName = normalizeName(hotel.name);
    const hKey = hotelHashKey(normCity, normName);

    pipeline.hset(hKey, {
      name: hotel.name,
      price: hotel.price.toString(),
      supplier: hotel.supplier,
      commissionPct: hotel.commissionPct.toString(),
    });
    pipeline.expire(hKey, ttl);
    pipeline.zadd(zKey, hotel.price, normName);
  }

  if (hotels.length > 0) {
    pipeline.expire(zKey, ttl);
  }
  pipeline.set(mKey, "1", "EX", ttl);

  await pipeline.exec();
  logger.info({ city: normCity, count: hotels.length, ttl, partial }, "Saved hotels to Redis cache");
}

export async function getHotels(
  city: string,
  filter?: { minPrice?: number; maxPrice?: number },
): Promise<HotelOffer[]> {
  const normCity = normalizeName(city);
  const zKey = zsetKey(normCity);

  const min = filter?.minPrice !== undefined ? filter.minPrice.toString() : "-inf";
  const max = filter?.maxPrice !== undefined ? filter.maxPrice.toString() : "+inf";

  const normNames: string[] = await redis.zrangebyscore(zKey, min, max);

  if (normNames.length === 0) {
    return [];
  }

  const pipeline = redis.pipeline();
  for (const normName of normNames) {
    pipeline.hgetall(hotelHashKey(normCity, normName));
  }

  const results = await pipeline.exec();
  if (!results) {
    return [];
  }

  const offers: HotelOffer[] = [];
  for (let i = 0; i < results.length; i++) {
    const [err, data] = results[i] as [Error | null, Record<string, string>];
    if (err || !data || !data.name) {
      continue;
    }

    offers.push({
      name: data.name,
      price: Number(data.price),
      supplier: data.supplier as Supplier,
      commissionPct: Number(data.commissionPct),
    });
  }

  return offers;
}
