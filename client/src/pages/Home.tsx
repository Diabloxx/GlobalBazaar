import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import { useEffect, useState } from 'react';
import { Truck, RefreshCw, Shield, Headphones } from 'lucide-react';
import { Product, Category } from '@shared/schema';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import ProductCard from '@/components/ProductCard';
import CategoryCard from '@/components/CategoryCard';
import FlashSaleCard from '@/components/FlashSaleCard';
import FeatureCard from '@/components/FeatureCard';
import { ProductCardSkeletonGrid } from '@/components/ProductCardSkeleton';

const Home = () => {
  // State for flash sale countdown
  const [countdown, setCountdown] = useState({
    hours: 23,
    minutes: 59,
    seconds: 59
  });

  // Fetch categories
  const { data: categories = [], isLoading: categoriesLoading } = useQuery({
    queryKey: ['/api/categories'],
  });

  // Fetch featured products
  const { data: featuredProducts = [], isLoading: featuredProductsLoading } = useQuery({
    queryKey: ['/api/products/featured'],
  });

  // Fetch sale products for flash sale
  const { data: saleProducts = [], isLoading: saleProductsLoading } = useQuery({
    queryKey: ['/api/products/sale'],
  });

  // Sample claimed percentages for flash sale products
  const claimedPercentages = [65, 78, 92];

  // Countdown timer for flash sale
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(prev => {
        let { hours, minutes, seconds } = prev;
        
        seconds = seconds - 1;
        
        if (seconds < 0) {
          seconds = 59;
          minutes = minutes - 1;
        }
        
        if (minutes < 0) {
          minutes = 59;
          hours = hours - 1;
        }
        
        if (hours < 0) {
          hours = 23;
        }
        
        return { hours, minutes, seconds };
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, []);

  // Get the first 3 sale products for flash sale
  const flashSaleProducts = saleProducts.slice(0, 3);

  return (
    <>
      {/* Hero Banner */}
      <section className="bg-gradient-to-r from-primary/10 to-secondary/10 dark:from-gray-800 dark:to-gray-700 py-8 md:py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center">
            <div className="md:w-1/2 mb-8 md:mb-0">
              <h1 className="font-bold text-3xl md:text-4xl lg:text-5xl text-gray-800 dark:text-white mb-4">
                Amazing Deals Every Day
              </h1>
              <p className="text-gray-600 dark:text-gray-300 text-lg mb-6">
                Shop thousands of products at unbeatable prices with free shipping on orders over $50.
              </p>
              <div className="flex flex-wrap gap-4">
                <Button 
                  asChild
                  className="bg-primary hover:bg-primary/90 text-white font-medium py-3 px-6 rounded-full"
                >
                  <Link href="/category/electronics">
                    Shop Now <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </Link>
                </Button>
                <Button 
                  asChild
                  variant="outline"
                  className="bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 hover:border-primary text-gray-700 dark:text-gray-200 hover:text-primary dark:hover:text-primary font-medium py-3 px-6 rounded-full"
                >
                  <Link href="/category/sale">
                    Daily Deals
                  </Link>
                </Button>
              </div>
            </div>
            <div className="md:w-1/2">
              <img 
                src="https://images.unsplash.com/photo-1607082350899-7e105aa886ae?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80" 
                alt="Shopping deals" 
                className="rounded-lg shadow-lg w-full h-auto object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-8 bg-white dark:bg-gray-900">
        <div className="container mx-auto px-4">
          <h2 className="font-bold text-2xl mb-6 text-center text-gray-800 dark:text-white">Shop by Category</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {categoriesLoading ? (
              Array(6).fill(0).map((_, index) => (
                <div key={index} className="flex flex-col items-center">
                  <Skeleton className="h-16 w-16 rounded-full mb-2" />
                  <Skeleton className="h-4 w-20" />
                </div>
              ))
            ) : (
              categories.map((category: Category) => (
                <CategoryCard key={category.id} category={category} />
              ))
            )}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-8 bg-gray-50 dark:bg-gray-800">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-6">
            <h2 className="font-bold text-2xl text-gray-800 dark:text-white">Featured Products</h2>
            <div className="flex space-x-2">
              <button className="p-2 rounded-full border border-gray-300 dark:border-gray-600 hover:border-primary text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-primary bg-white dark:bg-gray-700">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button className="p-2 rounded-full border border-gray-300 dark:border-gray-600 hover:border-primary text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-primary bg-white dark:bg-gray-700">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {featuredProductsLoading ? (
              <ProductCardSkeletonGrid count={10} />
            ) : (
              featuredProducts.map((product: Product) => (
                <ProductCard key={product.id} product={product} />
              ))
            )}
          </div>
          
          <div className="mt-8 text-center">
            <Link 
              href="/products" 
              className="inline-block border-2 border-primary text-primary dark:text-primary hover:bg-primary hover:text-white font-medium px-6 py-2 rounded-full transition-colors"
            >
              View All Products
            </Link>
          </div>
        </div>
      </section>
      
      {/* Flash Sale */}
      <section className="py-8 bg-white dark:bg-gray-900">
        <div className="container mx-auto px-4">
          <div className="bg-gradient-to-r from-primary to-secondary rounded-xl p-6 md:p-8">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <div className="text-white mb-6 md:mb-0">
                <h2 className="font-bold text-2xl md:text-3xl mb-2">Flash Sale</h2>
                <p className="mb-4">Incredible deals end in:</p>
                <div className="flex space-x-3">
                  <div className="bg-white/20 rounded-lg p-2 w-14 text-center">
                    <div className="text-2xl font-bold">{countdown.hours.toString().padStart(2, '0')}</div>
                    <div className="text-xs">Hours</div>
                  </div>
                  <div className="bg-white/20 rounded-lg p-2 w-14 text-center">
                    <div className="text-2xl font-bold">{countdown.minutes.toString().padStart(2, '0')}</div>
                    <div className="text-xs">Mins</div>
                  </div>
                  <div className="bg-white/20 rounded-lg p-2 w-14 text-center">
                    <div className="text-2xl font-bold">{countdown.seconds.toString().padStart(2, '0')}</div>
                    <div className="text-xs">Secs</div>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 w-full md:w-auto">
                {saleProductsLoading ? (
                  Array(3).fill(0).map((_, index) => (
                    <div key={index} className="bg-white rounded-lg shadow-sm overflow-hidden">
                      <Skeleton className="h-32 w-full" />
                      <div className="p-3">
                        <Skeleton className="h-4 w-3/4 mb-2" />
                        <Skeleton className="h-6 w-1/2" />
                      </div>
                    </div>
                  ))
                ) : (
                  flashSaleProducts.map((product: Product, index: number) => (
                    <FlashSaleCard 
                      key={product.id} 
                      product={product} 
                      claimedPercentage={claimedPercentages[index] || 50}
                    />
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-8 bg-gray-50 dark:bg-gray-800">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <FeatureCard 
              icon={<Truck className="h-5 w-5" />}
              title="Free Shipping"
              description="On orders over $50"
              bgColor="bg-primary/10"
              textColor="text-primary"
            />
            
            <FeatureCard 
              icon={<RefreshCw className="h-5 w-5" />}
              title="Easy Returns"
              description="30-day return policy"
              bgColor="bg-secondary/10"
              textColor="text-secondary"
            />
            
            <FeatureCard 
              icon={<Shield className="h-5 w-5" />}
              title="Secure Payments"
              description="Protected by PayPal"
              bgColor="bg-amber-400/10"
              textColor="text-amber-500"
            />
            
            <FeatureCard 
              icon={<Headphones className="h-5 w-5" />}
              title="24/7 Support"
              description="Dedicated help team"
              bgColor="bg-primary/10"
              textColor="text-primary"
            />
          </div>
        </div>
      </section>

      {/* App Download Banner */}
      <section className="py-8 bg-white dark:bg-gray-900">
        <div className="container mx-auto px-4">
          <div className="bg-gray-100 dark:bg-gray-800 rounded-xl overflow-hidden">
            <div className="flex flex-col md:flex-row">
              <div className="md:w-1/2 p-8 md:p-12 flex flex-col justify-center">
                <h2 className="font-bold text-2xl md:text-3xl text-gray-800 dark:text-white mb-4">
                  Download Our App
                </h2>
                <p className="text-gray-600 dark:text-gray-300 mb-6">
                  Get exclusive app-only deals and shop on the go with our mobile app. Scan the QR code to download now!
                </p>
                <div className="flex flex-wrap gap-4">
                  <a href="#" className="bg-black text-white rounded-lg px-4 py-3 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-3" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.44 11.74a4.59 4.59 0 0 0 2.67-3.83 4.66 4.66 0 0 0-2.67-4.22 13.1 13.1 0 0 0-1.06-4.7S15.28 0 13.87 0c-1.41 0-2.38 1-2.38 1a13.1 13.1 0 0 0-1.06 4.7 4.66 4.66 0 0 0-2.67 4.22 4.59 4.59 0 0 0 2.67 3.83C8.82 16.34 7.47 21.69 6.56 24c5.92-3.81 10.96-8.83 10.88-12.26z" />
                    </svg>
                    <div>
                      <div className="text-xs">Download on the</div>
                      <div className="font-medium">App Store</div>
                    </div>
                  </a>
                  <a href="#" className="bg-black text-white rounded-lg px-4 py-3 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-3" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M3 20.69a2.91 2.91 0 0 0 3.13-.94l8.84-15.31-4.88 2.82L3 20.69zm18-5.75-4.36-2.52-10.02 5.78L22 20.69l-1-5.75zm.65-1.64a.56.56 0 0 0-.26-.34L2.13 3.22a.56.56 0 0 0-.37-.09 1.16 1.16 0 0 0-.46.2c-.16.12-.37.39-.21.87l5.21 9.03 14.99 8.65c.16.09.35.13.52.13a.91.91 0 0 0 .46-.13c.24-.15.36-.44.36-.74 0-.09-.03-.21-.04-.32l-.94-5.33-.9-1.54z" />
                    </svg>
                    <div>
                      <div className="text-xs">Get it on</div>
                      <div className="font-medium">Google Play</div>
                    </div>
                  </a>
                </div>
              </div>
              <div className="md:w-1/2 bg-gradient-to-r from-primary/20 to-secondary/20 p-8 flex items-center justify-center">
                <img 
                  src="https://images.unsplash.com/photo-1611162616475-46b635cb6868?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&h=300&ixid=MnwxfDB8MXxyYW5kb218MHx8bW9iaWxlK2FwcHx8fHx8fDE3MDc4MzIyNzQ&ixlib=rb-4.0.3&q=80&w=300" 
                  alt="Mobile App" 
                  className="h-64 object-cover rounded-lg shadow-lg"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <section className="py-12 bg-gray-50 dark:bg-gray-800">
        <div className="container mx-auto px-4">
          <div className="max-w-xl mx-auto text-center">
            <h2 className="font-bold text-2xl text-gray-800 dark:text-white mb-4">
              Subscribe to Our Newsletter
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Get the latest updates on new products and upcoming sales.
            </p>
            <form className="flex flex-col sm:flex-row gap-2">
              <input 
                type="email" 
                placeholder="Your email address" 
                className="flex-grow px-4 py-3 rounded-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:placeholder-gray-400 focus:outline-none focus:border-primary"
              />
              <Button 
                type="submit" 
                className="bg-primary hover:bg-primary/90 text-white font-medium py-3 px-6 rounded-full"
              >
                Subscribe
              </Button>
            </form>
          </div>
        </div>
      </section>
    </>
  );
};

export default Home;
