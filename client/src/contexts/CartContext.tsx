import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { Product } from '@shared/schema';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';

interface CartItem {
  id: number;
  userId: number;
  productId: number;
  quantity: number;
  createdAt: Date;
  product: Product;
}

interface CartContextType {
  cartItems: CartItem[];
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (itemId: number) => void;
  updateCartItemQuantity: (itemId: number, quantity: number) => void;
  clearCart: () => void;
  isLoading: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

interface CartProviderProps {
  children: ReactNode;
}

export const CartProvider = ({ children }: CartProviderProps) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { isAuthenticated, user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch cart items when the user is authenticated
  useEffect(() => {
    const fetchCartItems = async () => {
      if (isAuthenticated && user) {
        setIsLoading(true);
        try {
          const response = await fetch(`/api/users/${user.id}/cart`);
          if (!response.ok) {
            throw new Error('Failed to fetch cart items');
          }
          const data = await response.json();
          setCartItems(data);
        } catch (error) {
          console.error('Error fetching cart items:', error);
          toast({
            title: 'Error',
            description: 'Failed to load your cart items',
            variant: 'destructive',
          });
        } finally {
          setIsLoading(false);
        }
      } else {
        // If not authenticated, load cart from localStorage
        try {
          const savedCart = localStorage.getItem('cart');
          if (savedCart) {
            setCartItems(JSON.parse(savedCart));
          }
        } catch (error) {
          console.error('Error loading cart from localStorage:', error);
          localStorage.removeItem('cart');
        }
      }
    };

    fetchCartItems();
  }, [isAuthenticated, user, toast]);

  // Save cart to localStorage when cart changes and user is not authenticated
  useEffect(() => {
    if (!isAuthenticated && cartItems.length > 0) {
      localStorage.setItem('cart', JSON.stringify(cartItems));
    }
  }, [cartItems, isAuthenticated]);

  const openCart = () => {
    setIsOpen(true);
    // Prevent scrolling when cart is open
    document.body.style.overflow = 'hidden';
  };

  const closeCart = () => {
    setIsOpen(false);
    // Restore scrolling when cart is closed
    document.body.style.overflow = '';
  };

  const addToCart = async (product: Product, quantity = 1) => {
    setIsLoading(true);
    
    try {
      if (isAuthenticated && user) {
        // Add to server cart if user is authenticated
        const response = await apiRequest('POST', `/api/users/${user.id}/cart`, {
          productId: product.id,
          quantity
        });
        
        const newItem = await response.json();
        
        // Check if item already exists in cart
        const existingItemIndex = cartItems.findIndex(item => item.id === newItem.id);
        
        if (existingItemIndex >= 0) {
          // Update existing item
          const updatedCartItems = [...cartItems];
          updatedCartItems[existingItemIndex] = newItem;
          setCartItems(updatedCartItems);
        } else {
          // Add new item
          setCartItems([...cartItems, newItem]);
        }
        
        // Invalidate cart queries
        queryClient.invalidateQueries({ queryKey: [`/api/users/${user.id}/cart`] });
      } else {
        // Add to local cart if user is not authenticated
        const existingItemIndex = cartItems.findIndex(item => item.productId === product.id);
        
        if (existingItemIndex >= 0) {
          // Update existing item quantity
          const updatedCartItems = [...cartItems];
          updatedCartItems[existingItemIndex].quantity += quantity;
          setCartItems(updatedCartItems);
        } else {
          // Add new item
          const newItem: CartItem = {
            id: Date.now(), // Use timestamp as temporary id
            userId: 0, // Placeholder user id
            productId: product.id,
            quantity,
            createdAt: new Date(),
            product
          };
          setCartItems([...cartItems, newItem]);
        }
      }
    } catch (error) {
      console.error('Error adding item to cart:', error);
      toast({
        title: 'Error',
        description: 'Failed to add item to cart',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const removeFromCart = async (itemId: number) => {
    setIsLoading(true);
    
    try {
      if (isAuthenticated && user) {
        // Remove from server cart
        await apiRequest('DELETE', `/api/cart/${itemId}`);
        
        // Update local state
        setCartItems(cartItems.filter(item => item.id !== itemId));
        
        // Invalidate cart queries
        queryClient.invalidateQueries({ queryKey: [`/api/users/${user.id}/cart`] });
      } else {
        // Remove from local cart
        setCartItems(cartItems.filter(item => item.id !== itemId));
      }
    } catch (error) {
      console.error('Error removing item from cart:', error);
      toast({
        title: 'Error',
        description: 'Failed to remove item from cart',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateCartItemQuantity = async (itemId: number, quantity: number) => {
    if (quantity < 1) return;
    
    setIsLoading(true);
    
    try {
      if (isAuthenticated && user) {
        // Update on server
        const response = await apiRequest('PATCH', `/api/cart/${itemId}`, { quantity });
        const updatedItem = await response.json();
        
        // Update local state
        setCartItems(
          cartItems.map(item => 
            item.id === itemId ? updatedItem : item
          )
        );
        
        // Invalidate cart queries
        queryClient.invalidateQueries({ queryKey: [`/api/users/${user.id}/cart`] });
      } else {
        // Update local cart
        setCartItems(
          cartItems.map(item => 
            item.id === itemId ? { ...item, quantity } : item
          )
        );
      }
    } catch (error) {
      console.error('Error updating cart item quantity:', error);
      toast({
        title: 'Error',
        description: 'Failed to update item quantity',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const clearCart = async () => {
    setIsLoading(true);
    
    try {
      if (isAuthenticated && user) {
        // Clear server cart
        await apiRequest('DELETE', `/api/users/${user.id}/cart`);
        
        // Update local state
        setCartItems([]);
        
        // Invalidate cart queries
        queryClient.invalidateQueries({ queryKey: [`/api/users/${user.id}/cart`] });
      } else {
        // Clear local cart
        setCartItems([]);
        localStorage.removeItem('cart');
      }
    } catch (error) {
      console.error('Error clearing cart:', error);
      toast({
        title: 'Error',
        description: 'Failed to clear cart',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const value = {
    cartItems,
    isOpen,
    openCart,
    closeCart,
    addToCart,
    removeFromCart,
    updateCartItemQuantity,
    clearCart,
    isLoading
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};
