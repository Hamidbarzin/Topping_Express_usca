import { UseFormReturn } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Package } from "lucide-react";

interface StepPackageProps {
  form: UseFormReturn<any>;
}

export default function StepPackage({ form }: StepPackageProps) {
  const handleFieldChange = (field: string, value: string) => {
    const numValue = parseFloat(value) || 0;
    form.setValue(`package.${field}`, numValue);
  };

  const packageData = form.watch("package") || {};

  return (
    <div className="space-y-6">
      <Alert className="bg-purple-50 border-purple-200">
        <Package className="h-4 w-4 text-purple-600" />
        <AlertDescription className="text-purple-800">
          Please provide accurate package dimensions and weight for the most accurate shipping quote.
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Dimensions Section */}
        <div className="md:col-span-2">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Package className="h-5 w-5" />
            Package Dimensions
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Length */}
            <div className="space-y-2">
              <Label htmlFor="package-length" className="text-sm font-medium">
                Length (cm) <span className="text-red-500">*</span>
              </Label>
              <Input
                id="package-length"
                type="number"
                min="1"
                step="0.1"
                placeholder="10"
                value={packageData.length || ""}
                onChange={(e) => handleFieldChange("length", e.target.value)}
                required
              />
            </div>

            {/* Width */}
            <div className="space-y-2">
              <Label htmlFor="package-width" className="text-sm font-medium">
                Width (cm) <span className="text-red-500">*</span>
              </Label>
              <Input
                id="package-width"
                type="number"
                min="1"
                step="0.1"
                placeholder="10"
                value={packageData.width || ""}
                onChange={(e) => handleFieldChange("width", e.target.value)}
                required
              />
            </div>

            {/* Height */}
            <div className="space-y-2">
              <Label htmlFor="package-height" className="text-sm font-medium">
                Height (cm) <span className="text-red-500">*</span>
              </Label>
              <Input
                id="package-height"
                type="number"
                min="1"
                step="0.1"
                placeholder="10"
                value={packageData.height || ""}
                onChange={(e) => handleFieldChange("height", e.target.value)}
                required
              />
            </div>
          </div>
        </div>

        {/* Weight */}
        <div className="space-y-2">
          <Label htmlFor="package-weight" className="text-sm font-medium">
            Weight (kg) <span className="text-red-500">*</span>
          </Label>
          <Input
            id="package-weight"
            type="number"
            min="0.1"
            step="0.1"
            placeholder="1.0"
            value={packageData.weight || ""}
            onChange={(e) => handleFieldChange("weight", e.target.value)}
            required
          />
          <p className="text-xs text-gray-500">
            Enter the total weight of your package
          </p>
        </div>

        {/* Declared Value */}
        <div className="space-y-2">
          <Label htmlFor="package-value" className="text-sm font-medium">
            Declared Value (CAD) <span className="text-red-500">*</span>
          </Label>
          <Input
            id="package-value"
            type="number"
            min="1"
            step="0.01"
            placeholder="100.00"
            value={packageData.value || ""}
            onChange={(e) => handleFieldChange("value", e.target.value)}
            required
          />
          <p className="text-xs text-gray-500">
            Total value of items in the package
          </p>
        </div>
      </div>

      {/* Package Summary */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <h4 className="font-semibold mb-3">Package Summary</h4>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <span className="text-gray-600">Dimensions:</span>
            <span className="ml-2 font-medium">
              {packageData.length || 0} × {packageData.width || 0} × {packageData.height || 0} cm
            </span>
          </div>
          <div>
            <span className="text-gray-600">Weight:</span>
            <span className="ml-2 font-medium">{packageData.weight || 0} kg</span>
          </div>
          <div>
            <span className="text-gray-600">Value:</span>
            <span className="ml-2 font-medium">${packageData.value || 0} CAD</span>
          </div>
          <div>
            <span className="text-gray-600">Volume:</span>
            <span className="ml-2 font-medium">
              {((packageData.length || 0) * (packageData.width || 0) * (packageData.height || 0)).toFixed(2)} cm³
            </span>
          </div>
        </div>
      </div>

      {/* Tips */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>Tips for accurate measurements:</strong>
          <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
            <li>Measure the longest side as length</li>
            <li>Include packaging materials in weight</li>
            <li>Round up to the nearest cm for dimensions</li>
            <li>Declared value should match invoice total</li>
          </ul>
        </AlertDescription>
      </Alert>
    </div>
  );
}
