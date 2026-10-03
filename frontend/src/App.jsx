import { useState, useRef, useEffect } from 'react';
import Header from './components/Header';
import GlobalErrorAlert from './components/GlobalErrorAlert';
import ModeToggle from './components/ModeToggle';
import TaskInput from './components/TaskInput';
import NaiveExecuting from './components/NaiveExecuting';
import NaiveFailure from './components/NaiveFailure';
import DryRunPipeline from './components/DryRunPipeline';
import { useRunState } from './hooks/useRunState';
import { submitRun, connectToRunStream } from './api';
import './AppShell.css';

export default function App() {
  const [mode, setMode] = useState('naive');
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

  // Clean up any active stream if the component unmounts
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
          {state.stage === 'idle' && (
            <p className="app-visualization__placeholder">
              Run a task to see what happens.
            </p>
          )}

          {(state.stage === 'submitting' || state.stage === 'naive_executing') &&
            mode === 'naive' && (
              <NaiveExecuting message={state.naiveMessage} />
            )}

          {state.stage === 'naive_failed' && (
            <NaiveFailure
              message={state.naiveMessage}
              rowsLost={state.rowsLost}
              onRetry={handleRetry}
            />
          )}

          {isDryRunActive && (
            <DryRunPipeline
              forkMessage={state.forkMessage}
              plans={state.plans}
              committingInfo={state.committingInfo}
              stage={state.stage}
              onReset={handleRetry}
            />
          )}

          {state.stage === 'generic_error' && (
            <GlobalErrorAlert
              stage={state.errorInfo?.stage}
              message={state.errorInfo?.message}
              recoverable={state.errorInfo?.recoverable}
              onRetry={handleRun}
              onReset={handleRetry}
            />
          )}
        </section>
      </main>
    </div>
  );
}