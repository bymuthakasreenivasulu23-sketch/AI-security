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
  .map((origin) => origin.trim());

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow browser extensions (chrome-extension://) and localhost development
      if (!origin || allowedOrigins.includes(origin) || origin.startsWith('chrome-extension://')) {
        callback(null, true);
      } else {
        callback(null, true); // Dev-friendly fallback
      }
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
app.get('/', (_req, res) => {
  res.status(200).json({
    name: 'TrustLens AI API Server',
    status: 'online',
    version: '1.0.0',
    documentation: '/api/health',
  });
});

// 404 Handler
app.use((_req, res) => {
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
