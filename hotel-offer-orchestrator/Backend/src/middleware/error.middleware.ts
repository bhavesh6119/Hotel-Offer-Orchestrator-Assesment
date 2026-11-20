import { Request, Response, NextFunction } from "express";
import { logger } from "../config/logger";

/**
 * @middleware errorHandler
 * @description Global Express error handler. Returns a consistent JSON error shape.
 */
export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction,
): void {
  logger.error({ err, url: req.originalUrl }, "Unhandled error");

  res.status(500).json({
    message: "Internal server error",
    details: err.message,
  });
}
