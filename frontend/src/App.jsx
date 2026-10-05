import { useState, useRef, useEffect } from 'react';
import Header from './components/Header';
import GlobalErrorAlert from './components/GlobalErrorAlert';
import ModeToggle from './components/ModeToggle';
import TaskInput from './components/TaskInput';
import NaiveExecuting from './components/NaiveExecuting';
import NaiveFailure from './components/NaiveFailure';
import PlanCard from './PlanCard';
import ReasoningPanel from './ReasoningPanel';
import SplitScreen from './SplitScreen';
import { useRunState } from './hooks/useRunState';
import { submitRun, connectToRunStream } from './api';
import './AppShell.css';

export default function App() {
  const [mode, setMode] = useState('dry-run');
  const [task, setTask] = useState('');
  const { state, dispatch } = useRunState();
  const eventSourceRef = useRef(null);

  const isBusy =
    state.stage === 'submitting' ||
    state.stage === 'naive_executing' ||
    state.stage === 'forking' ||
    state.stage === 'plans_ready' ||
    state.stage === 'committing';

  const closeStream = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      closeStream();
    };
  }, []);

  const handleRun = async () => {
    closeStream();
    dispatch({ type: 'SUBMITTING' });

    try {
      const { run_id } = await submitRun(task, mode);
      dispatch({ type: 'RUN_STARTED', runId: run_id });

      eventSourceRef.current = connectToRunStream(
        run_id,
        (eventName, data) => {
          if (eventName === 'executing') {
            dispatch({ type: 'NAIVE_EXECUTING', message: data.message });
          }

          if (eventName === 'fork_started') {
            dispatch({ type: 'FORK_STARTED', message: data.message });
          }

          if (eventName === 'plans_generated') {
            dispatch({ type: 'PLANS_GENERATED', plans: data.plans });
          }

          if (eventName === 'plan_testing') {
            dispatch({ type: 'PLAN_TESTING', planId: data.plan_id });
          }

          if (eventName === 'plan_result') {
            dispatch({
              type: 'PLAN_RESULT',
              planId: data.plan_id,
              status: data.status,
              reason: data.reason,
            });
          }

          if (eventName === 'committing') {
            dispatch({
              type: 'COMMITTING',
              planId: data.plan_id,
              message: data.message,
            });
          }

          if (eventName === 'committed') {
            dispatch({
              type: 'COMMITTED',
              planId: data.plan_id,
              message: data.message,
            });
            closeStream();
          }

          if (eventName === 'error') {
            if (data.rows_lost !== undefined) {
              dispatch({
                type: 'NAIVE_FAILED',
                message: data.message,
                rowsLost: data.rows_lost,
              });
            } else {
              dispatch({ type: 'GENERIC_ERROR', errorInfo: data });
            }
            closeStream();
          }
        },
        (error) => {
          console.error('SSE Stream Error:', error);
          closeStream();
        }
      );
    } catch (err) {
      console.error('Failed to start run:', err);
      dispatch({
        type: 'GENERIC_ERROR',
        errorInfo: {
          stage: 'initialization',
          message: err.message || 'Failed to connect to execution engine.',
          recoverable: true,
        },
      });
    }
  };

  const handleRetry = () => {
    closeStream();
    dispatch({ type: 'RESET' });
  };

  const isDryRunActive =
    state.stage === 'forking' ||
    state.stage === 'plans_ready' ||
    state.stage === 'committing' ||
    state.stage === 'committed';

  // Content rendered inside the Naive Mode side of SplitScreen
  const naiveContent = (
    <div>
      {(state.stage === 'submitting' || state.stage === 'naive_executing') && mode === 'naive' && (
        <NaiveExecuting message={state.naiveMessage} />
      )}
      {state.stage === 'naive_failed' && (
        <NaiveFailure
          message={state.naiveMessage}
          rowsLost={state.rowsLost}
          onRetry={handleRetry}
        />
      )}
      {state.stage === 'idle' && (
        <p style={{ color: '#7F8C8D', fontStyle: 'italic' }}>
          Select Naive mode and run a task to observe unverified direct execution.
        </p>
      )}
    </div>
  );

  // Content rendered inside the Dry-Run Mode side of SplitScreen
  const dryRunContent = (
    <div>
      {isDryRunActive ? (
        <div>
          <p style={{ color: '#1E2761', fontWeight: 'bold', marginBottom: '15px' }}>
            {state.forkMessage || 'Fork created safely.'}
          </p>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '15px' }}>
            {(state.plans || []).map((plan) => (
              <PlanCard key={plan.plan_id || plan.id} plan={plan} />
            ))}
          </div>
          <ReasoningPanel plans={state.plans || []} />
        </div>
      ) : (
        <p style={{ color: '#7F8C8D', fontStyle: 'italic' }}>
          Run a task in Dry-Run mode to simulate changes in an isolated fork.
        </p>
      )}
    </div>
  );

  return (
    <div className="app-shell">
      <Header />

      <main className="app-main">
        <ModeToggle mode={mode} onChange={setMode} />
        <TaskInput
          value={task}
          onChange={setTask}
          onRun={handleRun}
          disabled={isBusy}
        />

        <section className="app-visualization" aria-label="Simulation area">
          {state.stage === 'generic_error' ? (
            <GlobalErrorAlert
              stage={state.errorInfo?.stage}
              message={state.errorInfo?.message}
              recoverable={state.errorInfo?.recoverable}
              onRetry={handleRun}
              onReset={handleRetry}
            />
          ) : (
            <SplitScreen naiveContent={naiveContent} dryRunContent={dryRunContent} />
          )}
        </section>
      </main>
    </div>
  );
}