import { useReducer } from 'react';

// Initial state covers both Naive mode and Dry-Run mode
const initialState = {
  stage: 'idle',
  // 'idle' | 'submitting' | 'naive_executing' | 'naive_failed' |
  // 'forking' | 'plans_ready' | 'committing' | 'committed' | 'error'

  runId: null,

  // Naive mode state
  naiveMessage: '',
  rowsLost: null,

  // Dry-run mode state
  forkMessage: '',
  plans: [], // Array of { plan_id, label, status: 'pending'|'testing'|'passed'|'failed', reason: '' }
  committingInfo: null, // { plan_id, message, isDone: boolean }

  // Generic error state (per CONTRACT.md)
  errorInfo: null, // { stage, message, recoverable }
};

function reducer(state, action) {
  switch (action.type) {
    case 'RESET':
      return initialState;

    case 'SUBMITTING':
      return { ...initialState, stage: 'submitting' };

    case 'RUN_STARTED':
      return { ...state, runId: action.runId };

    // --- Naive Mode Actions ---
    case 'NAIVE_EXECUTING':
      return {
        ...state,
        stage: 'naive_executing',
        naiveMessage: action.message,
      };

    case 'NAIVE_FAILED':
      return {
        ...state,
        stage: 'naive_failed',
        naiveMessage: action.message,
        rowsLost: action.rowsLost,
      };

    // --- Dry-Run Mode Actions ---
    case 'FORK_STARTED':
      return {
        ...state,
        stage: 'forking',
        forkMessage: action.message,
      };

    case 'PLANS_GENERATED':
      return {
        ...state,
        stage: 'plans_ready',
        // Initialize every plan with status: 'pending'
        plans: (action.plans || []).map((p) => ({
          plan_id: p.plan_id,
          label: p.label,
          status: 'pending',
          reason: '',
        })),
      };

    case 'PLAN_TESTING':
      return {
        ...state,
        plans: state.plans.map((p) =>
          p.plan_id === action.planId ? { ...p, status: 'testing' } : p
        ),
      };

    case 'PLAN_RESULT':
      return {
        ...state,
        plans: state.plans.map((p) =>
          p.plan_id === action.planId
            ? { ...p, status: action.status, reason: action.reason }
            : p
        ),
      };

    case 'COMMITTING':
      return {
        ...state,
        stage: 'committing',
        committingInfo: {
          plan_id: action.planId,
          message: action.message,
          isDone: false,
        },
      };

    case 'COMMITTED':
      return {
        ...state,
        stage: 'committed',
        committingInfo: {
          plan_id: action.planId,
          message: action.message,
          isDone: true,
        },
      };

    // --- Generic Error Action ---
    case 'GENERIC_ERROR':
      return {
        ...state,
        stage: 'error',
        errorInfo: action.errorInfo,
      };

    default:
      return state;
  }
}

export function useRunState() {
  const [state, dispatch] = useReducer(reducer, initialState);
  return { state, dispatch };
}