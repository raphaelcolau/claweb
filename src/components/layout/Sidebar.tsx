"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { label: "Dashboard", href: "/", icon: DashboardIcon },
  { label: "Emails", href: "/emails", icon: EmailIcon },
  { label: "Projets", href: "/projets", icon: ProjectIcon },
  { label: "Agents", href: "/agents", icon: AgentIcon },
  { label: "Renderer", href: "/renderer", icon: RendererIcon },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-56 flex-col border-r border-white/[0.06] bg-[#0a0a0a]">
      <div className="flex h-14 items-center gap-2.5 px-5">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/10">
          <span className="text-sm font-bold text-white">C</span>
        </div>
        <span className="text-[15px] font-semibold tracking-tight text-white">
          ClaWeb
        </span>
      </div>

      <nav className="flex flex-1 flex-col gap-0.5 px-2.5 pt-2">
        {NAV_ITEMS.map(({ label, href, icon: Icon }) => {
          const isActive =
            href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`group flex items-center gap-2.5 rounded-md px-2.5 py-[7px] text-[13px] font-medium transition-colors ${
                isActive
                  ? "bg-white/[0.08] text-white"
                  : "text-[#888] hover:bg-white/[0.04] hover:text-white"
              }`}
            >
              <Icon active={isActive} />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-white/[0.06] p-4">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-emerald-500" />
          <span className="text-xs text-[#888]">OpenClaw actif</span>
        </div>
      </div>
    </aside>
  );
}

function DashboardIcon({ active }: { active: boolean }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <rect
        x="1.5"
        y="1.5"
        width="5"
        height="5"
        rx="1"
        stroke={active ? "#fff" : "#666"}
        strokeWidth="1.3"
      />
      <rect
        x="9.5"
        y="1.5"
        width="5"
        height="5"
        rx="1"
        stroke={active ? "#fff" : "#666"}
        strokeWidth="1.3"
      />
      <rect
        x="1.5"
        y="9.5"
        width="5"
        height="5"
        rx="1"
        stroke={active ? "#fff" : "#666"}
        strokeWidth="1.3"
      />
      <rect
        x="9.5"
        y="9.5"
        width="5"
        height="5"
        rx="1"
        stroke={active ? "#fff" : "#666"}
        strokeWidth="1.3"
      />
    </svg>
  );
}

function EmailIcon({ active }: { active: boolean }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <rect
        x="1.5"
        y="3"
        width="13"
        height="10"
        rx="1.5"
        stroke={active ? "#fff" : "#666"}
        strokeWidth="1.3"
      />
      <path
        d="M1.5 5L8 9.5L14.5 5"
        stroke={active ? "#fff" : "#666"}
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ProjectIcon({ active }: { active: boolean }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path
        d="M2 3.5C2 2.67 2.67 2 3.5 2H6L7.5 4H12.5C13.33 4 14 4.67 14 5.5V12.5C14 13.33 13.33 14 12.5 14H3.5C2.67 14 2 13.33 2 12.5V3.5Z"
        stroke={active ? "#fff" : "#666"}
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function AgentIcon({ active }: { active: boolean }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <rect
        x="2"
        y="2"
        width="12"
        height="10"
        rx="1.5"
        stroke={active ? "#fff" : "#666"}
        strokeWidth="1.3"
      />
      <path
        d="M5 14H11"
        stroke={active ? "#fff" : "#666"}
        strokeWidth="1.3"
        strokeLinecap="round"
      />
      <path
        d="M8 12V14"
        stroke={active ? "#fff" : "#666"}
        strokeWidth="1.3"
        strokeLinecap="round"
      />
      <path
        d="M5 6H7"
        stroke={active ? "#fff" : "#666"}
        strokeWidth="1.3"
        strokeLinecap="round"
      />
      <path
        d="M5 8.5H10"
        stroke={active ? "#fff" : "#666"}
        strokeWidth="1.3"
        strokeLinecap="round"
      />
    </svg>
  );
}

function RendererIcon({ active }: { active: boolean }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path
        d="M5 3L1.5 8L5 13"
        stroke={active ? "#fff" : "#666"}
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M11 3L14.5 8L11 13"
        stroke={active ? "#fff" : "#666"}
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M9 2L7 14"
        stroke={active ? "#fff" : "#666"}
        strokeWidth="1.3"
        strokeLinecap="round"
      />
    </svg>
  );
}
