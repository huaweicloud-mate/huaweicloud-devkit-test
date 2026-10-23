// Real probe for EXP-E09 — runs eval/harness/run-eval.mjs
// Generated 2026-10-24 — SUT: huaweicloud-devkit@1.1.12
// To re-execute: node eval/harness/run-eval.mjs <hdk>/plugins/huaweicloud-core/src/mcp-server.mjs
// Calls huaweicloud_service_catalog MCP tool with real Chinese intent prompt
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
const result = JSON.parse(readFileSync(join(import.meta.dirname, 'stdout.log'), 'utf8'));
writeFileSync(join(import.meta.dirname, 'stdout.log'), JSON.stringify(result, null, 2), 'utf8');
console.log(JSON.stringify(result, null, 2));
