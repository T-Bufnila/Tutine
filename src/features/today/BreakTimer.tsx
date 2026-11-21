import { PauseIcon, PlayIcon, SkipIcon } from "../../components/Icons";
import { fmtClock } from "../../lib/time";

interface BreakTimerProps {
  remainingSeconds: number;
  running: boolean;
  started: boolean;
  disabled: boolean;
  onStart: () => void;
  onPause: () => void;
  onSkip: () => void;
}

export function BreakTimer({
  remainingSeconds,
  running,
  started,
  disabled,
  onStart,
  onPause,
  onSkip,
}: BreakTimerProps) {
  return (
    <div className="break-timer">
      <span className={`clock ${running ? "running" : ""}`}>{fmtClock(remainingSeconds)}</span>
      <div className="timer-actions">
        {running ? (
          <button className="timer-btn" onClick={onPause}>
            <PauseIcon /> Pause
          </button>
        ) : (
          <button className="timer-btn accent" disabled={disabled} onClick={onStart}>
            <PlayIcon /> {started ? "Resume" : "Start"}
          </button>
        )}
        <button className="timer-btn" disabled={disabled} onClick={onSkip}>
          <SkipIcon /> Skip
        </button>
      </div>
    </div>
  );
}
