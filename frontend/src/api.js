import { API_BASE_URL } from './config';

// POST /run  — submits a task, returns { run_id }
export async function submitRun(task, mode) {
  const res = await fetch(`${API_BASE_URL}/run`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ task, mode }),
  });

  if (!res.ok) {
    throw new Error(`submitRun failed: ${res.status}`);
  }

  return res.json(); // { run_id }
}

// GET /run/:run_id/stream — opens an SSE connection.
// onEvent(eventName, data) is called for every event the backend sends.
// Returns the EventSource so the caller can close it when needed.
export function connectToRunStream(runId, onEvent, onError) {
  const es = new EventSource(`${API_BASE_URL}/run/${runId}/stream`);

  const eventNames = [
    'fork_started',
    'plans_generated',
    'plan_testing',
    'plan_result',
    'committing',
    'committed',
    'executing',
    'error',
  ];

  eventNames.forEach((name) => {
    es.addEventListener(name, (e) => {
      let data = {};
      try {
        data = JSON.parse(e.data);
      } catch {
        data = {};
      }
      onEvent(name, data);
    });
  });

  es.onerror = (err) => {
    if (onError) onError(err);
  };

  return es;
}