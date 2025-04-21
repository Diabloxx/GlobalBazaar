import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Currency, currencySchema } from '@shared/schema';
import { useToast } from '@/hooks/use-toast';

interface CurrencyContextType {
  currency: Currency;
  currencies: Currency[];
  setCurrency: (currency: Currency) => void;
  convertPrice: (price: number) => number;
  isLoading: boolean;
}

const defaultCurrency: Currency = {
  code: 'USD',
  name: 'US Dollar',
  symbol: '$',
  rate: 1
};

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
};

interface CurrencyProviderProps {
  children: ReactNode;
}

export const CurrencyProvider = ({ children }: CurrencyProviderProps) => {
  const [currency, setCurrency] = useState<Currency>(defaultCurrency);
  const [currencies, setCurrencies] = useState<Currency[]>([defaultCurrency]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // Fetch available currencies from API
  useEffect(() => {
    const fetchCurrencies = async () => {
      setIsLoading(true);
      try {
        const response = await fetch('/api/currencies');
        if (!response.ok) {
          throw new Error('Failed to fetch currencies');
        }
        const data = await response.json();
        
        // Validate currency data
        const validCurrencies = data.filter((curr: any) => {
          try {
            currencySchema.parse(curr);
            return true;
          } catch (error) {
            console.error('Invalid currency data:', curr, error);
            return false;
          }
        });
        
        if (validCurrencies.length > 0) {
          setCurrencies(validCurrencies);
          
          // Try to restore previously selected currency from localStorage
          const savedCurrencyCode = localStorage.getItem('currency');
          if (savedCurrencyCode) {
            const savedCurrency = validCurrencies.find((c: Currency) => c.code === savedCurrencyCode);
            if (savedCurrency) {
              setCurrency(savedCurrency);
            }
          }
        }
      } catch (error) {
        console.error('Error fetching currencies:', error);
        toast({
          title: 'Error',
          description: 'Failed to load currency data',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchCurrencies();
  }, [toast]);

  // Save selected currency to localStorage
  useEffect(() => {
    localStorage.setItem('currency', currency.code);
  }, [currency]);

  // Convert a price from USD to the selected currency
  const convertPrice = (priceInUsd: number): number => {
    return +(priceInUsd * currency.rate).toFixed(2);
  };

  const handleSetCurrency = (newCurrency: Currency) => {
    setCurrency(newCurrency);
    toast({
      title: 'Currency updated',
      description: `Prices now displayed in ${newCurrency.code}`,
    });
  };

  const value = {
    currency,
    currencies,
    setCurrency: handleSetCurrency,
    convertPrice,
    isLoading
  };

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
};
