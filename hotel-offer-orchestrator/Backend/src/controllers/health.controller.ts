import { Request, Response, NextFunction } from "express";
import { getHealthReport } from "../services/health.service";
import { logger } from "../config/logger";

/**
 * @route GET /health
 * @description Returns health status for Redis, Temporal, Supplier A, and Supplier B.
 * @access Public
 */
export async function getHealthController(
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const report = await getHealthReport();
    logger.info({ status: report.status }, "Health check");
    const httpStatus = report.status === "ok" ? 200 : 503;
    res.status(httpStatus).json(report);
  } catch (err) {
    next(err);
  }
}
