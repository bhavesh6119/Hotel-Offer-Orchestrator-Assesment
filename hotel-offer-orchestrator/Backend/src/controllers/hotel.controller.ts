import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { getHotels } from "../services/hotel.service";
import { logger } from "../config/logger";

export const getHotelsQuerySchema = z.object({
  city: z.string().min(1, "city is required"),
  minPrice: z.coerce.number().nonnegative().optional(),
  maxPrice: z.coerce.number().positive().optional(),
});

export type GetHotelsQuery = z.infer<typeof getHotelsQuerySchema>;

/**
 * @route GET /api/hotels
 * @description Starts (or reuses cached) a Temporal workflow to fetch, dedupe,
 *              and return hotel offers. Supports optional price-range filtering.
 * @access Public
 */
export async function getHotelsController(
  req: Request & { parsedQuery?: GetHotelsQuery },
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const query = req.parsedQuery ?? (req.query as unknown as GetHotelsQuery);
    logger.info({ query }, "Hotel search requested");

    const offers = await getHotels({
      city: query.city,
      minPrice: query.minPrice,
      maxPrice: query.maxPrice,
    });

    res.json(offers);
  } catch (err) {
    next(err);
  }
}
