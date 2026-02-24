"use client";

import { useEffect, useState } from "react";

interface Email {
  id: string;
  from: string;
  to: string;
  subject: string;
  date: string;
  body: string;
  read: boolean;
  account: string;
}

export default function EmailsPage() {
  const [emails, setEmails] = useState<Email[]>([]);
  const [accounts, setAccounts] = useState<string[]>([]);
  const [activeAccount, setActiveAccount] = useState<string>("all");
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEmails();
  }, [activeAccount]);

  async function fetchEmails() {
    setLoading(true);
    const params = activeAccount !== "all" ? `?account=${activeAccount}` : "";
    const res = await fetch(`/api/emails${params}`);
    const data = await res.json();
    setAccounts(data.accounts || []);
    setEmails(data.emails || []);
    setLoading(false);
  }

  const unreadCount = emails.filter((e) => !e.read).length;
  const accountUnread = (acc: string) =>
    emails.filter((e) => e.account === acc && !e.read).length;

  function formatDate(iso: string) {
    const d = new Date(iso);
    const now = new Date();
    if (d.toDateString() === now.toDateString()) {
      return d.toLocaleTimeString("fr-FR", {
        hour: "2-digit",
        minute: "2-digit",
      });
    }
    return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
  }

  function accountLabel(name: string) {
    const parts = name.split("-");
    const provider = parts[0]?.toUpperCase() || "";
    const user = parts.slice(1).join("-") || name;
    return { provider, user };
  }

  return (
    <div className="grid h-[calc(100vh-5rem)] grid-cols-1 gap-4 lg:grid-cols-[280px_1fr]">
      {/* Sidebar - Account filters */}
      <div className="flex flex-col gap-2 overflow-y-auto rounded-lg border border-white/[0.06] bg-white/[0.02] p-3">
        <h2 className="mb-1 px-2 text-xs font-medium uppercase tracking-wider text-[#555]">
          Comptes
        </h2>
        <button
          onClick={() => {
            setActiveAccount("all");
            setSelectedEmail(null);
          }}
          className={`flex items-center justify-between rounded-md px-3 py-2 text-left text-[13px] transition-colors ${
            activeAccount === "all"
              ? "bg-white/[0.08] text-white"
              : "text-[#888] hover:bg-white/[0.04] hover:text-white"
          }`}
        >
          <span>Tous les comptes</span>
          {unreadCount > 0 && <UnreadBadge count={unreadCount} />}
        </button>
        {accounts.map((acc) => {
          const { provider, user } = accountLabel(acc);
          const count = accountUnread(acc);
          return (
            <button
              key={acc}
              onClick={() => {
                setActiveAccount(acc);
                setSelectedEmail(null);
              }}
              className={`flex items-center justify-between rounded-md px-3 py-2 text-left text-[13px] transition-colors ${
                activeAccount === acc
                  ? "bg-white/[0.08] text-white"
                  : "text-[#888] hover:bg-white/[0.04] hover:text-white"
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="rounded bg-white/[0.06] px-1.5 py-0.5 text-[10px] font-semibold text-[#666]">
                  {provider}
                </span>
                <span>{user}</span>
              </div>
              {count > 0 && <UnreadBadge count={count} />}
            </button>
          );
        })}
      </div>

      {/* Main content */}
      <div className="flex h-full flex-col overflow-hidden rounded-lg border border-white/[0.06] bg-white/[0.02]">
        {loading ? (
          <div className="flex flex-1 items-center justify-center text-sm text-[#555]">
            Chargement...
          </div>
        ) : selectedEmail ? (
          /* Email detail view */
          <div className="flex flex-1 flex-col overflow-hidden">
            <div className="flex items-center gap-3 border-b border-white/[0.06] px-5 py-3">
              <button
                onClick={() => setSelectedEmail(null)}
                className="rounded-md px-2 py-1 text-xs text-[#888] transition-colors hover:bg-white/[0.06] hover:text-white"
              >
                &larr; Retour
              </button>
              <span className="rounded bg-white/[0.06] px-1.5 py-0.5 text-[10px] font-semibold text-[#666]">
                {accountLabel(selectedEmail.account).provider}
              </span>
            </div>
            <div className="flex-1 overflow-y-auto p-5">
              <h2 className="mb-3 text-lg font-semibold text-white">
                {selectedEmail.subject}
              </h2>
              <div className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#888]">
                <span>
                  De : <span className="text-[#ccc]">{selectedEmail.from}</span>
                </span>
                <span>
                  À : <span className="text-[#ccc]">{selectedEmail.to}</span>
                </span>
                <span>{new Date(selectedEmail.date).toLocaleString("fr-FR")}</span>
              </div>
              <div className="whitespace-pre-wrap rounded-md border border-white/[0.04] bg-white/[0.02] p-4 font-mono text-[13px] leading-relaxed text-[#ccc]">
                {selectedEmail.body}
              </div>
            </div>
          </div>
        ) : (
          /* Email list */
          <div className="flex-1 overflow-y-auto">
            {emails.length === 0 ? (
              <div className="flex h-full items-center justify-center text-sm text-[#555]">
                Aucun email
              </div>
            ) : (
              emails.map((email) => (
                <button
                  key={email.id}
                  onClick={() => setSelectedEmail(email)}
                  className={`flex w-full items-start gap-3 border-b border-white/[0.04] px-5 py-3.5 text-left transition-colors hover:bg-white/[0.03] ${
                    !email.read ? "bg-white/[0.02]" : ""
                  }`}
                >
                  {!email.read && (
                    <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-indigo-500" />
                  )}
                  <div
                    className={`min-w-0 flex-1 ${email.read ? "pl-5" : ""}`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={`truncate text-[13px] ${
                          email.read
                            ? "font-normal text-[#888]"
                            : "font-semibold text-white"
                        }`}
                      >
                        {email.from.split("<")[0].trim()}
                      </span>
                      <span className="shrink-0 text-xs text-[#555]">
                        {formatDate(email.date)}
                      </span>
                    </div>
                    <p
                      className={`mt-0.5 truncate text-[13px] ${
                        email.read ? "text-[#666]" : "text-[#ccc]"
                      }`}
                    >
                      {email.subject}
                    </p>
                    <p className="mt-0.5 truncate text-xs text-[#555]">
                      {email.body.slice(0, 100)}
                    </p>
                  </div>
                </button>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function UnreadBadge({ count }: { count: number }) {
  return (
    <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-indigo-500/20 px-1.5 text-[11px] font-semibold tabular-nums text-indigo-400">
      {count}
    </span>
  );
}
