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
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

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

// PayPal button component
const PayPalButton = ({ onSuccess, amount, disabled, currency }: { 
  onSuccess: () => void, 
  amount: number, 
  disabled: boolean,
  currency: string
}) => {
  const [isPending, setIsPending] = useState(false);
  
  const handleClick = () => {
    setIsPending(true);
    // Simulate PayPal processing
    setTimeout(() => {
      setIsPending(false);
      onSuccess();
    }, 2000);
  };
  
  return (
    <button
      onClick={handleClick}
      disabled={disabled || isPending}
      className={`w-full flex items-center justify-center px-4 py-3 rounded-full text-white font-medium transition-colors ${
        disabled || isPending ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#0070ba] hover:bg-[#005ea6]'
      }`}
    >
      {isPending ? (
        <Loader2 className="h-5 w-5 mr-2 animate-spin" />
      ) : (
        <svg xmlns="http://www.w3.org/2000/svg" width="85" height="21" viewBox="0 0 85 21" fill="white">
          <path d="M8.1,20.5h-6C1.5,20.5,1,20,1,19.4L4.8,1.1C4.9,0.5,5.5,0,6.1,0h5.8c3.2,0,5.5,0.9,6.8,2.6c0.6,0.8,0.9,1.6,1.1,2.4 c0.1,0.9,0.1,2,0,3.3l0,0.5c0,0.1,0,0.2,0,0.3C19.1,16.1,15.4,20.5,8.1,20.5z M20.7,8.9L20.7,8.9L20.7,8.9z M19.3,2.8 c-1-1.4-2.8-2.1-5.4-2.1h-8L2.3,18.9h6c6.5,0,9.3-3.9,10-10.4l0-0.4c0.1-1.3,0.1-2.3,0-3.1C19.7,4.1,19.5,3.4,19.3,2.8z M6.8,9.3 c0.1-0.5,0.6-0.9,1.1-0.9h4.2c0.4,0,0.7,0.1,1,0.3c0.2,0.2,0.4,0.5,0.3,0.8c0,0.7-0.4,1.5-1.3,1.7l-0.2,0.1v0.2 c0,0.4-0.3,0.9-1.1,0.9H7.6c-0.2,0-0.4-0.1-0.5-0.3C7,12,7,11.8,7,11.6L6.8,9.3z M38.4,5.4c-2.4,0-4.4,1-5.4,3h0l0,0 c-0.2,0.3-0.2,0.6-0.3,0.9L30,20.2c0,0.1,0,0.1,0,0.2c0,0.1,0.1,0.1,0.2,0.1h2.9c0.2,0,0.4-0.2,0.5-0.6l0.5-2.2v0.1 c0.5,1.5,2,2.5,4.1,2.5c3.9,0,6.4-3.1,7-7c0.1-0.9,0.1-1.8,0-2.5C44.5,7.6,42.1,5.4,38.4,5.4z M39.3,17.6c-1.7,0-2.4-1.4-2.4-2.7 c0-0.3,0-0.5,0.1-0.8c0.2-1.9,1.5-3.3,3.2-3.3c1.7,0,2.3,1.4,2.3,2.6c0,0.3,0,0.7-0.1,1C41.9,16.4,40.6,17.6,39.3,17.6z M59.7,8.9c-0.1-2.2-2-3.5-5-3.5c-2.3,0-4.3,0.8-5.4,3H49l0,0c-0.2,0.3-0.2,0.6-0.3,0.9l-2.6,11c0,0.2,0.1,0.3,0.2,0.3h2.9 c0.2,0,0.4-0.2,0.5-0.5L51,12c0.1-0.5,0.6-0.9,1.1-0.9h0.7c2.8,0,4.9-1.4,5.3-4.3C58.6,10.6,59.7,8.9,59.7,8.9z M56.3,7 c-0.1,0.5-0.6,0.9-1.1,0.9h-4.2c-0.4,0-0.7-0.1-1-0.3c-0.3-0.2-0.4-0.5-0.4-0.8c0-0.7,0.4-1.4,1.3-1.7l0.2-0.1V4.9 c0-0.4,0.3-0.9,1.1-0.9h2.2c0.2,0,0.4,0.1,0.5,0.2c0.1,0.1,0.2,0.3,0.1,0.5L56.3,7z M78.9,5.8h-2.9C75.9,5.8,75.7,6,75.6,6.2 l-4.3,9L69.7,6.6C69.7,6.2,69.4,6,69.1,6h-3c-0.2,0-0.3,0.2-0.2,0.3l3,12.4l-2.8,4c-0.1,0.1,0,0.3,0.2,0.3h2.9 c0.2,0,0.4-0.1,0.5-0.3l9.1-16.7C79.1,6,79.1,5.8,78.9,5.8z"/>
        </svg>
      )}
      {isPending && <span className="ml-2">Processing...</span>}
    </button>
  );
};

