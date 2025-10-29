import User from "../models/User.js";
import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import authMiddleware from "../middleware/authMiddleware.js"; 
import { registerUser, loginUser } from "../controllers/authController.js";


const router = express.Router();

router.get("/profile", protect, async (req, res) => {
  res.json(req.user);
});
router.put("/preferences", authMiddleware, async (req, res) => {
  const { riskProfile, investmentType } = req.body;
  const user = await User.findByIdAndUpdate(
    req.user.id,
    { riskProfile, investmentType },
    { new: true }
  ).select("-password");

  if (!user) return res.status(404).json({ message: "Kullanıcı bulunamadı" });

  res.json(user);
});
router.put("/finance", protect, async (req, res) => {
  try {
    const { monthlyIncome, fixedExpenses, variableExpenses } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "Kullanıcı bulunamadı" });

    user.finance = {
      monthlyIncome,
      fixedExpenses,
      variableExpenses,
    };

    await user.save();
    res.json({ message: "Finans verileri güncellendi", finance: user.finance });
  } catch (error) {
    console.error("Finance PUT hatası:", error);
    res.status(500).json({ message: "Sunucu hatası" });
  }
});
export default router;
