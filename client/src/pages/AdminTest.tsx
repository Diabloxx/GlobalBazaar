import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, Database, UserCog, RefreshCw, LogIn, User, Lock, Key } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const AdminTest = () => {
  const { user, updateProfile, login } = useAuth();
  const { toast } = useToast();
  const [serverUser, setServerUser] = useState<any>(null);
  const [debugInfo, setDebugInfo] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [masterPasswordVerified, setMasterPasswordVerified] = useState(false);
  const [masterPasswordForm, setMasterPasswordForm] = useState({
    username: '',
    masterPassword: ''
  });
  const [loginForm, setLoginForm] = useState({
    username: '',
    password: ''
  });

  // Get user from server directly
  const fetchUserFromServer = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/user', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const userData = await response.json();
        setServerUser(userData);
        setDebugInfo('User fetched from server successfully');
      } else {
        setServerUser(null);
        setDebugInfo(`Server response: ${response.status} - ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error fetching user:', error);
      setDebugInfo(`Error: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Attempt to set user as admin
  const setUserAsAdmin = async () => {
    if (!user) {
      setDebugInfo('No user logged in');
      return;
    }
    
    setIsLoading(true);
    try {
      const response = await fetch(`/api/users/${user.id}/set-admin`, {
        method: 'POST',
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setDebugInfo(`Set admin result: ${JSON.stringify(data)}`);
        // Refresh user data
        fetchUserFromServer();
      } else {
        setDebugInfo(`Failed to set admin: ${response.status} - ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error setting admin:', error);
      setDebugInfo(`Error: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Debug information for user
  const getUserDebugInfo = async () => {
    if (!user) {
      setDebugInfo('No user logged in');
      return;
    }
    
    setIsLoading(true);
    try {
      const response = await fetch(`/api/debug/user/${user.id}`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setDebugInfo(`Debug info: ${JSON.stringify(data, null, 2)}`);
      } else {
        setDebugInfo(`Failed to get debug info: ${response.status} - ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error getting debug info:', error);
      setDebugInfo(`Error: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Attempt direct database update
  const setUserRoleDirectly = async () => {
    if (!user) {
      setDebugInfo('No user logged in');
      return;
    }
    
    setIsLoading(true);
    try {
      const response = await fetch(`/api/users/${user.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ role: 'admin' })
      });
      
      if (response.ok) {
        const updatedUser = await response.json();
        setDebugInfo(`User updated: ${JSON.stringify(updatedUser)}`);
        // Update local user state
        updateProfile({ role: 'admin' });
        // Refresh user data
        fetchUserFromServer();
      } else {
        setDebugInfo(`Failed to update user: ${response.status} - ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error updating user:', error);
      setDebugInfo(`Error: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Automatic login for testing (DEVELOPMENT ONLY)
  const loginAsUser = async () => {
    try {
      const storedUser = localStorage.getItem('user');
      const storedPassword = localStorage.getItem('_dev_password');
      
      if (storedUser && storedPassword) {
        const parsedUser = JSON.parse(storedUser);
        await login(parsedUser.username, storedPassword);
        setDebugInfo('Auto-login successful');
        fetchUserFromServer();
      } else {
        setDebugInfo('No stored credentials found');
      }
    } catch (error) {
      console.error('Auto-login failed:', error);
      setDebugInfo(`Login error: ${error instanceof Error ? error.message : String(error)}`);
    }
  };
  
  // Handle input changes for login form
  const handleLoginInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setLoginForm(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Handle input changes for master password form
  const handleMasterPasswordInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setMasterPasswordForm(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Manual login submission
  const handleManualLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      await login(loginForm.username, loginForm.password);
      setDebugInfo('Login successful');
      // Store password for auto-login in the future
      localStorage.setItem('_dev_password', loginForm.password);
      fetchUserFromServer();
    } catch (error) {
      console.error('Login failed:', error);
      setDebugInfo(`Login error: ${error instanceof Error ? error.message : String(error)}`);
      toast({
        title: "Login failed",
        description: error instanceof Error ? error.message : "Invalid credentials",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Verify master password
  const verifyMasterPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/admin-test/verify-master-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          username: masterPasswordForm.username || (user?.username || ''),
          masterPassword: masterPasswordForm.masterPassword
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setMasterPasswordVerified(true);
          setDebugInfo('Master password verified. Admin test functionality unlocked.');
          toast({
            title: "Access Granted",
            description: "Master password verified successfully",
          });
          // Store verification status
          sessionStorage.setItem('admin_test_verified', 'true');
        } else {
          setDebugInfo(`Master password verification failed: ${data.message}`);
          toast({
            title: "Access Denied",
            description: "Invalid master password",
            variant: "destructive"
          });
        }
      } else {
        const error = await response.json();
        setDebugInfo(`Failed to verify master password: ${error.message}`);
        toast({
          title: "Verification Failed",
          description: error.message || "Server error",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Master password verification failed:', error);
      setDebugInfo(`Error: ${error instanceof Error ? error.message : String(error)}`);
      toast({
        title: "Verification Error",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Fetch user on initial load
    fetchUserFromServer();
  }, []);

  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Shield className="mr-2 h-6 w-6 text-primary" />
            Admin Role Debug Tool
          </CardTitle>
          <CardDescription>
            Troubleshoot admin role recognition issues
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {!user && (
            <div className="bg-gray-50 dark:bg-gray-900 p-6 rounded-lg border border-gray-200 dark:border-gray-800 mb-4">
              <h3 className="text-lg font-medium mb-4 flex items-center">
                <LogIn className="mr-2 h-5 w-5 text-primary" />
                Login Required
              </h3>
              <form onSubmit={handleManualLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="username" className="flex items-center">
                    <User className="mr-2 h-4 w-4" />
                    Username
                  </Label>
                  <Input
                    id="username"
                    name="username"
                    value={loginForm.username}
                    onChange={handleInputChange}
                    placeholder="Enter your username"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password" className="flex items-center">
                    <Lock className="mr-2 h-4 w-4" />
                    Password
                  </Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    value={loginForm.password}
                    onChange={handleInputChange}
                    placeholder="Enter your password"
                    required
                  />
                </div>
                <div className="pt-2">
                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <><RefreshCw className="mr-2 h-4 w-4 animate-spin" /> Logging in...</>
                    ) : (
                      <><LogIn className="mr-2 h-4 w-4" /> Login</>
                    )}
                  </Button>
                </div>
                <div className="mt-2 flex justify-between text-xs text-muted-foreground">
                  <button 
                    type="button" 
                    onClick={() => {
                      setLoginForm({
                        username: 'demo',
                        password: 'password'
                      });
                    }}
                    className="underline hover:text-primary"
                  >
                    Use demo account
                  </button>
                  <span>Administrator Test Tool</span>
                </div>
              </form>
            </div>
          )}
          
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <h3 className="text-lg font-medium mb-2">Local User State</h3>
              <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-md overflow-x-auto">
                <pre className="text-xs">{user ? JSON.stringify(user, null, 2) : 'No user'}</pre>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-medium mb-2">Server User State</h3>
              <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-md overflow-x-auto">
                <pre className="text-xs">{serverUser ? JSON.stringify(serverUser, null, 2) : 'No server user'}</pre>
              </div>
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-medium mb-2">Debug Output</h3>
            <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-md overflow-x-auto h-40">
              <pre className="text-xs whitespace-pre-wrap">{debugInfo || 'No debug information yet'}</pre>
            </div>
          </div>
        </CardContent>
        
        <CardFooter className="flex flex-wrap gap-2">
          <Button 
            onClick={fetchUserFromServer}
            disabled={isLoading}
            variant="outline"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh User
          </Button>
          
          {!user && (
            <Button 
              onClick={loginAsUser}
              disabled={isLoading}
              variant="outline"
            >
              <LogIn className="mr-2 h-4 w-4" />
              Auto Login
            </Button>
          )}
          
          {user && (
            <>
              <Button 
                onClick={getUserDebugInfo}
                disabled={isLoading}
                variant="outline"
              >
                <Database className="mr-2 h-4 w-4" />
                Get Debug Info
              </Button>
              
              <Button 
                onClick={setUserAsAdmin}
                disabled={isLoading}
                variant="outline"
              >
                <Shield className="mr-2 h-4 w-4" />
                Set as Admin (API)
              </Button>
              
              <Button 
                onClick={setUserRoleDirectly}
                disabled={isLoading}
                variant="default"
              >
                <UserCog className="mr-2 h-4 w-4" />
                Update Role (Direct)
              </Button>
            </>
          )}
        </CardFooter>
      </Card>
    </div>
  );
};

export default AdminTest;