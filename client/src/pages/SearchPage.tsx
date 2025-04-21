import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Product } from '@shared/schema';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  ChevronDown, 
  ChevronUp, 
  Filter, 
  Star, 
  SlidersHorizontal,
  X
} from 'lucide-react';
import ProductCard from '@/components/ProductCard';
import { Separator } from '@/components/ui/separator';
import { useCurrency } from '@/contexts/CurrencyContext';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

const SearchPage = () => {
  const [, navigate] = useLocation();
  const location = window.location;
  const searchParams = new URLSearchParams(location.search);
  
  // Get query params
  const query = searchParams.get('q') || '';
  const initialPriceRange: [number, number] = [
    parseInt(searchParams.get('minPrice') || '0'),
    parseInt(searchParams.get('maxPrice') || '1000')
  ];
  const initialCategoryIds = searchParams.get('categoryIds')?.split(',').map(Number) || [];
  const initialSortOrder = searchParams.get('sortBy') || 'relevance';
  const initialRating = parseInt(searchParams.get('minRating') || '0');
  
  // State for filters
  const [searchTerm, setSearchTerm] = useState(query);
  const [priceRange, setPriceRange] = useState<[number, number]>(initialPriceRange);
  const [selectedCategories, setSelectedCategories] = useState<number[]>(initialCategoryIds);
  const [sortOrder, setSortOrder] = useState(initialSortOrder);
  const [minRating, setMinRating] = useState(initialRating);
  const [filtersVisible, setFiltersVisible] = useState(window.innerWidth >= 768);
  const { convertPrice } = useCurrency();
  
  // Fetch categories
  const { data: categories = [] } = useQuery({
    queryKey: ['/api/categories'],
    queryFn: async () => {
      const response = await fetch('/api/categories');
      if (!response.ok) throw new Error('Failed to fetch categories');
      return response.json();
    },
  });
  
  // Fetch search results with filters
  const buildQueryString = () => {
    const params = new URLSearchParams();
    if (searchTerm) params.append('q', searchTerm);
    if (priceRange[0] > 0) params.append('minPrice', priceRange[0].toString());
    if (priceRange[1] < 1000) params.append('maxPrice', priceRange[1].toString());
    if (selectedCategories.length > 0) params.append('categoryIds', selectedCategories.join(','));
    if (sortOrder !== 'relevance') params.append('sortBy', sortOrder);
    if (minRating > 0) params.append('minRating', minRating.toString());
    return params.toString();
  };
  
  const { data: searchResults = [], isLoading } = useQuery({
    queryKey: ['/api/products/search', searchTerm, priceRange, selectedCategories, sortOrder, minRating],
    queryFn: async () => {
      const queryString = buildQueryString();
      const response = await fetch(`/api/products/search?${queryString}`);
      if (!response.ok) throw new Error('Search failed');
      return response.json();
    },
  });
  
  // Apply filters
  const applyFilters = () => {
    const queryString = buildQueryString();
    navigate(`/search?${queryString}`);
  };
  
  // Reset filters
  const resetFilters = () => {
    setSearchTerm(query);
    setPriceRange([0, 1000]);
    setSelectedCategories([]);
    setSortOrder('relevance');
    setMinRating(0);
  };
  
  // Toggle category selection
  const toggleCategory = (categoryId: number) => {
    if (selectedCategories.includes(categoryId)) {
      setSelectedCategories(selectedCategories.filter(id => id !== categoryId));
    } else {
      setSelectedCategories([...selectedCategories, categoryId]);
    }
  };
  
  // Handle window resize for responsive filter visibility
  useEffect(() => {
    const handleResize = () => {
      setFiltersVisible(window.innerWidth >= 768);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // Filter components
  const FilterSection = ({ title, children, defaultOpen = true }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);
    
    return (
      <div className="mb-6">
        <div 
          className="flex justify-between items-center mb-3 cursor-pointer" 
          onClick={() => setIsOpen(!isOpen)}
        >
          <h3 className="font-medium text-lg">{title}</h3>
          {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </div>
        {isOpen && children}
      </div>
    );
  };
  
  const FilterSidebar = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Filters</h2>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={resetFilters}
          className="text-primary hover:text-primary/90"
        >
          Reset All
        </Button>
      </div>
      
      <Separator />
      
      <FilterSection title="Price Range">
        <div className="px-2">
          <Slider
            defaultValue={priceRange}
            min={0}
            max={1000}
            step={10}
            value={priceRange}
            onValueChange={(value) => setPriceRange(value as [number, number])}
            className="my-6"
          />
          <div className="flex items-center justify-between mt-2">
            <div className="bg-muted p-2 rounded text-sm">
              {convertPrice(priceRange[0]).toFixed(2)}
            </div>
            <div className="bg-muted p-2 rounded text-sm">
              {convertPrice(priceRange[1]).toFixed(2)}
            </div>
          </div>
        </div>
      </FilterSection>
      
      <Separator />
      
      <FilterSection title="Categories">
        <ScrollArea className="h-[180px] pr-4">
          <div className="space-y-2">
            {categories.map((category: { id: number; name: string }) => (
              <div key={category.id} className="flex items-center space-x-2">
                <Checkbox 
                  id={`category-${category.id}`} 
                  checked={selectedCategories.includes(category.id)}
                  onCheckedChange={() => toggleCategory(category.id)}
                />
                <Label 
                  htmlFor={`category-${category.id}`}
                  className="text-sm cursor-pointer"
                >
                  {category.name}
                </Label>
              </div>
            ))}
          </div>
        </ScrollArea>
      </FilterSection>
      
      <Separator />
      
      <FilterSection title="Minimum Rating">
        <div className="flex items-center space-x-2">
          {[1, 2, 3, 4, 5].map((rating) => (
            <Button
              key={rating}
              variant={minRating === rating ? "default" : "outline"}
              size="sm"
              className="flex items-center space-x-1"
              onClick={() => setMinRating(minRating === rating ? 0 : rating)}
            >
              <span>{rating}</span>
              <Star className="h-3 w-3 fill-current" />
            </Button>
          ))}
        </div>
      </FilterSection>
      
      <Separator />
      
      <Button 
        onClick={applyFilters} 
        className="w-full"
      >
        Apply Filters
      </Button>
    </div>
  );
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">
          {searchTerm ? `Search results for "${searchTerm}"` : 'All Products'}
        </h1>
        
        <div className="flex items-center space-x-4 mb-6">
          <div className="relative flex-1">
            <Input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
          </div>
          <Button onClick={applyFilters}>Search</Button>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Sheet>
              <SheetTrigger asChild>
                <Button 
                  variant="outline" 
                  className="md:hidden flex items-center space-x-2"
                >
                  <Filter className="h-4 w-4" />
                  <span>Filters</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[300px] sm:w-[350px]">
                <FilterSidebar />
              </SheetContent>
            </Sheet>
            
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium">Sort by:</span>
              <Select value={sortOrder} onValueChange={setSortOrder}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="relevance">Relevance</SelectItem>
                  <SelectItem value="price_asc">Price: Low to High</SelectItem>
                  <SelectItem value="price_desc">Price: High to Low</SelectItem>
                  <SelectItem value="rating_desc">Highest Rated</SelectItem>
                  <SelectItem value="newest">Newest First</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="text-sm text-muted-foreground">
            {searchResults.length} products found
          </div>
        </div>
      </div>
      
      <div className="flex flex-col md:flex-row gap-8">
        {/* Filters Sidebar - Desktop */}
        <aside className="hidden md:block w-full md:w-64 lg:w-72 shrink-0">
          <div className="sticky top-20">
            <FilterSidebar />
          </div>
        </aside>
        
        {/* Search Results */}
        <div className="flex-1">
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...Array(8)].map((_, index) => (
                <Card key={index} className="animate-pulse">
                  <div className="h-48 bg-gray-200 rounded-t-lg"></div>
                  <CardContent className="p-4">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  </CardContent>
                  <CardFooter className="p-4 pt-0">
                    <div className="h-8 bg-gray-200 rounded w-full"></div>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : searchResults.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-7xl mb-4">🔍</div>
              <h2 className="text-2xl font-semibold mb-2">No products found</h2>
              <p className="text-muted-foreground mb-6">
                Try adjusting your search or filter criteria
              </p>
              <Button onClick={resetFilters} variant="outline">
                Reset Filters
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {searchResults.map((product: Product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SearchPage;