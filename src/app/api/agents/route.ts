import { NextResponse } from "next/server";
import { execSync } from "child_process";

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

function run(cmd: string): string {
  try {
    return execSync(cmd, { encoding: "utf-8", timeout: 5000 }).trim();
  } catch {
    return "";
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const captureTarget = searchParams.get("capture");

  // If requesting pane content capture
  if (captureTarget) {
    const content = run(
      `tmux capture-pane -t ${captureTarget} -p -S -50 2>/dev/null`
    );
    return NextResponse.json({ content });
  }

  try {
    const sessionsRaw = run(
      `tmux list-sessions -F '#{session_name}|#{session_attached}' 2>/dev/null`
    );

    if (!sessionsRaw) {
      return NextResponse.json({ sessions: [] });
    }

    const sessions: Session[] = [];

    for (const line of sessionsRaw.split("\n")) {
      if (!line) continue;
      const [name, attached] = line.split("|");

      const windowsRaw = run(
        `tmux list-windows -t '${name}' -F '#{window_index}|#{window_name}|#{window_active}' 2>/dev/null`
      );

      const windows: Window[] = [];
      for (const wLine of windowsRaw.split("\n")) {
        if (!wLine) continue;
        const [wIndex, wName, wActive] = wLine.split("|");

        const panesRaw = run(
          `tmux list-panes -t '${name}:${wIndex}' -F '#{pane_index}|#{pane_width}|#{pane_height}|#{pane_current_command}' 2>/dev/null`
        );

        const panes: Pane[] = [];
        for (const pLine of panesRaw.split("\n")) {
          if (!pLine) continue;
          const [pIndex, pWidth, pHeight, pCommand] = pLine.split("|");

          // Capture last 30 lines of each pane
          const content = run(
            `tmux capture-pane -t '${name}:${wIndex}.${pIndex}' -p -S -30 2>/dev/null`
          );

          panes.push({
            index: parseInt(pIndex),
            width: parseInt(pWidth),
            height: parseInt(pHeight),
            command: pCommand || "bash",
            content,
          });
        }

        windows.push({
          index: parseInt(wIndex),
          name: wName || `window-${wIndex}`,
          active: wActive === "1",
          panes,
        });
      }

      sessions.push({
        name: name || "unnamed",
        attached: attached === "1",
        windows,
      });
    }

    return NextResponse.json({ sessions });
  } catch (error) {
    console.error("tmux error:", error);
    return NextResponse.json({ sessions: [], error: "Failed to query tmux" });
  }
}
