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
        // Find user by username
        const user = await storage.getUserByUsername(username);
        if (!user) {
          return done(null, false, { message: 'Incorrect username.' });
        }
        
        // Verify password using bcrypt
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
          return done(null, false, { message: 'Incorrect password.' });
        }
        
        return done(null, user);
      } catch (err) {
        return done(err);
      }
    }
  ));

  // Serialize and deserialize user
  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (err) {
      done(err);
    }
  });
}

// Middleware to check if user is authenticated
export function isAuthenticated(req: Request, res: Response, next: NextFunction) {
  console.log("Authentication check for path:", req.path);
  console.log("Session ID:", req.sessionID);
  console.log("Is authenticated:", req.isAuthenticated());
  
  if (req.isAuthenticated()) {
    console.log("User authenticated:", req.user.id, req.user.username);
    return next();
  }
  
  console.log("Authentication failed - no valid session");
  return res.status(401).json({ message: 'You must be logged in to access this resource' });
}

// Middleware to check if user is a seller
export function isSeller(req: Request, res: Response, next: NextFunction) {
  console.log("Seller authorization check for path:", req.path);
  
  if (!req.isAuthenticated()) {
    console.log("Seller check failed - user not authenticated");
    return res.status(401).json({ message: 'You must be logged in to access this resource' });
  }
  
  console.log("User authenticated for seller check:", req.user.id, req.user.username);
  console.log("User role:", req.user.role);
  
  if (req.user.role === 'seller' || req.user.role === 'admin') {
    console.log("User authorized as seller or admin");
    return next();
  }
  
  console.log("Seller authorization failed - user is not a seller or admin");
  return res.status(403).json({ 
    message: 'You must be a seller to access this resource',
    userRole: req.user.role
  });
}

// Middleware to check if user is an admin
export function isAdmin(req: Request, res: Response, next: NextFunction) {
  console.log("Admin authorization check for path:", req.path);
  
  if (!req.isAuthenticated()) {
    console.log("Admin check failed - user not authenticated");
    return res.status(401).json({ message: 'You must be logged in to access this resource' });
  }
  
  console.log("User authenticated for admin check:", req.user.id, req.user.username);
  console.log("User role:", req.user.role);
  
  if (req.user.role === 'admin') {
    console.log("User authorized as admin");
    return next();
  }
  
  console.log("Admin authorization failed - user is not an admin");
  return res.status(403).json({ 
    message: 'You must be an admin to access this resource',
    userRole: req.user.role
  });
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