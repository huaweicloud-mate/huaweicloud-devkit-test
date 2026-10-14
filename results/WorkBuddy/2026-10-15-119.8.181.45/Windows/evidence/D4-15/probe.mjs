import { classifyTextCommand } from 'file:///C:/Users/Administrator/devkit-test/testbot4-win-workbuddy/hdk/plugins/huaweicloud-core/src/safety-policy.mjs';
import { writeFileSync } from 'node:fs';

const caseId = 'D4-15';
const now = new Date();
const bjTime = new Date(now.getTime() + 8*3600*1000);
const execTs = bjTime.toISOString().replace(/[-:T]/g,'').slice(0,14);

// D4-15: Hook bypass attempts
// Test: case variations, URL encoding, parameter splitting should not bypass
const testCommands = [
  // Case variations
  { cmd: 'hcloud ecs deleteserver --server_ids="xxx"', desc: 'lowercase deleteserver', expected: 'deny' },
  { cmd: 'hcloud ECS DELETESERVER --server_ids="xxx"', desc: 'uppercase DELETESERVER', expected: 'deny' },
  { cmd: 'hcloud EcS DeLeTeSeRvEr --server_ids="xxx"', desc: 'mixed case DeLeTeSeRvEr', expected: 'deny' },
  // URL encoding / escape confusion
  { cmd: 'hcloud ECS Delete%53erver --server_ids="xxx"', desc: 'URL encoded Delete%53erver', expected: 'deny' },
  { cmd: 'hcloud ECS Delete\\x53erver --server_ids="xxx"', desc: 'hex escaped', expected: 'deny' },
  // Parameter splitting / concatenation
  { cmd: 'hcloud ECS Delete' + 'Server --server_ids="xxx"', desc: 'split Delete+Server', expected: 'deny' },
  // Quoted variants
  { cmd: "hcloud 'ECS DeleteServer' --server_ids='xxx'", desc: 'quoted command', expected: 'deny' },
  // Double-dash bypass
  { cmd: 'hcloud ECS --DeleteServer --server_ids="xxx"', desc: 'double-dash prefix', expected: 'deny' },
  // Subcommand abbreviation
  { cmd: 'hcloud ECS del --server_ids="xxx"', desc: 'abbreviated del', expected: 'deny' },
  // Newline injection
  { cmd: 'hcloud ECS ListServers\nhcloud ECS DeleteServer --server_ids="xxx"', desc: 'newline injection', expected: 'deny' },
  // Semicolon separator
  { cmd: 'hcloud ECS ListServers; hcloud ECS DeleteServer --server_ids="xxx"', desc: 'semicolon injection', expected: 'deny' },
  // Pipe separator
  { cmd: 'echo hi | hcloud ECS DeleteServer --server_ids="xxx"', desc: 'pipe injection', expected: 'deny' },
];

let allDenied = true;
const results = [];
for (const { cmd, desc, expected } of testCommands) {
  const result = classifyTextCommand(cmd);
  const matches = result.decision === expected;
  if (!matches) allDenied = false;
  results.push({ desc, decision: result.decision, risk: result.risk, expected, matches });
}

const status = allDenied ? 'PASS' : 'FAIL';
const failedTests = results.filter(r => !r.matches);
const why = allDenied
  ? `All ${testCommands.length} bypass attempts were denied.`
  : `${failedTests.length} bypass attempts succeeded: ${failedTests.map(r => `${r.desc}(got=${r.decision})`).join('; ')}`;

const output = {
  caseId,
  status,
  why,
  executedAt: execTs,
  result: { tests: results }
};

writeFileSync('stdout.log', JSON.stringify(output, null, 2));
console.log(JSON.stringify(output, null, 2));
