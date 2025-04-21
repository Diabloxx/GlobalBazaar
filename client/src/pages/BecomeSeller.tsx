import { useState } from 'react';
import { useLocation } from 'wouter';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { 
  Loader2, 
  CheckCircle2, 
  Store, 
  PackageOpen, 
  TruckIcon,
  BarChart,
  DollarSign, 
  Shield
} from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';

// Form schema
const sellerFormSchema = z.object({
  businessName: z.string().min(2, { message: "Business name must be at least 2 characters" }),
  website: z.string().url({ message: "Please enter a valid URL" }).optional().or(z.literal('')),
  phone: z.string().min(5, { message: "Phone number is required" }),
  taxId: z.string().min(5, { message: "Tax ID/EIN is required" }),
  storeDescription: z.string().min(20, { message: "Please provide at least 20 characters describing your business" }),
  productCategories: z.string().min(3, { message: "Please specify the product categories you plan to sell" }),
  termsAgreed: z.literal(true, {
    errorMap: () => ({ message: "You must agree to the terms and conditions" }),
  }),
});

type SellerFormValues = z.infer<typeof sellerFormSchema>;

// Benefits array
const sellerBenefits = [
  {
    icon: <Store className="h-10 w-10 text-primary/80" />,
    title: "Your Own Storefront",
    description: "Create a personalized store with your brand identity and showcase your unique products."
  },
  {
    icon: <PackageOpen className="h-10 w-10 text-primary/80" />,
    title: "Inventory Management",
    description: "Easily track inventory, update product details, and manage stock levels in real-time."
  },
  {
    icon: <TruckIcon className="h-10 w-10 text-primary/80" />,
    title: "Order Fulfillment",
    description: "Receive instant notifications for new orders and manage shipping all from one dashboard."
  },
  {
    icon: <BarChart className="h-10 w-10 text-primary/80" />,
    title: "Sales Analytics",
    description: "Access detailed reports and insights to understand your sales performance and customer behavior."
  },
  {
    icon: <DollarSign className="h-10 w-10 text-primary/80" />,
    title: "Competitive Fees",
    description: "Benefit from our low commission structure and transparent pricing - only pay when you sell."
  },
  {
    icon: <Shield className="h-10 w-10 text-primary/80" />,
    title: "Secure Payments",
    description: "Reliable payment processing with multiple options and protection against fraud."
  }
];

