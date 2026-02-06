import { body, ValidationChain } from 'express-validator';

export const registerValidator: ValidationChain[] = [
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number')
    .optional(),
  
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 2 })
    .withMessage('Name must be at least 2 characters long'),
  
  body('phone')
    .optional()
    .matches(/^\+?[\d\s-()]+$/)
    .withMessage('Please provide a valid phone number'),
  
  body('location')
    .optional()
    .trim()
    .isLength({ min: 3 })
    .withMessage('Location must be at least 3 characters long'),
];

export const loginValidator: ValidationChain[] = [
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
];

export const refreshTokenValidator: ValidationChain[] = [
  body('refreshToken')
    .notEmpty()
    .withMessage('Refresh token is required'),
];

export const confirmPhoneValidator: ValidationChain[] = [
  body('phone')
    .trim()
    .notEmpty()
    .withMessage('Phone is required')
    .matches(/^\+?[\d\s-()]+$/)
    .withMessage('Please provide a valid phone number (E.164 recommended)'),
];

/** Para enviar el código: solo phone */
export const sendPhoneCodeValidator: ValidationChain[] = [
  body('phone')
    .trim()
    .notEmpty()
    .withMessage('Phone is required')
    .matches(/^\+?[\d\s-()]+$/)
    .withMessage('Please provide a valid phone number (E.164 recommended)'),
];

/** Para confirmar: phone + code */
export const confirmPhoneWithCodeValidator: ValidationChain[] = [
  body('phone')
    .trim()
    .notEmpty()
    .withMessage('Phone is required')
    .matches(/^\+?[\d\s-()]+$/)
    .withMessage('Please provide a valid phone number (E.164 recommended)'),
  body('code')
    .trim()
    .notEmpty()
    .withMessage('Verification code is required')
    .isLength({ min: 4, max: 8 })
    .withMessage('Code must be between 4 and 8 characters'),
];

