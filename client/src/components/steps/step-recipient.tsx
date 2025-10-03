import { useState } from "react";
import { UseFormReturn } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Copy } from "lucide-react";

interface StepRecipientProps {
  form: UseFormReturn<any>;
  copyFromSender: () => void;
}

const COUNTRIES = [
  { code: "CA", name: "Canada" },
  { code: "US", name: "United States" },
];

const CANADIAN_PROVINCES = [
  { code: "AB", name: "Alberta" },
  { code: "BC", name: "British Columbia" },
  { code: "MB", name: "Manitoba" },
  { code: "NB", name: "New Brunswick" },
  { code: "NL", name: "Newfoundland and Labrador" },
  { code: "NT", name: "Northwest Territories" },
  { code: "NS", name: "Nova Scotia" },
  { code: "NU", name: "Nunavut" },
  { code: "ON", name: "Ontario" },
  { code: "PE", name: "Prince Edward Island" },
  { code: "QC", name: "Quebec" },
  { code: "SK", name: "Saskatchewan" },
  { code: "YT", name: "Yukon" },
];

const US_STATES = [
  { code: "AL", name: "Alabama" },
  { code: "AK", name: "Alaska" },
  { code: "AZ", name: "Arizona" },
  { code: "AR", name: "Arkansas" },
  { code: "CA", name: "California" },
  { code: "CO", name: "Colorado" },
  { code: "CT", name: "Connecticut" },
  { code: "DE", name: "Delaware" },
  { code: "FL", name: "Florida" },
  { code: "GA", name: "Georgia" },
  { code: "HI", name: "Hawaii" },
  { code: "ID", name: "Idaho" },
  { code: "IL", name: "Illinois" },
  { code: "IN", name: "Indiana" },
  { code: "IA", name: "Iowa" },
  { code: "KS", name: "Kansas" },
  { code: "KY", name: "Kentucky" },
  { code: "LA", name: "Louisiana" },
  { code: "ME", name: "Maine" },
  { code: "MD", name: "Maryland" },
  { code: "MA", name: "Massachusetts" },
  { code: "MI", name: "Michigan" },
  { code: "MN", name: "Minnesota" },
  { code: "MS", name: "Mississippi" },
  { code: "MO", name: "Missouri" },
  { code: "MT", name: "Montana" },
  { code: "NE", name: "Nebraska" },
  { code: "NV", name: "Nevada" },
  { code: "NH", name: "New Hampshire" },
  { code: "NJ", name: "New Jersey" },
  { code: "NM", name: "New Mexico" },
  { code: "NY", name: "New York" },
  { code: "NC", name: "North Carolina" },
  { code: "ND", name: "North Dakota" },
  { code: "OH", name: "Ohio" },
  { code: "OK", name: "Oklahoma" },
  { code: "OR", name: "Oregon" },
  { code: "PA", name: "Pennsylvania" },
  { code: "RI", name: "Rhode Island" },
  { code: "SC", name: "South Carolina" },
  { code: "SD", name: "South Dakota" },
  { code: "TN", name: "Tennessee" },
  { code: "TX", name: "Texas" },
  { code: "UT", name: "Utah" },
  { code: "VT", name: "Vermont" },
  { code: "VA", name: "Virginia" },
  { code: "WA", name: "Washington" },
  { code: "WV", name: "West Virginia" },
  { code: "WI", name: "Wisconsin" },
  { code: "WY", name: "Wyoming" },
];

