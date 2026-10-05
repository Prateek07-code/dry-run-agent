import React from 'react';

export default function ReasoningPanel({ plans }) {
  // Filter for plans that have a reason string attached from the critic evaluation
  const evaluatedPlans = plans.filter(p => p.reason);

  return (
    <div style={{
      backgroundColor: '#CADCFC',
      borderRadius: '12px',
      padding: '20px',
      marginTop: '20px',
      borderLeft: '6px solid #1E2761',
      boxShadow: '0 4px 6px rgba(0,0,0,0.05)'
    }}>
      <h3 style={{ fontFamily: 'Cambria, serif', color: '#1E2761', marginTop: 0, marginBottom: '12px' }}>
        🧠 Critic Reasoning Panel
      </h3>

      {evaluatedPlans.length === 0 ? (
        <p style={{ fontFamily: 'Calibri, sans-serif', color: '#5D6D7E', fontStyle: 'italic', margin: 0 }}>
          Waiting for execution and evaluation results...
        </p>
      ) : (
        <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
          {evaluatedPlans.map((plan) => (
            <div key={plan.plan_id} style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '8px',
              padding: '12px',
              marginBottom: '10px',
              borderLeft: `4px solid ${plan.status === 'passed' ? '#2ECC71' : '#FF6B4A'}`
            }}>
              <strong style={{ fontFamily: 'Calibri, sans-serif', color: '#1E2761' }}>
                Plan {plan.plan_id} Verdict:
              </strong>
              <p style={{ fontFamily: 'Calibri, sans-serif', margin: '4px 0 0 0', color: '#2C3E50', lineHeight: '1.4' }}>
                "{plan.reason}"
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}