import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { getHotels } from "../services/hotel.service";
import { logger } from "../config/logger";

export const getHotelsQuerySchema = z
  .object({
    city: z.string().trim().min(1, "city is required").transform((c) => c.toLowerCase()),
    minPrice: z.coerce.number().nonnegative("minPrice must be >= 0").optional(),
    maxPrice: z.coerce.number().nonnegative("maxPrice must be >= 0").optional(),
  })
  .refine(
    (data) => {
      if (data.minPrice !== undefined && data.maxPrice !== undefined) {
        return data.minPrice <= data.maxPrice;
      }
      return true;
    },
    {
      message: "minPrice cannot be greater than maxPrice",
      path: ["minPrice"],
    },
  );

export type GetHotelsQuery = z.infer<typeof getHotelsQuerySchema>;

/**
 * @route GET /api/hotels
 * @description Starts (or reuses cached) a Temporal workflow to fetch, dedupe,
 *              and return hotel offers. Supports optional price-range filtering inside Redis.
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

    const { hotels, warnings } = await getHotels({
      city: query.city,
      minPrice: query.minPrice,
      maxPrice: query.maxPrice,
    });

    if (warnings.length > 0) {
      res.setHeader("X-Supplier-Warnings", warnings.join("; "));
    }

    res.json(hotels);
  } catch (err) {
    next(err);
  }
}
