import { db } from "./server/db";
import { sql } from "drizzle-orm";
import { sellerTutorialSteps } from "./shared/schema";

async function updateTutorialSchema() {
  console.log("Updating tutorial schema...");
  
  try {
    // Check if content column exists
    try {
      await db.execute(sql`SELECT content FROM seller_tutorial_steps LIMIT 1`);
      console.log("Content column already exists.");
    } catch (error) {
      // Add content column
      console.log("Adding content column to seller_tutorial_steps...");
      await db.execute(sql`ALTER TABLE seller_tutorial_steps ADD COLUMN IF NOT EXISTS content TEXT NOT NULL DEFAULT '<p>Tutorial content will be added soon.</p>'`);
    }
    
    // Check if estimatedTimeMinutes column exists
    try {
      await db.execute(sql`SELECT estimated_time_minutes FROM seller_tutorial_steps LIMIT 1`);
      console.log("estimated_time_minutes column already exists.");
    } catch (error) {
      // Add estimatedTimeMinutes column
      console.log("Adding estimated_time_minutes column to seller_tutorial_steps...");
      await db.execute(sql`ALTER TABLE seller_tutorial_steps ADD COLUMN IF NOT EXISTS estimated_time_minutes INTEGER`);
    }
    
    // Check if prerequisites column exists
    try {
      await db.execute(sql`SELECT prerequisites FROM seller_tutorial_steps LIMIT 1`);
      console.log("prerequisites column already exists.");
    } catch (error) {
      // Add prerequisites column
      console.log("Adding prerequisites column to seller_tutorial_steps...");
      await db.execute(sql`ALTER TABLE seller_tutorial_steps ADD COLUMN IF NOT EXISTS prerequisites JSONB`);
    }
    
    // Update existing tutorial steps with content
    console.log("Updating existing tutorial steps with content...");
    
    const steps = await db.select().from(sellerTutorialSteps);
    
    for (const step of steps) {
      const content = getContentForStep(step.id, step.title);
      
      await db.execute(sql`
        UPDATE seller_tutorial_steps 
        SET content = ${content},
            estimated_time_minutes = ${getEstimatedTimeMinutes(step.estimatedTime || '')}
        WHERE id = ${step.id}
      `);
    }
    
    console.log("Schema updated successfully!");
  } catch (error) {
    console.error("Error updating schema:", error);
  }
}

function getEstimatedTimeMinutes(timeStr: string): number {
  if (!timeStr) return 10;
  
  const match = timeStr.match(/(\d+)/);
  if (match) {
    return parseInt(match[1], 10);
  }
  
  return 10; // Default to 10 minutes
}

