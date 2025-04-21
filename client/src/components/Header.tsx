import { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { useQuery } from '@tanstack/react-query';
import { useMediaQuery } from '@/hooks/use-mobile';
import { Category } from '@shared/schema';
import { ThemeToggle } from './ThemeToggle';
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
  LogOut,
  Store,
  Shield
} from 'lucide-react';

const Header = () => {
  const isMobile = useMediaQuery('(max-width: 768px)');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [location, navigate] = useLocation();
  const { currency, setCurrency, currencies } = useCurrency();
  const { user, isAuthenticated, logout } = useAuth();
  const { cartItems, openCart } = useCart();
  
  // Get categories for navigation
  const { data: categories = [] } = useQuery<Category[]>({
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
    <header className="bg-white dark:bg-gray-900 sticky top-0 z-50 shadow-sm">
      {/* Top bar with currency and account */}
      <div className="bg-gray-100 dark:bg-gray-800 py-2">
        <div className="container mx-auto px-4 flex justify-between items-center">
          <div className="flex space-x-4 text-sm items-center">
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center space-x-1 text-gray-700 dark:text-gray-200 hover:text-primary dark:hover:text-primary">
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
            <span className="text-gray-500 dark:text-gray-400 hidden sm:inline">|</span>
            <span className="text-gray-700 dark:text-gray-300 hidden sm:inline">Free shipping on $50+ orders</span>
            <div className="flex items-center ml-1">
              <span className="text-gray-500 dark:text-gray-400 hidden sm:inline mr-2">|</span>
              <ThemeToggle />
            </div>
          </div>
          
          <div className="flex space-x-4 text-sm">
            {isAuthenticated ? (
              <>
                <Link href="/account" className="text-gray-700 dark:text-gray-200 hover:text-primary dark:hover:text-primary flex items-center">
                  <User className="h-3.5 w-3.5 mr-1" /> 
                  <span className="hidden sm:inline">Account</span>
                </Link>
                <Link href="/orders" className="text-gray-700 dark:text-gray-200 hover:text-primary dark:hover:text-primary flex items-center">
                  <Package className="h-3.5 w-3.5 mr-1" /> 
                  <span className="hidden sm:inline">Orders</span>
                </Link>
                <Link href="/wishlist" className="text-gray-700 dark:text-gray-200 hover:text-primary dark:hover:text-primary flex items-center">
                  <Heart className="h-3.5 w-3.5 mr-1" /> 
                  <span className="hidden sm:inline">Wishlist</span>
                </Link>
                <button 
                  onClick={logout} 
                  className="text-gray-700 dark:text-gray-200 hover:text-primary dark:hover:text-primary flex items-center"
                >
                  <LogOut className="h-3.5 w-3.5 mr-1" /> 
                  <span className="hidden sm:inline">Sign Out</span>
                </button>
              </>
            ) : (
              <Link href="/account" className="text-gray-700 dark:text-gray-200 hover:text-primary dark:hover:text-primary flex items-center">
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
              className="relative p-2 text-gray-700 dark:text-gray-200 hover:text-primary dark:hover:text-primary"
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
      <nav className="border-t border-gray-200 dark:border-gray-700">
        <div className="container mx-auto px-4">
          {/* Desktop Navigation */}
          <div className="hidden md:flex space-x-8 py-3">
            <Link href="/" className={location === '/' ? "text-primary font-medium" : "text-gray-700 dark:text-gray-200 font-medium hover:text-primary dark:hover:text-primary"}>
              Home
            </Link>

            {/* Categories Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center font-medium text-gray-700 dark:text-gray-200 hover:text-primary dark:hover:text-primary">
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
            
            <Link href="/sale" className={location === '/sale' ? "text-primary font-medium" : "text-gray-700 dark:text-gray-200 font-medium hover:text-primary dark:hover:text-primary"}>
              Sale
            </Link>
            
            <Link href="/new-arrivals" className={location === '/new-arrivals' ? "text-primary font-medium" : "text-gray-700 dark:text-gray-200 font-medium hover:text-primary dark:hover:text-primary"}>
              New Arrivals
            </Link>
            
            <Link href="/bestsellers" className={location === '/bestsellers' ? "text-primary font-medium" : "text-gray-700 dark:text-gray-200 font-medium hover:text-primary dark:hover:text-primary"}>
              Bestsellers
            </Link>
            
            {/* Show admin dashboard for admin users */}
            {user?.role === 'admin' && (
              <Link href="/admin" className={location === '/admin' ? "text-primary font-medium" : "text-gray-700 dark:text-gray-200 font-medium hover:text-primary dark:hover:text-primary"}>
                <div className="flex items-center">
                  <div className="bg-gray-100 dark:bg-gray-700 rounded-full p-1 mr-1">
                    <Shield className="h-4 w-4 text-primary" />
                  </div>
                  Admin Dashboard
                </div>
              </Link>
            )}
            
            {/* Show seller dashboard for sellers and admins */}
            {user?.role === 'seller' || user?.role === 'admin' ? (
              <Link href="/seller" className={location === '/seller' ? "text-primary font-medium" : "text-gray-700 dark:text-gray-200 font-medium hover:text-primary dark:hover:text-primary"}>
                <div className="flex items-center">
                  <div className="bg-gray-100 dark:bg-gray-700 rounded-full p-1 mr-1">
                    <Store className="h-4 w-4 text-primary" />
                  </div>
                  Seller Dashboard
                </div>
              </Link>
            ) : user ? (
              <Link href="/become-seller" className={location === '/become-seller' ? "text-primary font-medium" : "text-gray-700 dark:text-gray-200 font-medium hover:text-primary dark:hover:text-primary"}>
                <div className="flex items-center">
                  <div className="bg-gray-100 dark:bg-gray-700 rounded-full p-1 mr-1">
                    <Store className="h-4 w-4 text-primary" />
                  </div>
                  Become a Seller
                </div>
              </Link>
            ) : null}
          </div>
          
          {/* Mobile Navigation Toggle */}
          <div className="md:hidden py-3 flex justify-between items-center">
            <button 
              onClick={toggleMobileMenu} 
              className="text-gray-700 dark:text-gray-200"
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
        <div className="md:hidden bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
          <div className="px-4 py-2">
            <Link href="/sale" className="block py-2 text-gray-700 dark:text-gray-200 font-medium">Sale</Link>
            <Link href="/new-arrivals" className="block py-2 text-gray-700 dark:text-gray-200 font-medium">New Arrivals</Link>
            <Link href="/bestsellers" className="block py-2 text-gray-700 dark:text-gray-200 font-medium">Bestsellers</Link>
            
            {/* Admin link for mobile */}
            {user?.role === 'admin' && (
              <Link href="/admin" className="block py-2 text-gray-700 dark:text-gray-200 font-medium flex items-center">
                <div className="bg-gray-100 dark:bg-gray-700 rounded-full p-1 mr-1">
                  <Shield className="h-4 w-4 text-primary" />
                </div>
                Admin Dashboard
              </Link>
            )}
            
            {/* Seller links for mobile */}
            {user?.role === 'seller' || user?.role === 'admin' ? (
              <Link href="/seller" className="block py-2 text-gray-700 dark:text-gray-200 font-medium flex items-center">
                <div className="bg-gray-100 dark:bg-gray-700 rounded-full p-1 mr-1">
                  <Store className="h-4 w-4 text-primary" />
                </div>
                Seller Dashboard
              </Link>
            ) : user ? (
              <Link href="/become-seller" className="block py-2 text-gray-700 dark:text-gray-200 font-medium flex items-center">
                <div className="bg-gray-100 dark:bg-gray-700 rounded-full p-1 mr-1">
                  <Store className="h-4 w-4 text-primary" />
                </div>
                Become a Seller
              </Link>
            ) : null}
            
            <div className="h-px bg-gray-200 dark:bg-gray-700 my-2"></div>
            
            <div className="flex items-center py-2">
              <span className="text-gray-700 dark:text-gray-200 font-medium mr-2">Theme:</span>
              <ThemeToggle />
            </div>
            
            <div className="h-px bg-gray-200 dark:bg-gray-700 my-2"></div>
            
            {categories.map((category) => (
              <Link 
                key={category.id}
                href={`/category/${category.slug}`} 
                className="block py-2 text-gray-700 dark:text-gray-200 font-medium"
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
