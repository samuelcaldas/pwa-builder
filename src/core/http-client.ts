import { NetworkError } from "./errors.js";
import type { HttpRequest, HttpResponse, IHttpClient, HttpMethod, ResponseType } from "./types.js";

/**
 * Production HTTP client wrapping the native Fetch API.
 */
export class FetchHttpClient implements IHttpClient {
  private readonly customFetch: typeof fetch;

  public constructor(customFetch?: typeof fetch) {
    this.customFetch = customFetch ?? globalThis.fetch;
  }

  public async request<T = unknown>(request: HttpRequest): Promise<HttpResponse<T>> {
    const init = this.buildRequestInit(request);
    const rawResponse = await this.customFetch(request.url, init);
    this.assertSuccessStatus(rawResponse, request.url);
    const data = await this.parseResponseBody<T>(rawResponse, request.responseType ?? "json");
    return {
      status: rawResponse.status,
      statusText: rawResponse.statusText,
      headers: rawResponse.headers,
      data
    };
  }

  private buildRequestInit(request: HttpRequest): RequestInit {
    const headers = new Headers(request.headers);
    const method: HttpMethod = request.method ?? "GET";
    const body = this.prepareRequestBody(request.body);
    return { method, headers, body, signal: request.signal };
  }

  private prepareRequestBody(body: unknown): BodyInit | undefined {
    if (body === undefined || body === null) {
      return undefined;
    }
    if (typeof body === "string" || body instanceof FormData || body instanceof Blob || body instanceof ArrayBuffer) {
      return body as BodyInit;
    }
    return JSON.stringify(body);
  }

  private assertSuccessStatus(response: Response, url: string): void {
    if (response.ok) {
      return;
    }
    throw new NetworkError(response.status, response.statusText, url);
  }

  private async parseResponseBody<T>(response: Response, type: ResponseType): Promise<T> {
    if (type === "text") {
      return (await response.text()) as unknown as T;
    }
    if (type === "blob") {
      return (await response.blob()) as unknown as T;
    }
    if (type === "arraybuffer") {
      return (await response.arrayBuffer()) as unknown as T;
    }
    return (await response.json()) as unknown as T;
  }
}

/**
 * In-memory Mock HTTP client for deterministic unit testing.
 */
export class MockHttpClient implements IHttpClient {
  private readonly routes = new Map<string, HttpResponse<unknown>>();
  private readonly history: HttpRequest[] = [];

  public onGet<T>(url: string, response: HttpResponse<T>): void {
    this.routes.set(`GET:${url}`, response as HttpResponse<unknown>);
  }

  public onPost<T>(url: string, response: HttpResponse<T>): void {
    this.routes.set(`POST:${url}`, response as HttpResponse<unknown>);
  }

  public getRequestHistory(): readonly HttpRequest[] {
    return Object.freeze([...this.history]);
  }

  public async request<T = unknown>(request: HttpRequest): Promise<HttpResponse<T>> {
    this.history.push(request);
    const key = `${request.method ?? "GET"}:${request.url}`;
    const matched = this.routes.get(key);
    if (!matched) {
      throw new NetworkError(404, "Not Found (Mock)", request.url);
    }
    if (matched.status >= 400) {
      throw new NetworkError(matched.status, matched.statusText, request.url);
    }
    return matched as HttpResponse<T>;
  }
}
