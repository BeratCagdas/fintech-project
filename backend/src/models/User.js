import mongoose from "mongoose";
import bcrypt from "bcrypt";

const userSchema = new mongoose.Schema({
  name: { type: String, required: [true, "İsim zorunludur"] },
  email: { type: String, required: [true, "Email zorunludur"], unique: true },
  password: { type: String, required: [true, "Şifre zorunludur"], minlength: 6 },
  riskProfile: { type: String, enum: ["low", "medium", "high"], default: "medium" },
  investmentType: { type: String, default: "kısa" },
  finance: {
    monthlyIncome: { type: Number, default: 0 },
    fixedExpenses: [
      {
        name: { type: String },
        amount: { type: Number },
      },
    ],
    variableExpenses: [
      {
        name: { type: String },
        amount: { type: Number },
      },
    ],
      goals: [
    {
      title: { type: String },
      targetAmount: { type: Number },
      currentAmount: { type: Number, default: 0 },
      deadline: { type: Date },
      category: { type: String }, // emeklilik, ev, araba, vs.
      createdAt: { type: Date, default: Date.now }
    }
  ]
  },
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
