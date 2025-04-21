import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { CurrencyProvider } from "./contexts/CurrencyContext";
import { CartProvider } from "./contexts/CartContext";
import { AuthProvider } from "./contexts/AuthContext";
import { WelcomeProvider } from "./contexts/WelcomeContext";
import { TutorialProvider } from "./contexts/TutorialContext";
import { ThemeProvider } from "next-themes";

import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import ProductDetail from "@/pages/ProductDetail";
import CategoryProducts from "@/pages/CategoryProducts";
import Checkout from "@/pages/Checkout";
import Account from "@/pages/Account";
import Orders from "@/pages/Orders";
import OrderDetail from "@/pages/OrderDetail";
import Wishlist from "@/pages/Wishlist";
import AdminDashboard from "@/pages/AdminDashboard";
import SellerDashboard from "@/pages/SellerDashboard";
import BecomeSeller from "@/pages/BecomeSeller";
import CustomerService from "@/pages/CustomerService";
import About from "@/pages/About";
import AdminTest from "@/pages/AdminTest";
import SearchPage from "@/pages/SearchPage";
import SellerTutorial from "@/pages/SellerTutorial";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CartSidebar from "@/components/CartSidebar";
import { AssistantBubble } from "@/components/AssistantBubble";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/product/:slug" component={ProductDetail} />
      <Route path="/category/:slug" component={CategoryProducts} />
      <Route path="/checkout" component={Checkout} />
      <Route path="/account" component={Account} />
      <Route path="/orders" component={Orders} />
      <Route path="/orders/:id" component={OrderDetail} />
      <Route path="/wishlist" component={Wishlist} />
      <Route path="/admin" component={AdminDashboard} />
      <Route path="/seller" component={SellerDashboard} />
      <Route path="/seller/tutorial" component={SellerTutorial} />
      <Route path="/become-seller" component={BecomeSeller} />
      <Route path="/sale" component={CategoryProducts} />
      <Route path="/new-arrivals" component={CategoryProducts} />
      <Route path="/bestsellers" component={CategoryProducts} />
      <Route path="/search" component={SearchPage} />
      <Route path="/customer-service" component={CustomerService} />
      <Route path="/about" component={About} />
      <Route path="/admin-test" component={AdminTest} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="system">
        <TooltipProvider>
          <AuthProvider>
            <CurrencyProvider>
              <CartProvider>
                <WelcomeProvider>
                  <TutorialProvider>
                    <div className="flex flex-col min-h-screen">
                      <Header />
                      <main className="flex-grow">
                        <Router />
                      </main>
                      <Footer />
                      <CartSidebar />
                      <AssistantBubble />
                      <Toaster />
                    </div>
                  </TutorialProvider>
                </WelcomeProvider>
              </CartProvider>
            </CurrencyProvider>
          </AuthProvider>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
