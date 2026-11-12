import mongoose from 'mongoose';

export async function connectDB() {
  const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;

  if (!mongoUri) {
    throw new Error(
      'MONGODB_URI is missing. Add the MongoDB Atlas connection string to the Vercel backend project environment.'
    );
  }

  try {
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 10000,
      family: 4,
    });
    console.log(`MongoDB connected: ${mongoose.connection.host}`);
  } catch (error) {
    const message = error?.message || '';

    if (/whitelist|IP address|not authorized/i.test(message)) {
      throw new Error(
        'MongoDB Atlas rejected the Vercel server IP. Update the Atlas Network Access IP access list to allow the backend deployment, then redeploy.'
      );
    }

    throw error;
  }
}
