
import dotenv from "dotenv";
// Production'da Render environment variables kullan, local'de .env dosyası kullan
if (process.env.NODE_ENV !== 'production') {
  dotenv.config();
}
import express from "express";
import cors from "cors";
import connectDB from "./config/db.js";
import authRoutes from "./routes/auth.js";
import userRoutes from "./routes/user.js";
import aiRoutes from './routes/ai.js';
import recurringRoutes from './routes/recurring.js';
import monthlyRoutes from './routes/monthly.js';
import startMonthlyCron from './cron/monthlyReset.js';
import budgetRoutes from './routes/budget.js';
import milestoneRoutes from './routes/milestones.js';
import insightsRoutes from './routes/insights.js';
import financialHealthRoutes from './routes/financialHealth.js';
import debtRoutes from './routes/debt.js';
import creditCardRoutes from './routes/creditCard.js';
import investmentRoutes from './routes/investment.js';
import assetRoutes from './routes/asset.js';
import netWorthRoutes from './routes/netWorth.js';
import analyticsRoutes from './routes/analytics.js';
import anomalyRoutes from './routes/anomalies.js';
connectDB();

const app = express();
app.use(
  cors({
    origin: [
     
      "https://fintech-frontend-8nux.onrender.com",
      "http://localhost:5173", // yerel geliştirme için
    ],
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    credentials: true,
  })
);
app.use(express.json());

// Health check endpoint for UptimeRobot
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    service: "Fintech Backend API"
  });
});

app.use("/api/auth", authRoutes);
app.get("/", (req, res) => res.send("Fintect Dashboard API 🚀"));
app.use("/api/user", userRoutes);
app.use("/api/user", userRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/recurring', recurringRoutes);
app.use('/api/monthly', monthlyRoutes);
app.use('/api/budget', budgetRoutes);
app.use("/api/milestones", milestoneRoutes);
startMonthlyCron(); 
app.use('/api/insights', insightsRoutes); 
app.use('/api/debt', debtRoutes);
app.use('/api/credit-card', creditCardRoutes);
app.use('/api/investment', investmentRoutes);
app.use('/api/asset', assetRoutes);
app.use('/api/net-worth', netWorthRoutes);
app.use('/api/financial-health', financialHealthRoutes);  // PYHTON API ENDPOINT
app.use('/api/analytics', analyticsRoutes); // Creditscoore endpoint
app.use('/api/anomalies', anomalyRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✅ Server ${PORT} portunda çalışıyor`));
