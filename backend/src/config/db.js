import mongoose from 'mongoose';

export async function connectDB() {
  const primaryUri =
    process.env.MONGODB_URI ||
    process.env.MONGO_URI ||
    'mongodb://127.0.0.1:27017/ijaz_traders_gst';
  const localFallback = 'mongodb://127.0.0.1:27017/ijaz_traders_gst';

  try {
    await mongoose.connect(primaryUri, {
      serverSelectionTimeoutMS: 5000,
      family: 4,
    });
    console.log(`MongoDB connected: ${mongoose.connection.host}`);
  } catch (err) {
    console.warn(`Primary MongoDB connection failed (${err.message}).`);
    if (primaryUri !== localFallback) {
      console.warn('Falling back to local MongoDB at 127.0.0.1:27017...');
      await mongoose.connect(localFallback, { serverSelectionTimeoutMS: 5000 });
      console.log(`MongoDB connected (local fallback): ${mongoose.connection.host}`);
    } else {
      throw err;
    }
  }
}
