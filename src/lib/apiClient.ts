import { API_BASE_URL } from "@/app/lib/api/config";

interface RequestConfig extends RequestInit {
  _retry?: boolean;
}

class ApiClient {
  private accessToken: string | null = null;
  private refreshCallback: (() => Promise<boolean>) | null = null;
  private isRefreshing = false;
  private failedQueue: Array<{
    resolve: (value?: any) => void;
    reject: (error?: any) => void;
  }> = [];

  setAccessToken(token: string | null) {
    this.accessToken = token;
  }

  setRefreshCallback(callback: () => Promise<boolean>) {
    this.refreshCallback = callback;
  }

  // Initialize method to be called from AuthContext
  initialize(token: string | null, refreshCallback: () => Promise<boolean>) {
    this.setAccessToken(token);
    this.setRefreshCallback(refreshCallback);
  }

  private processQueue(error: any, token: string | null = null) {
    this.failedQueue.forEach(({ resolve, reject }) => {
      if (error) {
        reject(error);
      } else {
        resolve(token);
      }
    });

    this.failedQueue = [];
  }

  private async handleRefresh(): Promise<string | null> {
    if (this.isRefreshing) {
      // If refresh is already in progress, queue this request
      return new Promise((resolve, reject) => {
        this.failedQueue.push({ resolve, reject });
      });
    }

    this.isRefreshing = true;

    try {
      if (!this.refreshCallback) {
        throw new Error("No refresh callback set");
      }

      const success = await this.refreshCallback();
      if (success) {
        this.processQueue(null, this.accessToken);
        return this.accessToken;
      } else {
        throw new Error("Refresh failed");
      }
    } catch (error) {
      this.processQueue(error, null);
      throw error;
    } finally {
      this.isRefreshing = false;
    }
  }

  async request(url: string, config: RequestConfig = {}): Promise<Response> {
    // Add Authorization header if token exists
    if (this.accessToken) {
      config.headers = {
        ...config.headers,
        Authorization: `Bearer ${this.accessToken}`,
      };
    }

    // Add credentials for cookie handling
    config.credentials = "include";

    // Make the request
    let response = await fetch(url, config);

    // If 401 and not already a retry, attempt to refresh token
    if (response.status === 401 && !config._retry) {
      try {
        await this.handleRefresh();

        // Retry the original request with new token
        config._retry = true;
        if (this.accessToken) {
          config.headers = {
            ...config.headers,
            Authorization: `Bearer ${this.accessToken}`,
          };
        }

        response = await fetch(url, config);
      } catch (refreshError) {
        // Refresh failed, redirect to login or handle as needed
        console.error("Token refresh failed:", refreshError);

        // Trigger logout event
        window.dispatchEvent(
          new CustomEvent("auth-changed", {
            detail: { type: "logout" },
          })
        );

        throw refreshError;
      }
    }

    return response;
  }

  // Convenience methods
  async get(url: string, config: RequestConfig = {}) {
    return this.request(url, { ...config, method: "GET" });
  }

  async post(url: string, data?: any, config: RequestConfig = {}) {
    return this.request(url, {
      ...config,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...config.headers,
      },
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put(url: string, data?: any, config: RequestConfig = {}) {
    return this.request(url, {
      ...config,
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...config.headers,
      },
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete(url: string, config: RequestConfig = {}) {
    return this.request(url, { ...config, method: "DELETE" });
  }

  async patch(url: string, data?: any, config: RequestConfig = {}) {
    return this.request(url, {
      ...config,
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        ...config.headers,
      },
      body: data ? JSON.stringify(data) : undefined,
    });
  }
}

// Create singleton instance
export const apiClient = new ApiClient();

// Helper function to create full API URLs
export const createApiUrl = (endpoint: string): string => {
  return `${API_BASE_URL}${endpoint}`;
};
