// backend/src/models/User.js
import mongoose from "mongoose";
import bcrypt from "bcrypt";

const userSchema = new mongoose.Schema({
  name: { type: String, required: [true, "İsim zorunludur"] },
  email: { type: String, required: [true, "Email zorunludur"], unique: true },
  password: { type: String, required: [true, "Şifre zorunludur"], minlength: 6 },
  riskProfile: { type: String, enum: ["low", "medium", "high"], default: "medium" },
  investmentType: { type: String, default: "kısa" },
  
  // Kümülatif tasarruf
  cumulativeSavings: { type: Number, default: 0 },
  
  // YENİ: Kategori bazlı bütçe limitleri
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
]  ,
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
      createdAt: { type: Date, default: Date.now }
    }
  ],
  
  createdAt: { type: Date, default: Date.now },
});

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