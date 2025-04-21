import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, Database, UserCog, RefreshCw, LogIn, User, Lock, Key } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const AdminTest = () => {
  const { user, updateProfile, login } = useAuth();
  const { toast } = useToast();
  const [serverUser, setServerUser] = useState<any>(null);
  const [debugInfo, setDebugInfo] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [masterPasswordVerified, setMasterPasswordVerified] = useState(false);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [masterPasswordForm, setMasterPasswordForm] = useState({
    username: '',
    masterPassword: ''
  });
  const [setPasswordForm, setSetPasswordForm] = useState({
    userId: '',
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
  
  // Handle input changes for set password form
  const handleSetPasswordInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSetPasswordForm(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Set master password for a user (admin only)
  const setMasterPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/admin-test/set-master-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          userId: parseInt(setPasswordForm.userId),
          masterPassword: setPasswordForm.masterPassword
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setDebugInfo('Master password set successfully');
          toast({
            title: "Success",
            description: "Master password set successfully",
          });
          // Clear the form
          setSetPasswordForm({
            userId: '',
            masterPassword: ''
          });
        } else {
          setDebugInfo(`Failed to set master password: ${data.message}`);
          toast({
            title: "Failed",
            description: data.message || "Failed to set master password",
            variant: "destructive"
          });
        }
      } else {
        const error = await response.json();
        setDebugInfo(`Failed to set master password: ${error.message}`);
        toast({
          title: "Error",
          description: error.message || "Server error",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Master password setting failed:', error);
      setDebugInfo(`Error: ${error instanceof Error ? error.message : String(error)}`);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
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

  // Fetch all users (admin only)
  const fetchAllUsers = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/users', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const users = await response.json();
        setAllUsers(users);
        setDebugInfo(`Fetched ${users.length} users`);
      } else {
        setDebugInfo(`Failed to fetch users: ${response.status} - ${response.statusText}`);
        toast({
          title: "Error",
          description: "Failed to fetch users. You may not have admin permissions.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      setDebugInfo(`Error: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Set master password for a specific user from the list
  const setPasswordForUser = (userId: number) => {
    setSetPasswordForm(prev => ({
      ...prev,
      userId: userId.toString()
    }));
  };
  
  useEffect(() => {
    // Fetch user on initial load
    fetchUserFromServer();
    
    // Check if master password verification is stored in session
    const verified = sessionStorage.getItem('admin_test_verified') === 'true';
    setMasterPasswordVerified(verified);
    
    // If user is admin and verified, fetch all users
    if (user?.role === 'admin' && verified) {
      fetchAllUsers();
    }
  }, [user?.role, masterPasswordVerified]);

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
                    onChange={handleLoginInputChange}
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
                    onChange={handleLoginInputChange}
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
          
          {user?.role === 'admin' && masterPasswordVerified && allUsers.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-medium">User List</h3>
                <Button 
                  onClick={fetchAllUsers} 
                  variant="outline" 
                  size="sm" 
                  disabled={isLoading}
                >
                  <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </div>
              <div className="border rounded-md overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">ID</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Username</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Role</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Master Password</th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
                    {allUsers.map((u: any) => (
                      <tr key={u.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{u.id}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{u.username}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            u.role === 'admin' 
                              ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' 
                              : u.role === 'seller' 
                                ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                                : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                          }`}>
                            {u.role || 'customer'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {u.masterPassword ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                              Set
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200">
                              Not Set
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => setPasswordForUser(u.id)}
                                className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                              >
                                <Key className="mr-1 h-3 w-3" />
                                Set Master Password
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-md">
                              <DialogHeader>
                                <DialogTitle className="flex items-center">
                                  <Key className="mr-2 h-5 w-5 text-primary" />
                                  Set Master Password for {u.username}
                                </DialogTitle>
                                <DialogDescription>
                                  This will allow the user to access admin testing functionality using this password.
                                </DialogDescription>
                              </DialogHeader>
                              <form onSubmit={setMasterPassword} className="space-y-4">
                                <input
                                  type="hidden"
                                  name="userId"
                                  value={u.id}
                                />
                                <div className="space-y-2">
                                  <Label htmlFor={`newMasterPassword-${u.id}`} className="flex items-center">
                                    <Lock className="mr-2 h-4 w-4" />
                                    Master Password
                                  </Label>
                                  <Input
                                    id={`newMasterPassword-${u.id}`}
                                    name="masterPassword"
                                    type="password"
                                    value={setPasswordForm.masterPassword}
                                    onChange={handleSetPasswordInputChange}
                                    placeholder="Enter master password to set"
                                    required
                                  />
                                </div>
                                <DialogFooter className="mt-4">
                                  <Button 
                                    type="submit" 
                                    disabled={isLoading}
                                    className="w-full"
                                  >
                                    {isLoading ? (
                                      <><RefreshCw className="mr-2 h-4 w-4 animate-spin" /> Saving...</>
                                    ) : (
                                      <><Shield className="mr-2 h-4 w-4" /> Set Password</>
                                    )}
                                  </Button>
                                </DialogFooter>
                              </form>
                            </DialogContent>
                          </Dialog>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
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
          
          {user && !masterPasswordVerified && (
            <Dialog>
              <DialogTrigger asChild>
                <Button 
                  onClick={() => {
                    // Set username automatically if it's not already set
                    if (!masterPasswordForm.username && user) {
                      setMasterPasswordForm(prev => ({
                        ...prev,
                        username: user.username
                      }));
                    }
                  }}
                  disabled={isLoading}
                  variant="outline"
                  className="text-yellow-500 border-yellow-500 hover:bg-yellow-50 dark:hover:bg-yellow-950"
                >
                  <Key className="mr-2 h-4 w-4" />
                  Verify Master Password
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle className="flex items-center">
                    <Key className="mr-2 h-5 w-5 text-primary" />
                    Master Password Verification
                  </DialogTitle>
                  <DialogDescription>
                    Enter your master password to access admin testing functionality.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={verifyMasterPassword} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="masterUsername" className="flex items-center">
                      <User className="mr-2 h-4 w-4" />
                      Username
                    </Label>
                    <Input
                      id="masterUsername"
                      name="username"
                      value={masterPasswordForm.username || (user?.username || '')}
                      onChange={handleMasterPasswordInputChange}
                      placeholder="Enter your username"
                      required
                      disabled={!!user}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="masterPassword" className="flex items-center">
                      <Lock className="mr-2 h-4 w-4" />
                      Master Password
                    </Label>
                    <Input
                      id="masterPassword"
                      name="masterPassword"
                      type="password"
                      value={masterPasswordForm.masterPassword}
                      onChange={handleMasterPasswordInputChange}
                      placeholder="Enter master password"
                      required
                    />
                  </div>
                  <DialogFooter className="mt-4">
                    <Button 
                      type="submit" 
                      disabled={isLoading}
                      className="w-full"
                    >
                      {isLoading ? (
                        <><RefreshCw className="mr-2 h-4 w-4 animate-spin" /> Verifying...</>
                      ) : (
                        <><Shield className="mr-2 h-4 w-4" /> Verify Access</>
                      )}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          )}
          
          {user && masterPasswordVerified && (
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
              
              {user.role === 'admin' && (
                <Button 
                  onClick={fetchAllUsers}
                  disabled={isLoading}
                  variant="outline"
                  className="text-blue-500 border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950"
                >
                  <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                  Refresh Users List
                </Button>
              )}
              
              <Dialog>
                <DialogTrigger asChild>
                  <Button 
                    disabled={isLoading || user?.role !== 'admin'}
                    variant="outline"
                    className="text-green-500 border-green-500 hover:bg-green-50 dark:hover:bg-green-950"
                  >
                    <Key className="mr-2 h-4 w-4" />
                    Set Master Password
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle className="flex items-center">
                      <Key className="mr-2 h-5 w-5 text-primary" />
                      Set Master Password
                    </DialogTitle>
                    <DialogDescription>
                      Grant admin testing access to a user by setting their master password.
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={setMasterPassword} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="userId" className="flex items-center">
                        <User className="mr-2 h-4 w-4" />
                        User ID
                      </Label>
                      <Input
                        id="userId"
                        name="userId"
                        type="number"
                        value={setPasswordForm.userId}
                        onChange={handleSetPasswordInputChange}
                        placeholder="Enter user ID"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="newMasterPassword" className="flex items-center">
                        <Lock className="mr-2 h-4 w-4" />
                        Master Password
                      </Label>
                      <Input
                        id="newMasterPassword"
                        name="masterPassword"
                        type="password"
                        value={setPasswordForm.masterPassword}
                        onChange={handleSetPasswordInputChange}
                        placeholder="Enter master password to set"
                        required
                      />
                    </div>
                    <DialogFooter className="mt-4">
                      <Button 
                        type="submit" 
                        disabled={isLoading}
                        className="w-full"
                      >
                        {isLoading ? (
                          <><RefreshCw className="mr-2 h-4 w-4 animate-spin" /> Saving...</>
                        ) : (
                          <><Shield className="mr-2 h-4 w-4" /> Set Password</>
                        )}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </>
          )}
        </CardFooter>
      </Card>
    </div>
  );
};

export default AdminTest;