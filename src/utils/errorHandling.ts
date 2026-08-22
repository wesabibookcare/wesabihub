
/**
 * Centralized error handling utility.
 * Prepares the app for robust logging and user-friendly error messages.
 */

export enum ErrorCode {
  AUTH_UNAUTHORIZED = 'AUTH_UNAUTHORIZED',
  PAYMENT_FAILED = 'PAYMENT_FAILED',
  NETWORK_ERROR = 'NETWORK_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
}

export class AppError extends Error {
  constructor(
    public code: ErrorCode,
    message: string,
    public details?: any
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export const handleError = (error: any) => {
  console.error('[Global Error Handler]:', error);

  // In production, send to Sentry or Google Cloud Error Reporting
  // reportToSentry(error);

  if (error instanceof AppError) {
    return {
      message: error.message,
      code: error.code
    };
  }

  return {
    message: 'An unexpected error occurred. Please try again later.',
    code: ErrorCode.INTERNAL_ERROR
  };
};
