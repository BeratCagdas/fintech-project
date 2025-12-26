// scripts/create-test-user.js
// Zengin test kullanıcısı oluşturur (MongoDB)
// Kullanım: node scripts/create-test-user.js

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/fintech';

// Test kullanıcı ID'si (PostgreSQL ile eşleştirmek için sabit)
const TEST_USER_ID = new mongoose.Types.ObjectId('676d5b67c9d5c977c88a05e3');

const testUser = {
  _id: TEST_USER_ID,
  name: 'Demo Kullanıcı',
  email: 'demo@fintech.com',
  password: 'demo123', // Hash'lenecek
  riskProfile: 'medium',
  investmentType: 'orta',

  // 🎯 Kümülatif tasarruf (6 aylık)
  cumulativeSavings: 127000,

  // 🎯 Bütçe limitleri
  budgetLimits: {
    variable: {
      market: 5000,
      yemek: 3000,
      ulasim: 1500,
      eglence: 2000,
      giyim: 2000,
      saglik: 1000,
      diger: 1000
    },
    fixed: {
      kira: 15000,
      faturalar: 2000,
      abonelik: 500,
      kredi: 8000,
      sigorta: 1500,
      egitim: 0,
      diger: 0
    }
  },

  // 🏆 Achievements
  achievements: {
    milestones: [
      { type: 'savings_10k', unlockedAt: new Date('2025-08-01'), seen: true },
      { type: 'savings_25k', unlockedAt: new Date('2025-09-01'), seen: true },
      { type: 'savings_50k', unlockedAt: new Date('2025-10-01'), seen: true },
      { type: 'savings_100k', unlockedAt: new Date('2025-11-01'), seen: true },
      { type: 'streak_3months', unlockedAt: new Date('2025-09-01'), seen: true }
    ],
    savingsStreak: {
      currentStreak: 6,
      longestStreak: 6,
      lastSavingsMonth: '2025-12'
    },
    stats: {
      totalGoalsCompleted: 2,
      monthsWithBudgetControl: 4,
      highestMonthlySavings: 28000
    }
  },

  // 💰 Mevcut ay verileri (Aralık 2025)
  finance: {
    monthlyIncome: 55000,

    // Sabit giderler
    fixedExpenses: [
      {
        name: 'Kira',
        amount: 15000,
        category: 'kira',
        isRecurring: true,
        frequency: 'monthly',
        dayOfMonth: 1,
        isActive: true,
        autoAdd: true
      },
      {
        name: 'Elektrik + Su + Doğalgaz',
        amount: 1200,
        category: 'faturalar',
        isRecurring: true,
        frequency: 'monthly',
        dayOfMonth: 5,
        isActive: true
      },
      {
        name: 'İnternet + Telefon',
        amount: 800,
        category: 'faturalar',
        isRecurring: true,
        frequency: 'monthly',
        dayOfMonth: 10,
        isActive: true
      },
      {
        name: 'Netflix + Spotify + YouTube',
        amount: 450,
        category: 'abonelik',
        isRecurring: true,
        frequency: 'monthly',
        dayOfMonth: 15,
        isActive: true
      },
      {
        name: 'Konut Kredisi Taksiti',
        amount: 6500,
        category: 'kredi',
        isRecurring: true,
        frequency: 'monthly',
        dayOfMonth: 3,
        isActive: true
      },
      {
        name: 'Araba Kredisi',
        amount: 4200,
        category: 'kredi',
        isRecurring: true,
        frequency: 'monthly',
        dayOfMonth: 8,
        isActive: true
      },
      {
        name: 'Sağlık Sigortası',
        amount: 1500,
        category: 'sigorta',
        isRecurring: true,
        frequency: 'monthly',
        dayOfMonth: 1,
        isActive: true
      }
    ],

    // 🚨 ANOMALY TRİGGER: Normal 3000₺ olan market harcaması bu ay 15000₺!
    variableExpenses: [
      { name: 'Market Alışverişi', amount: 15000, category: 'market' }, // ⚠️ ANOMALY!
      { name: 'Restoran', amount: 2500, category: 'yemek' },
      { name: 'Toplu Taşıma', amount: 800, category: 'ulasim' },
      { name: 'Sinema + Konser', amount: 1800, category: 'eglence' },
      { name: 'Giyim', amount: 1500, category: 'giyim' },
      { name: 'Eczane', amount: 600, category: 'saglik' }
    ],

    // Hedefler
    goals: [
      {
        title: 'Tatil Fonu',
        targetAmount: 50000,
        currentAmount: 38000,
        deadline: new Date('2026-06-01'),
        category: 'tatil'
      },
      {
        title: 'Acil Durum Fonu',
        targetAmount: 100000,
        currentAmount: 89000,
        deadline: new Date('2026-12-31'),
        category: 'birikim'
      }
    ]
  },

  // 💳 Kredi Kartları (1 tanesi limit aşımına yakın!)
  creditCards: [
    {
      bankName: 'Garanti BBVA',
      cardName: 'Bonus Premium',
      limit: 50000,
      currentDebt: 42000, // %84 kullanım! ⚠️
      availableLimit: 8000,
      utilizationRate: 84,
      cutoffDay: 15,
      dueDay: 5,
      status: 'aktif',
      paymentHistory: [
        {
          month: '2025-11',
          statementAmount: 38000,
          minimumPayment: 7600,
          paidAmount: 38000,
          onTime: true,
          daysLate: 0
        },
        {
          month: '2025-10',
          statementAmount: 35000,
          minimumPayment: 7000,
          paidAmount: 35000,
          onTime: true,
          daysLate: 0
        }
      ]
    },
    {
      bankName: 'İş Bankası',
      cardName: 'Maximum',
      limit: 30000,
      currentDebt: 8500, // %28 kullanım - normal
      availableLimit: 21500,
      utilizationRate: 28,
      cutoffDay: 20,
      dueDay: 10,
      status: 'aktif',
      paymentHistory: [
        {
          month: '2025-11',
          statementAmount: 9200,
          minimumPayment: 1840,
          paidAmount: 9200,
          onTime: true,
          daysLate: 0
        }
      ]
    }
  ],

  // 🏠 Borçlar
  debts: [
    {
      type: 'konut_kredisi',
      name: 'Ev Kredisi',
      bankName: 'Vakıfbank',
      totalAmount: 800000,
      remainingAmount: 520000,
      monthlyPayment: 6500,
      interestRate: 2.15,
      startDate: new Date('2022-01-01'),
      endDate: new Date('2032-01-01'),
      status: 'aktif',
      paymentHistory: [
        { month: '2025-12', paid: true, onTime: true, amount: 6500, daysLate: 0 },
        { month: '2025-11', paid: true, onTime: true, amount: 6500, daysLate: 0 },
        { month: '2025-10', paid: true, onTime: true, amount: 6500, daysLate: 0 }
      ]
    },
    {
      type: 'arac_kredisi',
      name: 'Araba Kredisi',
      bankName: 'QNB Finans',
      totalAmount: 150000,
      remainingAmount: 85000,
      monthlyPayment: 4200,
      interestRate: 2.95,
      startDate: new Date('2023-06-01'),
      endDate: new Date('2028-06-01'),
      status: 'aktif',
      paymentHistory: [
        { month: '2025-12', paid: true, onTime: true, amount: 4200, daysLate: 0 },
        { month: '2025-11', paid: true, onTime: true, amount: 4200, daysLate: 0 }
      ]
    }
  ],

  // 📈 Yatırımlar
  investments: [
    {
      type: 'hisse',
      name: 'Apple Inc.',
      symbol: 'AAPL',
      quantity: 50,
      purchasePrice: 180,
      currentPrice: 195,
      totalInvested: 9000,
      currentValue: 9750,
      profitLoss: 750,
      profitLossPercentage: 8.33,
      purchaseDate: new Date('2024-03-15'),
      platform: 'Midas'
    },
    {
      type: 'doviz',
      name: 'Dolar',
      symbol: 'USD',
      quantity: 1500,
      purchasePrice: 28.5,
      currentPrice: 32.8,
      totalInvested: 42750,
      currentValue: 49200,
      profitLoss: 6450,
      profitLossPercentage: 15.09,
      purchaseDate: new Date('2024-01-10'),
      platform: 'Vakıfbank'
    },
    {
      type: 'altin',
      name: 'Gram Altın',
      quantity: 20,
      purchasePrice: 2100,
      currentPrice: 2580,
      totalInvested: 42000,
      currentValue: 51600,
      profitLoss: 9600,
      profitLossPercentage: 22.86,
      purchaseDate: new Date('2023-11-01'),
      platform: 'Ziraat Bankası'
    }
  ],

  // 🏡 Varlıklar
  assets: [
    {
      type: 'ev',
      name: 'Konut (İstanbul, Kadıköy)',
      purchaseValue: 3500000,
      currentValue: 4200000,
      purchaseDate: new Date('2022-01-01'),
      hasLoan: true,
      loanAmount: 520000,
      loanMonthlyPayment: 6500,
      appreciationRate: 20
    },
    {
      type: 'araba',
      name: '2023 Toyota Corolla',
      purchaseValue: 150000,
      currentValue: 120000,
      purchaseDate: new Date('2023-06-01'),
      hasLoan: true,
      loanAmount: 85000,
      loanMonthlyPayment: 4200,
      appreciationRate: -20
    }
  ],

  // 💎 Net Worth
  netWorth: {
    totalAssets: 4481550, // (4.2M + 120k + 110.55k yatırım + 127k tasarruf - varlık borçları)
    totalLiabilities: 655500, // (520k + 85k + 50.5k kredi kartı)
    netValue: 3826050,
    lastCalculated: new Date()
  },

  // 📊 Geçmiş 6 ay (Temmuz - Aralık 2025)
  monthlyHistory: [
    {
      month: '2025-07',
      year: 2025,
      monthName: 'Temmuz',
      income: 50000,
      totalExpenses: 32000,
      savings: 18000,
      creditScore: 680,
      riskCategory: 'C',
      fixedExpenses: [
        { name: 'Kira', amount: 15000, category: 'kira' },
        { name: 'Faturalar', amount: 2000, category: 'faturalar' },
        { name: 'Abonelikler', amount: 450, category: 'abonelik' },
        { name: 'Krediler', amount: 10700, category: 'kredi' },
        { name: 'Sigorta', amount: 1500, category: 'sigorta' }
      ],
      variableExpenses: [
        { name: 'Market', amount: 2850, category: 'market' }
      ],
      createdAt: new Date('2025-07-01')
    },
    {
      month: '2025-08',
      year: 2025,
      monthName: 'Ağustos',
      income: 50000,
      totalExpenses: 28000,
      savings: 22000,
      creditScore: 695,
      riskCategory: 'C',
      fixedExpenses: [
        { name: 'Kira', amount: 15000, category: 'kira' },
        { name: 'Faturalar', amount: 1800, category: 'faturalar' },
        { name: 'Abonelikler', amount: 450, category: 'abonelik' },
        { name: 'Krediler', amount: 10700, category: 'kredi' }
      ],
      variableExpenses: [
        { name: 'Market', amount: 3100, category: 'market' }
      ],
      createdAt: new Date('2025-08-01')
    },
    {
      month: '2025-09',
      year: 2025,
      monthName: 'Eylül',
      income: 52000,
      totalExpenses: 31000,
      savings: 21000,
      creditScore: 705,
      riskCategory: 'B',
      fixedExpenses: [
        { name: 'Kira', amount: 15000, category: 'kira' },
        { name: 'Faturalar', amount: 2200, category: 'faturalar' },
        { name: 'Abonelikler', amount: 450, category: 'abonelik' },
        { name: 'Krediler', amount: 10700, category: 'kredi' }
      ],
      variableExpenses: [
        { name: 'Market', amount: 2900, category: 'market' }
      ],
      createdAt: new Date('2025-09-01')
    },
    {
      month: '2025-10',
      year: 2025,
      monthName: 'Ekim',
      income: 53000,
      totalExpenses: 30000,
      savings: 23000,
      creditScore: 715,
      riskCategory: 'B',
      fixedExpenses: [
        { name: 'Kira', amount: 15000, category: 'kira' },
        { name: 'Faturalar', amount: 2000, category: 'faturalar' },
        { name: 'Abonelikler', amount: 450, category: 'abonelik' },
        { name: 'Krediler', amount: 10700, category: 'kredi' }
      ],
      variableExpenses: [
        { name: 'Market', amount: 3200, category: 'market' }
      ],
      createdAt: new Date('2025-10-01')
    },
    {
      month: '2025-11',
      year: 2025,
      monthName: 'Kasım',
      income: 54000,
      totalExpenses: 29000,
      savings: 25000,
      creditScore: 720,
      riskCategory: 'B',
      fixedExpenses: [
        { name: 'Kira', amount: 15000, category: 'kira' },
        { name: 'Faturalar', amount: 1900, category: 'faturalar' },
        { name: 'Abonelikler', amount: 450, category: 'abonelik' },
        { name: 'Krediler', amount: 10700, category: 'kredi' }
      ],
      variableExpenses: [
        { name: 'Market', amount: 3050, category: 'market' }
      ],
      createdAt: new Date('2025-11-01')
    },
    {
      month: '2025-12',
      year: 2025,
      monthName: 'Aralık',
      income: 55000,
      totalExpenses: 27000,
      savings: 28000,
      creditScore: 725,
      riskCategory: 'B',
      fixedExpenses: [
        { name: 'Kira', amount: 15000, category: 'kira' },
        { name: 'Faturalar', amount: 2000, category: 'faturalar' },
        { name: 'Abonelikler', amount: 450, category: 'abonelik' },
        { name: 'Krediler', amount: 10700, category: 'kredi' }
      ],
      variableExpenses: [
        { name: 'Market', amount: 2950, category: 'market' }
      ],
      createdAt: new Date('2025-12-01')
    }
  ],

  createdAt: new Date('2025-07-01')
};

