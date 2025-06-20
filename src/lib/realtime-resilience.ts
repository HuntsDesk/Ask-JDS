/**
 * Realtime connection resilience utilities
 * Provides exponential backoff, connection pooling, and health checks
 */

import { logger } from './logger';

interface BackoffConfig {
  initialDelay: number;
  maxDelay: number;
  factor: number;
  maxRetries: number;
}

interface ConnectionHealth {
  isHealthy: boolean;
  lastHealthCheck: Date;
  consecutiveFailures: number;
  connectionDuration?: number;
}

const DEFAULT_BACKOFF_CONFIG: BackoffConfig = {
  initialDelay: 1000, // 1 second
  maxDelay: 60000, // 60 seconds
  factor: 2,
  maxRetries: 10
};

export class ExponentialBackoff {
  private attempt = 0;
  private config: BackoffConfig;
  
  constructor(config: Partial<BackoffConfig> = {}) {
    this.config = { ...DEFAULT_BACKOFF_CONFIG, ...config };
  }
  
  /**
   * Get the next delay in milliseconds
   */
  getNextDelay(): number {
    if (this.attempt >= this.config.maxRetries) {
      return -1; // Signal to stop retrying
    }
    
    const delay = Math.min(
      this.config.initialDelay * Math.pow(this.config.factor, this.attempt),
      this.config.maxDelay
    );
    
    // Add jitter to prevent thundering herd
    const jitter = delay * 0.1 * Math.random();
    
    this.attempt++;
    return Math.floor(delay + jitter);
  }
  
  /**
   * Reset the backoff counter
   */
  reset(): void {
    this.attempt = 0;
  }
  
  /**
   * Check if we should continue retrying
   */
  shouldRetry(): boolean {
    return this.attempt < this.config.maxRetries;
  }
}

export class ConnectionHealthMonitor {
  private health: Map<string, ConnectionHealth> = new Map();
  private healthCheckInterval?: number;
  
  /**
   * Start monitoring connection health
   */
  startMonitoring(
    connectionId: string,
    healthCheckFn: () => Promise<boolean>,
    intervalMs: number = 30000 // 30 seconds
  ): void {
    // Initial health check
    this.checkHealth(connectionId, healthCheckFn);
    
    // Set up periodic health checks
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }
    
    this.healthCheckInterval = window.setInterval(() => {
      this.checkHealth(connectionId, healthCheckFn);
    }, intervalMs);
  }
  
  /**
   * Stop monitoring
   */
  stopMonitoring(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = undefined;
    }
  }
  
  /**
   * Perform a health check
   */
  private async checkHealth(
    connectionId: string,
    healthCheckFn: () => Promise<boolean>
  ): Promise<void> {
    const startTime = performance.now();
    
    try {
      const isHealthy = await healthCheckFn();
      const duration = performance.now() - startTime;
      
      const currentHealth = this.health.get(connectionId) || {
        isHealthy: false,
        lastHealthCheck: new Date(),
        consecutiveFailures: 0
      };
      
      this.health.set(connectionId, {
        isHealthy,
        lastHealthCheck: new Date(),
        consecutiveFailures: isHealthy ? 0 : currentHealth.consecutiveFailures + 1,
        connectionDuration: duration
      });
      
      if (!isHealthy) {
        logger.warn(`Connection ${connectionId} health check failed`, {
          consecutiveFailures: currentHealth.consecutiveFailures + 1,
          duration
        });
      }
    } catch (error) {
      const currentHealth = this.health.get(connectionId) || {
        isHealthy: false,
        lastHealthCheck: new Date(),
        consecutiveFailures: 0
      };
      
      this.health.set(connectionId, {
        isHealthy: false,
        lastHealthCheck: new Date(),
        consecutiveFailures: currentHealth.consecutiveFailures + 1
      });
      
      logger.error(`Connection ${connectionId} health check error`, error as Error);
    }
  }
  
  /**
   * Get connection health status
   */
  getHealth(connectionId: string): ConnectionHealth | undefined {
    return this.health.get(connectionId);
  }
  
  /**
   * Check if a connection is healthy
   */
  isHealthy(connectionId: string): boolean {
    const health = this.health.get(connectionId);
    return health?.isHealthy ?? false;
  }
}

export class ConnectionPool<T> {
  private connections: Map<string, T> = new Map();
  private connectionHealth: Map<string, boolean> = new Map();
  private maxConnections: number;
  
  constructor(maxConnections: number = 5) {
    this.maxConnections = maxConnections;
  }
  
  /**
   * Add a connection to the pool
   */
  add(id: string, connection: T): void {
    if (this.connections.size >= this.maxConnections) {
      // Remove the oldest connection
      const firstKey = this.connections.keys().next().value;
      if (firstKey) {
        this.remove(firstKey);
      }
    }
    
    this.connections.set(id, connection);
    this.connectionHealth.set(id, true);
  }
  
  /**
   * Get a connection from the pool
   */
  get(id: string): T | undefined {
    return this.connections.get(id);
  }
  
  /**
   * Remove a connection from the pool
   */
  remove(id: string): void {
    this.connections.delete(id);
    this.connectionHealth.delete(id);
  }
  
  /**
   * Mark a connection as unhealthy
   */
  markUnhealthy(id: string): void {
    this.connectionHealth.set(id, false);
  }
  
  /**
   * Get a healthy connection
   */
  getHealthyConnection(): T | undefined {
    // Use Array.from to avoid iterator issues
    const entries = Array.from(this.connections.entries());
    for (const [id, connection] of entries) {
      if (this.connectionHealth.get(id)) {
        return connection;
      }
    }
    return undefined;
  }
  
  /**
   * Get all connections
   */
  getAll(): T[] {
    return Array.from(this.connections.values());
  }
  
  /**
   * Clear all connections
   */
  clear(): void {
    this.connections.clear();
    this.connectionHealth.clear();
  }
}

// Utility function to retry with exponential backoff
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  operation: string,
  config?: Partial<BackoffConfig>
): Promise<T> {
  const backoff = new ExponentialBackoff(config);
  
  while (true) {
    try {
      return await fn();
    } catch (error) {
      const delay = backoff.getNextDelay();
      
      if (delay === -1) {
        logger.error(`${operation} failed after maximum retries`, error as Error);
        throw error;
      }
      
      logger.warn(`${operation} failed, retrying in ${delay}ms`, {
        attempt: backoff['attempt'],
        delay
      });
      
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
} 