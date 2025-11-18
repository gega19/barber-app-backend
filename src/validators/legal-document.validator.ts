import { body, param } from 'express-validator';

export const createDocumentValidator = [
  body('type')
    .notEmpty()
    .withMessage('El tipo de documento es requerido')
    .isIn(['privacy', 'terms', 'cookies'])
    .withMessage('El tipo debe ser: privacy, terms o cookies'),
  body('title')
    .notEmpty()
    .withMessage('El título es requerido')
    .isLength({ min: 1, max: 200 })
    .withMessage('El título debe tener entre 1 y 200 caracteres'),
  body('content')
    .notEmpty()
    .withMessage('El contenido es requerido')
    .isLength({ min: 10 })
    .withMessage('El contenido debe tener al menos 10 caracteres'),
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive debe ser un booleano'),
];

export const updateDocumentValidator = [
  param('id')
    .notEmpty()
    .withMessage('El ID del documento es requerido'),
  body('title')
    .optional()
    .isLength({ min: 1, max: 200 })
    .withMessage('El título debe tener entre 1 y 200 caracteres'),
  body('content')
    .optional()
    .isLength({ min: 10 })
    .withMessage('El contenido debe tener al menos 10 caracteres'),
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive debe ser un booleano'),
];

export const getDocumentValidator = [
  param('type')
    .notEmpty()
    .withMessage('El tipo de documento es requerido')
    .isIn(['privacy', 'terms', 'cookies'])
    .withMessage('El tipo debe ser: privacy, terms o cookies'),
];

export const activateDocumentValidator = [
  param('id')
    .notEmpty()
    .withMessage('El ID del documento es requerido'),
];

export const deleteDocumentValidator = [
  param('id')
    .notEmpty()
    .withMessage('El ID del documento es requerido'),
];

