export default function GlobalErrorAlert({ stage, message, recoverable, onRetry, onReset }) {
  return (
    <div className={`global-error-card ${recoverable ? 'is-recoverable' : 'is-fatal'}`} role="alert">
      <div className="global-error-card__header">
        <span className="global-error-card__tag">
          {recoverable ? 'RECOVERABLE ERROR' : 'HARD STOP'}
        </span>
        <span className="global-error-card__stage">Stage: {stage || 'Execution'}</span>
      </div>

      <p className="global-error-card__message">{message}</p>

      <div className="global-error-card__actions">
        {recoverable ? (
          <button type="button" className="btn btn--retry" onClick={onRetry}>
            Retry Step
          </button>
        ) : (
          <button type="button" className="btn btn--reset" onClick={onReset}>
            Start Over
          </button>
        )}
      </div>
    </div>
  );
}