import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Loader2, Search, Sparkles, Info, ShoppingCart } from 'lucide-react';
import { Product } from '@shared/schema';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useCart } from '@/contexts/CartContext';

interface AIRecommendationWidgetProps {
  recentlyViewedProducts?: number[];
  userPreferences?: string[];
  categoryId?: number;
}

export default function AIRecommendationWidget({ 
  recentlyViewedProducts, 
  userPreferences,
  categoryId
}: AIRecommendationWidgetProps) {
  const [query, setQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [aiMessage, setAiMessage] = useState<string>('');
  const [expanded, setExpanded] = useState<boolean>(false);
  const { toast } = useToast();
  const { formatPrice } = useCurrency();
  const { addToCart } = useCart();

  // AI recommendation mutation
  const recommendationMutation = useMutation({
    mutationFn: async (searchQuery: string) => {
      const response = await apiRequest('POST', '/api/ai/recommend', {
        query: searchQuery,
        userPreferences,
        browsedProducts: recentlyViewedProducts,
        categoryId
      });
      
      const data = await response.json();
      return data;
    },
    onSuccess: (data) => {
      setSearchResults(data.products || []);
      setAiMessage(data.message || 'Here are some recommendations based on your search');
      setExpanded(true);
    },
    onError: (error: Error) => {
      toast({
        title: 'Recommendation failed',
        description: error.message || 'Could not get recommendations at this time',
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    
    recommendationMutation.mutate(query);
  };

  const handleAddToCart = (product: Product) => {
    addToCart(product);
    toast({
      title: 'Added to cart',
      description: `${product.name} has been added to your cart`,
    });
  };

  return (
    <Card className="w-full mb-6 shadow-md">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">AI Shopping Assistant</CardTitle>
          </div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Info className="h-4 w-4 text-muted-foreground" />
                </Button>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p>Ask me anything about products! I can recommend items based on your preferences, browsing history, and specific needs.</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <CardDescription>
          Describe what you're looking for and get personalized recommendations
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex space-x-2 mb-4">
          <Input
            placeholder="e.g., 'I need a gift for a tech enthusiast under $100'"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1"
          />
          <Button 
            type="submit" 
            disabled={recommendationMutation.isPending || !query.trim()}
          >
            {recommendationMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Search className="h-4 w-4 mr-2" />
            )}
            Find
          </Button>
        </form>

        {/* Results section, shown when expanded */}
        {expanded && (
          <div className="pt-2 border-t">
            {aiMessage && (
              <div className="mb-4 p-3 bg-muted/50 rounded-md text-sm">
                <p>{aiMessage}</p>
              </div>
            )}
            
            {searchResults.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {searchResults.map((product) => (
                  <div key={product.id} className="group relative">
                    <div className="rounded overflow-hidden shadow-md transition-shadow hover:shadow-lg">
                      <div className="h-40 bg-gray-100 relative">
                        {product.imageUrl ? (
                          <img 
                            src={product.imageUrl} 
                            alt={product.name} 
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gray-200">
                            <span className="text-gray-400">No image</span>
                          </div>
                        )}
                        {product.isSale && (
                          <div className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
                            SALE
                          </div>
                        )}
                      </div>
                      <div className="p-3">
                        <h3 className="font-medium text-sm line-clamp-2">{product.name}</h3>
                        <div className="mt-1 flex justify-between items-center">
                          <div className="flex items-center gap-1">
                            {product.salePrice ? (
                              <>
                                <span className="font-bold text-red-500">{formatPrice(product.salePrice)}</span>
                                <span className="text-xs line-through text-gray-400">{formatPrice(product.price)}</span>
                              </>
                            ) : (
                              <span className="font-bold">{formatPrice(product.price)}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button 
                              variant="secondary" 
                              size="sm"
                              onClick={() => handleAddToCart(product)}
                            >
                              <ShoppingCart className="h-4 w-4 mr-2" />
                              Add to Cart
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent side="top">
                            <p>Add {product.name} to your shopping cart</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </div>
                ))}
              </div>
            ) : aiMessage ? (
              <p className="text-center py-4 text-muted-foreground">No matching products found</p>
            ) : null}
          </div>
        )}
      </CardContent>
      <CardFooter className="pt-0 justify-between text-xs text-muted-foreground">
        <div>Powered by AI</div>
        {expanded && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setExpanded(false)}
          >
            Collapse
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}