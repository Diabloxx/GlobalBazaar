import { 
  users, type User, type InsertUser,
  categories, type Category, type InsertCategory,
  products, type Product, type InsertProduct,
  cartItems, type CartItem, type InsertCartItem,
  orders, type Order, type InsertOrder,
  wishlistItems, type WishlistItem, type InsertWishlistItem,
  Currency, currencySchema,
  productReviews, type ProductReview, type InsertProductReview,
  userActivity, type UserActivity, type InsertUserActivity
} from "@shared/schema";
import { db } from "./db";
import { 
  eq, like, and, or, desc, inArray, ne, sql, 
  gte, lte, isNull, not
} from "drizzle-orm";

// Interface for storage operations
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<InsertUser>): Promise<User | undefined>;
  updateStripeCustomerId(userId: number, stripeCustomerId: string): Promise<User | undefined>;
  updateStripeAccountId(userId: number, stripeAccountId: string): Promise<User | undefined>;
  
  // User Activity Tracking
  recordUserActivity(activity: InsertUserActivity): Promise<UserActivity>;
  getUserActivity(userId: number, limit?: number): Promise<UserActivity[]>;
  getSessionActivity(sessionId: string, limit?: number): Promise<UserActivity[]>; // Get activity by session ID
  getProductViewHistory(userId: number, limit?: number): Promise<number[]>; // Returns product IDs
  getSearchHistory(userId: number, limit?: number): Promise<string[]>; // Returns search queries
  
  // Category operations
  getCategories(): Promise<Category[]>;
  getCategory(id: number): Promise<Category | undefined>;
  getCategoryBySlug(slug: string): Promise<Category | undefined>;
  createCategory(category: InsertCategory): Promise<Category>;
  
  // Product operations
  getProducts(): Promise<Product[]>;
  getProduct(id: number): Promise<Product | undefined>;
  getProductBySlug(slug: string): Promise<Product | undefined>;
  getProductsByCategory(categoryId: number): Promise<Product[]>;
  getFeaturedProducts(): Promise<Product[]>;
  getSaleProducts(): Promise<Product[]>;
  getNewProducts(): Promise<Product[]>;
  getBestsellerProducts(): Promise<Product[]>;
  searchProducts(
    query: string,
    options?: {
      minPrice?: number;
      maxPrice?: number;
      categoryIds?: number[];
      sortBy?: string;
      minRating?: number;
    }
  ): Promise<Product[]>;
  createProduct(product: InsertProduct): Promise<Product>;
  
  // Cart operations
  getCartItems(userId: number): Promise<CartItem[]>;
  getCartItemsWithProducts(userId: number): Promise<(CartItem & { product: Product })[]>;
  getCartItem(id: number): Promise<CartItem | undefined>;
  getCartItemByUserAndProduct(userId: number, productId: number): Promise<CartItem | undefined>;
  createCartItem(item: InsertCartItem): Promise<CartItem>;
  updateCartItem(id: number, item: Partial<InsertCartItem>): Promise<CartItem | undefined>;
  deleteCartItem(id: number): Promise<boolean>;
  clearCart(userId: number): Promise<boolean>;
  
  // Order operations
  getOrders(userId: number): Promise<Order[]>;
  getAllOrders(): Promise<Order[]>;
  getOrder(id: number): Promise<Order | undefined>;
  createOrder(order: InsertOrder): Promise<Order>;
  updateOrderStatus(id: number, status: string): Promise<Order | undefined>;
  
  // Wishlist operations
  getWishlistItems(userId: number): Promise<WishlistItem[]>;
  getWishlistItemsWithProducts(userId: number): Promise<(WishlistItem & { product: Product })[]>;
  getWishlistItem(id: number): Promise<WishlistItem | undefined>;
  getWishlistItemByUserAndProduct(userId: number, productId: number): Promise<WishlistItem | undefined>;
  createWishlistItem(item: InsertWishlistItem): Promise<WishlistItem>;
  deleteWishlistItem(id: number): Promise<boolean>;
  
  // Currency operations
  getCurrencies(): Promise<Currency[]>;
  
  // Product Review operations
  getProductReviews(productId: number): Promise<ProductReview[]>;
  getProductReviewsWithUser(productId: number): Promise<(ProductReview & { user: Pick<User, 'id' | 'username' | 'fullName'> })[]>;
  getProductReview(id: number): Promise<ProductReview | undefined>;
  getUserProductReview(userId: number, productId: number): Promise<ProductReview | undefined>;
  createProductReview(review: InsertProductReview): Promise<ProductReview>;
  updateProductReview(id: number, reviewData: Partial<InsertProductReview>): Promise<ProductReview | undefined>;
  deleteProductReview(id: number): Promise<boolean>;
  getProductAverageRating(productId: number): Promise<number>;
}

