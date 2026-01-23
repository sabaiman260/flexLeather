// src/validators/auth.validator.js
const { z } = require("zod");

const registerSchema = z.object({
    userName: z
        .string({ required_error: "Name is required" })
        .min(3, "Name must be at least 3 characters"),

    userEmail: z
        .string({ required_error: "Email is required" })
        .email("Invalid email address"),

    userPassword: z
        .string({ required_error: "Password is required" })
        .min(6, "Password must be at least 6 characters"),

    phoneNumber: z
        .string()
        .regex(/^[0-9]{11}$/, "Phone number must be 11 digits")
        .optional(),

    userAddress: z
        .string()
        .max(200, "Address cannot exceed 200 characters")
        .optional(),

    userRole: z
        .enum(["buyer", "admin"], {
            invalid_type_error: "Role must be buyer or admin",
        })
        .default("buyer")
        .optional(),
});

const loginSchema = z.object({
    userEmail: z
        .string({ required_error: "Email is required" })
        .email("Invalid email address"),

    userPassword: z
        .string({ required_error: "Password is required" })
        .min(6, "Password must be at least 6 characters"),
});

const forgotPasswordSchema = z.object({
    userEmail: z
        .string({ required_error: "Email is required" })
        .email("Invalid email address"),
});

const resetPasswordSchema = z.object({
    userPassword: z
        .string({ required_error: "Password is required" })
        .min(6, "Password must be at least 6 characters"),
});

const updateProfileSchema = z.object({
    userName: z.string().min(3, "Name must be at least 3 characters").optional(),
    phoneNumber: z
        .string()
        .regex(/^[0-9]{11}$/, "Phone number must be 11 digits")
        .optional(),
    userAddress: z.string().max(200, "Address cannot exceed 200 characters").optional(),
});

module.exports = { registerSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema, updateProfileSchema };
