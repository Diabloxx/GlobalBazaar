import { 
  users, type User, type InsertUser,
  categories, type Category, type InsertCategory,
  products, type Product, type InsertProduct,
  cartItems, type CartItem, type InsertCartItem,
  orders, type Order, type InsertOrder,
  wishlistItems, type WishlistItem, type InsertWishlistItem,
  Currency, currencySchema
} from "@shared/schema";
import { db } from "./db";
import { eq, like, and, or, desc, inArray, ne } from "drizzle-orm";

// Interface for storage operations
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<InsertUser>): Promise<User | undefined>;
  
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
  searchProducts(query: string): Promise<Product[]>;
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
}

// In-memory storage implementation
export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private categories: Map<number, Category>;
  private products: Map<number, Product>;
  private cartItems: Map<number, CartItem>;
  private orders: Map<number, Order>;
  private wishlistItems: Map<number, WishlistItem>;
  private currencies: Currency[];
  
  private userIdCounter: number;
  private categoryIdCounter: number;
  private productIdCounter: number;
  private cartItemIdCounter: number;
  private orderIdCounter: number;
  private wishlistItemIdCounter: number;
  
  constructor() {
    this.users = new Map();
    this.categories = new Map();
    this.products = new Map();
    this.cartItems = new Map();
    this.orders = new Map();
    this.wishlistItems = new Map();
    
    this.userIdCounter = 1;
    this.categoryIdCounter = 1;
    this.productIdCounter = 1;
    this.cartItemIdCounter = 1;
    this.orderIdCounter = 1;
    this.wishlistItemIdCounter = 1;
    
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

  async searchProducts(query: string): Promise<Product[]> {
    const searchPattern = `%${query}%`;
    return db
      .select()
      .from(products)
      .where(
        or(
          like(products.name, searchPattern),
          like(products.description, searchPattern)
        )
      );
  }

  async createProduct(product: InsertProduct): Promise<Product> {
    const [newProduct] = await db.insert(products).values(product).returning();
    return newProduct;
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
}

export const storage = new DatabaseStorage();
