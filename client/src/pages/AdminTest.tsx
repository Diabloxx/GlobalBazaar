import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, Database, UserCog, RefreshCw, LogIn } from 'lucide-react';

const AdminTest = () => {
  const { user, updateProfile, login } = useAuth();
  const [serverUser, setServerUser] = useState<any>(null);
  const [debugInfo, setDebugInfo] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

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
          
          <Button 
            onClick={loginAsUser}
            disabled={isLoading}
            variant="outline"
          >
            <LogIn className="mr-2 h-4 w-4" />
            Auto Login
          </Button>
          
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
        </CardFooter>
      </Card>
    </div>
  );
};

export default AdminTest;