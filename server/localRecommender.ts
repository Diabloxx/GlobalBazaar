import { Product } from "@shared/schema";

// Simple in-memory storage for our recommendation engine
class RecommendationEngine {
  // Keyword weight map - stores how important each keyword is
  private keywordWeights: Map<string, number> = new Map();
  
  // Product keyword relevance - stores which keywords are most relevant to which products
  private productKeywords: Map<number, Map<string, number>> = new Map();
  
  // Category relevance to keywords
  private categoryKeywords: Map<number, Set<string>> = new Map();
  
  // User preferences map (userId -> keywords)
  private userPreferences: Map<number, Map<string, number>> = new Map();
  
  // Session preferences map (sessionId -> keywords)
  private sessionPreferences: Map<string, Map<string, number>> = new Map();
  
  // Cache for common queries
  private queryCache: Map<string, number[]> = new Map();
  
  constructor() {
    // Initialize with some default weights
    const defaultKeywords = [
      "electronics", "smartphone", "laptop", "camera", "headphones", 
      "clothing", "shoes", "fashion", "apparel", "accessories",
      "home", "kitchen", "furniture", "decor", "appliances",
      "toys", "games", "outdoor", "sports", "fitness"
    ];
    
    defaultKeywords.forEach(keyword => {
      this.keywordWeights.set(keyword, 1.0);
    });
  }
  
  // Initialize product keywords based on product data
  public initializeProducts(products: Product[]): void {
    products.forEach(product => {
      this.extractProductKeywords(product);
    });
    
    console.log(`Initialized recommendation engine with ${products.length} products`);
  }
  
  // Extract keywords from a product and add them to our index
  private extractProductKeywords(product: Product): void {
    const keywords = new Map<string, number>();
    
    // Extract keywords from product name (most important)
    const nameWords = this.extractKeywords(product.name);
    nameWords.forEach(word => {
      keywords.set(word, (keywords.get(word) || 0) + 2.0);
    });
    
    // Extract keywords from product description
    if (product.description) {
      const descWords = this.extractKeywords(product.description);
      descWords.forEach(word => {
        keywords.set(word, (keywords.get(word) || 0) + 1.0);
      });
    }
    
    // Store in our index
    this.productKeywords.set(product.id, keywords);
    
    // Add to category keywords if this is a new category
    if (product.categoryId && !this.categoryKeywords.has(product.categoryId)) {
      this.categoryKeywords.set(product.categoryId, new Set(keywords.keys()));
    } else if (product.categoryId) {
      // Update existing category keywords
      const categoryKeywords = this.categoryKeywords.get(product.categoryId)!;
      keywords.forEach((_, keyword) => {
        categoryKeywords.add(keyword);
      });
    }
  }
  
  // Extract meaningful keywords from text
  private extractKeywords(text: string): string[] {
    // Convert to lowercase and remove special characters
    const normalized = text.toLowerCase().replace(/[^\w\s]/g, ' ');
    
    // Split into words
    const words = normalized.split(/\s+/).filter(w => w.length >= 3);
    
    // Remove common stop words
    const stopWords = new Set([
      'the', 'and', 'for', 'with', 'this', 'that', 'you', 'not', 'have', 'are', 
      'from', 'your', 'they', 'will', 'would', 'could', 'should', 'what', 'which'
    ]);
    
    return words.filter(word => !stopWords.has(word));
  }
  
  // Process a new search query and learn from it
  public processQuery(query: string, userId?: number, sessionId?: string): void {
    const queryKeywords = this.extractKeywords(query);
    
    // Boost these keywords in our global weights
    queryKeywords.forEach(keyword => {
      const currentWeight = this.keywordWeights.get(keyword) || 0;
      this.keywordWeights.set(keyword, currentWeight + 0.1);
    });
    
    // Update user preferences if we have a user ID
    if (userId) {
      if (!this.userPreferences.has(userId)) {
        this.userPreferences.set(userId, new Map());
      }
      
      const userPrefs = this.userPreferences.get(userId)!;
      queryKeywords.forEach(keyword => {
        const currentWeight = userPrefs.get(keyword) || 0;
        userPrefs.set(keyword, currentWeight + 0.5);
      });
    }
    
    // Update session preferences
    if (sessionId) {
      if (!this.sessionPreferences.has(sessionId)) {
        this.sessionPreferences.set(sessionId, new Map());
      }
      
      const sessionPrefs = this.sessionPreferences.get(sessionId)!;
      queryKeywords.forEach(keyword => {
        const currentWeight = sessionPrefs.get(keyword) || 0;
        sessionPrefs.set(keyword, currentWeight + 0.5);
      });
    }
    
    // Clear the query cache for this specific query
    this.queryCache.delete(query.toLowerCase());
  }
  
