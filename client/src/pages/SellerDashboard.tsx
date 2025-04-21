import { useEffect, useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle, 
  CardFooter
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { Product, InsertProduct } from '@shared/schema';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { 
  PackageOpen, 
  DollarSign, 
  ShoppingBag, 
  BarChart3, 
  PlusCircle, 
  FilePen,
  Trash2
} from 'lucide-react';
import { Link, useLocation } from 'wouter';
import { apiRequest, queryClient } from '@/lib/queryClient';

// Form schema for product creation/editing
const productFormSchema = z.object({
  name: z.string().min(3, {
    message: "Product name must be at least 3 characters.",
  }),
  description: z.string().min(10, {
    message: "Description must be at least 10 characters.",
  }),
  price: z.coerce.number().positive({
    message: "Price must be a positive number.",
  }),
  salePrice: z.coerce.number().positive({
    message: "Sale price must be a positive number.",
  }).optional().nullable(),
  inventory: z.coerce.number().int().nonnegative({
    message: "Inventory must be a non-negative integer.",
  }),
  categoryId: z.coerce.number().int().positive({
    message: "Please select a category.",
  }),
  imageUrl: z.string().url({
    message: "Please enter a valid URL for the image.",
  }),
  // Match property names exactly with database schema
  isNew: z.boolean().default(false),
  featured: z.boolean().default(false), // was isFeatured
  isSale: z.boolean().default(false),
  isBestSeller: z.boolean().default(false), // was isBestseller
  // Include slug field for completeness
  slug: z.string().optional(),
});

type ProductFormValues = z.infer<typeof productFormSchema>;

const SellerDashboard = () => {
  const { user, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState("products");
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const { toast } = useToast();
  
  // Check if user is a seller, if not redirect to home
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/auth');
    } else if (user && user.role !== 'seller' && user.role !== 'admin') {
      navigate('/');
    }
  }, [isAuthenticated, user, navigate]);

  // Create the form
  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      name: '',
      description: '',
      price: 0,
      salePrice: null,
      inventory: 0,
      categoryId: 1,
      imageUrl: '',
      isNew: false,
      featured: false, // was isFeatured 
      isSale: false,
      isBestSeller: false, // was isBestseller
      slug: '',
    },
  });

  // Set form values when editing a product
  useEffect(() => {
    if (editingProduct) {
      form.reset({
        name: editingProduct.name,
        description: editingProduct.description,
        price: editingProduct.price,
        salePrice: editingProduct.salePrice,
        inventory: editingProduct.inventory,
        categoryId: editingProduct.categoryId,
        imageUrl: editingProduct.imageUrl,
        isNew: editingProduct.isNew || false,
        featured: editingProduct.featured || false, // updated from isFeatured
        isSale: editingProduct.isSale || false,
        isBestSeller: editingProduct.isBestSeller || false, // updated from isBestseller
        slug: editingProduct.slug || ''
      });
      setIsAddProductOpen(true);
    }
  }, [editingProduct, form]);

  // Fetch products for seller view
  const { data: sellerProducts = [], isLoading: productsLoading, error: productsError } = useQuery({
    queryKey: ['/api/seller/products'],
    enabled: isAuthenticated && (user?.role === 'seller' || user?.role === 'admin'),
    queryFn: async ({ queryKey }) => {
      try {
        console.log("Fetching seller products with auth state:", { 
          isAuthenticated, 
          userRole: user?.role,
          userId: user?.id 
        });
        
        const response = await fetch(queryKey[0] as string, {
          credentials: 'include',
          headers: {
            'Accept': 'application/json'
          }
        });
        
        if (!response.ok) {
          console.error('Error fetching seller products:', response.status, response.statusText);
          
          // Log more details about the error
          const errorText = await response.text();
          console.error('Error response body:', errorText);
          
          // For unauthorized errors, it might be an auth issue
          if (response.status === 401) {
            console.log("Authentication issue detected. User session may have expired.");
            // Return empty array but don't throw - we'll handle this gracefully
          }
          
          return [];
        }
        
        const text = await response.text();
        if (!text.trim()) {
          console.log('Empty response received from server');
          return [];
        }
        
        try {
          const json = JSON.parse(text);
          console.log("Successfully parsed products response:", Array.isArray(json) ? `Array with ${json.length} items` : typeof json);
          return Array.isArray(json) ? json : [];
        } catch (parseError) {
          console.error('JSON parse error in products:', parseError, 'Response text:', text);
          return [];
        }
      } catch (error) {
        console.error('Fetch error in products:', error);
        return [];
      }
    }
  });

  // Fetch orders for seller view
  const { data: sellerOrders = [], isLoading: ordersLoading, error: ordersError } = useQuery({
    queryKey: ['/api/seller/orders'],
    enabled: isAuthenticated && (user?.role === 'seller' || user?.role === 'admin'),
    queryFn: async ({ queryKey }) => {
      try {
        const response = await fetch(queryKey[0] as string, {
          credentials: 'include',
        });
        
        if (!response.ok) {
          console.error('Error fetching seller orders:', response.status, response.statusText);
          return [];
        }
        
        const text = await response.text();
        try {
          const json = JSON.parse(text);
          return Array.isArray(json) ? json : [];
        } catch (parseError) {
          console.error('JSON parse error in orders:', parseError, 'Response text:', text);
          return [];
        }
      } catch (error) {
        console.error('Fetch error in orders:', error);
        return [];
      }
    }
  });

  // Fetch categories for product form
  const { data: categories = [] } = useQuery({
    queryKey: ['/api/categories'],
    select: (data) => {
      // Ensure we process the response data correctly
      return Array.isArray(data) ? data : [];
    }
  });

  // Add product mutation
  const addProductMutation = useMutation({
    mutationFn: async (data: ProductFormValues) => {
      try {
        // Log the data being sent to the server
        console.log("Submitting product data:", data);
        
        // Add missing fields that might be required by the schema
        const completeData = {
          ...data,
          // Set default slug if not provided
          slug: data.slug || data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
        };
        
        console.log("Complete product data:", completeData);
        
        const res = await apiRequest('POST', '/api/seller/products', completeData);
        console.log("Server response status:", res.status);
        
        // Get the response text
        const responseText = await res.text();
        console.log("Raw response:", responseText);
        
        // Try to parse as JSON if possible
        let jsonData;
        try {
          jsonData = JSON.parse(responseText);
        } catch (parseError) {
          console.error("JSON parse error:", parseError);
          throw new Error(`Failed to parse server response: ${responseText}`);
        }
        
        return jsonData;
      } catch (error) {
        console.error("Error adding product:", error);
        throw error;
      }
    },
    onSuccess: (data) => {
      toast({
        title: "Product added successfully",
        description: `${data.name} has been added to your product catalog.`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/seller/products'] });
      setIsAddProductOpen(false);
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to add product",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update product mutation
  const updateProductMutation = useMutation({
    mutationFn: async (data: ProductFormValues & { id: number }) => {
      try {
        // Log the data being sent to the server
        console.log("Updating product data:", data);
        
        const { id, ...rest } = data;
        
        // Add missing fields that might be required by the schema
        const completeData = {
          ...rest,
          // Set default slug if not provided
          slug: rest.slug || rest.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
        };
        
        console.log("Complete product update data:", completeData);
        
        const res = await apiRequest('PATCH', `/api/seller/products/${id}`, completeData);
        console.log("Server response status:", res.status);
        
        // Get the response text
        const responseText = await res.text();
        console.log("Raw response:", responseText);
        
        // Try to parse as JSON if possible
        let jsonData;
        try {
          jsonData = JSON.parse(responseText);
        } catch (parseError) {
          console.error("JSON parse error:", parseError);
          throw new Error(`Failed to parse server response: ${responseText}`);
        }
        
        return jsonData;
      } catch (error) {
        console.error("Error updating product:", error);
        throw error;
      }
    },
    onSuccess: (data) => {
      toast({
        title: "Product updated successfully",
        description: `${data.name} has been updated in your product catalog.`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/seller/products'] });
      setIsAddProductOpen(false);
      setEditingProduct(null);
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update product",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete product mutation
  const deleteProductMutation = useMutation({
    mutationFn: async (id: number) => {
      try {
        await apiRequest('DELETE', `/api/seller/products/${id}`);
        return id;
      } catch (error) {
        console.error("Error deleting product:", error);
        throw error;
      }
    },
    onSuccess: (id) => {
      toast({
        title: "Product deleted",
        description: "The product has been removed from your catalog.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/seller/products'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to delete product",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handle form submission
  const onSubmit = (data: ProductFormValues) => {
    if (editingProduct) {
      updateProductMutation.mutate({ ...data, id: editingProduct.id });
    } else {
      addProductMutation.mutate(data);
    }
  };

  // Reset form when dialog is closed
  const handleDialogClose = () => {
    setIsAddProductOpen(false);
    setEditingProduct(null);
    form.reset();
  };

  // Handle delete product
  const handleDeleteProduct = (id: number) => {
    if (confirm("Are you sure you want to delete this product? This action cannot be undone.")) {
      deleteProductMutation.mutate(id);
    }
  };

  // Render loading state if checking authentication
  if (!isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-screen">
          <Skeleton className="h-12 w-12 rounded-full" />
        </div>
      </div>
    );
  }

  // Sample analytics data (would be fetched from backend in production)
  const analyticsData = {
    totalRevenue: "$5,748.32",
    totalOrders: "32",
    totalProducts: sellerProducts.length,
    lowStockProducts: sellerProducts.filter((p: Product) => p.inventory < 10).length
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Seller Dashboard</h1>
          <p className="text-gray-500">Manage your products, track orders, and view your analytics</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Revenue</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <DollarSign className="h-4 w-4 text-primary mr-2" />
                <div className="text-2xl font-bold">{analyticsData.totalRevenue}</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Orders</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <ShoppingBag className="h-4 w-4 text-primary mr-2" />
                <div className="text-2xl font-bold">{analyticsData.totalOrders}</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Products</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <PackageOpen className="h-4 w-4 text-primary mr-2" />
                <div className="text-2xl font-bold">{analyticsData.totalProducts}</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Low Stock</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <BarChart3 className="h-4 w-4 text-primary mr-2" />
                <div className="text-2xl font-bold">{analyticsData.lowStockProducts}</div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid grid-cols-2 w-full md:w-auto">
            <TabsTrigger value="products">Products</TabsTrigger>
            <TabsTrigger value="orders">Orders</TabsTrigger>
          </TabsList>
          
          {/* Products Tab */}
          <TabsContent value="products">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Your Products</CardTitle>
                  <CardDescription>Manage and add new products to your store</CardDescription>
                </div>
                <Dialog open={isAddProductOpen} onOpenChange={setIsAddProductOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <PlusCircle className="mr-2 h-4 w-4" />
                      Add New Product
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>{editingProduct ? 'Edit Product' : 'Add New Product'}</DialogTitle>
                      <DialogDescription>
                        {editingProduct 
                          ? 'Make changes to your product details here.' 
                          : 'Fill in the details to add a new product to your store.'}
                      </DialogDescription>
                    </DialogHeader>
                    <Form {...form}>
                      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                          control={form.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Product Name</FormLabel>
                              <FormControl>
                                <Input placeholder="Enter product name" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="description"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Description</FormLabel>
                              <FormControl>
                                <Textarea 
                                  placeholder="Enter product description" 
                                  className="resize-none min-h-[100px]" 
                                  {...field} 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="price"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Price</FormLabel>
                                <FormControl>
                                  <Input 
                                    type="number" 
                                    placeholder="0.00" 
                                    min={0}
                                    step={0.01}
                                    {...field} 
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="salePrice"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Sale Price (Optional)</FormLabel>
                                <FormControl>
                                  <Input 
                                    type="number" 
                                    placeholder="0.00" 
                                    min={0}
                                    step={0.01}
                                    {...field}
                                    value={field.value === null ? '' : field.value}
                                    onChange={(e) => {
                                      const value = e.target.value === '' ? null : parseFloat(e.target.value);
                                      field.onChange(value);
                                    }}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="inventory"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Inventory</FormLabel>
                                <FormControl>
                                  <Input 
                                    type="number" 
                                    placeholder="0" 
                                    min={0}
                                    step={1}
                                    {...field} 
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="categoryId"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Category</FormLabel>
                                <Select 
                                  onValueChange={(value) => field.onChange(parseInt(value))}
                                  defaultValue={field.value.toString()}
                                >
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select a category" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {categories.map((category) => (
                                      <SelectItem 
                                        key={category.id} 
                                        value={category.id.toString()}
                                      >
                                        {category.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        
                        <FormField
                          control={form.control}
                          name="imageUrl"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Image URL</FormLabel>
                              <FormControl>
                                <Input placeholder="https://example.com/image.jpg" {...field} />
                              </FormControl>
                              <FormDescription>
                                Enter a URL for the product image
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="isNew"
                            render={({ field }) => (
                              <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                                <FormControl>
                                  <input
                                    type="checkbox"
                                    checked={field.value}
                                    onChange={field.onChange}
                                    className="h-4 w-4 mt-1"
                                  />
                                </FormControl>
                                <div className="space-y-1 leading-none">
                                  <FormLabel>New Arrival</FormLabel>
                                  <FormDescription>
                                    Mark this product as new
                                  </FormDescription>
                                </div>
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="featured"
                            render={({ field }) => (
                              <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                                <FormControl>
                                  <input
                                    type="checkbox"
                                    checked={field.value}
                                    onChange={field.onChange}
                                    className="h-4 w-4 mt-1"
                                  />
                                </FormControl>
                                <div className="space-y-1 leading-none">
                                  <FormLabel>Featured</FormLabel>
                                  <FormDescription>
                                    Show in featured section
                                  </FormDescription>
                                </div>
                              </FormItem>
                            )}
                          />
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="isSale"
                            render={({ field }) => (
                              <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                                <FormControl>
                                  <input
                                    type="checkbox"
                                    checked={field.value}
                                    onChange={field.onChange}
                                    className="h-4 w-4 mt-1"
                                  />
                                </FormControl>
                                <div className="space-y-1 leading-none">
                                  <FormLabel>On Sale</FormLabel>
                                  <FormDescription>
                                    Include in sale items
                                  </FormDescription>
                                </div>
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="isBestSeller"
                            render={({ field }) => (
                              <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                                <FormControl>
                                  <input
                                    type="checkbox"
                                    checked={field.value}
                                    onChange={field.onChange}
                                    className="h-4 w-4 mt-1"
                                  />
                                </FormControl>
                                <div className="space-y-1 leading-none">
                                  <FormLabel>Bestseller</FormLabel>
                                  <FormDescription>
                                    Mark as bestseller
                                  </FormDescription>
                                </div>
                              </FormItem>
                            )}
                          />
                        </div>
                        
                        <DialogFooter>
                          <Button type="button" variant="outline" onClick={handleDialogClose}>
                            Cancel
                          </Button>
                          <Button type="submit" disabled={addProductMutation.isPending || updateProductMutation.isPending}>
                            {editingProduct ? 'Update Product' : 'Add Product'}
                          </Button>
                        </DialogFooter>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                {productsLoading ? (
                  <div className="space-y-2">
                    {Array(5).fill(0).map((_, i) => (
                      <Skeleton key={i} className="w-full h-12" />
                    ))}
                  </div>
                ) : sellerProducts.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Image</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead>Sale Price</TableHead>
                        <TableHead>Inventory</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sellerProducts.map((product: Product) => (
                        <TableRow key={product.id}>
                          <TableCell>
                            <div className="w-10 h-10 rounded bg-gray-200 relative overflow-hidden">
                              {product.imageUrl && (
                                <img
                                  src={product.imageUrl}
                                  alt={product.name}
                                  className="absolute inset-0 w-full h-full object-cover"
                                />
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="font-medium">{product.name}</TableCell>
                          <TableCell>${product.price.toFixed(2)}</TableCell>
                          <TableCell>
                            {product.salePrice ? `$${product.salePrice.toFixed(2)}` : '-'}
                          </TableCell>
                          <TableCell>{product.inventory}</TableCell>
                          <TableCell>
                            {product.inventory === 0 ? (
                              <Badge variant="destructive">Out of Stock</Badge>
                            ) : product.inventory < 10 ? (
                              <Badge variant="secondary">Low Stock</Badge>
                            ) : (
                              <Badge variant="outline">In Stock</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => setEditingProduct(product)}
                              >
                                <FilePen className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="destructive" 
                                size="sm"
                                onClick={() => handleDeleteProduct(product.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-8">
                    <PackageOpen className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-lg font-medium">No products yet</h3>
                    <p className="mt-1 text-gray-500">Get started by adding your first product.</p>
                    <Button 
                      className="mt-4"
                      onClick={() => setIsAddProductOpen(true)}
                    >
                      <PlusCircle className="mr-2 h-4 w-4" />
                      Add Product
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Orders Tab */}
          <TabsContent value="orders">
            <Card>
              <CardHeader>
                <CardTitle>Recent Orders</CardTitle>
                <CardDescription>Manage and fulfill your customer orders</CardDescription>
              </CardHeader>
              <CardContent>
                {ordersLoading ? (
                  <div className="space-y-2">
                    {Array(5).fill(0).map((_, i) => (
                      <Skeleton key={i} className="w-full h-12" />
                    ))}
                  </div>
                ) : sellerOrders.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Order ID</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Items</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sellerOrders.map((order) => (
                        <TableRow key={order.id}>
                          <TableCell className="font-medium">#{order.id}</TableCell>
                          <TableCell>{new Date(order.createdAt).toLocaleDateString()}</TableCell>
                          <TableCell>{order.userId}</TableCell>
                          <TableCell>{JSON.parse(order.items).length} items</TableCell>
                          <TableCell>${order.totalPrice.toFixed(2)}</TableCell>
                          <TableCell>
                            <Badge 
                              variant={
                                order.status === 'completed' ? 'outline' : 
                                order.status === 'processing' ? 'secondary' : 
                                order.status === 'cancelled' ? 'destructive' : 
                                'outline'
                              }
                            >
                              {order.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Button variant="outline" size="sm">View Details</Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-8">
                    <ShoppingBag className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-lg font-medium">No orders yet</h3>
                    <p className="mt-1 text-gray-500">When customers place orders for your products, they'll appear here.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default SellerDashboard;