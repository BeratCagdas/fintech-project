import express from "express";
import { registerUser, loginUser } from "../controllers/authController.js";
import { registerValidation, loginValidation } from '../middleware/validator.js';
const router = express.Router();

router.post('/register', registerValidation, register);
router.post('/login', loginValidation, login);

export default router;
