import { z } from "zod";

// Address schema
export const addressSchema = z.object({
  fullName: z.string().min(1, "Full name is required"),
  company: z.string().optional(),
  phone: z.string().min(10, "Phone number must be at least 10 digits"),
  email: z.string().email("Invalid email address"),
  address1: z.string().min(1, "Address is required"),
  address2: z.string().optional(),
  city: z.string().min(1, "City is required"),
  province: z.string().min(2, "Province/State is required"),
  postalCode: z.string().min(5, "Postal/ZIP code is required"),
  country: z.string().length(2, "Country code must be 2 characters"),
});

// Package schema
export const packageSchema = z.object({
  length: z.number().positive("Length must be greater than 0"),
  width: z.number().positive("Width must be greater than 0"),
  height: z.number().positive("Height must be greater than 0"),
  weight: z.number().positive("Weight must be greater than 0"),
  value: z.number().positive("Value must be greater than 0"),
});

// Multi-step form schema
export const multiStepFormSchema = z.object({
  sender: addressSchema,
  recipient: addressSchema,
  package: packageSchema,
});

// Shipping service type
export interface ShippingService {
  id: string;
  name: string;
  carrier?: string;
  price: number;
  estimatedDays?: string;
  tracking?: boolean;
  insurance?: boolean;
  description?: string;
}

// Shipping quote response
export interface ShippingQuoteResponse {
  currency: string;
  services: ShippingService[];
}

// Quote request
export interface QuoteRequest {
  origin: {
    country: string;
    postalCode: string;
    city: string;
    province: string;
  };
  destination: {
    country: string;
    postalCode: string;
    city: string;
    province: string;
  };
  package: {
    length: number;
    width: number;
    height: number;
    weight: number;
    value: number;
  };
}

// Order type
export interface Order {
  id: string;
  sender: z.infer<typeof addressSchema>;
  recipient: z.infer<typeof addressSchema>;
  package: z.infer<typeof packageSchema>;
  service: ShippingService;
  totalPrice: number;
  currency: string;
  status: string;
  createdAt: string;
  trackingNumber?: string;
}

// Type exports
export type MultiStepForm = z.infer<typeof multiStepFormSchema>;
export type Address = z.infer<typeof addressSchema>;
export type Package = z.infer<typeof packageSchema>;
