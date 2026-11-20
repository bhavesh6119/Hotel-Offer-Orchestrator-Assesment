import { getTemporalClient } from "../config/temporal";
import * as hotelCache from "./hotelCache.service";
import { HotelOffer, GetHotelsQuery, WorkflowResult } from "../types/hotel.types";
import { env } from "../config/env";
import { logger } from "../config/logger";

export interface GetHotelsServiceResult {
  hotels: HotelOffer[];
  warnings: string[];
}

/**
 * Orchestrates hotel offer retrieval:
 * - If no price filter is provided: always runs the Temporal workflow (refreshes Redis) and returns hotels.
 * - If minPrice or maxPrice is provided:
 *     - If the city is NOT cached, runs the workflow first.
 *     - Fetches and filters results directly inside Redis using hotelCache.getHotels().
 *     - No JS-side price filtering.
 */
export async function getHotels(query: GetHotelsQuery): Promise<GetHotelsServiceResult> {
  const { city, minPrice, maxPrice } = query;
  const hasFilter = minPrice !== undefined || maxPrice !== undefined;

  let warnings: string[] = [];

  const executeWorkflow = async (): Promise<WorkflowResult> => {
    logger.info({ city }, "Starting Temporal hotelOfferWorkflow");
    const client = await getTemporalClient();
    const workflowId = `hotel-offers-${city.toLowerCase()}-${Date.now()}`;

    const handle = await client.workflow.start("hotelOfferWorkflow", {
      taskQueue: env.TEMPORAL_TASK_QUEUE,
      workflowId,
      args: [city],
    });

    const result = await handle.result();
    logger.info(
      { city, workflowId, count: result.hotels.length, warnings: result.warnings },
      "Workflow complete",
    );
    return result;
  };

  if (!hasFilter) {
    // No price filter -> always run workflow to refresh Redis and return hotels
    const wfResult = await executeWorkflow();
    return {
      hotels: wfResult.hotels,
      warnings: wfResult.warnings,
    };
  }

  // Price filter is active
  const cityCached = await hotelCache.hasCity(city);
  if (!cityCached) {
    logger.info({ city }, "City not in cache with price filter, executing workflow first");
    const wfResult = await executeWorkflow();
    warnings = wfResult.warnings;
  }

  // Answer directly from Redis (filtering inside Redis via ZRANGEBYSCORE)
  const filteredHotels = await hotelCache.getHotels(city, { minPrice, maxPrice });
  return {
    hotels: filteredHotels,
    warnings,
  };
}
