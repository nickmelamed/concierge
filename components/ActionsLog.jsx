import { useEffect, useRef } from "react";
import styles from "./ActionsLog.module.css";

export default function ActionsLog({ actions = [] }) {
  const listRef = useRef(null);

  // Scroll to the latest action whenever a new one is appended
  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [actions.length]);

  return (
    <div className={styles.log}>
      <p className={styles.header}>Actions</p>
      <div className={styles.list} ref={listRef}>
        {actions.length === 0 ? (
          <span className={styles.empty}>No actions yet.</span>
        ) : (
          actions.map((action, i) => (
            <ActionRow key={action.id ?? i} action={action} />
          ))
        )}
      </div>
    </div>
  );
}

// Keyed by action.id so the DOM element is stable across status changes —
// the icon transition is a CSS opacity crossfade on the same element, not a remount.
function ActionRow({ action }) {
  const done = action.status === "done";
  return (
    <div className={styles.action}>
      <ActionIcon done={done} />
      <span className={styles.timestamp}>{action.timestamp}</span>
      <span className={`${styles.text} ${done ? styles.textDone : ""}`}>
        {action.text}
      </span>
    </div>
  );
}

// Both icons always live in the DOM. Opacity transitions between them so
// there's no remount when status flips from pending to done.
function ActionIcon({ done }) {
  return (
    <div className={styles.iconWrap}>
      <div className={`${styles.iconLayer} ${done ? styles.iconHidden : ""}`}>
        <SpinnerIcon />
      </div>
      <div className={`${styles.iconLayer} ${!done ? styles.iconHidden : ""}`}>
        <CheckIcon />
      </div>
    </div>
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
