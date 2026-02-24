"use client";

import { useEffect, useState } from "react";

interface JiraIssue {
  key: string;
  summary: string;
  status: string;
  assignee: string;
  priority: string;
}

interface JiraData {
  sprint: { name: string; startDate: string; endDate: string };
  issues: JiraIssue[];
}

interface GitHubData {
  repo: { stars: number; openIssues: number; openPRs: number } | null;
  recentCommits: {
    sha: string;
    message: string;
    date: string;
    author: string;
  }[];
}

interface Project {
  name: string;
  hasJira: boolean;
  hasGitHub: boolean;
  jira: JiraData | null;
  github: GitHubData | null;
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeProject, setActiveProject] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/projects")
      .then((r) => r.json())
      .then((data) => {
        setProjects(data.projects || []);
        if (data.projects?.length > 0) {
          setActiveProject(data.projects[0].name);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const current = projects.find((p) => p.name === activeProject);

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-5rem)] items-center justify-center text-sm text-[#555]">
        Chargement des projets...
      </div>
    );
  }

  return (
    <div className="grid gap-6">
      {/* Project tabs */}
      <div className="flex gap-1 rounded-lg border border-white/[0.06] bg-white/[0.02] p-1">
        {projects.map((p) => (
          <button
            key={p.name}
            onClick={() => setActiveProject(p.name)}
            className={`rounded-md px-4 py-2 text-[13px] font-medium transition-colors ${
              activeProject === p.name
                ? "bg-white/[0.08] text-white"
                : "text-[#888] hover:text-white"
            }`}
          >
            {p.name}
          </button>
        ))}
      </div>

      {current && (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Jira Sprint */}
          <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-5">
            <div className="mb-4 flex items-center gap-2">
              <JiraIcon />
              <h2 className="text-sm font-medium text-white">Jira Sprint</h2>
              {!current.hasJira && (
                <span className="rounded bg-white/[0.06] px-2 py-0.5 text-[10px] text-[#666]">
                  Non configuré
                </span>
              )}
            </div>

            {current.jira ? (
              <>
                <div className="mb-3 rounded-md border border-white/[0.04] bg-white/[0.02] px-3 py-2">
                  <p className="text-[13px] font-medium text-[#ccc]">
                    {current.jira.sprint.name}
                  </p>
                  <p className="mt-0.5 text-xs text-[#555]">
                    {new Date(current.jira.sprint.startDate).toLocaleDateString("fr-FR")} —{" "}
                    {new Date(current.jira.sprint.endDate).toLocaleDateString("fr-FR")}
                  </p>
                </div>
                <div className="space-y-1.5">
                  {current.jira.issues.map((issue) => (
                    <div
                      key={issue.key}
                      className="flex items-center gap-3 rounded-md border border-white/[0.04] bg-white/[0.02] px-3 py-2"
                    >
                      <JiraStatusDot status={issue.status} />
                      <span className="shrink-0 font-mono text-[11px] text-indigo-400">
                        {issue.key}
                      </span>
                      <span className="min-w-0 flex-1 truncate text-[13px] text-[#ccc]">
                        {issue.summary}
                      </span>
                      <span className="shrink-0 text-xs text-[#555]">
                        {issue.assignee}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            ) : current.hasJira ? (
              <p className="text-sm text-[#555]">
                Configurez les credentials Jira dans credentials.json pour afficher le sprint actif.
              </p>
            ) : (
              <p className="text-sm text-[#555]">
                Aucune configuration Jira pour ce projet.
              </p>
            )}
          </div>

          {/* GitHub */}
          <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-5">
            <div className="mb-4 flex items-center gap-2">
              <GitHubIcon />
              <h2 className="text-sm font-medium text-white">GitHub</h2>
              {!current.hasGitHub && (
                <span className="rounded bg-white/[0.06] px-2 py-0.5 text-[10px] text-[#666]">
                  Non configuré
                </span>
              )}
            </div>

            {current.github?.repo && (
              <div className="mb-3 flex gap-4 rounded-md border border-white/[0.04] bg-white/[0.02] px-3 py-2">
                <div className="text-center">
                  <p className="text-lg font-semibold tabular-nums text-white">
                    {current.github.repo.stars}
                  </p>
                  <p className="text-[10px] text-[#555]">Stars</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-semibold tabular-nums text-white">
                    {current.github.repo.openIssues}
                  </p>
                  <p className="text-[10px] text-[#555]">Issues</p>
                </div>
              </div>
            )}

            {current.github?.recentCommits &&
            current.github.recentCommits.length > 0 ? (
              <div className="space-y-1.5">
                <p className="mb-2 text-xs font-medium text-[#555]">
                  Commits récents
                </p>
                {current.github.recentCommits.map((commit) => (
                  <div
                    key={commit.sha}
                    className="flex items-center gap-3 rounded-md border border-white/[0.04] bg-white/[0.02] px-3 py-2"
                  >
                    <span className="shrink-0 font-mono text-[11px] text-emerald-400">
                      {commit.sha}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-[13px] text-[#ccc]">
                      {commit.message}
                    </span>
                    <span className="shrink-0 text-xs text-[#555]">
                      {commit.author}
                    </span>
                  </div>
                ))}
              </div>
            ) : current.hasGitHub ? (
              <p className="text-sm text-[#555]">
                Aucun commit trouvé ou repo privé sans token.
              </p>
            ) : (
              <p className="text-sm text-[#555]">
                Aucune configuration GitHub pour ce projet.
              </p>
            )}
          </div>
        </div>
      )}

      {projects.length === 0 && (
        <div className="flex h-40 items-center justify-center rounded-lg border border-white/[0.06] bg-white/[0.02] text-sm text-[#555]">
          Aucun projet configuré dans projects.json
        </div>
      )}
    </div>
  );
}

function JiraStatusDot({ status }: { status: string }) {
  const lower = status.toLowerCase();
  let color = "bg-[#555]";
  if (lower.includes("done") || lower.includes("terminé")) color = "bg-emerald-500";
  else if (lower.includes("progress") || lower.includes("cours")) color = "bg-blue-500";
  else if (lower.includes("review")) color = "bg-amber-500";
  return <div className={`h-2 w-2 shrink-0 rounded-full ${color}`} />;
}

function JiraIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path
        d="M14.4 7.6L8.4 1.6L8 1.2L3.6 5.6L1.6 7.6C1.4 7.8 1.4 8.2 1.6 8.4L6 12.8L8 14.8L12.4 10.4L12.5 10.3L14.4 8.4C14.6 8.2 14.6 7.8 14.4 7.6ZM8 10.4L5.6 8L8 5.6L10.4 8L8 10.4Z"
        fill="#2684FF"
      />
    </svg>
  );
}

function GitHubIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" className="text-[#ccc]">
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
    </svg>
  );
}
