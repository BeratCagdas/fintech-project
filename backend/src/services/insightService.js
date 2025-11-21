// backend/src/services/insightService.js
import { GoogleGenAI } from "@google/genai";
import User from '../models/User.js';

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY
});

// Retry fonksiyonu
async function retryWithBackoff(fn, maxRetries = 3, initialDelay = 2000) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      const isLastAttempt = i === maxRetries - 1;
      const isRetryableError = error.status === 'UNAVAILABLE' || 
                               error.code === 503 || 
                               error.message?.includes('overloaded');
      
      if (isLastAttempt || !isRetryableError) {
        throw error;
      }
      
      const delay = initialDelay * Math.pow(2, i);
      console.log(`⏳ Insight retry ${i + 1}/${maxRetries} after ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

// Kullanıcı verilerini topla
export const collectUserData = async (userId) => {
  const user = await User.findById(userId).lean();
  
  if (!user || !user.finance) {
    throw new Error('Kullanıcı verisi bulunamadı');
  }

  // Toplam giderler
  const fixedTotal = user.finance.fixedExpenses
    ?.filter(e => !e.isRecurring || e.isActive)
    .reduce((sum, e) => sum + (e.amount || 0), 0) || 0;
  
  const variableTotal = user.finance.variableExpenses
    ?.reduce((sum, e) => sum + (e.amount || 0), 0) || 0;
  
  const totalExpenses = fixedTotal + variableTotal;
  const income = user.finance.monthlyIncome || 0;
  const savings = income - totalExpenses;
  const savingsRate = income > 0 ? ((savings / income) * 100).toFixed(1) : 0;

  // Kategori bazlı harcamalar
  const categoryExpenses = {};
  user.finance.variableExpenses?.forEach(exp => {
    const cat = exp.category || 'diger';
    categoryExpenses[cat] = (categoryExpenses[cat] || 0) + exp.amount;
  });

  // Son 3 ay trendi
  const last3Months = user.monthlyHistory
    ?.slice(-3)
    .map(m => ({
      month: m.monthName,
      income: m.income,
      expenses: m.totalExpenses,
      savings: m.savings
    })) || [];

  // Bütçe aşımları
  const budgetOverruns = [];
  if (user.budget?.limits) {
    Object.entries(user.budget.limits).forEach(([category, limit]) => {
      const spent = categoryExpenses[category] || 0;
      if (spent > limit) {
        const overrun = spent - limit;
        const percentage = ((overrun / limit) * 100).toFixed(0);
        budgetOverruns.push({
          category,
          limit,
          spent,
          overrun,
          percentage
        });
      }
    });
  }

  return {
    income,
    totalExpenses,
    savings,
    savingsRate,
    categoryExpenses,
    last3Months,
    budgetOverruns,
    cumulativeSavings: user.cumulativeSavings || 0
  };
};

// AI ile insight üret
export const generateInsight = async (userId) => {
  try {
    const userData = await collectUserData(userId);
    
    const prompt = `
Sen bir finansal danışmansın. Kullanıcının finansal verilerini analiz edip KISA, ÖZGün ve AKSİYON ALINABİLİR bir öneri ver.

📊 KULLANICI VERİLERİ:
- Aylık Gelir: ₺${userData.income.toLocaleString('tr-TR')}
- Bu Ay Toplam Gider: ₺${userData.totalExpenses.toLocaleString('tr-TR')}
- Bu Ay Tasarruf: ₺${userData.savings.toLocaleString('tr-TR')}
- Tasarruf Oranı: %${userData.savingsRate}
- Toplam Birikim: ₺${userData.cumulativeSavings.toLocaleString('tr-TR')}

📈 SON 3 AYLIK TREND:
${userData.last3Months.length > 0 
  ? userData.last3Months.map(m => `${m.month}: Gelir ₺${m.income.toLocaleString('tr-TR')} | Gider ₺${m.expenses.toLocaleString('tr-TR')} | Tasarruf ₺${m.savings.toLocaleString('tr-TR')}`).join('\n')
  : 'Henüz geçmiş veri yok'}

💰 KATEGORİ BAZLI HARCAMALAR:
${Object.keys(userData.categoryExpenses).length > 0
  ? Object.entries(userData.categoryExpenses).map(([cat, amount]) => `${cat}: ₺${amount.toLocaleString('tr-TR')}`).join('\n')
  : 'Henüz harcama yok'}

🚨 BÜTÇE AŞIMLARI:
${userData.budgetOverruns.length > 0 
  ? userData.budgetOverruns.map(b => `${b.category}: Limit ₺${b.limit.toLocaleString('tr-TR')}, Harcama ₺${b.spent.toLocaleString('tr-TR')} (+%${b.percentage})`).join('\n')
  : 'Bütçe aşımı yok'}

🎯 GÖREV:
1. En önemli problemi veya fırsatı tespit et
2. SADECE 1-2 CÜMLE ile açıkla
3. Kaç TL tasarruf edilebileceğini söyle (opsiyonel)
4. Bir emoji ekle

📝 FORMAT (SADECE BU FORMATI KULLAN):
{
  "type": "warning" | "opportunity" | "success" | "alert" | "info",
  "icon": "emoji",
  "title": "Kısa başlık (max 40 karakter)",
  "message": "1-2 cümle öneri. Kesinlikle 150 karakterden kısa olmalı!"
}

ÖRNEK ÇIKTI 1:
{
  "type": "warning",
  "icon": "🛒",
  "title": "Market harcaması yüksek",
  "message": "Bu ay market için ₺3,200 harcadınız. Haftalık planlama ile ₺600 tasarruf edebilirsiniz."
}

ÖRNEK ÇIKTI 2:
{
  "type": "success",
  "icon": "🎉",
  "title": "Harika gidiyorsunuz!",
  "message": "Tasarruf oranınız %28! Bu hızla yıl sonunda ₺45,000 biriktirirsiniz."
}

ÖNEMLİ: 
- Sadece JSON formatında cevap ver
- Markdown veya açıklama ekleme
- Türkçe kullan
- Kısa ve net ol

ŞİMDİ ANALIZ ET VE JSON DÖNDÜR:
`;

    // ✅ Retry ile API çağrısı (ai.js pattern)
    const response = await retryWithBackoff(async () => {
      return await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt
      });
    });

    const responseText = response.text;
    
    console.log('📝 AI Response:', responseText);
    
    // JSON'ı parse et (bazen markdown içinde geliyor)
    let insight;
    try {
      // Markdown code block varsa temizle
      const jsonText = responseText
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();
      
      insight = JSON.parse(jsonText);
    } catch (parseErr) {
      console.error('JSON parse hatası:', parseErr);
      console.log('Raw response:', responseText);
      
      // Fallback insight
      insight = {
        type: 'info',
        icon: '💡',
        title: 'Finansal Durum',
        message: `Bu ay ₺${userData.savings.toLocaleString('tr-TR')} tasarruf ettiniz. Tasarruf oranınız %${userData.savingsRate}.`
      };
    }
    
    // Timestamp ekle
    insight.generatedAt = new Date();
    
    return insight;

  } catch (err) {
    console.error('Insight generation error:', err);
    
    // Hata durumunda fallback
    return {
      type: 'info',
      icon: '📊',
      title: 'Finansal Özet',
      message: 'Verileriniz analiz ediliyor. Lütfen daha sonra tekrar deneyin.',
      generatedAt: new Date()
    };
  }
};