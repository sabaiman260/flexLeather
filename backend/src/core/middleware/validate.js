import { ApiError } from "../utils/api-error.js";
import { asyncHandler } from "../utils/async-handler.js";

const formatZodErrors = (zodErrors) =>
    (zodErrors || []).map((err) => ({ field: err.path.join("."), message: err.message }));

const validate = (schema) =>
    asyncHandler(async (req, res, next) => {
        try {
            // Single schema (body only)
            if (schema?.safeParse) {
                const result = schema.safeParse(req.body);
                if (!result.success) {
                    // Log full Zod error for debugging when unexpected shape occurs
                    console.error("Zod validation error (body):", result.error);
                    let formattedErrors = formatZodErrors(result.error.errors);
                    if (!formattedErrors || formattedErrors.length === 0) {
                        formattedErrors = [{ message: result.error.message || "Validation failed" }];
                    }
                    throw new ApiError(400, "Validation failed", formattedErrors);
                }
            } else {
                // Multiple schema keys (body, query, params)
                const allErrors = [];
                if (schema?.body) {
                    const r = schema.body.safeParse(req.body);
                    if (!r.success) {
                        console.error("Zod validation error (body):", r.error);
                        const fe = formatZodErrors(r.error.errors);
                        if (fe.length) allErrors.push(...fe);
                        else allErrors.push({ message: r.error.message || "Validation failed" });
                    }
                }
                if (schema?.query) {
                    const r = schema.query.safeParse(req.query);
                    if (!r.success) {
                        console.error("Zod validation error (query):", r.error);
                        const fe = formatZodErrors(r.error.errors);
                        if (fe.length) allErrors.push(...fe);
                        else allErrors.push({ message: r.error.message || "Validation failed" });
                    }
                }
                if (schema?.params) {
                    const r = schema.params.safeParse(req.params);
                    if (!r.success) {
                        console.error("Zod validation error (params):", r.error);
                        const fe = formatZodErrors(r.error.errors);
                        if (fe.length) allErrors.push(...fe);
                        else allErrors.push({ message: r.error.message || "Validation failed" });
                    }
                }

                if (allErrors.length) {
                    throw new ApiError(400, "Validation failed", allErrors);
                }
            }

            next();
        } catch (error) {
            // If we already threw an ApiError, rethrow it
            if (error.name === "ApiError" || error instanceof ApiError) {
                throw error;
            }

            // Log unexpected validation/internal errors and return a 500
            console.error("Unexpected validation error:", error);
            throw new ApiError(500, "Unexpected validation error", [
                { message: error?.message || "Unknown error" },
            ]);
        }
    });

export { validate };
