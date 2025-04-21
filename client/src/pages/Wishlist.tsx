import { useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { useAuth } from '@/contexts/AuthContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useCart } from '@/contexts/CartContext';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency } from '@/lib/currency';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Heart, ShoppingCart, Trash2, X } from 'lucide-react';
import { WishlistItem, Product } from '@shared/schema';

const Wishlist = () => {
  const { isAuthenticated, user } = useAuth();
  const { currency, convertPrice } = useCurrency();
  const { addToCart } = useCart();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const queryClient = useQuery.getQueryClient();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      toast({
        title: "Authentication required",
        description: "Please sign in to view your wishlist",
        variant: "destructive",
      });
      navigate('/account');
    }
  }, [isAuthenticated, navigate, toast]);

  // Fetch user's wishlist items
  const { 
    data: wishlistItems = [], 
    isLoading, 
    error
  } = useQuery({
    queryKey: [isAuthenticated && user ? `/api/users/${user.id}/wishlist` : null],
    enabled: isAuthenticated && !!user,
  });

  // Remove from wishlist mutation
  const removeFromWishlistMutation = useMutation({
    mutationFn: async (itemId: number) => {
      return apiRequest('DELETE', `/api/wishlist/${itemId}`);
    },
    onSuccess: () => {
      // Invalidate and refetch wishlist items
      if (user) {
        queryClient.invalidateQueries({ queryKey: [`/api/users/${user.id}/wishlist`] });
      }
      toast({
        title: "Item removed",
        description: "Item has been removed from your wishlist",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to remove item: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Handle add to cart
  const handleAddToCart = (product: Product) => {
    addToCart(product);
    toast({
      title: "Added to cart",
      description: `${product.name} has been added to your cart`,
    });
  };

  // Handle remove from wishlist
  const handleRemoveFromWishlist = (itemId: number) => {
    removeFromWishlistMutation.mutate(itemId);
  };

  if (!isAuthenticated) {
    return null; // Will be redirected by useEffect
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <Skeleton className="h-10 w-1/4 mb-6" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg overflow-hidden shadow-sm">
                <Skeleton className="w-full h-48" />
                <div className="p-4">
                  <Skeleton className="h-4 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-1/2 mb-4" />
                  <Skeleton className="h-8 w-full" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Error Loading Wishlist</h2>
          <p className="text-gray-600 mb-6">
            There was a problem loading your wishlist. Please try again later.
          </p>
          <Button onClick={() => window.location.reload()}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">My Wishlist</h1>
        
        {wishlistItems.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Heart className="h-16 w-16 text-gray-400 mb-4" />
              <h3 className="text-xl font-bold text-gray-800 mb-2">Your Wishlist is Empty</h3>
              <p className="text-gray-600 mb-6 text-center">
                Add items to your wishlist while browsing our products to save them for later.
              </p>
              <Button asChild>
                <a href="/" className="bg-primary hover:bg-primary/90 text-white px-6 py-2 rounded-full">
                  Start Shopping
                </a>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {wishlistItems.map((item: WishlistItem & { product: Product }) => {
              // Convert prices to selected currency
              const convertedPrice = convertPrice(item.product.price);
              const convertedSalePrice = item.product.salePrice 
                ? convertPrice(item.product.salePrice) 
                : null;

              return (
                <div key={item.id} className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md product-card">
                  <div className="relative">
                    <a href={`/product/${item.product.slug}`}>
                      <img 
                        src={item.product.imageUrl} 
                        alt={item.product.name} 
                        className="w-full h-48 object-cover"
                      />
                    </a>
                    <button 
                      onClick={() => handleRemoveFromWishlist(item.id)}
                      className="absolute top-2 right-2 w-8 h-8 bg-white/80 rounded-full flex items-center justify-center text-gray-600 hover:text-red-500"
                      aria-label="Remove from wishlist"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="p-4">
                    <a href={`/product/${item.product.slug}`}>
                      <h3 className="font-medium text-gray-800 mb-1 truncate hover:text-primary">
                        {item.product.name}
                      </h3>
                    </a>
                    <div className="flex items-baseline mb-2">
                      <span className="text-lg font-bold text-gray-800">
                        {formatCurrency(convertedSalePrice || convertedPrice, currency)}
                      </span>
                      {convertedSalePrice && (
                        <span className="text-sm text-gray-500 line-through ml-2">
                          {formatCurrency(convertedPrice, currency)}
                        </span>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleAddToCart(item.product)}
                        className="flex-1 bg-primary hover:bg-primary/90 text-white rounded-full py-2 text-sm font-medium"
                      >
                        <ShoppingCart className="h-4 w-4 mr-2" />
                        Add to Cart
                      </Button>
                      <Button
                        onClick={() => handleRemoveFromWishlist(item.id)}
                        variant="outline"
                        className="bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full py-2 text-sm font-medium"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Wishlist;
