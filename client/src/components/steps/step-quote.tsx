import { useState } from "react";
import { UseFormReturn } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Loader2, Package, Truck, Clock, DollarSign, CheckCircle2, AlertCircle, RefreshCw } from "lucide-react";
import type { ShippingQuoteResponse } from "@shared/schema";

interface StepQuoteProps {
  form: UseFormReturn<any>;
  quoteData: ShippingQuoteResponse | null;
  isLoading: boolean;
  onOrderComplete: (order: any) => void;
  onRetry: () => void;
}

export default function StepQuote({ 
  form, 
  quoteData, 
  isLoading, 
  onOrderComplete,
  onRetry 
}: StepQuoteProps) {
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSelectService = (serviceId: string) => {
    setSelectedService(serviceId);
  };

  const handleConfirmOrder = async () => {
    if (!selectedService || !quoteData) return;

    setIsSubmitting(true);

    const formData = form.getValues();
    const selectedServiceData = quoteData.services.find(s => s.id === selectedService);

    const orderPayload = {
      sender: formData.sender,
      recipient: formData.recipient,
      package: formData.package,
      service: selectedServiceData,
      totalPrice: selectedServiceData?.price || 0,
      currency: quoteData.currency
    };

    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(orderPayload)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || 'Failed to create order');
      }

      const order = await response.json();
      onOrderComplete(order);

    } catch (error) {
      console.error('Order creation error:', error);
      alert(error instanceof Error ? error.message : 'Failed to create order. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="h-12 w-12 animate-spin text-blue-600 mb-4" />
        <h3 className="text-lg font-semibold mb-2">Fetching Shipping Quotes...</h3>
        <p className="text-gray-500 text-center">
          Please wait while we calculate the best shipping rates for your package.
        </p>
      </div>
    );
  }

  // No quotes available
  if (!quoteData || !Array.isArray(quoteData.services) || quoteData.services.length === 0) {
    return (
      <div className="space-y-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>No shipping rates available</strong>
            <p className="mt-2">
              Unfortunately, we couldn't find any shipping rates for this route. 
              This could be due to:
            </p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Invalid postal/ZIP codes</li>
              <li>Package dimensions or weight exceeding carrier limits</li>
              <li>Restricted shipping route</li>
              <li>Temporary service unavailability</li>
            </ul>
          </AlertDescription>
        </Alert>

        <div className="flex justify-center">
          <Button onClick={onRetry} variant="outline" className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  // Display quotes
  return (
    <div className="space-y-6">
      <Alert className="bg-blue-50 border-blue-200">
        <Package className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-800">
          Select your preferred shipping service below. Prices are in {quoteData.currency}.
        </AlertDescription>
      </Alert>

      {/* Service Cards */}
      <div className="grid grid-cols-1 gap-4">
        {quoteData.services.map((service) => (
          <Card
            key={service.id}
            className={`cursor-pointer transition-all hover:shadow-lg ${
              selectedService === service.id
                ? 'ring-2 ring-blue-600 border-blue-600'
                : 'hover:border-blue-300'
            }`}
            onClick={() => handleSelectService(service.id)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Truck className="h-5 w-5 text-blue-600" />
                    {service.name}
                    {selectedService === service.id && (
                      <CheckCircle2 className="h-5 w-5 text-green-600 ml-auto" />
                    )}
                  </CardTitle>
                  <CardDescription className="mt-1">
                    {service.carrier || 'Standard Carrier'}
                  </CardDescription>
                </div>
                <div className="text-right ml-4">
                  <div className="text-2xl font-bold text-blue-600">
                    ${service.price.toFixed(2)}
                  </div>
                  <div className="text-xs text-gray-500">{quoteData.currency}</div>
                </div>
              </div>
            </CardHeader>

            <CardContent>
              <div className="flex flex-wrap gap-4 text-sm">
                {service.estimatedDays && (
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-600">
                      Estimated: <strong>{service.estimatedDays} days</strong>
                    </span>
                  </div>
                )}

                {service.tracking !== false && (
                  <Badge variant="secondary" className="gap-1">
                    <Package className="h-3 w-3" />
                    Tracking Included
                  </Badge>
                )}

                {service.insurance && (
                  <Badge variant="secondary" className="gap-1">
                    <DollarSign className="h-3 w-3" />
                    Insurance Available
                  </Badge>
                )}
              </div>

              {service.description && (
                <p className="text-sm text-gray-600 mt-3">
                  {service.description}
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Order Summary */}
      {selectedService && (
        <Card className="bg-gray-50 border-gray-300">
          <CardHeader>
            <CardTitle className="text-lg">Order Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {(() => {
              const selected = quoteData.services.find(s => s.id === selectedService);
              if (!selected) return null;

              return (
                <>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Service:</span>
                    <span className="font-medium">{selected.name}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Carrier:</span>
                    <span className="font-medium">{selected.carrier || 'Standard'}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Estimated Delivery:</span>
                    <span className="font-medium">{selected.estimatedDays || 'N/A'} days</span>
                  </div>
                  <div className="border-t pt-3 flex justify-between">
                    <span className="font-semibold">Total:</span>
                    <span className="text-xl font-bold text-blue-600">
                      ${selected.price.toFixed(2)} {quoteData.currency}
                    </span>
                  </div>
                </>
              );
            })()}
          </CardContent>
        </Card>
      )}

      {/* Confirm Button */}
      <div className="flex justify-end gap-3 pt-4">
        <Button
          variant="outline"
          onClick={onRetry}
          disabled={isSubmitting}
          className="gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Recalculate
        </Button>

        <Button
          onClick={handleConfirmOrder}
          disabled={!selectedService || isSubmitting}
          className="gap-2 min-w-[150px]"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <CheckCircle2 className="h-4 w-4" />
              Confirm Order
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
