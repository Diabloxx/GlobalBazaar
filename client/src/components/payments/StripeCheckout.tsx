import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { loadStripe } from '@stripe/stripe-js';
import {
  PaymentElement,
  Elements,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

// Load Stripe outside of a component for performance
if (!import.meta.env.VITE_STRIPE_PUBLIC_KEY) {
  throw new Error('Missing Stripe public key');
}
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

interface CheckoutFormProps {
  clientSecret: string;
  amount: number;
  onSuccess: () => void;
  currency?: string;
}

// Stripe checkout form component
const CheckoutForm = ({ clientSecret, amount, onSuccess, currency = 'USD' }: CheckoutFormProps) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/orders`,
      },
      redirect: 'if_required',
    });

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Payment failed',
        description: error.message || 'Something went wrong with your payment',
      });
      setIsProcessing(false);
    } else if (paymentIntent && paymentIntent.status === 'succeeded') {
      toast({
        title: 'Payment successful',
        description: 'Thank you for your purchase!',
      });
      onSuccess();
    } else {
      toast({
        variant: 'default',
        title: 'Payment pending',
        description: 'Your payment is being processed.',
      });
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="mb-4">
        <PaymentElement />
      </div>
      <Button 
        disabled={isProcessing || !stripe || !elements} 
        className="w-full" 
        type="submit"
      >
        {isProcessing ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 
            Processing...
          </>
        ) : (
          `Pay ${new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency,
          }).format(amount)}`
        )}
      </Button>
    </form>
  );
};

interface StripeCheckoutProps {
  amount: number;
  onSuccess: () => void;
  currency?: string;
}

// Main Stripe checkout component that wraps the form with Elements provider
export default function StripeCheckout({ 
  amount, 
  onSuccess,
  currency = 'USD'
}: StripeCheckoutProps) {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Create a PaymentIntent as soon as the page loads
    const fetchPaymentIntent = async () => {
      try {
        const response = await fetch('/api/payments/create-intent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            amount,
            currency
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to create payment intent');
        }

        const data = await response.json();
        setClientSecret(data.clientSecret);
      } catch (err: any) {
        setError(err.message);
        toast({
          variant: 'destructive',
          title: 'Payment setup failed',
          description: err.message || 'Failed to initialize payment',
        });
      }
    };

    if (amount > 0) {
      fetchPaymentIntent();
    }
  }, [amount, currency, toast]);

  if (error) {
    return (
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="text-destructive">Payment Error</CardTitle>
        </CardHeader>
        <CardContent>
          <p>{error}</p>
        </CardContent>
        <CardFooter>
          <Button variant="outline" onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </CardFooter>
      </Card>
    );
  }

  if (!clientSecret) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-10">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Elements stripe={stripePromise} options={{ clientSecret }}>
      <Card>
        <CardHeader>
          <CardTitle>Complete Your Payment</CardTitle>
        </CardHeader>
        <CardContent>
          <CheckoutForm 
            clientSecret={clientSecret} 
            amount={amount} 
            onSuccess={onSuccess}
            currency={currency}
          />
        </CardContent>
      </Card>
    </Elements>
  );
}