// In-memory storage implementation
export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private categories: Map<number, Category>;
  private products: Map<number, Product>;
  private cartItems: Map<number, CartItem>;
  private orders: Map<number, Order>;
  private wishlistItems: Map<number, WishlistItem>;
  private productReviews: Map<number, ProductReview>;
  private userActivities: Map<number, UserActivity>;
  private currencies: Currency[];
  
  private userIdCounter: number;
  private categoryIdCounter: number;
  private productIdCounter: number;
  private cartItemIdCounter: number;
  private orderIdCounter: number;
  private wishlistItemIdCounter: number;
  private productReviewIdCounter: number;
  private userActivityIdCounter: number;
  
  constructor() {
    this.users = new Map();
    this.categories = new Map();
    this.products = new Map();
    this.cartItems = new Map();
    this.orders = new Map();
    this.wishlistItems = new Map();
    this.productReviews = new Map();
    this.userActivities = new Map();
    
    this.userIdCounter = 1;
    this.categoryIdCounter = 1;
    this.productIdCounter = 1;
    this.cartItemIdCounter = 1;
    this.orderIdCounter = 1;
    this.wishlistItemIdCounter = 1;
    this.productReviewIdCounter = 1;
    this.userActivityIdCounter = 1;
    
    // Add some default currencies
    this.currencies = [
      { code: "USD", name: "US Dollar", symbol: "$", rate: 1 },
      { code: "EUR", name: "Euro", symbol: "€", rate: 0.91 },
      { code: "GBP", name: "British Pound", symbol: "£", rate: 0.79 },
      { code: "CAD", name: "Canadian Dollar", symbol: "CA$", rate: 1.35 },
      { code: "AUD", name: "Australian Dollar", symbol: "A$", rate: 1.51 },
      { code: "JPY", name: "Japanese Yen", symbol: "¥", rate: 149.82 }
    ];
    
    // Initialize with sample data
    this.initializeSampleData();
  }
  
  private initializeSampleData() {
    // Add categories
    const categories = [
      { name: "Electronics", slug: "electronics", description: "Electronic devices and gadgets", icon: "mobile-alt" },
      { name: "Fashion", slug: "fashion", description: "Clothing and accessories", icon: "tshirt" },
      { name: "Home & Garden", slug: "home-garden", description: "Products for your home", icon: "home" },
      { name: "Beauty", slug: "beauty", description: "Beauty and personal care", icon: "heartbeat" },
      { name: "Sports", slug: "sports", description: "Sports equipment and accessories", icon: "football-ball" },
      { name: "Toys & Games", slug: "toys-games", description: "Toys and games for all ages", icon: "puzzle-piece" }
    ];
    
    categories.forEach(category => {
      this.createCategory(category);
    });
    
    // Add products
    const products = [
      {
        categoryId: 1,
        name: "Premium Smartphone",
        slug: "premium-smartphone",
        description: "High-end smartphone with advanced features",
        price: 699.99,
        salePrice: 599.99,
        discount: 15,
        imageUrl: "https://images.unsplash.com/photo-1546868871-7041f2a55e12",
        inventory: 200,
        rating: 4.5,
        reviewCount: 124,
        featured: true,
        isSale: true,
        isNew: false,
        isBestSeller: false
      },
      {
        categoryId: 1,
        name: "Ultra-thin Laptop",
        slug: "ultra-thin-laptop",
        description: "Powerful laptop with sleek design",
        price: 899.99,
        salePrice: null,
        discount: null,
        imageUrl: "https://images.unsplash.com/photo-1593642632823-8f785ba67e45",
        inventory: 150,
        rating: 4.8,
        reviewCount: 86,
        featured: true,
        isSale: false,
        isNew: true,
        isBestSeller: false
      },
      {
        categoryId: 1,
        name: "Wireless Headphones",
        slug: "wireless-headphones",
        description: "High-quality wireless headphones with noise cancellation",
        price: 149.99,
        salePrice: 129.99,
        discount: null,
        imageUrl: "https://images.unsplash.com/photo-1585123334904-845d60e97b29",
        inventory: 300,
        rating: 4.0,
        reviewCount: 214,
        featured: true,
        isSale: true,
        isNew: false,
        isBestSeller: true
      },
      {
        categoryId: 2,
        name: "Running Shoes",
        slug: "running-shoes",
        description: "Comfortable running shoes for all terrains",
        price: 89.99,
        salePrice: null,
        discount: null,
        imageUrl: "https://images.unsplash.com/photo-1542291026-7eec264c27ff",
        inventory: 250,
        rating: 3.5,
        reviewCount: 76,
        featured: true,
        isSale: false,
        isNew: false,
        isBestSeller: false
      },
      {
        categoryId: 1,
        name: "Portable Speaker",
        slug: "portable-speaker",
        description: "Compact speaker with great sound quality",
        price: 79.99,
        salePrice: 59.99,
        discount: 25,
        imageUrl: "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f",
        inventory: 180,
        rating: 4.0,
        reviewCount: 142,
        featured: true,
        isSale: true,
        isNew: false,
        isBestSeller: false
      },
      {
        categoryId: 2,
        name: "Designer Handbag",
        slug: "designer-handbag",
        description: "Stylish handbag made with premium materials",
        price: 129.99,
        salePrice: 99.99,
        discount: 23,
        imageUrl: "https://images.unsplash.com/photo-1584917865442-de89df76afd3",
        inventory: 100,
        rating: 4.7,
        reviewCount: 58,
        featured: false,
        isSale: true,
        isNew: false,
        isBestSeller: true
      },
      {
        categoryId: 3,
        name: "Smart Home Hub",
        slug: "smart-home-hub",
        description: "Control your smart home devices with this central hub",
        price: 149.99,
        salePrice: 129.99,
        discount: 13,
        imageUrl: "https://images.unsplash.com/photo-1558002038-bb4e8e2d432d",
        inventory: 120,
        rating: 4.3,
        reviewCount: 97,
        featured: true,
        isSale: true,
        isNew: true,
        isBestSeller: false
      },
      {
        categoryId: 4,
        name: "Skincare Set",
        slug: "skincare-set",
        description: "Complete skincare routine in one package",
        price: 59.99,
        salePrice: null,
        discount: null,
        imageUrl: "https://images.unsplash.com/photo-1556228720-195a672e8a03",
        inventory: 200,
        rating: 4.6,
        reviewCount: 184,
        featured: false,
        isSale: false,
        isNew: true,
        isBestSeller: true
      }
    ];
    
    products.forEach(product => {
      this.createProduct(product);
    });
  }
  
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }
  
  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username
    );
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email
    );
  }
  
  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }
  
  async createUser(user: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const newUser: User = { ...user, id, createdAt: new Date() };
    this.users.set(id, newUser);
    return newUser;
  }
  
  async updateUser(id: number, userData: Partial<InsertUser>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...userData };
    this.users.set(id, updatedUser);
    return updatedUser;
  }
  
  async updateStripeCustomerId(userId: number, stripeCustomerId: string): Promise<User | undefined> {
    const user = this.users.get(userId);
    if (!user) return undefined;
    
    const updatedUser = { ...user, stripeCustomerId };
    this.users.set(userId, updatedUser);
    return updatedUser;
  }
  
  async updateStripeAccountId(userId: number, stripeAccountId: string): Promise<User | undefined> {
    const user = this.users.get(userId);
    if (!user) return undefined;
    
    const updatedUser = { ...user, stripeAccountId };
    this.users.set(userId, updatedUser);
    return updatedUser;
  }
  
  // Category operations
  async getCategories(): Promise<Category[]> {
    return Array.from(this.categories.values());
  }
  
  async getCategory(id: number): Promise<Category | undefined> {
    return this.categories.get(id);
  }
  
  async getCategoryBySlug(slug: string): Promise<Category | undefined> {
    return Array.from(this.categories.values()).find(
      (category) => category.slug === slug
    );
  }
  
  async createCategory(category: InsertCategory): Promise<Category> {
    const id = this.categoryIdCounter++;
    const newCategory: Category = { ...category, id };
    this.categories.set(id, newCategory);
    return newCategory;
  }
  
  // Product operations
  async getProducts(): Promise<Product[]> {
    return Array.from(this.products.values());
  }
  
  async getProduct(id: number): Promise<Product | undefined> {
    return this.products.get(id);
  }
  
  async getProductBySlug(slug: string): Promise<Product | undefined> {
    return Array.from(this.products.values()).find(
      (product) => product.slug === slug
    );
  }
  
  async getProductsByCategory(categoryId: number): Promise<Product[]> {
    return Array.from(this.products.values()).filter(
      (product) => product.categoryId === categoryId
    );
  }
  
  async getFeaturedProducts(): Promise<Product[]> {
    return Array.from(this.products.values()).filter(
      (product) => product.featured
    );
  }
  
  async getSaleProducts(): Promise<Product[]> {
    return Array.from(this.products.values()).filter(
      (product) => product.isSale
    );
  }
  
  async getNewProducts(): Promise<Product[]> {
    return Array.from(this.products.values()).filter(
      (product) => product.isNew
    );
  }
  
  async getBestsellerProducts(): Promise<Product[]> {
    return Array.from(this.products.values()).filter(
      (product) => product.isBestSeller
    );
  }
  
  async searchProducts(query: string): Promise<Product[]> {
    const lowerQuery = query.toLowerCase();
    return Array.from(this.products.values()).filter(
      (product) => 
        product.name.toLowerCase().includes(lowerQuery) ||
        product.description.toLowerCase().includes(lowerQuery)
    );
  }
  
  async createProduct(product: InsertProduct): Promise<Product> {
    const id = this.productIdCounter++;
    const newProduct: Product = { ...product, id, createdAt: new Date() };
    this.products.set(id, newProduct);
    return newProduct;
  }
  
  async updateProduct(id: number, productData: Partial<InsertProduct>): Promise<Product | undefined> {
    const product = await this.getProduct(id);
    if (!product) {
      return undefined;
    }
    
    const updatedProduct = { ...product, ...productData };
    this.products.set(id, updatedProduct);
    return updatedProduct;
  }
  
  async deleteProduct(id: number): Promise<boolean> {
    const product = await this.getProduct(id);
    if (!product) {
      return false;
    }
    
    return this.products.delete(id);
  }
  
  // Cart operations
  async getCartItems(userId: number): Promise<CartItem[]> {
    return Array.from(this.cartItems.values()).filter(
      (item) => item.userId === userId
    );
  }
  
  async getCartItemsWithProducts(userId: number): Promise<(CartItem & { product: Product })[]> {
    const cartItems = await this.getCartItems(userId);
    return cartItems.map(item => {
      const product = this.products.get(item.productId);
      if (!product) {
        throw new Error(`Product not found for cart item: ${item.id}`);
      }
      return { ...item, product };
    });
  }
  
  async getCartItem(id: number): Promise<CartItem | undefined> {
    return this.cartItems.get(id);
  }
  
  async getCartItemByUserAndProduct(userId: number, productId: number): Promise<CartItem | undefined> {
    return Array.from(this.cartItems.values()).find(
      (item) => item.userId === userId && item.productId === productId
    );
  }
  
  async createCartItem(item: InsertCartItem): Promise<CartItem> {
    const id = this.cartItemIdCounter++;
    const newItem: CartItem = { ...item, id, createdAt: new Date() };
    this.cartItems.set(id, newItem);
    return newItem;
  }
  
  async updateCartItem(id: number, itemData: Partial<InsertCartItem>): Promise<CartItem | undefined> {
    const item = this.cartItems.get(id);
    if (!item) return undefined;
    
    const updatedItem = { ...item, ...itemData };
    this.cartItems.set(id, updatedItem);
    return updatedItem;
  }
  
  async deleteCartItem(id: number): Promise<boolean> {
    return this.cartItems.delete(id);
  }
  
  async clearCart(userId: number): Promise<boolean> {
    const items = await this.getCartItems(userId);
    items.forEach(item => this.cartItems.delete(item.id));
    return true;
  }
  
  // Order operations
  async getOrders(userId: number): Promise<Order[]> {
    return Array.from(this.orders.values())
      .filter(order => order.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
  
  async getAllOrders(): Promise<Order[]> {
    return Array.from(this.orders.values())
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
  
  async getOrder(id: number): Promise<Order | undefined> {
    return this.orders.get(id);
  }
  
  async createOrder(order: InsertOrder): Promise<Order> {
    const id = this.orderIdCounter++;
    const newOrder: Order = { ...order, id, createdAt: new Date() };
    this.orders.set(id, newOrder);
    return newOrder;
  }
  
  async updateOrderStatus(id: number, status: string): Promise<Order | undefined> {
    const order = this.orders.get(id);
    if (!order) return undefined;
    
    const updatedOrder = { ...order, status };
    this.orders.set(id, updatedOrder);
    return updatedOrder;
  }
  
  // Wishlist operations
  async getWishlistItems(userId: number): Promise<WishlistItem[]> {
    return Array.from(this.wishlistItems.values()).filter(
      (item) => item.userId === userId
    );
  }
  
  async getWishlistItemsWithProducts(userId: number): Promise<(WishlistItem & { product: Product })[]> {
    const wishlistItems = await this.getWishlistItems(userId);
    return wishlistItems.map(item => {
      const product = this.products.get(item.productId);
      if (!product) {
        throw new Error(`Product not found for wishlist item: ${item.id}`);
      }
      return { ...item, product };
    });
  }
  
  async getWishlistItem(id: number): Promise<WishlistItem | undefined> {
    return this.wishlistItems.get(id);
  }
  
  async getWishlistItemByUserAndProduct(userId: number, productId: number): Promise<WishlistItem | undefined> {
    return Array.from(this.wishlistItems.values()).find(
      (item) => item.userId === userId && item.productId === productId
    );
  }
  
  async createWishlistItem(item: InsertWishlistItem): Promise<WishlistItem> {
    const id = this.wishlistItemIdCounter++;
    const newItem: WishlistItem = { ...item, id, createdAt: new Date() };
    this.wishlistItems.set(id, newItem);
    return newItem;
  }
  
  async deleteWishlistItem(id: number): Promise<boolean> {
    return this.wishlistItems.delete(id);
  }
  
  // Currency operations
  async getCurrencies(): Promise<Currency[]> {
    return this.currencies;
  }
  
  // Product Review operations
  async getProductReviews(productId: number): Promise<ProductReview[]> {
    return Array.from(this.productReviews.values())
      .filter(review => review.productId === productId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getProductReviewsWithUser(productId: number): Promise<(ProductReview & { user: Pick<User, 'id' | 'username' | 'fullName'> })[]> {
    const reviews = await this.getProductReviews(productId);
    return reviews.map(review => {
      const user = this.users.get(review.userId);
      if (!user) {
        throw new Error(`User not found for review: ${review.id}`);
      }
      return {
        ...review,
        user: {
          id: user.id,
          username: user.username,
          fullName: user.fullName
        }
      };
    });
  }

  async getProductReview(id: number): Promise<ProductReview | undefined> {
    return this.productReviews.get(id);
  }

  async getUserProductReview(userId: number, productId: number): Promise<ProductReview | undefined> {
    return Array.from(this.productReviews.values()).find(
      review => review.userId === userId && review.productId === productId
    );
  }

  async createProductReview(review: InsertProductReview): Promise<ProductReview> {
    const id = this.productReviewIdCounter++;
    const newReview: ProductReview = { ...review, id, createdAt: new Date() };
    this.productReviews.set(id, newReview);
    
    // Update the product's average rating
    await this.updateProductRating(review.productId);
    
    return newReview;
  }

  async updateProductReview(id: number, reviewData: Partial<InsertProductReview>): Promise<ProductReview | undefined> {
    const review = this.productReviews.get(id);
    if (!review) return undefined;
    
    const updatedReview = { ...review, ...reviewData };
    this.productReviews.set(id, updatedReview);
    
    // Update the product's average rating
    await this.updateProductRating(review.productId);
    
    return updatedReview;
  }

  async deleteProductReview(id: number): Promise<boolean> {
    const review = this.productReviews.get(id);
    if (!review) return false;
    
    const productId = review.productId;
    const result = this.productReviews.delete(id);
    
    // Update the product's average rating
    if (result) {
      await this.updateProductRating(productId);
    }
    
    return result;
  }

  async getProductAverageRating(productId: number): Promise<number> {
    const reviews = await this.getProductReviews(productId);
    if (reviews.length === 0) return 0;
    
    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    return totalRating / reviews.length;
  }
  
  // User Activity Tracking methods
  async recordUserActivity(activity: InsertUserActivity): Promise<UserActivity> {
    const id = this.userActivityIdCounter++;
    const newActivity: UserActivity = { ...activity, id, createdAt: new Date() };
    this.userActivities.set(id, newActivity);
    return newActivity;
  }

  async getUserActivity(userId: number, limit?: number): Promise<UserActivity[]> {
    const activities = Array.from(this.userActivities.values())
      .filter(activity => activity.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    
    return limit ? activities.slice(0, limit) : activities;
  }
  
  async getSessionActivity(sessionId: string, limit?: number): Promise<UserActivity[]> {
    const activities = Array.from(this.userActivities.values())
      .filter(activity => activity.sessionId === sessionId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    
    return limit ? activities.slice(0, limit) : activities;
  }
  
  async getProductViewHistory(userId: number, limit: number = 10): Promise<number[]> {
    const activities = await db.select()
      .from(userActivity)
      .where(
        and(
          eq(userActivity.userId, userId),
          eq(userActivity.activityType, 'product_view')
        )
      )
      .orderBy(desc(userActivity.createdAt))
      .limit(limit);
    
    // Extract unique product IDs from the view history
    const productIds = new Set<number>();
    const result: number[] = [];
    
    for (const activity of activities) {
      const details = activity.details as any;
      const productId = details?.productId ? Number(details.productId) : null;
      if (productId && !productIds.has(productId)) {
        productIds.add(productId);
        result.push(productId);
        if (result.length >= limit) break;
      }
    }
    
    return result;
  }
  
  async getSearchHistory(userId: number, limit: number = 10): Promise<string[]> {
    const activities = await db.select()
      .from(userActivity)
      .where(
        and(
          eq(userActivity.userId, userId),
          eq(userActivity.activityType, 'search')
        )
      )
      .orderBy(desc(userActivity.createdAt))
      .limit(limit);
    
    // Extract unique search queries from history
    const searchQueries = new Set<string>();
    const result: string[] = [];
    
    for (const activity of activities) {
      const details = activity.details as any;
      const query = details?.query as string;
      if (query && !searchQueries.has(query)) {
        searchQueries.add(query);
        result.push(query);
        if (result.length >= limit) break;
      }
    }
    
    return result;
  }
  
  async getSearchHistory(userId: number, limit: number = 10): Promise<string[]> {
    const activities = Array.from(this.userActivities.values())
      .filter(
        activity => 
          activity.userId === userId && 
          activity.activityType === 'search'
      )
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    
    // Extract unique search queries
    const searchQueries = new Set<string>();
    const result: string[] = [];
    
    for (const activity of activities) {
      const query = (activity.details as any).query;
      if (query && !searchQueries.has(query)) {
        searchQueries.add(query);
        result.push(query);
        if (result.length >= limit) break;
      }
    }
    
    return result;
  }
  
  private async updateProductRating(productId: number): Promise<void> {
    const product = this.products.get(productId);
    if (!product) return;
    
    const reviews = await this.getProductReviews(productId);
    const reviewCount = reviews.length;
    
    if (reviewCount === 0) {
      // No reviews, set defaults
      this.products.set(productId, { ...product, rating: 0, reviewCount: 0 });
      return;
    }
    
    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = totalRating / reviewCount;
    
    this.products.set(productId, { ...product, rating: averageRating, reviewCount });
  }
}

// Database storage implementation

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }
  
  async getAllUsers(): Promise<User[]> {
    return db.select().from(users);
  }

  async createUser(user: InsertUser): Promise<User> {
    const [newUser] = await db.insert(users).values(user).returning();
    return newUser;
  }

  async updateUser(id: number, userData: Partial<InsertUser>): Promise<User | undefined> {
    const [updatedUser] = await db
      .update(users)
      .set(userData)
      .where(eq(users.id, id))
      .returning();
    return updatedUser;
  }
  
  async updateStripeCustomerId(userId: number, stripeCustomerId: string): Promise<User | undefined> {
    const [updatedUser] = await db
      .update(users)
      .set({ stripeCustomerId })
      .where(eq(users.id, userId))
      .returning();
    return updatedUser;
  }
  
  async updateStripeAccountId(userId: number, stripeAccountId: string): Promise<User | undefined> {
    const [updatedUser] = await db
      .update(users)
      .set({ stripeAccountId })
      .where(eq(users.id, userId))
      .returning();
    return updatedUser;
  }

  // Category operations
  async getCategories(): Promise<Category[]> {
    return db.select().from(categories);
  }

  async getCategory(id: number): Promise<Category | undefined> {
    const [category] = await db.select().from(categories).where(eq(categories.id, id));
    return category;
  }

  async getCategoryBySlug(slug: string): Promise<Category | undefined> {
    const [category] = await db.select().from(categories).where(eq(categories.slug, slug));
    return category;
  }

  async createCategory(category: InsertCategory): Promise<Category> {
    const [newCategory] = await db.insert(categories).values(category).returning();
    return newCategory;
  }

  // Product operations
  async getProducts(): Promise<Product[]> {
    return db.select().from(products);
  }

  async getProduct(id: number): Promise<Product | undefined> {
    const [product] = await db.select().from(products).where(eq(products.id, id));
    return product;
  }

  async getProductBySlug(slug: string): Promise<Product | undefined> {
    const [product] = await db.select().from(products).where(eq(products.slug, slug));
    return product;
  }

  async getProductsByCategory(categoryId: number): Promise<Product[]> {
    return db.select().from(products).where(eq(products.categoryId, categoryId));
  }

  async getFeaturedProducts(): Promise<Product[]> {
    return db.select().from(products).where(eq(products.featured, true));
  }

  async getSaleProducts(): Promise<Product[]> {
    return db.select().from(products).where(eq(products.isSale, true));
  }

  async getNewProducts(): Promise<Product[]> {
    return db.select().from(products).where(eq(products.isNew, true));
  }

  async getBestsellerProducts(): Promise<Product[]> {
    return db.select().from(products).where(eq(products.isBestSeller, true));
  }

  async searchProducts(
    query: string,
    options: {
      minPrice?: number;
      maxPrice?: number;
      categoryIds?: number[];
      sortBy?: string;
      minRating?: number;
    } = {}
  ): Promise<Product[]> {
    // Start with a query builder
    let query_builder = db
      .select()
      .from(products);
    
    // Apply text search if provided
    if (query && query.trim() !== '') {
      const searchPattern = `%${query}%`;
      query_builder = query_builder.where(
        or(
          like(products.name, searchPattern),
          like(products.description, searchPattern)
        )
      );
    }
    
    // Apply price range filter
    if (options.minPrice !== undefined) {
      query_builder = query_builder.where(gte(products.price, options.minPrice));
    }
    
    if (options.maxPrice !== undefined) {
      query_builder = query_builder.where(
        or(
          lte(products.price, options.maxPrice),
          and(
            not(isNull(products.salePrice)),
            lte(products.salePrice, options.maxPrice)
          )
        )
      );
    }
    
    // Apply category filter
    if (options.categoryIds && options.categoryIds.length > 0) {
      query_builder = query_builder.where(inArray(products.categoryId, options.categoryIds));
    }
    
    // Apply minimum rating filter
    if (options.minRating !== undefined && options.minRating > 0) {
      query_builder = query_builder.where(
        or(
          gte(products.rating, options.minRating),
          isNull(products.rating)
        )
      );
    }
    
    // Apply sorting
    if (options.sortBy) {
      switch (options.sortBy) {
        case 'price_asc':
          query_builder = query_builder.orderBy(products.price, 'asc');
          break;
        case 'price_desc':
          query_builder = query_builder.orderBy(products.price, 'desc');
          break;
        case 'rating_desc':
          query_builder = query_builder.orderBy(desc(products.rating));
          break;
        case 'newest':
          query_builder = query_builder.orderBy(desc(products.createdAt));
          break;
        default:
          // Default is relevance, which doesn't need explicit ordering
          break;
      }
    }
    
    return query_builder;
  }

  async createProduct(product: InsertProduct): Promise<Product> {
    const [newProduct] = await db.insert(products).values(product).returning();
    return newProduct;
  }
  
  async updateProduct(id: number, productData: Partial<InsertProduct>): Promise<Product | undefined> {
    const [updatedProduct] = await db
      .update(products)
      .set(productData)
      .where(eq(products.id, id))
      .returning();
    return updatedProduct;
  }
  
  async deleteProduct(id: number): Promise<boolean> {
    const result = await db.delete(products).where(eq(products.id, id));
    return result.rowCount > 0;
  }

  // Cart operations
  async getCartItems(userId: number): Promise<CartItem[]> {
    return db.select().from(cartItems).where(eq(cartItems.userId, userId));
  }

  async getCartItemsWithProducts(userId: number): Promise<(CartItem & { product: Product })[]> {
    const result = await db
      .select({
        cartItem: cartItems,
        product: products
      })
      .from(cartItems)
      .innerJoin(products, eq(cartItems.productId, products.id))
      .where(eq(cartItems.userId, userId));

    return result.map(({ cartItem, product }) => ({
      ...cartItem,
      product
    }));
  }

  async getCartItem(id: number): Promise<CartItem | undefined> {
    const [item] = await db.select().from(cartItems).where(eq(cartItems.id, id));
    return item;
  }

  async getCartItemByUserAndProduct(userId: number, productId: number): Promise<CartItem | undefined> {
    const [item] = await db
      .select()
      .from(cartItems)
      .where(
        and(
          eq(cartItems.userId, userId),
          eq(cartItems.productId, productId)
        )
      );
    return item;
  }

  async createCartItem(item: InsertCartItem): Promise<CartItem> {
    const [newItem] = await db.insert(cartItems).values(item).returning();
    return newItem;
  }

  async updateCartItem(id: number, itemData: Partial<InsertCartItem>): Promise<CartItem | undefined> {
    const [updatedItem] = await db
      .update(cartItems)
      .set(itemData)
      .where(eq(cartItems.id, id))
      .returning();
    return updatedItem;
  }

  async deleteCartItem(id: number): Promise<boolean> {
    const result = await db.delete(cartItems).where(eq(cartItems.id, id));
    return result.rowCount > 0;
  }

  async clearCart(userId: number): Promise<boolean> {
    const result = await db.delete(cartItems).where(eq(cartItems.userId, userId));
    return result.rowCount > 0;
  }

  // Order operations
  async getOrders(userId: number): Promise<Order[]> {
    return db
      .select()
      .from(orders)
      .where(eq(orders.userId, userId))
      .orderBy(desc(orders.createdAt));
  }
  
  async getAllOrders(): Promise<Order[]> {
    return db
      .select()
      .from(orders)
      .orderBy(desc(orders.createdAt));
  }

  async getOrder(id: number): Promise<Order | undefined> {
    const [order] = await db.select().from(orders).where(eq(orders.id, id));
    return order;
  }

  async createOrder(order: InsertOrder): Promise<Order> {
    const [newOrder] = await db.insert(orders).values(order).returning();
    
    // Update bestselling products after order is created
    await this.updateBestsellerProducts(order.items);
    
    return newOrder;
  }
  
  // Analyze orders and update bestseller flags
  private async updateBestsellerProducts(newOrderItems: any): Promise<void> {
    try {
      // Extract product IDs from the new order
      const newOrderProductIds = new Set();
      if (Array.isArray(newOrderItems)) {
        newOrderItems.forEach(item => {
          if (item.productId) {
            newOrderProductIds.add(item.productId);
          }
        });
      } else if (typeof newOrderItems === 'object') {
        // Handle case where items might be a JSON object
        Object.values(newOrderItems).forEach((item: any) => {
          if (item.productId) {
            newOrderProductIds.add(item.productId);
          }
        });
      }
      
      if (newOrderProductIds.size === 0) return;
      
      // Get all orders to analyze sales patterns
      const allOrders = await db.select().from(orders);
      
      // Count sales per product
      const productSalesCount = new Map<number, number>();
      
      // Process all orders to count product sales
      allOrders.forEach(order => {
        let items = [];
        
        try {
          if (typeof order.items === 'string') {
            items = JSON.parse(order.items);
          } else {
            items = order.items;
          }
          
          if (Array.isArray(items)) {
            items.forEach(item => {
              if (item.productId) {
                const productId = item.productId;
                const quantity = item.quantity || 1;
                productSalesCount.set(
                  productId, 
                  (productSalesCount.get(productId) || 0) + quantity
                );
              }
            });
          } else if (typeof items === 'object') {
            // Handle non-array objects
            Object.values(items).forEach((item: any) => {
              if (item.productId) {
                const productId = item.productId;
                const quantity = item.quantity || 1;
                productSalesCount.set(
                  productId, 
                  (productSalesCount.get(productId) || 0) + quantity
                );
              }
            });
          }
        } catch (e) {
          console.error("Error processing order items:", e);
        }
      });
      
      // Sort products by sales count
      const sortedProducts = [...productSalesCount.entries()]
        .sort((a, b) => b[1] - a[1]);
      
      // Get top 20% of products or at least top 10 products
      const totalProducts = sortedProducts.length;
      const topProductsCount = Math.max(
        Math.ceil(totalProducts * 0.2), // 20% of total products
        Math.min(10, totalProducts)     // At least 10 or all if fewer
      );
      
      const topSellingProductIds = sortedProducts
        .slice(0, topProductsCount)
        .map(entry => entry[0]);
      
      // Reset all bestseller flags
      await db.update(products)
        .set({ isBestSeller: false })
        .where(ne(products.id, -1)); // Update all products
      
      // Set bestseller flag for top selling products
      if (topSellingProductIds.length > 0) {
        await db.update(products)
          .set({ isBestSeller: true })
          .where(inArray(products.id, topSellingProductIds));
      }
    } catch (error) {
      console.error("Error updating bestseller products:", error);
    }
  }

  async updateOrderStatus(id: number, status: string): Promise<Order | undefined> {
    const [updatedOrder] = await db
      .update(orders)
      .set({ status })
      .where(eq(orders.id, id))
      .returning();
    return updatedOrder;
  }

  // Wishlist operations
  async getWishlistItems(userId: number): Promise<WishlistItem[]> {
    return db.select().from(wishlistItems).where(eq(wishlistItems.userId, userId));
  }

  async getWishlistItemsWithProducts(userId: number): Promise<(WishlistItem & { product: Product })[]> {
    const result = await db
      .select({
        wishlistItem: wishlistItems,
        product: products
      })
      .from(wishlistItems)
      .innerJoin(products, eq(wishlistItems.productId, products.id))
      .where(eq(wishlistItems.userId, userId));

    return result.map(({ wishlistItem, product }) => ({
      ...wishlistItem,
      product
    }));
  }

  async getWishlistItem(id: number): Promise<WishlistItem | undefined> {
    const [item] = await db.select().from(wishlistItems).where(eq(wishlistItems.id, id));
    return item;
  }

  async getWishlistItemByUserAndProduct(userId: number, productId: number): Promise<WishlistItem | undefined> {
    const [item] = await db
      .select()
      .from(wishlistItems)
      .where(
        and(
          eq(wishlistItems.userId, userId),
          eq(wishlistItems.productId, productId)
        )
      );
    return item;
  }

  async createWishlistItem(item: InsertWishlistItem): Promise<WishlistItem> {
    const [newItem] = await db.insert(wishlistItems).values(item).returning();
    return newItem;
  }

  async deleteWishlistItem(id: number): Promise<boolean> {
    const result = await db.delete(wishlistItems).where(eq(wishlistItems.id, id));
    return result.rowCount > 0;
  }

  // Currency operations
  async getCurrencies(): Promise<Currency[]> {
    // Currencies are not stored in the database, return the same hardcoded ones
    return [
      { code: "USD", name: "US Dollar", symbol: "$", rate: 1 },
      { code: "EUR", name: "Euro", symbol: "€", rate: 0.93 },
      { code: "GBP", name: "British Pound", symbol: "£", rate: 0.82 },
      { code: "JPY", name: "Japanese Yen", symbol: "¥", rate: 151.2 },
      { code: "CAD", name: "Canadian Dollar", symbol: "C$", rate: 1.38 },
      { code: "AUD", name: "Australian Dollar", symbol: "A$", rate: 1.52 },
      { code: "CNY", name: "Chinese Yuan", symbol: "¥", rate: 7.24 },
      { code: "INR", name: "Indian Rupee", symbol: "₹", rate: 83.42 },
    ];
  }
  
  // User Activity Tracking methods
  async recordUserActivity(activity: InsertUserActivity): Promise<UserActivity> {
    const [newActivity] = await db.insert(userActivity).values(activity).returning();
    return newActivity;
  }

  async getUserActivity(userId: number, limit?: number): Promise<UserActivity[]> {
    let query = db
      .select()
      .from(userActivity)
      .where(eq(userActivity.userId, userId))
      .orderBy(desc(userActivity.createdAt));
    
    if (limit) {
      query = query.limit(limit);
    }
    
    return query;
  }
  
  async getSessionActivity(sessionId: string, limit?: number): Promise<UserActivity[]> {
    let query = db
      .select()
      .from(userActivity)
      .where(eq(userActivity.sessionId, sessionId))
      .orderBy(desc(userActivity.createdAt));
    
    if (limit) {
      query = query.limit(limit);
    }
    
    return query;
  }
  
  async getProductViewHistory(userId: number, limit: number = 10): Promise<number[]> {
    // Query all view_product activities
    const activities = await db
      .select()
      .from(userActivity)
      .where(
        and(
          eq(userActivity.userId, userId),
          eq(userActivity.activityType, 'view_product')
        )
      )
      .orderBy(desc(userActivity.createdAt));
    
    // Extract unique product IDs
    const seen = new Set<number>();
    const productIds: number[] = [];
    
    for (const activity of activities) {
      const details = activity.details as any;
      const productId = details.productId;
      
      if (productId && !seen.has(productId)) {
        seen.add(productId);
        productIds.push(productId);
        
        if (productIds.length >= limit) {
          break;
        }
      }
    }
    
    return productIds;
  }
  
  async getSearchHistory(userId: number, limit: number = 10): Promise<string[]> {
    // Query all search activities
    const activities = await db
      .select()
      .from(userActivity)
      .where(
        and(
          eq(userActivity.userId, userId),
          eq(userActivity.activityType, 'search')
        )
      )
      .orderBy(desc(userActivity.createdAt));
    
    // Extract unique search queries
    const seen = new Set<string>();
    const queries: string[] = [];
    
    for (const activity of activities) {
      const details = activity.details as any;
      const query = details.query;
      
      if (query && !seen.has(query)) {
        seen.add(query);
        queries.push(query);
        
        if (queries.length >= limit) {
          break;
        }
      }
    }
    
    return queries;
  }
  
  // Product Review operations
  async getProductReviews(productId: number): Promise<ProductReview[]> {
    return db.select().from(productReviews).where(eq(productReviews.productId, productId)).orderBy(desc(productReviews.createdAt));
  }

  async getProductReviewsWithUser(productId: number): Promise<(ProductReview & { user: Pick<User, 'id' | 'username' | 'fullName'> })[]> {
    const result = await db.query.productReviews.findMany({
      where: eq(productReviews.productId, productId),
      orderBy: desc(productReviews.createdAt),
      with: {
        user: {
          columns: {
            id: true,
            username: true,
            fullName: true
          }
        }
      }
    });
    return result;
  }

  async getProductReview(id: number): Promise<ProductReview | undefined> {
    const [review] = await db.select().from(productReviews).where(eq(productReviews.id, id));
    return review || undefined;
  }

  async getUserProductReview(userId: number, productId: number): Promise<ProductReview | undefined> {
    const [review] = await db.select().from(productReviews).where(
      and(
        eq(productReviews.userId, userId),
        eq(productReviews.productId, productId)
      )
    );
    return review || undefined;
  }

  async createProductReview(review: InsertProductReview): Promise<ProductReview> {
    const [newReview] = await db.insert(productReviews).values(review).returning();
    
    // Update the product's average rating
    await this.updateProductRating(review.productId);
    
    return newReview;
  }

  async updateProductReview(id: number, reviewData: Partial<InsertProductReview>): Promise<ProductReview | undefined> {
    const [updatedReview] = await db.update(productReviews)
      .set(reviewData)
      .where(eq(productReviews.id, id))
      .returning();
    
    if (updatedReview) {
      // Update the product's average rating
      await this.updateProductRating(updatedReview.productId);
    }
    
    return updatedReview || undefined;
  }

  async deleteProductReview(id: number): Promise<boolean> {
    const [deletedReview] = await db.delete(productReviews)
      .where(eq(productReviews.id, id))
      .returning({ productId: productReviews.productId });
    
    if (deletedReview) {
      // Update the product's average rating
      await this.updateProductRating(deletedReview.productId);
      return true;
    }
    
    return false;
  }

  async getProductAverageRating(productId: number): Promise<number> {
    const result = await db.select({
      averageRating: sql`AVG(${productReviews.rating})`,
      count: sql`COUNT(*)`,
    }).from(productReviews).where(eq(productReviews.productId, productId));
    
    const average = result[0]?.averageRating as number | null;
    return average || 0;
  }

  private async updateProductRating(productId: number): Promise<void> {
    const avgRatingResult = await db.select({
      averageRating: sql`AVG(${productReviews.rating})`,
      count: sql`COUNT(*)`,
    }).from(productReviews).where(eq(productReviews.productId, productId));
    
    const average = avgRatingResult[0]?.averageRating as number | null;
    const count = avgRatingResult[0]?.count as number | null;
    
    if (average !== null && count !== null) {
      await db.update(products)
        .set({ 
          rating: average,
          reviewCount: count
        })
        .where(eq(products.id, productId));
    }
  }
}

export const storage = new DatabaseStorage();
