// backend/src/models/User.js - GÜNCELLENMIŞ

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  name: { type: String, required: [true, "İsim zorunludur"] },
  email: { type: String, required: [true, "Email zorunludur"], unique: true },
  password: { type: String, required: [true, "Şifre zorunludur"], minlength: 6 },
  riskProfile: { type: String, enum: ["low", "medium", "high"], default: "medium" },
  investmentType: { type: String, default: "kısa" },
  
  // Kümülatif tasarruf
  cumulativeSavings: { type: Number, default: 0 },
  
  // Kategori bazlı bütçe limitleri
  budgetLimits: {
    variable: {
      market: { type: Number, default: 0 },
      yemek: { type: Number, default: 0 },
      ulasim: { type: Number, default: 0 },
      eglence: { type: Number, default: 0 },
      giyim: { type: Number, default: 0 },
      saglik: { type: Number, default: 0 },
      diger: { type: Number, default: 0 }
    },
    fixed: {
      kira: { type: Number, default: 0 },
      faturalar: { type: Number, default: 0 },
      abonelik: { type: Number, default: 0 },
      kredi: { type: Number, default: 0 },
      sigorta: { type: Number, default: 0 },
      egitim: { type: Number, default: 0 },
      diger: { type: Number, default: 0 }
    }
  },
  
  // ✅ YENİ: Achievements/Milestones
  achievements: {
    milestones: [{
      type: {
        type: String,
        enum: [
          'savings_1k', 'savings_5k', 'savings_10k', 'savings_25k', 
          'savings_50k', 'savings_100k', 'savings_250k', 'savings_500k',
          'streak_3months', 'streak_6months', 'streak_12months',
          'goal_completed_first', 'goal_completed_5', 'goal_completed_10',
          'budget_master_3months', 'zero_debt'
        ]
      },
      unlockedAt: {
        type: Date,
        default: Date.now
      },
      seen: {
        type: Boolean,
        default: false
      }
    }],
    savingsStreak: {
      currentStreak: { type: Number, default: 0 },
      longestStreak: { type: Number, default: 0 },
      lastSavingsMonth: { type: String } // "2025-01" format
    },
    stats: {
      totalGoalsCompleted: { type: Number, default: 0 },
      monthsWithBudgetControl: { type: Number, default: 0 },
      highestMonthlySavings: { type: Number, default: 0 }
    }
  },
  
  finance: {
    monthlyIncome: { type: Number, default: 0 },
    fixedExpenses: [
      {
        name: { type: String, required: true },
        amount: { type: Number, required: true },
        isRecurring: { type: Boolean, default: false },
        frequency: { 
          type: String, 
          enum: ['daily', 'weekly', 'monthly', 'yearly'],
          default: 'monthly' 
        },
        dayOfMonth: { type: Number, min: 1, max: 31 },
        dayOfWeek: { type: Number, min: 0, max: 6 },
        nextPaymentDate: { type: Date },
        autoAdd: { type: Boolean, default: false },
        isActive: { type: Boolean, default: true },
        reminderSent: { type: Boolean, default: false },
        category: { 
          type: String,
          enum: ['kira', 'faturalar', 'abonelik', 'kredi', 'sigorta', 'egitim', 'diger'],
          default: 'diger'
        },
        createdAt: { type: Date, default: Date.now }
      }
    ],
    variableExpenses: [
      {
        name: { type: String },
        amount: { type: Number },
        category: { 
          type: String,
          enum: ['market', 'yemek', 'ulasim', 'eglence', 'giyim', 'saglik', 'diger'],
          default: 'diger'
        }
      }
    ],
    goals: [
      {
        title: { type: String },
        targetAmount: { type: Number },
        currentAmount: { type: Number, default: 0 },
        deadline: { type: Date },
        category: { type: String },
        createdAt: { type: Date, default: Date.now }
      }
    ]
  },
  
  // Borçlar
  debts: [{
    type: { 
      type: String, 
      enum: ['kredi_karti', 'ihtiyac_kredisi', 'konut_kredisi', 'arac_kredisi', 'egitim_kredisi', 'diger'],
      required: true
    },
    name: { type: String, required: true },
    bankName: String,
    totalAmount: { type: Number, required: true },
    remainingAmount: { type: Number, required: true },
    monthlyPayment: { type: Number, required: true },
    interestRate: { type: Number, default: 0 }, // % olarak
    startDate: { type: Date, required: true },
    endDate: Date,
    status: { 
      type: String, 
      enum: ['aktif', 'kapandi', 'gecikme', 'yapilandirma'],
      default: 'aktif'
    },
    paymentHistory: [{
      month: { type: String, required: true }, // "2025-12"
      dueDate: Date,
      paidDate: Date,
      amount: Number,
      paid: { type: Boolean, default: false },
      onTime: { type: Boolean, default: false },
      daysLate: { type: Number, default: 0 }
    }],
    createdAt: { type: Date, default: Date.now }
  }],
  
  // Kredi Kartları
  creditCards: [{
    bankName: { type: String, required: true },
    cardName: String,
    limit: { type: Number, required: true },
    currentDebt: { type: Number, default: 0 },
    availableLimit: { type: Number },
    utilizationRate: { type: Number, default: 0 }, // %
    cutoffDay: { type: Number, min: 1, max: 31 }, // Hesap kesim günü
    dueDay: { type: Number, min: 1, max: 31 }, // Son ödeme günü
    minimumPaymentRate: { type: Number, default: 0.2 }, // Minimum ödeme oranı
    paymentHistory: [{
      month: String,
      statementAmount: Number, // Ekstre tutarı
      minimumPayment: Number,
      paidAmount: Number,
      paidDate: Date,
      onTime: Boolean,
      daysLate: { type: Number, default: 0 }
    }],
    status: {
      type: String,
      enum: ['aktif', 'kapali', 'bloke'],
      default: 'aktif'
    },
    createdAt: { type: Date, default: Date.now }
  }],
  
  // Yatırımlar
  investments: [{
    type: { 
      type: String, 
      enum: ['hisse', 'fon', 'tahvil', 'doviz', 'altin', 'kripto', 'bist', 'diger'],
      required: true
    },
    name: { type: String, required: true },
    symbol: String, // AAPL, THYAO, BTC, vs.
    quantity: Number,
    purchasePrice: { type: Number, required: true },
    currentPrice: { type: Number },
    totalInvested: { type: Number, required: true },
    currentValue: { type: Number },
    profitLoss: { type: Number, default: 0 },
    profitLossPercentage: { type: Number, default: 0 },
    purchaseDate: { type: Date, required: true },
    platform: String, // Vakıfbank, Midas, Binance, vs.
    notes: String,
    createdAt: { type: Date, default: Date.now }
  }],
  
  // Varlıklar
  assets: [{
    type: { 
      type: String, 
      enum: ['ev', 'arsa', 'araba', 'diger'],
      required: true
    },
    name: { type: String, required: true },
    description: String,
    purchaseValue: Number,
    currentValue: { type: Number, required: true },
    purchaseDate: Date,
    hasLoan: { type: Boolean, default: false },
    loanAmount: { type: Number, default: 0 },
    loanMonthlyPayment: { type: Number, default: 0 },
    appreciationRate: Number, // Değer artış oranı %
    createdAt: { type: Date, default: Date.now }
  }],
  
  // Net Worth (Otomatik hesaplanan)
  netWorth: {
    totalAssets: { type: Number, default: 0 },
    totalLiabilities: { type: Number, default: 0 },
    netValue: { type: Number, default: 0 },
    lastCalculated: Date
  },
  
  // Aylık geçmiş
  monthlyHistory: [
    {
      month: { type: String, required: true }, // "2025-11"
      year: { type: Number, required: true },
      monthName: { type: String }, // "Kasım"
      income: { type: Number, default: 0 },
      totalExpenses: { type: Number, default: 0 },
      savings: { type: Number, default: 0 },
      fixedExpenses: [
        {
          name: String,
          amount: Number,
          category: String
        }
      ],
      variableExpenses: [
        {
          name: String,
          amount: Number,
          category: String 
        }
      ],
      creditScore: { type: Number },  // 🆕 Credit Score (300-850)
      riskCategory: { type: String },  // 🆕 Risk Category (A-E)
      createdAt: { type: Date, default: Date.now }
    }
  ],

  createdAt: { type: Date, default: Date.now }
});
 
