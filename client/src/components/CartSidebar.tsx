import { useCart } from '@/contexts/CartContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Link, useLocation } from 'wouter';
import { X, Minus, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/currency';

const CartSidebar = () => {
  const { isAuthenticated } = useAuth();
  const { currency, convertPrice } = useCurrency();
  const { 
    isOpen, 
    closeCart, 
    cartItems, 
    removeFromCart, 
    updateCartItemQuantity 
  } = useCart();
  const { toast } = useToast();
  const [, navigate] = useLocation();

  // Calculate totals
  const subtotal = cartItems.reduce(
    (total, item) => total + (item.product.salePrice || item.product.price) * item.quantity, 
    0
  );

  const shipping = subtotal >= 50 ? 0 : 5.99;
  const total = subtotal + shipping;

  // Handler for checkout button
  const handleCheckout = () => {
    if (!isAuthenticated) {
      toast({
        title: "Authentication required",
        description: "Please sign in to continue to checkout",
        variant: "destructive"
      });
      closeCart();
      navigate('/account');
      return;
    }

    if (cartItems.length === 0) {
      toast({
        title: "Empty cart",
        description: "Add items to your cart before checkout",
        variant: "destructive"
      });
      return;
    }

    closeCart();
    navigate('/checkout');
  };

  // Convert prices to selected currency
  const convertedSubtotal = convertPrice(subtotal);
  const convertedShipping = convertPrice(shipping);
  const convertedTotal = convertPrice(total);

  return (
    <div 
      className={`fixed top-0 right-0 h-full w-full sm:w-96 bg-white dark:bg-gray-900 shadow-lg z-50 transform transition-transform duration-300 ease-in-out ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      }`}
    >
      <div className="h-full flex flex-col">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h2 className="font-bold text-xl text-gray-900 dark:text-white">Your Cart ({cartItems.length})</h2>
          <button 
            onClick={closeCart} 
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            aria-label="Close cart"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <div className="flex-grow overflow-y-auto p-4">
          {cartItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400">
              <div className="text-6xl mb-4">🛒</div>
              <p>Your cart is empty</p>
              <Button 
                onClick={closeCart} 
                variant="outline" 
                className="mt-4"
              >
                Continue Shopping
              </Button>
            </div>
          ) : (
            cartItems.map((item) => (
              <div key={item.id} className="flex items-center py-4 border-b border-gray-200 dark:border-gray-700">
                <img 
                  src={item.product.imageUrl} 
                  alt={item.product.name} 
                  className="w-20 h-20 object-cover rounded"
                />
                <div className="ml-4 flex-grow">
                  <h3 className="font-medium text-gray-800 dark:text-gray-100">{item.product.name}</h3>
                  <div className="flex items-center mt-2">
                    <button 
                      onClick={() => 
                        item.quantity > 1 && 
                        updateCartItemQuantity(item.id, item.quantity - 1)
                      }
                      className="text-gray-500 hover:text-primary dark:text-gray-400 dark:hover:text-primary"
                      aria-label="Decrease quantity"
                      disabled={item.quantity <= 1}
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="mx-2 w-8 text-center dark:text-gray-300">{item.quantity}</span>
                    <button 
                      onClick={() => 
                        updateCartItemQuantity(item.id, item.quantity + 1)
                      }
                      className="text-gray-500 hover:text-primary dark:text-gray-400 dark:hover:text-primary"
                      aria-label="Increase quantity"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <div className="ml-4 text-right">
                  <p className="font-medium text-gray-800 dark:text-gray-100">
                    {formatCurrency(
                      convertPrice(
                        (item.product.salePrice || item.product.price) * item.quantity
                      ), 
                      currency
                    )}
                  </p>
                  <button 
                    onClick={() => removeFromCart(item.id)} 
                    className="text-gray-400 hover:text-red-500 dark:text-gray-500 dark:hover:text-red-400 mt-2"
                    aria-label="Remove item"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
        
        {cartItems.length > 0 && (
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex justify-between py-2">
              <span className="text-gray-600 dark:text-gray-400">Subtotal:</span>
              <span className="font-medium dark:text-gray-200">{formatCurrency(convertedSubtotal, currency)}</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-gray-600 dark:text-gray-400">Shipping:</span>
              <span className="font-medium dark:text-gray-200">
                {shipping === 0 ? 'Free' : formatCurrency(convertedShipping, currency)}
              </span>
            </div>
            <div className="flex justify-between py-2 text-lg font-bold">
              <span className="dark:text-white">Total:</span>
              <span className="dark:text-white">{formatCurrency(convertedTotal, currency)}</span>
            </div>
            <Button 
              onClick={handleCheckout}
              className="mt-4 w-full bg-primary hover:bg-primary/90 text-white py-3 rounded-full font-medium"
            >
              Checkout
            </Button>
            <div className="mt-4 flex justify-center space-x-2">
              <div className="h-8 bg-white rounded p-1">
                <img 
                  src="https://upload.wikimedia.org/wikipedia/commons/b/ba/Stripe_Logo%2C_revised_2016.svg" 
                  alt="Stripe" 
                  className="h-6"
                />
              </div>
              <div className="h-8 bg-white rounded p-1">
                <img 
                  src="https://upload.wikimedia.org/wikipedia/commons/5/5e/Visa_Inc._logo.svg" 
                  alt="Visa" 
                  className="h-6"
                />
              </div>
              <div className="h-8 bg-white rounded p-1">
                <img 
                  src="https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg" 
                  alt="Mastercard" 
                  className="h-6"
                />
              </div>
              <div className="h-8 bg-white rounded p-1">
                <img 
                  src="https://upload.wikimedia.org/wikipedia/commons/f/fa/American_Express_logo_%282018%29.svg" 
                  alt="Amex" 
                  className="h-6"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CartSidebar;
