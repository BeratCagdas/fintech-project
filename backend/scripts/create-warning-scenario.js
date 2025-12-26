// scripts/create-warning-scenario.js
// Kötü finansal senaryo oluşturarak warning sistemini test et
// Demo kullanıcısını tehlikeli finansal duruma sokarak uyarıları tetikle

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import User from '../src/models/User.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '../.env') });

// MongoDB connection (PRODUCTION)
const MONGODB_URI = 'mongodb+srv://fintechuser:Fintech1234@fintectdb.l0pdwv1.mongodb.net/?appName=fintectdb';

// Run the script
createWarningScenario();

async function createWarningScenario() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Demo kullanıcısını bul (PRODUCTION USER ID)
    const userId = '694e4238c71116e9d20cf525';
    const user = await User.findById(userId);

    if (!user) {
      console.error('❌ User not found with ID:', userId);
      process.exit(1);
    }

    console.log('📝 Found user:', user.email);
    console.log('⚠️  Creating WARNING SCENARIO...\n');

    // KÖTÜ FİNANSAL SENARYO
    // Düşük gelir, yüksek giderler, yüksek borç, negatif tasarruf

    // Negatif tasarruf (son 3 ayda zarar)
    user.cumulativeSavings = 5000; // Çok düşük

    user.finance = {
      monthlyIncome: 35000, // Düşük gelir

      // Sabit Giderler (Toplam: ~32,000 TL) - GELİRDEN FAZLA!
      fixedExpenses: [
        {
          name: 'Kira',
          amount: 18000, // Çok yüksek
          category: 'kira',
          isRecurring: true,
          frequency: 'monthly',
          dayOfMonth: 1,
          autoAdd: true,
          isActive: true
        },
        {
          name: 'Elektrik Faturası',
          amount: 1500,
          category: 'faturalar',
          isRecurring: true,
          frequency: 'monthly',
          dayOfMonth: 5,
          autoAdd: true,
          isActive: true
        },
        {
          name: 'Su Faturası',
          amount: 600,
          category: 'faturalar',
          isRecurring: true,
          frequency: 'monthly',
          dayOfMonth: 5,
          autoAdd: true,
          isActive: true
        },
        {
          name: 'Doğalgaz',
          amount: 1200,
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
          name: 'Konut Kredisi Taksiti',
          amount: 9000, // Yüksek
          category: 'kredi',
          isRecurring: true,
          frequency: 'monthly',
          dayOfMonth: 1,
          autoAdd: true,
          isActive: true
        },
        {
          name: 'Araç Kredisi',
          amount: 4500, // Ek kredi
          category: 'kredi',
          isRecurring: true,
          frequency: 'monthly',
          dayOfMonth: 5,
          autoAdd: true,
          isActive: true
        }
      ],

      // Değişken Giderler (Toplam: ~15,000 TL) - Çok yüksek
      variableExpenses: [
        { name: 'Market Alışverişi', amount: 8000, category: 'market' },
        { name: 'Restoran', amount: 4000, category: 'yemek' },
        { name: 'Akaryakıt', amount: 3000, category: 'ulasim' }
      ],

      // Hedefler (ulaşılamaz)
      goals: [
        {
          title: 'Acil Durum Fonu',
          targetAmount: 100000,
          currentAmount: 5000, // Çok düşük
          deadline: new Date('2025-12-31'),
          category: 'savings',
          createdAt: new Date('2025-01-01')
        }
      ]
    };

    // Yüksek borçlar, gecikmiş ödemeler
    user.debts = [
      {
        type: 'konut_kredisi',
        name: 'Ev Kredisi',
        totalAmount: 900000,
        remainingAmount: 850000,
        monthlyPayment: 9000,
        startDate: new Date('2023-01-01'),
        status: 'aktif',
        paymentHistory: [
          { month: '2025-07', amount: 9000, onTime: true, paid: true, daysLate: 0 },
          { month: '2025-08', amount: 9000, onTime: false, paid: true, daysLate: 4 }, // GEÇ
          { month: '2025-09', amount: 9000, onTime: true, paid: true, daysLate: 0 },
          { month: '2025-10', amount: 9000, onTime: false, paid: true, daysLate: 7 }, // GEÇ
          { month: '2025-11', amount: 9000, onTime: true, paid: true, daysLate: 0 },
          { month: '2025-12', amount: 9000, onTime: false, paid: true, daysLate: 4 } // GEÇ
        ]
      },
      {
        type: 'arac_kredisi',
        name: 'Araç Kredisi',
        totalAmount: 400000,
        remainingAmount: 350000,
        monthlyPayment: 4500,
        startDate: new Date('2024-01-01'),
        status: 'aktif',
        paymentHistory: [
          { month: '2025-07', amount: 4500, onTime: true, paid: true, daysLate: 0 },
          { month: '2025-08', amount: 4500, onTime: false, paid: true, daysLate: 5 }, // GEÇ
          { month: '2025-09', amount: 4500, onTime: true, paid: true, daysLate: 0 },
          { month: '2025-10', amount: 4500, onTime: false, paid: true, daysLate: 7 }, // GEÇ
          { month: '2025-11', amount: 4500, onTime: true, paid: true, daysLate: 0 },
          { month: '2025-12', amount: 4500, onTime: true, paid: true, daysLate: 0 }
        ]
      }
    ];

    // Kredi kartları - YÜKSEK kullanım oranı
    user.creditCards = [
      {
        bankName: 'Garanti BBVA',
        limit: 50000,
        currentDebt: 47000, // %94 kullanım - TEHLİKELİ!
        utilizationRate: 94,
        status: 'aktif',
        paymentHistory: [
          { month: '2025-07', amount: 15000, onTime: true, date: new Date('2025-07-15') },
          { month: '2025-08', amount: 12000, onTime: false, date: new Date('2025-08-20') }, // GEÇ
          { month: '2025-09', amount: 18000, onTime: true, date: new Date('2025-09-15') },
          { month: '2025-10', amount: 14000, onTime: false, date: new Date('2025-10-22') }, // GEÇ
          { month: '2025-11', amount: 16000, onTime: true, date: new Date('2025-11-15') },
          { month: '2025-12', amount: 15000, onTime: false, date: new Date('2025-12-20') } // GEÇ
        ]
      },
      {
        bankName: 'İş Bankası',
        limit: 30000,
        currentDebt: 28500, // %95 kullanım - TEHLİKELİ!
        utilizationRate: 95,
        status: 'aktif',
        paymentHistory: [
          { month: '2025-07', amount: 8000, onTime: true, date: new Date('2025-07-20') },
          { month: '2025-08', amount: 7500, onTime: false, date: new Date('2025-08-25') }, // GEÇ
          { month: '2025-09', amount: 9000, onTime: true, date: new Date('2025-09-20') },
          { month: '2025-10', amount: 8500, onTime: false, date: new Date('2025-10-27') }, // GEÇ
          { month: '2025-11', amount: 7000, onTime: true, date: new Date('2025-11-20') },
          { month: '2025-12', amount: 8000, onTime: false, date: new Date('2025-12-25') } // GEÇ
        ]
      }
    ];

    // Zarar eden yatırımlar
    user.investments = [
      {
        type: 'hisse',
        name: 'Riskli Hisse Senetleri',
        totalInvested: 50000,
        purchasePrice: 50000,
        currentValue: 35000,
        profitLoss: -15000,
        purchaseDate: new Date('2024-03-01')
      },
      {
        type: 'kripto',
        name: 'Kripto Para',
        totalInvested: 20000,
        purchasePrice: 20000,
        currentValue: 8000,
        profitLoss: -12000,
        purchaseDate: new Date('2024-05-15')
      }
    ];

    // Varlıklar (yüksek kredi yükü)
    user.assets = [
      {
        type: 'ev',
        name: 'Daire (Kadıköy)',
        currentValue: 3000000,
        hasLoan: true,
        loanAmount: 850000 // Yüksek kredi
      },
      {
        type: 'araba',
        name: 'BMW 3 Serisi',
        currentValue: 700000,
        hasLoan: true,
        loanAmount: 350000 // Yüksek araç kredisi
      }
    ];

    // Aylık Geçmiş - NEGATİF tasarruf trendi
    

    // Achievements - minimal başarımlar (kötü finansal durum)
    user.achievements = {
      milestones: [
        {
          type: 'savings_1k',
          unlockedAt: new Date('2025-07-15'),
          seen: true
        },
        {
          type: 'savings_5k',
          unlockedAt: new Date('2025-08-20'),
          seen: true
        }
      ],
      savingsStreak: {
        currentStreak: 0, // Zarar eden aylar
        longestStreak: 2,
        lastSavingsMonth: '2025-08'
      },
      stats: {
        totalGoalsCompleted: 0,
        monthsWithBudgetControl: 0,
        highestMonthlySavings: 3000
      }
    };

    await user.save();

    console.log('✅ WARNING SCENARIO created successfully!\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('⚠️  CRITICAL FINANCIAL WARNINGS');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log('💰 Monthly Cash Flow:');
    console.log(`   Income: ₺${user.finance.monthlyIncome.toLocaleString()}`);
    const fixedTotal = user.finance.fixedExpenses.reduce((sum, e) => sum + e.amount, 0);
    const variableTotal = user.finance.variableExpenses.reduce((sum, e) => sum + e.amount, 0);
    const totalExpenses = fixedTotal + variableTotal;
    console.log(`   Fixed Expenses: ₺${fixedTotal.toLocaleString()}`);
    console.log(`   Variable Expenses: ₺${variableTotal.toLocaleString()}`);
    console.log(`   Total Expenses: ₺${totalExpenses.toLocaleString()}`);
    console.log(`   ⚠️  MONTHLY DEFICIT: ₺${(user.finance.monthlyIncome - totalExpenses).toLocaleString()} (NEGATIVE!)\n`);

    console.log('💳 Credit Card Danger:');
    user.creditCards.forEach(card => {
      console.log(`   ${card.bankName}: ₺${card.currentDebt.toLocaleString()} / ₺${card.limit.toLocaleString()}`);
      console.log(`   ⚠️  UTILIZATION: ${card.utilizationRate}% (CRITICAL!)`);
      const latePayments = card.paymentHistory.filter(p => !p.onTime).length;
      console.log(`   ⚠️  Late Payments: ${latePayments}/6 months\n`);
    });

    console.log('🏦 Debt Status:');
    user.debts.forEach(debt => {
      console.log(`   ${debt.name}: ₺${debt.remainingAmount.toLocaleString()}`);
      const latePayments = debt.paymentHistory.filter(p => !p.onTime).length;
      console.log(`   ⚠️  Late Payments: ${latePayments}/6 months\n`);
    });

    console.log('📊 Investment Losses:');
    user.investments.forEach(inv => {
      const percentLoss = ((inv.profitLoss / inv.totalInvested) * 100).toFixed(1);
      console.log(`   ${inv.name}: ₺${inv.currentValue.toLocaleString()}`);
      console.log(`   ⚠️  LOSS: ₺${Math.abs(inv.profitLoss).toLocaleString()} (${percentLoss}%)\n`);
    });

    console.log('💰 Cumulative Savings: ₺' + user.cumulativeSavings.toLocaleString());
    console.log('⚠️  CRITICALLY LOW!\n');

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n✅ This scenario should trigger multiple warnings:');
    console.log('   • High credit card utilization (>90%)');
    console.log('   • Negative monthly cash flow');
    console.log('   • Late payment warnings');
    console.log('   • Low savings alert');
    console.log('   • Investment loss warnings');
    console.log('   • Debt-to-income ratio warnings\n');

  } catch (error) {
    console.error('❌ Error creating warning scenario:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 MongoDB connection closed');
    process.exit(0);
  }
}

// Run the script
createWarningScenario();
