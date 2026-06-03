import { useState, useRef } from "react";
import CallPanel from "../components/CallPanel";
import AgentBrain from "../components/AgentBrain";
import ActionsLog from "../components/ActionsLog";
import Footer from "../components/Footer";
import { ScenarioRunner, loadScenario } from "../lib/scenarioRunner";
import styles from "./index.module.css";

const PRESETS = [
  { label: "Reschedule", value: "reschedule" },
  { label: "Complaint", value: "complaint" },
];

export default function Home() {
  const [allTurns, setAllTurns]   = useState([]);
  const [memory, setMemory]       = useState([]);
  const [steps, setSteps]         = useState([]);
  const [actions, setActions]     = useState([]);
  const [verdict, setVerdict]     = useState(null);
  const [intent, setIntent]       = useState(null);

  const runnerRef     = useRef(null);
  const generationRef = useRef(0);   // incremented on each new run to abort stale callbacks

  // Derived — the last turn in the list is always the one currently animating in
  const activeTurnIndex = Math.max(0, allTurns.length - 1);
  const isTyping        = allTurns[allTurns.length - 1]?.speaker === "agent";

  // ── Playback chain ──────────────────────────────────────────────────────────
  // Each call schedules one turn then calls itself for the next, aborting if the
  // generation counter has moved on (i.e. a new Run was triggered).
  function scheduleNextTurn(gen, r, idx) {
    const turn = r.getNextTurn(idx);
    if (!turn) return;

    setTimeout(() => {
      if (generationRef.current !== gen) return;

      setAllTurns((prev) => [...prev, turn]);

      const visibleSteps = r.getStepsAtTurn(idx);
      setMemory(r.getMemoryAtTurn(idx));
      setSteps(visibleSteps);
      setActions(r.getActionsAtTurn(idx));

      // Verdict unlocks once all visible steps have resolved
      const doneIds = visibleSteps.filter((s) => s.status !== "pending").map((s) => s.id);
      setVerdict(r.getVerdict(doneIds));

      // Intent tracks the pending step (what the agent is actively checking),
      // or the last resolved step when everything settles
      const pending   = visibleSteps.find((s) => s.status === "pending");
      const forIntent = pending ?? visibleSteps[visibleSteps.length - 1];
      if (forIntent) setIntent(forIntent.text.replace(/\.\.\.$/, "").trim());

      scheduleNextTurn(gen, r, idx + 1);
    }, turn.delay_ms);
  }

  // ── Run ─────────────────────────────────────────────────────────────────────
  async function handleRun(value) {
    // Normalise input to a scenario ID; fall back to lead_qualification
    const id = value.trim().toLowerCase().replace(/\s+/g, "_") || "lead_qualification";

    generationRef.current += 1;
    const gen = generationRef.current;

    setAllTurns([]);
    setMemory([]);
    setSteps([]);
    setActions([]);
    setVerdict(null);
    setIntent(null);

    let data;
    try {
      data = await loadScenario(id);
    } catch {
      data = await loadScenario("lead_qualification");
    }

    const r = new ScenarioRunner(data);
    runnerRef.current = r;
    scheduleNextTurn(gen, r, 0);
  }

  // ── Curveball ───────────────────────────────────────────────────────────────
  function handleCurveball() {
    const r  = runnerRef.current;
    if (!r) return;
    const cb = r.getCurveball();
    if (!cb) return;

    // 1. Inject the caller's curveball line immediately
    setAllTurns((prev) => [...prev, { speaker: "caller", text: cb.caller_line }]);

    // 2. Patch flagged memory items
    if (cb.memory_updates?.length) {
      setMemory((prev) =>
        prev.map((m) => {
          const patch = cb.memory_updates.find((u) => u.id === m.id);
          return patch ? { ...m, ...patch } : m;
        })
      );
    }

    // 3. Queue the agent response at 1.4 s
    setTimeout(() => {
      setAllTurns((prev) => [...prev, { speaker: "agent", text: cb.agent_response }]);

      // 4. Queue the injected action after its own delay
      if (cb.action_inject) {
        setTimeout(() => {
          setActions((prev) => [
            ...prev,
            {
              id:        `cb_${Date.now()}`,
              text:      cb.action_inject.text,
              timestamp: cb.action_inject.timestamp,
              status:    "done",
            },
          ]);
        }, cb.action_inject.delay_ms ?? 0);
      }
    }, 1400);
  }

  return (
    <div className={styles.page}>
      <div className={styles.main}>
        <div className={styles.left}>
          <CallPanel
            turns={allTurns}
            activeTurnIndex={activeTurnIndex}
            isTyping={isTyping}
          />
          <ActionsLog actions={actions} />
        </div>
        <AgentBrain
          intent={intent}
          memory={memory}
          steps={steps}
          verdict={verdict}
        />
      </div>
      <Footer onRun={handleRun} onCurveball={handleCurveball} presets={PRESETS} />
    </div>
  );
}
