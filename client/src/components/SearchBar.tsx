import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { useDebounce } from '@/hooks/use-debounce';
import { Search } from 'lucide-react';
import { Product } from '@shared/schema';
import { Card } from '@/components/ui/card';

const SearchBar = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showResults, setShowResults] = useState(false);
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const searchResultsRef = useRef<HTMLDivElement>(null);
  const [, navigate] = useLocation();
  
  // Fetch search results based on debounced search term
  const { data: searchResults = [], isLoading } = useQuery({
    queryKey: ['/api/products/search', debouncedSearchTerm],
    queryFn: async () => {
      if (!debouncedSearchTerm) return [];
      const response = await fetch(`/api/products/search?q=${encodeURIComponent(debouncedSearchTerm)}`);
      if (!response.ok) throw new Error('Search failed');
      return response.json();
    },
    enabled: debouncedSearchTerm.length > 2,
  });
  
  // Close search results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchResultsRef.current && 
        !searchResultsRef.current.contains(event.target as Node)
      ) {
        setShowResults(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      setShowResults(false);
      navigate(`/search?q=${encodeURIComponent(searchTerm)}`);
    }
  };
  
  // Handle product click
  const handleProductClick = (product: Product) => {
    setShowResults(false);
    navigate(`/product/${product.slug}`);
  };
  
  return (
    <div className="relative w-full" ref={searchResultsRef}>
      <form onSubmit={handleSubmit} className="relative">
        <input 
          type="text" 
          placeholder="Search for anything..." 
          className="w-full bg-gray-100 border-2 border-gray-200 rounded-full py-2 px-4 pl-10 pr-12 focus:outline-none focus:border-primary"
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            if (e.target.value.length > 2) {
              setShowResults(true);
            } else {
              setShowResults(false);
            }
          }}
          onFocus={() => {
            if (searchTerm.length > 2) {
              setShowResults(true);
            }
          }}
        />
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
        <button 
          type="submit" 
          className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-primary text-white rounded-full p-1 w-8 h-8 flex items-center justify-center"
          aria-label="Search"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
        </button>
      </form>
      
      {/* Search Results Dropdown */}
      {showResults && searchTerm.length > 2 && (
        <Card className="absolute z-20 left-0 right-0 mt-1 max-h-96 overflow-y-auto bg-white shadow-lg rounded-md p-2">
          {isLoading ? (
            <div className="p-4 text-center text-gray-500">Searching...</div>
          ) : searchResults.length === 0 ? (
            <div className="p-4 text-center text-gray-500">No results found</div>
          ) : (
            <div>
              {searchResults.map((product: Product) => (
                <div 
                  key={product.id} 
                  className="flex items-center p-2 hover:bg-gray-100 rounded cursor-pointer"
                  onClick={() => handleProductClick(product)}
                >
                  <img 
                    src={product.imageUrl} 
                    alt={product.name} 
                    className="w-12 h-12 object-cover rounded"
                  />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-800">{product.name}</p>
                    <p className="text-xs text-gray-500">
                      ${product.salePrice || product.price}
                    </p>
                  </div>
                </div>
              ))}
              <div className="pt-2 border-t mt-2">
                <button 
                  className="w-full text-center text-primary text-sm py-1 hover:underline"
                  onClick={handleSubmit}
                >
                  See all results
                </button>
              </div>
            </div>
          )}
        </Card>
      )}
    </div>
  );
};

export default SearchBar;
