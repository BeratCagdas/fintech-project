// scripts/update-demo-user.js
// Demo kullanıcısını temizle ve güncelle
// MongoDB'deki mevcut demo@gmail.com kullanıcısını temiz verilerle günceller

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '../.env') });

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/fintech';

// User Schema (simplified)
const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  phone: String,
  cumulativeSavings: { type: Number, default: 0 },

  finance: {
    monthlyIncome: Number,
    fixedExpenses: [{
      name: String,
      amount: Number,
      category: String,
      isRecurring: Boolean,
      frequency: String,
      dayOfMonth: Number,
      autoAdd: Boolean,
      isActive: Boolean
    }],
    variableExpenses: [{
      name: String,
      amount: Number,
      category: String
    }],
    goals: [{
      title: String,
      targetAmount: Number,
      currentAmount: Number,
      deadline: Date,
      category: String,
      createdAt: Date
    }]
  },

  debts: [{
    type: String,
    name: String,
    totalAmount: Number,
    remainingAmount: Number,
    monthlyPayment: Number,
    status: String,
    paymentHistory: [{
      month: String,
      amount: Number,
      onTime: Boolean,
      date: Date
    }]
  }],

  creditCards: [{
    bankName: String,
    limit: Number,
    currentDebt: Number,
    utilizationRate: Number,
    status: String,
    paymentHistory: [{
      month: String,
      amount: Number,
      onTime: Boolean,
      date: Date
    }]
  }],

  investments: [{
    type: String,
    name: String,
    totalInvested: Number,
    currentValue: Number,
    profitLoss: Number
  }],

  assets: [{
    type: String,
    name: String,
    currentValue: Number,
    hasLoan: Boolean,
    loanAmount: Number
  }],

  monthlyHistory: [{
    month: String,
    monthName: String,
    year: Number,
    income: Number,
    totalExpenses: Number,
    savings: Number,
    timestamp: Date
  }]
}, { strict: false }); // Allow existing fields to remain

const User = mongoose.model('User', userSchema);

