/**
 * ContextEngine
 *
 * The application knows facts. The AI performs reasoning.
 * This module is the bridge: every screen registers its live, structured
 * context here as it mounts/updates, and the AI orchestrator always reads
 * from this single source of truth before deciding what to do.
 *
 * The assistant must never ask "which job?" or "which customer?" — if the
 * tailor is looking at a job, the AI already has that job's full record.
 *
 * Design:
 *   - A tiny pub/sub store, deliberately simpler than the app's Zustand store.
 *     It only ever holds ONE thing: "what is currently active."
 *   - Screens call `useAIContext(...)` — a hook that registers context on
 *     mount/update and automatically clears it on unmount, so navigating
 *     away from a job never leaves stale context behind.
 *   - The orchestrator and FloatingAssistant read `contextEngine.getActive()`
 *     synchronously — no async fetch, no loading state, always current.
 */

import { useEffect, useRef } from 'react';
import {
  AIActiveContext,
  AIScreenName,
  Customer,
  Job,
  Measurements,
} from '../../../types';

// ─── Engine ────────────────────────────────────────────────────────────────────

type Listener = (context: AIActiveContext) => void;

class ContextEngine {
  private active: AIActiveContext = {
    screen: 'Dashboard',
    updatedAt: new Date().toISOString(),
  };
  private listeners = new Set<Listener>();
  private recentActions: string[] = [];

  // ── Read ────────────────────────────────────────────────────────────────

  getActive(): AIActiveContext {
    return this.active;
  }

  // ── Write ───────────────────────────────────────────────────────────────
  // Called by useAIContext() on every screen. Shallow-merges so a screen can
  // update just its `job` without losing `screen`/`customer` etc mid-render.

  set(partial: Partial<Omit<AIActiveContext, 'updatedAt'>>): void {
    this.active = {
      ...this.active,
      ...partial,
      recentActions: this.recentActions.slice(-8),
      updatedAt: new Date().toISOString(),
    };
    this.notify();
  }

  // Called when a screen unmounts — clears fields it owned so a stale job
  // doesn't leak into, say, the Dashboard context after navigating back.
  clearScreen(screen: AIScreenName): void {
    if (this.active.screen !== screen) return; // already replaced by a new screen
    this.set({ customer: undefined, job: undefined, measurements: undefined, selectedItems: undefined, extra: undefined });
  }

  // ── Recent Actions ─────────────────────────────────────────────────────
  // A short rolling log ("marked Ready", "recorded payment") so the AI can
  // reason about what the tailor JUST did, not only what's on screen now.

  logAction(description: string): void {
    this.recentActions = [...this.recentActions, description].slice(-8);
    this.active = { ...this.active, recentActions: this.recentActions };
    this.notify();
  }

  // ── Subscriptions ──────────────────────────────────────────────────────

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    this.listeners.forEach((l) => l(this.active));
  }
}

export const contextEngine = new ContextEngine();

// ─── React Hook ────────────────────────────────────────────────────────────────
// Call this at the top of any screen the assistant should be aware of.
// It registers context on mount and every time the inputs change, and
// clears the screen-owned fields on unmount.

export function useAIContext(input: {
  screen: AIScreenName;
  customer?: Customer;
  job?: Job;
  measurements?: Measurements[];
  selectedItems?: string[];
  extra?: Record<string, unknown>;
}): void {
  const { screen, customer, job, measurements, selectedItems, extra } = input;

  // Serialize the volatile bits so the effect only fires on real changes,
  // not on every parent re-render.
  const depKey = JSON.stringify({
    screen,
    customerId: customer?.id,
    jobId: job?.id,
    jobUpdatedAt: job?.updatedAt,
    measurementCount: measurements?.length,
    selectedItems,
    extra,
  });

  const screenRef = useRef(screen);
  screenRef.current = screen;

  useEffect(() => {
    contextEngine.set({ screen, customer, job, measurements, selectedItems, extra });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [depKey]);

  useEffect(() => {
    return () => {
      contextEngine.clearScreen(screenRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
