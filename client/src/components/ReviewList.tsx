import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { ThumbsUp, Star, StarIcon } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ProductReview } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";

interface ReviewWithUser extends ProductReview {
  user: {
    id: number;
    username: string;
    fullName: string | null;
  };
}

interface ReviewListProps {
  productId: number;
}

export default function ReviewList({ productId }: ReviewListProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Fetch product reviews
  const { 
    data: reviews, 
    isLoading, 
    isError, 
    refetch 
  } = useQuery<ReviewWithUser[]>({
    queryKey: [`/api/products/${productId}/reviews`],
    queryFn: async () => {
      const response = await fetch(`/api/products/${productId}/reviews`);
      if (!response.ok) {
        throw new Error("Failed to fetch reviews");
      }
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const handleMarkHelpful = async (reviewId: number) => {
    if (!user) {
      toast({
        title: "Please sign in",
        description: "You need to be signed in to mark reviews as helpful",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await apiRequest("POST", `/api/reviews/${reviewId}/helpful`);
      
      if (response.ok) {
        // Refresh reviews
        refetch();
        toast({
          title: "Thank you!",
          description: "You've marked this review as helpful",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to mark review as helpful",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error marking review as helpful:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h3 className="text-xl font-semibold">Customer Reviews</h3>
        {[1, 2, 3].map((i) => (
          <div key={i} className="border rounded-lg p-4 space-y-4">
            <div className="flex items-center space-x-2">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-4 w-24" />
              </div>
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500">Failed to load reviews. Please try again later.</p>
        <Button 
          variant="outline" 
          onClick={() => refetch()} 
          className="mt-4"
        >
          Retry
        </Button>
      </div>
    );
  }

  if (reviews?.length === 0) {
    return (
      <div className="text-center py-8 border rounded-lg bg-muted/30">
        <h3 className="text-xl font-semibold mb-2">No Reviews Yet</h3>
        <p className="text-muted-foreground">Be the first to review this product!</p>
      </div>
    );
  }

  // Group reviews by rating to show distribution
  const ratingCounts = reviews?.reduce((acc, review) => {
    acc[review.rating] = (acc[review.rating] || 0) + 1;
    return acc;
  }, {} as Record<number, number>) || {};
  
  const totalReviews = reviews?.length || 0;
  const averageRating = totalReviews > 0
    ? reviews?.reduce((sum, review) => sum + review.rating, 0) / totalReviews
    : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-6">
        <div>
          <h3 className="text-xl font-semibold">Customer Reviews</h3>
          <div className="flex items-center mt-2">
            <div className="flex items-center mr-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <StarIcon 
                  key={star} 
                  className={`w-5 h-5 ${
                    star <= Math.round(averageRating) 
                      ? "text-yellow-400 fill-yellow-400" 
                      : "text-gray-300"
                  }`} 
                />
              ))}
            </div>
            <span className="font-medium">
              {averageRating.toFixed(1)} out of 5
            </span>
            <span className="text-muted-foreground ml-2">
              ({totalReviews} {totalReviews === 1 ? 'review' : 'reviews'})
            </span>
          </div>
        </div>
        
        <div className="w-full md:w-64 space-y-2">
          {[5, 4, 3, 2, 1].map((rating) => {
            const count = ratingCounts[rating] || 0;
            const percentage = totalReviews > 0 
              ? Math.round((count / totalReviews) * 100) 
              : 0;
              
            return (
              <div key={rating} className="flex items-center space-x-2">
                <span className="text-sm w-8">{rating} star</span>
                <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-yellow-400 rounded-full" 
                    style={{ width: `${percentage}%` }} 
                  />
                </div>
                <span className="text-sm w-12 text-right">{percentage}%</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="space-y-6">
        {reviews?.map((review) => (
          <div key={review.id} className="border rounded-lg p-4 space-y-3">
            <div className="flex items-center space-x-3">
              <Avatar className="h-10 w-10">
                <AvatarFallback>
                  {review.user.username.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="font-medium">{review.user.fullName || review.user.username}</div>
                <div className="text-xs text-muted-foreground">
                  {format(new Date(review.createdAt), 'MMMM d, yyyy')}
                </div>
              </div>
            </div>
            
            <div>
              <div className="flex items-center mb-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <StarIcon 
                    key={star} 
                    className={`w-4 h-4 ${
                      star <= review.rating 
                        ? "text-yellow-400 fill-yellow-400" 
                        : "text-gray-300"
                    }`} 
                  />
                ))}
                {review.title && (
                  <span className="ml-2 font-medium">{review.title}</span>
                )}
              </div>
              
              <p className="text-sm text-gray-600">{review.comment}</p>
              
              {review.verifiedPurchase && (
                <div className="mt-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700">
                  Verified Purchase
                </div>
              )}
            </div>
            
            <div className="flex items-center justify-between mt-4">
              <Button 
                variant="ghost" 
                size="sm"
                className="text-xs flex items-center gap-1 text-muted-foreground hover:text-primary"
                onClick={() => handleMarkHelpful(review.id)}
              >
                <ThumbsUp className="h-4 w-4" />
                Helpful {review.helpfulCount > 0 && `(${review.helpfulCount})`}
              </Button>
              
              {user?.id === review.userId && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs text-muted-foreground hover:text-primary"
                  onClick={() => {
                    // Implement edit functionality here
                    toast({
                      title: "Coming Soon",
                      description: "Editing reviews will be available soon",
                    });
                  }}
                >
                  Edit
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}