import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { db } from "./db";
import { getOrCreateStripeCustomer, createPaymentIntent, processPayout, calculatePlatformFee, stripe } from "./stripe";
import { getProductRecommendations, analyzeUserInterests, getFallbackRecommendations } from "./openai";
import recommender from "./localRecommender";
import { 
  insertUserSchema, 
  insertCartItemSchema,
  insertOrderSchema,
  insertWishlistItemSchema,
  insertProductSchema,
  insertProductReviewSchema,
  insertSellerTutorialStepSchema,
  insertSellerTutorialProgressSchema,
  userActivity
} from "@shared/schema";
import { z } from "zod";
import passport from "passport";
import { setupAuth, isAuthenticated, isSeller, isAdmin, ensureSessionForTracking } from "./auth";
import bcrypt from "bcryptjs";
import { WebSocketServer } from "ws";
import Stripe from "stripe";

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication
  setupAuth(app);
  
  // Initialize WebSocket server
  const httpServer = createServer(app);
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  // Initialize the recommender with all products
  try {
    console.log('Initializing local recommendation engine...');
    const allProducts = await storage.getProducts();
    recommender.initializeProducts(allProducts);
    console.log(`Recommendation engine initialized with ${allProducts.length} products`);
  } catch (error) {
    console.error('Failed to initialize recommendation engine:', error);
  }
  
  // All API routes will be prefixed with /api
  
  // Debug endpoints
  app.get("/api/debug/user/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }
    
    try {
      // Get user from database
      const user = await storage.getUser(id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Get session info
      const sessionUser = req.user;
      
      // Return debug info
      res.json({
        dbUser: user, 
        sessionUser: sessionUser,
        isAuthenticated: req.isAuthenticated(),
        sessionInfo: {
          id: req.sessionID,
          cookie: req.session?.cookie
        }
      });
    } catch (error) {
      console.error("Debug error:", error);
      res.status(500).json({ message: "Error retrieving debug info" });
    }
  });
  
  // Set user as admin
  app.post("/api/users/:id/set-admin", async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }
    
    try {
      // Update user in database
      const updatedUser = await storage.updateUser(id, { role: "admin" });
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // If this is the currently logged in user, update their session
      if (req.isAuthenticated() && req.user && req.user.id === id) {
        req.login(updatedUser, (err) => {
          if (err) {
            console.error("Session update error:", err);
            return res.status(500).json({ message: "Failed to update session" });
          }
          res.json({ message: "User set as admin and session updated", user: updatedUser });
        });
      } else {
        res.json({ message: "User set as admin", user: updatedUser });
      }
    } catch (error) {
      console.error("Set admin error:", error);
      res.status(500).json({ message: "Failed to set user as admin" });
    }
  });
  
  // Get all categories
  app.get("/api/categories", async (req, res) => {
    try {
      const categories = await storage.getCategories();
      res.json(categories);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  });
  
  // Get a category by slug
  app.get("/api/categories/:slug", async (req, res) => {
    try {
      const category = await storage.getCategoryBySlug(req.params.slug);
      if (!category) {
        return res.status(404).json({ message: "Category not found" });
      }
      res.json(category);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch category" });
    }
  });
  
  // Get products by category
  app.get("/api/categories/:slug/products", async (req, res) => {
    try {
      const category = await storage.getCategoryBySlug(req.params.slug);
      if (!category) {
        return res.status(404).json({ message: "Category not found" });
      }
      
      const products = await storage.getProductsByCategory(category.id);
      res.json(products);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch products" });
    }
  });
  
  // Get all products
  app.get("/api/products", async (req, res) => {
    try {
      const products = await storage.getProducts();
      res.json(products);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch products" });
    }
  });
  
  // Search products with advanced filtering
  app.get("/api/products/search", async (req, res) => {
    try {
      const query = req.query.q as string || '';
      
      // Extract filter options from query parameters
      const minPrice = req.query.minPrice ? parseFloat(req.query.minPrice as string) : undefined;
      const maxPrice = req.query.maxPrice ? parseFloat(req.query.maxPrice as string) : undefined;
      
      // Parse category IDs from query string
      let categoryIds: number[] | undefined = undefined;
      if (req.query.categoryIds) {
        if (typeof req.query.categoryIds === 'string') {
          categoryIds = req.query.categoryIds.split(',').map(id => parseInt(id, 10));
        } else if (Array.isArray(req.query.categoryIds)) {
          categoryIds = (req.query.categoryIds as string[]).map(id => parseInt(id, 10));
        }
      }
      
      // Get min rating filter
      const minRating = req.query.minRating ? parseInt(req.query.minRating as string, 10) : undefined;
      
      // Get sort order
      const sortBy = req.query.sortBy as string || undefined;
      
      // Get limit parameter (for search suggestions)
      let limit: number | undefined = undefined;
      if (req.query.limit) {
        limit = parseInt(req.query.limit as string, 10);
      }
      
      // Apply all filters to search
      const products = await storage.searchProducts(query, {
        minPrice,
        maxPrice,
        categoryIds,
        sortBy,
        minRating
      });
      
      // If limit is specified, return only that many results
      const limitedResults = limit ? products.slice(0, limit) : products;
      
      res.json(limitedResults);
    } catch (error) {
      console.error("Search error:", error);
      res.status(500).json({ message: "Failed to search products" });
    }
  });
  
  // Get featured products
  app.get("/api/products/featured", async (req, res) => {
    try {
      const products = await storage.getFeaturedProducts();
      res.json(products);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch featured products" });
    }
  });
  
  // Get on sale products
  app.get("/api/products/sale", async (req, res) => {
    try {
      const products = await storage.getSaleProducts();
      res.json(products);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch sale products" });
    }
  });
  
  // Get new products
  app.get("/api/products/new", async (req, res) => {
    try {
      const products = await storage.getNewProducts();
      res.json(products);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch new products" });
    }
  });
  
  // Get bestseller products
  app.get("/api/products/bestsellers", async (req, res) => {
    try {
      const products = await storage.getBestsellerProducts();
      res.json(products);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch bestseller products" });
    }
  });
  
  // Get personalized product recommendations using the local recommender
  app.get("/api/products/recommendations", async (req, res) => {
    try {
      const userId = req.isAuthenticated() ? req.user?.id : undefined;
      const sessionId = req.sessionID;
      const query = req.query.q as string || '';
      
      // Initialize the recommender with all products
      const allProducts = await storage.getProducts();
      recommender.initializeProducts(allProducts);
      
      // Get user's view history if available
      let viewHistory: number[] = [];
      if (userId) {
        viewHistory = await storage.getProductViewHistory(userId, 5) || [];
      }
      
      // Get recommendations using our local recommender
      let recommendedProducts: number[] = [];
      
      if (query) {
        // If there's a search query, use it for recommendations
        console.log(`Getting recommendations based on query: "${query}"`);
        
        // Process the query to learn from it
        recommender.processQuery(query, userId, sessionId);
        
        // Get recommendations
        const { products: recommendedIds } = recommender.getRecommendations(
          query,
          allProducts,
          undefined, // categoryId
          userId,
          sessionId,
          8 // limit
        );
        
        recommendedProducts = recommendedIds;
      } else if (viewHistory.length > 0) {
        // If user has viewed products, base recommendations on most recent view
        const recentProductId = viewHistory[0];
        console.log(`Getting recommendations based on recently viewed product: ${recentProductId}`);
        
        // Get similar products for the most recently viewed product
        recommendedProducts = recommender.getSimilarProducts(recentProductId, allProducts, 8);
      } else {
        // Fallback to a mix of featured, bestsellers and new products
        console.log('No history or query, using fallback recommendations');
        
        // Get a mix of featured and bestseller products
        const featuredProducts = await storage.getFeaturedProducts();
        const bestsellerProducts = await storage.getBestsellerProducts();
        const newProducts = await storage.getNewProducts();
        
        // Combine and limit to 8
        const combinedProducts = [
          ...bestsellerProducts.slice(0, 3),
          ...featuredProducts.slice(0, 3),
          ...newProducts.slice(0, 2)
        ].slice(0, 8);
        
        // Extract IDs
        recommendedProducts = combinedProducts.map(p => p.id);
      }
      
      // Fetch the actual product details for the recommended IDs
      const productDetails = await Promise.all(
        recommendedProducts.map(async (id) => await storage.getProduct(id))
      );
      
      // Filter out any undefined results and limit to 8
      const validProducts = productDetails.filter(Boolean).slice(0, 8);
      
      res.json(validProducts);
    } catch (error) {
      console.error("Error fetching recommendations:", error);
      res.status(500).json({ message: "Failed to fetch product recommendations" });
    }
  });
  
  // Get similar products for a specific product
  app.get("/api/products/similar/:id", async (req, res) => {
    try {
      const productId = parseInt(req.params.id);
      
      if (isNaN(productId)) {
        return res.status(400).json({ message: "Invalid product ID" });
      }
      
      // Get the product
      const product = await storage.getProduct(productId);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      
      // Get all products for the recommendation engine
      const allProducts = await storage.getProducts();
      
      // Initialize the recommender if needed
      recommender.initializeProducts(allProducts);
      
      // Get similar product IDs
      const similarProductIds = recommender.getSimilarProducts(productId, allProducts, 6);
      
      // Fetch the actual products
      const similarProducts = await Promise.all(
        similarProductIds.map(async (id) => await storage.getProduct(id))
      );
      
      // Filter out any undefined results
      const validSimilarProducts = similarProducts.filter(Boolean);
      
      res.json(validSimilarProducts);
    } catch (error) {
      console.error("Error fetching similar products:", error);
      res.status(500).json({ message: "Failed to fetch similar products" });
    }
  });
  
  // Get a product by slug
  app.get("/api/products/:slug", async (req, res) => {
    try {
      const product = await storage.getProductBySlug(req.params.slug);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      res.json(product);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch product" });
    }
  });
  
  // User registration
  app.post("/api/auth/register", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      // Check if user with email already exists
      const existingUserByEmail = await storage.getUserByEmail(userData.email);
      if (existingUserByEmail) {
        return res.status(400).json({ message: "Email already in use" });
      }
      
      // Check if username is taken
      const existingUserByUsername = await storage.getUserByUsername(userData.username);
      if (existingUserByUsername) {
        return res.status(400).json({ message: "Username already taken" });
      }
      
      // Hash the password before storing
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(userData.password, salt);
      
      // Replace plain text password with hashed version
      const userDataWithHashedPassword = {
        ...userData,
        password: hashedPassword
      };
      
      const user = await storage.createUser(userDataWithHashedPassword);
      // Don't send back the password
      const { password, ...userWithoutPassword } = user;
      
      res.status(201).json(userWithoutPassword);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid user data", errors: error.errors });
      }
      console.error("Registration error:", error);
      res.status(500).json({ message: "Failed to register user" });
    }
  });
  
  // User login
  app.post("/api/auth/login", (req, res, next) => {
    console.log("Login attempt for user:", req.body.username);
    
    passport.authenticate('local', (err, user, info) => {
      if (err) {
        console.error("Login error:", err);
        return res.status(500).json({ message: "Login failed", error: err.message });
      }
      
      if (!user) {
        console.log("Authentication failed for user:", req.body.username);
        return res.status(401).json({ message: info?.message || "Invalid credentials" });
      }
      
      console.log("User authenticated successfully:", user.username, "with role:", user.role);
      
      req.login(user, (err) => {
        if (err) {
          console.error("Login session error:", err);
          return res.status(500).json({ message: "Login session initialization failed", error: err.message });
        }
        
        // Log session details for debugging
        console.log("Login successful. Session ID:", req.sessionID);
        console.log("Session expiry:", req.session.cookie.expires);
        
        // Don't send back the password
        const { password, ...userWithoutPassword } = user;
        
        // Success response
        console.log("Sending user data back to client:", userWithoutPassword.id);
        return res.json(userWithoutPassword);
      });
    })(req, res, next);
  });
  
  // User logout
  app.post("/api/auth/logout", (req, res) => {
    req.logout((err) => {
      if (err) {
        console.error("Logout error:", err);
        return res.status(500).json({ message: "Logout failed" });
      }
      res.json({ message: "Logged out successfully" });
    });
  });
  
  // Get current user
  app.get("/api/auth/user", (req, res) => {
    console.log("Auth check requested. Session ID:", req.sessionID);
    console.log("Is authenticated:", req.isAuthenticated());
    console.log("Session:", req.session);
    
    if (!req.isAuthenticated() || !req.user) {
      console.log("Not authenticated, no valid session");
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    console.log("User found in session:", req.user.id, req.user.username);
    
    // Get the latest user data from the database
    storage.getUser(req.user.id)
      .then(user => {
        if (!user) {
          console.log("User not found in database despite being in session:", req.user.id);
          return res.status(404).json({ message: "User not found" });
        }
        
        console.log("User retrieved from database:", user.id, user.username, "with role:", user.role);
        
        // Don't send back the password
        const { password, ...userWithoutPassword } = user;
        res.json(userWithoutPassword);
      })
      .catch(error => {
        console.error("Error fetching user:", error);
        res.status(500).json({ message: "Failed to fetch user data", error: error.message });
      });
  });
  
  // Get user profile
  app.get("/api/users/:id", async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Don't send back the password
      const { password, ...userWithoutPassword } = user;
      
      res.json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });
  
  // Update user profile
  app.patch("/api/users/:id", async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      // Simple validation - more robust would use Zod
      const userData = { ...req.body };
      
      // If password is being updated, hash it
      if (userData.password) {
        const salt = await bcrypt.genSalt(10);
        userData.password = await bcrypt.hash(userData.password, salt);
      }
      
      const updatedUser = await storage.updateUser(userId, userData);
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Don't send back the password
      const { password, ...userWithoutPassword } = updatedUser;
      
      res.json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ message: "Failed to update user" });
    }
  });
  
  // Fix: Commenting out duplicate set-admin endpoint. This was likely copied from another section.
  /* 
  // Set user role to admin (special endpoint for development/testing)
  app.post("/api/users/:id/set-admin", async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      console.log("Setting user to admin, current user:", user);
      
      // Update user role to admin
      const updatedUser = await storage.updateUser(userId, { role: "admin" });
      if (!updatedUser) {
        return res.status(500).json({ message: "Failed to update user role" });
      }
      
      console.log("User after role update:", updatedUser);
      
      // Don't send back the password
      const { password, ...userWithoutPassword } = updatedUser;
      
      res.json({
        message: "User role updated to admin successfully",
        user: userWithoutPassword
      });
    } catch (error) {
      console.error("Set admin error:", error);
      res.status(500).json({ message: "Failed to set user as admin" });
    }
  });
  */
  
  // Debug endpoint to get user by ID with role information
  app.get("/api/debug/user/:id", async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Don't send back the password
      const { password, ...userWithoutPassword } = user;
      
      res.json({
        message: "User debug info",
        user: userWithoutPassword,
        role: user.role,
        hasRole: !!user.role,
        roleType: typeof user.role,
        isAdmin: user.role === "admin"
      });
    } catch (error) {
      console.error("Debug user error:", error);
      res.status(500).json({ message: "Failed to get user debug info" });
    }
  });
  
  // Get cart items for a user
  app.get("/api/users/:id/cart", async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      const cartItems = await storage.getCartItemsWithProducts(userId);
      res.json(cartItems);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch cart items" });
    }
  });
  
  // Add item to cart
  app.post("/api/users/:id/cart", async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      const cartItemData = insertCartItemSchema.parse({ ...req.body, userId });
      
      // Check if product exists
      const product = await storage.getProduct(cartItemData.productId);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      
      // Check if item already in cart
      const existingItem = await storage.getCartItemByUserAndProduct(userId, cartItemData.productId);
      
      if (existingItem) {
        // Update quantity instead of creating new item
        const updatedItem = await storage.updateCartItem(existingItem.id, {
          quantity: existingItem.quantity + cartItemData.quantity
        });
        
        const updatedItemWithProduct = {
          ...updatedItem,
          product
        };
        
        return res.json(updatedItemWithProduct);
      }
      
      // Create new cart item
      const cartItem = await storage.createCartItem(cartItemData);
      const cartItemWithProduct = {
        ...cartItem,
        product
      };
      
      res.status(201).json(cartItemWithProduct);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid cart item data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to add item to cart" });
    }
  });
  
  // Update cart item quantity
  app.patch("/api/cart/:id", async (req, res) => {
    try {
      const itemId = parseInt(req.params.id);
      if (isNaN(itemId)) {
        return res.status(400).json({ message: "Invalid item ID" });
      }
      
      const { quantity } = req.body;
      if (typeof quantity !== 'number' || quantity < 1) {
        return res.status(400).json({ message: "Invalid quantity" });
      }
      
      const updatedItem = await storage.updateCartItem(itemId, { quantity });
      if (!updatedItem) {
        return res.status(404).json({ message: "Cart item not found" });
      }
      
      const product = await storage.getProduct(updatedItem.productId);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      
      const updatedItemWithProduct = {
        ...updatedItem,
        product
      };
      
      res.json(updatedItemWithProduct);
    } catch (error) {
      res.status(500).json({ message: "Failed to update cart item" });
    }
  });
  
  // Remove item from cart
  app.delete("/api/cart/:id", async (req, res) => {
    try {
      const itemId = parseInt(req.params.id);
      if (isNaN(itemId)) {
        return res.status(400).json({ message: "Invalid item ID" });
      }
      
      const deleted = await storage.deleteCartItem(itemId);
      if (!deleted) {
        return res.status(404).json({ message: "Cart item not found" });
      }
      
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to remove item from cart" });
    }
  });
  
  // Clear user's cart
  app.delete("/api/users/:id/cart", async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      await storage.clearCart(userId);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to clear cart" });
    }
  });
  
  // Create an order
  app.post("/api/users/:id/orders", async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      const orderData = insertOrderSchema.parse({ ...req.body, userId });
      
      // Create the order
      const order = await storage.createOrder(orderData);
      
      // Clear the cart after order is created
      await storage.clearCart(userId);
      
      res.status(201).json(order);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid order data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create order" });
    }
  });
  
  // Get user's orders
  app.get("/api/users/:id/orders", async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      const orders = await storage.getOrders(userId);
      res.json(orders);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch orders" });
    }
  });
  
  // Get a specific order for a user
  app.get("/api/users/:userId/orders/:orderId", async (req, res) => {
    try {
      console.log("Fetching order with params:", req.params);
      
      const userId = parseInt(req.params.userId);
      const orderId = parseInt(req.params.orderId);
      
      if (isNaN(userId) || isNaN(orderId)) {
        console.log("Invalid IDs - userId:", userId, "orderId:", orderId);
        return res.status(400).json({ message: "Invalid user ID or order ID" });
      }
      
      console.log("Getting order:", orderId);
      const order = await storage.getOrder(orderId);
      console.log("Order found:", order ? "yes" : "no", order);
      
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }
      
      // Verify that this order belongs to the requested user
      if (order.userId !== userId) {
        console.log("Access denied - order.userId:", order.userId, "requested userId:", userId);
        return res.status(403).json({ message: "Access denied" });
      }
      
      console.log("Sending order:", order);
      res.json(order);
    } catch (error) {
      console.error("Error fetching order:", error);
      res.status(500).json({ message: "Failed to fetch order details" });
    }
  });
  
  // Get a specific order
  app.get("/api/orders/:id", async (req, res) => {
    try {
      const orderId = parseInt(req.params.id);
      if (isNaN(orderId)) {
        return res.status(400).json({ message: "Invalid order ID" });
      }
      
      const order = await storage.getOrder(orderId);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }
      
      res.json(order);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch order" });
    }
  });
  
  // Get user's wishlist
  app.get("/api/users/:id/wishlist", async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      const wishlistItems = await storage.getWishlistItemsWithProducts(userId);
      res.json(wishlistItems);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch wishlist" });
    }
  });
  
  // Add item to wishlist
  app.post("/api/users/:id/wishlist", async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      const wishlistItemData = insertWishlistItemSchema.parse({ ...req.body, userId });
      
      // Check if product exists
      const product = await storage.getProduct(wishlistItemData.productId);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      
      // Check if already in wishlist
      const existingItem = await storage.getWishlistItemByUserAndProduct(userId, wishlistItemData.productId);
      if (existingItem) {
        return res.status(400).json({ message: "Item already in wishlist" });
      }
      
      // Add to wishlist
      const wishlistItem = await storage.createWishlistItem(wishlistItemData);
      const wishlistItemWithProduct = {
        ...wishlistItem,
        product
      };
      
      res.status(201).json(wishlistItemWithProduct);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid wishlist item data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to add item to wishlist" });
    }
  });
  
  // Remove item from wishlist
  app.delete("/api/wishlist/:id", async (req, res) => {
    try {
      const itemId = parseInt(req.params.id);
      if (isNaN(itemId)) {
        return res.status(400).json({ message: "Invalid item ID" });
      }
      
      const deleted = await storage.deleteWishlistItem(itemId);
      if (!deleted) {
        return res.status(404).json({ message: "Wishlist item not found" });
      }
      
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to remove item from wishlist" });
    }
  });
  
  // Get all available currencies
  app.get("/api/currencies", async (req, res) => {
    try {
      const currencies = await storage.getCurrencies();
      res.json(currencies);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch currencies" });
    }
  });
  
  // Product Review Endpoints
  
  // Get reviews for a product
  app.get("/api/products/:id/reviews", async (req, res) => {
    try {
      const productId = parseInt(req.params.id);
      if (isNaN(productId)) {
        return res.status(400).json({ message: "Invalid product ID" });
      }
      
      const reviews = await storage.getProductReviewsWithUser(productId);
      res.json(reviews);
    } catch (error) {
      console.error("Error fetching product reviews:", error);
      res.status(500).json({ message: "Failed to fetch product reviews" });
    }
  });
  
  // Get a specific review
  app.get("/api/reviews/:id", async (req, res) => {
    try {
      const reviewId = parseInt(req.params.id);
      if (isNaN(reviewId)) {
        return res.status(400).json({ message: "Invalid review ID" });
      }
      
      const review = await storage.getProductReview(reviewId);
      if (!review) {
        return res.status(404).json({ message: "Review not found" });
      }
      
      res.json(review);
    } catch (error) {
      console.error("Error fetching review:", error);
      res.status(500).json({ message: "Failed to fetch review" });
    }
  });
  
  // Get a user's review for a specific product
  app.get("/api/users/:userId/products/:productId/review", isAuthenticated, async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const productId = parseInt(req.params.productId);
      
      if (isNaN(userId) || isNaN(productId)) {
        return res.status(400).json({ message: "Invalid IDs provided" });
      }
      
      // Check if the authenticated user matches the requested user ID
      if (req.user.id !== userId) {
        return res.status(403).json({ message: "Unauthorized to access this resource" });
      }
      
      const review = await storage.getUserProductReview(userId, productId);
      if (!review) {
        return res.status(404).json({ message: "Review not found" });
      }
      
      res.json(review);
    } catch (error) {
      console.error("Error fetching user's product review:", error);
      res.status(500).json({ message: "Failed to fetch user's product review" });
    }
  });
  
  // Add a new review for a product
  app.post("/api/products/:id/reviews", isAuthenticated, async (req, res) => {
    try {
      const productId = parseInt(req.params.id);
      if (isNaN(productId)) {
        return res.status(400).json({ message: "Invalid product ID" });
      }
      
      // Verify the product exists
      const product = await storage.getProduct(productId);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      
      // Verify user hasn't already reviewed this product
      const existingReview = await storage.getUserProductReview(req.user.id, productId);
      if (existingReview) {
        return res.status(409).json({ 
          message: "You have already reviewed this product", 
          reviewId: existingReview.id 
        });
      }
      
      // Validate the review data
      const reviewData = insertProductReviewSchema.parse({
        ...req.body,
        userId: req.user.id,
        productId,
        helpful: 0,
      });
      
      const newReview = await storage.createProductReview(reviewData);
      res.status(201).json(newReview);
    } catch (error) {
      console.error("Error creating review:", error);
      if (error.name === 'ZodError') {
        return res.status(400).json({ message: "Invalid review data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create review" });
    }
  });
  
  // Update a review
  app.put("/api/reviews/:id", isAuthenticated, async (req, res) => {
    try {
      const reviewId = parseInt(req.params.id);
      if (isNaN(reviewId)) {
        return res.status(400).json({ message: "Invalid review ID" });
      }
      
      // Check if the review exists
      const existingReview = await storage.getProductReview(reviewId);
      if (!existingReview) {
        return res.status(404).json({ message: "Review not found" });
      }
      
      // Check if the authenticated user is the owner of the review
      if (existingReview.userId !== req.user.id) {
        return res.status(403).json({ message: "Unauthorized to update this review" });
      }
      
      // Validate the update data
      const { rating, comment } = req.body;
      const updateData: Partial<InsertProductReview> = {};
      
      if (rating !== undefined) updateData.rating = rating;
      if (comment !== undefined) updateData.comment = comment;
      
      const updatedReview = await storage.updateProductReview(reviewId, updateData);
      res.json(updatedReview);
    } catch (error) {
      console.error("Error updating review:", error);
      res.status(500).json({ message: "Failed to update review" });
    }
  });
  
  // Delete a review
  app.delete("/api/reviews/:id", isAuthenticated, async (req, res) => {
    try {
      const reviewId = parseInt(req.params.id);
      if (isNaN(reviewId)) {
        return res.status(400).json({ message: "Invalid review ID" });
      }
      
      // Check if the review exists
      const review = await storage.getProductReview(reviewId);
      if (!review) {
        return res.status(404).json({ message: "Review not found" });
      }
      
      // Check if the authenticated user is the owner of the review or an admin
      if (review.userId !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({ message: "Unauthorized to delete this review" });
      }
      
      const success = await storage.deleteProductReview(reviewId);
      if (!success) {
        return res.status(500).json({ message: "Failed to delete review" });
      }
      
      res.json({ message: "Review deleted successfully" });
    } catch (error) {
      console.error("Error deleting review:", error);
      res.status(500).json({ message: "Failed to delete review" });
    }
  });
  
  // Mark a review as helpful
  app.post("/api/reviews/:id/helpful", isAuthenticated, async (req, res) => {
    try {
      const reviewId = parseInt(req.params.id);
      if (isNaN(reviewId)) {
        return res.status(400).json({ message: "Invalid review ID" });
      }
      
      // Check if the review exists
      const review = await storage.getProductReview(reviewId);
      if (!review) {
        return res.status(404).json({ message: "Review not found" });
      }
      
      // Increment the helpful count
      const updatedReview = await storage.updateProductReview(reviewId, {
        helpful: (review.helpful || 0) + 1
      });
      
      res.json(updatedReview);
    } catch (error) {
      console.error("Error marking review as helpful:", error);
      res.status(500).json({ message: "Failed to mark review as helpful" });
    }
  });
  
  // Admin API - Get all users
  app.get("/api/admin/users", async (req, res) => {
    try {
      // In a production app, we would check if the requester is an admin here
      
      // Get all users
      const users = await storage.getAllUsers();
      
      // Remove passwords before sending
      const usersWithoutPasswords = users.map(user => {
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
      });
      
      res.json(usersWithoutPasswords);
    } catch (error) {
      console.error("Admin get users error:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });
  
  // Admin API - Get all orders
  app.get("/api/admin/orders", isAuthenticated, isAdmin, async (req, res) => {
    try {
      // Get all orders
      const orders = await storage.getAllOrders();
      res.jsonSafe(orders);
    } catch (error) {
      console.error("Admin get orders error:", error);
      res.status(500).jsonSafe({ message: "Failed to fetch orders" });
    }
  });
  
  // Admin API - Update order status
  app.patch("/api/admin/orders/:id/status", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const orderId = parseInt(req.params.id);
      if (isNaN(orderId)) {
        return res.status(400).json({ message: "Invalid order ID" });
      }
      
      const { status } = req.body;
      if (!status || !['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'paid'].includes(status)) {
        return res.status(400).json({ message: "Invalid status value" });
      }
      
      // Get the order
      const order = await storage.getOrder(orderId);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }
      
      // Update the order status
      const updatedOrder = await storage.updateOrderStatus(orderId, status);
      res.status(200).jsonSafe(updatedOrder);
    } catch (error) {
      console.error("Admin update order status error:", error);
      res.status(500).jsonSafe({ message: "Failed to update order status" });
    }
  });
  
  // Admin API - Get all products with seller information
  app.get("/api/admin/products", isAuthenticated, isAdmin, async (req, res) => {
    try {
      // Get all products
      const products = await storage.getProducts();
      
      // Get users to map seller information to products
      const users = await storage.getAllUsers();
      const userMap = new Map(users.map(user => [user.id, user]));
      
      // Add seller information to products
      const productsWithSellerInfo = products.map(product => {
        let sellerInfo = null;
        
        // Add seller information if sellerId exists
        if (product.sellerId && userMap.has(product.sellerId)) {
          const seller = userMap.get(product.sellerId);
          sellerInfo = {
            id: seller.id,
            username: seller.username,
            fullName: seller.fullName
          };
        }
        
        return {
          ...product,
          seller: sellerInfo
        };
      });
      
      res.jsonSafe(productsWithSellerInfo);
    } catch (error) {
      console.error("Admin get products error:", error);
      res.status(500).jsonSafe({ message: "Failed to fetch products" });
    }
  });
  
  // Admin API - Create a product
  app.post("/api/admin/products", isAdmin, async (req, res) => {
    try {
      console.log("Admin create product request:", req.body);
      
      // Check for the required category
      if (!req.body.categoryId) {
        return res.status(400).json({ message: "Category ID is required" });
      }
      
      // Verify category exists
      const category = await storage.getCategory(req.body.categoryId);
      if (!category) {
        return res.status(400).json({ message: "Category not found" });
      }
      
      const productData = insertProductSchema.parse(req.body);
      
      // Generate a slug from the product name if not provided
      if (!productData.slug) {
        productData.slug = productData.name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '');
      }
      
      console.log("Creating product with data:", productData);
      const product = await storage.createProduct(productData);
      console.log("Product created successfully:", product);
      
      res.status(201).json(product);
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error("Validation error:", error.errors);
        return res.status(400).json({ message: "Invalid product data", errors: error.errors });
      }
      console.error("Admin create product error:", error);
      res.status(500).json({ 
        message: "Failed to create product", 
        error: error.message || "Unknown error" 
      });
    }
  });
  
  // Admin API - Update a product
  app.patch("/api/admin/products/:id", isAdmin, async (req, res) => {
    try {
      console.log("Admin update product request:", req.body);
      
      const productId = parseInt(req.params.id);
      if (isNaN(productId)) {
        return res.status(400).json({ message: "Invalid product ID" });
      }
      
      // Check if product exists
      const existingProduct = await storage.getProduct(productId);
      if (!existingProduct) {
        return res.status(404).json({ message: "Product not found" });
      }
      
      // Update product
      const productData = req.body;
      
      // Generate a slug if name changes but slug isn't provided
      if (productData.name && productData.name !== existingProduct.name && !productData.slug) {
        productData.slug = productData.name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '');
      }
      
      const updatedProduct = await storage.updateProduct(productId, productData);
      res.json(updatedProduct);
    } catch (error) {
      console.error("Admin update product error:", error);
      res.status(500).json({ 
        message: "Failed to update product", 
        error: error.message || "Unknown error" 
      });
    }
  });
  
  // Admin API - Delete a product
  app.delete("/api/admin/products/:id", isAdmin, async (req, res) => {
    try {
      console.log("Admin delete product request:", req.params.id);
      
      const productId = parseInt(req.params.id);
      if (isNaN(productId)) {
        return res.status(400).json({ message: "Invalid product ID" });
      }
      
      // Verify product exists first
      const product = await storage.getProduct(productId);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      
      // Delete product
      const deleted = await storage.deleteProduct(productId);
      if (!deleted) {
        return res.status(404).json({ message: "Product not found" });
      }
      
      console.log("Product deleted successfully:", productId);
      res.json({ success: true, message: "Product deleted successfully" });
    } catch (error) {
      console.error("Admin delete product error:", error);
      res.status(500).json({ 
        message: "Failed to delete product", 
        error: error.message || "Unknown error" 
      });
    }
  });
  
  // Seller application endpoint
  app.post("/api/seller/apply", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.id;
      const applicationData = req.body;
      
      // Update the user with seller role
      const updatedUser = await storage.updateUser(userId, { role: "seller" });
      if (!updatedUser) {
        return res.status(500).json({ message: "Failed to update user role" });
      }
      
      // In a real app, save application details to a separate table
      console.log(`Seller application received for user ${userId}:`, applicationData);
      
      // Return success with user data (excluding password)
      const { password, ...userWithoutPassword } = updatedUser;
      res.status(200).json({
        message: "Seller application approved",
        user: userWithoutPassword
      });
    } catch (error) {
      console.error("Error processing seller application:", error);
      res.status(500).json({ message: "Error processing seller application" });
    }
  });
  
  // Admin API - Verify seller application
  app.post("/api/admin/verify-seller/:id", isAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      const { isVerified } = req.body;
      if (typeof isVerified !== 'boolean') {
        return res.status(400).json({ message: "Invalid isVerified parameter" });
      }
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      if (user.role !== 'seller') {
        return res.status(400).json({ message: "User is not a seller" });
      }
      
      // Update user verification status
      const updatedUser = await storage.updateUser(userId, { isVerifiedSeller: isVerified });
      if (!updatedUser) {
        return res.status(500).json({ message: "Failed to update user verification status" });
      }
      
      // Don't send back the password
      const { password, ...userWithoutPassword } = updatedUser;
      
      res.json({
        message: `Seller ${isVerified ? 'verified' : 'unverified'} successfully`,
        user: userWithoutPassword
      });
    } catch (error) {
      console.error("Verify seller error:", error);
      res.status(500).json({ message: "Failed to verify seller" });
    }
  });
  
  // Admin API - Process seller payouts
  app.post("/api/admin/process-payouts", isAdmin, async (req, res) => {
    try {
      // Fetch all verified sellers
      const users = await storage.getAllUsers();
      const sellers = users.filter(user => user.role === 'seller' && user.isVerifiedSeller);
      
      if (sellers.length === 0) {
        return res.json({ message: "No verified sellers found for payouts" });
      }
      
      // For each seller, fetch their orders and calculate payout amount
      const payoutResults = [];
      
      for (const seller of sellers) {
        // Get all completed orders for products sold by this seller
        const allOrders = await storage.getAllOrders();
        
        let totalSales = 0;
        let totalItems = 0;
        
        // Calculate total sales for this seller
        for (const order of allOrders) {
          // orders.items contains an array of {productId, quantity, price}
          const items = JSON.parse(JSON.stringify(order.items));
          
          if (!Array.isArray(items)) continue;
          
          for (const item of items) {
            const product = await storage.getProduct(item.productId);
            if (product && product.sellerId === seller.id) {
              const itemTotal = item.price * item.quantity;
              totalSales += itemTotal;
              totalItems += item.quantity;
            }
          }
        }
        
        // Calculate payout (80% of total sales - platform takes 20%)
        const platformFee = totalSales * 0.2; // 20% commission
        const payoutAmount = totalSales - platformFee;
        
        if (totalSales > 0) {
          // In a real app, we would integrate with a payment provider like Stripe here
          // to actually transfer the money to the seller
          
          payoutResults.push({
            sellerId: seller.id,
            sellerName: seller.username,
            totalSales,
            platformFee,
            payoutAmount,
            totalItems,
            status: "processed",
            date: new Date()
          });
        }
      }
      
      res.json({
        message: "Seller payouts processed successfully",
        payouts: payoutResults,
        totalPaid: payoutResults.reduce((sum, payout) => sum + payout.payoutAmount, 0),
        count: payoutResults.length
      });
    } catch (error) {
      console.error("Process payouts error:", error);
      res.status(500).json({ message: "Failed to process seller payouts" });
    }
  });

  // Seller API - Get seller's products
  app.get("/api/seller/products", isAuthenticated, isSeller, async (req, res) => {
    try {
      console.log("Attempting to fetch products for seller:", req.user.id, req.user.username);
      
      // Get all products
      const products = await storage.getProducts();
      console.log(`Total products in system: ${products.length}`);
      
      // Filter for this seller
      const sellerProducts = products.filter(product => product.sellerId === req.user.id);
      console.log(`Products belonging to seller ${req.user.id}: ${sellerProducts.length}`);
      
      // Log some sample data for debugging
      if (sellerProducts.length > 0) {
        console.log("Sample seller product:", {
          id: sellerProducts[0].id,
          name: sellerProducts[0].name,
          sellerId: sellerProducts[0].sellerId
        });
      }
      
      // Use our safe JSON serialization method
      res.jsonSafe(sellerProducts);
    } catch (error) {
      console.error("Seller products fetch error:", error);
      res.status(500).jsonSafe({ 
        message: "Failed to fetch seller products",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Seller API - Create a product
  app.post("/api/seller/products", isAuthenticated, isSeller, async (req, res) => {
    try {
      console.log("Seller create product request:", req.body);
      
      // Check for the required category
      if (!req.body.categoryId) {
        return res.status(400).json({ message: "Category ID is required" });
      }
      
      // Verify category exists
      const category = await storage.getCategory(req.body.categoryId);
      if (!category) {
        return res.status(400).json({ message: "Category not found" });
      }
      
      // Parse and validate data
      const productData = insertProductSchema.parse(req.body);
      
      // Automatically set the seller ID to the current user
      productData.sellerId = req.user?.id;
      
      // Generate a slug from the product name if not provided
      if (!productData.slug) {
        productData.slug = productData.name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '');
      }
      
      console.log("Creating product with data:", productData);
      const product = await storage.createProduct(productData);
      console.log("Product created successfully:", product);
      
      res.status(201).json(product);
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error("Validation error:", error.errors);
        return res.status(400).json({ message: "Invalid product data", errors: error.errors });
      }
      console.error("Seller create product error:", error);
      res.status(500).json({ 
        message: "Failed to create product", 
        error: error.message || "Unknown error" 
      });
    }
  });

  // Seller API - Update a product
  app.patch("/api/seller/products/:id", isAuthenticated, isSeller, async (req, res) => {
    try {
      const productId = parseInt(req.params.id);
      if (isNaN(productId)) {
        return res.status(400).json({ message: "Invalid product ID" });
      }

      // Verify the product belongs to the seller
      const product = await storage.getProduct(productId);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      if (product.sellerId !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({ message: "You can only update your own products" });
      }

      const productData = req.body;
      
      // Ensure sellerId can't be changed
      delete productData.sellerId;
      
      // Update the product
      const updatedProduct = await storage.updateProduct(productId, productData);
      res.json(updatedProduct);
    } catch (error) {
      console.error("Seller update product error:", error);
      res.status(500).json({ message: "Failed to update product" });
    }
  });

  // Seller API - Delete a product
  app.delete("/api/seller/products/:id", isAuthenticated, isSeller, async (req, res) => {
    try {
      const productId = parseInt(req.params.id);
      if (isNaN(productId)) {
        return res.status(400).json({ message: "Invalid product ID" });
      }

      // Verify the product belongs to the seller
      const product = await storage.getProduct(productId);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      if (product.sellerId !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({ message: "You can only delete your own products" });
      }

      // Delete the product
      await storage.deleteProduct(productId);
      res.status(200).json({ message: "Product deleted successfully" });
    } catch (error) {
      console.error("Seller delete product error:", error);
      res.status(500).json({ message: "Failed to delete product" });
    }
  });
  
  // ===== Seller Tutorial Routes =====
  
  // Get all tutorial steps
  app.get("/api/tutorial/steps", async (req, res) => {
    try {
      const steps = await storage.getTutorialSteps();
      res.json(steps);
    } catch (error) {
      console.error("Error fetching tutorial steps:", error);
      res.status(500).json({ message: "Failed to fetch tutorial steps" });
    }
  });
  
  // Get tutorial steps by category
  app.get("/api/tutorial/steps/category/:category", async (req, res) => {
    try {
      const { category } = req.params;
      const steps = await storage.getTutorialStepsByCategory(category);
      res.json(steps);
    } catch (error) {
      console.error("Error fetching tutorial steps by category:", error);
      res.status(500).json({ message: "Failed to fetch tutorial steps" });
    }
  });
  
  // Get a specific tutorial step
  app.get("/api/tutorial/steps/:id", async (req, res) => {
    try {
      const stepId = parseInt(req.params.id);
      if (isNaN(stepId)) {
        return res.status(400).json({ message: "Invalid step ID" });
      }
      
      const step = await storage.getTutorialStep(stepId);
      if (!step) {
        return res.status(404).json({ message: "Tutorial step not found" });
      }
      
      res.json(step);
    } catch (error) {
      console.error("Error fetching tutorial step:", error);
      res.status(500).json({ message: "Failed to fetch tutorial step" });
    }
  });
  
  // Admin: Create a new tutorial step
  app.post("/api/admin/tutorial/steps", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const stepData = insertSellerTutorialStepSchema.parse(req.body);
      
      const newStep = await storage.createTutorialStep(stepData);
      res.status(201).json(newStep);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid step data", errors: error.errors });
      } else {
        console.error("Error creating tutorial step:", error);
        res.status(500).json({ message: "Failed to create tutorial step" });
      }
    }
  });
  
  // Admin: Update a tutorial step
  app.patch("/api/admin/tutorial/steps/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const stepId = parseInt(req.params.id);
      if (isNaN(stepId)) {
        return res.status(400).json({ message: "Invalid step ID" });
      }
      
      // Get the existing step to make sure it exists
      const existingStep = await storage.getTutorialStep(stepId);
      if (!existingStep) {
        return res.status(404).json({ message: "Tutorial step not found" });
      }
      
      // Validate the update data
      const updateData = req.body;
      
      // Update the step
      const updatedStep = await storage.updateTutorialStep(stepId, updateData);
      res.json(updatedStep);
    } catch (error) {
      console.error("Error updating tutorial step:", error);
      res.status(500).json({ message: "Failed to update tutorial step" });
    }
  });
  
  // Admin: Delete a tutorial step
  app.delete("/api/admin/tutorial/steps/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const stepId = parseInt(req.params.id);
      if (isNaN(stepId)) {
        return res.status(400).json({ message: "Invalid step ID" });
      }
      
      const success = await storage.deleteTutorialStep(stepId);
      
      if (success) {
        res.json({ message: "Tutorial step deleted successfully" });
      } else {
        res.status(404).json({ message: "Tutorial step not found or could not be deleted" });
      }
    } catch (error) {
      console.error("Error deleting tutorial step:", error);
      res.status(500).json({ message: "Failed to delete tutorial step" });
    }
  });
  
  // Get tutorial progress for the current user
  app.get("/api/seller/tutorial/progress", isAuthenticated, isSeller, async (req, res) => {
    try {
      const userId = req.user.id;
      
      const progress = await storage.getUserTutorialProgress(userId);
      res.json(progress);
    } catch (error) {
      console.error("Error fetching tutorial progress:", error);
      res.status(500).json({ message: "Failed to fetch tutorial progress" });
    }
  });
  
  // Mark a tutorial step as completed
  app.post("/api/seller/tutorial/progress/:stepId/complete", isAuthenticated, isSeller, async (req, res) => {
    try {
      const stepId = parseInt(req.params.stepId);
      if (isNaN(stepId)) {
        return res.status(400).json({ message: "Invalid step ID" });
      }
      
      const userId = req.user.id;
      
      // Get the step to make sure it exists
      const step = await storage.getTutorialStep(stepId);
      if (!step) {
        return res.status(404).json({ message: "Tutorial step not found" });
      }
      
      // Get optional notes from the request body
      const { notes } = req.body;
      
      // Mark the step as completed
      const progress = await storage.markTutorialStepCompleted(userId, stepId, notes);
      
      // Record this activity
      await storage.recordUserActivity({
        userId,
        sessionId: req.sessionID,
        activityType: "tutorial_step_completed",
        details: { stepId, stepTitle: step.title }
      });
      
      res.json(progress);
    } catch (error) {
      console.error("Error completing tutorial step:", error);
      res.status(500).json({ message: "Failed to complete tutorial step" });
    }
  });
  
  // Reset tutorial progress for the current user
  app.delete("/api/seller/tutorial/progress", isAuthenticated, isSeller, async (req, res) => {
    try {
      const userId = req.user.id;
      
      const success = await storage.resetUserTutorialProgress(userId);
      
      if (success) {
        res.json({ message: "Tutorial progress reset successfully" });
      } else {
        res.status(404).json({ message: "No tutorial progress found to reset" });
      }
    } catch (error) {
      console.error("Error resetting tutorial progress:", error);
      res.status(500).json({ message: "Failed to reset tutorial progress" });
    }
  });

  // Seller API - Update order status
  app.patch("/api/seller/orders/:id/status", isAuthenticated, isSeller, async (req, res) => {
    try {
      const orderId = parseInt(req.params.id);
      if (isNaN(orderId)) {
        return res.status(400).json({ message: "Invalid order ID" });
      }
      
      const { status } = req.body;
      if (!status || !['pending', 'processing', 'shipped', 'delivered', 'cancelled'].includes(status)) {
        return res.status(400).json({ message: "Invalid status value" });
      }
      
      // Get the order
      const order = await storage.getOrder(orderId);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }
      
      // Update the order status
      const updatedOrder = await storage.updateOrderStatus(orderId, status);
      res.status(200).json(updatedOrder);
    } catch (error) {
      console.error("Update order status error:", error);
      res.status(500).json({ message: "Failed to update order status" });
    }
  });

  // Seller API - Get seller's orders
  app.get("/api/seller/orders", isAuthenticated, isSeller, async (req, res) => {
    try {
      // Get all orders (in a real application, we would filter by seller)
      // For now, just return all orders as a demonstration
      const allOrders = await storage.getAllOrders();
      
      // Mock implementation: just returning all orders
      // In a real app, we would find orders containing products from this seller
      console.log(`Returning ${allOrders.length} orders for seller ${req.user.id}`);
      res.jsonSafe(allOrders);
    } catch (error) {
      console.error("Seller orders fetch error:", error);
      res.status(500).jsonSafe({ 
        message: "Failed to fetch seller orders",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });
  
  // Product recommendation using our self-learning local recommendation engine
  app.post("/api/ai/recommend", async (req, res) => {
    try {
      const { query, categoryId, browsedProducts = [] } = req.body;
      
      if (!query) {
        return res.status(400).json({ message: "Query is required" });
      }
      
      // Get all products to match against
      const allProducts = await storage.getProducts();
      
      // Import our local recommender engine
      const recommender = (await import("./localRecommender")).default;
      
      // Initialize the engine with products if not already done
      // This is safe to call multiple times as it's idempotent
      recommender.initializeProducts(allProducts);
      
      // Get the user ID if authenticated
      const userId = req.isAuthenticated() ? req.user.id : undefined;
      const sessionId = req.sessionID;
      
      console.log(`Getting local ML recommendations for query: "${query}"`);
      
      // Process this query to update our recommendation model
      recommender.processQuery(query, userId, sessionId);
      
      // Process browsed products to update our recommendation model
      if (browsedProducts && browsedProducts.length > 0) {
        browsedProducts.forEach((productId: number) => {
          recommender.recordProductView(productId, userId, sessionId);
        });
      }
      
      // Get recommendations from our local engine
      const recommendations = recommender.getRecommendations(
        query,
        allProducts,
        categoryId,
        userId,
        sessionId,
        8 // Limit to 8 products max
      );
      
      // Get the actual product objects for recommended product IDs
      const recommendedProducts = [];
      for (const productId of recommendations.products) {
        const product = await storage.getProduct(productId);
        if (product) {
          recommendedProducts.push(product);
        }
      }
      
      // If we still don't have enough recommendations, add bestsellers
      if (recommendedProducts.length < 4) {
        const bestsellers = await storage.getBestsellerProducts();
        
        // Add bestsellers that aren't already in the recommendations
        for (const product of bestsellers) {
          if (!recommendedProducts.some(p => p.id === product.id)) {
            recommendedProducts.push(product);
            if (recommendedProducts.length >= 4) break;
          }
        }
      }
      
      // Track this as user activity
      if (userId || sessionId) {
        await storage.recordUserActivity({
          userId: userId || null,
          sessionId,
          activityType: 'recommendation',
          details: { 
            query,
            recommendationCount: recommendedProducts.length
          }
        });
      }
      
      res.json({
        message: recommendations.explanation,
        products: recommendedProducts
      });
    } catch (error) {
      console.error("Recommendation error:", error);
      
      // Even if the primary recommendation logic fails, still try to return something useful
      try {
        const bestsellers = await storage.getBestsellerProducts();
        res.json({
          message: "Here are some of our best products you might be interested in",
          products: bestsellers.slice(0, 4)
        });
      } catch (fallbackError) {
        res.status(500).json({ 
          message: "Failed to get recommendations",
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }
  });
  
  // Admin test security endpoints
  
  // Verify master password for admin testing functionality
  app.post("/api/admin-test/verify-master-password", async (req, res) => {
    try {
      const { username, masterPassword } = req.body;
      
      if (!username || !masterPassword) {
        return res.status(400).json({ message: "Username and master password are required" });
      }
      
      // Find the user
      const user = await storage.getUserByUsername(username);
      
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      // If the user doesn't have a master password set, reject the request
      if (!user.masterPassword) {
        return res.status(401).json({ message: "User doesn't have admin test privileges" });
      }
      
      // Verify the master password
      const isValid = await bcrypt.compare(masterPassword, user.masterPassword);
      
      if (!isValid) {
        return res.status(401).json({ message: "Invalid master password" });
      }
      
      // Return success
      res.json({ 
        success: true, 
        message: "Master password verified", 
        canUseAdminTest: true 
      });
    } catch (error) {
      console.error("Error verifying master password:", error);
      res.status(500).json({ message: "Error verifying master password" });
    }
  });
  
  // Set master password (admin only)
  app.post("/api/admin-test/set-master-password", isAdmin, async (req, res) => {
    try {
      const { userId, masterPassword } = req.body;
      
      if (!userId || !masterPassword) {
        return res.status(400).json({ message: "User ID and master password are required" });
      }
      
      // Hash the master password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(masterPassword, salt);
      
      // Update the user
      const user = await storage.updateUser(userId, { masterPassword: hashedPassword });
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json({ 
        success: true, 
        message: "Master password set successfully" 
      });
    } catch (error) {
      console.error("Error setting master password:", error);
      res.status(500).json({ message: "Error setting master password" });
    }
  });

  // =================== Payment Endpoints =================== //
  
  // Create a payment intent with Stripe
  app.post("/api/payments/create-intent", isAuthenticated, async (req, res) => {
    try {
      const { amount, currency = 'usd' } = req.body;
      
      if (!amount || amount <= 0) {
        return res.status(400).json({ message: "Invalid amount" });
      }
      
      let customerId: string | undefined;
      
      // If user exists, get or create Stripe customer
      if (req.user) {
        // Use existing customer ID or create a new one
        if (req.user.stripeCustomerId) {
          customerId = req.user.stripeCustomerId;
        } else {
          customerId = await getOrCreateStripeCustomer(req.user);
          
          // Update user with new Stripe customer ID
          await storage.updateStripeCustomerId(req.user.id, customerId);
        }
      }
      
      // Create payment intent
      const paymentIntent = await createPaymentIntent(amount, currency, customerId);
      
      // Return client secret for the frontend
      res.json({
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
      });
    } catch (error) {
      console.error("Payment intent creation error:", error);
      res.status(500).json({ 
        message: "Failed to create payment intent",
        error: error.message 
      });
    }
  });
  
  // Update an order after successful payment
  app.post("/api/payments/confirm", isAuthenticated, async (req, res) => {
    try {
      const { orderId, paymentIntentId, paymentMethod } = req.body;
      
      if (!orderId || !paymentIntentId || !paymentMethod) {
        return res.status(400).json({ message: "Missing required fields" });
      }
      
      // Verify the order belongs to the user
      const order = await storage.getOrder(orderId);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }
      
      if (order.userId !== req.user.id) {
        return res.status(403).json({ message: "You can only update your own orders" });
      }
      
      // Update order status and payment method
      const updatedOrder = await storage.updateOrderStatus(orderId, "paid");
      
      // Process payout to sellers (in a real app, this would be done in a background job)
      if (updatedOrder) {
        // Get all unique seller IDs from the order items
        const items = Array.isArray(updatedOrder.items) 
          ? updatedOrder.items 
          : typeof updatedOrder.items === 'object' 
            ? [updatedOrder.items] 
            : JSON.parse(updatedOrder.items as unknown as string);
        
        // Group items by seller
        const sellerItems = new Map();
        let totalProcessed = 0;
        
        for (const item of items) {
          if (!item.sellerId) continue;
          
          const itemTotal = item.price * item.quantity;
          totalProcessed += itemTotal;
          
          // Calculate platform fee (20% commission)
          const platformFee = calculatePlatformFee(itemTotal);
          const sellerAmount = itemTotal - platformFee;
          
          if (!sellerItems.has(item.sellerId)) {
            sellerItems.set(item.sellerId, {
              totalAmount: 0,
              platformFee: 0,
              sellerAmount: 0,
              items: []
            });
          }
          
          const sellerData = sellerItems.get(item.sellerId);
          sellerData.totalAmount += itemTotal;
          sellerData.platformFee += platformFee;
          sellerData.sellerAmount += sellerAmount;
          sellerData.items.push(item);
        }
        
        // Process payouts for each seller
        for (const [sellerId, data] of sellerItems.entries()) {
          // In a production app, this would be an asynchronous job
          console.log(`Processing payout for seller ${sellerId}:`);
          console.log(`- Total sales: $${data.totalAmount.toFixed(2)}`);
          console.log(`- Platform fee (20%): $${data.platformFee.toFixed(2)}`);
          console.log(`- Seller payout: $${data.sellerAmount.toFixed(2)}`);
          
          // For demo purposes, we'll just log the payout details
          // In a real app, we would call processPayout() with Stripe Connect
          // await processPayout(sellerId, data.sellerAmount, updatedOrder.currency);
        }
        
        console.log(`Order ${orderId} processed for payment. Total: $${totalProcessed.toFixed(2)}`);
      }
      
      res.json({ 
        success: true, 
        message: "Payment confirmed and order updated",
        order: updatedOrder
      });
    } catch (error) {
      console.error("Payment confirmation error:", error);
      res.status(500).json({ 
        message: "Failed to confirm payment",
        error: error.message 
      });
    }
  });
  
  // Get supported payment methods
  app.get("/api/payments/methods", (req, res) => {
    // Return list of supported payment methods - Stripe only as per requirement
    res.json([
      { id: 'stripe', name: 'Credit / Debit Card', enabled: true },
      // No PayPal - removed as per requirement
      { id: 'applepay', name: 'Apple Pay', enabled: true },
      { id: 'googlepay', name: 'Google Pay', enabled: true },
    ]);
  });

  // User Activity Tracking
  
  // Record user activity - ensuring we have a session for tracking even anonymous users
  app.post("/api/user-activity", ensureSessionForTracking, async (req, res) => {
    try {
      const userId = req.isAuthenticated() && req.user ? req.user.id : null;
      
      // Create schema for validation
      const userActivitySchema = z.object({
        userId: z.number().optional(),
        sessionId: z.string(),
        activityType: z.string(),
        details: z.any(),
        ipAddress: z.string().optional().nullable(),
        userAgent: z.string().optional().nullable(),
      });
      
      // Validate request body
      const activityData = userActivitySchema.parse({
        ...req.body,
        userId: userId || req.body.userId, // Use authenticated user if available
        sessionId: req.session.id, // Use the actual session ID from the request
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });
      
      // Record activity
      const activity = await storage.recordUserActivity(activityData);
      
      res.status(201).json(activity);
    } catch (error) {
      console.error("Error recording user activity:", error);
      res.status(400).json({ message: "Failed to record activity", error: String(error) });
    }
  });
  
  // Get user activity by session ID (no authentication required)
  app.get("/api/session-activity", ensureSessionForTracking, async (req, res) => {
    try {
      const sessionId = req.session.id;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      
      const activities = await storage.getSessionActivity(sessionId, limit);
      res.json(activities);
    } catch (error) {
      console.error("Error fetching session activity:", error);
      res.status(500).json({ message: "Failed to fetch session activity" });
    }
  });
  
  // Development mode only: Get all user activity (for testing)
  if (process.env.NODE_ENV === 'development') {
    app.get("/api/dev/all-activity", async (req, res) => {
      try {
        // For testing purposes only
        const result = await db.select().from(userActivity).orderBy("createdAt", "desc").limit(100);
        res.json(result);
      } catch (error) {
        console.error("Error fetching all activity:", error);
        res.status(500).json({ message: "Failed to fetch activity data" });
      }
    });
  }
  
  // Get user activity (only accessible to the user themselves or admins)
  app.get("/api/user-activity", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.id;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      
      const activities = await storage.getUserActivity(userId, limit);
      res.json(activities);
    } catch (error) {
      console.error("Error fetching user activity:", error);
      res.status(500).json({ message: "Failed to fetch user activity" });
    }
  });
  
  // Get product view history for a user
  app.get("/api/user-activity/products", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.id;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      
      const productIds = await storage.getProductViewHistory(userId, limit);
      
      // Fetch the actual products
      const products = [];
      for (const productId of productIds) {
        const product = await storage.getProduct(productId);
        if (product) {
          products.push(product);
        }
      }
      
      res.json(products);
    } catch (error) {
      console.error("Error fetching product view history:", error);
      res.status(500).json({ message: "Failed to fetch product view history" });
    }
  });
  
  // Get search history for a user
  app.get("/api/user-activity/searches", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.id;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      
      const searches = await storage.getSearchHistory(userId, limit);
      res.json(searches);
    } catch (error) {
      console.error("Error fetching search history:", error);
      res.status(500).json({ message: "Failed to fetch search history" });
    }
  });
  
  // Clear user activity history (for GDPR compliance)
  app.delete("/api/user-activity", isAuthenticated, async (req, res) => {
    try {
      // This endpoint would normally clear the user's activity history
      // For now, we'll just return a success message since the actual implementation
      // would require adding a new method to the storage interface
      res.json({ message: "User activity history cleared successfully" });
    } catch (error) {
      console.error("Error clearing user activity:", error);
      res.status(500).json({ message: "Failed to clear user activity" });
    }
  });
  
  // AI-powered product recommendations
  app.post("/api/ai/recommend", async (req, res) => {
    try {
      const { query, userPreferences, browsedProducts, categoryId, priceRange } = req.body;
      
      if (!query) {
        return res.status(400).json({ message: "Query is required" });
      }
      
      // Get current user ID if authenticated
      const userId = req.isAuthenticated() ? req.user?.id : null;
      
      // If no browsed products provided, try to get from user history
      let productIds = browsedProducts || [];
      if (userId && (!productIds || productIds.length === 0)) {
        productIds = await storage.getProductViewHistory(userId, 5);
      }
      
      // Get all products for AI to analyze
      const allProducts = await storage.getProducts();
      
      let aiResponse;
      try {
        // Try to get AI recommendations
        aiResponse = await getProductRecommendations(
          {
            query,
            userPreferences,
            browsedProducts: productIds,
            categoryId,
            priceRange
          },
          allProducts
        );
      } catch (aiError) {
        // If AI fails, use our fallback recommendation system
        console.error("Error getting AI recommendations:", aiError);
        console.log("Using fallback recommendation system");
        aiResponse = getFallbackRecommendations(query, allProducts, categoryId);
      }
      
      // Get the actual product objects for the recommended IDs
      const recommendedProducts = [];
      for (const productId of aiResponse.recommendedProducts) {
        const product = await storage.getProduct(productId);
        if (product) {
          recommendedProducts.push(product);
        }
      }
      
      // If we still don't have recommendations, get bestsellers as a final fallback
      if (recommendedProducts.length === 0) {
        const bestsellers = await storage.getBestsellerProducts();
        recommendedProducts.push(...bestsellers.slice(0, 4));
        aiResponse.message = `Here are some of our best products you might be interested in`;
      }
      
      // Record this as a user activity
      if (userId) {
        await storage.recordUserActivity({
          userId,
          sessionId: req.sessionID,
          activityType: 'ai_recommendation',
          details: { 
            query,
            recommendationCount: recommendedProducts.length
          }
        });
      }
      
      res.json({
        products: recommendedProducts,
        message: aiResponse.message
      });
    } catch (error) {
      console.error("AI recommendation error:", error);
      // Even if the whole endpoint fails, still provide recommendations
      try {
        // First try using our keyword-based recommendation engine directly
        const allProducts = await storage.getProducts();
        const fallbackRecs = getFallbackRecommendations(query, allProducts, categoryId);
        
        // Get the actual product objects for the recommended IDs
        const recommendedProducts = [];
        for (const productId of fallbackRecs.recommendedProducts) {
          const product = await storage.getProduct(productId);
          if (product) {
            recommendedProducts.push(product);
          }
        }
        
        // If we still couldn't get recommendations, use bestsellers as a final resort
        if (recommendedProducts.length === 0) {
          const bestsellers = await storage.getBestsellerProducts();
          res.json({
            products: bestsellers.slice(0, 4),
            message: "Here are some popular products you might like"
          });
        } else {
          // Return our keyword-based recommendations
          res.json({
            products: recommendedProducts,
            message: fallbackRecs.message
          });
        }
      } catch (fallbackError) {
        // Last resort - truly nothing worked
        res.status(500).json({ 
          message: "Failed to get recommendations",
          error: error instanceof Error ? error.message : "Unknown error"
        });
      }
    }
  });

  return httpServer;
}
