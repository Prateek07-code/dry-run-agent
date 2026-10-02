import RowLossCounter from './RowLossCounter';

export default function NaiveFailure({ message, rowsLost, onRetry }) {
  return (
    <div className="naive-failure" role="alert">
      <div className="naive-failure__badge">FAILED</div>
      <h2 className="naive-failure__title">Execution failed</h2>
      <p className="naive-failure__message">{message}</p>
      {typeof rowsLost === 'number' && (
        <div className="naive-failure__counter">
          <RowLossCounter rowsLost={rowsLost} />
        </div>
      )}
      <button
        type="button"
        className="naive-failure__retry"
        onClick={onRetry}
      >
        Try again
      </button>
    </div>
  );
}