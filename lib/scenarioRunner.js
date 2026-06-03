export class ScenarioRunner {
  constructor(scenario) {
    this._scenario = scenario;
  }

  // Returns the turn at the given index, or null if out of range.
  getNextTurn(index) {
    return this._scenario.turns.find((t) => t.index === index) ?? null;
  }

  // Returns reasoning_steps with delay_ms already present on each item.
  // Pending steps include resolved_text/resolved_status for use after resolves_after_turn.
  getReasoningSteps() {
    return this._scenario.reasoning_steps;
  }

  // Returns actions with delay_ms already present on each item.
  getActions() {
    return this._scenario.actions;
  }

  // Returns the curveball object (inject_after_turn, caller_line, agent_response,
  // memory_updates, action_inject), or null if the scenario has none.
  getCurveball() {
    return this._scenario.curveball ?? null;
  }

  // Convenience: returns all memory entries visible after a given turn index.
  getMemoryAtTurn(turnIndex) {
    return this._scenario.memory.filter((m) => m.appears_after_turn <= turnIndex);
  }

  // Convenience: returns all reasoning steps that have appeared by turnIndex,
  // with pending steps resolved if turnIndex >= resolves_after_turn.
  getStepsAtTurn(turnIndex) {
    return this._scenario.reasoning_steps
      .filter((s) => s.appears_after_turn <= turnIndex)
      .map((s) => {
        if (
          s.status === "pending" &&
          s.resolves_after_turn != null &&
          turnIndex >= s.resolves_after_turn
        ) {
          return { ...s, text: s.resolved_text, status: s.resolved_status };
        }
        return s;
      });
  }

  // Convenience: returns actions that have appeared by turnIndex.
  getActionsAtTurn(turnIndex) {
    return this._scenario.actions.filter((a) => a.appears_after_turn <= turnIndex);
  }

  // Returns the verdict, or null if it hasn't appeared yet given completed step ids.
  getVerdict(completedStepIds = []) {
    const v = this._scenario.verdict;
    if (!v) return null;
    return completedStepIds.includes(v.appears_after_step) ? v : null;
  }

  get meta() {
    return this._scenario.meta;
  }

  get totalTurns() {
    return this._scenario.turns.length;
  }
}

// Static map so Next.js can bundle the JSON at build time.
// Dynamic template-literal imports are unreliable across bundlers.
import leadQualification from "../scenarios/lead_qualification.json";
import reschedule        from "../scenarios/reschedule.json";
import complaint         from "../scenarios/complaint.json";

const SCENARIOS = { lead_qualification: leadQualification, reschedule, complaint };

export function loadScenario(id) {
  const data = SCENARIOS[id];
  if (!data) throw new Error(`Unknown scenario: "${id}"`);
  return data;
}
