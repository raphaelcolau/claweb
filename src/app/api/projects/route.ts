import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const WORKSPACE =
  process.env.WORKSPACE_PATH ||
  path.join(process.env.HOME || "/home/rcolau", ".openclaw/workspace");

const BASE_DIR = process.env.OPENCLAW_DIR || path.join(WORKSPACE, "scripts");

interface JiraConfig {
  host: string;
  projectKey: string;
  boardId: number;
}

interface GitHubConfig {
  owner: string;
  repo: string;
  projectNumber: number | null;
}

interface ProjectConfig {
  name: string;
  jira: JiraConfig | null;
  github: GitHubConfig | null;
}

interface Credentials {
  jira: { email: string; apiToken: string };
  github: { token: string };
}

function loadConfig(): { projects: ProjectConfig[]; credentials: Credentials } {
  const projectsPath = path.join(BASE_DIR, "projects.json");
  const credentialsPath = path.join(BASE_DIR, "credentials.json");

  const projects: ProjectConfig[] = fs.existsSync(projectsPath)
    ? JSON.parse(fs.readFileSync(projectsPath, "utf-8"))
    : [];

  const credentials: Credentials = fs.existsSync(credentialsPath)
    ? JSON.parse(fs.readFileSync(credentialsPath, "utf-8"))
    : { jira: { email: "", apiToken: "" }, github: { token: "" } };

  return { projects, credentials };
}

async function fetchJiraSprint(jira: JiraConfig, creds: Credentials["jira"]) {
  if (!creds.email || !creds.apiToken) return null;

  const auth = Buffer.from(`${creds.email}:${creds.apiToken}`).toString("base64");
  const headers = {
    Authorization: `Basic ${auth}`,
    Accept: "application/json",
  };

  try {
    const sprintRes = await fetch(
      `https://${jira.host}/rest/agile/1.0/board/${jira.boardId}/sprint?state=active`,
      { headers }
    );
    if (!sprintRes.ok) return null;
    const sprintData = await sprintRes.json();
    const activeSprint = sprintData.values?.[0];
    if (!activeSprint) return null;

    const issuesRes = await fetch(
      `https://${jira.host}/rest/agile/1.0/sprint/${activeSprint.id}/issue?maxResults=50`,
      { headers }
    );
    if (!issuesRes.ok) return { sprint: activeSprint, issues: [] };
    const issuesData = await issuesRes.json();

    const issues = (issuesData.issues || []).map(
      (issue: {
        key: string;
        fields: {
          summary: string;
          status: { name: string };
          assignee: { displayName: string } | null;
          priority: { name: string };
        };
      }) => ({
        key: issue.key,
        summary: issue.fields.summary,
        status: issue.fields.status.name,
        assignee: issue.fields.assignee?.displayName || "Non assigné",
        priority: issue.fields.priority.name,
      })
    );

    return { sprint: activeSprint, issues };
  } catch {
    return null;
  }
}

async function fetchGitHubData(gh: GitHubConfig, token: string) {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github.v3+json",
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const result: {
    repo: { stars: number; openIssues: number; openPRs: number } | null;
    recentCommits: { sha: string; message: string; date: string; author: string }[];
  } = { repo: null, recentCommits: [] };

  try {
    const repoRes = await fetch(
      `https://api.github.com/repos/${gh.owner}/${gh.repo}`,
      { headers }
    );
    if (repoRes.ok) {
      const repo = await repoRes.json();
      result.repo = {
        stars: repo.stargazers_count,
        openIssues: repo.open_issues_count,
        openPRs: 0,
      };
    }

    const commitsRes = await fetch(
      `https://api.github.com/repos/${gh.owner}/${gh.repo}/commits?per_page=5`,
      { headers }
    );
    if (commitsRes.ok) {
      const commits = await commitsRes.json();
      result.recentCommits = commits.map(
        (c: {
          sha: string;
          commit: {
            message: string;
            author: { date: string; name: string };
          };
        }) => ({
          sha: c.sha.slice(0, 7),
          message: c.commit.message.split("\n")[0],
          date: c.commit.author.date,
          author: c.commit.author.name,
        })
      );
    }
  } catch {
    /* ignore fetch errors */
  }

  return result;
}

export async function GET() {
  const { projects, credentials } = loadConfig();

  const results = await Promise.all(
    projects.map(async (project) => {
      const jiraData = project.jira
        ? await fetchJiraSprint(project.jira, credentials.jira)
        : null;

      const githubData = project.github
        ? await fetchGitHubData(project.github, credentials.github.token)
        : null;

      return {
        name: project.name,
        hasJira: !!project.jira,
        hasGitHub: !!project.github,
        jira: jiraData,
        github: githubData,
      };
    })
  );

  return NextResponse.json({ projects: results });
}
