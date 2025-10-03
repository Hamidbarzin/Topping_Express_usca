import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form } from "@/components/ui/form";
import { Progress } from "@/components/ui/progress";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import StepSender from "./steps/step-sender";
import StepRecipient from "./steps/step-recipient";
import StepPackage from "./steps/step-package";
import StepQuote from "./steps/step-quote";
import { multiStepFormSchema, type MultiStepForm, type ShippingQuoteResponse } from "@shared/schema";

interface MultiStepFormProps {
  onOrderComplete: (order: any) => void;
}

type StepType = 'sender' | 'recipient' | 'package' | 'quote';

const steps: { id: StepType; title: string; description: string }[] = [
  { id: 'sender', title: 'Sender Information', description: 'From address details' },
  { id: 'recipient', title: 'Recipient Information', description: 'To address details' },
  { id: 'package', title: 'Package Details', description: 'Weight, dimensions & value' },
  { id: 'quote', title: 'Quote Results', description: 'Select service & confirm order' }
];

export default function MultiStepForm({ onOrderComplete }: MultiStepFormProps) {
  const [currentStep, setCurrentStep] = useState<StepType>('sender');
  const [quoteData, setQuoteData] = useState<ShippingQuoteResponse | null>(null);
  const [isLoadingQuote, setIsLoadingQuote] = useState(false);
  const { toast } = useToast();

  const form = useForm<MultiStepForm>({
    resolver: zodResolver(multiStepFormSchema),
    defaultValues: {
      sender: {
        fullName: "",
        company: "",
        phone: "",
        email: "",
        address1: "",
        address2: "",
        city: "",
        province: "",
        postalCode: "",
        country: "CA"
      },
      recipient: {
        fullName: "",
        company: "",
        phone: "",
        email: "",
        address1: "",
        address2: "",
        city: "",
        province: "",
        postalCode: "",
        country: "US"
      },
      package: {
        length: 10,
        width: 10,
        height: 10,
        weight: 1,
        value: 100
      }
    }
  });

  const getCurrentStepIndex = () => steps.findIndex(step => step.id === currentStep);
  const progress = ((getCurrentStepIndex() + 1) / steps.length) * 100;

  // Validation helper
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePostalCode = (postalCode: string, country: string): boolean => {
    if (country === "CA") {
      // Canadian postal code: A1A 1A1
      const canadianRegex = /^[A-Za-z]\d[A-Za-z][ -]?\d[A-Za-z]\d$/;
      return canadianRegex.test(postalCode);
    } else if (country === "US") {
      // US ZIP code: 12345 or 12345-6789
      const usRegex = /^\d{5}(-\d{4})?$/;
      return usRegex.test(postalCode);
    }
    return true;
  };

  const canGoNext = () => {
    const stepIndex = getCurrentStepIndex();
    
    if (stepIndex === 0) {
      // Validate sender step
      const senderData = form.getValues('sender');
      
      // Check all required fields are filled
      const requiredFields = [
        senderData.fullName,
        senderData.email,
        senderData.phone,
        senderData.address1,
        senderData.city,
        senderData.province,
        senderData.postalCode
      ];
      
      const allFieldsFilled = requiredFields.every(field => field && field.trim().length > 0);
      
      if (!allFieldsFilled) return false;
      
      // Validate email format
      if (!validateEmail(senderData.email)) return false;
      
      // Validate postal code format
      if (!validatePostalCode(senderData.postalCode, senderData.country)) return false;
      
      return true;
    }
    
    if (stepIndex === 1) {
      // Validate recipient step
      const recipientData = form.getValues('recipient');
      
      const requiredFields = [
        recipientData.fullName,
        recipientData.email,
        recipientData.phone,
        recipientData.address1,
        recipientData.city,
        recipientData.province,
        recipientData.postalCode
      ];
      
      const allFieldsFilled = requiredFields.every(field => field && field.trim().length > 0);
      
      if (!allFieldsFilled) return false;
      
      if (!validateEmail(recipientData.email)) return false;
      if (!validatePostalCode(recipientData.postalCode, recipientData.country)) return false;
      
      return true;
    }
    
    if (stepIndex === 2) {
      // Validate package step
      const packageData = form.getValues('package');
      return packageData.weight > 0 && 
             packageData.length > 0 && 
             packageData.width > 0 && 
             packageData.height > 0 &&
             packageData.value > 0;
    }
    
    return false;
  };

  const handleNext = async () => {
    const stepIndex = getCurrentStepIndex();
    
    if (!canGoNext()) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields correctly before proceeding.",
        variant: "destructive",
      });
      return;
    }
    
    if (stepIndex < steps.length - 1) {
      const nextStep = steps[stepIndex + 1].id;
      setCurrentStep(nextStep);
      
      // If moving to quote step, fetch quotes
      if (nextStep === 'quote' && !quoteData) {
        await handleGetQuote();
      }
    }
  };

  const handlePrevious = () => {
    const stepIndex = getCurrentStepIndex();
    if (stepIndex > 0) {
      setCurrentStep(steps[stepIndex - 1].id);
    }
  };

  const handleGetQuote = async () => {
    setIsLoadingQuote(true);
    const formData = form.getValues();
    
    const quoteRequest = {
      origin: {
        country: formData.sender.country,
        postalCode: formData.sender.postalCode,
        city: formData.sender.city,
        province: formData.sender.province
      },
      destination: {
        country: formData.recipient.country,
        postalCode: formData.recipient.postalCode,
        city: formData.recipient.city,
        province: formData.recipient.province
      },
      package: formData.package
    };

    try {
      const response = await fetch('/api/quote', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(quoteRequest)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || `Server error: ${response.status}`);
      }

      const quote = await response.json();
      
      // Safely handle the response
      if (!quote || typeof quote !== 'object') {
        throw new Error('Invalid response from server');
      }
      
      // Ensure services array exists and has proper structure
      const safeQuote: ShippingQuoteResponse = {
        currency: quote.currency || "CAD",
        services: Array.isArray(quote.services) ? quote.services : []
      };
      
      setQuoteData(safeQuote);
      
      // Show warning if no services available
      if (safeQuote.services.length === 0) {
        toast({
          title: "No Shipping Rates Available",
          description: "Unfortunately, no shipping rates are available for this route. Please verify your addresses and try again.",
          variant: "destructive",
        });
      }
      
    } catch (error) {
      console.error('Quote error:', error);
      
      toast({
        title: "Quote Error",
        description: error instanceof Error 
          ? error.message 
          : "Failed to get shipping quote. Please check your information and try again.",
        variant: "destructive",
      });
      
      // Set empty result to show error state
      setQuoteData({ currency: "CAD", services: [] });
    } finally {
      setIsLoadingQuote(false);
    }
  };

  const copyFromSender = () => {
    const senderData = form.getValues('sender');
    form.setValue('recipient', { 
      ...senderData,
      country: senderData.country // Keep the country as-is or change to US if needed
    });
    
    toast({
      title: "Information Copied",
      description: "Sender information has been copied to recipient fields.",
    });
  };

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 'sender':
        return <StepSender form={form} />;
      case 'recipient':
        return <StepRecipient form={form} copyFromSender={copyFromSender} />;
      case 'package':
        return <StepPackage form={form} />;
      case 'quote':
        return (
          <StepQuote 
            form={form} 
            quoteData={quoteData}
            isLoading={isLoadingQuote}
            onOrderComplete={onOrderComplete}
            onRetry={handleGetQuote}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex justify-between text-xs sm:text-sm text-gray-600 mb-2">
          {steps.map((step, index) => (
            <span 
              key={step.id} 
              className={`${
                index <= getCurrentStepIndex() 
                  ? 'text-blue-600 font-semibold' 
                  : 'text-gray-400'
              } transition-colors duration-200`}
            >
              <span className="hidden sm:inline">{step.title}</span>
              <span className="sm:hidden">Step {index + 1}</span>
            </span>
          ))}
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <span className="bg-blue-600 text-white rounded-full w-10 h-10 flex items-center justify-center text-sm font-bold shrink-0">
              {getCurrentStepIndex() + 1}
            </span>
            <div>
              <div className="text-xl">{steps[getCurrentStepIndex()]?.title}</div>
              <CardDescription className="text-sm mt-1">
                {steps[getCurrentStepIndex()]?.description}
              </CardDescription>
            </div>
          </CardTitle>
        </CardHeader>
        
        <CardContent>
          <Form {...form}>
            <form className="space-y-6">
              {renderCurrentStep()}
            </form>
          </Form>

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8 pt-6 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={handlePrevious}
              disabled={getCurrentStepIndex() === 0}
              data-testid="button-previous"
            >
              <ChevronLeft className="mr-2 h-4 w-4" />
              Previous
            </Button>

            {currentStep !== 'quote' && (
              <Button
                type="button"
                onClick={handleNext}
                disabled={!canGoNext() || isLoadingQuote}
                data-testid="button-next"
              >
                {isLoadingQuote ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Loading...
                  </>
                ) : (
                  <>
                    Next
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
