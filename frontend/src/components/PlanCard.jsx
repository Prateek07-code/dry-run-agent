export default function PlanCard({ plan }) {
  let badgeClass = 'badge--pending';
  let badgeLabel = 'PENDING';

  if (plan.status === 'testing') {
    badgeClass = 'badge--testing';
    badgeLabel = 'TESTING…';
  } else if (plan.status === 'passed') {
    badgeClass = 'badge--passed';
    badgeLabel = 'PASSED';
  } else if (plan.status === 'failed') {
    badgeClass = 'badge--failed';
    badgeLabel = 'FAILED';
  }

  return (
    <div className={`plan-card plan-card--${plan.status}`}>
      <div className="plan-card__header">
        <span className="plan-card__title">
          Plan {plan.plan_id}: {plan.label}
        </span>
        <span className={`plan-card__badge ${badgeClass}`}>
          {badgeLabel}
        </span>
      </div>
      {plan.reason && (
        <p className="plan-card__reason">
          <strong>Reason: </strong>{plan.reason}
        </p>
      )}
    </div>
  );
}