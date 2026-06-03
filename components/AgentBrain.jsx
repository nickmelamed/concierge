import { useState, useEffect } from "react";
import styles from "./AgentBrain.module.css";

export default function AgentBrain({ intent, memory = [], steps = [], verdict = null }) {
  const [visibleCount, setVisibleCount] = useState(0);
  const [verdictVisible, setVerdictVisible] = useState(false);

  // Cascade steps in one by one, using each step's delay_ms if present
  useEffect(() => {
    if (visibleCount >= steps.length) return;
    const step = steps[visibleCount];
    const delay = step?.delay_ms ?? (600 + Math.floor(Math.random() * 300));
    const timer = setTimeout(() => setVisibleCount((c) => c + 1), delay);
    return () => clearTimeout(timer);
  }, [visibleCount, steps.length]);

  // Reset when a different scenario is loaded (first step id changes)
  const firstStepId = steps[0]?.id;
  useEffect(() => {
    setVisibleCount(0);
    setVerdictVisible(false);
  }, [firstStepId]);

  // Show verdict after a short pause once all steps are visible
  const allVisible = visibleCount >= steps.length && steps.length > 0;
  useEffect(() => {
    if (!verdict || !allVisible) { setVerdictVisible(false); return; }
    const timer = setTimeout(() => setVerdictVisible(true), 350);
    return () => clearTimeout(timer);
  }, [verdict, allVisible]);

  return (
    <div className={styles.brain}>
      {intent && (
        <div className={styles.intentBadge}>
          <TargetIcon />
          <span>{intent}</span>
        </div>
      )}

      {memory.length > 0 && (
        <section className={styles.section}>
          <h4 className={styles.sectionLabel}>Memory</h4>
          <ul className={styles.memoryList}>
            {memory.map((item, i) => (
              <li
                key={i}
                className={[
                  styles.memoryItem,
                  item.flagged ? styles.memoryFlagged : "",
                  item.highlight && !item.flagged ? styles.memoryHighlight : "",
                ].join(" ")}
              >
                {item.text}
              </li>
            ))}
          </ul>
        </section>
      )}

      {steps.length > 0 && (
        <section className={styles.section}>
          <h4 className={styles.sectionLabel}>Checking fit</h4>
          <ul className={styles.stepList}>
            {steps.slice(0, visibleCount).map((step, i) => (
              <li key={step.id ?? i} className={styles.step}>
                <StepIcon status={step.status} />
                <span className={styles[`stepText_${step.status}`] + " " + styles.stepText}>
                  {step.text}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {verdictVisible && verdict && (
        <div className={styles.verdict}>
          <p className={styles.verdictText}>{verdict.text}</p>
          {verdict.score != null && (
            <p className={styles.verdictScore}>
              Score <span className={styles.scoreValue}>{verdict.score}</span>
              <span className={styles.scoreMax}> / 100</span>
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function StepIcon({ status }) {
  if (status === "done") return <CheckIcon />;
  if (status === "flagged") return <TriangleIcon />;
  return <SpinnerIcon />;
}

function TargetIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="8" cy="8" r="2.5" fill="currentColor" />
      <line x1="8" y1="1" x2="8" y2="4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="8" y1="11.5" x2="8" y2="15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="1" y1="8" x2="4.5" y2="8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="11.5" y1="8" x2="15" y2="8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function SpinnerIcon() {
  return (
    <svg className={styles.spinner} width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle cx="8" cy="8" r="6" stroke="#21262d" strokeWidth="2" />
      <circle
        cx="8" cy="8" r="6"
        stroke="#c9a96e"
        strokeWidth="2"
        strokeDasharray="11 27"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle cx="8" cy="8" r="7" fill="#238636" fillOpacity="0.25" />
      <path
        d="M4.5 8.5l2.5 2.5 5-5.5"
        stroke="#3fb950"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function TriangleIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M8 2.5L14 13H2L8 2.5z"
        stroke="#c9a96e"
        strokeWidth="1.5"
        strokeLinejoin="round"
        fill="rgba(201,169,110,0.12)"
      />
      <line x1="8" y1="6.5" x2="8" y2="9.5" stroke="#c9a96e" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="8" cy="11.2" r="0.8" fill="#c9a96e" />
    </svg>
  );
}