async function updateDemoUser() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Demo kullanıcısını bul
    const userId = '694d73aef9336b8427074e29';
    const user = await User.findById(userId);

    if (!user) {
      console.error('❌ User not found with ID:', userId);
      process.exit(1);
    }

    console.log('📝 Found user:', user.email);
    console.log('🧹 Updating user data...');

    // Finansal verileri güncelle
    user.cumulativeSavings = 45000;

    user.finance = {
      monthlyIncome: 55000,

      // Sabit Giderler (Toplam: ~28,000 TL)
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
          name: 'Elektrik Faturası',
          amount: 1200,
          category: 'faturalar',
          isRecurring: true,
          frequency: 'monthly',
          dayOfMonth: 5,
          autoAdd: true,
          isActive: true
        },
        {
          name: 'Su Faturası',
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
          name: 'Konut Kredisi Taksiti',
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
        }
      ],

      // Değişken Giderler (Toplam: ~12,000 TL) - SADECE GEÇERLİ KATEGORİLER
      variableExpenses: [
        { name: 'Market Alışverişi', amount: 6000, category: 'market' },
        { name: 'Restoran', amount: 2500, category: 'yemek' },
        { name: 'Akaryakıt', amount: 2000, category: 'ulasim' },
        { name: 'Sinema', amount: 500, category: 'eglence' },
        { name: 'Giyim', amount: 1000, category: 'giyim' }
      ],

      // Hedefler
      goals: [
        {
          title: 'Acil Durum Fonu',
          targetAmount: 100000,
          currentAmount: 45000,
          deadline: new Date('2025-12-31'),
          category: 'savings',
          createdAt: new Date('2025-01-01')
        },
        {
          title: 'Yeni Araba',
          targetAmount: 500000,
          currentAmount: 120000,
          deadline: new Date('2026-06-30'),
          category: 'purchase',
          createdAt: new Date('2025-01-01')
        }
      ]
    };

    // Borçlar
    user.debts = [
      {
        type: 'konut_kredisi',
        name: 'Ev Kredisi',
        totalAmount: 800000,
        remainingAmount: 650000,
        monthlyPayment: 8000,
        status: 'aktif',
        paymentHistory: [
          { month: '2025-07', amount: 8000, onTime: true, date: new Date('2025-07-01') },
          { month: '2025-08', amount: 8000, onTime: true, date: new Date('2025-08-01') },
          { month: '2025-09', amount: 8000, onTime: true, date: new Date('2025-09-01') },
          { month: '2025-10', amount: 8000, onTime: true, date: new Date('2025-10-01') },
          { month: '2025-11', amount: 8000, onTime: true, date: new Date('2025-11-01') },
          { month: '2025-12', amount: 8000, onTime: true, date: new Date('2025-12-01') }
        ]
      }
    ];

    // Kredi Kartları
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

    // Yatırımlar
    user.investments = [
      {
        type: 'hisse',
        name: 'BIST 30 Endeks Fonu',
        totalInvested: 80000,
        currentValue: 95000,
        profitLoss: 15000
      },
      {
        type: 'doviz',
        name: 'USD/TRY',
        totalInvested: 30000,
        currentValue: 33000,
        profitLoss: 3000
      }
    ];

    // Varlıklar
    user.assets = [
      {
        type: 'ev',
        name: 'Daire (Kadıköy)',
        currentValue: 3500000,
        hasLoan: true,
        loanAmount: 650000
      },
      {
        type: 'arac',
        name: 'Toyota Corolla',
        currentValue: 850000,
        hasLoan: false,
        loanAmount: 0
      }
    ];

    // Aylık Geçmiş (Son 6 ay)
    user.monthlyHistory = [
      {
        month: '2025-07',
        monthName: 'Temmuz',
        year: 2025,
        income: 55000,
        totalExpenses: 40500,
        savings: 14500,
        timestamp: new Date('2025-07-31')
      },
      {
        month: '2025-08',
        monthName: 'Ağustos',
        year: 2025,
        income: 55000,
        totalExpenses: 39800,
        savings: 15200,
        timestamp: new Date('2025-08-31')
      },
      {
        month: '2025-09',
        monthName: 'Eylül',
        year: 2025,
        income: 55000,
        totalExpenses: 41200,
        savings: 13800,
        timestamp: new Date('2025-09-30')
      },
      {
        month: '2025-10',
        monthName: 'Ekim',
        year: 2025,
        income: 55000,
        totalExpenses: 40000,
        savings: 15000,
        timestamp: new Date('2025-10-31')
      },
      {
        month: '2025-11',
        monthName: 'Kasım',
        year: 2025,
        income: 55000,
        totalExpenses: 39500,
        savings: 15500,
        timestamp: new Date('2025-11-30')
      },
      {
        month: '2025-12',
        monthName: 'Aralık',
        year: 2025,
        income: 55000,
        totalExpenses: 40000,
        savings: 15000,
        timestamp: new Date('2025-12-31')
      }
    ];

    await user.save();

    console.log('\n✅ Demo user updated successfully!');
    console.log('\n📋 User Details:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`👤 Name: ${user.name}`);
    console.log(`📧 Email: ${user.email}`);
    console.log(`🆔 User ID: ${user._id}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n💰 Financial Summary:');
    console.log(`   Monthly Income: ₺${user.finance.monthlyIncome.toLocaleString()}`);
    console.log(`   Fixed Expenses: ₺${user.finance.fixedExpenses.reduce((sum, e) => sum + e.amount, 0).toLocaleString()}`);
    console.log(`   Variable Expenses: ₺${user.finance.variableExpenses.reduce((sum, e) => sum + e.amount, 0).toLocaleString()}`);
    console.log(`   Monthly Savings: ₺${(user.finance.monthlyIncome - user.finance.fixedExpenses.reduce((sum, e) => sum + e.amount, 0) - user.finance.variableExpenses.reduce((sum, e) => sum + e.amount, 0)).toLocaleString()}`);
    console.log(`   Cumulative Savings: ₺${user.cumulativeSavings.toLocaleString()}`);
    console.log('\n💳 Credit Cards:');
    user.creditCards.forEach(card => {
      console.log(`   ${card.bankName}: ₺${card.currentDebt.toLocaleString()} / ₺${card.limit.toLocaleString()} (${card.utilizationRate}%)`);
    });
    console.log('\n🏦 Debts:');
    user.debts.forEach(debt => {
      console.log(`   ${debt.name}: ₺${debt.remainingAmount.toLocaleString()} remaining`);
    });
    console.log('\n📊 Investments:');
    user.investments.forEach(inv => {
      console.log(`   ${inv.name}: ₺${inv.currentValue.toLocaleString()} (${inv.profitLoss >= 0 ? '+' : ''}₺${inv.profitLoss.toLocaleString()})`);
    });
    console.log('\n🏠 Assets:');
    user.assets.forEach(asset => {
      const netValue = asset.currentValue - asset.loanAmount;
      console.log(`   ${asset.name}: ₺${asset.currentValue.toLocaleString()} (Net: ₺${netValue.toLocaleString()})`);
    });
    console.log('\n📈 Monthly History: 6 months recorded');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log('⚠️  IMPORTANT: PostgreSQL snapshots are NOT updated.');
    console.log('   Clear PostgreSQL snapshots for this user first:');
    console.log(`   DELETE FROM monthly_snapshots WHERE user_id = '${userId}';`);
    console.log('   DELETE FROM expense_events WHERE user_id = '${userId}';`);
    console.log('\n   Then use "Yeni Aya Geç" to generate new snapshots.\n');

  } catch (error) {
    console.error('❌ Error updating user:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 MongoDB connection closed');
    process.exit(0);
  }
}

// Run the script
updateDemoUser();
