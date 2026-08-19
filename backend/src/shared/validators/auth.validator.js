// src/validators/auth.validator.js
import { z } from "zod";

export const registerSchema = z.object({
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
        .regex(/^\+[1-9]\d{1,14}$/, "Phone number must be in E.164 format (e.g. +923001234567)")
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

export const loginSchema = z.object({
    userEmail: z
        .string({ required_error: "Email is required" })
        .email("Invalid email address"),

    // Login: only require a non-empty password so wrong/short passwords
    // reach auth and return a generic credentials message.
    userPassword: z
        .string({ required_error: "Password is required" })
        .min(1, "Password is required"),
});

export const forgotPasswordSchema = z.object({
    userEmail: z
        .string({ required_error: "Email is required" })
        .email("Invalid email address"),
});

export const resetPasswordSchema = z.object({
    userPassword: z
        .string({ required_error: "Password is required" })
        .min(6, "Password must be at least 6 characters"),
});

export const updateProfileSchema = z.object({
    userName: z.string().min(3, "Name must be at least 3 characters").optional(),
    phoneNumber: z
        .string()
        .regex(/^\+[1-9]\d{1,14}$/, "Phone number must be in E.164 format (e.g. +923001234567)")
        .optional(),
    userAddress: z.string().max(200, "Address cannot exceed 200 characters").optional(),
});
