import { useState } from "react";
import styles from "./Footer.module.css";

export default function Footer({ onRun, onCurveball, presets = [] }) {
  const [value, setValue] = useState("");

  function handlePreset(preset) {
    setValue(preset.value);
  }

  function handleRun() {
    onRun?.(value);
  }

  function handleKeyDown(e) {
    if (e.key === "Enter") handleRun();
  }

  return (
    <footer className={styles.footer}>
      <div className={styles.presets}>
        {presets.map((p) => (
          <button key={p.label} className={styles.preset} onClick={() => handlePreset(p)}>
            {p.label}
          </button>
        ))}
      </div>

      <div className={styles.divider} />

      <input
        className={styles.input}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Describe a caller scenario, or pick a preset..."
      />

      <button className={styles.curveball} onClick={onCurveball}>
        ⚡ Curveball
      </button>

      <button className={styles.run} onClick={handleRun}>
        Run
      </button>
    </footer>
  );
}
