"use client";

import { useEffect, useRef, useCallback } from "react";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import { WebLinksAddon } from "@xterm/addon-web-links";
import "@xterm/xterm/css/xterm.css";

interface TerminalViewProps {
  session: string;
  window: string;
}

export default function TerminalView({ session, window: windowId }: TerminalViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const termRef = useRef<Terminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  const connect = useCallback(() => {
    // Close existing connection
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    const term = termRef.current;
    if (!term) return;

    term.clear();
    term.write("\x1b[2J\x1b[H"); // Clear screen and move cursor home

    const url = `/api/agents/stream?session=${encodeURIComponent(session)}&window=${encodeURIComponent(windowId)}`;
    const es = new EventSource(url);
    eventSourceRef.current = es;

    es.onmessage = (event) => {
      try {
        // Decode base64 → raw bytes → pass to xterm as Uint8Array
        // (xterm handles UTF-8 natively; atob() would corrupt multi-byte chars)
        const bytes = Uint8Array.from(atob(event.data), (c) => c.charCodeAt(0));
        term.write("\x1b[2J\x1b[H"); // Clear before each full refresh
        term.write(bytes);
      } catch {
        // ignore decode errors
      }
    };

    es.onerror = () => {
      es.close();
      // Reconnect after 2s
      setTimeout(() => {
        if (eventSourceRef.current === es) {
          connect();
        }
      }, 2000);
    };
  }, [session, windowId]);

  // Initialize terminal
  useEffect(() => {
    if (!containerRef.current) return;

    const term = new Terminal({
      theme: {
        background: "#09090b",
        foreground: "#cccccc",
        cursor: "#cccccc",
        cursorAccent: "#09090b",
        selectionBackground: "rgba(255, 255, 255, 0.15)",
        black: "#000000",
        red: "#ff5555",
        green: "#50fa7b",
        yellow: "#f1fa8c",
        blue: "#bd93f9",
        magenta: "#ff79c6",
        cyan: "#8be9fd",
        white: "#bbbbbb",
        brightBlack: "#555555",
        brightRed: "#ff6e6e",
        brightGreen: "#69ff94",
        brightYellow: "#ffffa5",
        brightBlue: "#d6acff",
        brightMagenta: "#ff92df",
        brightCyan: "#a4ffff",
        brightWhite: "#ffffff",
      },
      fontSize: 13,
      fontFamily: "'Geist Mono', 'Fira Code', 'Cascadia Code', Menlo, Monaco, 'Courier New', monospace",
      cursorBlink: false,
      cursorStyle: "block",
      cursorInactiveStyle: "none",
      disableStdin: true,
      convertEol: true,
      scrollback: 5000,
      allowProposedApi: true,
    });

    const fitAddon = new FitAddon();
    const webLinksAddon = new WebLinksAddon();

    term.loadAddon(fitAddon);
    term.loadAddon(webLinksAddon);
    term.open(containerRef.current);

    // Small delay to ensure DOM is ready before fitting
    requestAnimationFrame(() => {
      try {
        fitAddon.fit();
      } catch {
        // ignore fit errors on initial render
      }
    });

    termRef.current = term;
    fitAddonRef.current = fitAddon;

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      term.dispose();
      termRef.current = null;
      fitAddonRef.current = null;
    };
  }, []);

  // Connect/reconnect when session or window changes
  useEffect(() => {
    if (!termRef.current) return;
    connect();

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };
  }, [connect]);

  // Handle resize
  useEffect(() => {
    const handleResize = () => {
      if (fitAddonRef.current) {
        try {
          fitAddonRef.current.fit();
        } catch {
          // ignore fit errors during resize
        }
      }
    };

    const observer = new ResizeObserver(handleResize);
    if (containerRef.current) {
      observer.observe(containerRef.current);
    }
    globalThis.addEventListener("resize", handleResize);

    return () => {
      observer.disconnect();
      globalThis.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="h-full w-full"
      style={{ padding: "4px" }}
    />
  );
}
