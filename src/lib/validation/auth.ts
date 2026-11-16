import { z } from "zod";

// These mirror the backend validators in app/schemas/auth.py.
export const password = z
  .string()
  .min(8, "At least 8 characters")
  .max(128, "At most 128 characters")
  .regex(/[A-Za-z]/, "Add a letter")
  .regex(/\d/, "Add a number");

export const username = z
  .string()
  .trim()
  .toLowerCase()
  .regex(/^[a-z0-9_.]{3,30}$/, "3–30 characters: letters, numbers, _ or .");

export const registerSchema = z
  .object({
    full_name: z.string().trim().min(2, "Enter your name").max(80),
    username,
    email: z.email("Enter a valid email").trim().toLowerCase(),
    age_range: z.enum(["13-17", "18-24", "25-34", "35-44", "45-54", "55+"], { message: "Pick your age range" }),
    sex: z.enum(["male", "female"], { message: "Pick a doll body" }),
    password,
    confirm_password: z.string(),
  })
  .refine((v) => v.password === v.confirm_password, {
    path: ["confirm_password"],
    message: "Passwords don't match",
  });

export type RegisterValues = z.input<typeof registerSchema>;

export const loginSchema = z.object({
  identifier: z.string().trim().min(3, "Enter your email or username"),
  password: z.string().min(1, "Enter your password"),
});

export const resetSchema = z
  .object({ password, confirm_password: z.string() })
  .refine((v) => v.password === v.confirm_password, {
    path: ["confirm_password"],
    message: "Passwords don't match",
  });

export const changePasswordSchema = z
  .object({ current_password: z.string().min(1, "Enter your current password"), new_password: password, confirm_password: z.string() })
  .refine((v) => v.new_password === v.confirm_password, {
    path: ["confirm_password"],
    message: "Passwords don't match",
  });
