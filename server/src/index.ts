import express, { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import dotenv from 'dotenv';
import { apiRouter } from './routes/api.js';
import { db } from './db/index.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Security Middleware: Helmet
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: ["'self'", 'http://localhost:*', 'chrome-extension:*'],
      },
    },
    crossOriginEmbedderPolicy: false,
  })
);

// CORS configuration
const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:5173,http://localhost:5000')
  .split(',')
  .map((origin) => origin.trim().replace(/\/$/, ''))
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, server-to-server, curl)
      if (!origin) {
        return callback(null, true);
      }

      const normalizedOrigin = origin.replace(/\/$/, '');

      // Check explicit allowed origins list
      if (allowedOrigins.includes(normalizedOrigin)) {
        return callback(null, true);
      }

      // Allow Chrome extensions
      if (origin.startsWith('chrome-extension://')) {
        return callback(null, true);
      }

      // Allow Vercel production and preview domains (*.vercel.app)
      if (/^https:\/\/[a-zA-Z0-9_-]+\.vercel\.app$/.test(origin)) {
        return callback(null, true);
      }

      // Allow local development ports
      if (
        process.env.NODE_ENV !== 'production' &&
        (/^http:\/\/localhost(:\d+)?$/.test(origin) || /^http:\/\/127\.0\.0\.1(:\d+)?$/.test(origin))
      ) {
        return callback(null, true);
      }

      // Block unauthorized origins in production
      if (process.env.NODE_ENV === 'production') {
        return callback(new Error(`Origin ${origin} is not allowed by CORS policy.`));
      }

      return callback(null, true);
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  })
);

// Request body size limits
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Mount API routes
app.use('/api', apiRouter);

// Root fallback
app.get('/', (_req: Request, res: Response) => {
  res.status(200).json({
    name: 'TrustLens AI API Server',
    status: 'online',
    version: '1.0.0',
    documentation: '/api/health',
  });
});

// 404 Handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'Resource not found',
  });
});

// Centralized Secure Error Handler (No stack traces to users)
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('[Server Error Handler]:', err.message || err);
  const status = err.status || 500;
  res.status(status).json({
    success: false,
    error: status === 500 ? 'An internal server error occurred' : err.message,
  });
});

// Server Initialization
async function startServer() {
  await db.init();
  const server = app.listen(PORT, () => {
    console.log(`[TrustLens AI] Server running on http://localhost:${PORT}`);
    console.log(`[TrustLens AI] Environment: ${process.env.NODE_ENV || 'development'}`);
  });

  const shutdown = () => {
    console.log('[TrustLens AI] Gracefully shutting down...');
    server.close(() => {
      console.log('[TrustLens AI] Closed out remaining connections.');
      process.exit(0);
    });
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

startServer();

export { app };
