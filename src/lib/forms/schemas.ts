import { z } from "zod";

export const nameField = z.string().trim().min(1, "Enter your name.").max(255);
export const emailField = z.string().trim().email("Enter a valid email address.").max(255);
export function authSchema(register: boolean) {
  return z.object({ name: z.string().trim().max(255), email: emailField,
    password: z.string().min(register ? 8 : 1, register ? "Use at least 8 characters." : "Enter your password.").max(128),
  }).superRefine((value, context) => {
    if (register && !value.name) context.addIssue({ code: "custom", path: ["name"], message: "Enter your name." });
  });
}
export type AuthValues = z.infer<ReturnType<typeof authSchema>>;
export const profileSchema = z.object({ name: nameField });
export const otpSchema = z.object({ code: z.string().regex(/^[0-9]{6}$/, "Enter the six-digit verification code.") });
export const checkoutSchema = z.object({
  name: nameField.max(120), email: emailField.max(254),
  phone: z.string().trim().regex(/^\+?[0-9][0-9 ()-]{6,23}$/, "Enter a valid phone number.").max(25),
  line1: z.string().trim().min(1, "Enter your delivery address.").max(250),
  line2: z.string().trim().max(250), postal_code: z.string().trim().max(20),
  city: z.string().regex(/^[1-9][0-9]*$/, "Choose a city."),
  shipping_rate: z.string().regex(/^[1-9][0-9]*$/, "Choose a delivery method."),
  payment_method: z.string().refine(value => ["cod", "bank_transfer"].includes(value), "Choose a payment method."),
});
export type CheckoutValues = z.infer<typeof checkoutSchema>;
export const quantitySchema = z.object({ quantity: z.number().int().min(0).max(99) });
