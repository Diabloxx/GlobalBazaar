import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Star, StarIcon } from "lucide-react";

// Define validation schema for review form
const reviewFormSchema = z.object({
  rating: z.number().min(1).max(5),
  title: z.string().min(3, "Title must be at least 3 characters").max(100, "Title must be less than 100 characters").optional(),
  comment: z.string().min(10, "Review must be at least 10 characters").max(1000, "Review must be less than 1000 characters")
});

type ReviewFormValues = z.infer<typeof reviewFormSchema>;

interface ProductReviewFormProps {
  productId: number;
  onReviewSubmitted?: () => void;
}

export default function ProductReviewForm({ productId, onReviewSubmitted }: ProductReviewFormProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [hoverRating, setHoverRating] = useState(0);

  const form = useForm<ReviewFormValues>({
    resolver: zodResolver(reviewFormSchema),
    defaultValues: {
      rating: 0,
      title: "",
      comment: ""
    }
  });

  const onSubmit = async (data: ReviewFormValues) => {
    if (!user) {
      toast({
        title: "Please sign in",
        description: "You need to be signed in to leave a review",
        variant: "destructive"
      });
      return;
    }

    try {
      setSubmitting(true);
      const response = await apiRequest(
        "POST",
        `/api/products/${productId}/reviews`,
        data
      );

      if (response.ok) {
        toast({
          title: "Review submitted",
          description: "Thank you for your feedback!",
        });
        
        // Reset the form
        form.reset();
        
        // Invalidate product reviews cache to fetch the updated list
        queryClient.invalidateQueries({ queryKey: [`/api/products/${productId}/reviews`] });
        
        // Call the onReviewSubmitted callback if provided
        if (onReviewSubmitted) {
          onReviewSubmitted();
        }
      } else {
        const errorData = await response.json();
        toast({
          title: "Failed to submit review",
          description: errorData.message || "Please try again later",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Error submitting review:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again later.",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleStarClick = (rating: number) => {
    form.setValue("rating", rating, { shouldValidate: true });
  };

  const handleStarHover = (rating: number) => {
    setHoverRating(rating);
  };

  const handleStarLeave = () => {
    setHoverRating(0);
  };

  const rating = form.watch("rating");

  if (!user) {
    return (
      <div className="bg-muted/50 p-6 rounded-lg text-center">
        <h3 className="text-lg font-semibold mb-2">Sign in to leave a review</h3>
        <p className="text-muted-foreground mb-4">Share your experience with this product</p>
        <Button variant="outline" onClick={() => window.location.href = "/auth"}>
          Sign in
        </Button>
      </div>
    );
  }

  return (
    <div className="bg-card p-6 rounded-lg border shadow-sm">
      <h3 className="text-xl font-semibold mb-4">Write a Review</h3>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="rating"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Rating</FormLabel>
                <FormControl>
                  <div className="flex space-x-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        className="text-2xl focus:outline-none"
                        onClick={() => handleStarClick(star)}
                        onMouseEnter={() => handleStarHover(star)}
                        onMouseLeave={handleStarLeave}
                      >
                        {star <= (hoverRating || field.value) ? (
                          <StarIcon className="w-8 h-8 fill-yellow-400 text-yellow-400" />
                        ) : (
                          <StarIcon className="w-8 h-8 text-gray-300" />
                        )}
                      </button>
                    ))}
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Review Title (Optional)</FormLabel>
                <FormControl>
                  <Input placeholder="Summarize your experience" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="comment"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Review</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Share details about your experience with this product"
                    className="min-h-[120px]"
                    {...field} 
                  />
                </FormControl>
                <FormDescription>
                  Your review will help other shoppers make better purchasing decisions.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <Button type="submit" disabled={submitting} className="w-full">
            {submitting ? "Submitting..." : "Submit Review"}
          </Button>
        </form>
      </Form>
    </div>
  );
}