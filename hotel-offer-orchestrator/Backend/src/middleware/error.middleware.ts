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
function findInErrorChain(err: unknown, predicate: (e: any) => boolean): boolean {
  let curr: any = err;
  let depth = 0;
  while (curr && depth < 10) {
    if (predicate(curr)) return true;
    curr = curr.cause;
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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
  const isAllSuppliersUnavailable = findInErrorChain(err, (e) => {
    return (
      (e.type === "ApplicationFailure" || e.name === "ApplicationFailure") &&
      typeof e.message === "string" &&
      e.message.includes("All suppliers unavailable")
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
    const msg = String(e?.message || "");
    const code = String(e?.code || "");
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
