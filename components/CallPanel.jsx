import React, { useMemo, useState, useEffect, useRef } from "react";
import styles from "./CallPanel.module.css";

const BAR_COUNT = 28;
const WORD_INTERVAL_MS = 100;

function useBarHeights() {
  return useMemo(
    () => Array.from({ length: BAR_COUNT }, () => 10 + Math.random() * 26),
    []
  );
}

export default function CallPanel({ turns = [], activeTurnIndex = 0, isTyping = false }) {
  const barHeights = useBarHeights();
  const [visibleWordCount, setVisibleWordCount] = useState(0);
  const transcriptRef = useRef(null);

  const activeTurn = turns[activeTurnIndex] ?? null;
  const activeWords = activeTurn ? activeTurn.text.split(" ") : [];
  const isAgentTurn = activeTurn?.speaker === "agent";

  // Animate words in when the active turn changes
  useEffect(() => {
    setVisibleWordCount(0);
    if (!activeTurn) return;

    let count = 0;
    const timer = setInterval(() => {
      count += 1;
      setVisibleWordCount(count);
      if (count >= activeWords.length) clearInterval(timer);
    }, WORD_INTERVAL_MS);

    return () => clearInterval(timer);
  }, [activeTurnIndex]);

  // Scroll to bottom as content grows
  useEffect(() => {
    const el = transcriptRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [activeTurnIndex, visibleWordCount]);

  return (
    <div className={styles.panel}>
      <Waveform barHeights={barHeights} isTyping={isTyping} />

      <div className={styles.transcript} ref={transcriptRef}>
        {/* Completed turns */}
        {turns.slice(0, activeTurnIndex).map((turn, i) => (
          <Turn key={i} turn={turn} />
        ))}

        {/* Active turn — words animate in */}
        {activeTurn && (
          <div className={styles.turn}>
            <span className={`${styles.label} ${isAgentTurn ? styles.labelAgent : styles.labelCaller}`}>
              {isAgentTurn ? "Concierge" : "Caller"}
            </span>
            <p className={styles.text}>
              {activeWords.slice(0, visibleWordCount).map((word, i) => (
                <span key={i} className={styles.word}>{word}{" "}</span>
              ))}
              {isAgentTurn && <span className={styles.cursor} />}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function Waveform({ barHeights, isTyping }) {
  return (
    <div className={styles.waveform}>
      {barHeights.map((height, i) => (
        <div
          key={i}
          className={`${styles.bar} ${isTyping ? styles.barActive : ""}`}
          style={{
            height: `${height}px`,
            animationDelay: `${(i / BAR_COUNT).toFixed(3)}s`,
          }}
        />
      ))}
    </div>
  );
}

function Turn({ turn }) {
  const isAgent = turn.speaker === "agent";
  return (
    <div className={styles.turn}>
      <span className={`${styles.label} ${isAgent ? styles.labelAgent : styles.labelCaller}`}>
        {isAgent ? "Concierge" : "Caller"}
      </span>
      <p className={styles.text}>{turn.text}</p>
    </div>
  );
}
