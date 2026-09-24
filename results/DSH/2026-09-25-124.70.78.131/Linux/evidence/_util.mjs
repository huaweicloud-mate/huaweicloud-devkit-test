// shared util for daily probes — writes evidence/<case-id>/stdout.log (JSON) per case
import { writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

export const CORE = 'file:///home/testbot2/nodejs/lib/node_modules/huaweicloud-devkit/plugins/huaweicloud-core/src';
export const SUT = '/home/testbot2/nodejs/lib/node_modules/huaweicloud-devkit';
export const HKDSRC = '/home/testbot2/multica_workspaces/vector-8988c3df7bc9/task-b7f47c8efe93/workdir/devkit-test/DSH/hdk';
export const EV = fileURLToPath(new URL('.', import.meta.url)); // evidence dir (ends with /)

const store = new Map();

export function add(id, name, pass, actual) {
  if (!store.has(id)) store.set(id, { checks: [], status: null, why: '' });
  store.get(id).checks.push({ name, pass: !!pass, actual: fmt(actual) });
}

export function setStatus(id, status, why) {
  if (!store.has(id)) store.set(id, { checks: [], status: null, why: '' });
  const e = store.get(id);
  e.status = status; e.why = why;
}

export function tsNow() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`;
}

export function flush() {
  let pass = 0, fail = 0, other = 0;
  for (const [id, e] of store) {
    const dir = EV + id;
    mkdirSync(dir, { recursive: true });
    let status = e.status;
    let why = e.why;
    if (!status) {
      const fails = e.checks.filter((c) => !c.pass);
      status = fails.length ? 'FAIL' : 'PASS';
      if (fails.length) why = fails.map((f) => f.name).join('; ');
    }
    if (status === 'PASS') pass++; else if (status === 'FAIL') fail++; else other++;
    const obj = { status };
    if (why) obj.why = why;
    obj.executedAt = tsNow();
    writeFileSync(dir + '/stdout.log', JSON.stringify(obj));
    const detail = e.checks.map((c) => `[${c.pass ? 'PASS' : 'FAIL'}] ${id} ${c.name} => ${c.actual}`).join('\n');
    if (detail) writeFileSync(dir + '/detail.log', detail);
  }
  console.log(`[flush] ${store.size} cases: PASS=${pass} FAIL=${fail} OTHER=${other}`);
}

function fmt(a) {
  if (typeof a === 'string') return a;
  try { return JSON.stringify(a); } catch { return String(a); }
}