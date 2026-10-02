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

  const isBusy = state.stage === 'submitting' || state.stage === 'naive_executing';

  const handleRun = async () => {
    dispatch({ type: 'SUBMITTING' });

    try {
      // 1. Send the POST request to the mock server
      const { run_id } = await submitRun(task, mode);

      // 2. Open the real SSE stream
      eventSourceRef.current = connectToRunStream(
        run_id,
        (eventName, data) => {
          if (eventName === 'executing') {
            dispatch({ type: 'NAIVE_EXECUTING', message: data.message });
          }

          if (eventName === 'error') {
            dispatch({
              type: 'NAIVE_FAILED',
              message: data.message,
              rowsLost: data.rows_lost,
            });

            // Close the stream once the terminal error event arrives
            if (eventSourceRef.current) {
              eventSourceRef.current.close();
              eventSourceRef.current = null;
            }
          }
        },
        (error) => {
          console.error('SSE Stream Error:', error);
          if (eventSourceRef.current) {
            eventSourceRef.current.close();
            eventSourceRef.current = null;
          }
        }
      );
    } catch (err) {
      console.error('Failed to start run:', err);
      dispatch({ type: 'RESET' });
    }
  };

  const handleRetry = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
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

          {(state.stage === 'submitting' || state.stage === 'naive_executing') && (
            <NaiveExecuting message={state.naiveMessage} />
          )}

          {state.stage === 'naive_failed' && (
            <NaiveFailure
              message={state.naiveMessage}
              rowsLost={state.rowsLost}
              onRetry={handleRetry}
            />
          )}
        </section>
      </main>
    </div>
  );
}