export default function StepRecipient({ form, copyFromSender }: StepRecipientProps) {
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePostalCode = (postalCode: string, country: string): boolean => {
    if (country === "CA") {
      // Canadian postal code: A1A 1A1 or A1A1A1
      const canadaRegex = /^[A-Za-z]\d[A-Za-z][ -]?\d[A-Za-z]\d$/;
      return canadaRegex.test(postalCode);
    } else {
      // US ZIP code: 12345 or 12345-6789
      const usRegex = /^\d{5}(-\d{4})?$/;
      return usRegex.test(postalCode);
    }
  };

  const validatePhone = (phone: string): boolean => {
    const phoneRegex = /^[\d\s\-\(\)]+$/;
    const digitCount = phone.replace(/\D/g, '').length;
    return phoneRegex.test(phone) && digitCount >= 10;
  };

  const handleFieldChange = (field: string, value: string) => {
    form.setValue(`recipient.${field}`, value);
    
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleBlur = (field: string) => {
    const value = form.getValues(`recipient.${field}`);
    let error = "";

    switch (field) {
      case "email":
        if (value && !validateEmail(value)) {
          error = "Please enter a valid email address";
        }
        break;
      case "postalCode":
        const country = form.getValues("recipient.country");
        if (value && !validatePostalCode(value, country)) {
          if (country === "CA") {
            error = "Please enter a valid Canadian postal code (e.g., A1A 1A1)";
          } else {
            error = "Please enter a valid US ZIP code (e.g., 12345 or 12345-6789)";
          }
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

  const recipientData = form.watch("recipient") || {};
  const selectedCountry = recipientData.country || "US";
  const stateProvinceList = selectedCountry === "CA" ? CANADIAN_PROVINCES : US_STATES;
  const stateProvinceLabel = selectedCountry === "CA" ? "Province" : "State";
  const postalCodeLabel = selectedCountry === "CA" ? "Postal Code" : "ZIP Code";
  const postalCodePlaceholder = selectedCountry === "CA" ? "A1A 1A1" : "12345";

  return (
    <div className="space-y-6">
      <Alert className="bg-green-50 border-green-200">
        <AlertCircle className="h-4 w-4 text-green-600" />
        <AlertDescription className="text-green-800">
          Please provide the recipient's complete information. All fields marked with * are required.
        </AlertDescription>
      </Alert>

      <div className="flex justify-end">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={copyFromSender}
          className="gap-2"
        >
          <Copy className="h-4 w-4" />
          Copy from Sender
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Full Name */}
        <div className="space-y-2">
          <Label htmlFor="recipient-fullName" className="text-sm font-medium">
            Full Name <span className="text-red-500">*</span>
          </Label>
          <Input
            id="recipient-fullName"
            type="text"
            placeholder="Jane Smith"
            value={recipientData.fullName || ""}
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
          <Label htmlFor="recipient-company" className="text-sm font-medium">
            Company (Optional)
          </Label>
          <Input
            id="recipient-company"
            type="text"
            placeholder="Company Name"
            value={recipientData.company || ""}
            onChange={(e) => handleFieldChange("company", e.target.value)}
          />
        </div>

        {/* Phone */}
        <div className="space-y-2">
          <Label htmlFor="recipient-phone" className="text-sm font-medium">
            Phone Number <span className="text-red-500">*</span>
          </Label>
          <Input
            id="recipient-phone"
            type="tel"
            placeholder="(555) 123-4567"
            value={recipientData.phone || ""}
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
          <Label htmlFor="recipient-email" className="text-sm font-medium">
            Email Address <span className="text-red-500">*</span>
          </Label>
          <Input
            id="recipient-email"
            type="email"
            placeholder="jane.smith@example.com"
            value={recipientData.email || ""}
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
          <Label htmlFor="recipient-address1" className="text-sm font-medium">
            Address Line 1 <span className="text-red-500">*</span>
          </Label>
          <Input
            id="recipient-address1"
            type="text"
            placeholder="456 Broadway"
            value={recipientData.address1 || ""}
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
          <Label htmlFor="recipient-address2" className="text-sm font-medium">
            Address Line 2 (Optional)
          </Label>
          <Input
            id="recipient-address2"
            type="text"
            placeholder="Apartment, suite, unit, etc."
            value={recipientData.address2 || ""}
            onChange={(e) => handleFieldChange("address2", e.target.value)}
          />
        </div>

        {/* City */}
        <div className="space-y-2">
          <Label htmlFor="recipient-city" className="text-sm font-medium">
            City <span className="text-red-500">*</span>
          </Label>
          <Input
            id="recipient-city"
            type="text"
            placeholder="New York"
            value={recipientData.city || ""}
            onChange={(e) => handleFieldChange("city", e.target.value)}
            required
            className={errors.city ? "border-red-500" : ""}
          />
          {errors.city && (
            <p className="text-sm text-red-500">{errors.city}</p>
          )}
        </div>

        {/* Country */}
        <div className="space-y-2">
          <Label htmlFor="recipient-country" className="text-sm font-medium">
            Country <span className="text-red-500">*</span>
          </Label>
          <select
            id="recipient-country"
            value={selectedCountry}
            onChange={(e) => {
              handleFieldChange("country", e.target.value);
              // Reset province when country changes
              handleFieldChange("province", "");
            }}
            required
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            {COUNTRIES.map((country) => (
              <option key={country.code} value={country.code}>
                {country.name}
              </option>
            ))}
          </select>
        </div>

        {/* State/Province */}
        <div className="space-y-2">
          <Label htmlFor="recipient-province" className="text-sm font-medium">
            {stateProvinceLabel} <span className="text-red-500">*</span>
          </Label>
          <select
            id="recipient-province"
            value={recipientData.province || ""}
            onChange={(e) => handleFieldChange("province", e.target.value)}
            required
            className={`flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${
              errors.province ? "border-red-500" : ""
            }`}
          >
            <option value="">Select a {stateProvinceLabel.toLowerCase()}</option>
            {stateProvinceList.map((item) => (
              <option key={item.code} value={item.code}>
                {item.name} ({item.code})
              </option>
            ))}
          </select>
          {errors.province && (
            <p className="text-sm text-red-500">{errors.province}</p>
          )}
        </div>

        {/* Postal Code / ZIP Code */}
        <div className="space-y-2">
          <Label htmlFor="recipient-postalCode" className="text-sm font-medium">
            {postalCodeLabel} <span className="text-red-500">*</span>
          </Label>
          <Input
            id="recipient-postalCode"
            type="text"
            placeholder={postalCodePlaceholder}
            value={recipientData.postalCode || ""}
            onChange={(e) => handleFieldChange("postalCode", e.target.value.toUpperCase())}
            onBlur={() => handleBlur("postalCode")}
            required
            maxLength={10}
            className={errors.postalCode ? "border-red-500" : ""}
          />
          {errors.postalCode && (
            <p className="text-sm text-red-500">{errors.postalCode}</p>
          )}
        </div>
      </div>
    </div>
  );
}
