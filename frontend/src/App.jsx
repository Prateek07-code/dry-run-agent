import { useState, useRef } from 'react';
import Header from './components/Header';
import ModeToggle from './components/ModeToggle';
import TaskInput from './components/TaskInput';
import NaiveExecuting from './components/NaiveExecuting';
import NaiveFailure from './components/NaiveFailure';
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

  const handleRun = async () => {
    dispatch({ type: 'SUBMITTING' });

    try {
      // 1. Submit the task to the mock server
      const { run_id } = await submitRun(task, mode);
      dispatch({ type: 'RUN_STARTED', runId: run_id });

      // 2. Connect to the real SSE stream
      eventSourceRef.current = connectToRunStream(
        run_id,
        (eventName, data) => {
          // --- Naive Mode Events ---
          if (eventName === 'executing') {
            dispatch({ type: 'NAIVE_EXECUTING', message: data.message });
          }

          // --- Dry-Run Mode Events ---
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

          // --- Error Handling (Naive failure vs Generic error) ---
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
      dispatch({ type: 'RESET' });
    }
  };

  const handleRetry = () => {
    closeStream();
    dispatch({ type: 'RESET' });
  };

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

          {/* Naive Executing */}
          {(state.stage === 'submitting' || state.stage === 'naive_executing') &&
            mode === 'naive' && (
              <NaiveExecuting message={state.naiveMessage} />
            )}

          {/* Naive Failure */}
          {state.stage === 'naive_failed' && (
            <NaiveFailure
              message={state.naiveMessage}
              rowsLost={state.rowsLost}
              onRetry={handleRetry}
            />
          )}

          {/* Dry-Run Active Pipeline */}
          {(state.stage === 'forking' ||
            state.stage === 'plans_ready' ||
            state.stage === 'committing' ||
            state.stage === 'committed') && (
            <div style={{ width: '100%', maxWidth: '720px', margin: '0 auto', textAlign: 'left' }}>
              {/* Fork Stage */}
              <div style={{ marginBottom: '1.25rem', padding: '0.85rem 1rem', background: '#F4F7FB', borderRadius: '8px', border: '1px solid #CADCFC' }}>
                <strong style={{ color: '#1E2761' }}>Environment: </strong>
                <span>{state.forkMessage || 'Initializing sandbox fork...'}</span>
              </div>

              {/* Dynamic Plans List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {state.plans.map((plan) => {
                  let badgeBg = '#E5E7EB';
                  let badgeText = '#4B5563';
                  let label = 'PENDING';

                  if (plan.status === 'testing') {
                    badgeBg = '#CADCFC';
                    badgeText = '#1E2761';
                    label = 'TESTING…';
                  } else if (plan.status === 'passed') {
                    badgeBg = '#E6F8EE';
                    badgeText = '#1FAA59';
                    label = 'PASSED';
                  } else if (plan.status === 'failed') {
                    badgeBg = '#FEEBE8';
                    badgeText = '#FF6B4A';
                    label = 'FAILED';
                  }

                  return (
                    <div
                      key={plan.plan_id}
                      style={{
                        padding: '1rem',
                        background: '#FFFFFF',
                        borderRadius: '8px',
                        border: '1px solid #E5E7EB',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: 600, color: '#1E2761' }}>
                          Plan {plan.plan_id}: {plan.label}
                        </span>
                        <span
                          style={{
                            padding: '0.2rem 0.6rem',
                            borderRadius: '4px',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            background: badgeBg,
                            color: badgeText,
                          }}
                        >
                          {label}
                        </span>
                      </div>
                      {plan.reason && (
                        <p style={{ marginTop: '0.5rem', marginBottom: 0, fontSize: '0.875rem', color: '#4B5563' }}>
                          <strong>Reason: </strong>{plan.reason}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Commit Stage */}
              {state.committingInfo && (
                <div
                  style={{
                    marginTop: '1.25rem',
                    padding: '1rem',
                    borderRadius: '8px',
                    background: state.committingInfo.isDone ? '#E6F8EE' : '#F4F7FB',
                    border: `1px solid ${state.committingInfo.isDone ? '#1FAA59' : '#CADCFC'}`,
                    color: state.committingInfo.isDone ? '#1FAA59' : '#1E2761',
                  }}
                >
                  <strong>{state.committingInfo.isDone ? 'Success: ' : 'Committing: '}</strong>
                  <span>{state.committingInfo.message}</span>
                </div>
              )}

              {state.stage === 'committed' && (
                <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
                  <button
                    onClick={handleRetry}
                    style={{
                      background: '#1E2761',
                      color: '#FFFFFF',
                      border: 'none',
                      padding: '0.6rem 1.4rem',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontWeight: 600,
                    }}
                  >
                    Run Another Task
                  </button>
                </div>
              )}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}