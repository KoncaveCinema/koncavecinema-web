/**
 * Shapes shared by every koncavecinema-api endpoint.
 * Source: koncavecinema-api/docs/api/error-codes.md and src/common/interceptors.
 */

/** Successful response envelope added by the API's transform interceptor. */
export interface ApiEnvelope<T> {
  statusCode: number;
  success: true;
  data: T;
  meta?: PaginationMeta;
  timestamp: string;
}

/** `meta` returned by paginated list endpoints (`page`, `pageSize` query params). */
export interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  nextPage: number | null;
  previousPage: number | null;
}

export interface Paginated<T> {
  items: T[];
  meta: PaginationMeta;
}

export interface PaginationQuery {
  page?: number;
  /** Default 20, maximum 100. */
  pageSize?: number;
}

/** Error body produced by the API's global exception filter. */
export interface ApiErrorBody {
  statusCode: number;
  code: string;
  /** A list of strings for `VALIDATION_FAILED`, otherwise one sentence. */
  message: string | string[];
  error: string;
  timestamp: string;
  path: string;
}
