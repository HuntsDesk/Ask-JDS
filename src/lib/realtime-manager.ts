import { logger } from '@/lib/logger';
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
  private channelConfigs: Map<string, { config: RealtimeSubscriptionConfig; userId?: string }> = new Map();
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

  /**
   * Generate a unique channel name to prevent collisions
   */
  private generateChannelName(base: string, identifier?: string): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 9);
    const suffix = identifier ? `${identifier}-${timestamp}-${random}` : `${timestamp}-${random}`;
    return `${base}-${suffix}`;
  }

  /**
   * Check for potential channel name collisions
   */
  private checkChannelCollision(channelName: string): boolean {
    const exists = this.channels.has(channelName);
    if (exists) {
      logger.warn(`[RealtimeManager] Channel name collision detected: ${channelName}`);
    }
    return exists;
  }

  private setupGlobalConnectionListener() {
    // Monitor global connection status using channel-based approach
    const statusChannelName = this.generateChannelName('connection-monitor');
    const statusChannel = supabase.channel(statusChannelName);
    
    statusChannel.subscribe((status) => {
      logger.debug('[RealtimeManager] Connection status:', { status });
      
      if (status === 'SUBSCRIBED') {
        logger.debug('[RealtimeManager] Connection opened');
        this.updateConnectionState({
          isConnected: true,
          lastConnected: new Date(),
          retryCount: 0,
          fallbackPolling: false
        });
      } else if (status === 'CLOSED' || status === 'TIMED_OUT') {
        logger.debug('[RealtimeManager] Connection closed/timed out');
        this.updateConnectionState({
          isConnected: false,
          lastDisconnected: new Date()
        });
        this.handleConnectionLoss();
      }
    });

    // Store reference to status channel for cleanup
    this.channels.set(statusChannelName, statusChannel);
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
        logger.error('[RealtimeManager] Error notifying status listener:', error);
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

    logger.debug(`[RealtimeManager] Scheduling reconnection attempt ${this.connectionState.retryCount + 1} in ${delay}ms`);

    const retryTimeout = setTimeout(() => {
      this.attemptReconnection();
    }, delay);

    this.updateConnectionState({
      retryCount: this.connectionState.retryCount + 1,
      retryTimeout
    });

    // Enable fallback polling after 3 failed attempts
    if (this.connectionState.retryCount >= 3) {
      logger.debug('[RealtimeManager] Enabling fallback polling mode');
      this.updateConnectionState({ fallbackPolling: true });
    }
  }

  private async attemptReconnection() {
    try {
      logger.debug('[RealtimeManager] Attempting to reconnect...');
      
      // Store channel configurations before removing
      const channelConfigs: Array<{ name: string; config: RealtimeSubscriptionConfig; userId?: string }> = [];
      
      this.channelConfigs.forEach((value, name) => {
        if (!name.includes('connection-monitor')) {
          channelConfigs.push({ name, ...value });
        }
      });
      
      // Remove channels except connection monitor
      this.channels.forEach((channel, name) => {
        if (!name.includes('connection-monitor')) {
          logger.debug(`[RealtimeManager] Removing channel during reconnection: ${name}`);
          supabase.removeChannel(channel);
          this.channels.delete(name);
          this.channelConfigs.delete(name);
        }
      });
      
      // Wait a moment before attempting to reconnect
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Recreate channels with new unique names
      for (const { config, userId } of channelConfigs) {
        const newChannelName = this.generateChannelName(config.table, userId);
        this.subscribeInternal(newChannelName, config, userId);
      }
      
      logger.debug('[RealtimeManager] Reconnection attempt completed');
    } catch (error) {
      logger.error('[RealtimeManager] Reconnection attempt failed:', error);
      this.handleConnectionLoss(); // Schedule another retry
    }
  }

  /**
   * Internal subscription method that handles the actual channel creation
   */
  private subscribeInternal(
    channelName: string,
    config: RealtimeSubscriptionConfig,
    userId?: string
  ): RealtimeChannel {
    logger.debug(`[RealtimeManager] Creating subscription for channel: ${channelName}`);

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
        logger.debug(`[RealtimeManager] Received change for ${channelName}:`, { eventType: payload.eventType });
        
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
        logger.debug(`[RealtimeManager] Channel ${channelName} status:`, { status });
        
        if (status === 'SUBSCRIBED') {
          this.updateConnectionState({
            isConnected: true,
            lastConnected: new Date(),
            retryCount: 0
          });
        } else if (status === 'TIMED_OUT' || status === 'CLOSED' || status === 'CHANNEL_ERROR') {
          // Only warn for actual errors, not normal closures
          if (status === 'TIMED_OUT' || status === 'CHANNEL_ERROR') {
            logger.warn(`[RealtimeManager] Channel ${channelName} failed with status: ${status}`);
          } else {
            // CLOSED is normal when navigating away
            logger.debug(`[RealtimeManager] Channel ${channelName} closed normally`);
          }
          this.updateConnectionState({
            isConnected: false,
            lastDisconnected: new Date()
          });
          
          // Remove failed channel from our tracking
          this.channels.delete(channelName);
          this.channelConfigs.delete(channelName);
        }
      });

    this.channels.set(channelName, channel);
    this.channelConfigs.set(channelName, { config, userId });
    
    return channel;
  }

  public subscribe(
    baseChannelName: string,
    config: RealtimeSubscriptionConfig,
    userId?: string
  ): () => void {
    // Generate unique channel name to prevent collisions
    const uniqueChannelName = this.generateChannelName(baseChannelName, userId);
    
    // Double-check for collisions (should never happen with our naming strategy)
    if (this.checkChannelCollision(uniqueChannelName)) {
      logger.error(`[RealtimeManager] Channel collision detected, generating new name`);
      return this.subscribe(baseChannelName, config, userId); // Retry with new name
    }

    logger.debug(`[RealtimeManager] Subscribing to channel: ${uniqueChannelName}`);
    
    const channel = this.subscribeInternal(uniqueChannelName, config, userId);

    // Return unsubscribe function
    return () => {
      logger.debug(`[RealtimeManager] Unsubscribing from channel: ${uniqueChannelName}`);
      this.channels.delete(uniqueChannelName);
      this.channelConfigs.delete(uniqueChannelName);
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
    logger.debug('[RealtimeManager] Force reconnecting...');
    this.updateConnectionState({ retryCount: 0 });
    this.attemptReconnection();
  }

  public destroy(): void {
    logger.debug('[RealtimeManager] Destroying manager');
    
    // Clear retry timeout
    if (this.connectionState.retryTimeout) {
      clearTimeout(this.connectionState.retryTimeout);
    }
    
    // Remove all channels
    this.channels.forEach((channel, name) => {
      logger.debug(`[RealtimeManager] Removing channel: ${name}`);
      supabase.removeChannel(channel);
    });
    
    this.channels.clear();
    this.channelConfigs.clear();
    this.statusListeners = [];
  }

  /**
   * Get debug information about active channels
   */
  public getDebugInfo(): { channelCount: number; channels: string[]; connectionState: ConnectionState } {
    return {
      channelCount: this.channels.size,
      channels: Array.from(this.channels.keys()),
      connectionState: this.connectionState
    };
  }
}

export const realtimeManager = RealtimeSubscriptionManager.getInstance();
export type { ConnectionState }; 