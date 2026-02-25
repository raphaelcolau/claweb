import { spawn } from "child_process";

export const dynamic = "force-dynamic";

function capturePaneAnsi(session: string, window: string): Promise<string> {
  return new Promise((resolve) => {
    const target = `${session}:${window}`;
    const proc = spawn("tmux", [
      "capture-pane",
      "-t",
      target,
      "-e",
      "-p",
    ]);

    let output = "";
    proc.stdout.on("data", (chunk: Buffer) => {
      output += chunk.toString();
    });
    proc.stderr.on("data", () => {});
    proc.on("close", () => resolve(output));
    proc.on("error", () => resolve(""));

    setTimeout(() => {
      proc.kill();
      resolve(output);
    }, 3000);
  });
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const session = searchParams.get("session");
  const window = searchParams.get("window");

  if (!session || !window) {
    return new Response("Missing session or window parameter", { status: 400 });
  }

  const encoder = new TextEncoder();
  let closed = false;

  const stream = new ReadableStream({
    async start(controller) {
      // Send initial full content
      const initial = await capturePaneAnsi(session, window);
      if (closed) return;
      const b64 = Buffer.from(initial).toString("base64");
      controller.enqueue(encoder.encode(`data: ${b64}\n\n`));

      let lastContent = initial;

      const poll = async () => {
        if (closed) return;
        try {
          const content = await capturePaneAnsi(session, window);
          if (closed) return;

          if (content !== lastContent) {
            lastContent = content;
            const b64Data = Buffer.from(content).toString("base64");
            controller.enqueue(encoder.encode(`data: ${b64Data}\n\n`));
          }
        } catch {
          // ignore capture errors
        }

        if (!closed) {
          setTimeout(poll, 200);
        }
      };

      setTimeout(poll, 200);
    },
    cancel() {
      closed = true;
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
