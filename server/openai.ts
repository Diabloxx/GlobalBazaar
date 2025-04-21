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
    
    // Check if OpenAI API key is available and valid
    if (!process.env.OPENAI_API_KEY) {
      console.log("No OpenAI API key found, using fallback recommendations");
      return getFallbackRecommendations(query, availableProducts, categoryId);
    }
    
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

    try {
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
        max_tokens: 400, // Limit token usage to avoid rate limits
      });
  
      return {
        message: response.choices[0].message.content,
        recommendedProducts: getRecommendedProductIds(
          response.choices[0].message.content || "",
          availableProducts
        )
      };
    } catch (openaiError) {
      console.error("OpenAI API error:", openaiError);
      // Use our fallback recommendation system if OpenAI API fails
      return getFallbackRecommendations(query, availableProducts, categoryId);
    }
  } catch (error) {
    console.error("Error in recommendation process:", error);
    // Return fallback recommendations instead of throwing error
    return getFallbackRecommendations(query, availableProducts, categoryId);
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

// Get fallback recommendations when OpenAI API is unavailable
export function getFallbackRecommendations(
  query: string,
  availableProducts: any[],
  categoryId?: number
) {
  console.log("Using fallback recommendations");
  
  // Extract keywords from query
  const keywords = query.toLowerCase().split(/\s+/).filter(word => 
    word.length > 3 && 
    !['what', 'when', 'where', 'which', 'with', 'would', 'that', 'this', 'these', 'those', 'have', 'should', 'could', 'about'].includes(word)
  );
  
  // Score products based on relevance to keywords and category
  const scoredProducts = availableProducts.map(product => {
    let score = 0;
    
    // Match by category
    if (categoryId && product.categoryId === categoryId) {
      score += 10;
    }
    
    // Match by keywords in name
    for (const keyword of keywords) {
      if (product.name.toLowerCase().includes(keyword)) {
        score += 5;
      }
      
      // Match by keywords in description
      if (product.description && product.description.toLowerCase().includes(keyword)) {
        score += 3;
      }
    }
    
    // Bonus for featured products
    if (product.isFeatured) {
      score += 2;
    }
    
    // Bonus for products on sale
    if (product.isSale) {
      score += 1;
    }
    
    return {
      id: product.id,
      score
    };
  });
  
  // Sort by score (descending) and take top 5
  const recommendedIds = scoredProducts
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .map(item => item.id);
  
  return {
    message: `Here are some products that might match your search for "${query}"`,
    recommendedProducts: recommendedIds
  };
}

// Function to analyze user message and return shopping interests
export async function analyzeUserInterests(userMessage: string) {
  // Check if OpenAI API key is available and valid
  if (!process.env.OPENAI_API_KEY) {
    console.log("No OpenAI API key found, using basic interest extraction");
    return getBasicInterests(userMessage);
  }
  
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
      max_tokens: 300, // Limit token usage
    });

    const content = response.choices[0].message.content;
    if (!content) {
      return { interests: [], priceRange: null, categories: [] };
    }

    return JSON.parse(content);
  } catch (error) {
    console.error("Error analyzing user interests:", error);
    // Return basic interests extracted from text when OpenAI fails
    return getBasicInterests(userMessage);
  }
}

// Basic interest extraction when OpenAI is unavailable
function getBasicInterests(userMessage: string) {
  // Extract potential interests from the message (basic NLP)
  const message = userMessage.toLowerCase();
  const interests = [];
  
  // Extract categories
  const categories = [];
  const categoryKeywords = {
    'electronics': ['electronics', 'tech', 'gadget', 'phone', 'laptop', 'computer', 'smart', 'device'],
    'clothing': ['clothing', 'fashion', 'wear', 'dress', 'shirt', 'pants', 'shoes', 'jacket', 'apparel'],
    'home': ['home', 'furniture', 'decor', 'kitchen', 'bedroom', 'bathroom', 'living', 'decoration'],
    'health': ['health', 'fitness', 'workout', 'exercise', 'vitamin', 'supplement', 'wellness'],
    'beauty': ['beauty', 'cosmetic', 'makeup', 'skincare', 'haircare', 'perfume', 'fragrance']
  };
  
  // Look for category matches
  for (const [category, keywords] of Object.entries(categoryKeywords)) {
    for (const keyword of keywords) {
      if (message.includes(keyword)) {
        categories.push(category);
        interests.push(keyword);
        break;
      }
    }
  }
  
  // Extract price range
  let priceRange = null;
  const priceMatches = message.match(/(\$|usd|dollar)?\s?(\d+)(\s?(to|-)\s?(\$|usd|dollar)?\s?(\d+))?/i);
  if (priceMatches && priceMatches[2]) {
    const min = parseInt(priceMatches[2], 10);
    let max = min * 2; // Default max if only one price mentioned
    
    if (priceMatches[6]) {
      max = parseInt(priceMatches[6], 10);
    }
    
    priceRange = { min, max };
  }
  
  return {
    interests: [...new Set(interests)],
    priceRange,
    categories: [...new Set(categories)]
  };
}