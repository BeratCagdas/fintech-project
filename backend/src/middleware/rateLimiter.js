// backend/src/middleware/rateLimiter.js (YENİ DOSYA)
import rateLimit from 'express-rate-limit';

// Genel rate limit
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 dakika
  max: 100, // 15 dakikada maksimum 100 istek
  message: 'Çok fazla istek gönderdiniz. Lütfen daha sonra tekrar deneyin.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Auth route'ları için daha sıkı limit
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // 15 dakikada maksimum 5 login/register denemesi
  message: 'Çok fazla giriş denemesi. 15 dakika sonra tekrar deneyin.',
  skipSuccessfulRequests: true,
});

// AI route için limit
export const aiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 dakika
  max: 3, // Dakikada 3 AI isteği
  message: 'AI istekleri için limit aşıldı. Lütfen bekleyin.',
});