function getContentForStep(id: number, title: string): string {
  // Generate some content based on step ID
  const contentMap: Record<number, string> = {
    1: `<p>Welcome to our seller program! We're excited to have you join our growing marketplace.</p>
       <p>As a seller on our platform, you'll have access to:</p>
       <ul>
         <li>Millions of potential customers</li>
         <li>Powerful tools to manage your inventory</li>
         <li>Simple shipping and order processing</li>
         <li>Transparent fees and easy payout options</li>
       </ul>
       <p>This tutorial will guide you through everything you need to know to get started and become a successful seller on our platform.</p>`,
    
    2: `<p>A complete and detailed seller profile helps build trust with potential customers and increases your chances of making sales.</p>
       <p>Here's what you should include in your profile:</p>
       <ul>
         <li>A professional profile picture or logo</li>
         <li>A detailed business description</li>
         <li>Your business location</li>
         <li>Contact information</li>
         <li>Shipping and return policies</li>
       </ul>
       <p>Remember, customers are more likely to purchase from sellers they feel they can trust!</p>`,
    
    3: `<p>Setting up your payment methods is essential to start receiving payments from customers.</p>
       <p>Our platform uses Stripe for secure payment processing. Here's how to set it up:</p>
       <ol>
         <li>Go to your Seller Dashboard and click on "Payment Settings"</li>
         <li>Click "Connect with Stripe"</li>
         <li>Follow the prompts to create or connect your Stripe account</li>
         <li>Set up your bank account information for payouts</li>
       </ol>
       <p>Once your Stripe account is connected, you'll automatically receive payments when customers purchase your products.</p>`,
    
    4: `<p>Creating compelling product listings is key to your success as a seller. Follow these guidelines to create listings that stand out:</p>
       <ol>
         <li>Use high-quality photos showing your product from multiple angles</li>
         <li>Write detailed, accurate product descriptions</li>
         <li>Include all relevant specifications (size, weight, color options, etc.)</li>
         <li>Set competitive prices based on market research</li>
         <li>Use appropriate categories and tags to help customers find your products</li>
       </ol>
       <p>To add your first product:</p>
       <ol>
         <li>Go to your Seller Dashboard</li>
         <li>Click "Products" > "Add New Product"</li>
         <li>Fill out all the required information</li>
         <li>Upload your product photos</li>
         <li>Click "Save" to publish your listing</li>
       </ol>`,
    
    5: `<p>Great product photos can make a huge difference in your sales. Here are some tips for taking professional-looking photos:</p>
       <ul>
         <li>Use natural lighting whenever possible</li>
         <li>Keep backgrounds clean and neutral</li>
         <li>Show the product from multiple angles</li>
         <li>Include close-ups to show details and texture</li>
         <li>Show the product in use (if applicable)</li>
         <li>Maintain consistent style across all product photos</li>
       </ul>
       <p>You don't need expensive equipment - many modern smartphones can take excellent product photos when used correctly.</p>`,
    
    6: `<p>Effective product descriptions help customers make purchasing decisions and reduce returns. Here's how to write descriptions that sell:</p>
       <ul>
         <li>Start with a compelling headline</li>
         <li>Focus on benefits, not just features</li>
         <li>Use bullet points for easy scanning</li>
         <li>Include all relevant specifications</li>
         <li>Address potential questions or concerns</li>
         <li>Use keywords naturally to improve searchability</li>
       </ul>
       <p>Example structure:</p>
       <ol>
         <li>Opening paragraph: Overview and key selling points</li>
         <li>Bullet points: Features and benefits</li>
         <li>Detailed description: More information about materials, use cases, etc.</li>
         <li>Technical specifications: Dimensions, weight, materials, etc.</li>
         <li>Closing: Call to action encouraging purchase</li>
       </ol>`,
    
    7: `<p>Setting the right price for your products is crucial for maximizing sales and profits. Consider these factors when pricing your products:</p>
       <ul>
         <li>Cost of goods: What you paid for the item</li>
         <li>Platform fees: Our 20% commission on sales</li>
         <li>Shipping costs: What it costs to ship to customers</li>
         <li>Competitor pricing: What similar products sell for</li>
         <li>Perceived value: What customers are willing to pay</li>
       </ul>
       <p>Common pricing strategies:</p>
       <ul>
         <li><strong>Competitive pricing:</strong> Setting prices based on what competitors charge</li>
         <li><strong>Value-based pricing:</strong> Setting prices based on the perceived value to customers</li>
         <li><strong>Cost-plus pricing:</strong> Adding a fixed percentage to your costs</li>
         <li><strong>Premium pricing:</strong> Setting higher prices to suggest higher quality</li>
       </ul>`,
    
    8: `<p>Efficient shipping processes keep customers happy and coming back. Here's how to set up your shipping:</p>
       <ol>
         <li>Define your shipping policies (processing time, carriers, regions served)</li>
         <li>Calculate shipping costs accurately</li>
         <li>Consider offering free shipping (built into product price)</li>
         <li>Prepare packaging materials that protect products during transit</li>
         <li>Create a streamlined process for fulfilling orders quickly</li>
       </ol>
       <p>Tips for successful fulfillment:</p>
       <ul>
         <li>Process orders within 1-2 business days</li>
         <li>Always provide tracking information</li>
         <li>Use appropriate packaging to prevent damage</li>
         <li>Include a thank you note or promotional material</li>
         <li>Follow up with customers after delivery</li>
       </ul>`,
    
    9: `<p>Managing orders efficiently is key to maintaining good customer relations and reviews. Follow these steps for each new order:</p>
       <ol>
         <li>Receive order notification</li>
         <li>Verify inventory availability</li>
         <li>Process payment (automatic through our platform)</li>
         <li>Pack the item carefully</li>
         <li>Ship the package</li>
         <li>Upload tracking information</li>
         <li>Send shipment notification to customer</li>
       </ol>
       <p>You can manage all your orders through the Seller Dashboard:</p>
       <ul>
         <li>View new orders in the "Orders" tab</li>
         <li>Update order status as you process them</li>
         <li>Communicate with customers through the messaging system</li>
         <li>Handle returns and refunds when necessary</li>
       </ul>`,
    
    10: `<p>Excellent customer service leads to positive reviews, repeat customers, and growth for your business. Follow these best practices:</p>
        <ul>
          <li>Respond to customer inquiries within 24 hours</li>
          <li>Be professional and courteous in all communications</li>
          <li>Provide accurate information about products and shipping</li>
          <li>Handle issues and complaints professionally</li>
          <li>Follow up after purchases to ensure satisfaction</li>
        </ul>
        <p>When dealing with difficult situations:</p>
        <ul>
          <li>Listen to the customer's concerns</li>
          <li>Acknowledge the issue</li>
          <li>Offer a fair solution</li>
          <li>Follow through on your promises</li>
          <li>Learn from each experience to improve your business</li>
        </ul>`
  };
  
  // Return specific content if available, otherwise return a generic message
  return contentMap[id] || `<p>Content for "${title}" will be available soon.</p>`;
}

// Run the function
updateTutorialSchema()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error:", error);
    process.exit(1);
  });