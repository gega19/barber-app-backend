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
    .custom((value) => {
      const num = parseInt(value, 10);
      if (isNaN(num) || num < 1) {
        throw new Error('El código de versión debe ser un número entero mayor a 0');
      }
      return true;
    }),
  body('releaseNotes')
    .optional()
    .isString()
    .withMessage('Las notas de versión deben ser texto'),
  body('isActive')
    .optional()
    .custom((value) => {
      // Aceptar string "true"/"false" o booleano
      if (value === 'true' || value === 'false' || value === true || value === false) {
        return true;
      }
      throw new Error('isActive debe ser true o false');
    }),
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

