import { useReducer } from 'react';

// All the stages our UI needs to represent.
// Not every stage is used yet (dry-run ones come in a later milestone),
// but defining them now keeps the state machine consistent going forward.
const initialState = {
  stage: 'idle',
  // idle | submitting | naive_executing | naive_failed |
  // forking | plans_generated | testing | results_available |
  // committing | committed | error
  runId: null,
  naiveMessage: '',
  rowsLost: null,
  errorInfo: null, // { stage, message, recoverable }
};

function reducer(state, action) {
  switch (action.type) {
    case 'RESET':
      return initialState;
    case 'SUBMITTING':
      return { ...initialState, stage: 'submitting' };
    case 'RUN_STARTED':
      return { ...state, stage: 'submitting', runId: action.runId };
    case 'NAIVE_EXECUTING':
      return { ...state, stage: 'naive_executing', naiveMessage: action.message };
    case 'NAIVE_FAILED':
      return {
        ...state,
        stage: 'naive_failed',
        naiveMessage: action.message,
        rowsLost: action.rowsLost,
      };
    case 'GENERIC_ERROR':
      return { ...state, stage: 'error', errorInfo: action.errorInfo };
    default:
      return state;
  }
}

export function useRunState() {
  const [state, dispatch] = useReducer(reducer, initialState);
  return { state, dispatch };
}