// Net Worth Hesaplama Helper
userSchema.methods.calculateNetWorth = function() {
  // Varlıklar
  const assetValue = this.assets.reduce((sum, asset) => sum + (asset.currentValue || 0), 0);
  const investmentValue = this.investments.reduce((sum, inv) => sum + (inv.currentValue || inv.totalInvested), 0);
  const savingsValue = this.cumulativeSavings || 0;
  
  const totalAssets = assetValue + investmentValue + savingsValue;
  
  // Borçlar
  const debtValue = this.debts.reduce((sum, debt) => {
    return sum + (debt.status === 'aktif' ? debt.remainingAmount : 0);
  }, 0);
  
  const creditCardDebt = this.creditCards.reduce((sum, card) => {
    return sum + (card.status === 'aktif' ? card.currentDebt : 0);
  }, 0);
  
  const assetLoanValue = this.assets.reduce((sum, asset) => sum + (asset.loanAmount || 0), 0);
  
  const totalLiabilities = debtValue + creditCardDebt + assetLoanValue;
  
  this.netWorth = {
    totalAssets,
    totalLiabilities,
    netValue: totalAssets - totalLiabilities,
    lastCalculated: new Date()
  };
  
  return this.netWorth;
};

// Kredi Kartı Kullanım Oranı Güncelle
userSchema.methods.updateCreditCardUtilization = function() {
  this.creditCards.forEach(card => {
    if (card.limit > 0) {
      card.utilizationRate = (card.currentDebt / card.limit) * 100;
      card.availableLimit = card.limit - card.currentDebt;
    }
  });
};

// Şifre hashleme
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Şifre karşılaştırma
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model("User", userSchema);
export default User;