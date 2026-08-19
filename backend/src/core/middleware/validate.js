import { ApiError } from "../utils/api-error.js";
import { asyncHandler } from "../utils/async-handler.js";

const getZodIssues = (error) => error?.issues || error?.errors || [];

const formatZodErrors = (zodErrors) =>
    (zodErrors || [])
        .map((err) => {
            const path = Array.isArray(err?.path) ? err.path.join(".") : "";
            const message = err?.message || "Invalid value";
            return path ? { field: path, message } : { message };
        })
        .filter((e) => e.message);

const validate = (schema) =>
    asyncHandler(async (req, res, next) => {
        try {
            // Single schema (body only)
            if (schema?.safeParse) {
                const result = schema.safeParse(req.body);
                if (!result.success) {
                    console.error("Zod validation error (body):", result.error);
                    let formattedErrors = formatZodErrors(getZodIssues(result.error));
                    if (!formattedErrors || formattedErrors.length === 0) {
                        formattedErrors = [{ message: "Please check your input and try again." }];
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
                        const fe = formatZodErrors(getZodIssues(r.error));
                        if (fe.length) allErrors.push(...fe);
                        else allErrors.push({ message: "Please check your input and try again." });
                    }
                }
                if (schema?.query) {
                    const r = schema.query.safeParse(req.query);
                    if (!r.success) {
                        console.error("Zod validation error (query):", r.error);
                        const fe = formatZodErrors(getZodIssues(r.error));
                        if (fe.length) allErrors.push(...fe);
                        else allErrors.push({ message: "Please check your input and try again." });
                    }
                }
                if (schema?.params) {
                    const r = schema.params.safeParse(req.params);
                    if (!r.success) {
                        console.error("Zod validation error (params):", r.error);
                        const fe = formatZodErrors(getZodIssues(r.error));
                        if (fe.length) allErrors.push(...fe);
                        else allErrors.push({ message: "Please check your input and try again." });
                    }
                }

                if (allErrors.length) {
                    throw new ApiError(400, "Validation failed", allErrors);
                }
            }

            next();
        } catch (error) {
            // If we already threw an ApiError, rethrow it
            throw error;
        }
    });

export { validate };
