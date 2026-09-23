/**
 * Supported HTTP methods.
 */
export type HttpMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH";

/**
 * Expected HTTP response payload types.
 */
export type ResponseType = "json" | "text" | "blob" | "arraybuffer";

/**
 * Representation of an outgoing HTTP request.
 */
export interface HttpRequest {
  readonly url: string;
  readonly method?: HttpMethod;
  readonly headers?: Record<string, string>;
  readonly body?: BodyInit | unknown;
  readonly signal?: AbortSignal;
  readonly responseType?: ResponseType;
}

/**
 * Representation of an incoming HTTP response.
 */
export interface HttpResponse<T = unknown> {
  readonly status: number;
  readonly statusText: string;
  readonly headers?: Headers;
  readonly data: T;
}

/**
 * Contract for HTTP client implementations (Dependency Inversion Principle).
 */
export interface IHttpClient {
  request<T = unknown>(request: HttpRequest): Promise<HttpResponse<T>>;
}

/**
 * Generic progress callback for long-running jobs.
 */
export type ProgressCallback = (status: string, details?: unknown) => void;
