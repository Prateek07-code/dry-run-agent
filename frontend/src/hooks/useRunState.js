import { useReducer } from 'react';

export const initialState = {
  stage: 'idle', // 'idle' | 'submitting' | 'naive_executing' | 'naive_failed' | 'forking' | 'plans_ready' | 'committing' | 'committed' | 'generic_error'
  runId: null,
  naiveMessage: '',
  rowsLost: 0,
  forkMessage: '',
  plans: [],
  committingInfo: null,
  errorInfo: null,
};

export function runReducer(state, action) {
  switch (action.type) {
    case 'SUBMITTING':
      return {
        ...initialState,
        stage: 'submitting',
      };

    case 'RUN_STARTED':
      return {
        ...state,
        runId: action.runId,
      };

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
        rowsLost: action.rowsLost ?? 0,
      };

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
        plans: action.plans.map((p) => ({
          ...p,
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
          planId: action.planId,
          message: action.message,
          isDone: false,
        },
      };

    case 'COMMITTED':
      return {
        ...state,
        stage: 'committed',
        committingInfo: {
          planId: action.planId,
          message: action.message,
          isDone: true,
        },
      };

    case 'GENERIC_ERROR':
      return {
        ...state,
        stage: 'generic_error',
        errorInfo: {
          stage: action.errorInfo?.stage || 'Execution',
          message:
            action.errorInfo?.message ||
            'An unexpected error occurred during execution.',
          recoverable: Boolean(action.errorInfo?.recoverable),
        },
      };

    case 'RESET':
      return initialState;

    default:
      return state;
  }
}

export function useRunState() {
  const [state, dispatch] = useReducer(runReducer, initialState);
  return { state, dispatch };
}