// Performance monitoring utilities

export class PerformanceMonitor {
  private static measurements: Map<string, number> = new Map();

  static startMeasurement(name: string): void {
    this.measurements.set(name, performance.now());
  }

  static endMeasurement(name: string): number {
    const startTime = this.measurements.get(name);
    if (!startTime) {
      console.warn(`No start time found for measurement: ${name}`);
      return 0;
    }

    const duration = performance.now() - startTime;
    console.log(`⏱️ ${name}: ${duration.toFixed(2)}ms`);

    // Remove the measurement to prevent memory leaks
    this.measurements.delete(name);

    return duration;
  }

  static measureAsync<T>(name: string, fn: () => Promise<T>): Promise<T> {
    return new Promise(async (resolve, reject) => {
      this.startMeasurement(name);
      try {
        const result = await fn();
        this.endMeasurement(name);
        resolve(result);
      } catch (error) {
        this.endMeasurement(name);
        reject(error);
      }
    });
  }

  static logNetworkMetrics(): void {
    if ("connection" in navigator) {
      const connection = (navigator as any).connection;
      console.log("🌐 Network Info:", {
        effectiveType: connection.effectiveType,
        downlink: connection.downlink,
        rtt: connection.rtt,
      });
    }
  }
}

// API Request interceptor for performance monitoring
export const performantFetch = async (
  url: string,
  options: RequestInit = {}
): Promise<Response> => {
  const startTime = performance.now();

  try {
    // Add performance headers
    const enhancedOptions = {
      ...options,
      headers: {
        ...options.headers,
        "Cache-Control": "max-age=300", // 5 minutes cache
        "Accept-Encoding": "gzip, deflate, br",
      },
    };

    const response = await fetch(url, enhancedOptions);

    const endTime = performance.now();
    const duration = endTime - startTime;

    // Log slow requests
    if (duration > 1000) {
      console.warn(`🐌 Slow API request (${duration.toFixed(2)}ms):`, url);
    } else {
      console.log(`⚡ API request (${duration.toFixed(2)}ms):`, url);
    }

    return response;
  } catch (error) {
    const endTime = performance.now();
    const duration = endTime - startTime;
    console.error(
      `❌ Failed API request (${duration.toFixed(2)}ms):`,
      url,
      error
    );
    throw error;
  }
};

// Connection health check
export const checkConnectionHealth = async (): Promise<boolean> => {
  try {
    const startTime = performance.now();
    const response = await fetch("/api/health", { method: "HEAD" });
    const endTime = performance.now();

    const isHealthy = response.ok && endTime - startTime < 1000;
    console.log(
      `🔍 Connection health: ${isHealthy ? "Good" : "Poor"} (${(
        endTime - startTime
      ).toFixed(2)}ms)`
    );

    return isHealthy;
  } catch {
    console.log("🔍 Connection health: Poor (failed)");
    return false;
  }
};
