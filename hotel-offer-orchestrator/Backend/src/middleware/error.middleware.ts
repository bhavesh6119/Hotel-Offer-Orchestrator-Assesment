import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { logger } from "../config/logger";
import { env } from "../config/env";

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly details?: unknown;

  constructor(statusCode: number, message: string, details?: unknown) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.details = details;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/**
 * Checks error and its cause chain recursively for matching patterns
 */
function findInErrorChain(err: unknown, predicate: (e: unknown) => boolean): boolean {
  let curr: unknown = err;
  let depth = 0;
  while (curr !== null && typeof curr === "object" && depth < 10) {
    if (predicate(curr)) return true;
    curr = "cause" in curr ? (curr as { cause?: unknown }).cause : undefined;
    depth++;
  }
  return false;
}

/**
 * @middleware errorHandler
 * @description Global Express error handler. Returns a consistent JSON error shape:
 *              { message: string, details?: unknown }
 */
export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction,
): void {
  logger.error({ err, url: req.originalUrl, method: req.method }, "Error processing request");

  // 1. Zod Validation Error -> 400
  if (err instanceof ZodError) {
    res.status(400).json({
      message: "Validation failed",
      details: err.flatten().fieldErrors,
    });
    return;
  }

  // 2. Custom AppError
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      message: err.message,
      ...(err.details !== undefined && { details: err.details }),
    });
    return;
  }

  // 3. Workflow failure whose root cause is ApplicationFailure "All suppliers unavailable" -> 503
  const isAllSuppliersUnavailable =
    findInErrorChain(err, (e) => {
      if (typeof e !== "object" || e === null) return false;
      const rec = e as Record<string, unknown>;
      return (
        (rec.type === "ApplicationFailure" || rec.name === "ApplicationFailure") &&
        typeof rec.message === "string" &&
        rec.message.includes("All suppliers unavailable")
      );
    }) || (typeof err.message === "string" && err.message.includes("All suppliers unavailable"));

  if (isAllSuppliersUnavailable) {
    res.status(503).json({
      message: "All suppliers unavailable",
    });
    return;
  }

  // 4. Temporal or Redis connection issues -> 503
  const isConnectionProblem = findInErrorChain(err, (e) => {
    if (typeof e !== "object" || e === null) return false;
    const rec = e as Record<string, unknown>;
    const msg = typeof rec.message === "string" ? rec.message : "";
    const code = typeof rec.code === "string" ? rec.code : "";
    return (
      msg.includes("Failed to connect before the deadline") ||
      msg.includes("ECONNREFUSED") ||
      msg.includes("Connection lost") ||
      code === "ECONNREFUSED"
    );
  });

  if (isConnectionProblem) {
    res.status(503).json({
      message: "Service temporarily unavailable due to upstream dependency connection failure",
    });
    return;
  }

  // 5. Default generic error
  const isProd = env.NODE_ENV === "production";
  res.status(500).json({
    message: isProd ? "Internal server error" : (err.message || "Internal server error"),
    ...(!isProd && err.stack ? { details: err.stack } : {}),
  });
}
