import { body, validationResult } from 'express-validator';

// Validation middleware
export const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      success: false,
      errors: errors.array() 
    });
  }
  next();
};

// Register validation
export const registerValidation = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('İsim 2-50 karakter olmalı'),
  body('email')
    .trim()
    .isEmail()
    .normalizeEmail()
    .withMessage('Geçerli bir email girin'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Şifre en az 6 karakter olmalı'),
  validate
];

// Login validation
export const loginValidation = [
  body('email')
    .trim()
    .isEmail()
    .normalizeEmail()
    .withMessage('Geçerli bir email girin'),
  body('password')
    .notEmpty()
    .withMessage('Şifre boş olamaz'),
  validate
];