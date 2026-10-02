import { useEffect, useState } from 'react';

// Animates from 0 up to the real rowsLost value received from the backend.
// The final number always comes from the backend — this only controls
// how it visually counts up.
export default function RowLossCounter({ rowsLost }) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (typeof rowsLost !== 'number') return;

    const duration = 900; // ms
    const start = performance.now();

    function tick(now) {
      const progress = Math.min((now - start) / duration, 1);
      setDisplay(Math.floor(progress * rowsLost));
      if (progress < 1) requestAnimationFrame(tick);
    }

    requestAnimationFrame(tick);
  }, [rowsLost]);

  return (
    <span className="row-loss-counter">
      {display.toLocaleString()} rows lost
    </span>
  );
}