import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import { Express } from 'express';
import session from 'express-session';
import { storage } from './storage';
import { User } from '@shared/schema';
import MemoryStore from 'memorystore';

// Add type definition for Express User
declare global {
  namespace Express {
    interface User extends User {}
  }
}

const MemoryStoreSession = MemoryStore(session);

export function setupAuth(app: Express) {
  // Configure session middleware
  app.use(session({
    secret: 'shopease-secret-key',
    resave: false,
    saveUninitialized: false,
    store: new MemoryStoreSession({
      checkPeriod: 86400000 // Cleanup expired sessions once per day
    })
  }));

  // Initialize Passport
  app.use(passport.initialize());
  app.use(passport.session());

  // Configure local strategy
  passport.use(new LocalStrategy(
    async (username, password, done) => {
      try {
        // Find user by username
        const user = await storage.getUserByUsername(username);
        if (!user) {
          return done(null, false, { message: 'Incorrect username.' });
        }
        
        // Verify password (in a real app, you'd use bcrypt to hash passwords)
        if (user.password !== password) {
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
export function isAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  return res.status(401).json({ message: 'You must be logged in to access this resource' });
}

// Middleware to check if user is a seller
export function isSeller(req, res, next) {
  if (req.isAuthenticated() && (req.user.role === 'seller' || req.user.role === 'admin')) {
    return next();
  }
  return res.status(403).json({ message: 'You must be a seller to access this resource' });
}

// Middleware to check if user is an admin
export function isAdmin(req, res, next) {
  if (req.isAuthenticated() && req.user.role === 'admin') {
    return next();
  }
  return res.status(403).json({ message: 'You must be an admin to access this resource' });
}