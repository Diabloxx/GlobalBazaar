import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { useAuth } from '@/contexts/AuthContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { formatCurrency, getCurrencyDisplay } from '@/lib/currency';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDistanceToNow } from 'date-fns';
import { ChevronRight, ShoppingBag, ArchiveX } from 'lucide-react';

const Orders = () => {
  const { isAuthenticated, user } = useAuth();
  const [, navigate] = useLocation();
  const { currencies } = useCurrency();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/account');
    }
  }, [isAuthenticated, navigate]);

  // Fetch user's orders
  const { data: orders = [], isLoading, error } = useQuery({
    queryKey: [isAuthenticated && user ? `/api/users/${user.id}/orders` : null],
    enabled: isAuthenticated && !!user,
  });

  if (!isAuthenticated) {
    return null; // Will be redirected by useEffect
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <Skeleton className="h-10 w-1/4 mb-6" />
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-1/3 mb-2" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <Skeleton className="h-6 w-1/4" />
                      <Skeleton className="h-6 w-1/4" />
                    </div>
                    <Skeleton className="h-20 w-full" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Error Loading Orders</h2>
          <p className="text-gray-600 mb-6">
            There was a problem loading your orders. Please try again later.
          </p>
          <Button onClick={() => window.location.reload()}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  // Get order status badge variant
  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-200">Pending</Badge>;
      case 'processing':
        return <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200">Processing</Badge>;
      case 'shipped':
        return <Badge variant="outline" className="bg-purple-100 text-purple-800 border-purple-200">Shipped</Badge>;
      case 'delivered':
        return <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">Delivered</Badge>;
      case 'cancelled':
        return <Badge variant="outline" className="bg-red-100 text-red-800 border-red-200">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">My Orders</h1>
        
        {orders.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <ArchiveX className="h-16 w-16 text-gray-400 mb-4" />
              <h3 className="text-xl font-bold text-gray-800 mb-2">No Orders Yet</h3>
              <p className="text-gray-600 mb-6 text-center">
                You haven't placed any orders yet. Start shopping and discover amazing deals!
              </p>
              <Button asChild>
                <a href="/" className="bg-primary hover:bg-primary/90 text-white px-6 py-2 rounded-full">
                  Start Shopping
                </a>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Order History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {orders.map((order) => {
                  // Parse items from JSON if needed
                  const orderItems = typeof order.items === 'string' 
                    ? JSON.parse(order.items) 
                    : order.items;
                  
                  // Get currency display
                  const orderCurrency = getCurrencyDisplay(order.currency, currencies);
                  
                  // Format date
                  const orderDate = new Date(order.createdAt);
                  const formattedDate = orderDate.toLocaleDateString();
                  const relativeTime = formatDistanceToNow(orderDate, { addSuffix: true });
                  
                  return (
                    <div key={order.id} className="border rounded-lg p-4">
                      <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 gap-2">
                        <div>
                          <span className="text-gray-500 text-sm">Order #</span>
                          <span className="font-medium ml-1">{order.id}</span>
                          <span className="mx-2 text-gray-300">|</span>
                          <span className="text-gray-500 text-sm">{formattedDate}</span>
                          <span className="text-gray-500 text-sm ml-1">({relativeTime})</span>
                        </div>
                        <div className="flex items-center">
                          {getStatusBadge(order.status)}
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            asChild
                            className="ml-2"
                          >
                            <a href={`/orders/${order.id}`} className="flex items-center">
                              <span className="text-sm">Details</span>
                              <ChevronRight className="h-4 w-4 ml-1" />
                            </a>
                          </Button>
                        </div>
                      </div>
                      
                      <Separator className="my-4" />
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="md:col-span-2">
                          <div className="flex items-start space-x-4">
                            <div className="flex-shrink-0">
                              <ShoppingBag className="h-8 w-8 text-gray-400" />
                            </div>
                            <div>
                              <h4 className="font-medium text-gray-800">Items</h4>
                              <ul className="text-sm text-gray-600 mt-1 space-y-1">
                                {orderItems.map((item: any, index: number) => (
                                  <li key={index}>{item.quantity} × {item.name}</li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        </div>
                        
                        <div>
                          <div className="bg-gray-50 p-3 rounded">
                            <h4 className="font-medium text-gray-800 mb-2">Order Summary</h4>
                            <div className="text-sm space-y-1">
                              <div className="flex justify-between">
                                <span className="text-gray-600">Total</span>
                                <span className="font-medium">
                                  {formatCurrency(order.totalPrice, orderCurrency)}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Payment</span>
                                <span className="font-medium capitalize">
                                  {order.paymentMethod}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Orders;
