import PlanCard from './PlanCard';

export default function DryRunPipeline({
  forkMessage,
  plans,
  committingInfo,
  stage,
  onReset,
}) {
  return (
    <div className="dry-run-pipeline">
      {/* Fork Notice */}
      <div className="dry-run-pipeline__fork">
        <strong>Environment: </strong>
        <span>{forkMessage || 'Initializing sandbox fork...'}</span>
      </div>

      {/* Dynamic Plan List */}
      <div className="dry-run-pipeline__plans">
        {plans.map((plan) => (
          <PlanCard key={plan.plan_id} plan={plan} />
        ))}
      </div>

      {/* Commit Banner */}
      {committingInfo && (
        <div
          className={`dry-run-pipeline__commit ${
            committingInfo.isDone ? 'is-done' : 'is-committing'
          }`}
        >
          <strong>{committingInfo.isDone ? 'Success: ' : 'Committing: '}</strong>
          <span>{committingInfo.message}</span>
        </div>
      )}

      {/* Terminal Action */}
      {stage === 'committed' && (
        <div className="dry-run-pipeline__actions">
          <button
            type="button"
            className="btn btn--primary"
            onClick={onReset}
          >
            Run Another Task
          </button>
        </div>
      )}
    </div>
  );
}