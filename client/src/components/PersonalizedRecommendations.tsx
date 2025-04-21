import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../contexts/AuthContext";
import { apiRequest } from "@/lib/queryClient";
import ProductCard from "./ProductCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, Sparkles } from "lucide-react";
import { Product } from "@shared/schema";
import AIRecommendationWidget from "./products/AIRecommendationWidget";

export function PersonalizedRecommendations() {
  const { user } = useAuth();
  const [currentIndex, setCurrentIndex] = useState(0);
  
  // Fetch viewed products history if user is logged in
  const { data: viewHistory, isLoading: isViewHistoryLoading } = useQuery({
    queryKey: ["/api/user-activity/products"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/user-activity/products");
      if (!res.ok) return [];
      return await res.json();
    },
    enabled: !!user,
    refetchOnWindowFocus: false
  });
  
  // Fetch similar products based on categories of viewed products
  const { data: recommendedProducts, isLoading: isRecommendationsLoading } = useQuery({
    queryKey: ["/api/products/recommendations"],
    queryFn: async () => {
      if (!viewHistory || viewHistory.length === 0) {
        // If no view history, get popular products instead
        const res = await apiRequest("GET", "/api/products/bestsellers");
        if (!res.ok) return [];
        return await res.json();
      }
      
      // Get products similar to viewed ones (by category)
      const categories = viewHistory
        .map((product: Product) => product.categoryId)
        .filter((v: number, i: number, a: number[]) => a.indexOf(v) === i)
        .slice(0, 2); // Take up to 2 categories
      
      const categoryParams = categories.join(",");
      const res = await apiRequest("GET", `/api/products/search?categoryIds=${categoryParams}&limit=8`);
      if (!res.ok) return [];
      
      // Filter out products that are in the view history
      const products = await res.json();
      const viewedIds = new Set(viewHistory.map((p: Product) => p.id));
      return products.filter((p: Product) => !viewedIds.has(p.id));
    },
    enabled: !!viewHistory,
    refetchOnWindowFocus: false
  });
  
  const isLoading = isViewHistoryLoading || isRecommendationsLoading;
  const hasRecommendations = recommendedProducts && recommendedProducts.length > 0;
  
  // Handle navigation in carousel
  const navigatePrev = () => {
    setCurrentIndex((prevIndex) => Math.max(0, prevIndex - 1));
  };
  
  const navigateNext = () => {
    if (!recommendedProducts) return;
    setCurrentIndex((prevIndex) => 
      Math.min(recommendedProducts.length - (isMobile ? 1 : 4), prevIndex + 1)
    );
  };
  
  // Detect mobile for responsive display
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener("resize", checkMobile);
    
    return () => {
      window.removeEventListener("resize", checkMobile);
    };
  }, []);
  
  // Don't show if there's no recommendations or user is not logged in
  if (!user || (!hasRecommendations && !isLoading)) {
    return null;
  }

  // Extract product IDs from view history for AI recommendations
  const recentlyViewedProductIds = viewHistory ? 
    viewHistory.map((product: Product) => product.id) : [];
  
  return (
    <div className="w-full py-8">
      <div className="container px-4 mx-auto">
        {/* AI Recommendation Widget */}
        <AIRecommendationWidget 
          recentlyViewedProducts={recentlyViewedProductIds}
          categoryId={viewHistory && viewHistory.length > 0 ? viewHistory[0].categoryId : undefined}
        />

        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Recommended For You</h2>
          {hasRecommendations && (
            <div className="flex space-x-2">
              <Button 
                variant="outline" 
                size="icon" 
                onClick={navigatePrev}
                disabled={currentIndex === 0}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <Button 
                variant="outline" 
                size="icon" 
                onClick={navigateNext}
                disabled={!recommendedProducts || currentIndex >= recommendedProducts.length - (isMobile ? 1 : 4)}
              >
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
        
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {Array(4).fill(0).map((_, i) => (
              <div key={i} className="rounded-md overflow-hidden">
                <Skeleton className="h-48 w-full" />
                <div className="p-3">
                  <Skeleton className="h-4 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : hasRecommendations ? (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 relative">
            {recommendedProducts
              .slice(currentIndex, currentIndex + (isMobile ? 1 : 4))
              .map((product: Product) => (
                <ProductCard key={product.id} product={product} />
              ))}
          </div>
        ) : (
          <div className="text-center py-10 text-gray-500">
            <p>We'll have personalized recommendations for you soon!</p>
          </div>
        )}
      </div>
    </div>
  );
}