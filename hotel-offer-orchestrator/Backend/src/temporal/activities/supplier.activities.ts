import axios from "axios";
import { HotelOffer, RawSupplierHotel } from "../../types/hotel.types";
import { env } from "../../config/env";
import { logger } from "../../config/logger";

/**
 * Fetches hotel offers from Supplier A's mock endpoint for a given city.
 * Retryable: Temporal will retry on transient failures per workflow RetryPolicy.
 */
export async function fetchSupplierAOffers(city: string): Promise<HotelOffer[]> {
  const url = env.SUPPLIER_A_URL;
  const start = Date.now();
  logger.info({ activity: "fetchSupplierAOffers", city, url }, "Fetching Supplier A offers");

  try {
    const response = await axios.get<RawSupplierHotel[]>(url, {
      params: { city },
      timeout: 5000,
    });
    const durationMs = Date.now() - start;
    const rawHotels = response.data;

    const mappedOffers: HotelOffer[] = rawHotels.map((h) => ({
      name: h.name.trim(),
      price: h.price,
      supplier: "Supplier A",
      commissionPct: h.commissionPct,
    }));

    logger.info(
      { activity: "fetchSupplierAOffers", city, count: mappedOffers.length, durationMs },
      "Supplier A responded",
    );
    return mappedOffers;
  } catch (err) {
    const durationMs = Date.now() - start;
    logger.error({ activity: "fetchSupplierAOffers", city, durationMs, err }, "Supplier A fetch failed");
    throw err;
  }
}

/**
 * Fetches hotel offers from Supplier B's mock endpoint for a given city.
 * Retryable: Temporal will retry on transient failures per workflow RetryPolicy.
 */
export async function fetchSupplierBOffers(city: string): Promise<HotelOffer[]> {
  const url = env.SUPPLIER_B_URL;
  const start = Date.now();
  logger.info({ activity: "fetchSupplierBOffers", city, url }, "Fetching Supplier B offers");

  try {
    const response = await axios.get<RawSupplierHotel[]>(url, {
      params: { city },
      timeout: 5000,
    });
    const durationMs = Date.now() - start;
    const rawHotels = response.data;

    const mappedOffers: HotelOffer[] = rawHotels.map((h) => ({
      name: h.name.trim(),
      price: h.price,
      supplier: "Supplier B",
      commissionPct: h.commissionPct,
    }));

    logger.info(
      { activity: "fetchSupplierBOffers", city, count: mappedOffers.length, durationMs },
      "Supplier B responded",
    );
    return mappedOffers;
  } catch (err) {
    const durationMs = Date.now() - start;
    logger.error({ activity: "fetchSupplierBOffers", city, durationMs, err }, "Supplier B fetch failed");
    throw err;
  }
}
