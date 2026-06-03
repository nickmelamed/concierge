import { useState, useEffect, useRef } from "react";
import CallPanel from "../components/CallPanel";
import AgentBrain from "../components/AgentBrain";
import ActionsLog from "../components/ActionsLog";
import Footer from "../components/Footer";
import { ScenarioRunner, loadScenario } from "../lib/scenarioRunner";
import styles from "./index.module.css";

const DEFAULT_SCENARIO = "lead_qualification";

const PRESETS = [
  { label: "Reschedule", value: "reschedule" },
  { label: "Complaint",  value: "complaint"  },
];

export default function Home() {
  const [allTurns, setAllTurns] = useState([]);
  const [memory,   setMemory]   = useState([]);
  const [steps,    setSteps]    = useState([]);
  const [actions,  setActions]  = useState([]);
  const [verdict,  setVerdict]  = useState(null);
  const [intent,   setIntent]   = useState(null);

  const runnerRef            = useRef(null);
  const generationRef        = useRef(0);
  const currentScenarioIdRef = useRef(DEFAULT_SCENARIO);

  // Derived state — the last turn in the list is always the one animating in
  const activeTurnIndex = Math.max(0, allTurns.length - 1);
  const isTyping        = allTurns[allTurns.length - 1]?.speaker === "agent";

  // ── Core playback ──────────────────────────────────────────────────────────

  // Drive the turn chain. Each call waits turn.delay_ms, appends the turn,
  // syncs memory + steps, then immediately schedules the next call.
  function playTurns(r, gen, idx) {
    const turn = r.getNextTurn(idx);
    if (!turn) return;

    setTimeout(() => {
      if (generationRef.current !== gen) return;

      setAllTurns(prev => [...prev, turn]);

      // Memory: update whenever new entries become visible
      setMemory(r.getMemoryAtTurn(idx));

      // Steps: pass the full resolved slice to AgentBrain; it handles its own
      // cascade timing via each step's delay_ms internally
      const visibleSteps = r.getStepsAtTurn(idx);
      setSteps(visibleSteps);

      // Verdict unlocks once every visible step has resolved (no more "pending")
      const resolvedIds = visibleSteps.filter(s => s.status !== "pending").map(s => s.id);
      setVerdict(r.getVerdict(resolvedIds));

      // Actions for this turn: staggered by cumulative delay_ms within the group
      scheduleActionsForTurn(r, gen, idx);

      playTurns(r, gen, idx + 1);
    }, turn.delay_ms);
  }

  // Schedule the actions belonging to a specific turn, chaining their delays
  // so they appear in sequence rather than all at once.
  function scheduleActionsForTurn(r, gen, turnIdx) {
    const group = r.getActions().filter(a => a.appears_after_turn === turnIdx);
    let cumDelay = 0;
    for (const action of group) {
      cumDelay += action.delay_ms;
      const delay = cumDelay;
      setTimeout(() => {
        if (generationRef.current !== gen) return;
        setActions(prev => [...prev, action]);
      }, delay);
    }
  }

  // Reset all panels and begin a fresh playback run
  function startScenario(scenarioData, gen) {
    const r = new ScenarioRunner(scenarioData);
    runnerRef.current = r;

    setAllTurns([]);
    setMemory([]);
    setSteps([]);
    setActions([]);
    setVerdict(null);
    setIntent(scenarioData.meta?.title ?? null);

    playTurns(r, gen, 0);
  }

  function loadAndStart(id) {
    currentScenarioIdRef.current = id;
    generationRef.current += 1;
    const gen = generationRef.current;

    let data;
    try {
      data = loadScenario(id);
    } catch {
      data = loadScenario(DEFAULT_SCENARIO);
    }

    startScenario(data, gen);
  }

  // ── Mount: auto-play the default scenario ──────────────────────────────────
  useEffect(() => {
    loadAndStart(DEFAULT_SCENARIO);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── User controls ──────────────────────────────────────────────────────────

  function handleReplay() {
    loadAndStart(currentScenarioIdRef.current);
  }

  function handleRun(value) {
    const id = value.trim().toLowerCase().replace(/\s+/g, "_") || DEFAULT_SCENARIO;
    loadAndStart(id);
  }

  function handleCurveball() {
    const r = runnerRef.current;
    if (!r) return;
    const cb = r.getCurveball();
    if (!cb) return;

    const gen = generationRef.current;

    // 1. Inject the caller's surprise line immediately
    setAllTurns(prev => [...prev, { speaker: "caller", text: cb.caller_line }]);

    // 2. Patch flagged memory items in place
    if (cb.memory_updates?.length) {
      setMemory(prev =>
        prev.map(m => {
          const patch = cb.memory_updates.find(u => u.id === m.id);
          return patch ? { ...m, ...patch } : m;
        })
      );
    }

    // 3. Queue agent response at 1.4 s
    setTimeout(() => {
      if (generationRef.current !== gen) return;
      setAllTurns(prev => [...prev, { speaker: "agent", text: cb.agent_response }]);

      // 4. Queue the injected action after its own delay
      if (cb.action_inject) {
        setTimeout(() => {
          if (generationRef.current !== gen) return;
          setActions(prev => [
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

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <span className={styles.logo}>concierge</span>
        <button className={styles.replay} onClick={handleReplay}>Replay</button>
      </header>

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
