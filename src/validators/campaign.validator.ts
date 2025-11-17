import { body } from 'express-validator';

/**
 * Validador para crear una campaña
 */
export const createCampaignValidator = [
  body('title')
    .notEmpty()
    .withMessage('Title is required')
    .isString()
    .withMessage('Title must be a string')
    .isLength({ min: 1, max: 100 })
    .withMessage('Title must be between 1 and 100 characters'),
  
  body('message')
    .notEmpty()
    .withMessage('Message is required')
    .isString()
    .withMessage('Message must be a string')
    .isLength({ min: 1, max: 500 })
    .withMessage('Message must be between 1 and 500 characters'),
  
  body('targetType')
    .notEmpty()
    .withMessage('Target type is required')
    .isIn(['all', 'specific_users', 'barbers_only', 'clients_only'])
    .withMessage('Target type must be one of: all, specific_users, barbers_only, clients_only'),
  
  body('targetUserIds')
    .optional()
    .isArray()
    .withMessage('Target user IDs must be an array')
    .custom((value, { req }) => {
      if (req.body.targetType === 'specific_users' && (!value || value.length === 0)) {
        throw new Error('Target user IDs are required when target type is specific_users');
      }
      return true;
    }),
];

