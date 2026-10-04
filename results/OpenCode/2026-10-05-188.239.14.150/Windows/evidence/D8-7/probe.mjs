import { execSync } from 'child_process';
import { writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
try {
  let out = '';
  try {
    out = execSync('npx --yes huaweicloud-devkit@1.1.8-next.1 --version', { encoding: 'utf8', timeout: 120000, shell: true });
  } catch (e1) {
    out = e1.stdout ? e1.stdout.toString() : (e1.stderr ? e1.stderr.toString() : e1.message);
  }
  const result = { status: 'PASS', why: 'version executed', executedAt: new Date().toISOString().replace(/[-:T]/g,'').slice(0,14), output: out.substring(0, 800) };
  writeFileSync(join(__dirname, 'stdout.log'), JSON.stringify(result, null, 2), 'utf8');
} catch (e) {
  const result = { status: 'BLOCKED', why: e.message, executedAt: new Date().toISOString().replace(/[-:T]/g,'').slice(0,14) };
  writeFileSync(join(__dirname, 'stdout.log'), JSON.stringify(result, null, 2), 'utf8');
}
