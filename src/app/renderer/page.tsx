"use client";

import { useState, useRef, useEffect, useCallback } from "react";

const DEFAULT_CODE = `function App() {
  const [count, setCount] = React.useState(0);

  return (
    <div style={{
      fontFamily: 'system-ui, sans-serif',
      padding: '2rem',
      maxWidth: '600px',
      margin: '0 auto',
      color: '#e0e0e0',
    }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 600 }}>
        Hello from ClaWeb Renderer
      </h1>
      <p style={{ color: '#888', marginTop: '0.5rem' }}>
        Éditez le code à gauche pour voir le résultat en temps réel.
      </p>
      <div style={{ marginTop: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <button
          onClick={() => setCount(c => c + 1)}
          style={{
            background: '#2563eb',
            color: 'white',
            border: 'none',
            padding: '0.5rem 1rem',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px',
          }}
        >
          Count: {count}
        </button>
        <button
          onClick={() => setCount(0)}
          style={{
            background: 'transparent',
            color: '#888',
            border: '1px solid #333',
            padding: '0.5rem 1rem',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px',
          }}
        >
          Reset
        </button>
      </div>
    </div>
  );
}`;

function buildSandboxHTML(code: string): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { background: #0a0a0a; color: #e0e0e0; }
    #root { min-height: 100vh; }
    #error {
      position: fixed; bottom: 0; left: 0; right: 0;
      background: #1a0000; color: #ff6b6b; padding: 12px 16px;
      font-family: monospace; font-size: 12px; white-space: pre-wrap;
      border-top: 1px solid #ff6b6b33; max-height: 40vh; overflow-y: auto;
      display: none;
    }
  </style>
</head>
<body>
  <div id="root"></div>
  <div id="error"></div>
  <script src="https://unpkg.com/react@18/umd/react.development.js"><\/script>
  <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"><\/script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"><\/script>
  <script>
    const errorEl = document.getElementById('error');
    window.onerror = function(msg) {
      errorEl.style.display = 'block';
      errorEl.textContent = msg;
    };

    try {
      const code = ${JSON.stringify(code)};
      const transformed = Babel.transform(
        code + '\\nReactDOM.createRoot(document.getElementById("root")).render(React.createElement(App));',
        { presets: ['react'] }
      ).code;
      errorEl.style.display = 'none';
      eval(transformed);
    } catch (e) {
      errorEl.style.display = 'block';
      errorEl.textContent = e.message;
    }
  <\/script>
</body>
</html>`;
}

export default function RendererPage() {
  const [code, setCode] = useState(DEFAULT_CODE);
  const [liveHTML, setLiveHTML] = useState("");
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);

  const updatePreview = useCallback((source: string) => {
    const html = buildSandboxHTML(source);
    setLiveHTML(html);
  }, []);

  useEffect(() => {
    updatePreview(code);
  }, []);

  function handleCodeChange(value: string) {
    setCode(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => updatePreview(value), 400);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Tab") {
      e.preventDefault();
      const target = e.currentTarget;
      const start = target.selectionStart;
      const end = target.selectionEnd;
      const newValue = code.slice(0, start) + "  " + code.slice(end);
      setCode(newValue);
      requestAnimationFrame(() => {
        target.selectionStart = target.selectionEnd = start + 2;
      });
    }
  }

  const lineCount = code.split("\n").length;

  return (
    <div className="grid h-auto gap-4 md:h-[calc(100vh-5rem)] md:grid-cols-2">
      {/* Editor */}
      <div className="flex min-h-[40vh] flex-col overflow-hidden rounded-lg border border-white/[0.06] bg-[#0c0c0c] md:h-full">
        <div className="flex items-center justify-between border-b border-white/[0.06] px-3 py-2.5 md:px-4">
          <div className="flex items-center gap-2">
            <CodeIcon />
            <span className="text-[13px] font-medium text-white">
              Éditeur JSX
            </span>
          </div>
          <div className="flex items-center gap-2 md:gap-3">
            <span className="hidden text-[11px] tabular-nums text-[#555] sm:inline">
              {lineCount} lignes
            </span>
            <button
              onClick={() => updatePreview(code)}
              className="rounded-md border border-white/[0.06] px-2 py-1 text-xs text-[#888] transition-colors hover:bg-white/[0.04] hover:text-white md:px-3"
            >
              Exécuter
            </button>
            <button
              onClick={() => {
                setCode(DEFAULT_CODE);
                updatePreview(DEFAULT_CODE);
              }}
              className="rounded-md border border-white/[0.06] px-2 py-1 text-xs text-[#888] transition-colors hover:bg-white/[0.04] hover:text-white md:px-3"
            >
              Reset
            </button>
          </div>
        </div>
        <div className="relative flex-1 overflow-hidden">
          {/* Line numbers */}
          <div
            className="pointer-events-none absolute left-0 top-0 h-full w-10 overflow-hidden border-r border-white/[0.04] bg-[#080808] py-3 pr-2 text-right font-mono text-[12px] leading-[1.5] text-[#333]"
            aria-hidden="true"
          >
            {Array.from({ length: lineCount }, (_, i) => (
              <div key={i}>{i + 1}</div>
            ))}
          </div>
          <textarea
            ref={textareaRef}
            value={code}
            onChange={(e) => handleCodeChange(e.target.value)}
            onKeyDown={handleKeyDown}
            spellCheck={false}
            className="h-full w-full resize-none bg-transparent py-3 pl-12 pr-4 font-mono text-[12px] leading-[1.5] text-[#ccc] outline-none"
          />
        </div>
      </div>

      {/* Preview */}
      <div className="flex min-h-[40vh] flex-col overflow-hidden rounded-lg border border-white/[0.06] bg-[#0c0c0c] md:h-full">
        <div className="flex items-center gap-2 border-b border-white/[0.06] px-4 py-2.5">
          <PreviewIcon />
          <span className="text-[13px] font-medium text-white">
            Aperçu
          </span>
          <span className="rounded bg-emerald-500/20 px-1.5 py-0.5 text-[10px] font-medium text-emerald-400">
            LIVE
          </span>
        </div>
        <div className="flex-1">
          <iframe
            ref={iframeRef}
            srcDoc={liveHTML}
            sandbox="allow-scripts"
            className="h-full w-full border-0"
            title="JSX Preview"
          />
        </div>
      </div>
    </div>
  );
}

function CodeIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
      <path
        d="M5 3L1.5 8L5 13"
        stroke="#888"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M11 3L14.5 8L11 13"
        stroke="#888"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PreviewIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
      <rect
        x="1.5"
        y="2.5"
        width="13"
        height="11"
        rx="1.5"
        stroke="#888"
        strokeWidth="1.3"
      />
      <path d="M1.5 5.5H14.5" stroke="#888" strokeWidth="1.3" />
      <circle cx="3.5" cy="4" r="0.5" fill="#888" />
      <circle cx="5.5" cy="4" r="0.5" fill="#888" />
      <circle cx="7.5" cy="4" r="0.5" fill="#888" />
    </svg>
  );
}
