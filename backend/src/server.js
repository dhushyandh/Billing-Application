import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { connectDB } from './config/db.js';
import { seedDatabase } from './utils/seed.js';
import settingsRoutes from './routes/settings.js';
import customerRoutes from './routes/customers.js';
import productRoutes from './routes/products.js';
import invoiceRoutes from './routes/invoices.js';
import reportRoutes from './routes/reports.js';
import storefrontRoutes from './routes/storefront.js';
import bookingRoutes from './routes/bookings.js';

const app = express();
const PORT = process.env.PORT || 5000;

// Reuse the same connection/initialization promise across warm serverless invocations.
let databaseInitialization;

function ensureDatabase() {
  if (!databaseInitialization) {
    databaseInitialization = (async () => {
      await connectDB();
      await seedDatabase();
    })().catch((error) => {
      // Permit a later invocation to retry if MongoDB was temporarily unavailable.
      databaseInitialization = undefined;
      throw error;
    });
  }

  return databaseInitialization;
}

app.use(cors());
app.use(express.json({ limit: '20mb' }));

// Initialize MongoDB before any API route is executed. Vercel invokes the
// exported Express app as a serverless handler; it must not call app.listen().
app.use(async (_req, res, next) => {
  try {
    await ensureDatabase();
    next();
  } catch (error) {
    console.error('Database initialization failed:', error);
    res.status(503).json({
      error: 'Database unavailable. Please try again shortly.',
    });
  }
});

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'IJAZ TRADERS GST Billing API' });
});

app.use('/api/settings', settingsRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/products', productRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/storefront', storefrontRoutes);
app.use('/api/bookings', bookingRoutes);

// Vercel detects and invokes this exported Express application.
export default app;

// Keep the same entry point usable for local development.
if (process.env.VERCEL !== '1') {
  ensureDatabase()
    .then(() => {
      app.listen(PORT, () => {
        console.log(`Backend server running on http://localhost:${PORT}`);
      });
    })
    .catch((error) => {
      console.error('Failed to start server:', error);
      process.exitCode = 1;
    });
}
