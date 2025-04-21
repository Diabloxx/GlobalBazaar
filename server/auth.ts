import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import { Express, Request, Response, NextFunction } from 'express';
import session from 'express-session';
import { storage } from './storage';
import { User } from '@shared/schema';
import MemoryStore from 'memorystore';
import bcrypt from 'bcryptjs';

// Add type definition for Express User
declare global {
  namespace Express {
    interface User {
      id: number;
      username: string;
      email: string;
      role: string | null;
      fullName: string | null;
      address: string | null;
      phone: string | null;
      isVerifiedSeller: boolean | null;
      salesCount: number | null;
      createdAt: Date;
    }
  }
}

const MemoryStoreSession = MemoryStore(session);

export function setupAuth(app: Express) {
  // Configure session middleware with enhanced persistence
  app.use(session({
    secret: process.env.SESSION_SECRET || 'shopease-secret-key',
    resave: false,
    saveUninitialized: true, // Track all visitors including those not logged in
    cookie: {
      secure: process.env.NODE_ENV === 'production', // Use secure cookies in production
      httpOnly: true, // Prevent client-side JS from reading the cookie
      maxAge: 1000 * 60 * 60 * 24 * 30, // 30 days for better persistence
      path: '/',
      sameSite: 'lax' // Provides some CSRF protection while allowing normal navigation
    },
    store: new MemoryStoreSession({
      checkPeriod: 86400000, // Cleanup expired sessions once per day
      stale: false // Force using stale sessions when DB unreachable
    })
  }));

  // Initialize Passport
  app.use(passport.initialize());
  app.use(passport.session());
  
  // Apply session tracking middleware to all routes
  app.use(ensureSessionForTracking);

  // Configure local strategy
  passport.use(new LocalStrategy(
    async (username, password, done) => {
      try {
        console.log(`Authentication attempt for username: ${username}`);
        
        // Input validation
        if (!username || !password) {
          console.error('Login attempt with missing credentials');
          return done(null, false, { message: 'Username and password are required' });
        }
        
        // Find user by username
        const user = await storage.getUserByUsername(username);
        if (!user) {
          console.log(`Authentication failed: User not found - ${username}`);
          return done(null, false, { message: 'Incorrect username.' });
        }
        
        // Validate user object
        if (!user.password) {
          console.error(`Authentication error: User ${username} has no password hash stored`);
          return done(new Error('Invalid user data: missing password hash'), false);
        }
        
        // Verify password using bcrypt
        console.log(`Verifying password for user: ${username}`);
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
          console.log(`Authentication failed: Invalid password for user ${username}`);
          return done(null, false, { message: 'Incorrect password.' });
        }
        
        console.log(`Authentication successful for user: ${username} (${user.id})`);
        return done(null, user);
      } catch (err) {
        console.error(`Authentication error for user ${username}:`, err);
        return done(err);
      }
    }
  ));

  // Serialize and deserialize user
  passport.serializeUser((user, done) => {
    try {
      if (!user || !user.id) {
        console.error('Failed to serialize user: Invalid user object', user);
        return done(new Error('Invalid user object for serialization'));
      }
      console.log(`Serializing user: ${user.username} (${user.id})`);
      done(null, user.id);
    } catch (error) {
      console.error('Error serializing user:', error);
      console.error('User object:', user);
      done(error);
    }
  });

  passport.deserializeUser(async (id: number, done) => {
    try {
      console.log(`Deserializing user with ID: ${id}`);
      const user = await storage.getUser(id);
      
      if (!user) {
        console.error(`User with ID ${id} not found during deserialization`);
        return done(null, false);
      }
      
      // Validate user object structure
      if (!user.id || !user.username) {
        console.error(`Invalid user object structure for ID ${id}:`, user);
        return done(new Error('Invalid user data structure'), null);
      }
      
      console.log(`Successfully deserialized user: ${user.username} (${user.id})`);
      done(null, user);
    } catch (err) {
      console.error(`Error deserializing user with ID ${id}:`, err);
      done(err);
    }
  });
}

// Middleware to check if user is authenticated
export function isAuthenticated(req: Request, res: Response, next: NextFunction) {
  console.log("Auth check requested. Session ID:", req.sessionID);
  console.log("Is authenticated:", req.isAuthenticated());
  console.log("Session:", req.session);
  
  if (req.isAuthenticated()) {
    try {
      console.log("User authenticated:", req.user.id, req.user.username);
      return next();
    } catch (error) {
      console.error("Error processing authenticated user:", error);
      console.error("User object:", req.user);
      
      // Force a clean session if the user object is invalid
      req.session.destroy((err) => {
        if (err) console.error("Error destroying corrupted session:", err);
        return res.status(401).jsonSafe({ 
          message: 'Session corrupted, please login again', 
          error: error instanceof Error ? error.message : String(error)
        });
      });
    }
  }
  
  console.log("Not authenticated, no valid session");
  return res.status(401).jsonSafe({ message: 'Not authenticated' });
}

// Middleware to check if user is a seller
export function isSeller(req: Request, res: Response, next: NextFunction) {
  console.log("Seller authorization check for path:", req.path);
  
  if (!req.isAuthenticated()) {
    console.log("Seller check failed - user not authenticated");
    return res.status(401).jsonSafe({ message: 'You must be logged in to access this resource' });
  }
  
  try {
    console.log("User authenticated for seller check:", req.user.id, req.user.username);
    console.log("User role:", req.user.role);
    
    if (req.user.role === 'seller' || req.user.role === 'admin') {
      console.log("User authorized as seller or admin");
      return next();
    }
    
    console.log("Seller authorization failed - user is not a seller or admin");
    return res.status(403).jsonSafe({ 
      message: 'You must be a seller to access this resource',
      userRole: req.user.role || 'none'
    });
  } catch (error) {
    console.error("Error in seller authorization check:", error);
    console.error("User object:", req.user);
    
    return res.status(500).jsonSafe({
      message: 'Error validating seller permissions',
      error: error instanceof Error ? error.message : String(error)
    });
  }
}

// Middleware to check if user is an admin
export function isAdmin(req: Request, res: Response, next: NextFunction) {
  console.log("Admin authorization check for path:", req.path);
  
  if (!req.isAuthenticated()) {
    console.log("Admin check failed - user not authenticated");
    return res.status(401).jsonSafe({ message: 'You must be logged in to access this resource' });
  }
  
  try {
    console.log("User authenticated for admin check:", req.user.id, req.user.username);
    console.log("User role:", req.user.role);
    
    if (req.user.role === 'admin') {
      console.log("User authorized as admin");
      return next();
    }
    
    console.log("Admin authorization failed - user is not an admin");
    return res.status(403).jsonSafe({ 
      message: 'You must be an admin to access this resource',
      userRole: req.user.role || 'none'
    });
  } catch (error) {
    console.error("Error in admin authorization check:", error);
    console.error("User object:", req.user);
    
    return res.status(500).jsonSafe({
      message: 'Error validating admin permissions',
      error: error instanceof Error ? error.message : String(error)
    });
  }
}

// Middleware to ensure a session exists for tracking purposes
export function ensureSessionForTracking(req: Request, res: Response, next: NextFunction) {
  // This middleware ensures all requests have a session, even for anonymous users
  // It's used for user activity tracking purposes
  if (!req.session.id) {
    // This shouldn't happen with our setup, but just in case
    req.session.regenerate((err) => {
      if (err) {
        console.error("Error regenerating session:", err);
      }
      next();
    });
  } else {
    next();
  }
}