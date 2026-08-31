import { ApiError } from "../utils/api-error.js";

export const errorHandler = (err, req, res, next) => {
    // Log backend error details for faster troubleshooting
    console.error("[ErrorHandler]", err);

    // Handle Mongo duplicate key error (E11000)
    if (err.code === 11000) {
        const field = Object.keys(err.keyPattern || err.keyValue || {})[0] || "field";
        const val = err.keyValue ? err.keyValue[field] : "";
        return res.status(400).json({
            success: false,
            message: `Duplicate value '${val}' for ${field}. It must be unique.`,
            errors: [{ field, message: `Duplicate value '${val}'` }],
            stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
        });
    }

    // Handle Mongoose ValidationError
    if (err.name === "ValidationError") {
        const errors = Object.values(err.errors || {}).map((e) => ({
            field: e.path,
            message: e.message,
        }));
        return res.status(400).json({
            success: false,
            message: err.message || "Validation Error",
            errors,
            stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
        });
    }

    if (err instanceof ApiError) {
        return res.status(err.statusCode).json({
            success: false,
            message: err.message,
            errors: err.errors,
            stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
        });
    }

    // Fallback for unhandled errors
    return res.status(500).json({
        success: false,
        message: err.message || "Internal Server Error",
        stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
    });
};
