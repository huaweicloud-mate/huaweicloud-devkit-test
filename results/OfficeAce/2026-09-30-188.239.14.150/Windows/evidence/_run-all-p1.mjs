// Wrapper: run all probes and write stdout.log for each
import { execFileSync } from 'node:child_process';
import { writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const NODE = 'C:\\Users\\Administrator\\AppData\\Local\\Programs\\OfficeAce\\tools\\node\\node.exe';
const EVID = 'C:\\Users\\Administrator\\devkit-test\\OfficeAce\\huaweicloud-devkit-test\\results\\OfficeAce\\2026-09-30-188.239.14.150\\Windows\\evidence';
const cases = ['D1-3','D1-26','D1-27','D1-28','D1-31','D1-41','D1-42','D1-45','D1-70','D2-12','D2-16','D4-20','D2-1','D2-5','D2-26'];

for (const c of cases) {
  const probePath = join(EVID, c, 'probe.mjs');
  const logPath = join(EVID, c, 'stdout.log');
  if (!existsSync(probePath)) {
    console.log(`${c}: probe.mjs NOT FOUND`);
    continue;
  }
  try {
    const stdout = execFileSync(NODE, [probePath], { encoding: 'utf8', timeout: 120000, maxBuffer: 10 * 1024 * 1024 });
    writeFileSync(logPath, stdout, 'utf8');
    // Parse to get status
    try {
      const parsed = JSON.parse(stdout);
      console.log(`${c}: ${parsed.status} - ${parsed.why?.slice(0, 80)}`);
    } catch {
      console.log(`${c}: written ${stdout.length} bytes (unparseable)`);
    }
  } catch (error) {
    const errOut = error.stdout || error.message || String(error);
    writeFileSync(logPath, errOut, 'utf8');
    console.log(`${c}: ERROR - ${error.message?.slice(0, 80)}`);
  }
}
console.log('\nALL DONE');