import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Product } from '@shared/schema';
import { useDebounce } from '@/hooks/use-debounce';
import { Link } from 'wouter';
import { useCurrency } from '@/contexts/CurrencyContext';
import { cn } from '@/lib/utils';

interface SearchSuggestionsProps {
  query: string;
  visible: boolean;
  onSelect: () => void;
  className?: string;
}

export default function SearchSuggestions({
  query,
  visible,
  onSelect,
  className
}: SearchSuggestionsProps) {
  const debouncedQuery = useDebounce(query, 300);
  const { formatPrice } = useCurrency();
  const [selectedIndex, setSelectedIndex] = useState(-1);

  // Reset selected index when query changes
  useEffect(() => {
    setSelectedIndex(-1);
  }, [query]);

  // Handle keyboard navigation
  useEffect(() => {
    if (!visible) return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : prev);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [visible]);

  // Fetch search suggestions
  const { data: suggestions = [], isLoading } = useQuery({
    queryKey: ['/api/products/search', debouncedQuery, 'suggestions'],
    queryFn: async () => {
      if (!debouncedQuery || debouncedQuery.length < 2) return [];
      const response = await fetch(`/api/products/search?q=${encodeURIComponent(debouncedQuery)}&limit=5`);
      if (!response.ok) throw new Error('Failed to fetch suggestions');
      return response.json();
    },
    enabled: debouncedQuery.length >= 2,
  });

  if (!visible || !debouncedQuery || suggestions.length === 0) {
    return null;
  }

  return (
    <div className={cn(
      "absolute left-0 right-0 top-full mt-1 max-h-60 overflow-auto rounded-md border bg-card p-2 shadow-md z-50",
      className
    )}>
      <div className="space-y-1">
        {suggestions.map((product: Product, index) => (
          <Link 
            key={product.id} 
            href={`/product/${product.slug}`}
            onClick={onSelect}
          >
            <div
              className={cn(
                "flex items-center space-x-3 p-2 rounded-md hover:bg-accent/50 cursor-pointer",
                selectedIndex === index && "bg-accent/50"
              )}
              onMouseEnter={() => setSelectedIndex(index)}
            >
              <div className="h-10 w-10 shrink-0 rounded-md bg-muted overflow-hidden">
                {product.imageUrl && (
                  <img 
                    src={product.imageUrl} 
                    alt={product.name} 
                    className="h-full w-full object-cover"
                  />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{product.name}</p>
                <p className="text-xs text-muted-foreground">
                  {formatPrice(product.price)}
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}