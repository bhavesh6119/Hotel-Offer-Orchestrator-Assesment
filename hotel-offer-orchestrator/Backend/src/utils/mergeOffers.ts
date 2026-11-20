import { HotelOffer } from "../types/hotel.types";
import { normalizeName } from "./normalizeName";

/**
 * Merges two arrays of hotel offers by deduplicating on normalised hotel name.
 * When two offers share the same name, the cheaper one is kept.
 * Pure function — no I/O, no side effects.
 */
export function mergeOffers(
  offersA: HotelOffer[],
  offersB: HotelOffer[],
): HotelOffer[] {
  const map = new Map<string, HotelOffer>();

  for (const offer of [...offersA, ...offersB]) {
    const key = normalizeName(offer.name);
    const existing = map.get(key);

    if (!existing || offer.price < existing.price) {
      map.set(key, offer);
    }
  }

  return Array.from(map.values());
}