const BecomeSeller = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [submissionStatus, setSubmissionStatus] = useState<'idle' | 'success' | 'error'>('idle');

  // Set up form with validation
  const form = useForm<SellerFormValues>({
    resolver: zodResolver(sellerFormSchema),
    defaultValues: {
      businessName: "",
      website: "",
      phone: "",
      taxId: "",
      storeDescription: "",
      productCategories: "",
      termsAgreed: false,
    },
  });

  // Seller application mutation
  const sellerApplicationMutation = useMutation({
    mutationFn: async (data: SellerFormValues) => {
      const res = await apiRequest('POST', '/api/seller/apply', {
        ...data,
        userId: user?.id,
      });
      return await res.json();
    },
    onSuccess: () => {
      setSubmissionStatus('success');
      toast({
        title: "Application Submitted!",
        description: "Your seller application has been received. We'll review it and get back to you soon.",
      });
      
      // Invalidate user data to reflect new seller status
      queryClient.invalidateQueries({ queryKey: ['/api/user'] });
      
      // Redirect after short delay
      setTimeout(() => {
        setLocation('/seller');
      }, 3000);
    },
    onError: (error: Error) => {
      setSubmissionStatus('error');
      toast({
        title: "Submission Failed",
        description: error.message || "There was a problem submitting your application. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Form submission handler
  const onSubmit = (data: SellerFormValues) => {
    sellerApplicationMutation.mutate(data);
  };

  // If user is not logged in, show login prompt
  if (!user) {
    return (
      <div className="container mx-auto px-4 py-12">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle>Login Required</CardTitle>
            <CardDescription>
              You need to be logged in to apply as a seller.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button onClick={() => setLocation('/auth')} className="w-full">
              Go to Login Page
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // If user is already a seller, redirect to seller dashboard
  if (user.role === 'seller' || user.role === 'admin') {
    return (
      <div className="container mx-auto px-4 py-12">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle>You're already a seller!</CardTitle>
            <CardDescription>
              You already have access to the seller dashboard.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button onClick={() => setLocation('/seller')} className="w-full">
              Go to Seller Dashboard
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // Show success message after submission
  if (submissionStatus === 'success') {
    return (
      <div className="container mx-auto px-4 py-12">
        <Card className="max-w-md mx-auto">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 bg-green-100 w-16 h-16 rounded-full flex items-center justify-center">
              <CheckCircle2 className="h-10 w-10 text-green-600" />
            </div>
            <CardTitle>Application Submitted!</CardTitle>
            <CardDescription>
              Thank you for applying to become a seller on ShopEase. We've received your application and will review it shortly.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-gray-600 mb-4">
              You should receive an email confirmation shortly. We'll review your application and typically respond within 1-2 business days.
            </p>
            <p className="text-sm text-gray-500">
              Redirecting you to the seller dashboard...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold mb-4">Become a Seller on ShopEase</h1>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Join thousands of successful businesses selling on our platform. Reach millions of customers and grow your business with our powerful seller tools.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
        <div>
          <h2 className="text-2xl font-bold mb-6">Why Sell on ShopEase?</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {sellerBenefits.map((benefit, index) => (
              <Card key={index} className="border-l-4 border-l-primary">
                <CardHeader className="pb-2">
                  <div className="mb-2">
                    {benefit.icon}
                  </div>
                  <CardTitle className="text-xl">{benefit.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">{benefit.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>Seller Application</CardTitle>
              <CardDescription>
                Fill out the form below to apply for a seller account. We'll review your application and get back to you within 1-2 business days.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="businessName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Business Name*</FormLabel>
                        <FormControl>
                          <Input placeholder="Your business name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Business Phone*</FormLabel>
                          <FormControl>
                            <Input placeholder="Business phone number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="website"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Website (Optional)</FormLabel>
                          <FormControl>
                            <Input placeholder="https://yourbusiness.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="taxId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tax ID / EIN*</FormLabel>
                        <FormControl>
                          <Input placeholder="Your business tax ID" {...field} />
                        </FormControl>
                        <FormDescription>
                          We need this for tax purposes. This will not be displayed publicly.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="storeDescription"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Store Description*</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Tell us about your business and products..." 
                            className="min-h-[120px]"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="productCategories"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Product Categories*</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Electronics, Clothing, Home Decor" {...field} />
                        </FormControl>
                        <FormDescription>
                          List the main categories of products you plan to sell.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="termsAgreed"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>
                            I agree to the <a href="#" className="text-primary hover:underline">Terms and Conditions</a> and <a href="#" className="text-primary hover:underline">Seller Policy</a>
                          </FormLabel>
                          <FormDescription>
                            By submitting this application, you agree to our seller terms and policies.
                          </FormDescription>
                          <FormMessage />
                        </div>
                      </FormItem>
                    )}
                  />

                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={sellerApplicationMutation.isPending}
                  >
                    {sellerApplicationMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Submitting Application...
                      </>
                    ) : (
                      "Submit Application"
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="bg-gray-50 p-8 rounded-lg mb-12">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold mb-2">How It Works</h2>
          <p className="text-gray-600">Our straightforward process to becoming a seller on ShopEase</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="bg-primary/10 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-xl font-bold text-primary">1</span>
            </div>
            <h3 className="font-medium mb-2">Apply</h3>
            <p className="text-gray-600 text-sm">Complete and submit the seller application form</p>
          </div>
          
          <div className="text-center">
            <div className="bg-primary/10 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-xl font-bold text-primary">2</span>
            </div>
            <h3 className="font-medium mb-2">Verification</h3>
            <p className="text-gray-600 text-sm">Our team reviews your application and verifies your business</p>
          </div>
          
          <div className="text-center">
            <div className="bg-primary/10 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-xl font-bold text-primary">3</span>
            </div>
            <h3 className="font-medium mb-2">Setup</h3>
            <p className="text-gray-600 text-sm">Set up your seller account and list your products</p>
          </div>
          
          <div className="text-center">
            <div className="bg-primary/10 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-xl font-bold text-primary">4</span>
            </div>
            <h3 className="font-medium mb-2">Start Selling</h3>
            <p className="text-gray-600 text-sm">Launch your store and start reaching customers</p>
          </div>
        </div>
      </div>

      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold mb-4">Frequently Asked Questions</h2>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Have questions about becoming a seller? Find answers to common questions below.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">What are the fees for selling?</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">
              We charge a modest 5% commission on each sale. There are no monthly fees or listing fees, so you only pay when you make a sale.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">How long does approval take?</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">
              Most applications are reviewed within 1-2 business days. Once approved, you'll receive an email with instructions to set up your seller account.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">How do I get paid?</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">
              We process payments every two weeks. Funds are transferred directly to your bank account after deducting our commission fee.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">What products can I sell?</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">
              You can sell most physical products, with some exceptions. Prohibited items include illegal goods, hazardous materials, and counterfeit products. See our full policy for details.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default BecomeSeller;