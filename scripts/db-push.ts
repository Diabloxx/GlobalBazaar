import { db } from "../server/db";
import { 
  users, 
  categories, 
  products, 
  cartItems, 
  orders, 
  wishlistItems 
} from "../shared/schema";
import { sql } from "drizzle-orm";

async function main() {
  console.log("🔄 Starting database schema push...");

  try {
    // Create tables if they don't exist
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "users" (
        "id" SERIAL PRIMARY KEY,
        "username" TEXT NOT NULL UNIQUE,
        "password" TEXT NOT NULL,
        "email" TEXT NOT NULL UNIQUE,
        "full_name" TEXT,
        "address" TEXT,
        "phone" TEXT,
        "created_at" TIMESTAMP DEFAULT NOW() NOT NULL
      );

      CREATE TABLE IF NOT EXISTS "categories" (
        "id" SERIAL PRIMARY KEY,
        "name" TEXT NOT NULL,
        "slug" TEXT NOT NULL UNIQUE,
        "description" TEXT,
        "image_url" TEXT,
        "icon" TEXT
      );

      CREATE TABLE IF NOT EXISTS "products" (
        "id" SERIAL PRIMARY KEY,
        "category_id" INTEGER NOT NULL,
        "name" TEXT NOT NULL,
        "slug" TEXT NOT NULL UNIQUE,
        "description" TEXT NOT NULL,
        "price" DOUBLE PRECISION NOT NULL,
        "sale_price" DOUBLE PRECISION,
        "discount" INTEGER,
        "image_url" TEXT NOT NULL,
        "inventory" INTEGER NOT NULL,
        "rating" DOUBLE PRECISION,
        "review_count" INTEGER,
        "featured" BOOLEAN DEFAULT FALSE,
        "is_sale" BOOLEAN DEFAULT FALSE,
        "is_new" BOOLEAN DEFAULT FALSE,
        "is_best_seller" BOOLEAN DEFAULT FALSE,
        "created_at" TIMESTAMP DEFAULT NOW() NOT NULL
      );

      CREATE TABLE IF NOT EXISTS "cart_items" (
        "id" SERIAL PRIMARY KEY,
        "user_id" INTEGER NOT NULL,
        "product_id" INTEGER NOT NULL,
        "quantity" INTEGER NOT NULL DEFAULT 1,
        "created_at" TIMESTAMP DEFAULT NOW() NOT NULL
      );

      CREATE TABLE IF NOT EXISTS "orders" (
        "id" SERIAL PRIMARY KEY,
        "user_id" INTEGER NOT NULL,
        "status" TEXT NOT NULL DEFAULT 'pending',
        "total_price" DOUBLE PRECISION NOT NULL,
        "currency" TEXT NOT NULL DEFAULT 'USD',
        "payment_method" TEXT NOT NULL,
        "shipping_address" TEXT NOT NULL,
        "items" JSONB NOT NULL,
        "created_at" TIMESTAMP DEFAULT NOW() NOT NULL
      );

      CREATE TABLE IF NOT EXISTS "wishlist_items" (
        "id" SERIAL PRIMARY KEY,
        "user_id" INTEGER NOT NULL,
        "product_id" INTEGER NOT NULL,
        "created_at" TIMESTAMP DEFAULT NOW() NOT NULL
      );
    `);

    console.log("✅ Schema created successfully");

    // Add sample data to the database
    await addSampleData();

    console.log("✅ Database initialized successfully");
  } catch (error) {
    console.error("❌ Error creating schema:", error);
    process.exit(1);
  }
}

async function addSampleData() {
  console.log("🔄 Adding sample data...");

  try {
    // Add a sample user
    const [user] = await db.insert(users).values({
      username: "demo",
      password: "password123",
      email: "demo@example.com",
      fullName: "Demo User"
    }).returning().onConflictDoNothing();

    console.log("✅ Added sample user");

    // Add sample categories
    const categoriesToAdd = [
      { name: "Electronics", slug: "electronics", description: "Electronic devices and gadgets", icon: "mobile-alt" },
      { name: "Fashion", slug: "fashion", description: "Clothing and accessories", icon: "tshirt" },
      { name: "Home & Garden", slug: "home-garden", description: "Products for your home", icon: "home" },
      { name: "Beauty", slug: "beauty", description: "Beauty and personal care", icon: "heartbeat" },
      { name: "Sports", slug: "sports", description: "Sports equipment and accessories", icon: "football-ball" },
      { name: "Toys & Games", slug: "toys-games", description: "Toys and games for all ages", icon: "puzzle-piece" }
    ];

    await db.insert(categories).values(categoriesToAdd).onConflictDoNothing();
    console.log("✅ Added sample categories");

    // Add sample products
    const productsToAdd = [
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

    await db.insert(products).values(productsToAdd).onConflictDoNothing();
    console.log("✅ Added sample products");
  } catch (error) {
    console.error("❌ Error adding sample data:", error);
    throw error;
  }
}

main()
  .then(() => {
    console.log("✅ Database setup complete!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Database setup failed:", error);
    process.exit(1);
  });