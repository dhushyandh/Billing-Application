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

app.use(cors());
app.use(express.json({ limit: '20mb' }));

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

async function start() {
  try {
    await connectDB();
    await seedDatabase();
    app.listen(PORT, () => {
      console.log(`Backend server running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

start();

