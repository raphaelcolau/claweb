"use client";

import { useEffect, useState, useCallback } from "react";

interface Pane {
  index: number;
  width: number;
  height: number;
  command: string;
  content: string;
}

interface Window {
  index: number;
  name: string;
  active: boolean;
  panes: Pane[];
}

interface Session {
  name: string;
  attached: boolean;
  windows: Window[];
}

export default function AgentsPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeWindow, setActiveWindow] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchSessions = useCallback(async () => {
    try {
      const res = await fetch("/api/agents");
      const data = await res.json();
      setSessions(data.sessions || []);
      if (!activeWindow && data.sessions?.length > 0) {
        const s = data.sessions[0];
        if (s.windows.length > 0) {
          setActiveWindow(`${s.name}:${s.windows[0].index}`);
        }
      }
    } finally {
      setLoading(false);
    }
  }, [activeWindow]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(fetchSessions, 5000);
    return () => clearInterval(interval);
  }, [autoRefresh, fetchSessions]);

  const allWindows = sessions.flatMap((s) =>
    s.windows.map((w) => ({ ...w, session: s.name, attached: s.attached }))
  );

  const currentWindow = allWindows.find(
    (w) => `${w.session}:${w.index}` === activeWindow
  );

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
            Lancez <code className="rounded bg-white/[0.06] px-1.5 py-0.5 font-mono">tmux</code> pour commencer
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid h-auto gap-4 md:h-[calc(100vh-5rem)] lg:grid-cols-[260px_1fr]">
      {/* Window list */}
      <div className="flex flex-col gap-2 overflow-y-auto rounded-lg border border-white/[0.06] bg-white/[0.02] p-3 max-md:max-h-48">
        <div className="flex items-center justify-between px-2 pb-1">
          <h2 className="text-xs font-medium uppercase tracking-wider text-[#555]">
            Sessions
          </h2>
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`rounded px-2 py-0.5 text-[10px] font-medium transition-colors ${
              autoRefresh
                ? "bg-emerald-500/20 text-emerald-400"
                : "bg-white/[0.06] text-[#666]"
            }`}
          >
            {autoRefresh ? "AUTO 5s" : "PAUSE"}
          </button>
        </div>

        {sessions.map((session) => (
          <div key={session.name}>
            <div className="flex items-center gap-2 px-2 py-1.5">
              <div
                className={`h-2 w-2 rounded-full ${
                  session.attached ? "bg-emerald-500" : "bg-[#555]"
                }`}
              />
              <span className="text-[13px] font-medium text-white">
                {session.name}
              </span>
              {session.attached && (
                <span className="text-[10px] text-emerald-500">attached</span>
              )}
            </div>

            <div className="ml-3 space-y-0.5 border-l border-white/[0.06] pl-3">
              {session.windows.map((win) => (
                <button
                  key={`${session.name}:${win.index}`}
                  onClick={() =>
                    setActiveWindow(`${session.name}:${win.index}`)
                  }
                  className={`flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-[13px] transition-colors ${
                    activeWindow === `${session.name}:${win.index}`
                      ? "bg-white/[0.08] text-white"
                      : "text-[#888] hover:bg-white/[0.04] hover:text-white"
                  }`}
                >
                  <span className="font-mono text-[11px] text-[#555]">
                    {win.index}
                  </span>
                  <span className="flex-1 truncate">{win.name}</span>
                  <span className="shrink-0 rounded bg-white/[0.06] px-1.5 py-0.5 text-[10px] text-[#666]">
                    {win.panes[0]?.command || "bash"}
                  </span>
                </button>
              ))}
            </div>
          </div>
        ))}

        <button
          onClick={fetchSessions}
          className="mt-auto rounded-md border border-white/[0.06] px-3 py-2 text-xs text-[#888] transition-colors hover:bg-white/[0.04] hover:text-white"
        >
          Rafraîchir
        </button>
      </div>

      {/* Pane content */}
      <div className="flex min-h-[50vh] flex-col overflow-hidden rounded-lg border border-white/[0.06] bg-[#0c0c0c] md:h-full">
        {currentWindow ? (
          <>
            <div className="flex flex-wrap items-center gap-2 border-b border-white/[0.06] px-3 py-2.5 md:gap-3 md:px-4">
              <span className="text-[13px] font-medium text-white">
                {currentWindow.name}
              </span>
              <span className="font-mono text-[11px] text-[#555]">
                {currentWindow.session}:{currentWindow.index}
              </span>
              <span className="rounded bg-white/[0.06] px-1.5 py-0.5 text-[10px] text-[#666]">
                {currentWindow.panes.length} pane{currentWindow.panes.length > 1 ? "s" : ""}
              </span>
              <span className="hidden font-mono text-[11px] text-[#555] sm:inline">
                {currentWindow.panes[0]?.width}x{currentWindow.panes[0]?.height}
              </span>
            </div>

            <div className="flex-1 overflow-auto p-1">
              {currentWindow.panes.map((pane) => (
                <div
                  key={pane.index}
                  className={`${
                    currentWindow.panes.length > 1
                      ? "mb-1 rounded border border-white/[0.04]"
                      : ""
                  }`}
                >
                  {currentWindow.panes.length > 1 && (
                    <div className="border-b border-white/[0.04] px-3 py-1 text-[10px] text-[#555]">
                      Pane {pane.index} — {pane.command}
                    </div>
                  )}
                  <pre className="overflow-x-auto p-3 font-mono text-[12px] leading-[1.4] text-[#ccc]">
                    {pane.content || "(vide)"}
                  </pre>
                </div>
              ))}
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
