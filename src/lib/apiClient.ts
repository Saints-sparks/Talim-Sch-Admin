// lib/apiClient.ts
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

  private getStoredAccessToken(): string | null {
    if (typeof window === "undefined") return null;
    return (
      this.accessToken ||
      localStorage.getItem("accessToken") ||
      sessionStorage.getItem("accessToken")
    );
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

  // ✅ FIXED: Construct full URL using API_BASE_URL
  private buildUrl(endpoint: string): string {
    // If it's already a full URL, return as is
    if (endpoint.startsWith('http')) {
      return endpoint;
    }
    
    // Ensure endpoint starts with /
    const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    
    // Combine base URL with path
    const fullUrl = `${API_BASE_URL}${path}`;
    console.log('🌐 Request URL:', fullUrl); // Debug log
    return fullUrl;
  }

  async request(url: string, config: RequestConfig = {}): Promise<Response> {
    // Build the full URL
    const fullUrl = this.buildUrl(url);
    
    // Add Authorization header if token exists
    const token = this.getStoredAccessToken();
    if (token) {
      if (!this.accessToken) this.accessToken = token;
      config.headers = {
        ...config.headers,
        Authorization: `Bearer ${token}`,
      };
    }

    // Add credentials for cookie handling
    config.credentials = "include";

    // Make the request
    console.log('📤 Making request to:', fullUrl);
    let response = await fetch(fullUrl, config);

    // If 401 and not already a retry, attempt to refresh token
    if (response.status === 401 && !config._retry) {
      try {
        await this.handleRefresh();

        // Retry the original request with new token
        config._retry = true;
        const refreshedToken = this.getStoredAccessToken();
        if (refreshedToken) {
          if (!this.accessToken) this.accessToken = refreshedToken;
          config.headers = {
            ...config.headers,
            Authorization: `Bearer ${refreshedToken}`,
          };
        }

        response = await fetch(fullUrl, config);
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
