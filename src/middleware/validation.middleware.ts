import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';

export const handleValidationErrors = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.error('❌ Validation errors:', errors.array());
    const errorMessages = errors.array().map(err => err.msg).join(', ');
    res.status(400).json({
      success: false,
      message: `Error de validación: ${errorMessages}`,
      errors: errors.array(),
    });
    return;
  }
  next();
};

