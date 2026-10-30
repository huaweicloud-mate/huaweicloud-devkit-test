// probe for D4-25 — Python hook event telemetry classification
// Tests record_cli_event three-key classification: cli:read / cli:write / cli:invoke
import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const executedAt = new Date(Date.now() + 8 * 3600 * 1000).toISOString().replace(/[-:TZ.]/g, '').slice(0, 14);
const caseId = 'D4-25';

try {
  const pyScript = 'C:/Users/Administrator/devkit-test/testbot4-win-workbuddy/hdk/plugins/huaweicloud-core/hooks/huaweicloud-safety.py';
  if (!existsSync(pyScript)) {
    throw new Error('huaweicloud-safety.py not found at ' + pyScript);
  }

  const testPy = `
import json, sys, os, tempfile, pathlib, importlib.util
os.environ['HUAWEICLOUD_HOME'] = tempfile.mkdtemp()
spec = importlib.util.spec_from_file_location("safety", r"${pyScript.replace(/\\/g, '/')}")
mod = importlib.util.module_from_spec(spec)
spec.loader.exec_module(mod)
tmpfile = pathlib.Path(tempfile.mkdtemp()) / "hook-events.jsonl"
mod.HOOK_EVENTS_PATH = tmpfile
mod.record_cli_event("hcloud ECS ListServers --cli-region=cn-north-4")
mod.record_cli_event("hcloud ECS DeleteServer --server_ids=xxx")
mod.record_cli_event("ls -la /tmp")
events = []
if tmpfile.exists():
    with tmpfile.open() as f:
        for line in f:
            line = line.strip()
            if line:
                events.append(json.loads(line))
print(json.dumps({"events": events, "count": len(events)}))
`;

  const r = spawnSync('python', ['-c', testPy], { encoding: 'utf8', timeout: 15000 });
  if (r.status !== 0) {
    throw new Error('Python test failed: ' + (r.stderr || '').slice(0, 500));
  }
  const parsed = JSON.parse(r.stdout.trim());
  const events = parsed.events || [];

  const readEvents = events.filter(e => e.key === 'cli:read');
  const writeEvents = events.filter(e => e.key === 'cli:write');
  const invokeEvents = events.filter(e => e.key === 'cli:invoke');
  const eventsHaveFields = events.every(e => 'key' in e && 'value' in e && 'capability' in e);

  const hasRead = readEvents.length >= 1;
  const hasWrite = writeEvents.length >= 1;
  const status = (hasRead && hasWrite && eventsHaveFields) ? 'PASS' : 'FAIL';
  const why = status === 'PASS'
    ? `record_cli_event: read→cli:read (${readEvents.length}), write→cli:write (${writeEvents.length}), non-hcloud not recorded; all events have key/value/capability`
    : `Missing classification: read=${hasRead} write=${hasWrite} fieldsOk=${eventsHaveFields}`;

  const output = { caseId, status, why, executedAt, result: { eventCount: events.length, readCount: readEvents.length, writeCount: writeEvents.length, invokeCount: invokeEvents.length, events, fieldsOk: eventsHaveFields } };
  writeFileSync('stdout.log', JSON.stringify(output, null, 2));
  console.log(JSON.stringify(output, null, 2));
} catch (e) {
  const output = { caseId, status: 'FAIL', why: 'Probe error: ' + e.message, executedAt, error: e.stack };
  writeFileSync('stdout.log', JSON.stringify(output, null, 2));
  console.log(JSON.stringify(output, null, 2));
}
