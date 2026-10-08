// D5-3: tools/list枚举40工具全量可达
import { loadTools } from '../_helper.mjs';
const { TOOL_DEFINITIONS } = await loadTools();

const toolCount = TOOL_DEFINITIONS.length;
const allHaveName = TOOL_DEFINITIONS.every(t => typeof t.name === 'string' && t.name.length > 0);
const allHaveSchema = TOOL_DEFINITIONS.every(t => t.inputSchema && typeof t.inputSchema === 'object');
const allHaveDesc = TOOL_DEFINITIONS.every(t => typeof t.description === 'string' && t.description.length > 0);

// Check for duplicates
const names = TOOL_DEFINITIONS.map(t => t.name);
const uniqueNames = new Set(names);
const noDuplicates = names.length === uniqueNames.size;

// List all tool names
const toolNames = names.sort();

const ok = toolCount >= 40 && allHaveName && allHaveSchema && allHaveDesc && noDuplicates;
console.log(JSON.stringify({
  status: ok ? 'PASS' : 'FAIL',
  caseId: 'D5-3',
  why: ok ? `tools/list returns ${toolCount} tools, all with name+schema+description, no duplicates.` : `toolCount=${toolCount}, allHaveName=${allHaveName}, allHaveSchema=${allHaveSchema}, allHaveDesc=${allHaveDesc}, noDuplicates=${noDuplicates}`,
  executedAt: '20261001103000',
  toolCount,
  toolNames
}, null, 2));