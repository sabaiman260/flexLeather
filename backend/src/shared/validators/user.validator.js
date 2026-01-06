import { z } from "zod";

const registerSchema = z.object({
    name: z.string("Name must be a string").min(3, "Name must be at least 3 characters long"),
    email: z.email("Invalid email"),
    password: z.string().min(6, "Password must be at least 6 characters long"),
    role: z.enum(["buyers", "store", "factory"]).default("buyers").optional()
})

export { registerSchema }  