const Checkout = () => {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { cartItems, clearCart } = useCart();
  const { isAuthenticated, user } = useAuth();
  const { currency, convertPrice } = useCurrency();
  const [step, setStep] = useState<'shipping' | 'payment' | 'complete'>('shipping');

  const { register, handleSubmit, setValue, formState: { errors, isValid } } = useForm<CheckoutForm>({
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
      paymentMethod: 'paypal',
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
            <div className={`flex flex-col items-center ${step === 'shipping' ? 'text-primary' : 'text-gray-500'}`}>
              <div className={`w-10 h-10 flex items-center justify-center rounded-full mb-2 ${
                step === 'shipping' ? 'bg-primary text-white' : (step === 'payment' || step === 'complete') ? 'bg-green-500 text-white' : 'bg-gray-200'
              }`}>
                {(step === 'payment' || step === 'complete') ? <Check className="h-5 w-5" /> : 1}
              </div>
              <span className="text-sm">Shipping</span>
            </div>
            
            <div className={`w-20 h-1 ${
              step === 'shipping' ? 'bg-gray-200' : 'bg-green-500'
            }`}></div>
            
            <div className={`flex flex-col items-center ${step === 'payment' ? 'text-primary' : step === 'complete' ? 'text-green-500' : 'text-gray-500'}`}>
              <div className={`w-10 h-10 flex items-center justify-center rounded-full mb-2 ${
                step === 'payment' ? 'bg-primary text-white' : step === 'complete' ? 'bg-green-500 text-white' : 'bg-gray-200'
              }`}>
                {step === 'complete' ? <Check className="h-5 w-5" /> : 2}
              </div>
              <span className="text-sm">Payment</span>
            </div>
            
            <div className={`w-20 h-1 ${
              step === 'complete' ? 'bg-green-500' : 'bg-gray-200'
            }`}></div>
            
            <div className={`flex flex-col items-center ${step === 'complete' ? 'text-green-500' : 'text-gray-500'}`}>
              <div className={`w-10 h-10 flex items-center justify-center rounded-full mb-2 ${
                step === 'complete' ? 'bg-green-500 text-white' : 'bg-gray-200'
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
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">Shipping Information</h2>
                
                <form onSubmit={handleSubmit(onShippingSubmit)}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
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
                      <label className="block text-sm font-medium text-gray-700 mb-1">
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">
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
                      <label className="block text-sm font-medium text-gray-700 mb-1">
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
                      <label className="block text-sm font-medium text-gray-700 mb-1">
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
                      <label className="block text-sm font-medium text-gray-700 mb-1">
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
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Country*
                      </label>
                      <Input
                        {...register('country', { required: 'Country is required' })}
                        className={errors.country ? 'border-red-500' : ''}
                      />
                      {errors.country && (
                        <p className="text-red-500 text-xs mt-1">{errors.country.message}</p>
                      )}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">
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
              <div className="bg-white rounded-lg shadow-sm p-6 sticky top-20">
                <h3 className="text-lg font-bold text-gray-800 mb-4">Order Summary</h3>
                
                <div className="space-y-3 mb-4 max-h-72 overflow-y-auto">
                  {cartItems.map((item) => (
                    <div key={item.id} className="flex items-start">
                      <img 
                        src={item.product.imageUrl} 
                        alt={item.product.name} 
                        className="w-16 h-16 object-cover rounded mr-3"
                      />
                      <div>
                        <p className="text-sm font-medium text-gray-800">{item.product.name}</p>
                        <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
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
                    <span className="text-gray-600">Subtotal</span>
                    <span>{formatCurrency(convertedSubtotal, currency)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Shipping</span>
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
                
                <div className="mt-6 text-sm text-gray-500">
                  <p className="flex items-center">
                    <Shield className="h-4 w-4 mr-2 text-primary" />
                    Secure checkout powered by PayPal
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {step === 'payment' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Payment Options */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">Payment Method</h2>
                
                <div className="space-y-4">
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center mb-4">
                      <input
                        type="radio"
                        id="paypal"
                        name="payment-method"
                        checked
                        className="mr-2"
                      />
                      <label htmlFor="paypal" className="font-medium">PayPal</label>
                    </div>
                    
                    <PayPalButton 
                      onSuccess={handlePaymentSuccess} 
                      amount={convertedTotal}
                      disabled={createOrderMutation.isPending}
                      currency={currency.code}
                    />
                    
                    <div className="mt-4 text-sm text-gray-500 text-center">
                      <p>
                        By clicking "Pay now", you agree to the{' '}
                        <a href="#" className="text-primary hover:underline">Terms of Service</a>{' '}
                        and{' '}
                        <a href="#" className="text-primary hover:underline">Privacy Policy</a>
                      </p>
                    </div>
                  </div>
                  
                  <div className="p-4 border rounded-lg text-gray-400">
                    <div className="flex items-center mb-4">
                      <input
                        type="radio"
                        id="credit-card"
                        name="payment-method"
                        disabled
                        className="mr-2"
                      />
                      <label htmlFor="credit-card" className="font-medium">Credit Card</label>
                    </div>
                    
                    <div className="flex items-center justify-center h-14 text-gray-500">
                      <CreditCard className="h-6 w-6 mr-2" />
                      <span>Credit Card payment coming soon</span>
                    </div>
                  </div>
                </div>
                
                <div className="mt-6">
                  <Button 
                    onClick={() => setStep('shipping')}
                    variant="outline"
                    className="w-full border border-gray-300 text-gray-700 py-3 rounded-full font-medium"
                  >
                    Return to Shipping
                  </Button>
                </div>
              </div>
            </div>
            
            {/* Order Summary */}
            <div>
              <div className="bg-white rounded-lg shadow-sm p-6 sticky top-20">
                <h3 className="text-lg font-bold text-gray-800 mb-4">Order Summary</h3>
                
                <div className="space-y-3 mb-4 max-h-72 overflow-y-auto">
                  {cartItems.map((item) => (
                    <div key={item.id} className="flex items-start">
                      <img 
                        src={item.product.imageUrl} 
                        alt={item.product.name} 
                        className="w-16 h-16 object-cover rounded mr-3"
                      />
                      <div>
                        <p className="text-sm font-medium text-gray-800">{item.product.name}</p>
                        <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
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
                    <span className="text-gray-600">Subtotal</span>
                    <span>{formatCurrency(convertedSubtotal, currency)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Shipping</span>
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
          <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-sm p-8 text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Check className="h-10 w-10 text-green-600" />
            </div>
            
            <h2 className="text-3xl font-bold text-gray-800 mb-4">Thank You for Your Order!</h2>
            <p className="text-gray-600 mb-6">
              Your order has been placed and is being processed. You will receive an email confirmation shortly.
            </p>
            
            <div className="bg-gray-50 p-4 rounded-lg mb-6">
              <p className="text-gray-500 mb-2">Order Summary:</p>
              <p className="font-medium text-gray-800">
                {cartItems.length} items for {formatCurrency(convertedTotal, currency)}
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild className="bg-primary hover:bg-primary/90 text-white">
                <Link href="/orders">View Your Orders</Link>
              </Button>
              
              <Button asChild variant="outline">
                <Link href="/">Continue Shopping</Link>
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Checkout;
