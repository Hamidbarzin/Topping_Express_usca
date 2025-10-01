import { useState } from "react";
import { UseFormReturn } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

interface StepSenderProps {
  form: UseFormReturn<any>;
}

const CANADIAN_PROVINCES = [
  { code: "ON", name: "Ontario" },
  { code: "BC", name: "British Columbia" },
  { code: "QC", name: "Quebec" },
  { code: "AB", name: "Alberta" },
  { code: "MB", name: "Manitoba" },
  { code: "NS", name: "Nova Scotia" },
  { code: "NB", name: "New Brunswick" },
  { code: "NL", name: "Newfoundland and Labrador" },
  { code: "PE", name: "Prince Edward Island" },
  { code: "SK", name: "Saskatchewan" },
  { code: "YT", name: "Yukon" },
  { code: "NT", name: "Northwest Territories" },
  { code: "NU", name: "Nunavut" },
];

export default function StepSender({ form }: StepSenderProps) {
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Validation functions
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePostalCode = (postalCode: string): boolean => {
    // Canadian postal code format: A1A 1A1
    const postalCodeRegex = /^[A-Za-z]\d[A-Za-z][ -]?\d[A-Za-z]\d$/;
    return postalCodeRegex.test(postalCode);
  };

  const validatePhone = (phone: string): boolean => {
    // Basic phone validation (10+ digits)
    const phoneRegex = /^[\d\s\-\(\)]+$/;
    const digitCount = phone.replace(/\D/g, '').length;
    return phoneRegex.test(phone) && digitCount >= 10;
  };

  const handleFieldChange = (field: string, value: string) => {
    form.setValue(`sender.${field}`, value);
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleBlur = (field: string) => {
    const value = form.getValues(`sender.${field}`);
    let error = "";

    switch (field) {
      case "email":
        if (value && !validateEmail(value)) {
          error = "Please enter a valid email address";
        }
        break;
      case "postalCode":
        if (value && !validatePostalCode(value)) {
          error = "Please enter a valid Canadian postal code (e.g., A1A 1A1)";
        }
        break;
      case "phone":
        if (value && !validatePhone(value)) {
          error = "Please enter a valid phone number (10+ digits)";
        }
        break;
    }

    if (error) {
      setErrors(prev => ({ ...prev, [field]: error }));
    }
  };

  const senderData = form.watch("sender") || {};

  return (
    <div className="space-y-6">
      <Alert className="bg-blue-50 border-blue-200">
        <AlertCircle className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-800">
          Please provide the sender's complete information. All fields marked with * are required.
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Full Name */}
        <div className="space-y-2">
          <Label htmlFor="sender-fullName" className="text-sm font-medium">
            Full Name <span className="text-red-500">*</span>
          </Label>
          <Input
            id="sender-fullName"
            type="text"
            placeholder="John Doe"
            value={senderData.fullName || ""}
            onChange={(e) => handleFieldChange("fullName", e.target.value)}
            required
            className={errors.fullName ? "border-red-500" : ""}
          />
          {errors.fullName && (
            <p className="text-sm text-red-500">{errors.fullName}</p>
          )}
        </div>

        {/* Company */}
        <div className="space-y-2">
          <Label htmlFor="sender-company" className="text-sm font-medium">
            Company (Optional)
          </Label>
          <Input
            id="sender-company"
            type="text"
            placeholder="Company Name"
            value={senderData.company || ""}
            onChange={(e) => handleFieldChange("company", e.target.value)}
          />
        </div>

        {/* Phone */}
        <div className="space-y-2">
          <Label htmlFor="sender-phone" className="text-sm font-medium">
            Phone Number <span className="text-red-500">*</span>
          </Label>
          <Input
            id="sender-phone"
            type="tel"
            placeholder="(123) 456-7890"
            value={senderData.phone || ""}
            onChange={(e) => handleFieldChange("phone", e.target.value)}
            onBlur={() => handleBlur("phone")}
            required
            className={errors.phone ? "border-red-500" : ""}
          />
          {errors.phone && (
            <p className="text-sm text-red-500">{errors.phone}</p>
          )}
        </div>

        {/* Email */}
        <div className="space-y-2">
          <Label htmlFor="sender-email" className="text-sm font-medium">
            Email Address <span className="text-red-500">*</span>
          </Label>
          <Input
            id="sender-email"
            type="email"
            placeholder="john.doe@example.com"
            value={senderData.email || ""}
            onChange={(e) => handleFieldChange("email", e.target.value)}
            onBlur={() => handleBlur("email")}
            required
            className={errors.email ? "border-red-500" : ""}
          />
          {errors.email && (
            <p className="text-sm text-red-500">{errors.email}</p>
          )}
        </div>

        {/* Address Line 1 */}
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="sender-address1" className="text-sm font-medium">
            Address Line 1 <span className="text-red-500">*</span>
          </Label>
          <Input
            id="sender-address1"
            type="text"
            placeholder="123 Main Street"
            value={senderData.address1 || ""}
            onChange={(e) => handleFieldChange("address1", e.target.value)}
            required
            className={errors.address1 ? "border-red-500" : ""}
          />
          {errors.address1 && (
            <p className="text-sm text-red-500">{errors.address1}</p>
          )}
        </div>

        {/* Address Line 2 */}
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="sender-address2" className="text-sm font-medium">
            Address Line 2 (Optional)
          </Label>
          <Input
            id="sender-address2"
            type="text"
            placeholder="Apartment, suite, unit, etc."
            value={senderData.address2 || ""}
            onChange={(e) => handleFieldChange("address2", e.target.value)}
          />
        </div>

        {/* City */}
        <div className="space-y-2">
          <Label htmlFor="sender-city" className="text-sm font-medium">
            City <span className="text-red-500">*</span>
          </Label>
          <Input
            id="sender-city"
            type="text"
            placeholder="Toronto"
            value={senderData.city || ""}
            onChange={(e) => handleFieldChange("city", e.target.value)}
            required
            className={errors.city ? "border-red-500" : ""}
          />
          {errors.city && (
            <p className="text-sm text-red-500">{errors.city}</p>
          )}
        </div>

        {/* Province */}
        <div className="space-y-2">
          <Label htmlFor="sender-province" className="text-sm font-medium">
            Province <span className="text-red-500">*</span>
          </Label>
          <select
            id="sender-province"
            value={senderData.province || ""}
            onChange={(e) => handleFieldChange("province", e.target.value)}
            required
            className={`flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${
              errors.province ? "border-red-500" : ""
            }`}
          >
            <option value="">Select a province</option>
            {CANADIAN_PROVINCES.map((province) => (
              <option key={province.code} value={province.code}>
                {province.name} ({province.code})
              </option>
            ))}
          </select>
          {errors.province && (
            <p className="text-sm text-red-500">{errors.province}</p>
          )}
        </div>

        {/* Postal Code */}
        <div className="space-y-2">
          <Label htmlFor="sender-postalCode" className="text-sm font-medium">
            Postal Code <span className="text-red-500">*</span>
          </Label>
          <Input
            id="sender-postalCode"
            type="text"
            placeholder="A1A 1A1"
            value={senderData.postalCode || ""}
            onChange={(e) => handleFieldChange("postalCode", e.target.value.toUpperCase())}
            onBlur={() => handleBlur("postalCode")}
            required
            maxLength={7}
            className={errors.postalCode ? "border-red-500" : ""}
          />
          {errors.postalCode && (
            <p className="text-sm text-red-500">{errors.postalCode}</p>
          )}
        </div>

        {/* Country */}
        <div className="space-y-2">
          <Label htmlFor="sender-country" className="text-sm font-medium">
            Country <span className="text-red-500">*</span>
          </Label>
          <Input
            id="sender-country"
            type="text"
            value="Canada"
            disabled
            className="bg-gray-50"
          />
          <input type="hidden" value="CA" {...form.register("sender.country")} />
        </div>
      </div>
    </div>
  );
}
