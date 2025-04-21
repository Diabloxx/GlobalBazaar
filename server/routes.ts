import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertUserSchema, 
  insertCartItemSchema,
  insertOrderSchema,
  insertWishlistItemSchema,
  insertProductSchema
} from "@shared/schema";
import { z } from "zod";
import passport from "passport";
import { setupAuth, isAuthenticated, isSeller, isAdmin } from "./auth";
import bcrypt from "bcryptjs";

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication
  setupAuth(app);
  
  // All API routes will be prefixed with /api
  
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
  
  // Search products
  app.get("/api/products/search", async (req, res) => {
    try {
      const query = req.query.q as string;
      if (!query) {
        return res.json([]);
      }
      
      const products = await storage.searchProducts(query);
      res.json(products);
    } catch (error) {
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
    passport.authenticate('local', (err, user, info) => {
      if (err) {
        console.error("Login error:", err);
        return res.status(500).json({ message: "Login failed" });
      }
      
      if (!user) {
        return res.status(401).json({ message: info?.message || "Invalid credentials" });
      }
      
      req.login(user, (err) => {
        if (err) {
          console.error("Login session error:", err);
          return res.status(500).json({ message: "Login failed" });
        }
        
        // Don't send back the password
        const { password, ...userWithoutPassword } = user;
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
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    // Don't send back the password
    const { password, ...userWithoutPassword } = req.user;
    res.json(userWithoutPassword);
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
      
      // Update user role to admin
      const updatedUser = await storage.updateUser(userId, { role: "admin" });
      if (!updatedUser) {
        return res.status(500).json({ message: "Failed to update user role" });
      }
      
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
  app.get("/api/admin/orders", async (req, res) => {
    try {
      // In a production app, we would check if the requester is an admin here
      
      // Get all orders
      const orders = await storage.getAllOrders();
      res.json(orders);
    } catch (error) {
      console.error("Admin get orders error:", error);
      res.status(500).json({ message: "Failed to fetch orders" });
    }
  });
  
  // Admin API - Get all products with seller information
  app.get("/api/admin/products", async (req, res) => {
    try {
      // In a production app, we would check if the requester is an admin here
      
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
      
      res.json(productsWithSellerInfo);
    } catch (error) {
      console.error("Admin get products error:", error);
      res.status(500).json({ message: "Failed to fetch products" });
    }
  });
  
  // Admin API - Create a product
  app.post("/api/admin/products", async (req, res) => {
    try {
      // In a production app, we would check if the requester is an admin here
      
      const productData = insertProductSchema.parse(req.body);
      
      // Generate a slug from the product name if not provided
      if (!productData.slug) {
        productData.slug = productData.name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '');
      }
      
      const product = await storage.createProduct(productData);
      res.status(201).json(product);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid product data", errors: error.errors });
      }
      console.error("Admin create product error:", error);
      res.status(500).json({ message: "Failed to create product" });
    }
  });
  
  // Admin API - Update a product
  app.patch("/api/admin/products/:id", async (req, res) => {
    try {
      // In a production app, we would check if the requester is an admin here
      
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
      res.status(500).json({ message: "Failed to update product" });
    }
  });
  
  // Admin API - Delete a product
  app.delete("/api/admin/products/:id", async (req, res) => {
    try {
      // In a production app, we would check if the requester is an admin here
      
      const productId = parseInt(req.params.id);
      if (isNaN(productId)) {
        return res.status(400).json({ message: "Invalid product ID" });
      }
      
      // Delete product
      const deleted = await storage.deleteProduct(productId);
      if (!deleted) {
        return res.status(404).json({ message: "Product not found" });
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error("Admin delete product error:", error);
      res.status(500).json({ message: "Failed to delete product" });
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

  // Seller API - Get seller's products
  app.get("/api/seller/products", isAuthenticated, isSeller, async (req, res) => {
    try {
      // Get all products where sellerId matches the user's ID
      const products = await storage.getProducts();
      const sellerProducts = products.filter(product => product.sellerId === req.user.id);
      
      res.json(sellerProducts);
    } catch (error) {
      console.error("Seller products fetch error:", error);
      res.status(500).json({ message: "Failed to fetch seller products" });
    }
  });

  // Seller API - Create a product
  app.post("/api/seller/products", isAuthenticated, isSeller, async (req, res) => {
    try {
      const productData = insertProductSchema.parse(req.body);
      
      // Automatically set the seller ID to the current user
      productData.sellerId = req.user.id;
      
      // Generate a slug from the product name if not provided
      if (!productData.slug) {
        productData.slug = productData.name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '');
      }
      
      const product = await storage.createProduct(productData);
      res.status(201).json(product);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid product data", errors: error.errors });
      }
      console.error("Seller create product error:", error);
      res.status(500).json({ message: "Failed to create product" });
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

  // Seller API - Get seller's orders
  app.get("/api/seller/orders", isAuthenticated, isSeller, async (req, res) => {
    try {
      // Get all orders (in a real application, we would filter by seller)
      // For now, just return all orders as a demonstration
      const allOrders = await storage.getAllOrders();
      
      // Mock implementation: just returning all orders
      // In a real app, we would find orders containing products from this seller
      res.json(allOrders);
    } catch (error) {
      console.error("Seller orders fetch error:", error);
      res.status(500).json({ message: "Failed to fetch seller orders" });
    }
  });
  
  // AI-powered product recommendation
  app.post("/api/ai/recommend", async (req, res) => {
    try {
      const { query, userPreferences, priceRange, categoryId, browsedProducts } = req.body;
      
      if (!query) {
        return res.status(400).json({ message: "Query is required" });
      }
      
      // Get all products to match against
      const allProducts = await storage.getProducts();
      
      // Import dynamically to avoid loading OpenAI if not needed
      const { getProductRecommendations, analyzeUserInterests } = await import("./openai");
      
      // First, analyze the user's message to understand their interests
      const analysis = await analyzeUserInterests(query);
      
      // Then get recommendations based on the analysis
      const recommendations = await getProductRecommendations(
        {
          query,
          userPreferences: userPreferences || analysis.interests || [],
          priceRange: priceRange || analysis.priceRange,
          categoryId,
          browsedProducts
        },
        allProducts
      );
      
      // Get the actual product objects for recommended product IDs
      const recommendedProducts = recommendations.recommendedProducts
        .map(id => allProducts.find(p => p.id === id))
        .filter(Boolean);
      
      res.json({
        message: recommendations.message,
        products: recommendedProducts
      });
    } catch (error) {
      console.error("AI recommendation error:", error);
      res.status(500).json({ 
        message: "Failed to get AI recommendations",
        error: error.message 
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
