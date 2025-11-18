import { body, param } from 'express-validator';

export const createVersionValidator = [
  body('version')
    .notEmpty()
    .withMessage('La versión es requerida')
    .matches(/^\d+\.\d+\.\d+$/)
    .withMessage('La versión debe seguir el formato semántico (ej: 1.0.0)'),
  body('versionCode')
    .notEmpty()
    .withMessage('El código de versión es requerido')
    .isInt({ min: 1 })
    .withMessage('El código de versión debe ser un número entero mayor a 0'),
  body('releaseNotes')
    .optional()
    .isString()
    .withMessage('Las notas de versión deben ser texto'),
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive debe ser un booleano'),
];

export const updateVersionValidator = [
  param('id')
    .notEmpty()
    .withMessage('El ID de versión es requerido'),
  body('version')
    .optional()
    .matches(/^\d+\.\d+\.\d+$/)
    .withMessage('La versión debe seguir el formato semántico (ej: 1.0.0)'),
  body('releaseNotes')
    .optional()
    .isString()
    .withMessage('Las notas de versión deben ser texto'),
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive debe ser un booleano'),
];

export const activateVersionValidator = [
  param('id')
    .notEmpty()
    .withMessage('El ID de versión es requerido'),
];

export const deleteVersionValidator = [
  param('id')
    .notEmpty()
    .withMessage('El ID de versión es requerido'),
];

export const getVersionValidator = [
  param('id')
    .notEmpty()
    .withMessage('El ID de versión es requerido'),
];

export const downloadVersionValidator = [
  param('versionId')
    .notEmpty()
    .withMessage('El ID de versión es requerido'),
];