  // Record when a user views a product
  public recordProductView(productId: number, userId?: number, sessionId?: string): void {
    if (!this.productKeywords.has(productId)) {
      return;
    }
    
    const productKeywords = this.productKeywords.get(productId)!;
    
    // Update user preferences if we have a user ID
    if (userId) {
      if (!this.userPreferences.has(userId)) {
        this.userPreferences.set(userId, new Map());
      }
      
      const userPrefs = this.userPreferences.get(userId)!;
      productKeywords.forEach((weight, keyword) => {
        const currentWeight = userPrefs.get(keyword) || 0;
        userPrefs.set(keyword, currentWeight + 0.3);
      });
    }
    
    // Update session preferences
    if (sessionId) {
      if (!this.sessionPreferences.has(sessionId)) {
        this.sessionPreferences.set(sessionId, new Map());
      }
      
      const sessionPrefs = this.sessionPreferences.get(sessionId)!;
      productKeywords.forEach((weight, keyword) => {
        const currentWeight = sessionPrefs.get(keyword) || 0;
        sessionPrefs.set(keyword, currentWeight + 0.3);
      });
    }
  }
  
  // Get recommendations based on a query
  public getRecommendations(
    query: string, 
    products: Product[], 
    categoryId?: number,
    userId?: number,
    sessionId?: string,
    limit: number = 10
  ): {products: number[], explanation: string} {
    // Check if we have a cached result
    const cacheKey = `${query.toLowerCase()}_${categoryId || ''}_${userId || ''}_${sessionId || ''}`;
    if (this.queryCache.has(cacheKey)) {
      return {
        products: this.queryCache.get(cacheKey)!,
        explanation: `Here are recommendations based on your search for "${query}"`
      };
    }
    
    // Extract keywords from the query
    const queryKeywords = this.extractKeywords(query);
    
    // If no keywords, return bestsellers or featured products
    if (queryKeywords.length === 0) {
      const featuredIds = products
        .filter(p => p.isFeatured)
        .map(p => p.id)
        .slice(0, limit);
      
      return {
        products: featuredIds,
        explanation: "Here are some featured products you might like"
      };
    }
    
    // Score each product
    const productScores: {id: number, score: number}[] = products.map(product => {
      let score = 0;
      
      // Match by category
      if (categoryId && product.categoryId === categoryId) {
        score += 10;
      }
      
      // Get product keywords
      const productKeywords = this.productKeywords.get(product.id);
      
      if (!productKeywords) {
        return { id: product.id, score };
      }
      
      // Match query keywords to product keywords
      queryKeywords.forEach(queryKeyword => {
        const keywordWeight = this.keywordWeights.get(queryKeyword) || 1.0;
        const productKeywordScore = productKeywords.get(queryKeyword) || 0;
        
        score += keywordWeight * productKeywordScore;
      });
      
      // Boost score based on user preferences
      if (userId && this.userPreferences.has(userId)) {
        const userPrefs = this.userPreferences.get(userId)!;
        
        productKeywords.forEach((productKeywordScore, keyword) => {
          const userPrefScore = userPrefs.get(keyword) || 0;
          score += userPrefScore * productKeywordScore * 0.2;
        });
      }
      
      // Boost score based on session preferences
      if (sessionId && this.sessionPreferences.has(sessionId)) {
        const sessionPrefs = this.sessionPreferences.get(sessionId)!;
        
        productKeywords.forEach((productKeywordScore, keyword) => {
          const sessionPrefScore = sessionPrefs.get(keyword) || 0;
          score += sessionPrefScore * productKeywordScore * 0.3;
        });
      }
      
      // Add bonus for featured and bestseller products
      if (product.featured) score += 3;
      if (product.isBestSeller) score += 5;
      if (product.isNew) score += 2;
      if (product.isSale) score += 1;
      
      return { id: product.id, score };
    });
    
    // Sort by score (descending)
    productScores.sort((a, b) => b.score - a.score);
    
    // Get top N product IDs
    const recommendedIds = productScores
      .slice(0, limit)
      .map(item => item.id);
    
    // Cache the result
    this.queryCache.set(cacheKey, recommendedIds);
    
    return {
      products: recommendedIds,
      explanation: `Here are recommendations based on your search for "${query}"`
    };
  }
  
  // Clear all recommendation data
  public reset(): void {
    this.keywordWeights.clear();
    this.productKeywords.clear();
    this.categoryKeywords.clear();
    this.userPreferences.clear();
    this.sessionPreferences.clear();
    this.queryCache.clear();
  }
}

// Create a singleton instance
const recommender = new RecommendationEngine();

export default recommender;