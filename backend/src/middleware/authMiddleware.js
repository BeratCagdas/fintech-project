import jwt from "jsonwebtoken";
import User from "../models/User.js";

export const protect = async (req, res, next) => {
  let token;

  // Header’da token varsa
  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    try {
      token = req.headers.authorization.split(" ")[1];

      // Token çöz
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Kullanıcıyı getir, şifre hariç
      req.user = await User.findById(decoded.id).select("-password");

      next();
    } catch (error) {
      console.error(error);
      res.status(401).json({ message: "Yetkisiz erişim: Token geçersiz." });
    }
  }

  if (!token) {
    res.status(401).json({ message: "Token bulunamadı." });
  }
};
export default protect;
