import axios from "axios";
import { HotelOffer } from "../../types/hotel.types";
import { env } from "../../config/env";
import { logger } from "../../config/logger";

/**
 * Fetches hotel offers from Supplier A's mock endpoint.
 * Retryable: Temporal will retry on transient failures per workflow RetryPolicy.
 */
export async function fetchSupplierAOffers(): Promise<HotelOffer[]> {
  const url = env.SUPPLIER_A_URL;
  logger.info({ url }, "Fetching Supplier A offers");

  try {
    const response = await axios.get<HotelOffer[]>(url, { timeout: 5000 });
    logger.info({ count: response.data.length }, "Supplier A responded");
    return response.data;
  } catch (err) {
    logger.error({ err, url }, "Supplier A fetch failed");
    // Re-throw as a plain Error — Temporal wraps it in ApplicationFailure automatically
    throw new Error(`Supplier A fetch failed: ${(err as Error).message}`);
  }
}

/**
 * Fetches hotel offers from Supplier B's mock endpoint.
 * Retryable: Temporal will retry on transient failures per workflow RetryPolicy.
 */
export async function fetchSupplierBOffers(): Promise<HotelOffer[]> {
  const url = env.SUPPLIER_B_URL;
  logger.info({ url }, "Fetching Supplier B offers");

  try {
    const response = await axios.get<HotelOffer[]>(url, { timeout: 5000 });
    logger.info({ count: response.data.length }, "Supplier B responded");
    return response.data;
  } catch (err) {
    logger.error({ err, url }, "Supplier B fetch failed");
    throw new Error(`Supplier B fetch failed: ${(err as Error).message}`);
  }
}
