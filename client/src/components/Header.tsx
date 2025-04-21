import { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { useQuery } from '@tanstack/react-query';
import { useMediaQuery } from '@/hooks/use-mobile';
import { Badge } from '@/components/ui/badge';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import SearchBar from './SearchBar';
import { 
  ShoppingCart, 
  User, 
  Heart, 
  Package, 
  ChevronDown, 
  Menu, 
  Search,
  LogIn,
  LogOut
} from 'lucide-react';

const Header = () => {
  const isMobile = useMediaQuery('(max-width: 768px)');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [location, navigate] = useLocation();
  const { currency, setCurrency, currencies } = useCurrency();
  const { isAuthenticated, logout } = useAuth();
  const { cartItems, openCart } = useCart();
  
  // Get categories for navigation
  const { data: categories = [] } = useQuery({
    queryKey: ['/api/categories'],
  });

  // Calculate total items in cart
  const cartItemCount = cartItems.reduce((total, item) => total + item.quantity, 0);

  // Close mobile menu when navigating
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location]);

  // Toggle mobile menu
  const toggleMobileMenu = () => {
    setMobileMenuOpen(prev => !prev);
  };

  return (
    <header className="bg-white sticky top-0 z-50 shadow-sm">
      {/* Top bar with currency and account */}
      <div className="bg-gray-100 py-2">
        <div className="container mx-auto px-4 flex justify-between items-center">
          <div className="flex space-x-4 text-sm">
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center space-x-1 text-gray-700 hover:text-primary">
                <span>{currency.code}</span>
                <ChevronDown className="h-3 w-3" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                {currencies.map((curr) => (
                  <DropdownMenuItem 
                    key={curr.code} 
                    onClick={() => setCurrency(curr)}
                    className="cursor-pointer"
                  >
                    {curr.code} - {curr.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <span className="text-gray-500 hidden sm:inline">|</span>
            <span className="text-gray-700 hidden sm:inline">Free shipping on $50+ orders</span>
          </div>
          
          <div className="flex space-x-4 text-sm">
            {isAuthenticated ? (
              <>
                <Link href="/account" className="text-gray-700 hover:text-primary flex items-center">
                  <User className="h-3.5 w-3.5 mr-1" /> 
                  <span className="hidden sm:inline">Account</span>
                </Link>
                <Link href="/orders" className="text-gray-700 hover:text-primary flex items-center">
                  <Package className="h-3.5 w-3.5 mr-1" /> 
                  <span className="hidden sm:inline">Orders</span>
                </Link>
                <Link href="/wishlist" className="text-gray-700 hover:text-primary flex items-center">
                  <Heart className="h-3.5 w-3.5 mr-1" /> 
                  <span className="hidden sm:inline">Wishlist</span>
                </Link>
                <button 
                  onClick={logout} 
                  className="text-gray-700 hover:text-primary flex items-center"
                >
                  <LogOut className="h-3.5 w-3.5 mr-1" /> 
                  <span className="hidden sm:inline">Sign Out</span>
                </button>
              </>
            ) : (
              <Link href="/account" className="text-gray-700 hover:text-primary flex items-center">
                <LogIn className="h-3.5 w-3.5 mr-1" /> 
                <span>Sign In</span>
              </Link>
            )}
          </div>
        </div>
      </div>
      
      {/* Main header with logo, search, and cart */}
      <div className="container mx-auto px-4 py-4">
        <div className="flex flex-col md:flex-row items-center space-y-4 md:space-y-0">
          {/* Logo */}
          <div className="flex-shrink-0 mr-0 md:mr-8">
            <Link href="/" className="flex items-center">
              <span className="font-bold text-2xl text-primary">ShopEase</span>
            </Link>
          </div>
          
          {/* Search */}
          <div className="flex-grow max-w-3xl w-full">
            <SearchBar />
          </div>
          
          {/* Cart button */}
          <div className="ml-0 md:ml-6 flex">
            <button 
              onClick={openCart} 
              className="relative p-2 text-gray-700 hover:text-primary"
              aria-label="Open cart"
            >
              <ShoppingCart className="h-6 w-6" />
              {cartItemCount > 0 && (
                <Badge 
                  variant="destructive" 
                  className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs bg-primary"
                >
                  {cartItemCount}
                </Badge>
              )}
            </button>
          </div>
        </div>
      </div>
      
      {/* Navigation */}
      <nav className="border-t border-gray-200">
        <div className="container mx-auto px-4">
          {/* Desktop Navigation */}
          <div className="hidden md:flex space-x-8 py-3">
            <Link href="/" className={location === '/' ? "text-primary font-medium" : "text-gray-700 font-medium hover:text-primary"}>
              Home
            </Link>

            {/* Categories Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center font-medium text-gray-700 hover:text-primary">
                Categories <ChevronDown className="h-4 w-4 ml-1" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                {categories.map((category) => (
                  <DropdownMenuItem key={category.id} asChild>
                    <Link 
                      href={`/category/${category.slug}`}
                      className="w-full cursor-pointer"
                    >
                      {category.name}
                    </Link>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            
            <Link href="/sale" className={location === '/sale' ? "text-primary font-medium" : "text-gray-700 font-medium hover:text-primary"}>
              Sale
            </Link>
            
            <Link href="/new-arrivals" className={location === '/new-arrivals' ? "text-primary font-medium" : "text-gray-700 font-medium hover:text-primary"}>
              New Arrivals
            </Link>
            
            <Link href="/bestsellers" className={location === '/bestsellers' ? "text-primary font-medium" : "text-gray-700 font-medium hover:text-primary"}>
              Bestsellers
            </Link>
          </div>
          
          {/* Mobile Navigation Toggle */}
          <div className="md:hidden py-3 flex justify-between items-center">
            <button 
              onClick={toggleMobileMenu} 
              className="text-gray-700"
              aria-label="Toggle mobile menu"
            >
              <Menu className="h-6 w-6" />
            </button>
            <Link href="/" className="text-primary font-medium">Home</Link>
            <div className="w-6"></div> {/* Spacer for centering */}
          </div>
        </div>
      </nav>
      
      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-200">
          <div className="px-4 py-2">
            {categories.map((category) => (
              <Link 
                key={category.id}
                href={`/category/${category.slug}`} 
                className="block py-2 text-gray-700 font-medium"
              >
                {category.name}
              </Link>
            ))}
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
