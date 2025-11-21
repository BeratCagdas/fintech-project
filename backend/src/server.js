
import dotenv from "dotenv";
dotenv.config();
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
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✅ Server ${PORT} portunda çalışıyor`));
