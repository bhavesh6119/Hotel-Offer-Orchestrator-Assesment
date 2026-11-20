import { Request, Response, NextFunction } from "express";
import { logger } from "../config/logger";

/**
 * @middleware requestLogger
 * @description Logs every incoming HTTP request with method, URL, and response time.
 */
export function requestLogger(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const start = Date.now();

  res.on("finish", () => {
    logger.info(
      {
        method: req.method,
        url: req.originalUrl,
        status: res.statusCode,
        durationMs: Date.now() - start,
      },
      "Request completed",
    );
  });

  next();
}
