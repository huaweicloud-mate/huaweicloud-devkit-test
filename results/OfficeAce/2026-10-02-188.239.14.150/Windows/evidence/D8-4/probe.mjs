// D8-4: 配置合并幂等
import { loadMcpConfigMerge } from '../_helper.mjs';
const { mergeMcpServersFile, mergeArgsStyle, mergeCommandStyle } = await loadMcpConfigMerge();

const mcpPath = '/path/to/mcp-server.mjs';
const env = { HCLOUD_BIN: '/usr/local/bin/hcloud', HUAWEICLOUD_AGENT_TOOLKIT_MODE: '1' };

// First merge: creates entry
const r1 = mergeMcpServersFile({}, { mcpPath, env });
// Second merge: should be no-op (idempotent)
const r2 = mergeMcpServersFile(r1.config, { mcpPath, env });
// Third merge: still no-op
const r3 = mergeMcpServersFile(r2.config, { mcpPath, env });

const idempotent = JSON.stringify(r2.entry) === JSON.stringify(r1.entry) && JSON.stringify(r3.entry) === JSON.stringify(r1.entry);
const noChangeAfterFirst = r2.changed === false && r3.changed === false;

const ok = idempotent && noChangeAfterFirst;
console.log(JSON.stringify({
  status: ok ? 'PASS' : 'FAIL',
  caseId: 'D8-4',
  why: ok ? 'Config merge is idempotent: 3 consecutive merges produce identical entries, no changes after first.' : `idempotent=${idempotent}, noChangeAfterFirst=${noChangeAfterFirst}`,
  executedAt: '20261001103000',
  r1Changed: r1.changed,
  r2Changed: r2.changed,
  r3Changed: r3.changed,
  entriesEqual: JSON.stringify(r1.entry) === JSON.stringify(r3.entry)
}, null, 2));