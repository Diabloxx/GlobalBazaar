import { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Search, Sparkles, Info } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import ProductCard from "../ProductCard";
import { Product } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface AIRecommendationWidgetProps {
  recentlyViewedProducts?: number[];
  categoryId?: number;
}

export default function AIRecommendationWidget({ 
  recentlyViewedProducts = [],
  categoryId 
}: AIRecommendationWidgetProps) {
  const { toast } = useToast();
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [recommendations, setRecommendations] = useState<Product[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [hasPerformedSearch, setHasPerformedSearch] = useState(false);

  const getRecommendations = async () => {
    if (!query.trim()) {
      toast({
        title: "Please enter a search query",
        description: "Tell us what you're looking for to get personalized recommendations.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    setHasPerformedSearch(true);

    try {
      const response = await apiRequest("POST", "/api/ai/recommend", {
        query,
        browsedProducts: recentlyViewedProducts,
        categoryId
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      const data = await response.json();
      setRecommendations(data.products || []);
      setMessage(data.message || "Here are some products you might like");
    } catch (error) {
      console.error("Error getting recommendations:", error);
      toast({
        title: "Recommendation Error",
        description: "We couldn't get personalized recommendations at this moment. Please try again later.",
        variant: "destructive"
      });
      setRecommendations([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    getRecommendations();
  };

  // If widget hasn't been used yet, show minimal form
  if (!hasPerformedSearch) {
    return (
      <Card className="mb-8 shadow-md">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-center">
            <CardTitle className="text-xl flex items-center">
              <Sparkles className="h-5 w-5 mr-2 text-primary" /> AI Shopping Assistant
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="ml-2 h-6 w-6">
                      <Info className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">Ask for product recommendations in natural language. Try something like "I need a gift for my mother who loves cooking"</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </CardTitle>
          </div>
          <CardDescription>Get personalized product recommendations</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex gap-2">
            <Input
              placeholder="What are you looking for today?"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="flex-1"
            />
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Search className="h-4 w-4 mr-2" />
              )}
              Find
            </Button>
          </form>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mb-8 shadow-md">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-xl flex items-center">
            <Sparkles className="h-5 w-5 mr-2 text-primary" /> AI Shopping Assistant
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="ml-2 h-6 w-6">
                    <Info className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs">Ask for product recommendations in natural language. Try something like "I need a gift for my mother who loves cooking"</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </CardTitle>
        </div>
        <CardDescription>Get personalized product recommendations</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex gap-2 mb-4">
          <Input
            placeholder="What are you looking for today?"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1"
          />
          <Button type="submit" disabled={isLoading}>
            {isLoading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Search className="h-4 w-4 mr-2" />
            )}
            Find
          </Button>
        </form>

        {isLoading ? (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {message && <div className="text-sm mb-4 bg-muted/50 p-3 rounded-md">{message}</div>}
            
            {recommendations.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {recommendations.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p>No recommendations found. Try a different search term.</p>
              </div>
            )}
          </>
        )}
      </CardContent>
      <CardFooter className="flex justify-between text-xs text-muted-foreground border-t pt-4">
        <div>
          Powered by AI technology
        </div>
        <div>
          <Button variant="ghost" size="sm" onClick={() => setHasPerformedSearch(false)}>
            Clear Results
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}