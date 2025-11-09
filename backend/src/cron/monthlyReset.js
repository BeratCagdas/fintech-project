// backend/src/cron/monthlyReset.js (YENİ DOSYA)
import cron from 'node-cron';
import User from '../models/User.js';
import { performMonthlyReset } from '../routes/monthly.js';

// Her ayın 1'inde saat 00:01'de çalış
// Cron format: "dakika saat gün ay haftanın_günü"
const startMonthlyCron = () => {
  // '1 0 1 * *' = Her ayın 1'inde saat 00:01
  cron.schedule('1 0 1 * *', async () => {
    console.log('🗓️ Aylık reset başlatılıyor...');
    
    try {
      // Tüm kullanıcıları getir
      const users = await User.find();
      
      for (const user of users) {
        console.log(`Reset yapılıyor: ${user.email}`);
        const result = await performMonthlyReset(user._id);
        
        if (result.success) {
          console.log(`✅ ${user.email} - Reset başarılı`);
        } else {
          console.error(`❌ ${user.email} - Reset başarısız:`, result.message);
        }
      }
      
      console.log('🎉 Aylık reset tamamlandı!');
    } catch (err) {
      console.error('❌ Cron job hatası:', err);
    }
  });

  console.log('✅ Monthly cron job başlatıldı - Her ayın 1\'inde çalışacak');
};

export default startMonthlyCron;