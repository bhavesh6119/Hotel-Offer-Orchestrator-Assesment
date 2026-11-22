import { Request, Response, NextFunction } from "express";
import { randomUUID } from "node:crypto";
import { logger } from "../config/logger";

declare global {
  namespace Express {
    interface Request {
      id?: string;
    }
  }
}

/**
 * @middleware requestLogger
 * @description Injects a unique requestId (crypto.randomUUID) and logs every incoming HTTP
 *              request with method, URL, status, and durationMs.
 */
export function requestLogger(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const requestId = randomUUID();
  req.id = requestId;
  res.setHeader("X-Request-Id", requestId);

  const start = Date.now();

  res.on("finish", () => {
    logger.info(
      {
        requestId,
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
