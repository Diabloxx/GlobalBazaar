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
      console.log(`Attempting login for user: ${username}`);
      
      // Use direct fetch instead of apiRequest to have more control over error handling
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
        credentials: 'include' // Important for session cookies
      });
      
      if (!response.ok) {
        console.warn(`Login failed with status: ${response.status}`);
        let errorMessage = 'Invalid credentials';
        
        try {
          const errorData = await response.json();
          console.warn('Error response:', errorData);
          errorMessage = errorData.message || errorMessage;
        } catch (parseError) {
          // If the response isn't JSON, try to get the text
          const errorText = await response.text();
          console.warn('Error response (text):', errorText);
          errorMessage = errorText || errorMessage;
        }
        
        toast({
          title: 'Login failed',
          description: errorMessage,
          variant: 'destructive',
        });
        
        throw new Error(errorMessage);
      }
      
      // Parse the successful response
      let userData;
      try {
        userData = await response.json();
        console.log("Login successful, user data:", userData);
        
        // Validate user data structure
        if (!userData || !userData.id || !userData.username) {
          throw new Error('Invalid user data received from server');
        }
      } catch (parseError) {
        console.error("Error parsing user data:", parseError);
        toast({
          title: 'Login error',
          description: 'Authentication succeeded but received invalid user data',
          variant: 'destructive',
        });
        throw parseError;
      }
      
      // Update local state
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
      
      // Verify that the session was properly established
      try {
        const sessionCheck = await fetch('/api/auth/user', {
          credentials: 'include' 
        });
        
        if (!sessionCheck.ok) {
          console.warn('Session verification failed after login. Status:', sessionCheck.status);
        } else {
          console.log('Session verified successfully after login');
        }
      } catch (sessionError) {
        console.error('Error verifying session after login:', sessionError);
      }
      
      return userData;
    } catch (error) {
      console.error("Login error:", error);
      
      // Don't throw again as we've already handled with toast
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData: RegisterData) => {
    setIsLoading(true);
    try {
      console.log(`Attempting to register user: ${userData.username}`);
      
      // Use direct fetch for better error handling
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
        credentials: 'include' // Important for session cookies
      });
      
      if (!response.ok) {
        console.warn(`Registration failed with status: ${response.status}`);
        let errorMessage = 'Registration failed';
        
        try {
          const errorData = await response.json();
          console.warn('Error response:', errorData);
          errorMessage = errorData.message || errorMessage;
        } catch (parseError) {
          // If the response isn't JSON, try to get the text
          const errorText = await response.text();
          console.warn('Error response (text):', errorText);
          errorMessage = errorText || errorMessage;
        }
        
        toast({
          title: 'Registration failed',
          description: errorMessage,
          variant: 'destructive',
        });
        
        throw new Error(errorMessage);
      }
      
      // Parse the successful response
      let newUser;
      try {
        newUser = await response.json();
        console.log("Registration successful, user data:", newUser);
        
        // Validate user data structure
        if (!newUser || !newUser.id || !newUser.username) {
          throw new Error('Invalid user data received from server');
        }
      } catch (parseError) {
        console.error("Error parsing user data:", parseError);
        toast({
          title: 'Registration error',
          description: 'Account created but received invalid user data',
          variant: 'destructive',
        });
        throw parseError;
      }
      
      // Update local state
      setUser(newUser);
      localStorage.setItem('user', JSON.stringify(newUser));
      
      toast({
        title: 'Registration successful',
        description: `Welcome to ShopEase, ${newUser.username}!`,
      });
      
      // Invalidate any cached queries that might depend on auth state
      queryClient.invalidateQueries();
      
      // Verify that the session was properly established
      try {
        const sessionCheck = await fetch('/api/auth/user', {
          credentials: 'include' 
        });
        
        if (!sessionCheck.ok) {
          console.warn('Session verification failed after registration. Status:', sessionCheck.status);
        } else {
          console.log('Session verified successfully after registration');
        }
      } catch (sessionError) {
        console.error('Error verifying session after registration:', sessionError);
      }
      
      return newUser;
    } catch (error) {
      console.error("Registration error:", error);
      
      // We've already shown the toast, so don't throw again
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      console.log('Logging out user:', user?.username);
      
      // Call the server logout endpoint with credentials to ensure cookies are sent
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        console.warn(`Logout request failed with status: ${response.status}`);
        const errorText = await response.text();
        console.warn('Error response:', errorText);
      } else {
        console.log('Server logout successful');
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Always clear local state even if server logout fails
      console.log('Clearing local user state and storage');
      setUser(null);
      localStorage.removeItem('user');
      localStorage.removeItem('_dev_password');
      
      // Clear any sensitive data from memory
      if (window.sessionStorage) {
        try {
          sessionStorage.clear();
        } catch (e) {
          console.error('Failed to clear session storage:', e);
        }
      }
      
      toast({
        title: 'Logged out',
        description: 'You have been successfully logged out',
      });
      
      // Invalidate all cached queries to ensure fresh data on next login
      console.log('Invalidating all queries');
      queryClient.clear();
      setIsLoading(false);
    }
  };

  const updateProfile = async (userData: Partial<User>) => {
    if (!user) {
      toast({
        title: 'Error',
        description: 'You must be logged in to update your profile',
        variant: 'destructive',
      });
      return null;
    }

    setIsLoading(true);
    try {
      console.log(`Updating profile for user: ${user.username} (${user.id})`);
      console.log('Update data:', userData);
      
      // Use direct fetch for better error handling
      const response = await fetch(`/api/users/${user.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
        credentials: 'include' // Important for session cookies
      });
      
      if (!response.ok) {
        console.warn(`Profile update failed with status: ${response.status}`);
        let errorMessage = 'Profile update failed';
        
        try {
          const errorData = await response.json();
          console.warn('Error response:', errorData);
          errorMessage = errorData.message || errorMessage;
        } catch (parseError) {
          // If the response isn't JSON, try to get the text
          const errorText = await response.text();
          console.warn('Error response (text):', errorText);
          errorMessage = errorText || errorMessage;
        }
        
        toast({
          title: 'Update failed',
          description: errorMessage,
          variant: 'destructive',
        });
        
        throw new Error(errorMessage);
      }
      
      // Parse the successful response
      let updatedUser;
      try {
        updatedUser = await response.json();
        console.log("Profile update successful, updated user data:", updatedUser);
        
        // Validate user data structure
        if (!updatedUser || !updatedUser.id || !updatedUser.username) {
          throw new Error('Invalid user data received from server');
        }
      } catch (parseError) {
        console.error("Error parsing updated user data:", parseError);
        toast({
          title: 'Update error',
          description: 'Profile updated but received invalid user data',
          variant: 'destructive',
        });
        throw parseError;
      }
      
      // Update local state
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
      toast({
        title: 'Profile updated',
        description: 'Your profile has been successfully updated',
      });
      
      // Invalidate any cached queries that might depend on user data
      queryClient.invalidateQueries();
      
      return updatedUser;
    } catch (error) {
      console.error("Profile update error:", error);
      
      // We've already shown the toast, so don't throw again
      return null;
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
