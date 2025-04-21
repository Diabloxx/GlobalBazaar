import { Link } from 'wouter';
import { Facebook, Twitter, Instagram, Linkedin } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-gray-800 text-white pt-12 pb-6 dark:bg-gray-900">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          <div>
            <h3 className="font-bold text-lg mb-4">ShopEase</h3>
            <p className="text-gray-400 mb-4">
              Your one-stop shop for amazing products at unbeatable prices. Fast shipping, easy returns, and 24/7 customer support.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-400 hover:text-white">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-white">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-white">
                <Instagram className="h-5 w-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-white">
                <Linkedin className="h-5 w-5" />
              </a>
            </div>
          </div>
          
          <div>
            <h3 className="font-medium text-lg mb-4">Shop Categories</h3>
            <ul className="space-y-2">
              <li><Link href="/category/electronics" className="text-gray-400 hover:text-white">Electronics</Link></li>
              <li><Link href="/category/fashion" className="text-gray-400 hover:text-white">Fashion</Link></li>
              <li><Link href="/category/home-garden" className="text-gray-400 hover:text-white">Home & Garden</Link></li>
              <li><Link href="/category/beauty" className="text-gray-400 hover:text-white">Beauty</Link></li>
              <li><Link href="/category/toys-games" className="text-gray-400 hover:text-white">Toys & Games</Link></li>
              <li><Link href="/category/sports" className="text-gray-400 hover:text-white">Sports</Link></li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-medium text-lg mb-4">Customer Service</h3>
            <ul className="space-y-2">
              <li><Link href="/customer-service#contact-us" className="text-gray-400 hover:text-white">Contact Us</Link></li>
              <li><Link href="/customer-service#faqs" className="text-gray-400 hover:text-white">FAQs</Link></li>
              <li><Link href="/customer-service#shipping" className="text-gray-400 hover:text-white">Shipping Policy</Link></li>
              <li><Link href="/customer-service#returns" className="text-gray-400 hover:text-white">Returns & Refunds</Link></li>
              <li><Link href="/customer-service#orders" className="text-gray-400 hover:text-white">Order Tracking</Link></li>
              <li><Link href="/customer-service#payment" className="text-gray-400 hover:text-white">Payment Methods</Link></li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-medium text-lg mb-4">About Us</h3>
            <ul className="space-y-2">
              <li><Link href="/about#about" className="text-gray-400 hover:text-white">About ShopEase</Link></li>
              <li><Link href="/about#careers" className="text-gray-400 hover:text-white">Careers</Link></li>
              <li><Link href="/about#privacy" className="text-gray-400 hover:text-white">Privacy Policy</Link></li>
              <li><Link href="/about#terms" className="text-gray-400 hover:text-white">Terms & Conditions</Link></li>
              <li><Link href="/about#affiliate" className="text-gray-400 hover:text-white">Affiliate Program</Link></li>
              <li><Link href="/about#blog" className="text-gray-400 hover:text-white">Blog</Link></li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-gray-700 dark:border-gray-800 pt-6 mt-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <p className="text-gray-400 text-sm">
                &copy; {new Date().getFullYear()} ShopEase. All rights reserved.
              </p>
            </div>
            <div className="flex items-center">
              <span className="text-gray-400 text-sm mr-4">We Accept:</span>
              <div className="flex space-x-2">
                <img 
                  src="https://upload.wikimedia.org/wikipedia/commons/b/b5/PayPal.svg" 
                  alt="PayPal" 
                  className="h-8 bg-white rounded px-2"
                />
                <img 
                  src="https://upload.wikimedia.org/wikipedia/commons/5/5e/Visa_Inc._logo.svg" 
                  alt="Visa" 
                  className="h-8 bg-white rounded px-2"
                />
                <img 
                  src="https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg" 
                  alt="Mastercard" 
                  className="h-8 bg-white rounded px-2"
                />
                <img 
                  src="https://upload.wikimedia.org/wikipedia/commons/f/fa/American_Express_logo_%282018%29.svg" 
                  alt="Amex" 
                  className="h-8 bg-white rounded px-2"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
