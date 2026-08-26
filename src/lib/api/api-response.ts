import { NextResponse } from 'next/server';
import { ApiError } from './api-errors';

export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
}

export interface ApiPaginatedResponse<T> {
  success: true;
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    hasNextPage: boolean;
  };
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
  requestId: string;
}

export class ApiResponse {
  static success<T>(data: T, status = 200) {
    return NextResponse.json(
      {
        success: true,
        data,
      },
      { status }
    );
  }

  static paginated<T>(data: T[], page: number, pageSize: number, total: number, status = 200) {
    return NextResponse.json(
      {
        success: true,
        data,
        pagination: {
          page,
          pageSize,
          total,
          hasNextPage: page * pageSize < total,
        },
      },
      { status }
    );
  }

  static error(error: unknown, requestId: string) {
    if (error instanceof ApiError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: error.code,
            message: error.message,
            details: error.details,
          },
          requestId,
        },
        { status: error.statusCode }
      );
    }

    // Default internal server error (never expose stack trace)
    console.error(`[API ERROR] [${requestId}]`, error);
    
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An unexpected error occurred.',
        },
        requestId,
      },
      { status: 500 }
    );
  }
}
