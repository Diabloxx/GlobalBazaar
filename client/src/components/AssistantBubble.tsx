import { useState, useEffect, useRef } from "react";
import { MessageCircleMore, X, SendHorizontal, ShoppingBag } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { apiRequest } from "@/lib/queryClient";

type Message = {
  id: string;
  content: string;
  sender: "user" | "assistant";
  timestamp: Date;
};

type RecommendedProduct = {
  id: number;
  name: string;
  imageUrl: string;
  price: number;
  salePrice: number | null;
  slug: string;
};

export function AssistantBubble() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      content: "Hi there! I'm your shopping assistant. How can I help you find the perfect products today?",
      sender: "assistant",
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [recommendedProducts, setRecommendedProducts] = useState<RecommendedProduct[]>([]);
  const [browsedProducts, setBrowsedProducts] = useState<number[]>([]);
  const { toast } = useToast();
  const { user } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Get browsing history from local storage
  useEffect(() => {
    const storedHistory = localStorage.getItem("browsedProducts");
    if (storedHistory) {
      try {
        const history = JSON.parse(storedHistory);
        if (Array.isArray(history)) {
          setBrowsedProducts(history.slice(0, 5)); // Get last 5 viewed products
        }
      } catch (error) {
        console.error("Error parsing browsing history:", error);
      }
    }
  }, []);

  // Scroll to bottom of chat on new messages
  useEffect(() => {
    if (messagesEndRef.current && isOpen) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 200);
    }
  }, [isOpen]);

  // Handle form submission
  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!inputValue.trim()) return;

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue,
      sender: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);

    try {
      // Get AI recommendations
      const response = await apiRequest("POST", "/api/ai/recommend", {
        query: userMessage.content,
        browsedProducts,
        userPreferences: user?.role === "customer" ? [] : undefined,
      });

      const data = await response.json();

      // Add assistant response
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: data.message || "I couldn't find any recommendations. Please try again.",
        sender: "assistant",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
      
      // Set recommended products
      if (data.products && Array.isArray(data.products)) {
        setRecommendedProducts(data.products);
      }
    } catch (error) {
      console.error("Error getting recommendations:", error);
      
      // Add error message
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: "Sorry, I couldn't process your request. Please try again later.",
        sender: "assistant",
        timestamp: new Date(),
      };
      
      setMessages((prev) => [...prev, errorMessage]);
      
      toast({
        variant: "destructive",
        title: "Recommendation Error",
        description: "Failed to get product recommendations.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleChat = () => {
    setIsOpen((prev) => !prev);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Chat bubble button */}
      <Button
        onClick={toggleChat}
        className="h-14 w-14 rounded-full shadow-lg"
        size="icon"
      >
        {isOpen ? (
          <X className="h-6 w-6" />
        ) : (
          <MessageCircleMore className="h-6 w-6" />
        )}
      </Button>

      {/* Chat window */}
      {isOpen && (
        <div className="absolute bottom-16 right-0 w-[350px] md:w-[400px] bg-background shadow-xl rounded-xl border overflow-hidden animate-in slide-in-from-bottom-5 duration-300">
          {/* Chat header */}
          <div className="bg-primary/10 p-3 border-b flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <Avatar className="h-8 w-8">
                <div className="bg-primary text-primary-foreground flex items-center justify-center h-full w-full rounded-full">
                  AI
                </div>
              </Avatar>
              <div>
                <h3 className="font-medium text-sm">Shopping Assistant</h3>
                <p className="text-xs text-muted-foreground">Powered by AI</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={toggleChat}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Chat messages */}
          <ScrollArea className="h-[300px] p-3">
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${
                    message.sender === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg px-3 py-2 ${
                      message.sender === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    }`}
                  >
                    <p className="text-sm">{message.content}</p>
                    <p className="text-xs opacity-70 mt-1">
                      {new Date(message.timestamp).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Product recommendations */}
            {recommendedProducts.length > 0 && (
              <div className="mt-4">
                <h4 className="text-sm font-medium mb-2">Recommended Products</h4>
                <div className="grid grid-cols-1 gap-2">
                  {recommendedProducts.map((product) => (
                    <Link key={product.id} href={`/products/${product.slug}`}>
                      <Card className="p-2 hover:bg-accent cursor-pointer transition-colors">
                        <div className="flex items-center space-x-2">
                          <div className="h-12 w-12 rounded bg-muted flex items-center justify-center overflow-hidden">
                            {product.imageUrl ? (
                              <img 
                                src={product.imageUrl} 
                                alt={product.name}
                                className="h-full w-full object-cover" 
                              />
                            ) : (
                              <ShoppingBag className="h-6 w-6 text-muted-foreground" />
                            )}
                          </div>
                          <div className="flex-1">
                            <h5 className="text-sm font-medium line-clamp-1">{product.name}</h5>
                            <div className="flex items-center">
                              {product.salePrice ? (
                                <>
                                  <span className="text-xs font-medium text-primary">
                                    ${product.salePrice.toFixed(2)}
                                  </span>
                                  <span className="text-xs line-through ml-1 text-muted-foreground">
                                    ${product.price.toFixed(2)}
                                  </span>
                                </>
                              ) : (
                                <span className="text-xs font-medium">
                                  ${product.price.toFixed(2)}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </Card>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </ScrollArea>

          {/* Chat input */}
          <form onSubmit={handleSubmit} className="border-t p-3">
            <div className="flex items-center">
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Ask about products..."
                className="flex-1 bg-muted border-0 focus-visible:ring-0 text-sm rounded-l-md"
                disabled={isLoading}
              />
              <Button 
                type="submit" 
                size="sm" 
                className="rounded-l-none"
                disabled={isLoading || !inputValue.trim()}
              >
                {isLoading ? (
                  <div className="h-4 w-4 border-2 border-foreground/30 border-t-foreground rounded-full animate-spin" />
                ) : (
                  <SendHorizontal className="h-4 w-4" />
                )}
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}