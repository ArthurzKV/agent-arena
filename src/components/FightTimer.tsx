import { useState, useEffect } from 'react';

interface Props {
  isRunning: boolean;
}

export default function FightTimer({ isRunning }: Props) {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    if (!isRunning) {
      setSeconds(0);
      return;
    }

    const interval = setInterval(() => {
      setSeconds(s => s + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning]);

  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;

  if (!isRunning && seconds === 0) return null;

  return (
    <div className="fight-timer">
      <span className="timer-label">ROUND 1</span>
      <span className="timer-value">
        {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
      </span>
    </div>
  );
}
