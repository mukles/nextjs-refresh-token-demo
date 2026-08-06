import { z } from "zod";
import { isValidBangladeshMobile } from "@/lib/mobile-number";

export const checkoutSchema = z.object({
  customerName: z.string().trim().min(2, "Enter your full name."),
  mobileNumber: z
    .string()
    .trim()
    .refine(isValidBangladeshMobile, "Enter a valid Bangladesh mobile number."),
  deliveryAddress: z
    .string()
    .trim()
    .min(10, "Enter a complete delivery address."),
  paymentMethod: z.enum(["Cash on Delivery", "bKash"], {
    error: "Choose a payment method.",
  }),
});

export type CheckoutFormValues = z.infer<typeof checkoutSchema>;
