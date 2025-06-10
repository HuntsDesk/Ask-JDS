import { createClient } from '@supabase/supabase-js';

interface ConnectionStatus {
  isConnected: boolean;
  lastConnected: Date | null;
  lastDisconnected: Date | null;
  connectionAttempts: number;
  isPollingFallback: boolean;
}

class SupabaseConnectionMonitor {
  private static instance: SupabaseConnectionMonitor;
  private status: ConnectionStatus = {
    isConnected: false,
    lastConnected: null,
    lastDisconnected: null,
    connectionAttempts: 0,
    isPollingFallback: false
  };
  private listeners: Array<(status: ConnectionStatus) => void> = [];
  private healthCheckInterval: NodeJS.Timeout | null = null;

  static getInstance(): SupabaseConnectionMonitor {
    if (!SupabaseConnectionMonitor.instance) {
      SupabaseConnectionMonitor.instance = new SupabaseConnectionMonitor();
    }
    return SupabaseConnectionMonitor.instance;
  }

  private constructor() {
    this.startHealthCheck();
  }

  private startHealthCheck() {
    // Check connection health every 30 seconds
    this.healthCheckInterval = setInterval(() => {
      this.checkConnectionHealth();
    }, 30000);
  }

  private async checkConnectionHealth() {
    try {
      // Simple ping to test connection
      const response = await fetch(
        `${process.env.VITE_SUPABASE_URL}/rest/v1/`,
        {
          method: 'HEAD',
          headers: {
            'apikey': process.env.VITE_SUPABASE_ANON_KEY || '',
            'Authorization': `Bearer ${process.env.VITE_SUPABASE_ANON_KEY || ''}`
          }
        }
      );

      const isConnected = response.ok;
      
      if (isConnected !== this.status.isConnected) {
        this.updateStatus({
          isConnected,
          lastConnected: isConnected ? new Date() : this.status.lastConnected,
          lastDisconnected: !isConnected ? new Date() : this.status.lastDisconnected,
        });
      }
    } catch (error) {
      console.error('[SupabaseMonitor] Health check failed:', error);
      this.updateStatus({
        isConnected: false,
        lastDisconnected: new Date()
      });
    }
  }

  private updateStatus(updates: Partial<ConnectionStatus>) {
    this.status = { ...this.status, ...updates };
    this.notifyListeners();
  }

  private notifyListeners() {
    this.listeners.forEach(listener => {
      try {
        listener(this.status);
      } catch (error) {
        console.error('[SupabaseMonitor] Error notifying listener:', error);
      }
    });
  }

  public getStatus(): ConnectionStatus {
    return { ...this.status };
  }

  public onStatusChange(listener: (status: ConnectionStatus) => void): () => void {
    this.listeners.push(listener);
    
    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  public recordConnectionAttempt() {
    this.updateStatus({
      connectionAttempts: this.status.connectionAttempts + 1
    });
  }

  public setPollingFallback(isPolling: boolean) {
    this.updateStatus({
      isPollingFallback: isPolling
    });
  }

  public destroy() {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
    this.listeners = [];
  }
}

export const supabaseMonitor = SupabaseConnectionMonitor.getInstance();
export type { ConnectionStatus }; 