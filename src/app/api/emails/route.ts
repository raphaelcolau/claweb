import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const EMAILS_DIR =
  process.env.EMAILS_DIR ||
  path.join(process.env.HOME || "/home/rcolau", ".openclaw/workspace/scripts/emails");

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

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const accountFilter = searchParams.get("account");

  try {
    if (!fs.existsSync(EMAILS_DIR)) {
      return NextResponse.json({ accounts: [], emails: [] });
    }

    const accountDirs = fs
      .readdirSync(EMAILS_DIR, { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .map((d) => d.name);

    const allEmails: Email[] = [];

    for (const account of accountDirs) {
      if (accountFilter && account !== accountFilter) continue;

      const accountPath = path.join(EMAILS_DIR, account);
      const jsonFiles = fs
        .readdirSync(accountPath)
        .filter((f) => f.endsWith(".json"));

      for (const file of jsonFiles) {
        const filePath = path.join(accountPath, file);
        const raw = fs.readFileSync(filePath, "utf-8");
        const emails = JSON.parse(raw);

        if (Array.isArray(emails)) {
          for (const email of emails) {
            allEmails.push({ ...email, account });
          }
        }
      }
    }

    allEmails.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    return NextResponse.json({ accounts: accountDirs, emails: allEmails });
  } catch (error) {
    console.error("Error reading emails:", error);
    return NextResponse.json(
      { error: "Failed to read emails" },
      { status: 500 }
    );
  }
}
