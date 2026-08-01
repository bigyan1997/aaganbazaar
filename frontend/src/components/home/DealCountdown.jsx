import { useEffect, useState } from "react";

function msUntilMidnight() {
  const now = new Date();
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0);
  return midnight.getTime() - now.getTime();
}

function splitDuration(ms) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  return {
    hours: Math.floor(totalSeconds / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
  };
}

function pad(n) {
  return String(n).padStart(2, "0");
}

// Deals reset daily at local midnight - this just counts down to that,
// it doesn't track a per-deal expiry from the backend.
export default function DealCountdown() {
  const [remaining, setRemaining] = useState(() => splitDuration(msUntilMidnight()));

  useEffect(() => {
    const id = setInterval(() => setRemaining(splitDuration(msUntilMidnight())), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="flex items-center gap-1.5">
      {[
        ["hrs", remaining.hours],
        ["min", remaining.minutes],
        ["sec", remaining.seconds],
      ].map(([label, value]) => (
        <div key={label} className="flex flex-col items-center rounded-lg bg-navy px-2 py-1.5 text-white">
          <span className="text-sm font-semibold leading-none tabular-nums">{pad(value)}</span>
          <span className="mt-0.5 text-[9px] uppercase text-cream-dark">{label}</span>
        </div>
      ))}
    </div>
  );
}