// MongoDB'ye bağlan ve kullanıcı oluştur
async function createTestUser() {
  try {
    console.log('🔌 MongoDB bağlantısı kuruluyor...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ MongoDB bağlantısı başarılı');

    // Şifreyi hashle
    const salt = await bcrypt.genSalt(10);
    testUser.password = await bcrypt.hash(testUser.password, salt);

    // Eski kullanıcıyı sil (varsa)
    const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));
    await User.deleteOne({ email: 'demo@fintech.com' });
    console.log('🧹 Eski test kullanıcısı silindi (varsa)');

    // Yeni kullanıcı oluştur
    const user = new User(testUser);
    await user.save();

    console.log('\n✅ TEST KULLANICISI OLUŞTURULDU!');
    console.log('==================================');
    console.log('📧 Email: demo@fintech.com');
    console.log('🔑 Şifre: demo123');
    console.log('🆔 User ID:', TEST_USER_ID.toString());
    console.log('💰 Kümülatif Tasarruf: 127,000₺');
    console.log('📊 Son Credit Score: 725/850');
    console.log('🏆 Milestone\'lar: 5 adet');
    console.log('🔥 Streak: 6 ay');
    console.log('⚠️  ANOMALY: Market harcaması 15,000₺ (normal: 3,000₺)');
    console.log('==================================\n');
    console.log('📝 Şimdi PostgreSQL scriptini çalıştırın:');
    console.log('   psql <DATABASE_URL> -f scripts/seed-test-user-pg.sql\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Hata:', error);
    process.exit(1);
  }
}

createTestUser();
