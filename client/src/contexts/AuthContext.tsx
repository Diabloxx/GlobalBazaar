import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { User } from '@shared/schema';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (userData: Partial<User>) => Promise<void>;
}

interface RegisterData {
  username: string;
  password: string;
  email: string;
  fullName?: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Check if user is logged in on initial load and refresh from server
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        // Try to get current session from server first
        const response = await fetch('/api/auth/user', {
          credentials: 'include' // Important for session cookies
        });
        
        if (response.ok) {
          const userData = await response.json();
          console.log("Fetched user from server:", userData);
          setUser(userData);
          localStorage.setItem('user', JSON.stringify(userData));
          setIsLoading(false);
          return;
        } else {
          console.log("Not authenticated on server, status:", response.status);
          
          // Get user from localStorage
          const storedUser = localStorage.getItem('user');
          if (storedUser) {
            try {
              // If we have a user in localStorage but no session, try to re-authenticate
              const parsedUser = JSON.parse(storedUser);
              console.log("Found user in localStorage:", parsedUser);
              
              // Always attempt silent re-login if we have a stored user
              // This is needed because cookies may have expired but we still have user data
              try {
                console.log("Attempting silent re-login...");
                
                // Get stored credentials for development
                const storedPassword = localStorage.getItem('_dev_password');
                const password = storedPassword || 'password'; // Fallback for testing
                
                // Attempt to login with stored username
                const response = await fetch('/api/auth/login', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    username: parsedUser.username,
                    password: password
                  }),
                  credentials: 'include'
                });
                
                if (response.ok) {
                  const refreshedUser = await response.json();
                  console.log("Silent re-login successful:", refreshedUser);
                  setUser(refreshedUser);
                  localStorage.setItem('user', JSON.stringify(refreshedUser));
                  setIsLoading(false);
                  return;
                } else {
                  console.warn("Silent re-login failed with status:", response.status);
                  const errorText = await response.text();
                  console.warn("Error response:", errorText);
                }
              } catch (loginError) {
                console.error("Silent re-login failed with error:", loginError);
              }
              
              // Set user from localStorage if no re-auth was possible
              setUser(parsedUser);
            } catch (error) {
              console.error('Failed to parse user from localStorage:', error);
              localStorage.removeItem('user');
            }
          }
        }
      } catch (error) {
        console.error('Error fetching current user:', error);
      }
      
      setIsLoading(false);
    };
    
    fetchCurrentUser();
  }, []);

  const login = async (username: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await apiRequest('POST', '/api/auth/login', { username, password });
      const userData = await response.json();
      console.log("Login successful, user data:", userData);
      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
      
      // Store password in localStorage for development silent re-auth
      // NOTE: This is ONLY for development and would never be used in production
      if (process.env.NODE_ENV === 'development') {
        localStorage.setItem('_dev_password', password);
      }
      
      toast({
        title: 'Login successful',
        description: `Welcome back, ${userData.username}!`,
      });
      
      // Invalidate any cached queries that might depend on auth state
      queryClient.invalidateQueries();
    } catch (error) {
      console.error("Login error:", error);
      toast({
        title: 'Login failed',
        description: error instanceof Error ? error.message : 'Invalid credentials',
        variant: 'destructive',
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData: RegisterData) => {
    setIsLoading(true);
    try {
      const response = await apiRequest('POST', '/api/auth/register', userData);
      const newUser = await response.json();
      setUser(newUser);
      localStorage.setItem('user', JSON.stringify(newUser));
      
      toast({
        title: 'Registration successful',
        description: `Welcome to ShopEase, ${newUser.username}!`,
      });
      
      // Invalidate any cached queries that might depend on auth state
      queryClient.invalidateQueries();
    } catch (error) {
      toast({
        title: 'Registration failed',
        description: error instanceof Error ? error.message : 'Could not create account',
        variant: 'destructive',
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      // Call the server logout endpoint
      await apiRequest('POST', '/api/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Always clear local state even if server logout fails
      setUser(null);
      localStorage.removeItem('user');
      
      toast({
        title: 'Logged out',
        description: 'You have been successfully logged out',
      });
      
      // Invalidate any cached queries that might depend on auth state
      queryClient.invalidateQueries();
    }
  };

  const updateProfile = async (userData: Partial<User>) => {
    if (!user) {
      toast({
        title: 'Error',
        description: 'You must be logged in to update your profile',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await apiRequest('PATCH', `/api/users/${user.id}`, userData);
      const updatedUser = await response.json();
      console.log("Profile update successful, updated user data:", updatedUser);
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
      toast({
        title: 'Profile updated',
        description: 'Your profile has been successfully updated',
      });
      
      // Invalidate any cached queries that might depend on user data
      queryClient.invalidateQueries();
    } catch (error) {
      console.error("Profile update error:", error);
      toast({
        title: 'Update failed',
        description: error instanceof Error ? error.message : 'Could not update profile',
        variant: 'destructive',
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const value = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    register,
    logout,
    updateProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
