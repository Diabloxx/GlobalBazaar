import { db } from "./server/db";
import { sellerTutorialSteps } from "./shared/schema";

async function addTutorialSteps() {
  console.log("Adding tutorial steps...");
  
  // Check if steps already exist
  const existingSteps = await db.select().from(sellerTutorialSteps);
  if (existingSteps.length > 0) {
    console.log(`Found ${existingSteps.length} existing tutorial steps. Skipping.`);
    return;
  }

  // Step 1: Welcome & Overview
  await db.insert(sellerTutorialSteps).values({
    title: "Welcome to Seller Program",
    description: "Introduction to our seller marketplace and program benefits",
    order: 1,
    category: "Getting Started",
    isRequired: true,
    estimatedTime: "5 minutes",
    imageUrl: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80"
  });

  // Step 2: Account Setup
  await db.insert(sellerTutorialSteps).values({
    title: "Complete Your Seller Profile",
    description: "Enhance your profile to build customer trust and boost sales",
    order: 2,
    category: "Getting Started",
    isRequired: true,
    estimatedTime: "10 minutes",
    imageUrl: "https://images.unsplash.com/photo-1508873535684-277a3cbcc4e8?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80"
  });

  // Step 3: Connect Payment Methods
  await db.insert(sellerTutorialSteps).values({
    title: "Connect Payment Methods",
    description: "Set up your Stripe account to receive payments from customers",
    order: 3,
    category: "Getting Started",
    isRequired: true,
    estimatedTime: "15 minutes",
    imageUrl: "https://images.unsplash.com/photo-1580508174046-170816f65662?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80"
  });

  // Step 4: Adding Your First Product
  await db.insert(sellerTutorialSteps).values({
    title: "Add Your First Product",
    description: "Learn how to create compelling product listings that sell",
    order: 4,
    category: "Product Management",
    isRequired: true,
    estimatedTime: "20 minutes",
    imageUrl: "https://images.unsplash.com/photo-1526570207772-784d36084510?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80"
  });

  // Step 5: Product Photography Tips
  await db.insert(sellerTutorialSteps).values({
    title: "Product Photography Tips",
    description: "Create professional product photos that convert browsers to buyers",
    order: 5,
    category: "Product Management",
    isRequired: false,
    estimatedTime: "15 minutes",
    imageUrl: "https://images.unsplash.com/photo-1542038784456-1ea8e935640e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80"
  });

  // Step 6: Writing Effective Descriptions
  await db.insert(sellerTutorialSteps).values({
    title: "Write Effective Descriptions",
    description: "Craft product descriptions that highlight benefits and drive sales",
    order: 6,
    category: "Product Management",
    isRequired: false,
    estimatedTime: "10 minutes",
    imageUrl: "https://images.unsplash.com/photo-1455390582262-044cdead277a?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1173&q=80"
  });

  // Step 7: Pricing Strategies
  await db.insert(sellerTutorialSteps).values({
    title: "Pricing Strategies",
    description: "Learn effective pricing strategies to maximize your profit margins",
    order: 7,
    category: "Business",
    isRequired: true,
    estimatedTime: "15 minutes",
    imageUrl: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1011&q=80"
  });

  // Step 8: Shipping and Fulfillment
  await db.insert(sellerTutorialSteps).values({
    title: "Shipping and Fulfillment",
    description: "Set up efficient shipping processes to keep customers happy",
    order: 8,
    category: "Operations",
    isRequired: true,
    estimatedTime: "20 minutes",
    imageUrl: "https://images.unsplash.com/photo-1566576721346-d4a3b4eaeb55?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=765&q=80"
  });

  // Step 9: Managing Orders
  await db.insert(sellerTutorialSteps).values({
    title: "Managing Orders",
    description: "Process orders quickly and efficiently using our seller dashboard",
    order: 9,
    category: "Operations",
    isRequired: true,
    estimatedTime: "10 minutes",
    imageUrl: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1115&q=80"
  });

  // Step 10: Customer Service Excellence
  await db.insert(sellerTutorialSteps).values({
    title: "Customer Service Excellence",
    description: "Provide outstanding customer service to earn repeat business",
    order: 10,
    category: "Business",
    isRequired: true,
    estimatedTime: "15 minutes",
    imageUrl: "https://images.unsplash.com/photo-1565557623262-b51c2513a641?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1071&q=80"
  });

  console.log("Tutorial steps added successfully!");
}

// Run the function
addTutorialSteps()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error adding tutorial steps:", error);
    process.exit(1);
  });