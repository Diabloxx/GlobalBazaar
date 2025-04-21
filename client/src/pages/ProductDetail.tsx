import { useEffect, useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useParams, useLocation } from 'wouter';
import { useToast } from '@/hooks/use-toast';
import { useCart } from '@/contexts/CartContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useAuth } from '@/contexts/AuthContext';
import { apiRequest } from '@/lib/queryClient';
import { formatCurrency } from '@/lib/currency';
import { 
  Star,
  StarHalf,
  Plus,
  Minus,
  ShoppingCart,
  Heart,
  Share2,
  Check,
  Truck,
  Shield,
  RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Card } from "@/components/ui/card";
import { WishlistItem, Product } from '@shared/schema';

const ProductDetail = () => {
  const { slug } = useParams();
  const [quantity, setQuantity] = useState(1);
  const { toast } = useToast();
  const { addToCart } = useCart();
  const { currency, convertPrice } = useCurrency();
  const { isAuthenticated, user } = useAuth();
  const [, navigate] = useLocation();
  const [isAddingToWishlist, setIsAddingToWishlist] = useState(false);

  // Fetch product details
  const { data: product, isLoading, error } = useQuery({
    queryKey: [`/api/products/${slug}`],
    enabled: !!slug,
  });

  // Fetch category details if product is loaded
  const { data: category } = useQuery({
    queryKey: [product?.categoryId ? `/api/categories/${product.categoryId}` : null],
    enabled: !!product?.categoryId,
  });

  // Get wishlist to check if product is already added
  const { data: wishlistItems = [] } = useQuery({
    queryKey: [isAuthenticated && user ? `/api/users/${user.id}/wishlist` : null],
    enabled: isAuthenticated && !!user,
  });

  const isInWishlist = product && wishlistItems.some(
    (item: WishlistItem & { product: Product }) => item.productId === product.id
  );

  // Add to wishlist mutation
  const addToWishlistMutation = useMutation({
    mutationFn: async () => {
      if (!isAuthenticated || !user || !product) {
        throw new Error("You must be logged in to add items to your wishlist");
      }
      return apiRequest('POST', `/api/users/${user.id}/wishlist`, { productId: product.id });
    },
    onSuccess: () => {
      toast({
        title: "Added to wishlist",
        description: `${product.name} has been added to your wishlist`,
      });
      setIsAddingToWishlist(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to add to wishlist",
        description: error.message,
        variant: "destructive",
      });
      setIsAddingToWishlist(false);
    },
  });

  // Reset quantity when product changes and track browsing history
  useEffect(() => {
    setQuantity(1);
    
    // Track browsing history for recommendations
    if (product && product.id) {
      try {
        // Get existing browsing history from localStorage
        const storedHistory = localStorage.getItem('browsedProducts');
        let browsedProducts: number[] = [];
        
        if (storedHistory) {
          browsedProducts = JSON.parse(storedHistory);
          // Ensure it's an array
          if (!Array.isArray(browsedProducts)) {
            browsedProducts = [];
          }
        }
        
        // Remove the current product if it exists already (to avoid duplicates)
        browsedProducts = browsedProducts.filter(id => id !== product.id);
        
        // Add the current product to the beginning of the array
        browsedProducts.unshift(product.id);
        
        // Limit history to last 10 products
        browsedProducts = browsedProducts.slice(0, 10);
        
        // Save back to localStorage
        localStorage.setItem('browsedProducts', JSON.stringify(browsedProducts));
      } catch (error) {
        console.error('Error updating browsing history:', error);
      }
    }
  }, [product]);

  // Handle add to cart
  const handleAddToCart = () => {
    if (!product) return;
    
    addToCart(product, quantity);
    toast({
      title: "Added to cart",
      description: `${quantity} × ${product.name} has been added to your cart`,
    });
  };

  // Handle add to wishlist
  const handleToggleWishlist = () => {
    if (!product) return;
    
    if (!isAuthenticated) {
      toast({
        title: "Authentication required",
        description: "Please sign in to add items to your wishlist",
        variant: "destructive",
      });
      return;
    }

    if (isInWishlist) {
      toast({
        title: "Already in wishlist",
        description: `${product.name} is already in your wishlist`,
      });
      return;
    }

    setIsAddingToWishlist(true);
    addToWishlistMutation.mutate();
  };

  // Decrease quantity (min 1)
  const decreaseQuantity = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1);
    }
  };

  // Increase quantity
  const increaseQuantity = () => {
    setQuantity(quantity + 1);
  };

  // Render stars for product rating
  const renderRatingStars = (rating: number) => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    
    return (
      <div className="flex text-yellow-400">
        {[...Array(fullStars)].map((_, i) => (
          <Star key={i} className="h-5 w-5 fill-current" />
        ))}
        {hasHalfStar && <StarHalf className="h-5 w-5 fill-current" />}
        {[...Array(5 - fullStars - (hasHalfStar ? 1 : 0))].map((_, i) => (
          <Star key={`empty-${i}`} className="h-5 w-5 text-gray-300 dark:text-gray-600" />
        ))}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row gap-8">
          <div className="md:w-1/2">
            <Skeleton className="w-full h-96 rounded-lg" />
          </div>
          <div className="md:w-1/2">
            <Skeleton className="h-10 w-3/4 mb-4" />
            <Skeleton className="h-6 w-1/4 mb-6" />
            <Skeleton className="h-8 w-1/3 mb-4" />
            <div className="space-y-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </div>
            <div className="mt-8">
              <Skeleton className="h-12 w-full mb-4" />
              <Skeleton className="h-12 w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-4">Product Not Found</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-8">Sorry, we couldn't find the product you're looking for.</p>
        <Button asChild>
          <a href="/" className="bg-primary text-white px-6 py-2 rounded-full">
            Continue Shopping
          </a>
        </Button>
      </div>
    );
  }

  // Convert prices to selected currency
  const convertedPrice = convertPrice(product.price);
  const convertedSalePrice = product.salePrice ? convertPrice(product.salePrice) : null;

  // Calculate discount percentage
  const discountPercentage = product.discount || 
    (product.salePrice ? Math.round(((product.price - product.salePrice) / product.price) * 100) : null);

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <div className="text-sm breadcrumbs mb-6">
        <ul className="flex space-x-2 text-gray-500 dark:text-gray-400">
          <li><a href="/" className="hover:text-primary">Home</a></li>
          <li>
            <span className="mx-2">/</span>
            {category ? (
              <a href={`/category/${category.slug}`} className="hover:text-primary">
                {category.name}
              </a>
            ) : (
              <span>Category</span>
            )}
          </li>
          <li>
            <span className="mx-2">/</span>
            <span className="text-gray-800 dark:text-gray-100">{product.name}</span>
          </li>
        </ul>
      </div>

      {/* Product Details */}
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Product Image */}
        <div className="lg:w-1/2">
          <div className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-sm">
            <img 
              src={product.imageUrl} 
              alt={product.name} 
              className="w-full h-auto object-cover"
            />
          </div>
        </div>

        {/* Product Info */}
        <div className="lg:w-1/2">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-2">{product.name}</h1>
          
          {/* Badges for product status */}
          <div className="flex flex-wrap gap-2 mb-4">
            {product.isNew && (
              <Badge className="bg-secondary text-white">New</Badge>
            )}
            {product.isBestSeller && (
              <Badge className="bg-amber-500 text-white">Bestseller</Badge>
            )}
            {discountPercentage && (
              <Badge className="bg-primary text-white">-{discountPercentage}% OFF</Badge>
            )}
          </div>
          
          {/* Rating */}
          <div className="flex items-center mb-4">
            {product.rating && renderRatingStars(product.rating)}
            <span className="ml-2 text-gray-600">{product.reviewCount || 0} reviews</span>
          </div>
          
          {/* Price */}
          <div className="flex items-baseline mb-6">
            <span className="text-3xl font-bold text-gray-800 dark:text-gray-100">
              {formatCurrency(convertedSalePrice || convertedPrice, currency)}
            </span>
            {convertedSalePrice && (
              <span className="text-xl text-gray-500 line-through ml-3">
                {formatCurrency(convertedPrice, currency)}
              </span>
            )}
          </div>
          
          {/* Short description */}
          <p className="text-gray-600 mb-6">{product.description}</p>
          
          {/* Quantity selector */}
          <div className="flex items-center mb-6">
            <span className="mr-4 font-medium">Quantity:</span>
            <div className="flex items-center border border-gray-300 rounded-full">
              <button 
                onClick={decreaseQuantity}
                disabled={quantity <= 1}
                className="w-10 h-10 flex items-center justify-center text-gray-600 hover:text-primary disabled:opacity-50"
                aria-label="Decrease quantity"
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="w-12 text-center">{quantity}</span>
              <button 
                onClick={increaseQuantity}
                className="w-10 h-10 flex items-center justify-center text-gray-600 hover:text-primary"
                aria-label="Increase quantity"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
            <span className="ml-4 text-gray-500">
              {product.inventory > 0 ? `${product.inventory} in stock` : 'Out of stock'}
            </span>
          </div>
          
          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-4 mb-8">
            <Button 
              onClick={handleAddToCart}
              disabled={product.inventory <= 0}
              className="flex-1 bg-primary hover:bg-primary/90 text-white py-3 px-6 rounded-full font-medium flex items-center justify-center gap-2"
            >
              <ShoppingCart className="h-5 w-5" />
              Add to Cart
            </Button>
            <Button 
              onClick={handleToggleWishlist}
              disabled={isAddingToWishlist}
              variant="outline"
              className={`flex-1 border-2 py-3 px-6 rounded-full font-medium flex items-center justify-center gap-2 ${
                isInWishlist 
                  ? 'border-primary text-primary' 
                  : 'border-gray-300 text-gray-700 hover:border-primary hover:text-primary'
              }`}
            >
              <Heart className={`h-5 w-5 ${isInWishlist ? 'fill-primary text-primary' : ''}`} />
              {isInWishlist ? 'In Wishlist' : 'Add to Wishlist'}
            </Button>
          </div>
          
          {/* Features */}
          <div className="border-t border-gray-200 pt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center">
                <div className="w-10 h-10 flex items-center justify-center rounded-full bg-primary/10 mr-3">
                  <Truck className="h-5 w-5 text-primary" />
                </div>
                <span className="text-sm text-gray-600">Free shipping over $50</span>
              </div>
              <div className="flex items-center">
                <div className="w-10 h-10 flex items-center justify-center rounded-full bg-primary/10 mr-3">
                  <Shield className="h-5 w-5 text-primary" />
                </div>
                <span className="text-sm text-gray-600">Secure checkout</span>
              </div>
              <div className="flex items-center">
                <div className="w-10 h-10 flex items-center justify-center rounded-full bg-primary/10 mr-3">
                  <RefreshCw className="h-5 w-5 text-primary" />
                </div>
                <span className="text-sm text-gray-600">30-day returns</span>
              </div>
            </div>
          </div>
          
          {/* Share */}
          <div className="mt-6 flex items-center">
            <span className="text-gray-600 mr-4">Share:</span>
            <div className="flex space-x-2">
              <a href="#" className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-600 hover:bg-primary hover:text-white">
                <i className="fab fa-facebook-f"></i>
              </a>
              <a href="#" className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-600 hover:bg-primary hover:text-white">
                <i className="fab fa-twitter"></i>
              </a>
              <a href="#" className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-600 hover:bg-primary hover:text-white">
                <i className="fab fa-pinterest"></i>
              </a>
              <a href="#" className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-600 hover:bg-primary hover:text-white">
                <Share2 className="h-4 w-4" />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Product Tabs */}
      <div className="mt-12">
        <Tabs defaultValue="description">
          <TabsList className="grid w-full grid-cols-3 max-w-2xl">
            <TabsTrigger value="description">Description</TabsTrigger>
            <TabsTrigger value="specifications">Specifications</TabsTrigger>
            <TabsTrigger value="reviews">Reviews</TabsTrigger>
          </TabsList>
          <TabsContent value="description" className="mt-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                {product.description}
              </p>
              <ul className="mt-4 space-y-2">
                <li className="flex items-center text-gray-700 dark:text-gray-300">
                  <Check className="h-5 w-5 text-primary mr-2" />
                  <span>High quality product</span>
                </li>
                <li className="flex items-center text-gray-700 dark:text-gray-300">
                  <Check className="h-5 w-5 text-primary mr-2" />
                  <span>Satisfaction guaranteed</span>
                </li>
                <li className="flex items-center text-gray-700 dark:text-gray-300">
                  <Check className="h-5 w-5 text-primary mr-2" />
                  <span>Fast shipping worldwide</span>
                </li>
              </ul>
            </div>
          </TabsContent>
          <TabsContent value="specifications" className="mt-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
              <table className="min-w-full divide-y divide-gray-200">
                <tbody className="divide-y divide-gray-200">
                  <tr>
                    <td className="py-3 text-gray-600 dark:text-gray-400 w-1/3">Model</td>
                    <td className="py-3 text-gray-800 dark:text-gray-200">{product.name}</td>
                  </tr>
                  <tr>
                    <td className="py-3 text-gray-600 dark:text-gray-400">Category</td>
                    <td className="py-3 text-gray-800 dark:text-gray-200">{category?.name || 'Unknown'}</td>
                  </tr>
                  <tr>
                    <td className="py-3 text-gray-600 dark:text-gray-400">Stock</td>
                    <td className="py-3 text-gray-800 dark:text-gray-200">{product.inventory} units</td>
                  </tr>
                  <tr>
                    <td className="py-3 text-gray-600 dark:text-gray-400">SKU</td>
                    <td className="py-3 text-gray-800 dark:text-gray-200">SKU-{product.id}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </TabsContent>
          <TabsContent value="reviews" className="mt-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
              <div className="flex items-center mb-6">
                <div className="mr-4">
                  <div className="text-3xl font-bold text-gray-800 dark:text-gray-100">{product.rating}</div>
                  <div className="text-gray-500 dark:text-gray-400 text-sm">out of 5</div>
                </div>
                <div className="flex-1">
                  {renderRatingStars(product.rating || 0)}
                  <div className="text-gray-500 dark:text-gray-400 text-sm mt-1">{product.reviewCount} reviews</div>
                </div>
              </div>
              
              <div className="space-y-4">
                {/* This is just placeholder data since we don't have actual reviews in our schema */}
                <div className="border-b border-gray-200 pb-4">
                  <div className="flex items-center mb-2">
                    <div className="font-medium text-gray-800 dark:text-gray-200">John D.</div>
                    <div className="text-gray-500 dark:text-gray-400 text-sm ml-2">Verified Purchase</div>
                  </div>
                  <div className="flex text-yellow-400 mb-2">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-current" />
                    ))}
                  </div>
                  <p className="text-gray-700 dark:text-gray-300 text-sm">Great product! Exactly as described and fast shipping.</p>
                </div>
                
                <div className="border-b border-gray-200 pb-4">
                  <div className="flex items-center mb-2">
                    <div className="font-medium text-gray-800 dark:text-gray-200">Sarah M.</div>
                    <div className="text-gray-500 dark:text-gray-400 text-sm ml-2">Verified Purchase</div>
                  </div>
                  <div className="flex text-yellow-400 mb-2">
                    {[...Array(4)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-current" />
                    ))}
                    {[...Array(1)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 text-gray-300" />
                    ))}
                  </div>
                  <p className="text-gray-700 dark:text-gray-300 text-sm">Good quality but a little smaller than I expected.</p>
                </div>
              </div>
              
              <Button className="mt-6 bg-primary hover:bg-primary/90 text-white">
                Write a Review
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ProductDetail;
