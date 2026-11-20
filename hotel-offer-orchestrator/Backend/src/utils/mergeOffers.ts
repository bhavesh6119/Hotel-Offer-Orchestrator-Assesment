import { HotelOffer, Supplier } from "../types/hotel.types";
import { normalizeName } from "./normalizeName";

/**
 * Merges two arrays of hotel offers by deduplicating on normalised hotel name.
 * Rules:
 * 1. Cheaper offer wins.
 * 2. Tie-break: lower commissionPct wins.
 * 3. Tie-break: Supplier A wins over Supplier B.
 * Pure function — no I/O, no side effects.
 */
export function mergeOffers(
  offersA: HotelOffer[],
  offersB: HotelOffer[],
): HotelOffer[] {
  const map = new Map<string, HotelOffer>();

  // Determine if incoming offer is preferred over existing offer
  function isBetterOffer(candidate: HotelOffer, existing: HotelOffer): boolean {
    if (candidate.price < existing.price) {
      return true;
    }
    if (candidate.price > existing.price) {
      return false;
    }

    // Tie in price: lower commissionPct wins
    if (candidate.commissionPct < existing.commissionPct) {
      return true;
    }
    if (candidate.commissionPct > existing.commissionPct) {
      return false;
    }

    // Tie in commissionPct: Supplier A wins
    if (candidate.supplier === "Supplier A" && existing.supplier !== "Supplier A") {
      return true;
    }

    return false;
  }

  for (const offer of [...offersA, ...offersB]) {
    const key = normalizeName(offer.name);
    const existing = map.get(key);

    if (!existing || isBetterOffer(offer, existing)) {
      map.set(key, offer);
    }
  }

  return Array.from(map.values());
}
