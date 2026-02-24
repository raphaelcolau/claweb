"use client";

import { usePathname } from "next/navigation";

const PAGE_TITLES: Record<string, string> = {
  "/": "Dashboard",
  "/emails": "Emails",
  "/projets": "Projets",
  "/agents": "Agents & tmux",
  "/renderer": "Renderer JSX",
};

function getPageTitle(pathname: string): string {
  if (PAGE_TITLES[pathname]) return PAGE_TITLES[pathname];
  for (const [prefix, title] of Object.entries(PAGE_TITLES)) {
    if (prefix !== "/" && pathname.startsWith(prefix)) return title;
  }
  return "ClaWeb";
}

export default function Header() {
  const pathname = usePathname();
  const title = getPageTitle(pathname);

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-white/[0.06] bg-[#0a0a0a]/80 px-6 backdrop-blur-xl">
      <h1 className="text-[15px] font-semibold text-white">{title}</h1>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 rounded-md border border-white/[0.06] bg-white/[0.03] px-3 py-1.5">
          <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.6)]" />
          <span className="text-xs text-[#999]">Système OK</span>
        </div>

        <div className="flex items-center gap-2 rounded-md border border-white/[0.06] bg-white/[0.03] px-3 py-1.5">
          <ClockIcon />
          <span className="text-xs tabular-nums text-[#999]">
            <CurrentTime />
          </span>
        </div>

        <button className="flex h-8 w-8 items-center justify-center rounded-md border border-white/[0.06] text-[#666] transition-colors hover:bg-white/[0.04] hover:text-white">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path
              d="M8 3.5V5M8 11V12.5M3.5 8H5M11 8H12.5M4.88 4.88L5.94 5.94M10.06 10.06L11.12 11.12M4.88 11.12L5.94 10.06M10.06 5.94L11.12 4.88"
              stroke="currentColor"
              strokeWidth="1.3"
              strokeLinecap="round"
            />
            <circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.3" />
          </svg>
        </button>
      </div>
    </header>
  );
}

function CurrentTime() {
  return (
    <time suppressHydrationWarning>
      {new Date().toLocaleTimeString("fr-FR", {
        hour: "2-digit",
        minute: "2-digit",
      })}
    </time>
  );
}

function ClockIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
      <circle cx="6" cy="6" r="4.5" stroke="#666" strokeWidth="1.2" />
      <path
        d="M6 3.5V6L7.5 7.5"
        stroke="#666"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
