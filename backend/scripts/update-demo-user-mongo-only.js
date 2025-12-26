// scripts/update-demo-user-mongo-only.js
// Demo kullanıcısının SADECE MongoDB verilerini günceller
// PostgreSQL snapshot'larına dokunmaz (onlar zaten Yeni Aya Geç ile oluşuyor)

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import User from '../src/models/User.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../.env') });

// MongoDB connection (PRODUCTION)
const MONGODB_URI = 'mongodb+srv://fintechuser:Fintech1234@fintectdb.l0pdwv1.mongodb.net/?appName=fintectdb';

async function updateDemoUserMongoOnly() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // PRODUCTION USER ID
    const userId = '694e4238c71116e9d20cf525';
    const user = await User.findById(userId);

    if (!user) {
      console.error('❌ User not found with ID:', userId);
      process.exit(1);
    }

    console.log('📝 Found user:', user.email);
    console.log('🧹 Updating current month financial data...\n');

    // ═══════════════════════════════════════════════════════════
    // SADECE GEÇERLİ AYIN FİNANSAL DURUMU (MongoDB'de tutulan)
    // ═══════════════════════════════════════════════════════════

    // Birikmiş Tasarruf (6 ay * 15,000 = 90,000)
    user.cumulativeSavings = 90000;

    // Finans Bilgileri
    user.finance = {
      monthlyIncome: 55000,

      // Sabit Giderler (28,750 TL/ay)
      fixedExpenses: [
        {
          name: 'Kira',
          amount: 15000,
          category: 'kira',
          isRecurring: true,
          frequency: 'monthly',
          dayOfMonth: 1,
          autoAdd: true,
          isActive: true
        },
        {
          name: 'Elektrik',
          amount: 1200,
          category: 'faturalar',
          isRecurring: true,
          frequency: 'monthly',
          dayOfMonth: 5,
          autoAdd: true,
          isActive: true
        },
        {
          name: 'Su',
          amount: 400,
          category: 'faturalar',
          isRecurring: true,
          frequency: 'monthly',
          dayOfMonth: 5,
          autoAdd: true,
          isActive: true
        },
        {
          name: 'Doğalgaz',
          amount: 800,
          category: 'faturalar',
          isRecurring: true,
          frequency: 'monthly',
          dayOfMonth: 10,
          autoAdd: true,
          isActive: true
        },
        {
          name: 'İnternet',
          amount: 500,
          category: 'faturalar',
          isRecurring: true,
          frequency: 'monthly',
          dayOfMonth: 15,
          autoAdd: true,
          isActive: true
        },
        {
          name: 'Netflix',
          amount: 200,
          category: 'abonelik',
          isRecurring: true,
          frequency: 'monthly',
          dayOfMonth: 10,
          autoAdd: true,
          isActive: true
        },
        {
          name: 'Spotify',
          amount: 150,
          category: 'abonelik',
          isRecurring: true,
          frequency: 'monthly',
          dayOfMonth: 15,
          autoAdd: true,
          isActive: true
        },
        {
          name: 'Konut Kredisi',
          amount: 8000,
          category: 'kredi',
          isRecurring: true,
          frequency: 'monthly',
          dayOfMonth: 1,
          autoAdd: true,
          isActive: true
        },
        {
          name: 'Araç Sigortası',
          amount: 1500,
          category: 'sigorta',
          isRecurring: true,
          frequency: 'monthly',
          dayOfMonth: 20,
          autoAdd: true,
          isActive: true
        },
        {
          name: 'Spor Salonu',
          amount: 1000,
          category: 'diger',
          isRecurring: true,
          frequency: 'monthly',
          dayOfMonth: 1,
          autoAdd: true,
          isActive: true
        }
      ],

      // Değişken Giderler (11,250 TL/ay) - SADECE GEÇERLİ KATEGORİLER
      variableExpenses: [
        { name: 'Market', amount: 6000, category: 'market' },
        { name: 'Restoran', amount: 2500, category: 'yemek' },
        { name: 'Akaryakıt', amount: 2000, category: 'ulasim' },
        { name: 'Eğlence', amount: 750, category: 'eglence' }
      ],

      // Hedefler
      goals: [
        {
          title: 'Acil Durum Fonu',
          targetAmount: 150000,
          currentAmount: 90000,
          deadline: new Date('2026-06-30'),
          category: 'savings',
          createdAt: new Date('2025-01-01')
        },
        {
          title: 'Yeni Araba',
          targetAmount: 600000,
          currentAmount: 150000,
          deadline: new Date('2026-12-31'),
          category: 'purchase',
          createdAt: new Date('2025-01-01')
        }
      ]
    };

    // Borçlar (Güncel Bakiye)
    user.debts = [
      {
        type: 'konut_kredisi',
        name: 'Ev Kredisi',
        totalAmount: 800000,
        remainingAmount: 650000,
        monthlyPayment: 8000,
        startDate: new Date('2023-01-01'),
        status: 'aktif',
        paymentHistory: [
          { month: '2025-07', amount: 8000, onTime: true, paid: true, daysLate: 0 },
          { month: '2025-08', amount: 8000, onTime: true, paid: true, daysLate: 0 },
          { month: '2025-09', amount: 8000, onTime: true, paid: true, daysLate: 0 },
          { month: '2025-10', amount: 8000, onTime: true, paid: true, daysLate: 0 },
          { month: '2025-11', amount: 8000, onTime: true, paid: true, daysLate: 0 },
          { month: '2025-12', amount: 8000, onTime: true, paid: true, daysLate: 0 }
        ]
      }
    ];

    // Kredi Kartları (Güncel Borç)
    user.creditCards = [
      {
        bankName: 'Garanti BBVA',
        limit: 50000,
        currentDebt: 8500,
        utilizationRate: 17,
        status: 'aktif',
        paymentHistory: [
          { month: '2025-07', amount: 12000, onTime: true, date: new Date('2025-07-15') },
          { month: '2025-08', amount: 9500, onTime: true, date: new Date('2025-08-15') },
          { month: '2025-09', amount: 11000, onTime: true, date: new Date('2025-09-15') },
          { month: '2025-10', amount: 8000, onTime: true, date: new Date('2025-10-15') },
          { month: '2025-11', amount: 7500, onTime: true, date: new Date('2025-11-15') },
          { month: '2025-12', amount: 8500, onTime: true, date: new Date('2025-12-15') }
        ]
      },
      {
        bankName: 'İş Bankası',
        limit: 30000,
        currentDebt: 4200,
        utilizationRate: 14,
        status: 'aktif',
        paymentHistory: [
          { month: '2025-07', amount: 5000, onTime: true, date: new Date('2025-07-20') },
          { month: '2025-08', amount: 3500, onTime: true, date: new Date('2025-08-20') },
          { month: '2025-09', amount: 4500, onTime: true, date: new Date('2025-09-20') },
          { month: '2025-10', amount: 3800, onTime: true, date: new Date('2025-10-20') },
          { month: '2025-11', amount: 4000, onTime: true, date: new Date('2025-11-20') },
          { month: '2025-12', amount: 4200, onTime: true, date: new Date('2025-12-20') }
        ]
      }
    ];

    // Yatırımlar (Güncel Değer)
    user.investments = [
      {
        type: 'hisse',
        name: 'BIST 30 Endeks Fonu',
        totalInvested: 80000,
        purchasePrice: 80000,
        currentValue: 95000,
        profitLoss: 15000,
        purchaseDate: new Date('2024-06-01')
      },
      {
        type: 'doviz',
        name: 'USD/TRY',
        totalInvested: 30000,
        purchasePrice: 30000,
        currentValue: 33000,
        profitLoss: 3000,
        purchaseDate: new Date('2024-08-15')
      }
    ];

    // Varlıklar (Güncel Değer)
    user.assets = [
      {
        type: 'ev',
        name: 'Daire (Kadıköy)',
        currentValue: 3500000,
        hasLoan: true,
        loanAmount: 650000
      },
      {
        type: 'araba',
        name: 'Toyota Corolla',
        currentValue: 850000,
        hasLoan: false,
        loanAmount: 0
      }
    ];

    // Başarımlar (Achievements)
    user.achievements = {
      milestones: [
        {
          type: 'savings_10k',
          unlockedAt: new Date('2025-08-15'),
          seen: true
        },
        {
          type: 'savings_50k',
          unlockedAt: new Date('2025-11-20'),
          seen: true
        },
        {
          type: 'streak_6months',
          unlockedAt: new Date('2025-12-31'),
          seen: false
        }
      ],
      savingsStreak: {
        currentStreak: 6,
        longestStreak: 6,
        lastSavingsMonth: '2025-12'
      },
      stats: {
        totalGoalsCompleted: 0,
        monthsWithBudgetControl: 6,
        highestMonthlySavings: 15500
      }
    };

    await user.save();

    // Hesaplamalar
    const totalFixed = user.finance.fixedExpenses.reduce((sum, e) => sum + e.amount, 0);
    const totalVariable = user.finance.variableExpenses.reduce((sum, e) => sum + e.amount, 0);
    const totalExpenses = totalFixed + totalVariable;
    const monthlySavings = user.finance.monthlyIncome - totalExpenses;
    const totalDebt = user.debts.reduce((sum, d) => sum + d.remainingAmount, 0) +
                      user.creditCards.reduce((sum, c) => sum + c.currentDebt, 0);
    const totalAssets = user.assets.reduce((sum, a) => sum + a.currentValue, 0) +
                        user.investments.reduce((sum, i) => sum + i.currentValue, 0);
    const netWorth = totalAssets - totalDebt;

    console.log('✅ MongoDB data updated successfully!\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📋 USER DETAILS');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`👤 Name: ${user.name}`);
    console.log(`📧 Email: ${user.email}`);
    console.log(`🆔 User ID: ${user._id}\n`);

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('💰 MONTHLY FINANCES (Current Period)');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`💵 Monthly Income:        ₺${user.finance.monthlyIncome.toLocaleString()}`);
    console.log(`📌 Fixed Expenses:        ₺${totalFixed.toLocaleString()}`);
    console.log(`📊 Variable Expenses:     ₺${totalVariable.toLocaleString()}`);
    console.log(`➖ Total Expenses:        ₺${totalExpenses.toLocaleString()}`);
    console.log(`💰 Monthly Savings:       ₺${monthlySavings.toLocaleString()}`);
    console.log(`🏦 Cumulative Savings:    ₺${user.cumulativeSavings.toLocaleString()}\n`);

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('💳 CREDIT CARDS');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    user.creditCards.forEach(card => {
      console.log(`${card.bankName}: ₺${card.currentDebt.toLocaleString()} / ₺${card.limit.toLocaleString()} (${card.utilizationRate}% utilization)`);
    });

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🏦 DEBTS');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    user.debts.forEach(debt => {
      console.log(`${debt.name}: ₺${debt.remainingAmount.toLocaleString()} remaining (₺${debt.monthlyPayment.toLocaleString()}/month)`);
    });

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 INVESTMENTS');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    user.investments.forEach(inv => {
      const sign = inv.profitLoss >= 0 ? '+' : '';
      console.log(`${inv.name}: ₺${inv.currentValue.toLocaleString()} (${sign}₺${inv.profitLoss.toLocaleString()})`);
    });

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🏠 ASSETS');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    user.assets.forEach(asset => {
      const netValue = asset.currentValue - asset.loanAmount;
      const loanInfo = asset.hasLoan ? ` (Loan: -₺${asset.loanAmount.toLocaleString()})` : '';
      console.log(`${asset.name}: ₺${asset.currentValue.toLocaleString()}${loanInfo} → Net: ₺${netValue.toLocaleString()}`);
    });

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📈 FINANCIAL SUMMARY');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`Total Assets:  ₺${totalAssets.toLocaleString()}`);
    console.log(`Total Debt:    ₺${totalDebt.toLocaleString()}`);
    console.log(`Net Worth:     ₺${netWorth.toLocaleString()}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🏆 ACHIEVEMENTS');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`Milestones Unlocked: ${user.achievements.milestones.length}`);
    user.achievements.milestones.forEach(milestone => {
      const date = milestone.unlockedAt.toLocaleDateString('tr-TR');
      const seenIcon = milestone.seen ? '✅' : '🆕';
      console.log(`${seenIcon} ${milestone.type} - ${date}`);
    });
    console.log(`\nSavings Streak: ${user.achievements.savingsStreak.currentStreak} months (Longest: ${user.achievements.savingsStreak.longestStreak})`);
    console.log(`Budget Control Months: ${user.achievements.stats.monthsWithBudgetControl}`);
    console.log(`Highest Monthly Savings: ₺${user.achievements.stats.highestMonthlySavings.toLocaleString()}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log('✅ All data cleaned and ready!');
    console.log('⚠️  PostgreSQL snapshots NOT modified.');
    console.log('   They will be created when you click "Yeni Aya Geç" button.\n');

  } catch (error) {
    console.error('❌ Error updating user:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 MongoDB connection closed');
    process.exit(0);
  }
}

updateDemoUserMongoOnly();
