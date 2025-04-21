import { useState } from 'react';
import { Link } from 'wouter';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Heart, Star, StarHalf } from 'lucide-react';
import { formatCurrency } from '@/lib/currency';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Product, WishlistItem } from '@shared/schema';

interface ProductCardProps {
  product: Product;
}

const ProductCard = ({ product }: ProductCardProps) => {
  const { isAuthenticated, user } = useAuth();
  const { currency, convertPrice } = useCurrency();
  const { addToCart } = useCart();
  const { toast } = useToast();
  const [isAddingToWishlist, setIsAddingToWishlist] = useState(false);

  // Check if the product is in the user's wishlist
  const { data: wishlistItems = [] } = useQuery({
    queryKey: [isAuthenticated && user ? `/api/users/${user.id}/wishlist` : null],
    enabled: isAuthenticated && !!user,
  });

  const isInWishlist = wishlistItems.some(
    (item: WishlistItem & { product: Product }) => item.productId === product.id
  );

  // Add to wishlist mutation
  const addToWishlistMutation = useMutation({
    mutationFn: async () => {
      if (!isAuthenticated || !user) {
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

  // Handle add to cart
  const handleAddToCart = () => {
    addToCart(product);
    toast({
      title: "Added to cart",
      description: `${product.name} has been added to your cart`,
    });
  };

  // Handle add to wishlist
  const handleToggleWishlist = () => {
    if (!isAuthenticated) {
      toast({
        title: "Authentication required",
        description: "Please sign in to add items to your wishlist",
        variant: "destructive",
      });
      return;
    }

    if (isInWishlist) {
      // We would need a remove function here
      toast({
        title: "Already in wishlist",
        description: `${product.name} is already in your wishlist`,
      });
      return;
    }

    setIsAddingToWishlist(true);
    addToWishlistMutation.mutate();
  };

  // Convert prices to selected currency
  const convertedPrice = convertPrice(product.price);
  const convertedSalePrice = product.salePrice ? convertPrice(product.salePrice) : null;

  // Calculate discount percentage
  const discountPercentage = product.discount || 
    (product.salePrice ? Math.round(((product.price - product.salePrice) / product.price) * 100) : null);

  // Render stars for product rating
  const renderRatingStars = (rating: number | null | undefined) => {
    if (!rating) return null;
    
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    
    return (
      <div className="flex text-xs text-yellow-400 mb-2">
        {[...Array(fullStars)].map((_, i) => (
          <Star key={i} className="h-3.5 w-3.5 fill-current" />
        ))}
        {hasHalfStar && <StarHalf className="h-3.5 w-3.5 fill-current" />}
        {[...Array(5 - fullStars - (hasHalfStar ? 1 : 0))].map((_, i) => (
          <Star key={`empty-${i}`} className="h-3.5 w-3.5 text-gray-300" />
        ))}
        <span className="text-gray-500 ml-1">({product.reviewCount || 0})</span>
      </div>
    );
  };

  return (
    <div className="product-card bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all">
      <div className="relative">
        <Link href={`/product/${product.slug}`}>
          <img 
            src={product.imageUrl} 
            alt={product.name} 
            className="w-full h-48 object-cover"
          />
        </Link>
        {(discountPercentage || product.isNew || product.isBestSeller) && (
          <div className="absolute top-2 left-2">
            {discountPercentage && (
              <span className="bg-primary text-white text-xs px-2 py-1 rounded-full">
                -{discountPercentage}%
              </span>
            )}
            {product.isNew && !discountPercentage && (
              <span className="bg-secondary text-white text-xs px-2 py-1 rounded-full">
                New
              </span>
            )}
            {product.isBestSeller && !discountPercentage && !product.isNew && (
              <span className="bg-amber-400 text-gray-800 text-xs px-2 py-1 rounded-full">
                Bestseller
              </span>
            )}
          </div>
        )}
        <button 
          onClick={handleToggleWishlist}
          disabled={isAddingToWishlist}
          className={`absolute top-2 right-2 w-8 h-8 bg-white/80 rounded-full flex items-center justify-center ${
            isInWishlist ? 'text-primary' : 'text-gray-600 hover:text-primary'
          }`}
          aria-label={isInWishlist ? "Remove from wishlist" : "Add to wishlist"}
        >
          <Heart className={`h-4 w-4 ${isInWishlist ? 'fill-current' : ''}`} />
        </button>
      </div>
      <div className="p-4">
        <Link href={`/product/${product.slug}`}>
          <h3 className="font-medium text-gray-800 mb-1 truncate hover:text-primary">
            {product.name}
          </h3>
        </Link>
        {renderRatingStars(product.rating)}
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
        <button 
          onClick={handleAddToCart}
          className="w-full bg-gray-100 hover:bg-primary hover:text-white text-gray-800 rounded-full py-2 text-sm font-medium transition-colors"
        >
          Add to Cart
        </button>
      </div>
    </div>
  );
};

export default ProductCard;
