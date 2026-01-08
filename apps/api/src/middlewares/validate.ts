/**
 * Request Validation Middleware
 *
 * Uses Zod schemas to validate request body, params, and query.
 * Returns 400 Bad Request with detailed errors on validation failure.
 */

import type { Request, Response, NextFunction } from "express";
import { z, ZodError,  type ZodSchema } from "zod";

interface ValidationSchemas {
  body?: ZodSchema;
  params?: ZodSchema;
  query?: ZodSchema;
}

/**
 * Create validation middleware for request data
 *
 * @param schemas Object containing Zod schemas for body, params, query
 * @returns Express middleware
 */
export function validate(schemas: ValidationSchemas) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate body
      if (schemas.body) {
        req.body = await schemas.body.parseAsync(req.body);
      }
      // Validate params
      if (schemas.params) {
        const validatedParams = await schemas.params.parseAsync(req.params);
        Object.assign(req.params, validatedParams);
      }
      // Validate query
      if (schemas.query) {
        const validatedQuery = await schemas.query.parseAsync(req.query);
        // Note: Don't reassign req.query as it may be read-only in some Express setups
        // The validation is enough - parsedAsync throws on invalid data
        for (const key of Object.keys(validatedQuery as object)) {
          (req.query as Record<string, unknown>)[key] = (validatedQuery as Record<string, unknown>)[key];
        }
      }
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const formattedErrors = error.issues.map((issue) => ({
          field: issue.path.join("."),
          message: issue.message,
          code: issue.code,
        }));

        res.status(400).json({
          success: false,
          error: "Validation failed",
          code: "VALIDATION_ERROR",
          details: formattedErrors,
        });
        return;
      }

      // Unexpected error
      next(error);
    }
  };
}


/**
 * Validate body only (shorthand)
 */
export function validateBody(schema:ZodSchema){
    return validate({ body: schema });
}

/**
 * Validate params only (shorthand)
 */
export function validateParams(schema:ZodSchema){
    return validate({ params: schema });
}

/**
 * Validate query only (shorthand)
 */
export function validateQuery(schema:ZodSchema){
    return validate({ query: schema });
}