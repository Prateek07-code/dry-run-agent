import { useState } from 'react';
import Header from './components/Header';
import ModeToggle from './components/ModeToggle';
import TaskInput from './components/TaskInput';
import NaiveExecuting from './components/NaiveExecuting';
import NaiveFailure from './components/NaiveFailure';
import { useRunState } from './hooks/useRunState';
import { devSimulateNaiveRun } from './dev/devSimulateNaiveRun';
import './AppShell.css';

export default function App() {
  const [mode, setMode] = useState('naive');
  const [task, setTask] = useState('');
  const { state, dispatch } = useRunState();

  const isBusy = state.stage === 'submitting' || state.stage === 'naive_executing';

  const handleRun = () => {
    dispatch({ type: 'SUBMITTING' });

    // Real path (once mock-server/server.js is live) will be:
    //   const { run_id } = await submitRun(task, mode);
    //   connectToRunStream(run_id, handleEvent, handleConnError);
    // For now, naive mode is driven by the temporary dev simulator.
    if (mode === 'naive') {
      devSimulateNaiveRun((eventName, data) => {
        if (eventName === 'executing') {
          dispatch({ type: 'NAIVE_EXECUTING', message: data.message });
        }
        if (eventName === 'error') {
          dispatch({
            type: 'NAIVE_FAILED',
            message: data.message,
            rowsLost: data.rows_lost,
          });
        }
      });
    }
  };

  const handleRetry = () => dispatch({ type: 'RESET' });

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