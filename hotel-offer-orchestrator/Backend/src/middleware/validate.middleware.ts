import { Request, Response, NextFunction } from "express";
import { ZodSchema, ZodError } from "zod";

/**
 * @middleware validate
 * @description Validates req.query against a Zod schema.
 *              Returns 400 with field-level errors on failure.
 */
export function validateQuery<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.query);

    if (!result.success) {
      const details = (result.error as ZodError).flatten().fieldErrors;
      res.status(400).json({ message: "Invalid query parameters", details });
      return;
    }

    // Attach parsed & coerced values back to req.query
    (req as Request & { parsedQuery: T }).parsedQuery = result.data;
    next();
  };
}
