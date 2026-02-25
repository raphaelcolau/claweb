"use client";

import { useEffect, useState, useCallback } from "react";
import dynamic from "next/dynamic";

const TerminalView = dynamic(() => import("@/components/TerminalView"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center text-sm text-[#555]">
      Chargement du terminal...
    </div>
  ),
});

interface TmuxWindow {
  index: string;
  name: string;
  active: boolean;
}

interface TmuxSession {
  session: string;
  windows: TmuxWindow[];
}

interface ApiResponse {
  sessions: TmuxSession[];
}

// Also support legacy format for backwards compat
interface LegacyWindow {
  index: number;
  name: string;
  active: boolean;
  panes: { index: number; width: number; height: number; command: string; content: string }[];
}

interface LegacySession {
  name: string;
  attached: boolean;
  windows: LegacyWindow[];
}

function normalizeSessions(data: { sessions: (TmuxSession | LegacySession)[] }): TmuxSession[] {
  if (!data.sessions?.length) return [];
  const first = data.sessions[0];
  // Check if it's legacy format (has "name" instead of "session")
  if ("name" in first && !("session" in first)) {
    return (data.sessions as LegacySession[]).map((s) => ({
      session: s.name,
      windows: s.windows.map((w) => ({
        index: String(w.index),
        name: w.name,
        active: w.active,
      })),
    }));
  }
  return data.sessions as TmuxSession[];
}

export default function AgentsPage() {
  const [sessions, setSessions] = useState<TmuxSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<{ session: string; window: string } | null>(null);

  const fetchSessions = useCallback(async () => {
    try {
      const res = await fetch("/api/agents");
      const data: ApiResponse = await res.json();
      const normalized = normalizeSessions(data);
      setSessions(normalized);

      // Auto-select first window if nothing selected
      if (!selected && normalized.length > 0 && normalized[0].windows.length > 0) {
        const s = normalized[0];
        const w = s.windows.find((w) => w.active) || s.windows[0];
        setSelected({ session: s.session, window: w.index });
      }
    } finally {
      setLoading(false);
    }
  }, [selected]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  // Refresh session list every 10s (lighter than before since terminal has its own stream)
  useEffect(() => {
    const interval = setInterval(fetchSessions, 10000);
    return () => clearInterval(interval);
  }, [fetchSessions]);

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-5rem)] items-center justify-center text-sm text-[#555]">
        Recherche de sessions tmux...
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <div className="flex h-[calc(100vh-5rem)] items-center justify-center">
        <div className="text-center">
          <TerminalIcon className="mx-auto mb-3 h-10 w-10 text-[#333]" />
          <p className="text-sm text-[#555]">Aucune session tmux active</p>
          <p className="mt-1 text-xs text-[#444]">
            Lancez{" "}
            <code className="rounded bg-white/[0.06] px-1.5 py-0.5 font-mono">
              tmux
            </code>{" "}
            pour commencer
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-5rem)] flex-col gap-4 lg:flex-row">
      {/* Session list — sidebar on desktop, tabs on mobile */}
      <div className="flex shrink-0 flex-col gap-2 overflow-y-auto rounded-lg border border-white/[0.06] bg-white/[0.02] p-3 max-lg:max-h-40 lg:w-[260px]">
        <div className="flex items-center justify-between px-2 pb-1">
          <h2 className="text-xs font-medium uppercase tracking-wider text-[#555]">
            Sessions
          </h2>
          <button
            onClick={fetchSessions}
            className="rounded px-2 py-0.5 text-[10px] font-medium text-[#666] transition-colors hover:bg-white/[0.06] hover:text-white"
          >
            REFRESH
          </button>
        </div>

        {/* Mobile: horizontal scrollable tabs */}
        <div className="flex gap-1.5 overflow-x-auto lg:hidden">
          {sessions.flatMap((s) =>
            s.windows.map((w) => (
              <button
                key={`${s.session}:${w.index}`}
                onClick={() => setSelected({ session: s.session, window: w.index })}
                className={`shrink-0 rounded-md px-3 py-1.5 text-[12px] transition-colors ${
                  selected?.session === s.session && selected?.window === w.index
                    ? "bg-white/[0.08] text-white"
                    : "bg-white/[0.03] text-[#888] hover:bg-white/[0.06] hover:text-white"
                }`}
              >
                <span className="font-mono text-[10px] text-[#555]">{s.session}:</span>
                {w.name}
              </button>
            ))
          )}
        </div>

        {/* Desktop: vertical list */}
        <div className="hidden lg:block">
          {sessions.map((s) => (
            <div key={s.session}>
              <div className="flex items-center gap-2 px-2 py-1.5">
                <div className="h-2 w-2 rounded-full bg-emerald-500" />
                <span className="text-[13px] font-medium text-white">
                  {s.session}
                </span>
              </div>

              <div className="ml-3 space-y-0.5 border-l border-white/[0.06] pl-3">
                {s.windows.map((w) => (
                  <button
                    key={`${s.session}:${w.index}`}
                    onClick={() => setSelected({ session: s.session, window: w.index })}
                    className={`flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-[13px] transition-colors ${
                      selected?.session === s.session && selected?.window === w.index
                        ? "bg-white/[0.08] text-white"
                        : "text-[#888] hover:bg-white/[0.04] hover:text-white"
                    }`}
                  >
                    <span className="font-mono text-[11px] text-[#555]">
                      {w.index}
                    </span>
                    <span className="flex-1 truncate">{w.name}</span>
                    {w.active && (
                      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Terminal panel */}
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-white/[0.06] bg-[#09090b]">
        {selected ? (
          <>
            <div className="flex items-center gap-3 border-b border-white/[0.06] px-4 py-2.5">
              <span className="text-[13px] font-medium text-white">
                {sessions
                  .find((s) => s.session === selected.session)
                  ?.windows.find((w) => w.index === selected.window)?.name || selected.window}
              </span>
              <span className="font-mono text-[11px] text-[#555]">
                {selected.session}:{selected.window}
              </span>
              <div className="ml-auto flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] text-emerald-500">LIVE</span>
              </div>
            </div>

            <div className="min-h-0 flex-1">
              <TerminalView
                key={`${selected.session}:${selected.window}`}
                session={selected.session}
                window={selected.window}
              />
            </div>
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center text-sm text-[#555]">
            Sélectionnez une fenêtre
          </div>
        )}
      </div>
    </div>
  );
}

function TerminalIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="M6 8L10 12L6 16" />
      <path d="M12 16H18" />
    </svg>
  );
}
