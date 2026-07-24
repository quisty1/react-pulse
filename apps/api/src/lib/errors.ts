import type { ApiErrorCode } from '@pulse/shared';

/** Доменная ошибка с HTTP-статусом и кодом для клиента */
export class AppError extends Error {
  constructor(
    public readonly code: ApiErrorCode,
    message: string,
    public readonly status: number,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export function badRequest(message: string, details?: unknown) {
  return new AppError('BAD_REQUEST', message, 400, details);
}

export function unauthorized(message = 'Unauthorized') {
  return new AppError('UNAUTHORIZED', message, 401);
}

export function forbidden(message = 'Forbidden') {
  return new AppError('FORBIDDEN', message, 403);
}

export function notFound(message = 'Not found') {
  return new AppError('NOT_FOUND', message, 404);
}

export function conflict(message: string) {
  return new AppError('CONFLICT', message, 409);
}
