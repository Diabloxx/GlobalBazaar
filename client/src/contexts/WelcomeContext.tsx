import React, { createContext, useContext, useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "next-themes";
import { X } from "lucide-react";

interface WelcomeContextType {
  showWelcome: boolean;
  welcomeMessage: string;
  closeWelcome: () => void;
}

const WelcomeContext = createContext<WelcomeContextType | null>(null);

export function WelcomeProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [showWelcome, setShowWelcome] = useState(false);
  const [welcomeMessage, setWelcomeMessage] = useState("");
  const { theme } = useTheme();

  // Fetch user activity to personalize the welcome message
  const { data: recentActivity } = useQuery({
    queryKey: ["/api/session-activity"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/session-activity?limit=10");
      if (!res.ok) return [];
      return await res.json();
    },
    enabled: !!user,
    refetchOnWindowFocus: false
  });

  // Fetch view history for product recommendations
  const { data: viewHistory } = useQuery({
    queryKey: ["/api/user-activity/products"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/user-activity/products");
      if (!res.ok) return [];
      return await res.json();
    },
    enabled: !!user,
    refetchOnWindowFocus: false
  });

  // Generate personalized welcome message based on user activity
  useEffect(() => {
    if (!user) return;

    // Check if this is the first visit today
    const lastVisit = localStorage.getItem("last_visit_date");
    const today = new Date().toDateString();
    
    if (lastVisit !== today) {
      localStorage.setItem("last_visit_date", today);
      
      let message = `Welcome back, ${user.fullName || user.username}!`;
      
      // Add personalization based on activity
      if (viewHistory && viewHistory.length > 0) {
        message += ` We have new items similar to ${viewHistory[0].name} that you might like.`;
      } else if (recentActivity && recentActivity.find((a: any) => a.activityType === "product_view")) {
        message += " We've noticed you're interested in some of our products. Take a look at today's deals!";
      } else if (recentActivity && recentActivity.find((a: any) => a.activityType === "cart_add")) {
        message += " You have items waiting in your cart!";
      } else {
        // Default message for returning users with no specific activity
        message += " Check out our new arrivals and special deals today!";
      }
      
      setWelcomeMessage(message);
      setShowWelcome(true);
      
      // Auto-hide after 8 seconds
      const timer = setTimeout(() => {
        setShowWelcome(false);
      }, 8000);
      
      return () => clearTimeout(timer);
    }
  }, [user, recentActivity, viewHistory]);

  // Close the welcome message
  const closeWelcome = () => {
    setShowWelcome(false);
  };

  return (
    <WelcomeContext.Provider value={{ showWelcome, welcomeMessage, closeWelcome }}>
      {children}
      <AnimatePresence>
        {showWelcome && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className={`fixed top-20 left-1/2 transform -translate-x-1/2 z-50 px-6 py-4 rounded-lg shadow-lg max-w-lg w-full 
                        ${theme === "dark" ? "bg-gray-800 text-white" : "bg-white text-gray-800"} 
                        border border-primary/20`}
          >
            <button 
              onClick={closeWelcome}
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <X size={16} />
            </button>
            <div className="flex items-center">
              <div className={`w-2 h-2 rounded-full bg-primary mr-2 animate-pulse`}></div>
              <p className="text-sm font-medium">{welcomeMessage}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </WelcomeContext.Provider>
  );
}

export function useWelcome() {
  const context = useContext(WelcomeContext);
  if (!context) {
    throw new Error("useWelcome must be used within a WelcomeProvider");
  }
  return context;
}