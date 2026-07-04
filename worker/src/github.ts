import type { Env, ReportRow } from './types';

// Promotion only, targets the public main repo.

export async function createIssue(
  env: Env,
  row: ReportRow,
  overrides: { title?: string; body?: string; labels?: string[] },
): Promise<string> {
  const res = await fetch(`https://api.github.com/repos/${env.GITHUB_OWNER}/${env.GITHUB_REPO}/issues`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.GITHUB_TOKEN}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': env.PRODUCT_NAME || 'Sluice',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      title: (overrides.title || row.summary).slice(0, 240),
      body: overrides.body || buildPublicIssueBody(row),
      // No default labels: sending a label the repo doesn't have is a 422.
      // The triage UI can pass known-existing labels here.
      labels: overrides.labels ?? [],
    }),
  });
  if (!res.ok) {
    throw new Error(`github ${res.status}: ${await res.text()}`);
  }
  const data = (await res.json()) as { html_url: string };
  return data.html_url;
}

/**
 * Public-safe issue body. Deliberately excludes the reporter's email and any
 * raw metadata dump (the repo may be public) — only the description, app/OS
 * versions, and an anonymous reference id. Edit in the triage UI before
 * promoting if you want to include more.
 */
export function buildPublicIssueBody(row: ReportRow): string {
  const lines: string[] = [row.description, ''];
  if (row.app_version) lines.push(`**App:** ${row.app_version}`);
  if (row.os_version) lines.push(`**OS:** ${row.os_version}`);
  lines.push('', `<sub>Filed from the in-app reporter · ref \`${row.id}\`</sub>`);
  return lines.join('\n');
}
