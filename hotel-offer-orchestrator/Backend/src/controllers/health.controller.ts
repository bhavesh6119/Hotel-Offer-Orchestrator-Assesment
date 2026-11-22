import { Request, Response, NextFunction } from "express";
import { getHealthReport } from "../services/health.service";
import { logger } from "../config/logger";

/**
 * @route GET /health or GET /api/health
 * @description Returns health status for Redis, Temporal, Supplier A, and Supplier B.
 *              Returns 200 for "ok" and "degraded" (at least one supplier up AND redis + temporal up);
 *              503 otherwise.
 * @access Public
 */
export async function getHealthController(
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const report = await getHealthReport();
    logger.info({ status: report.status }, "Health check executed");

    // Return 200 for "ok" and "degraded", 503 otherwise
    const httpStatus = report.status === "ok" || report.status === "degraded" ? 200 : 503;
    res.status(httpStatus).json(report);
  } catch (err) {
    next(err);
  }
}
