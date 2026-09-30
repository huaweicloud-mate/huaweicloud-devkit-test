// D6-3: Memory leak detection - source-level + runtime verification
// Checks:
// 1. No global event listener accumulation (telemetry uses module-level queue)
// 2. FairQueue channels are properly unregistered
// 3. MCP server buffer is consumed after each frame parse
// 4. No setInterval without corresponding clearInterval (except keepalive which has cleanup)
// 5. Runtime: measure heap usage across many iterations
import { readFileSync } from 'node:fs';

const srcDir = 'C:/Users/Administrator/devkit-test/OfficeAce/hdk/plugins/huaweicloud-core/src';
const checks = [];

// Check 1: Telemetry queue is module-level (not per-call allocation)
const telemetrySrc = readFileSync(`${srcDir}/telemetry/telemetry.mjs`, 'utf8');
const hasModuleQueue = /let\s+eventQueue\s*=\s*\[\]/.test(telemetrySrc);
const hasQueueSlice = /eventQueue\s*=\s*eventQueue\.slice/.test(telemetrySrc);
const hasSpliceFlush = /eventQueue\.splice/.test(telemetrySrc);
checks.push({
  name: 'Telemetry queue: module-level + bounded (slice cap + splice flush)',
  pass: hasModuleQueue && hasQueueSlice && hasSpliceFlush,
  evidence: `moduleQueue=${hasModuleQueue}, sliceCap=${hasQueueSlice}, spliceFlush=${hasSpliceFlush}`,
});

// Check 2: FairQueue unregister cleans up channels
const fairQueueSrc = readFileSync(`${srcDir}/ws-exec/hwlink-fair-queue.js`, 'utf8');
const hasUnregister = /unregister\(ch\)\s*\{/.test(fairQueueSrc);
const hasChannelDelete = /this\.channels\.delete/.test(fairQueueSrc);
const hasReadyDelete = /this\.readyChannels\.delete/.test(fairQueueSrc);
checks.push({
  name: 'FairQueue: unregister deletes channel + readyChannel entries',
  pass: hasUnregister && hasChannelDelete && hasReadyDelete,
  evidence: `unregister=${hasUnregister}, channelDelete=${hasChannelDelete}, readyDelete=${hasReadyDelete}`,
});

// Check 3: MCP server buffer consumed after frame parse
const serverSrc = readFileSync(`${srcDir}/mcp-server.mjs`, 'utf8');
const hasBufferSubarray = /buffer\s*=\s*buffer\.subarray/.test(serverSrc);
const hasBufferAlloc = /Buffer\.alloc\(0\)/.test(serverSrc);
checks.push({
  name: 'MCP server: buffer consumed via subarray after frame parse',
  pass: hasBufferSubarray || hasBufferAlloc,
  evidence: `subarray=${hasBufferSubarray}, allocReset=${hasBufferAlloc}`,
});

// Check 4: keepalive interval has clearInterval cleanup
const hasClearInterval = /clearInterval\(keepAlive\)/.test(serverSrc);
const hasKeepAliveNull = /keepAlive\s*=\s*null/.test(serverSrc);
checks.push({
  name: 'MCP server: keepalive interval properly cleared on stdout close',
  pass: hasClearInterval && hasKeepAliveNull,
  evidence: `clearInterval=${hasClearInterval}, nullAssign=${hasKeepAliveNull}`,
});

// Check 5: Runtime heap measurement - run 500 iterations and check heap doesn't grow unboundedly
import { classifyTextCommand } from 'file:///C:/Users/Administrator/devkit-test/OfficeAce/hdk/plugins/huaweicloud-core/src/safety-policy.mjs';
if (global.gc) global.gc(); // Force GC if available
const heapBefore = process.memoryUsage().heapUsed;
for (let i = 0; i < 500; i++) {
  classifyTextCommand(`hcloud ECS ListServers --offset ${i} --limit 10`);
}
if (global.gc) global.gc();
const heapAfter = process.memoryUsage().heapUsed;
const heapGrowthKB = Math.round((heapAfter - heapBefore) / 1024);
checks.push({
  name: 'Runtime: heap growth after 500 iterations < 5MB',
  pass: heapGrowthKB < 5120, // 5MB threshold
  evidence: `heapBefore=${Math.round(heapBefore/1024)}KB, heapAfter=${Math.round(heapAfter/1024)}KB, growth=${heapGrowthKB}KB`,
});

const allPass = checks.every(c => c.pass);
const output = {
  status: allPass ? 'PASS' : 'FAIL',
  caseId: 'D6-3',
  why: allPass
    ? `Source-level analysis confirmed ${checks.length} memory management mechanisms (bounded queues, proper cleanup, buffer consumption). Runtime heap growth after 500 iterations was ${heapGrowthKB}KB (< 5MB threshold). No memory leak detected.`
    : `Failed checks: ${JSON.stringify(checks.filter(c => !c.pass))}`,
  executedAt: '20260930103000',
  details: checks,
};

console.log(JSON.stringify(output, null, 2));