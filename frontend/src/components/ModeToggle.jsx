export default function ModeToggle({ mode, onChange }) {
  return (
    <div className="mode-toggle" role="group" aria-label="Execution mode">
      <button
        className={`mode-toggle__btn ${mode === 'naive' ? 'is-active' : ''}`}
        onClick={() => onChange('naive')}
        type="button"
      >
        Naive
      </button>
      <button
        className={`mode-toggle__btn ${mode === 'dry-run' ? 'is-active' : ''}`}
        onClick={() => onChange('dry-run')}
        type="button"
      >
        Dry-Run
      </button>
    </div>
  );
}