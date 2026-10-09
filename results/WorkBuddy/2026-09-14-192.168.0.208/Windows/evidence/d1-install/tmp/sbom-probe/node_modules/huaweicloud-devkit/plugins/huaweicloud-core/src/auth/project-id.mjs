import { existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

function hcloudCommand(args) {
  const bin = process.env.HCLOUD_BIN || 'hcloud';
  // Test doubles (and exotic setups) may point HCLOUD_BIN at a Node script;
  // those must be launched through node instead of the shell.
  if (/\.(mjs|cjs|js)$/i.test(bin) && existsSync(bin)) {
    return { file: process.execPath, args: [bin, ...args] };
  }
  return { file: bin, args };
}

function runHcloud(args, timeoutMs = 20000) {
  const { file, args: spawnArgs } = hcloudCommand(args);
  return spawnSync(file, spawnArgs, {
    windowsHide: true,
    stdio: 'pipe',
    timeout: timeoutMs,
  });
}

/**
 * Resolve the project_id for `region` via IAM KeystoneListProjects using the
 * credentials already stored in the KooCLI profile, then write it back with
 * `hcloud configure set --cli-project-id=<id>`. Read-only discovery + local
 * config write only - no secrets appear in process arguments because the
 * profile carries the credentials.
 *
 * Best-effort by design: any failure returns { ok: false, reason } and never
 * throws, so callers can stay non-fatal.
 */
export function resolveAndApplyProjectId({ region, profile } = {}) {
  if (!region) return { ok: false, reason: 'region is required' };
  const profileArgs = profile ? [`--cli-profile=${profile}`] : [];
  try {
    const list = runHcloud([
      'IAM',
      'KeystoneListProjects',
      ...profileArgs,
      `--cli-region=${region}`,
      `--name=${region}`,
    ]);
    if (list.status !== 0) {
      return { ok: false, reason: `KeystoneListProjects failed (exit ${list.status})` };
    }
    let projects = null;
    try {
      const parsed = JSON.parse(String(list.stdout || ''));
      projects = Array.isArray(parsed?.projects) ? parsed.projects : Array.isArray(parsed) ? parsed : null;
    } catch {
      return { ok: false, reason: 'could not parse KeystoneListProjects output' };
    }
    if (!projects || projects.length === 0) {
      return { ok: false, reason: `no projects found for region ${region}` };
    }
    const match = projects.find((p) => p && p.name === region && p.id) || projects.find((p) => p && p.id);
    if (!match) return { ok: false, reason: 'project list contained no usable ids' };

    const set = runHcloud(['configure', 'set', ...profileArgs, `--cli-project-id=${match.id}`]);
    if (set.status !== 0) {
      return { ok: false, reason: `configure set --cli-project-id failed (exit ${set.status})` };
    }
    return { ok: true, projectId: match.id };
  } catch (error) {
    return { ok: false, reason: error.message };
  }
}
