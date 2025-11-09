// backend/src/config/config.js (YENİ DOSYA)
export const config = {
  env: process.env.NODE_ENV || 'development',
  port: process.env.PORT || 5000,
  mongoUri: process.env.MONGO_URI,
  jwtSecret: process.env.JWT_SECRET,
  geminiApiKey: process.env.GEMINI_API_KEY,
  
  // Frontend URL (deployment sonrası güncelleyeceğiz)
  frontendUrl: process.env.NODE_ENV === 'production' 
    ? process.env.FRONTEND_URL 
    : 'http://localhost:5173',
    
  // Güvenlik
  isProduction: process.env.NODE_ENV === 'production',
  
  // Rate limits
  rateLimits: {
    general: { windowMs: 15 * 60 * 1000, max: 100 },
    auth: { windowMs: 15 * 60 * 1000, max: 5 },
    ai: { windowMs: 60 * 1000, max: 3 }
  }
};