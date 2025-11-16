import { body, ValidationChain } from 'express-validator';

export const createCourseValidator: ValidationChain[] = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Title is required')
    .isLength({ min: 3, max: 200 })
    .withMessage('Title must be between 3 and 200 characters'),
  
  body('institution')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Institution name must not exceed 200 characters'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Description must not exceed 1000 characters'),
  
  body('completedAt')
    .optional()
    .isISO8601()
    .withMessage('Completed date must be a valid ISO 8601 date')
    .custom((value) => {
      if (value) {
        const date = new Date(value);
        const now = new Date();
        if (date > now) {
          throw new Error('Completed date cannot be in the future');
        }
      }
      return true;
    }),
  
  body('duration')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Duration must not exceed 50 characters'),
];

export const updateCourseValidator: ValidationChain[] = [
  body('title')
    .optional()
    .trim()
    .isLength({ min: 3, max: 200 })
    .withMessage('Title must be between 3 and 200 characters'),
  
  body('institution')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Institution name must not exceed 200 characters'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Description must not exceed 1000 characters'),
  
  body('completedAt')
    .optional()
    .isISO8601()
    .withMessage('Completed date must be a valid ISO 8601 date')
    .custom((value) => {
      if (value) {
        const date = new Date(value);
        const now = new Date();
        if (date > now) {
          throw new Error('Completed date cannot be in the future');
        }
      }
      return true;
    }),
  
  body('duration')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Duration must not exceed 50 characters'),
];

export const createCourseMediaValidator: ValidationChain[] = [
  body('type')
    .notEmpty()
    .withMessage('Type is required')
    .isIn(['image', 'document', 'pdf', 'video'])
    .withMessage('Type must be one of: image, document, pdf, video'),
  
  body('url')
    .notEmpty()
    .withMessage('URL is required')
    .isURL()
    .withMessage('URL must be a valid URL'),
  
  body('thumbnail')
    .optional()
    .isURL()
    .withMessage('Thumbnail must be a valid URL'),
  
  body('caption')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Caption must not exceed 200 characters'),
];

export const updateCourseMediaValidator: ValidationChain[] = [
  body('caption')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Caption must not exceed 200 characters'),
  
  body('thumbnail')
    .optional()
    .isURL()
    .withMessage('Thumbnail must be a valid URL'),
];

