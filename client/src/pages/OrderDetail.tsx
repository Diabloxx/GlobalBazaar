import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams, useLocation } from 'wouter';
import { useAuth } from '@/contexts/AuthContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { formatCurrency, getCurrencyDisplay } from '@/lib/currency';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription 
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  ChevronLeft,
  Truck, 
  MapPin, 
  CreditCard,
  Package,
  CalendarClock
} from 'lucide-react';
import { format } from 'date-fns';

const OrderDetail = () => {
  const params = useParams();
  const [, navigate] = useLocation();
  const { isAuthenticated, user } = useAuth();
  const { currencies } = useCurrency();
  const orderId = params.id ? parseInt(params.id) : null;

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/account');
    }
  }, [isAuthenticated, navigate]);

  // Fetch order details
  const { 
    data: order,
    isLoading, 
    error 
  } = useQuery({
    queryKey: [isAuthenticated && user && orderId ? `/api/users/${user.id}/orders/${orderId}` : null],
    enabled: isAuthenticated && !!user && !!orderId,
  });

  if (!isAuthenticated || !orderId) {
    return null; // Will be redirected by useEffect
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center mb-6">
            <Skeleton className="h-8 w-8 mr-2" />
            <Skeleton className="h-8 w-40" />
          </div>
          <Card>
            <CardHeader>
              <Skeleton className="h-8 w-1/3 mb-2" />
              <Skeleton className="h-4 w-1/4" />
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-36 w-full" />
                <Skeleton className="h-48 w-full" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-4">
            Order Not Found
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            We couldn't find the order you're looking for. It may have been deleted or you may not have permission to view it.
          </p>
          <Button onClick={() => navigate('/orders')}>
            Back to Orders
          </Button>
        </div>
      </div>
    );
  }

  // Parse items from JSON if needed
  const orderItems = typeof order.items === 'string' 
    ? JSON.parse(order.items) 
    : order.items;
  
  // Get currency display
  const orderCurrency = getCurrencyDisplay(order.currency, currencies);
  
  // Format dates
  const orderDate = new Date(order.createdAt);
  const formattedDate = format(orderDate, 'PPP');
  const formattedTime = format(orderDate, 'p');

  // Get estimated delivery date (for display purposes)
  const estimatedDeliveryDate = new Date(orderDate);
  estimatedDeliveryDate.setDate(estimatedDeliveryDate.getDate() + 5);
  const formattedDeliveryDate = format(estimatedDeliveryDate, 'PPP');

  // Get order status badge
  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900 dark:text-yellow-200 dark:border-yellow-800">Pending</Badge>;
      case 'processing':
        return <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900 dark:text-blue-200 dark:border-blue-800">Processing</Badge>;
      case 'shipped':
        return <Badge variant="outline" className="bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900 dark:text-purple-200 dark:border-purple-800">Shipped</Badge>;
      case 'delivered':
        return <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200 dark:bg-green-900 dark:text-green-200 dark:border-green-800">Delivered</Badge>;
      case 'cancelled':
        return <Badge variant="outline" className="bg-red-100 text-red-800 border-red-200 dark:bg-red-900 dark:text-red-200 dark:border-red-800">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center mb-6">
          <Button variant="ghost" size="sm" onClick={() => navigate('/orders')} className="mr-2">
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back to Orders
          </Button>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center justify-between">
              <div>
                <CardTitle className="text-2xl">Order #{order.id}</CardTitle>
                <CardDescription>
                  Placed on {formattedDate} at {formattedTime}
                </CardDescription>
              </div>
              {getStatusBadge(order.status)}
            </div>
          </CardHeader>
          
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Order Timeline */}
              <div>
                <h3 className="font-medium text-gray-800 dark:text-gray-200 mb-4 flex items-center">
                  <CalendarClock className="h-5 w-5 mr-2 text-primary" />
                  Order Status
                </h3>
                
                <div className="space-y-4 pl-2">
                  <div className="flex">
                    <div className="mr-4 flex flex-col items-center">
                      <div className="rounded-full h-8 w-8 bg-primary text-white flex items-center justify-center">
                        <span className="text-xs">1</span>
                      </div>
                      <div className="h-full w-0.5 bg-gray-200 dark:bg-gray-700 mt-2"></div>
                    </div>
                    <div className="pb-6">
                      <p className="font-medium text-gray-800 dark:text-gray-200">Order Placed</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{formattedDate}</p>
                    </div>
                  </div>
                  
                  <div className="flex">
                    <div className="mr-4 flex flex-col items-center">
                      <div className={`rounded-full h-8 w-8 ${order.status !== 'pending' ? 'bg-primary text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'} flex items-center justify-center`}>
                        <span className="text-xs">2</span>
                      </div>
                      <div className="h-full w-0.5 bg-gray-200 dark:bg-gray-700 mt-2"></div>
                    </div>
                    <div className="pb-6">
                      <p className={`font-medium ${order.status !== 'pending' ? 'text-gray-800 dark:text-gray-200' : 'text-gray-400 dark:text-gray-500'}`}>Processing</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Payment confirmed</p>
                    </div>
                  </div>
                  
                  <div className="flex">
                    <div className="mr-4 flex flex-col items-center">
                      <div className={`rounded-full h-8 w-8 ${order.status === 'shipped' || order.status === 'delivered' ? 'bg-primary text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'} flex items-center justify-center`}>
                        <span className="text-xs">3</span>
                      </div>
                      <div className="h-full w-0.5 bg-gray-200 dark:bg-gray-700 mt-2"></div>
                    </div>
                    <div className="pb-6">
                      <p className={`font-medium ${order.status === 'shipped' || order.status === 'delivered' ? 'text-gray-800 dark:text-gray-200' : 'text-gray-400 dark:text-gray-500'}`}>Shipped</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Your order is on the way</p>
                    </div>
                  </div>
                  
                  <div className="flex">
                    <div className="mr-4 flex flex-col items-center">
                      <div className={`rounded-full h-8 w-8 ${order.status === 'delivered' ? 'bg-primary text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'} flex items-center justify-center`}>
                        <span className="text-xs">4</span>
                      </div>
                    </div>
                    <div>
                      <p className={`font-medium ${order.status === 'delivered' ? 'text-gray-800 dark:text-gray-200' : 'text-gray-400 dark:text-gray-500'}`}>Delivered</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Estimated by {formattedDeliveryDate}</p>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Order Info */}
              <div className="space-y-6">
                <div>
                  <h3 className="font-medium text-gray-800 dark:text-gray-200 mb-3 flex items-center">
                    <MapPin className="h-5 w-5 mr-2 text-primary" />
                    Shipping Address
                  </h3>
                  <div className="text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 p-3 rounded-md text-sm">
                    {order.shippingAddress}
                  </div>
                </div>
                
                <div>
                  <h3 className="font-medium text-gray-800 dark:text-gray-200 mb-3 flex items-center">
                    <CreditCard className="h-5 w-5 mr-2 text-primary" />
                    Payment Method
                  </h3>
                  <div className="text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 p-3 rounded-md text-sm capitalize">
                    {order.paymentMethod}
                  </div>
                </div>
                
                <div>
                  <h3 className="font-medium text-gray-800 dark:text-gray-200 mb-3 flex items-center">
                    <Truck className="h-5 w-5 mr-2 text-primary" />
                    Delivery Method
                  </h3>
                  <div className="text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 p-3 rounded-md text-sm">
                    Standard Shipping (5-7 business days)
                  </div>
                </div>
              </div>
            </div>
            
            <Separator className="my-6" />
            
            {/* Order Items */}
            <div>
              <h3 className="font-medium text-gray-800 dark:text-gray-200 mb-4 flex items-center">
                <Package className="h-5 w-5 mr-2 text-primary" />
                Order Items
              </h3>
              
              <div className="space-y-4">
                {orderItems.map((item: any, index: number) => (
                  <div key={index} className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b pb-4">
                    <div className="flex items-center mb-2 sm:mb-0">
                      {item.imageUrl && (
                        <div className="w-16 h-16 rounded-md overflow-hidden mr-4 flex-shrink-0 bg-gray-100 dark:bg-gray-800">
                          <img src={item.imageUrl} alt={item.name} className="object-cover w-full h-full" />
                        </div>
                      )}
                      <div>
                        <h4 className="font-medium text-gray-800 dark:text-gray-200">{item.name}</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Quantity: {item.quantity}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-800 dark:text-gray-200">
                        {formatCurrency(item.price, orderCurrency)}
                      </p>
                      {item.quantity > 1 && (
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {formatCurrency(item.price / item.quantity, orderCurrency)} each
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-6 bg-gray-50 dark:bg-gray-800 p-4 rounded-md">
                <div className="space-y-2">
                  <div className="flex justify-between text-gray-600 dark:text-gray-400">
                    <span>Subtotal</span>
                    <span>{formatCurrency(order.totalPrice, orderCurrency)}</span>
                  </div>
                  <div className="flex justify-between text-gray-600 dark:text-gray-400">
                    <span>Shipping</span>
                    <span>Free</span>
                  </div>
                  <div className="flex justify-between text-gray-600 dark:text-gray-400">
                    <span>Tax</span>
                    <span>Included</span>
                  </div>
                  <Separator className="my-2" />
                  <div className="flex justify-between font-medium text-gray-800 dark:text-gray-200">
                    <span>Total</span>
                    <span>{formatCurrency(order.totalPrice, orderCurrency)}</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <div className="flex justify-center">
          <Button variant="outline" onClick={() => window.print()} className="mr-2">
            Print Receipt
          </Button>
          <Button onClick={() => navigate('/')}>
            Continue Shopping
          </Button>
        </div>
      </div>
    </div>
  );
};

export default OrderDetail;