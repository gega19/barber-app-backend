import { body, param } from 'express-validator';

/**
 * Validador para registrar un token FCM
 */
export const registerTokenValidator = [
  body('token')
    .notEmpty()
    .withMessage('Token is required')
    .isString()
    .withMessage('Token must be a string')
    .isLength({ min: 1, max: 500 })
    .withMessage('Token must be between 1 and 500 characters'),
  
  body('deviceType')
    .notEmpty()
    .withMessage('Device type is required')
    .isIn(['android', 'ios'])
    .withMessage('Device type must be either "android" or "ios"'),
];

/**
 * Validador para eliminar un token específico
 */
export const deleteTokenValidator = [
  param('token')
    .notEmpty()
    .withMessage('Token is required')
    .isString()
    .withMessage('Token must be a string'),
];

