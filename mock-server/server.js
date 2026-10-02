const express = require('express');
const cors = require('cors');
const crypto = require('crypto');

const app = express();
const PORT = 4000;

app.use(cors());
app.use(express.json());

// In-memory store for active/recent runs
const runs = new Map();

// Helper to write an SSE event in the standard format:
// event: <eventName>\n
// data: <JSON payload>\n\n
function sendSSE(res, eventName, data) {
  res.write(`event: ${eventName}\n`);
  res.write(`data: ${JSON.stringify(data)}\n\n`);
}

// Helper to create delays between streamed events
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// 1. Submit a task
app.post('/run', (req, res) => {
  const { task, mode } = req.body;

  if (!task || !mode) {
    return res.status(400).json({ error: 'Both "task" and "mode" are required.' });
  }

  const run_id = crypto.randomUUID().slice(0, 8);
  runs.set(run_id, { task: task.trim(), mode });

  return res.status(200).json({ run_id });
});

// 2. Stream task events via SSE
app.get('/run/:run_id/stream', async (req, res) => {
  const { run_id } = req.params;
  const run = runs.get(run_id);

  if (!run) {
    return res.status(404).json({ error: 'Run ID not found' });
  }

  // Set SSE response headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  // If client disconnects early, stop work
  let clientConnected = true;
  req.on('close', () => {
    clientConnected = false;
  });

  const { task, mode } = run;

  // Check for simulated errors (e.g., "simulate:error:fork")
  if (task.startsWith('simulate:error:')) {
    const stage = task.replace('simulate:error:', '');
    await sleep(800);
    if (!clientConnected) return;

    sendSSE(res, 'error', {
      stage: stage || 'fork',
      message: `Simulated failure during stage: ${stage}`,
      recoverable: stage !== 'connection' && stage !== 'timeout',
    });
    return res.end();
  }

  // NAIVE MODE SEQUENCE
  if (mode === 'naive') {
    await sleep(500);
    if (!clientConnected) return;
    sendSSE(res, 'executing', {
      message: 'Running DROP TABLE directly on production...',
    });

    await sleep(1800);
    if (!clientConnected) return;
    sendSSE(res, 'error', {
      message: 'nightly_report_job crashed — dependency on old_sessions',
      rows_lost: 48213,
    });

    return res.end();
  }

  // DRY-RUN MODE SEQUENCE
  if (mode === 'dry-run') {
    // 1. Fork started
    await sleep(600);
    if (!clientConnected) return;
    sendSSE(res, 'fork_started', {
      message: 'Forking a copy of the database...',
    });

    // 2. Plans generated
    await sleep(1200);
    if (!clientConnected) return;
    sendSSE(res, 'plans_generated', {
      plans: [
        { plan_id: 'A', label: 'Hard delete old_sessions immediately' },
        { plan_id: 'B', label: 'Archive to cold storage, drop table after 30 days' },
      ],
    });

    // 3. Plan A testing
    await sleep(1000);
    if (!clientConnected) return;
    sendSSE(res, 'plan_testing', { plan_id: 'A' });

    // 4. Plan A result (failed)
    await sleep(1500);
    if (!clientConnected) return;
    sendSSE(res, 'plan_result', {
      plan_id: 'A',
      status: 'failed',
      reason: 'Violates foreign key constraint on reporting_jobs schema',
    });

    // 5. Plan B testing
    await sleep(1000);
    if (!clientConnected) return;
    sendSSE(res, 'plan_testing', { plan_id: 'B' });

    // 6. Plan B result (passed)
    await sleep(1500);
    if (!clientConnected) return;
    sendSSE(res, 'plan_result', {
      plan_id: 'B',
      status: 'passed',
      reason: 'All automated dry-run checks and integrity constraints satisfied',
    });

    // 7. Committing Plan B
    await sleep(1200);
    if (!clientConnected) return;
    sendSSE(res, 'committing', {
      plan_id: 'B',
      message: 'Applying the winning plan...',
    });

    // 8. Committed
    await sleep(1400);
    if (!clientConnected) return;
    sendSSE(res, 'committed', {
      plan_id: 'B',
      message: 'Done. old_sessions archived, 0 rows lost.',
    });

    return res.end();
  }

  // Fallback if mode is unknown
  sendSSE(res, 'error', {
    stage: 'plan_generation',
    message: `Unknown execution mode: ${mode}`,
    recoverable: false,
  });
  res.end();
});

app.listen(PORT, () => {
  console.log(`Mock engine server listening at http://localhost:${PORT}`);
});