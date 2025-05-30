import { useState, useEffect } from 'react';
import { useLocation, Link } from 'wouter';
import { useForm } from 'react-hook-form';
import { useToast } from '@/hooks/use-toast';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { formatCurrency } from '@/lib/currency';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Loader2, Check, CreditCard, ShoppingCart, Shield } from 'lucide-react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import PaymentMethodSelector from '@/components/payments/PaymentMethodSelector';
import { CountrySelect } from '@/components/ui/country-select';

interface CheckoutForm {
  fullName: string;
  email: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone: string;
  notes: string;
}

const Checkout = () => {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { cartItems, clearCart } = useCart();
  const { isAuthenticated, user } = useAuth();
  const { currency, convertPrice } = useCurrency();
  const [step, setStep] = useState<'shipping' | 'payment' | 'complete'>('shipping');

  const { register, handleSubmit, setValue, watch, formState: { errors, isValid } } = useForm<CheckoutForm>({
    mode: 'onChange',
    defaultValues: {
      fullName: user?.fullName || '',
      email: user?.email || '',
      address: user?.address || '',
      city: '',
      state: '',
      postalCode: '',
      country: '',
      phone: user?.phone || '',
      notes: ''
    }
  });

  // Update form values when user changes
  useEffect(() => {
    if (user) {
      setValue('fullName', user.fullName || '');
      setValue('email', user.email || '');
      setValue('address', user.address || '');
      setValue('phone', user.phone || '');
    }
  }, [user, setValue]);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      toast({
        title: 'Authentication required',
        description: 'Please sign in to proceed with checkout',
        variant: 'destructive',
      });
      navigate('/account');
    }
  }, [isAuthenticated, navigate, toast]);

  // Redirect to home if cart is empty
  useEffect(() => {
    if (cartItems.length === 0 && step !== 'complete') {
      toast({
        title: 'Empty cart',
        description: 'Your cart is empty',
        variant: 'destructive',
      });
      navigate('/');
    }
  }, [cartItems.length, navigate, toast, step]);

  // Calculate totals
  const subtotal = cartItems.reduce(
    (total, item) => total + (item.product.salePrice || item.product.price) * item.quantity, 
    0
  );
  const shipping = subtotal >= 50 ? 0 : 5.99;
  const total = subtotal + shipping;

  // Convert to selected currency
  const convertedSubtotal = convertPrice(subtotal);
  const convertedShipping = convertPrice(shipping);
  const convertedTotal = convertPrice(total);

  // Create order mutation
  const createOrderMutation = useMutation({
    mutationFn: async (orderData: any) => {
      if (!isAuthenticated || !user) {
        throw new Error("You must be logged in to place an order");
      }
      return apiRequest('POST', `/api/users/${user.id}/orders`, orderData);
    },
    onSuccess: () => {
      setStep('complete');
      clearCart();
    },
    onError: (error: Error) => {
      toast({
        title: "Order failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handle shipping form submission
  const onShippingSubmit = (data: CheckoutForm) => {
    // Move to payment step
    setStep('payment');
  };

  // Handle payment completion
  const handlePaymentSuccess = () => {
    if (!isAuthenticated || !user) return;
    
    // Get shipping data from form
    const shippingData = {
      fullName: getValue('fullName'),
      email: getValue('email'),
      address: getValue('address'),
      city: getValue('city'),
      state: getValue('state'),
      postalCode: getValue('postalCode'),
      country: getValue('country'),
      phone: getValue('phone'),
      notes: getValue('notes')
    };
    
    // Create order
    createOrderMutation.mutate({
      totalPrice: total,
      currency: currency.code,
      paymentMethod: 'stripe',
      shippingAddress: `${shippingData.address}, ${shippingData.city}, ${shippingData.state} ${shippingData.postalCode}, ${shippingData.country}`,
      items: cartItems.map(item => ({
        productId: item.product.id,
        name: item.product.name,
        price: item.product.salePrice || item.product.price,
        quantity: item.quantity,
        imageUrl: item.product.imageUrl
      }))
    });
  };

  // Helper to get form value
  const getValue = (field: keyof CheckoutForm) => {
    if (field === 'country') {
      // For country, use the react-hook-form value directly
      return watch('country');
    }
    return document.querySelector<HTMLInputElement | HTMLTextAreaElement>(
      `[name="${field}"]`
    )?.value || '';
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-5xl mx-auto">
        {/* Checkout Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-center">
            <div className={`flex flex-col items-center ${step === 'shipping' ? 'text-primary' : 'text-muted-foreground'}`}>
              <div className={`w-10 h-10 flex items-center justify-center rounded-full mb-2 ${
                step === 'shipping' ? 'bg-primary text-primary-foreground' : 
                (step === 'payment' || step === 'complete') ? 'bg-green-500 text-white' : 'bg-muted'
              }`}>
                {(step === 'payment' || step === 'complete') ? <Check className="h-5 w-5" /> : 1}
              </div>
              <span className="text-sm">Shipping</span>
            </div>
            
            <div className={`w-20 h-1 ${
              step === 'shipping' ? 'bg-muted' : 'bg-green-500'
            }`}></div>
            
            <div className={`flex flex-col items-center ${step === 'payment' ? 'text-primary' : step === 'complete' ? 'text-green-500' : 'text-muted-foreground'}`}>
              <div className={`w-10 h-10 flex items-center justify-center rounded-full mb-2 ${
                step === 'payment' ? 'bg-primary text-primary-foreground' : 
                step === 'complete' ? 'bg-green-500 text-white' : 'bg-muted'
              }`}>
                {step === 'complete' ? <Check className="h-5 w-5" /> : 2}
              </div>
              <span className="text-sm">Payment</span>
            </div>
            
            <div className={`w-20 h-1 ${
              step === 'complete' ? 'bg-green-500' : 'bg-muted'
            }`}></div>
            
            <div className={`flex flex-col items-center ${step === 'complete' ? 'text-green-500' : 'text-muted-foreground'}`}>
              <div className={`w-10 h-10 flex items-center justify-center rounded-full mb-2 ${
                step === 'complete' ? 'bg-green-500 text-white' : 'bg-muted'
              }`}>
                {step === 'complete' ? <Check className="h-5 w-5" /> : 3}
              </div>
              <span className="text-sm">Complete</span>
            </div>
          </div>
        </div>
        
        {/* Checkout Content */}
        {step === 'shipping' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Shipping Form */}
            <div className="lg:col-span-2">
              <div className="bg-card rounded-lg shadow-sm p-6">
                <h2 className="text-2xl font-bold mb-6">Shipping Information</h2>
                
                <form onSubmit={handleSubmit(onShippingSubmit)}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Full Name*
                      </label>
                      <Input
                        {...register('fullName', { required: 'Full name is required' })}
                        className={errors.fullName ? 'border-red-500' : ''}
                      />
                      {errors.fullName && (
                        <p className="text-red-500 text-xs mt-1">{errors.fullName.message}</p>
                      )}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Email*
                      </label>
                      <Input
                        type="email"
                        {...register('email', { 
                          required: 'Email is required',
                          pattern: {
                            value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                            message: 'Invalid email address'
                          }
                        })}
                        className={errors.email ? 'border-red-500' : ''}
                      />
                      {errors.email && (
                        <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-1">
                      Address*
                    </label>
                    <Input
                      {...register('address', { required: 'Address is required' })}
                      className={errors.address ? 'border-red-500' : ''}
                    />
                    {errors.address && (
                      <p className="text-red-500 text-xs mt-1">{errors.address.message}</p>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        City*
                      </label>
                      <Input
                        {...register('city', { required: 'City is required' })}
                        className={errors.city ? 'border-red-500' : ''}
                      />
                      {errors.city && (
                        <p className="text-red-500 text-xs mt-1">{errors.city.message}</p>
                      )}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        State/Province*
                      </label>
                      <Input
                        {...register('state', { required: 'State is required' })}
                        className={errors.state ? 'border-red-500' : ''}
                      />
                      {errors.state && (
                        <p className="text-red-500 text-xs mt-1">{errors.state.message}</p>
                      )}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Postal Code*
                      </label>
                      <Input
                        {...register('postalCode', { required: 'Postal code is required' })}
                        className={errors.postalCode ? 'border-red-500' : ''}
                      />
                      {errors.postalCode && (
                        <p className="text-red-500 text-xs mt-1">{errors.postalCode.message}</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Country*
                      </label>
                      <CountrySelect
                        value={getValue('country')}
                        onValueChange={(value) => {
                          setValue('country', value, { shouldValidate: true });
                          // Add a hidden input with the country value for form submission
                          const hiddenInput = document.querySelector<HTMLInputElement>('input[name="country"]');
                          if (hiddenInput) {
                            hiddenInput.value = value;
                          }
                        }}
                        error={!!errors.country}
                      />
                      <input type="hidden" {...register('country', { required: 'Country is required' })} />
                      {errors.country && (
                        <p className="text-red-500 text-xs mt-1">{errors.country.message}</p>
                      )}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Phone*
                      </label>
                      <Input
                        {...register('phone', { required: 'Phone is required' })}
                        className={errors.phone ? 'border-red-500' : ''}
                      />
                      {errors.phone && (
                        <p className="text-red-500 text-xs mt-1">{errors.phone.message}</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="mb-6">
                    <label className="block text-sm font-medium mb-1">
                      Order Notes (optional)
                    </label>
                    <Textarea
                      {...register('notes')}
                      placeholder="Notes about your order, e.g. special delivery instructions"
                      rows={3}
                    />
                  </div>
                  
                  <Button 
                    type="submit"
                    disabled={!isValid}
                    className="w-full bg-primary hover:bg-primary/90 text-white py-3 rounded-full font-medium"
                  >
                    Continue to Payment
                  </Button>
                </form>
              </div>
            </div>
            
            {/* Order Summary */}
            <div>
              <div className="bg-card rounded-lg shadow-sm p-6 sticky top-20">
                <h3 className="text-lg font-bold mb-4">Order Summary</h3>
                
                <div className="space-y-3 mb-4 max-h-72 overflow-y-auto">
                  {cartItems.map((item) => (
                    <div key={item.id} className="flex items-start">
                      <img 
                        src={item.product.imageUrl} 
                        alt={item.product.name} 
                        className="w-16 h-16 object-cover rounded mr-3"
                      />
                      <div>
                        <p className="text-sm font-medium">{item.product.name}</p>
                        <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                        <p className="text-sm font-medium">
                          {formatCurrency(
                            convertPrice(
                              (item.product.salePrice || item.product.price) * item.quantity
                            ), 
                            currency
                          )}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                
                <Separator className="my-4" />
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>{formatCurrency(convertedSubtotal, currency)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Shipping</span>
                    <span>
                      {shipping === 0 ? 'Free' : formatCurrency(convertedShipping, currency)}
                    </span>
                  </div>
                </div>
                
                <Separator className="my-4" />
                
                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span>{formatCurrency(convertedTotal, currency)}</span>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {step === 'payment' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Payment Options */}
            <div className="lg:col-span-2">
              <div className="bg-card rounded-lg shadow-sm p-6">
                <h2 className="text-2xl font-bold mb-6">Payment Method</h2>
                
                {/* Available payment methods */}
                <PaymentMethodSelector
                  amount={convertedTotal}
                  onSuccess={handlePaymentSuccess}
                  currency={currency.code}
                  availableMethods={['stripe']}
                />
                
                <div className="mt-6 text-sm text-muted-foreground text-center">
                  <p>
                    By completing your purchase, you agree to the{' '}
                    <a href="#" className="text-primary hover:underline">Terms of Service</a>{' '}
                    and{' '}
                    <a href="#" className="text-primary hover:underline">Privacy Policy</a>
                  </p>
                </div>
              </div>
              
              <div className="mt-6">
                <Button 
                  onClick={() => setStep('shipping')}
                  variant="outline"
                  className="w-full py-3 rounded-full font-medium"
                >
                  Return to Shipping
                </Button>
              </div>
            </div>
            
            {/* Order Summary */}
            <div>
              <div className="bg-card rounded-lg shadow-sm p-6 sticky top-20">
                <h3 className="text-lg font-bold mb-4">Order Summary</h3>
                
                <div className="space-y-3 mb-4 max-h-72 overflow-y-auto">
                  {cartItems.map((item) => (
                    <div key={item.id} className="flex items-start">
                      <img 
                        src={item.product.imageUrl} 
                        alt={item.product.name} 
                        className="w-16 h-16 object-cover rounded mr-3"
                      />
                      <div>
                        <p className="text-sm font-medium">{item.product.name}</p>
                        <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                        <p className="text-sm font-medium">
                          {formatCurrency(
                            convertPrice(
                              (item.product.salePrice || item.product.price) * item.quantity
                            ), 
                            currency
                          )}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                
                <Separator className="my-4" />
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>{formatCurrency(convertedSubtotal, currency)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Shipping</span>
                    <span>
                      {shipping === 0 ? 'Free' : formatCurrency(convertedShipping, currency)}
                    </span>
                  </div>
                </div>
                
                <Separator className="my-4" />
                
                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span>{formatCurrency(convertedTotal, currency)}</span>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {step === 'complete' && (
          <div className="max-w-2xl mx-auto bg-card rounded-lg shadow-sm p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Check className="h-8 w-8 text-green-500" />
            </div>
            
            <h2 className="text-3xl font-bold mb-4">Thank You for Your Order!</h2>
            <p className="text-muted-foreground mb-6">
              Your order has been placed and will be processed soon. We have sent the order confirmation to your email.
            </p>
            
            <div className="bg-muted/50 p-4 rounded-lg text-left mb-6">
              <p className="text-muted-foreground mb-2">Order Summary:</p>
              <p className="font-medium">
                {formatCurrency(convertedTotal, currency)} • {cartItems.length} {cartItems.length === 1 ? 'item' : 'items'}
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button variant="default" className="flex items-center justify-center" onClick={() => window.location.href = '/'}>
                <ShoppingCart className="mr-2 h-4 w-4" />
                Continue Shopping
              </Button>
              
              <Button variant="outline" className="flex items-center justify-center" onClick={() => window.location.href = '/account?tab=orders'}>
                <CreditCard className="mr-2 h-4 w-4" />
                View My Orders
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Checkout;