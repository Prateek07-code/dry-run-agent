export default function TaskInput({ value, onChange, onRun, disabled }) {
  return (
    <div className="task-input">
      <input
        type="text"
        className="task-input__field"
        placeholder="e.g. Clean up the old_sessions table"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        aria-label="Task command"
      />
      <button
        className="task-input__run"
        onClick={onRun}
        disabled={disabled || value.trim() === ''}
        type="button"
      >
        Run
      </button>
    </div>
  );
}