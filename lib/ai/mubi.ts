import { useProgressStore } from "@/lib/state/progress";
import { useMubiStore } from "@/lib/state/mubi";
import { selectLine, resolveText, type SelectContext } from "./selector";
import type { MubiPrompt, MubiTrigger, MubiUtterance } from "@/lib/types";

// The Mubi controller — the current local `MubiBrain` (Blueprint §11). It reads
// context from the stores, selects a line, applies its effects, records it as
// spoken (no-repeat), and publishes the utterance for the UI. It runs entirely
// outside React so it can be driven by world events.

function buildContext(): SelectContext {
  const p = useProgressStore.getState();
  const m = useMubiStore.getState();
  return {
    act: p.act,
    warmth: p.warmth,
    revelation: p.revelation,
    flags: p.flags,
    hasSpoken: m.hasSpoken,
  };
}

/** Have Mubi speak in response to a trigger. Returns the utterance, or null. */
export function speak(trigger: MubiTrigger): MubiUtterance | null {
  const line = selectLine(trigger, buildContext());
  if (!line) return null;

  const utterance: MubiUtterance = {
    lineId: line.id,
    text: resolveText(line),
    mood: line.mood,
    prompts: line.prompts,
  };

  // apply effects — set flags BEFORE warmth so act derivation sees them
  const p = useProgressStore.getState();
  if (line.effects) {
    line.effects.flags?.forEach((f) => p.setFlag(f));
    if (line.effects.revelation != null) p.setRevelation(line.effects.revelation);
    if (line.effects.act) p.setAct(line.effects.act);
    if (line.effects.warmth) p.addWarmth(line.effects.warmth);
  }

  const m = useMubiStore.getState();
  m.markSpoken(line.id);
  m.say(utterance);
  return utterance;
}

/** The visitor chose a soft prompt. Fire its follow-up (or gently dismiss). */
export function choosePrompt(prompt: MubiPrompt): MubiUtterance | null {
  if (prompt.then) return speak(prompt.then);
  useMubiStore.getState().clear();
  return null;
}
