import { useReducer, useCallback } from 'react';

// Define the phases for the Chat FSM
export type ChatFSMPhase = 'auth' | 'threads' | 'messages';

// Define the possible states for the Chat FSM
export type ChatFSMStatus = 'idle' | 'loading' | 'ready' | 'error';

// Define the state shape
export interface ChatFSMState {
  status: ChatFSMStatus;
  phase: ChatFSMPhase | null;
  isFirstLoad: boolean;
  threadId: string | null;
  error: Error | null;
  previousStatus: ChatFSMStatus | null;
}

// Define the possible actions
type ChatFSMAction =
  | { type: 'START_LOADING'; phase: ChatFSMPhase }
  | { type: 'SET_READY'; isFirstLoad: boolean; threadId: string | null }
  | { type: 'SET_ERROR'; error: Error; phase: ChatFSMPhase }
  | { type: 'RETRY' }
  | { type: 'RESET' };

// Initial state
const initialState: ChatFSMState = {
  status: 'idle',
  phase: null,
  isFirstLoad: true,
  threadId: null,
  error: null,
  previousStatus: null
};

// Add more verbose debug logging at the start of useChatFSM
export function useChatFSM() {
  console.log('[DEBUG FSM] Initializing useChatFSM');
  
  // Add verbose logging to the reducer function
  const reducer = (state: ChatFSMState, action: ChatFSMAction): ChatFSMState => {
    console.log('[DEBUG FSM] Current state:', state, 'Action:', action);
    
    // Store the new state for debugging
    let newState: ChatFSMState;
    
    switch (action.type) {
      case 'START_LOADING':
        newState = {
          ...state,
          status: 'loading',
          phase: action.phase,
          error: null,
          previousStatus: state.status
        };
        break;
        
      case 'SET_READY':
        newState = {
          ...state,
          status: 'ready',
          phase: null,
          isFirstLoad: action.isFirstLoad,
          threadId: action.threadId,
          error: null,
          previousStatus: state.status
        };
        break;
        
      case 'SET_ERROR':
        newState = {
          ...state,
          status: 'error',
          phase: action.phase,
          error: action.error,
          previousStatus: state.status
        };
        break;
        
      case 'RETRY':
        if (state.status !== 'error' || !state.phase) {
          return state;
        }
        newState = {
          ...state,
          status: 'loading',
          phase: state.phase,
          error: null,
          previousStatus: state.status
        };
        break;
        
      case 'RESET':
        newState = initialState;
        break;
        
      default:
        return state;
    }
    
    console.log('[DEBUG FSM] New state:', newState);
    return newState;
  };

  const [state, dispatch] = useReducer(reducer, initialState);

  const startLoading = useCallback((phase: ChatFSMPhase) => {
    dispatch({ type: 'START_LOADING', phase });
  }, []);

  const setReady = useCallback((isFirstLoad: boolean, threadId: string | null) => {
    dispatch({ type: 'SET_READY', isFirstLoad, threadId });
  }, []);

  const setError = useCallback((error: Error, phase: ChatFSMPhase) => {
    dispatch({ type: 'SET_ERROR', error, phase });
  }, []);

  const retry = useCallback(() => {
    dispatch({ type: 'RETRY' });
  }, []);

  const reset = useCallback(() => {
    dispatch({ type: 'RESET' });
  }, []);

  return {
    state,
    startLoading,
    setReady,
    setError,
    retry,
    reset
  };
}

// Visual debugger component for FSM state
export function ChatFSMVisualizer({ state }: { state: ChatFSMState }) {
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  const getStatusColor = (status: ChatFSMStatus) => {
    switch (status) {
      case 'idle': return '#888888';
      case 'loading': return '#3498db';
      case 'ready': return '#2ecc71';
      case 'error': return '#e74c3c';
      default: return '#888888';
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '10px',
        right: '10px',
        padding: '8px 12px',
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        color: 'white',
        borderRadius: '4px',
        fontSize: '12px',
        fontFamily: 'monospace',
        zIndex: 9999,
        maxWidth: '300px'
      }}
    >
      <div>
        <span>Status: </span>
        <span style={{ color: getStatusColor(state.status) }}>
          {state.status}
        </span>
      </div>
      {state.phase && (
        <div>
          <span>Phase: </span>
          <span>{state.phase}</span>
        </div>
      )}
      {state.threadId && (
        <div>
          <span>Thread ID: </span>
          <span style={{ fontSize: '10px' }}>{state.threadId.slice(0, 8)}...</span>
        </div>
      )}
      {state.error && (
        <div>
          <span>Error: </span>
          <span style={{ color: '#e74c3c' }}>{state.error.message}</span>
        </div>
      )}
    </div>
  );
} 