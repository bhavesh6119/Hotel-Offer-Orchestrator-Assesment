import { HotelOffer } from "../../types/hotel.types";
import * as hotelCache from "../../services/hotelCache.service";

/**
 * Activity shim to save merged offers to Redis.
 * Delegates directly to services/hotelCache.service.ts.
 */
export async function saveOffersToCache(
  city: string,
  offers: HotelOffer[],
): Promise<void> {
  await hotelCache.saveHotels(city, offers);
}
