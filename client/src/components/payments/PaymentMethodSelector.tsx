import { useState } from 'react';
import { FaCreditCard, FaPaypal } from 'react-icons/fa';
import { SiApplepay, SiGooglepay } from 'react-icons/si';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import StripeCheckout from './StripeCheckout';

export type PaymentMethod = 'stripe' | 'paypal' | 'applepay' | 'googlepay' | 'bank_transfer';

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
  availableMethods = ['stripe', 'paypal']
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
      case 'paypal':
        return <FaPaypal className="h-5 w-5 text-[#003087]" />;
      case 'applepay':
        return <SiApplepay className="h-5 w-5" />;
      case 'googlepay':
        return <SiGooglepay className="h-5 w-5" />;
      case 'bank_transfer':
        return <FaCreditCard className="h-5 w-5" />;
      default:
        return <FaCreditCard className="h-5 w-5" />;
    }
  };

  const getPaymentMethodTitle = (method: PaymentMethod) => {
    switch (method) {
      case 'stripe':
        return 'Credit / Debit Card';
      case 'paypal':
        return 'PayPal';
      case 'applepay':
        return 'Apple Pay';
      case 'googlepay':
        return 'Google Pay';
      case 'bank_transfer':
        return 'Bank Transfer';
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
          
          {selectedPaymentMethod === 'paypal' && (
            <div className="text-center py-6">
              <h3 className="text-lg font-medium mb-4">PayPal Payment</h3>
              <p className="text-muted-foreground mb-4">
                You'll be redirected to PayPal to complete your purchase securely.
              </p>
              <button 
                className="bg-[#0070ba] hover:bg-[#003087] text-white px-6 py-3 rounded-md 
                           flex items-center justify-center mx-auto"
                onClick={() => {
                  // In a real app, replace with actual PayPal checkout logic
                  alert('PayPal integration will go here');
                }}
              >
                <FaPaypal className="mr-2" />
                Pay with PayPal
              </button>
            </div>
          )}
          
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
                className="bg-white border border-gray-300 px-6 py-3 rounded-md 
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
          
          {selectedPaymentMethod === 'bank_transfer' && (
            <div className="text-center py-6">
              <h3 className="text-lg font-medium mb-4">Bank Transfer</h3>
              <p className="text-muted-foreground mb-4">
                Make a direct bank transfer to our account.
              </p>
              <div className="bg-muted p-4 rounded-md text-left max-w-md mx-auto">
                <p className="mb-2"><strong>Bank:</strong> Example Bank</p>
                <p className="mb-2"><strong>Account Name:</strong> Temu E-Commerce Ltd</p>
                <p className="mb-2"><strong>Account Number:</strong> XXXX-XXXX-XXXX-XXXX</p>
                <p className="mb-2"><strong>Reference:</strong> ORDER-{Math.floor(Math.random() * 1000000)}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}