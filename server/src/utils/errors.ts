export class AppError extends Error {
  public statusCode: number
  public code: string
  public isOperational: boolean

  constructor(message: string, statusCode: number, code: string) {
    super(message)
    this.statusCode = statusCode
    this.code = code
    this.isOperational = true
    Object.setPrototypeOf(this, AppError.prototype)
  }
}

export class BadRequestError extends AppError {
  constructor(message = 'Bad request') {
    super(message, 400, 'BAD_REQUEST')
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized') {
    super(message, 401, 'UNAUTHORIZED')
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden') {
    super(message, 403, 'FORBIDDEN')
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(message, 404, 'NOT_FOUND')
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Resource already exists') {
    super(message, 409, 'CONFLICT')
  }
}

export class TooManyRequestsError extends AppError {
  constructor(message = 'Too many requests') {
    super(message, 429, 'TOO_MANY_REQUESTS')
  }
}

export class EmailNotVerifiedError extends AppError {
  constructor(message = 'Email not verified') {
    super(message, 403, 'EMAIL_NOT_VERIFIED')
  }
}

export class AccountLockedError extends AppError {
  constructor(message = 'Account is locked. Try again later.') {
    super(message, 423, 'ACCOUNT_LOCKED')
  }
}
