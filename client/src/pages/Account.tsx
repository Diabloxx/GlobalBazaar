import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useLocation } from 'wouter';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Loader2 } from 'lucide-react';

// Login form schema
const loginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
});

// Registration form schema
const registerSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string().min(6, 'Confirm your password'),
  fullName: z.string().optional(),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

// Form types
type LoginFormValues = z.infer<typeof loginSchema>;
type RegisterFormValues = z.infer<typeof registerSchema>;

const Account = () => {
  const [activeTab, setActiveTab] = useState('login');
  const { login, register: registerUser, isAuthenticated, user, isLoading, logout } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();

  // Login form
  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: '',
      password: '',
    },
  });

  // Register form
  const registerForm = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: '',
      email: '',
      password: '',
      confirmPassword: '',
      fullName: '',
    },
  });

  // Handle login submission
  const onLoginSubmit = async (data: LoginFormValues) => {
    try {
      await login(data.username, data.password);
      navigate('/');
    } catch (error) {
      console.error('Login error:', error);
      // Error toast is shown by the auth context
    }
  };

  // Handle registration submission
  const onRegisterSubmit = async (data: RegisterFormValues) => {
    try {
      const { confirmPassword, ...registerData } = data;
      await registerUser(registerData);
      navigate('/');
    } catch (error) {
      console.error('Registration error:', error);
      // Error toast is shown by the auth context
    }
  };

  // Handle logout
  const handleLogout = () => {
    logout();
    toast({
      title: 'Logged out',
      description: 'You have been successfully logged out.',
    });
  };

  // If user is already authenticated
  if (isAuthenticated && user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">My Account</CardTitle>
              <CardDescription>
                Manage your account settings and view your orders
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium">Account Information</h3>
                  <Separator className="my-3" />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-gray-500">Username</Label>
                      <p className="font-medium">{user.username}</p>
                    </div>
                    <div>
                      <Label className="text-gray-500">Email</Label>
                      <p className="font-medium">{user.email}</p>
                    </div>
                    <div>
                      <Label className="text-gray-500">Full Name</Label>
                      <p className="font-medium">{user.fullName || 'Not provided'}</p>
                    </div>
                    <div>
                      <Label className="text-gray-500">Phone</Label>
                      <p className="font-medium">{user.phone || 'Not provided'}</p>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium">Shipping Address</h3>
                  <Separator className="my-3" />
                  <p className="font-medium">
                    {user.address || 'No address saved. Add one during checkout.'}
                  </p>
                </div>
                
                <div className="flex flex-col md:flex-row items-center gap-4 pt-4">
                  <Button 
                    onClick={() => navigate('/orders')} 
                    variant="outline"
                    className="w-full md:w-auto"
                  >
                    View Orders
                  </Button>
                  <Button 
                    onClick={() => navigate('/wishlist')} 
                    variant="outline"
                    className="w-full md:w-auto"
                  >
                    View Wishlist
                  </Button>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                onClick={handleLogout} 
                variant="destructive"
                className="w-full md:w-auto ml-auto"
              >
                Sign Out
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-md mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Account</CardTitle>
            <CardDescription>
              Log in to your account or create a new one
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="login" value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="register">Register</TabsTrigger>
              </TabsList>
              
              <TabsContent value="login">
                <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-username">Username</Label>
                    <Input
                      id="login-username"
                      placeholder="Username"
                      {...loginForm.register('username')}
                      className={loginForm.formState.errors.username ? 'border-red-500' : ''}
                    />
                    {loginForm.formState.errors.username && (
                      <p className="text-red-500 text-xs mt-1">
                        {loginForm.formState.errors.username.message}
                      </p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="login-password">Password</Label>
                    <Input
                      id="login-password"
                      type="password"
                      placeholder="Password"
                      {...loginForm.register('password')}
                      className={loginForm.formState.errors.password ? 'border-red-500' : ''}
                    />
                    {loginForm.formState.errors.password && (
                      <p className="text-red-500 text-xs mt-1">
                        {loginForm.formState.errors.password.message}
                      </p>
                    )}
                  </div>
                  
                  <Button
                    type="submit"
                    className="w-full bg-primary hover:bg-primary/90 text-white"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Logging in...
                      </>
                    ) : (
                      'Sign In'
                    )}
                  </Button>
                </form>
                
                <div className="mt-4 text-center text-sm">
                  <span className="text-gray-500">Don't have an account?</span>{' '}
                  <button
                    type="button"
                    onClick={() => setActiveTab('register')}
                    className="text-primary hover:underline"
                  >
                    Register now
                  </button>
                </div>
              </TabsContent>
              
              <TabsContent value="register">
                <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="register-username">Username*</Label>
                    <Input
                      id="register-username"
                      placeholder="Username"
                      {...registerForm.register('username')}
                      className={registerForm.formState.errors.username ? 'border-red-500' : ''}
                    />
                    {registerForm.formState.errors.username && (
                      <p className="text-red-500 text-xs mt-1">
                        {registerForm.formState.errors.username.message}
                      </p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="register-email">Email*</Label>
                    <Input
                      id="register-email"
                      type="email"
                      placeholder="Email"
                      {...registerForm.register('email')}
                      className={registerForm.formState.errors.email ? 'border-red-500' : ''}
                    />
                    {registerForm.formState.errors.email && (
                      <p className="text-red-500 text-xs mt-1">
                        {registerForm.formState.errors.email.message}
                      </p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="register-full-name">Full Name (optional)</Label>
                    <Input
                      id="register-full-name"
                      placeholder="Full Name"
                      {...registerForm.register('fullName')}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="register-password">Password*</Label>
                    <Input
                      id="register-password"
                      type="password"
                      placeholder="Password"
                      {...registerForm.register('password')}
                      className={registerForm.formState.errors.password ? 'border-red-500' : ''}
                    />
                    {registerForm.formState.errors.password && (
                      <p className="text-red-500 text-xs mt-1">
                        {registerForm.formState.errors.password.message}
                      </p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="register-confirm-password">Confirm Password*</Label>
                    <Input
                      id="register-confirm-password"
                      type="password"
                      placeholder="Confirm Password"
                      {...registerForm.register('confirmPassword')}
                      className={registerForm.formState.errors.confirmPassword ? 'border-red-500' : ''}
                    />
                    {registerForm.formState.errors.confirmPassword && (
                      <p className="text-red-500 text-xs mt-1">
                        {registerForm.formState.errors.confirmPassword.message}
                      </p>
                    )}
                  </div>
                  
                  <Button
                    type="submit"
                    className="w-full bg-primary hover:bg-primary/90 text-white"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Registering...
                      </>
                    ) : (
                      'Create Account'
                    )}
                  </Button>
                </form>
                
                <div className="mt-4 text-center text-sm">
                  <span className="text-gray-500">Already have an account?</span>{' '}
                  <button
                    type="button"
                    onClick={() => setActiveTab('login')}
                    className="text-primary hover:underline"
                  >
                    Sign in
                  </button>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Account;
