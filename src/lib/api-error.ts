import { NextResponse } from 'next/server';

// Error types
export enum ErrorType {
  // Authentication errors
  UNAUTHORIZED = 'unauthorized',
  FORBIDDEN = 'forbidden',
  
  // Input validation errors
  VALIDATION = 'validation_error',
  MISSING_FIELD = 'missing_field',
  INVALID_FORMAT = 'invalid_format',
  
  // Resource errors
  NOT_FOUND = 'not_found',
  ALREADY_EXISTS = 'already_exists',
  
  // Blockchain errors
  BLOCKCHAIN_ERROR = 'blockchain_error',
  TRANSACTION_FAILED = 'transaction_failed',
  CONTRACT_ERROR = 'contract_error',
  GAS_ERROR = 'gas_error',
  
  // Database errors
  DATABASE_ERROR = 'database_error',
  
  // Generic errors
  INTERNAL_ERROR = 'internal_error',
  EXTERNAL_SERVICE = 'external_service_error'
}

// Error metadata interface
export interface ErrorMetadata {
  field?: string;
  details?: any;
  code?: string;
  transactionHash?: string;
  requestId?: string;
}

// API error response structure
export interface ApiErrorResponse {
  error: {
    type: ErrorType;
    message: string;
    metadata?: ErrorMetadata;
  };
}

/**
 * Create a standardized API error response
 */
export function createApiError(
  type: ErrorType,
  message: string,
  metadata?: ErrorMetadata,
  status: number = getStatusCodeForErrorType(type)
): NextResponse<ApiErrorResponse> {
  // Log error based on environment
  if (process.env.NODE_ENV !== 'production') {
    console.error(`API Error [${type}]: ${message}`, metadata || '');
  } else {
    // In production, avoid logging sensitive data
    console.error(`API Error [${type}]: ${message}`);
  }
  
  return NextResponse.json(
    {
      error: {
        type,
        message,
        metadata
      }
    },
    { status }
  );
}

/**
 * Get the appropriate HTTP status code for an error type
 */
function getStatusCodeForErrorType(type: ErrorType): number {
  switch (type) {
    case ErrorType.UNAUTHORIZED:
      return 401;
    case ErrorType.FORBIDDEN:
      return 403;
    case ErrorType.NOT_FOUND:
      return 404;
    case ErrorType.VALIDATION:
    case ErrorType.MISSING_FIELD:
    case ErrorType.INVALID_FORMAT:
      return 400;
    case ErrorType.ALREADY_EXISTS:
      return 409;
    case ErrorType.BLOCKCHAIN_ERROR:
    case ErrorType.TRANSACTION_FAILED:
    case ErrorType.CONTRACT_ERROR:
    case ErrorType.GAS_ERROR:
      return 502;
    case ErrorType.DATABASE_ERROR:
    case ErrorType.INTERNAL_ERROR:
      return 500;
    case ErrorType.EXTERNAL_SERVICE:
      return 503;
    default:
      return 500;
  }
}

/**
 * Create a standard success response
 */
export function createApiSuccess<T>(data: T, status: number = 200): NextResponse<T> {
  return NextResponse.json(data, { status });
} 