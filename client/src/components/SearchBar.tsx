import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'wouter';
import { Search, ArrowRight } from 'lucide-react';
import { useCurrency } from '@/contexts/CurrencyContext';
import SearchSuggestions from '@/components/SearchSuggestions';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const SearchBar = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [, navigate] = useLocation();
  const { formatPrice } = useCurrency();
  
  // Close search suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchRef.current && 
        !searchRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  // Handle keyboard events for search form
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowSuggestions(false);
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);
  
  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      setShowSuggestions(false);
      navigate(`/search?q=${encodeURIComponent(searchTerm)}`);
    }
  };
  
  // Handle selecting a suggestion
  const handleSelectSuggestion = () => {
    setShowSuggestions(false);
  };
  
  return (
    <div className="relative w-full" ref={searchRef}>
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative">
          <Input
            ref={inputRef}
            type="text" 
            placeholder="Search for anything..." 
            className="w-full py-2 px-4 pl-10 pr-12 border-2 focus:border-primary"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setShowSuggestions(e.target.value.length >= 2);
            }}
            onFocus={() => {
              if (searchTerm.length >= 2) {
                setShowSuggestions(true);
              }
            }}
          />
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
          <Button 
            type="submit" 
            size="icon"
            className="absolute right-2 top-1/2 transform -translate-y-1/2 rounded-full h-7 w-7"
            aria-label="Search"
          >
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </form>
      
      {/* Live Search Suggestions */}
      <SearchSuggestions 
        query={searchTerm}
        visible={showSuggestions}
        onSelect={handleSelectSuggestion}
      />
    </div>
  );
};

export default SearchBar;
