/**
 * Parse a GitHub repository URL or shorthand into { username, repo }.
 * Accepts: https://github.com/o/r, github.com/o/r, o/r, git@github.com:o/r.git
 */
export function parseGitHubRepoUrl(input) {
  if (!input?.trim()) return null;

  let value = input.trim();

  const sshMatch = value.match(/^git@github\.com:([\w.-]+)\/([\w.-]+?)(?:\.git)?$/i);
  if (sshMatch) {
    return { username: sshMatch[1], repo: sshMatch[2] };
  }

  if (!/^https?:\/\//i.test(value) && !/github\.com/i.test(value)) {
    const short = value.match(/^([\w.-]+)\/([\w.-]+?)(?:\.git)?(?:\/.*)?$/);
    if (short) {
      return { username: short[1], repo: short[2] };
    }
  }

  if (!/^https?:\/\//i.test(value)) {
    value = `https://${value}`;
  }

  try {
    const parsed = new URL(value);
    const host = parsed.hostname.replace(/^www\./i, '');
    if (host !== 'github.com') return null;

    const parts = parsed.pathname.split('/').filter(Boolean);
    const username = parts[0];
    const repo = parts[1]?.replace(/\.git$/, '');
    if (!username || !repo) return null;

    return { username, repo };
  } catch {
    return null;
  }
}
