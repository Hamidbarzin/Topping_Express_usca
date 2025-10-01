import { useEffect, useState } from "react";
import { useRoute, Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Package, Download, Home, Loader2 } from "lucide-react";
import type { Order } from "@shared/schema";

export default function Success() {
  const [, params] = useRoute("/success/:orderId");
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (params?.orderId) {
      fetchOrder(params.orderId);
    }
  }, [params?.orderId]);

  const fetchOrder = async (orderId: string) => {
    try {
      const response = await fetch(`/api/orders/${orderId}`);
      
      if (!response.ok) {
        throw new Error('Order not found');
      }

      const data = await response.json();
      setOrder(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load order');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="text-red-600">Order Not Found</CardTitle>
            <CardDescription>{error || 'Unable to load order details'}</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/">
              <Button className="w-full">
                <Home className="mr-2 h-4 w-4" />
                Back to Home
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">T</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Topping Express</h1>
              <p className="text-sm text-gray-500">Order Confirmation</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="py-12">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Success Message */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
              <CheckCircle2 className="h-10 w-10 text-green-600" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Order Confirmed!
            </h2>
            <p className="text-gray-600">
              Your shipping order has been successfully created.
            </p>
          </div>

          {/* Order Details */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Order Details
              </CardTitle>
              <CardDescription>Order ID: {order.id}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Service Info */}
              <div>
                <h3 className="font-semibold mb-2">Shipping Service</h3>
                <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Service:</span>
                    <span className="font-medium">{order.service.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Carrier:</span>
                    <span className="font-medium">{order.service.carrier || 'Standard'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Estimated Delivery:</span>
                    <span className="font-medium">{order.service.estimatedDays || 'N/A'} days</span>
                  </div>
                  {order.trackingNumber && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Tracking Number:</span>
                      <span className="font-medium font-mono">{order.trackingNumber}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Addresses */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold mb-2">From</h3>
                  <div className="bg-gray-50 p-4 rounded-lg text-sm space-y-1">
                    <p className="font-medium">{order.sender.fullName}</p>
                    {order.sender.company && <p className="text-gray-600">{order.sender.company}</p>}
                    <p className="text-gray-600">{order.sender.address1}</p>
                    {order.sender.address2 && <p className="text-gray-600">{order.sender.address2}</p>}
                    <p className="text-gray-600">
                      {order.sender.city}, {order.sender.province} {order.sender.postalCode}
                    </p>
                    <p className="text-gray-600">{order.sender.country}</p>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">To</h3>
                  <div className="bg-gray-50 p-4 rounded-lg text-sm space-y-1">
                    <p className="font-medium">{order.recipient.fullName}</p>
                    {order.recipient.company && <p className="text-gray-600">{order.recipient.company}</p>}
                    <p className="text-gray-600">{order.recipient.address1}</p>
                    {order.recipient.address2 && <p className="text-gray-600">{order.recipient.address2}</p>}
                    <p className="text-gray-600">
                      {order.recipient.city}, {order.recipient.province} {order.recipient.postalCode}
                    </p>
                    <p className="text-gray-600">{order.recipient.country}</p>
                  </div>
                </div>
              </div>

              {/* Package Info */}
              <div>
                <h3 className="font-semibold mb-2">Package Information</h3>
                <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Dimensions:</span>
                    <span className="font-medium">
                      {order.package.length} × {order.package.width} × {order.package.height} cm
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Weight:</span>
                    <span className="font-medium">{order.package.weight} kg</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Declared Value:</span>
                    <span className="font-medium">${order.package.value} {order.currency}</span>
                  </div>
                </div>
              </div>

              {/* Total */}
              <div className="border-t pt-4">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold">Total Paid:</span>
                  <span className="text-2xl font-bold text-blue-600">
                    ${order.totalPrice.toFixed(2)} {order.currency}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Button variant="outline" className="flex-1 gap-2">
              <Download className="h-4 w-4" />
              Download Invoice
            </Button>
            <Link href="/" className="flex-1">
              <Button className="w-full gap-2">
                <Home className="h-4 w-4" />
                Create New Shipment
              </Button>
            </Link>
          </div>

          {/* Confirmation Email Notice */}
          <div className="mt-6 text-center text-sm text-gray-600">
            A confirmation email has been sent to {order.sender.email}
          </div>
        </div>
      </main>
    </div>
  );
}
