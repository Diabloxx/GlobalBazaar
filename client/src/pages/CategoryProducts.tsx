import { useState } from 'react';
import { useParams } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import ProductCard from '@/components/ProductCard';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Slider
} from "@/components/ui/slider";
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Product, Category } from '@shared/schema';
import { useCurrency } from '@/contexts/CurrencyContext';
import { Filter, SlidersHorizontal } from 'lucide-react';

const CategoryProducts = () => {
  const { slug } = useParams();
  const { convertPrice } = useCurrency();
  const [sortBy, setSortBy] = useState('recommended');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000]);
  const [showFilters, setShowFilters] = useState(false);
  const [filterOptions, setFilterOptions] = useState({
    onSale: false,
    inStock: false,
    freeShipping: false,
    newArrivals: false,
    bestSellers: false
  });

  // Fetch category details
  const { data: category, isLoading: isLoadingCategory } = useQuery({
    queryKey: [`/api/categories/${slug}`],
    enabled: !!slug,
  });

  // Fetch products in this category
  const { data: products = [], isLoading: isLoadingProducts } = useQuery({
    queryKey: [`/api/categories/${slug}/products`],
    enabled: !!slug,
  });

  // Apply filters and sorting
  const filteredProducts = products.filter((product: Product) => {
    const price = product.salePrice || product.price;
    const convertedPrice = convertPrice(price);
    
    if (convertedPrice < priceRange[0] || convertedPrice > priceRange[1]) {
      return false;
    }
    
    if (filterOptions.onSale && !product.isSale) {
      return false;
    }
    
    if (filterOptions.inStock && product.inventory <= 0) {
      return false;
    }
    
    if (filterOptions.newArrivals && !product.isNew) {
      return false;
    }
    
    if (filterOptions.bestSellers && !product.isBestSeller) {
      return false;
    }
    
    return true;
  });

  // Sort products
  const sortedProducts = [...filteredProducts].sort((a: Product, b: Product) => {
    if (sortBy === 'price-low') {
      return (a.salePrice || a.price) - (b.salePrice || b.price);
    } else if (sortBy === 'price-high') {
      return (b.salePrice || b.price) - (a.salePrice || a.price);
    } else if (sortBy === 'newest') {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    } else if (sortBy === 'rating') {
      return (b.rating || 0) - (a.rating || 0);
    }
    // Default to recommended (no specific sort)
    return 0;
  });

  // Toggle filter panel on mobile
  const toggleFilters = () => {
    setShowFilters(!showFilters);
  };

  // Handle price range change
  const handlePriceRangeChange = (value: number[]) => {
    setPriceRange([value[0], value[1]]);
  };

  // Handle filter change
  const handleFilterChange = (key: keyof typeof filterOptions) => {
    setFilterOptions({
      ...filterOptions,
      [key]: !filterOptions[key]
    });
  };

  // Handle sort change
  const handleSortChange = (value: string) => {
    setSortBy(value);
  };

  if (isLoadingCategory) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Skeleton className="h-10 w-1/3 mb-6" />
        <Skeleton className="h-6 w-2/3 mb-8" />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
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
    );
  }

  if (!category) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Category Not Found</h2>
        <p className="text-gray-600 mb-8">
          Sorry, we couldn't find the category you're looking for.
        </p>
        <a 
          href="/" 
          className="bg-primary text-white px-6 py-2 rounded-full"
        >
          Back to Home
        </a>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Category Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-3">{category.name}</h1>
        <p className="text-gray-600">{category.description}</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Filters - Desktop */}
        <div className="hidden lg:block w-64 flex-shrink-0">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="font-bold text-lg mb-4 text-gray-800">Filters</h2>
            
            {/* Price Range */}
            <div className="mb-6">
              <h3 className="font-medium text-gray-800 mb-3">Price Range</h3>
              <Slider 
                defaultValue={[0, 1000]} 
                max={1000} 
                step={10} 
                value={[priceRange[0], priceRange[1]]}
                onValueChange={handlePriceRangeChange}
                className="mb-2"
              />
              <div className="flex justify-between text-sm text-gray-600">
                <span>${priceRange[0]}</span>
                <span>${priceRange[1]}+</span>
              </div>
            </div>
            
            {/* Filter Options */}
            <div className="space-y-3">
              <h3 className="font-medium text-gray-800 mb-2">Product Status</h3>
              
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="sale" 
                  checked={filterOptions.onSale} 
                  onCheckedChange={() => handleFilterChange('onSale')}
                />
                <Label htmlFor="sale">On Sale</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="stock" 
                  checked={filterOptions.inStock}
                  onCheckedChange={() => handleFilterChange('inStock')}
                />
                <Label htmlFor="stock">In Stock</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="new" 
                  checked={filterOptions.newArrivals}
                  onCheckedChange={() => handleFilterChange('newArrivals')}
                />
                <Label htmlFor="new">New Arrivals</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="bestseller" 
                  checked={filterOptions.bestSellers}
                  onCheckedChange={() => handleFilterChange('bestSellers')}
                />
                <Label htmlFor="bestseller">Bestsellers</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="free-shipping"
                  checked={filterOptions.freeShipping}
                  onCheckedChange={() => handleFilterChange('freeShipping')}
                />
                <Label htmlFor="free-shipping">Free Shipping</Label>
              </div>
            </div>
          </div>
        </div>

        {/* Products Grid */}
        <div className="flex-1">
          {/* Mobile Filter Toggle */}
          <div className="lg:hidden mb-6 flex items-center justify-between">
            <button 
              onClick={toggleFilters}
              className="flex items-center bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-lg text-gray-700"
            >
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </button>
            
            <Select defaultValue={sortBy} onValueChange={handleSortChange}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recommended">Recommended</SelectItem>
                <SelectItem value="price-low">Price: Low to High</SelectItem>
                <SelectItem value="price-high">Price: High to Low</SelectItem>
                <SelectItem value="newest">Newest</SelectItem>
                <SelectItem value="rating">Top Rated</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* Mobile Filters Panel */}
          {showFilters && (
            <div className="lg:hidden mb-6 bg-white rounded-lg shadow-sm p-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-gray-800">Filters</h3>
                <button 
                  onClick={toggleFilters}
                  className="text-gray-500"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
              
              {/* Price Range */}
              <div className="mb-4">
                <h4 className="font-medium text-gray-800 mb-2">Price Range</h4>
                <Slider 
                  defaultValue={[0, 1000]} 
                  max={1000} 
                  step={10} 
                  value={[priceRange[0], priceRange[1]]}
                  onValueChange={handlePriceRangeChange}
                  className="mb-2"
                />
                <div className="flex justify-between text-sm text-gray-600">
                  <span>${priceRange[0]}</span>
                  <span>${priceRange[1]}+</span>
                </div>
              </div>
              
              {/* Filter Options */}
              <div className="space-y-2">
                <h4 className="font-medium text-gray-800 mb-1">Product Status</h4>
                
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="mobile-sale" 
                    checked={filterOptions.onSale}
                    onCheckedChange={() => handleFilterChange('onSale')}
                  />
                  <Label htmlFor="mobile-sale">On Sale</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="mobile-stock" 
                    checked={filterOptions.inStock}
                    onCheckedChange={() => handleFilterChange('inStock')}
                  />
                  <Label htmlFor="mobile-stock">In Stock</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="mobile-new" 
                    checked={filterOptions.newArrivals}
                    onCheckedChange={() => handleFilterChange('newArrivals')}
                  />
                  <Label htmlFor="mobile-new">New Arrivals</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="mobile-bestseller" 
                    checked={filterOptions.bestSellers}
                    onCheckedChange={() => handleFilterChange('bestSellers')}
                  />
                  <Label htmlFor="mobile-bestseller">Bestsellers</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="mobile-free-shipping"
                    checked={filterOptions.freeShipping}
                    onCheckedChange={() => handleFilterChange('freeShipping')}
                  />
                  <Label htmlFor="mobile-free-shipping">Free Shipping</Label>
                </div>
              </div>
            </div>
          )}
          
          {/* Desktop Sort Options */}
          <div className="hidden lg:flex justify-between items-center mb-6">
            <div className="flex items-center space-x-2">
              <SlidersHorizontal className="h-5 w-5 text-gray-500" />
              <span className="text-gray-700">
                {filteredProducts.length} {filteredProducts.length === 1 ? 'product' : 'products'}
              </span>
            </div>
            
            <Select defaultValue={sortBy} onValueChange={handleSortChange}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recommended">Recommended</SelectItem>
                <SelectItem value="price-low">Price: Low to High</SelectItem>
                <SelectItem value="price-high">Price: High to Low</SelectItem>
                <SelectItem value="newest">Newest</SelectItem>
                <SelectItem value="rating">Top Rated</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* Products */}
          {isLoadingProducts ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-6">
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
          ) : sortedProducts.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-6">
              {sortedProducts.map((product: Product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 bg-white rounded-lg shadow-sm">
              <div className="text-5xl mb-4">🔍</div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">No Products Found</h3>
              <p className="text-gray-600">
                Try adjusting your filters to find what you're looking for.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CategoryProducts;
