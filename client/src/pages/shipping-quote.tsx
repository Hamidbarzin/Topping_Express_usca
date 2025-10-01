import { useState } from "react";
import { useLocation } from "wouter";
import MultiStepForm from "@/components/multi-step-form";

export default function ShippingQuote() {
  const [, setLocation] = useLocation();

  const handleOrderComplete = (order: any) => {
    // Navigate to success page with order ID
    if (order && order.id) {
      setLocation(`/success/${order.id}`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">T</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Topping Express</h1>
                <p className="text-sm text-gray-500">Fast & Reliable Shipping</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Get Your Shipping Quote
            </h2>
            <p className="text-gray-600">
              Fill in the details below to get instant shipping rates
            </p>
          </div>

          <MultiStepForm onOrderComplete={handleOrderComplete} />
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-16 bg-gray-50 border-t">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <p className="text-center text-gray-500 text-sm">
            © 2025 Topping Express. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
