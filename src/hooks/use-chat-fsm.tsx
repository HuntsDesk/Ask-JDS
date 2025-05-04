import React, { useReducer, useCallback, useEffect, useState } from 'react';

// Define the possible states and transitions for our chat FSM
export type ChatState = 
  | { status: 'idle' }
  | { status: 'loading', phase: 'auth' | 'threads' | 'messages', previousStatus?: 'idle' | 'ready' | 'error' }
  | { status: 'ready', isEmpty: boolean, threadId: string | null }
  | { status: 'error', error: Error, phase: 'auth' | 'threads' | 'messages', retryFn?: () => void };

export type ChatAction = 
  | { type: 'START_LOADING', phase: 'auth' | 'threads' | 'messages' }
  | { type: 'SET_READY', isEmpty: boolean, threadId: string | null }
  | { type: 'SET_ERROR', error: Error, phase: 'auth' | 'threads' | 'messages', retryFn?: () => void }
  | { type: 'RETRY' }
  | { type: 'RESET' };

// FSM reducer with transition validation
function chatReducer(state: ChatState, action: ChatAction): ChatState {
  // For development mode, log state transitions
  if (process.env.NODE_ENV === 'development') {
    console.debug(`[ChatFSM] ${state.status} → ${action.type}`);
  }

  switch (action.type) {
    case 'START_LOADING':
      // Only start loading if not already in the same loading phase
      if (state.status === 'loading' && state.phase === action.phase) {
        return state;
      }
      return { 
        status: 'loading', 
        phase: action.phase,
        previousStatus: state.status === 'loading' ? state.previousStatus : state.status
      };
      
    case 'SET_READY':
      // Only transition to ready if we're not already ready with the same thread
      if (state.status === 'ready' && state.threadId === action.threadId) {
        return state;
      }
      return { 
        status: 'ready', 
        isEmpty: action.isEmpty,
        threadId: action.threadId
      };
      
    case 'SET_ERROR':
      return { 
        status: 'error', 
        error: action.error,
        phase: action.phase,
        retryFn: action.retryFn 
      };
      
    case 'RETRY':
      if (state.status !== 'error') {
        return state;
      }
      // Start loading in the phase that previously failed
      return { 
        status: 'loading', 
        phase: state.phase,
        previousStatus: 'error'
      };
      
    case 'RESET':
      return { status: 'idle' };
      
    default:
      return state;
  }
}

// Debug utilities
let debugDelays: Record<string, number> = {
  auth: 0,
  threads: 0,
  messages: 0
};

export function injectTestingDelay(phase: 'auth' | 'threads' | 'messages', delayMs: number): void {
  debugDelays[phase] = delayMs;
  console.log(`[ChatFSM Debug] Set ${phase} delay to ${delayMs}ms`);
}

export function clearTestingDelays(): void {
  debugDelays = { auth: 0, threads: 0, messages: 0 };
  console.log('[ChatFSM Debug] Cleared all testing delays');
}

export function useChatFSM() {
  // Initialize state machine with idle state
  const [state, dispatch] = useReducer(chatReducer, { status: 'idle' });
  
  // Memoized action dispatchers with optional debug delays
  const startLoading = useCallback((phase: 'auth' | 'threads' | 'messages') => {
    // If in development and debug delay is set, simulate slower loading
    if (process.env.NODE_ENV === 'development' && debugDelays[phase] > 0) {
      console.log(`[ChatFSM Debug] Delaying ${phase} phase by ${debugDelays[phase]}ms`);
      
      // Dispatch immediate loading state
      dispatch({ type: 'START_LOADING', phase });
      
      // Then wait for the debug delay before allowing further transitions
      setTimeout(() => {
        console.log(`[ChatFSM Debug] ${phase} delay completed`);
      }, debugDelays[phase]);
    } else {
      // Normal dispatch without delay
      dispatch({ type: 'START_LOADING', phase });
    }
  }, []);
  
  const setReady = useCallback((isEmpty: boolean, threadId: string | null) => {
    dispatch({ type: 'SET_READY', isEmpty, threadId });
  }, []);
  
  const setError = useCallback((error: Error, phase: 'auth' | 'threads' | 'messages', retryFn?: () => void) => {
    dispatch({ type: 'SET_ERROR', error, phase, retryFn });
  }, []);
  
  const retry = useCallback(() => {
    dispatch({ type: 'RETRY' });
  }, []);
  
  const reset = useCallback(() => {
    dispatch({ type: 'RESET' });
  }, []);

  // For dev tools in development mode only
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      (window as any).__CHAT_FSM_STATE__ = state;
    }
    
    return () => {
      if (process.env.NODE_ENV === 'development') {
        delete (window as any).__CHAT_FSM_STATE__;
      }
    };
  }, [state]);
  
  return {
    state,
    startLoading,
    setReady,
    setError,
    retry,
    reset,
    isIdle: state.status === 'idle',
    isLoading: state.status === 'loading',
    isReady: state.status === 'ready',
    isError: state.status === 'error',
    loadingPhase: state.status === 'loading' ? state.phase : null,
    isEmpty: state.status === 'ready' ? state.isEmpty : null,
    error: state.status === 'error' ? state.error : null
  };
}

// Development-only FSM visualizer component
export function ChatFSMVisualizer() {
  const [isVisible, setIsVisible] = useState(false);
  const fsmState = (window as any).__CHAT_FSM_STATE__;
  
  // Add Alt+D keyboard shortcut to toggle visibility
  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && e.key === 'd') {
        setIsVisible(prev => !prev);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);
  
  if (process.env.NODE_ENV !== 'development' || !fsmState || !isVisible) {
    return null;
  }
  
  return (
    <div
      style={{
        position: 'fixed',
        bottom: '10px',
        right: '10px',
        background: 'rgba(0, 0, 0, 0.8)',
        color: 'white',
        padding: '10px',
        borderRadius: '4px',
        fontSize: '12px',
        zIndex: 9999,
        maxWidth: '300px'
      }}
    >
      <div style={{ marginBottom: '5px', fontWeight: 'bold', display: 'flex', justifyContent: 'space-between' }}>
        <span>Chat FSM: {fsmState.status.toUpperCase()}
          {fsmState.status === 'loading' && ` (${fsmState.phase})`}
        </span>
        <button 
          onClick={() => setIsVisible(false)}
          style={{ 
            background: 'transparent', 
            border: 'none', 
            color: 'white',
            cursor: 'pointer',
            padding: '0 4px' 
          }}
        >
          ×
        </button>
      </div>
      <pre style={{ margin: 0, fontSize: '10px' }}>
        {JSON.stringify(fsmState, null, 2)}
      </pre>
      <div style={{ 
        marginTop: '8px', 
        fontSize: '10px',
        color: '#aaa', 
        display: 'flex',
        justifyContent: 'space-between'
      }}>
        <span>Press Alt+D to toggle</span>
        <div>
          <button 
            onClick={() => injectTestingDelay('auth', 3000)}
            style={{ 
              background: '#222', 
              border: 'none', 
              borderRadius: '2px',
              color: '#00ff00',
              cursor: 'pointer',
              padding: '2px 4px',
              marginRight: '4px',
              fontSize: '9px'
            }}
          >
            Delay Auth
          </button>
          <button 
            onClick={() => clearTestingDelays()}
            style={{ 
              background: '#222', 
              border: 'none', 
              borderRadius: '2px',
              color: '#ff8888',
              cursor: 'pointer',
              padding: '2px 4px',
              fontSize: '9px'
            }}
          >
            Clear Delays
          </button>
        </div>
      </div>
    </div>
  );
} 