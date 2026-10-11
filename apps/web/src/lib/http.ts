import { NextResponse } from "next/server";
import type { ApiError } from "@payguard/shared";
import { logger } from "./logger";

type ErrorCode = ApiError["error"]["code"];

const STATUS: Record<ErrorCode, number> = {
  UNAUTHORIZED: 401,
  INVALID_REQUEST: 400,
  KILL_SWITCH_ACTIVE: 423,
  NOT_FOUND: 404,
  CHAIN_ERROR: 502,
  INTERNAL: 500,
};

export class HttpError extends Error {
  constructor(readonly code: ErrorCode, message: string, readonly details?: unknown) {
    super(message);
    this.name = "HttpError";
  }
}

export function errorResponse(code: ErrorCode, message: string, details?: unknown) {
  const body: ApiError = { error: { code, message, ...(details !== undefined ? { details } : {}) } };
  return NextResponse.json(body, { status: STATUS[code] });
}

/** Wrap a route handler so every thrown error becomes the standard envelope. */
export function withErrorHandling<T extends unknown[]>(handler: (...args: T) => Promise<Response>) {
  return async (...args: T): Promise<Response> => {
    try {
      return await handler(...args);
    } catch (err) {
      if (err instanceof HttpError) return errorResponse(err.code, err.message, err.details);
      logger.error("api", "unhandled error", err);
      return errorResponse("INTERNAL", "Unexpected server error");
    }
  };
}
