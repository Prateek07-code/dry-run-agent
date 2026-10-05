import React from 'react';

export default function SplitScreen({ naiveContent, dryRunContent }) {
  return (
    <div style={{ display: 'flex', gap: '20px', width: '100%', marginTop: '20px' }}>
      {/* Left Column: Naive Mode (Direct Run) */}
      <div style={{
        flex: 1,
        backgroundColor: '#FFF5F5',
        border: '2px solid #FF6B4A',
        borderRadius: '12px',
        padding: '20px'
      }}>
        <div style={{ borderBottom: '2px solid #FF6B4A', paddingBottom: '10px', marginBottom: '15px' }}>
          <h2 style={{ fontFamily: 'Cambria, serif', color: '#FF6B4A', margin: 0 }}>
            ⚠️ Naive Mode (Direct Run)
          </h2>
          <small style={{ fontFamily: 'Calibri, sans-serif', color: '#C0392B' }}>
            Executes commands directly on live database
          </small>
        </div>
        {naiveContent}
      </div>

      {/* Right Column: Dry-Run Mode (Protected) */}
      <div style={{
        flex: 1,
        backgroundColor: '#F0F4F8',
        border: '2px solid #1E2761',
        borderRadius: '12px',
        padding: '20px'
      }}>
        <div style={{ borderBottom: '2px solid #1E2761', paddingBottom: '10px', marginBottom: '15px' }}>
          <h2 style={{ fontFamily: 'Cambria, serif', color: '#1E2761', margin: 0 }}>
            🛡️️ Dry-Run Mode (Protected)
          </h2>
          <small style={{ fontFamily: 'Calibri, sans-serif', color: '#2C3E50' }}>
            Forks environment & evaluates plans safely
          </small>
        </div>
        {dryRunContent}
      </div>
    </div>
  );
}