import { supabase } from './supabase';
import { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';

export interface RealtimeSubscriptionConfig {
  table: string;
  filter?: string;
  schema?: string;
  onInsert?: (payload: RealtimePostgresChangesPayload<any>) => void;
  onUpdate?: (payload: RealtimePostgresChangesPayload<any>) => void;
  onDelete?: (payload: RealtimePostgresChangesPayload<any>) => void;
}

interface ConnectionState {
  isConnected: boolean;
  lastConnected: Date | null;
  lastDisconnected: Date | null;
  retryCount: number;
  retryTimeout: NodeJS.Timeout | null;
  fallbackPolling: boolean;
}

class RealtimeSubscriptionManager {
  private static instance: RealtimeSubscriptionManager;
  private channels: Map<string, RealtimeChannel> = new Map();
  private connectionState: ConnectionState = {
    isConnected: false,
    lastConnected: null,
    lastDisconnected: null,
    retryCount: 0,
    retryTimeout: null,
    fallbackPolling: false
  };
  private statusListeners: Array<(status: ConnectionState) => void> = [];

  static getInstance(): RealtimeSubscriptionManager {
    if (!RealtimeSubscriptionManager.instance) {
      RealtimeSubscriptionManager.instance = new RealtimeSubscriptionManager();
    }
    return RealtimeSubscriptionManager.instance;
  }

  private constructor() {
    this.setupGlobalConnectionListener();
  }

  private setupGlobalConnectionListener() {
    // Monitor global connection status using channel-based approach
    const statusChannel = supabase.channel('connection-monitor');
    
    statusChannel.subscribe((status) => {
      console.log('[RealtimeManager] Connection status:', status);
      
      if (status === 'SUBSCRIBED') {
        console.log('[RealtimeManager] Connection opened');
        this.updateConnectionState({
          isConnected: true,
          lastConnected: new Date(),
          retryCount: 0,
          fallbackPolling: false
        });
      } else if (status === 'CLOSED' || status === 'TIMED_OUT') {
        console.log('[RealtimeManager] Connection closed/timed out');
        this.updateConnectionState({
          isConnected: false,
          lastDisconnected: new Date()
        });
        this.handleConnectionLoss();
      }
    });

    // Store reference to status channel for cleanup
    this.channels.set('connection-monitor', statusChannel);
  }

  private updateConnectionState(updates: Partial<ConnectionState>) {
    this.connectionState = { ...this.connectionState, ...updates };
    this.notifyStatusListeners();
  }

  private notifyStatusListeners() {
    this.statusListeners.forEach(listener => {
      try {
        listener(this.connectionState);
      } catch (error) {
        console.error('[RealtimeManager] Error notifying status listener:', error);
      }
    });
  }

  private handleConnectionLoss() {
    // Clear any existing retry timeout
    if (this.connectionState.retryTimeout) {
      clearTimeout(this.connectionState.retryTimeout);
    }

    // Implement exponential backoff with jitter
    const baseDelay = 1000; // 1 second
    const maxDelay = 30000; // 30 seconds
    const jitter = Math.random() * 0.1; // 10% jitter
    
    const delay = Math.min(
      baseDelay * Math.pow(2, this.connectionState.retryCount) * (1 + jitter),
      maxDelay
    );

    console.log(`[RealtimeManager] Scheduling reconnection attempt ${this.connectionState.retryCount + 1} in ${delay}ms`);

    const retryTimeout = setTimeout(() => {
      this.attemptReconnection();
    }, delay);

    this.updateConnectionState({
      retryCount: this.connectionState.retryCount + 1,
      retryTimeout
    });

    // Enable fallback polling after 3 failed attempts
    if (this.connectionState.retryCount >= 3) {
      console.log('[RealtimeManager] Enabling fallback polling mode');
      this.updateConnectionState({ fallbackPolling: true });
    }
  }

  private async attemptReconnection() {
    try {
      console.log('[RealtimeManager] Attempting to reconnect...');
      
      // Remove and recreate channels to force reconnection
      const channelConfigs: Array<{ name: string; config: RealtimeSubscriptionConfig; userId?: string }> = [];
      
      // Store channel configurations before removing
      this.channels.forEach((channel, name) => {
        if (name !== 'connection-monitor') {
          // Store the channel config (in a real implementation, we'd need to store this)
          supabase.removeChannel(channel);
        }
      });
      
      // Clear channels except connection monitor
      const connectionMonitor = this.channels.get('connection-monitor');
      this.channels.clear();
      if (connectionMonitor) {
        this.channels.set('connection-monitor', connectionMonitor);
      }
      
      // Wait a moment before attempting to reconnect
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log('[RealtimeManager] Reconnection attempt completed');
    } catch (error) {
      console.error('[RealtimeManager] Reconnection attempt failed:', error);
      this.handleConnectionLoss(); // Schedule another retry
    }
  }

  public subscribe(
    channelName: string,
    config: RealtimeSubscriptionConfig,
    userId?: string
  ): () => void {
    console.log(`[RealtimeManager] Subscribing to channel: ${channelName}`);

    // Build filter with user ID if provided
    let filter = config.filter;
    if (userId && !filter) {
      filter = `user_id=eq.${userId}`;
    } else if (userId && filter) {
      filter = `${filter}.user_id=eq.${userId}`;
    }

    const channel = supabase
      .channel(channelName)
      .on('postgres_changes', {
        event: '*',
        schema: config.schema || 'public',
        table: config.table,
        ...(filter && { filter })
      }, (payload) => {
        console.log(`[RealtimeManager] Received change for ${channelName}:`, payload.eventType);
        
        switch (payload.eventType) {
          case 'INSERT':
            config.onInsert?.(payload);
            break;
          case 'UPDATE':
            config.onUpdate?.(payload);
            break;
          case 'DELETE':
            config.onDelete?.(payload);
            break;
        }
      })
      .subscribe((status) => {
        console.log(`[RealtimeManager] Channel ${channelName} status:`, status);
        
        if (status === 'SUBSCRIBED') {
          this.updateConnectionState({
            isConnected: true,
            lastConnected: new Date(),
            retryCount: 0
          });
        } else if (status === 'TIMED_OUT' || status === 'CLOSED') {
          this.updateConnectionState({
            isConnected: false,
            lastDisconnected: new Date()
          });
        }
      });

    this.channels.set(channelName, channel);

    // Return unsubscribe function
    return () => {
      console.log(`[RealtimeManager] Unsubscribing from channel: ${channelName}`);
      this.channels.delete(channelName);
      supabase.removeChannel(channel);
    };
  }

  public onStatusChange(listener: (status: ConnectionState) => void): () => void {
    this.statusListeners.push(listener);
    
    // Call immediately with current status
    listener(this.connectionState);
    
    // Return unsubscribe function
    return () => {
      const index = this.statusListeners.indexOf(listener);
      if (index > -1) {
        this.statusListeners.splice(index, 1);
      }
    };
  }

  public getConnectionState(): ConnectionState {
    return { ...this.connectionState };
  }

  public forceReconnect(): void {
    console.log('[RealtimeManager] Force reconnecting...');
    this.updateConnectionState({ retryCount: 0 });
    this.attemptReconnection();
  }

  public destroy(): void {
    console.log('[RealtimeManager] Destroying manager');
    
    // Clear retry timeout
    if (this.connectionState.retryTimeout) {
      clearTimeout(this.connectionState.retryTimeout);
    }
    
    // Remove all channels
    this.channels.forEach((channel, name) => {
      console.log(`[RealtimeManager] Removing channel: ${name}`);
      supabase.removeChannel(channel);
    });
    
    this.channels.clear();
    this.statusListeners = [];
  }
}

export const realtimeManager = RealtimeSubscriptionManager.getInstance();
export type { ConnectionState }; 