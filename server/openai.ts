import OpenAI from "openai";

// Initialize the OpenAI client
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const DEFAULT_MODEL = "gpt-4o";

type ProductRecommendationParams = {
  query: string;
  userPreferences?: string[];
  priceRange?: { min: number; max: number };
  categoryId?: number;
  browsedProducts?: number[];
};

export async function getProductRecommendations(
  params: ProductRecommendationParams,
  availableProducts: any[]
) {
  try {
    const { query, userPreferences = [], priceRange, categoryId, browsedProducts = [] } = params;
    
    // Format the context for the AI
    let context = `You are an AI shopping assistant for our e-commerce platform.`;
    
    if (userPreferences.length > 0) {
      context += ` The user has shown interest in: ${userPreferences.join(", ")}.`;
    }
    
    if (browsedProducts.length > 0) {
      const browsedProductsInfo = browsedProducts
        .map(id => {
          const product = availableProducts.find(p => p.id === id);
          return product ? `${product.name} (${product.price})` : null;
        })
        .filter(Boolean)
        .join(", ");
      
      if (browsedProductsInfo) {
        context += ` The user has recently viewed: ${browsedProductsInfo}.`;
      }
    }
    
    if (priceRange) {
      context += ` The user is looking for products between $${priceRange.min} and $${priceRange.max}.`;
    }
    
    if (categoryId) {
      context += ` The user is interested in category ID: ${categoryId}.`;
    }

    // Send prompt to OpenAI
    const response = await openai.chat.completions.create({
      model: DEFAULT_MODEL,
      messages: [
        {
          role: "system",
          content: context,
        },
        {
          role: "user",
          content: query,
        }
      ],
      temperature: 0.7,
      max_tokens: 500,
    });

    return {
      message: response.choices[0].message.content,
      recommendedProducts: getRecommendedProductIds(
        response.choices[0].message.content || "",
        availableProducts
      )
    };
  } catch (error) {
    console.error("Error getting AI recommendations:", error);
    throw new Error("Failed to get AI recommendations");
  }
}

// Helper function to parse product IDs from AI response
function getRecommendedProductIds(aiResponse: string, availableProducts: any[]) {
  const recommendedProducts = [];
  
  // Simple heuristic to find product mentions
  for (const product of availableProducts) {
    // Check if the product name is mentioned in the AI response
    if (aiResponse.toLowerCase().includes(product.name.toLowerCase())) {
      recommendedProducts.push(product.id);
    }
  }
  
  // If no direct matches, recommend top products or products in the same category
  if (recommendedProducts.length === 0) {
    // Get some default recommendations
    const topRatedProducts = [...availableProducts]
      .sort((a, b) => (b.rating || 0) - (a.rating || 0))
      .slice(0, 3);
      
    return topRatedProducts.map(p => p.id);
  }
  
  return recommendedProducts;
}

// Function to analyze user message and return shopping interests
export async function analyzeUserInterests(userMessage: string) {
  try {
    const response = await openai.chat.completions.create({
      model: DEFAULT_MODEL,
      messages: [
        {
          role: "system",
          content: "Extract key shopping interests, preferences, price range, and any specific product categories from the following user message. Respond with a JSON object with keys: interests (array of strings), priceRange (object with min and max if mentioned), and categories (array of strings).",
        },
        {
          role: "user",
          content: userMessage,
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
    });

    const content = response.choices[0].message.content;
    if (!content) {
      return { interests: [], priceRange: null, categories: [] };
    }

    return JSON.parse(content);
  } catch (error) {
    console.error("Error analyzing user interests:", error);
    return { interests: [], priceRange: null, categories: [] };
  }
}