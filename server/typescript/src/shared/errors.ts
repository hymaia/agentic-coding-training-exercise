/**
 * Base application error
 */
export class AppError extends Error {
  constructor(
    public code: string,
    message: string,
    public statusCode: number = 500,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'AppError';
  }
}

/**
 * Validation error
 */
export class ValidationError extends AppError {
  constructor(message: string, details?: Record<string, unknown>) {
    super('validation_error', message, 400, details);
    this.name = 'ValidationError';
  }
}

/**
 * Not found error
 */
export class NotFoundError extends AppError {
  constructor(resource: string, id?: number | string) {
    const message = id ? `${resource} with id '${id}' not found` : `${resource} not found`;
    super('not_found', message, 404);
    this.name = 'NotFoundError';
  }
}

/**
 * Conflict error
 */
export class ConflictError extends AppError {
  constructor(message: string) {
    super('conflict', message, 409);
    this.name = 'ConflictError';
  }
}

/**
 * Read-only datastore error
 */
export class ReadOnlyDataStoreError extends AppError {
  constructor(message: string = 'Write operations are disabled for the current datastore backend') {
    super('read_only_data_store', message, 405);
    this.name = 'ReadOnlyDataStoreError';
  }
}

/**
 * Internal server error
 */
export class InternalError extends AppError {
  constructor(message: string = 'An internal error occurred') {
    super('internal_error', message, 500);
    this.name = 'InternalError';
  }
}
