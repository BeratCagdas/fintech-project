import helmet from 'helmet';
import dotenv from "dotenv";
dotenv.config();
import express from "express";
import cors from "cors";
import { generalLimiter, authLimiter, aiLimiter } from './middleware/rateLimiter.js';
import connectDB from "./config/db.js";
import authRoutes from "./routes/auth.js";
import userRoutes from "./routes/user.js";
import aiRoutes from './routes/ai.js';
import recurringRoutes from './routes/recurring.js';
import monthlyRoutes from './routes/monthly.js';
import startMonthlyCron from './cron/monthlyReset.js';
import mongoSanitize from 'express-mongo-sanitize';
import { notFound, errorHandler } from './middleware/errorHandler.js';
connectDB();
app.use(helmet({
  contentSecurityPolicy: false, 
  crossOriginEmbedderPolicy: false
}));
const allowedOrigins = [
  'http://localhost:5173', // Development
  'http://localhost:3000',
  'https://your-app-name.vercel.app' // Production (deployment'tan sonra ekleyeceğiz)
];
const app = express();
app.use(cors({
  origin: function(origin, callback) {
    // Mobile apps ve Postman için origin undefined olabilir
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'CORS policy: Bu origin izinli değil.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(generalLimiter);
app.use(mongoSanitize());
app.use('/api/auth', authLimiter, authRoutes);
app.get("/", (req, res) => res.send("Fintect Dashboard API 🚀"));
app.use("/api/user", userRoutes);
app.use("/api/user", userRoutes);
app.use('/api/ai', aiLimiter, aiRoutes);
app.use('/api/recurring', recurringRoutes);
app.use('/api/monthly', monthlyRoutes);

startMonthlyCron(); 
app.use(notFound);
app.use(errorHandler);
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✅ Server ${PORT} portunda çalışıyor`));
