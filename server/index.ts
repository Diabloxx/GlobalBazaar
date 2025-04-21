import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

// Add jsonSafe method to Express Response interface
declare global {
  namespace Express {
    interface Response {
      jsonSafe: (data: any) => Response;
    }
  }
}

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Add custom JSON serialization method to response object
// This helps prevent "object Object is not valid JSON" errors
express.response.jsonSafe = function(data: any) {
  try {
    // Use a cache to handle circular references
    const cache = new Set();
    const safeData = JSON.parse(JSON.stringify(data, (key, value) => {
      if (typeof value === 'object' && value !== null) {
        if (cache.has(value)) {
          return '[Circular Reference]';
        }
        cache.add(value);
      }
      return value;
    }));
    
    return this.json(safeData);
  } catch (error) {
    console.error('JSON serialization error:', error);
    console.error('Failed to serialize data type:', typeof data);
    
    // If serialization fails, send a safe error response
    return this.status(500).json({
      error: 'Failed to serialize response data',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    
    console.error("Server error:", {
      path: _req.path,
      method: _req.method,
      status,
      message,
      stack: err.stack
    });

    // Use our safe JSON serialization method
    res.status(status).jsonSafe({ 
      message,
      path: _req.path
    });
    
    if (app.get("env") === "development") {
      throw err; // Rethrow in development for better error reporting
    }
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = 5000;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();
