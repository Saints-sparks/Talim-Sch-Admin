import { API_BASE_URL } from "@/app/lib/api/config";
import { ApiError } from "./apiError";

/** Request options accepted by the client (a superset of `fetch`'s). */
export interface RequestConfig extends RequestInit {
  /** Abort after this many milliseconds. Default 30 000. */
  timeoutMs?: number;
  /** Internal: set once a request has been retried after a token refresh. */
  _retry?: boolean;
}

type ErrorListener = (error: ApiError) => void;

const DEFAULT_TIMEOUT_MS = 30_000;

/**
 * The single HTTP client for the School Admin app.
 *
 * - Prefixes relative paths with `API_BASE_URL` and attaches the bearer token.
 * - Refreshes the token once on 401 (queueing concurrent requests), then
 *   signs the user out if that fails.
 * - Detects offline / unreachable / timed-out requests and reports them as
 *   `ApiError`s with stable codes, so pages never see a raw `TypeError`.
 * - `get/post/put/patch/delete` return the raw `Response` (the surface the
 *   existing services were written against); the typed `api` facade at the
 *   bottom of this file parses JSON and throws `ApiError` on any non-2xx,
 *   and is what new and migrated code should use.
 */
class ApiClient {
  private accessToken: string | null = null;
  private refreshCallback: (() => Promise<boolean>) | null = null;
  private isRefreshing = false;
  private failedQueue: Array<{ resolve: (value: string | null) => void; reject: (error?: unknown) => void }> = [];
  private errorListeners = new Set<ErrorListener>();

  /** Stores the access token for subsequent requests. */
  setAccessToken(token: string | null): void {
    this.accessToken = token;
  }

  private getStoredAccessToken(): string | null {
    if (typeof window === "undefined") return null;
    return this.accessToken || localStorage.getItem("accessToken") || sessionStorage.getItem("accessToken");
  }

  /** Registers the function that obtains a fresh token (provided by AuthContext). */
  setRefreshCallback(callback: () => Promise<boolean>): void {
    this.refreshCallback = callback;
  }

  /** Called once by AuthContext on mount. */
  initialize(token: string | null, refreshCallback: () => Promise<boolean>): void {
    this.setAccessToken(token);
    this.setRefreshCallback(refreshCallback);
  }

  /**
   * Subscribes to every `ApiError` the client produces — the network banner
   * and global toast use this so pages don't each handle connectivity.
   *
   * @returns An unsubscribe function.
   */
  onError(listener: ErrorListener): () => void {
    this.errorListeners.add(listener);
    return () => this.errorListeners.delete(listener);
  }

  private emitError(error: ApiError): void {
    for (const listener of this.errorListeners) {
      try {
        listener(error);
      } catch {
        /* a listener must never break a request */
      }
    }
  }

  private processQueue(error: unknown, token: string | null = null): void {
    for (const { resolve, reject } of this.failedQueue) (error ? reject(error) : resolve(token));
    this.failedQueue = [];
  }

  private async handleRefresh(): Promise<string | null> {
    if (this.isRefreshing) {
      return new Promise<string | null>((resolve, reject) => this.failedQueue.push({ resolve, reject }));
    }
    this.isRefreshing = true;
    try {
      if (!this.refreshCallback) throw new Error("No refresh callback set");
      const success = await this.refreshCallback();
      if (!success) throw new Error("Refresh failed");
      this.processQueue(null, this.accessToken);
      return this.accessToken;
    } catch (error) {
      this.processQueue(error, null);
      throw error;
    } finally {
      this.isRefreshing = false;
    }
  }

