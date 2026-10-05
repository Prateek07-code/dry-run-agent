import React from 'react';

export default function PlanCard({ plan }) {
  // Map SSE plan status to visual styles
  const getStatusStyles = () => {
    switch (plan.status) {
      case 'passed':
        return { bg: '#E8F8F5', border: '#2ECC71', badgeBg: '#2ECC71', badgeText: '#FFF', label: 'PASSED' };
      case 'failed':
        return { bg: '#FADBD8', border: '#FF6B4A', badgeBg: '#FF6B4A', badgeText: '#FFF', label: 'FAILED' };
      case 'testing':
        return { bg: '#EBF5FB', border: '#CADCFC', badgeBg: '#1E2761', badgeText: '#FFF', label: 'TESTING...' };
      default:
        return { bg: '#F4F6F7', border: '#BDC3C7', badgeBg: '#95A5A6', badgeText: '#FFF', label: 'PENDING' };
    }
  };

  const styles = getStatusStyles();

  return (
    <div style={{
      backgroundColor: styles.bg,
      border: `2px solid ${styles.border}`,
      borderRadius: '12px',
      padding: '20px',
      boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
      transition: 'all 0.3s ease',
      flex: 1,
      minWidth: '220px'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <h4 style={{ fontFamily: 'Cambria, serif', margin: 0, color: '#1E2761', fontSize: '1.1rem' }}>
          Plan {plan.plan_id}
        </h4>
        <span style={{
          backgroundColor: styles.badgeBg,
          color: styles.badgeText,
          padding: '4px 10px',
          borderRadius: '12px',
          fontSize: '0.75rem',
          fontWeight: 'bold'
        }}>
          {styles.label}
        </span>
      </div>

      <p style={{ fontFamily: 'Calibri, sans-serif', color: '#2C3E50', fontSize: '0.95rem', margin: '0 0 10px 0' }}>
        {plan.label}
      </p>

      {plan.status === 'testing' && (
        <div style={{ fontSize: '0.85rem', color: '#1E2761', fontStyle: 'italic' }}>
          Simulating transaction inside dry-run fork...
        </div>
      )}
    </div>
  );
}