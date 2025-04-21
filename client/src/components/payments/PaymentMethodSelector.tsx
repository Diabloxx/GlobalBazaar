import { useState } from 'react';
import { FaCreditCard } from 'react-icons/fa';
import { SiApplepay, SiGooglepay } from 'react-icons/si';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import StripeCheckout from './StripeCheckout';

export type PaymentMethod = 'stripe' | 'applepay' | 'googlepay';

interface PaymentMethodSelectorProps {
  amount: number;
  onSuccess: () => void;
  currency?: string;
  availableMethods?: PaymentMethod[];
}

export default function PaymentMethodSelector({
  amount,
  onSuccess,
  currency = 'USD',
  availableMethods = ['stripe']
}: PaymentMethodSelectorProps) {
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod>('stripe');

  // Get available payment options based on device/browser
  const detectAvailablePaymentMethods = () => {
    // This is just a simple implementation based on user agent
    // In a real app, you would want to use the respective payment APIs
    // to check actual availability (e.g., window.ApplePaySession)
    const userAgent = navigator.userAgent.toLowerCase();
    const isApple = /iphone|ipod|ipad|mac/.test(userAgent);
    const isAndroid = /android/.test(userAgent);
    
    let methods = [...availableMethods];
    
    // Only show Apple Pay on Apple devices
    if (isApple && !methods.includes('applepay')) {
      methods.push('applepay');
    }
    
    // Only show Google Pay on Android devices
    if (isAndroid && !methods.includes('googlepay')) {
      methods.push('googlepay');
    }
    
    return methods;
  };

  const methods = detectAvailablePaymentMethods();

  const PaymentIcon = ({ method }: { method: PaymentMethod }) => {
    switch (method) {
      case 'stripe':
        return <FaCreditCard className="h-5 w-5" />;
      case 'applepay':
        return <SiApplepay className="h-5 w-5" />;
      case 'googlepay':
        return <SiGooglepay className="h-5 w-5" />;
      default:
        return <FaCreditCard className="h-5 w-5" />;
    }
  };

  const getPaymentMethodTitle = (method: PaymentMethod) => {
    switch (method) {
      case 'stripe':
        return 'Credit / Debit Card';
      case 'applepay':
        return 'Apple Pay';
      case 'googlepay':
        return 'Google Pay';
      default:
        return method;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium mb-4">Select Payment Method</h3>
        <RadioGroup 
          value={selectedPaymentMethod}
          onValueChange={(value) => setSelectedPaymentMethod(value as PaymentMethod)}
          className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3"
        >
          {methods.map((method) => (
            <div key={method} className="flex items-center">
              <RadioGroupItem value={method} id={`payment-${method}`} className="peer sr-only" />
              <Label
                htmlFor={`payment-${method}`}
                className="flex items-center space-x-3 rounded-md border-2 border-muted p-4 cursor-pointer peer-data-[state=checked]:border-primary hover:bg-accent"
              >
                <PaymentIcon method={method} />
                <span>{getPaymentMethodTitle(method)}</span>
              </Label>
            </div>
          ))}
        </RadioGroup>
      </div>

      <Card>
        <CardContent className="p-6">
          {selectedPaymentMethod === 'stripe' && (
            <StripeCheckout 
              amount={amount} 
              onSuccess={onSuccess} 
              currency={currency}
            />
          )}
          
          {/* PayPal payment option removed */}
          
          {selectedPaymentMethod === 'applepay' && (
            <div className="text-center py-6">
              <h3 className="text-lg font-medium mb-4">Apple Pay</h3>
              <p className="text-muted-foreground mb-4">
                Complete your purchase with Apple Pay.
              </p>
              <button 
                className="bg-black text-white px-6 py-3 rounded-md 
                           flex items-center justify-center mx-auto"
                onClick={() => {
                  // In a real app, replace with actual Apple Pay logic
                  alert('Apple Pay integration will go here');
                }}
              >
                <SiApplepay className="mr-2 text-xl" />
                Pay with Apple Pay
              </button>
            </div>
          )}
          
          {selectedPaymentMethod === 'googlepay' && (
            <div className="text-center py-6">
              <h3 className="text-lg font-medium mb-4">Google Pay</h3>
              <p className="text-muted-foreground mb-4">
                Complete your purchase with Google Pay.
              </p>
              <button 
                className="bg-background border border-input px-6 py-3 rounded-md 
                           flex items-center justify-center mx-auto shadow-sm"
                onClick={() => {
                  // In a real app, replace with actual Google Pay logic
                  alert('Google Pay integration will go here');
                }}
              >
                <SiGooglepay className="mr-2 text-xl" />
                Pay with Google Pay
              </button>
            </div>
          )}
          
          {/* Bank transfer option removed */}
        </CardContent>
      </Card>
    </div>
  );
}