  private buildUrl(endpoint: string): string {
    if (endpoint.startsWith("http")) return endpoint;
    return `${API_BASE_URL}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;
  }

  private withAuth(config: RequestConfig): RequestConfig {
    const token = this.getStoredAccessToken();
    if (token) {
      if (!this.accessToken) this.accessToken = token;
      config.headers = { ...(config.headers as Record<string, string>), Authorization: `Bearer ${token}` };
    }
    config.credentials = "include";
    return config;
  }

  /**
   * Performs `fetch` with timeout and connectivity handling. Throws
   * `ApiError` for offline / unreachable / timeout; returns the `Response`
   * (of any status) otherwise.
   */
  private async doFetch(url: string, config: RequestConfig): Promise<Response> {
    if (typeof navigator !== "undefined" && navigator.onLine === false) {
      const error = ApiError.offline();
      this.emitError(error);
      throw error;
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), config.timeoutMs ?? DEFAULT_TIMEOUT_MS);
    const upstream = config.signal;
    if (upstream) upstream.addEventListener("abort", () => controller.abort(), { once: true });

    try {
      return await fetch(url, { ...config, signal: controller.signal });
    } catch (err) {
      let error: ApiError;
      if ((err as Error)?.name === "AbortError") {
        error = upstream?.aborted ? (err as ApiError) : ApiError.timeout();
      } else if (typeof navigator !== "undefined" && navigator.onLine === false) {
        error = ApiError.offline();
      } else {
        error = ApiError.unreachable();
      }
      if (error instanceof ApiError) this.emitError(error);
      throw error;
    } finally {
      clearTimeout(timer);
    }
  }

  /**
   * Low-level request. Returns the `Response` for any status so callers that
   * pre-date `ApiError` keep working; refreshes the token once on 401.
   *
   * @param url - Absolute URL or a path relative to `API_BASE_URL`.
   * @param config - Fetch options plus `timeoutMs`.
   */
  async request(url: string, config: RequestConfig = {}): Promise<Response> {
    const fullUrl = this.buildUrl(url);
    let response = await this.doFetch(fullUrl, this.withAuth(config));

    if (response.status === 401 && !config._retry) {
      try {
        await this.handleRefresh();
      } catch (refreshError) {
        window.dispatchEvent(new CustomEvent("auth-changed", { detail: { type: "logout" } }));
        throw refreshError;
      }
      response = await this.doFetch(fullUrl, this.withAuth({ ...config, _retry: true }));
    }

    return response;
  }

  /**
   * Performs a request and parses the JSON body. Any non-2xx status becomes an
   * `ApiError` carrying the server's `error.code`, message and field details.
   *
   * @typeParam T - Shape of the successful body (the legacy shape, or the
   *   canonical `{ success, data }` envelope once `API_ENVELOPE_SUCCESS` is on).
   */
  async json<T>(url: string, config: RequestConfig = {}): Promise<T> {
    const response = await this.request(url, config);
    const text = await response.text();
    let body: unknown = null;
    if (text) {
      try {
        body = JSON.parse(text);
      } catch {
        body = null;
      }
    }

    if (!response.ok) {
      const error = ApiError.fromResponse(response, body as Parameters<typeof ApiError.fromResponse>[1]);
      this.emitError(error);
      throw error;
    }
    return body as T;
  }

  /** Builds a JSON (or FormData) request config for a body-carrying method. */
  bodyConfig(method: string, data: unknown, config: RequestConfig): RequestConfig {
    const isFormData = typeof FormData !== "undefined" && data instanceof FormData;
    return {
      ...config,
      method,
      headers: isFormData ? config.headers : { "Content-Type": "application/json", ...(config.headers as Record<string, string>) },
      body: data === undefined ? undefined : isFormData ? (data as FormData) : JSON.stringify(data),
    };
  }

  // ─── Legacy surface: raw Response. Existing callers read `.ok` / `.json()`
  // themselves. New code should use the typed `api` facade below.

  /** `GET` returning the raw `Response`. Prefer `api.get<T>()`. */
  get(url: string, config: RequestConfig = {}): Promise<Response> {
    return this.request(url, { ...config, method: "GET" });
  }

  /** `POST` returning the raw `Response`. Prefer `api.post<T>()`. */
  post(url: string, data?: unknown, config: RequestConfig = {}): Promise<Response> {
    return this.request(url, this.bodyConfig("POST", data, config));
  }

  /** `PUT` returning the raw `Response`. Prefer `api.put<T>()`. */
  put(url: string, data?: unknown, config: RequestConfig = {}): Promise<Response> {
    return this.request(url, this.bodyConfig("PUT", data, config));
  }

  /** `PATCH` returning the raw `Response`. Prefer `api.patch<T>()`. */
  patch(url: string, data?: unknown, config: RequestConfig = {}): Promise<Response> {
    return this.request(url, this.bodyConfig("PATCH", data, config));
  }

  /** `DELETE` returning the raw `Response`. Prefer `api.delete<T>()`. */
  delete(url: string, config: RequestConfig = {}): Promise<Response> {
    return this.request(url, { ...config, method: "DELETE" });
  }
}

/** Singleton client. Import this everywhere; never call `fetch` directly. */
export const apiClient = new ApiClient();

/**
 * Typed facade over the same client: every method parses the JSON body and
 * throws `ApiError` on any non-2xx, offline, unreachable or timed-out request.
 * Use this in all new and migrated code.
 *
 * @example
 * const classes = await api.get<Class[]>("/classes");
 * await api.post<{ userId: string }>("/auth/register", payload);
 */
export const api = {
  get: <T = unknown>(url: string, config: RequestConfig = {}) => apiClient.json<T>(url, { ...config, method: "GET" }),
  post: <T = unknown>(url: string, data?: unknown, config: RequestConfig = {}) =>
    apiClient.json<T>(url, apiClient.bodyConfig("POST", data, config)),
  put: <T = unknown>(url: string, data?: unknown, config: RequestConfig = {}) =>
    apiClient.json<T>(url, apiClient.bodyConfig("PUT", data, config)),
  patch: <T = unknown>(url: string, data?: unknown, config: RequestConfig = {}) =>
    apiClient.json<T>(url, apiClient.bodyConfig("PATCH", data, config)),
  delete: <T = unknown>(url: string, config: RequestConfig = {}) => apiClient.json<T>(url, { ...config, method: "DELETE" }),
};
