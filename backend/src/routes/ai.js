// backend/src/routes/ai.js - YENİ SDK
import 'dotenv/config';
import express from 'express';
import { GoogleGenAI } from "@google/genai";
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

// YENİ SDK - API key constructor'da
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY
});

console.log('API Key kontrolü:', process.env.GEMINI_API_KEY?.substring(0, 10));

router.get('/investment-advice', authMiddleware, async (req, res) => {
  try {
    const user = req.user;
    
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ 
        success: false, 
        message: 'Gemini API key bulunamadı.' 
      });
    }

    // Giderleri hesapla
    const fixedTotal = user.finance.fixedExpenses?.reduce((sum, exp) => sum + (exp.amount || 0), 0) || 0;
    const variableTotal = user.finance.variableExpenses?.reduce((sum, exp) => sum + (exp.amount || 0), 0) || 0;
    const totalExpenses = fixedTotal + variableTotal;

    const income = user.finance.monthlyIncome || 0;
    const savings = income - totalExpenses;
    const riskProfile = user.riskProfile || 'medium';
    const investmentType = user.investmentType || 'orta';

    console.log('Hesaplanan değerler:', { income, totalExpenses, savings, riskProfile, investmentType });

    if (income === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Lütfen önce Dashboard\'dan aylık gelirinizi girin.' 
      });
    }

    const riskText = riskProfile === 'low' ? 'Düşük Risk' : 
                     riskProfile === 'medium' ? 'Orta Risk' : 'Yüksek Risk';
    const vadeText = investmentType === 'kısa' ? 'Kısa Vadeli (3-6 ay)' : 
                     investmentType === 'orta' ? 'Orta Vadeli (6-12 ay)' : 
                     'Uzun Vadeli (1-3 yıl)';
    
    const prompt = `
Sen bir profesyonel finansal danışmansın. Aşağıdaki kullanıcı bilgilerine göre TÜRKÇE yatırım tavsiyesi ver:

Kullanıcı Profili:
- Aylık Gelir: ₺${income.toLocaleString('tr-TR')}
- Aylık Gider: ₺${totalExpenses.toLocaleString('tr-TR')}
- Aylık Tasarruf: ₺${savings.toLocaleString('tr-TR')}
- Risk Profili: ${riskText}
- Vade Tercihi: ${vadeText}

KURALLAR:
1. Kısa, öz ve net tavsiyelerde bulun (maksimum 4-5 yatırım önerisi)
2. Yüzdelik dağılım öner (örn: %40 BES, %30 Altın, %30 Hisse)
3. Risk profiline ve vade tercihine uygun araçlar öner
4. Türkiye piyasasına uygun araçlar öner (BES, altın, döviz, BIST hisse senetleri, yatırım fonları)
5. Her madde için tahmini yıllık getiri oranı ver

ZORUNLU FORMAT:

🎯 ${riskText} ve ${vadeText} tercihli yatırımcı olarak size özel portföy önerisi:

**Önerilen Portföy Dağılımı:**

1. **[Yatırım Aracı İsmi]** - %[Oran]
   - [Kısa açıklama - 1-2 cümle]
   - Tahmini Yıllık Getiri: %[Oran]

2. **[Yatırım Aracı İsmi]** - %[Oran]
   - [Kısa açıklama]
   - Tahmini Yıllık Getiri: %[Oran]

💡 **Ek Tavsiye:** [Genel finansal öneri - 2-3 cümle]

⚠️ **Risk Uyarısı:** Geçmiş performans gelecekteki getirilerin garantisi değildir.
`;

    // YENİ SDK SYNTAX
   const response = await ai.models.generateContent({
  model: "gemini-2.5-flash",
  contents: prompt
});

    const advice = response.text; // .text() DEĞİL, .text!

    res.json({
      success: true,
      advice: advice,
      userProfile: {
        income: income,
        totalExpenses: totalExpenses,
        savings: savings,
        riskProfile: riskProfile,
        investmentType: investmentType
      }
    });

  } catch (err) {
    console.error('AI Advice Error:', err);
    res.status(500).json({ 
      success: false, 
      message: 'AI tavsiyesi alınamadı: ' + err.message,
      error: err.message 
    });
  }
});

export default router;