// AI生成
// D10-3: Service catalog routing accuracy + confusion matrix
import { writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const EVID = 'C:/Users/Administrator/devkit-test/OfficeAce/huaweicloud-devkit-test/results/OfficeAce/2026-09-21-188.239.14.150/Windows/evidence';
const HDK = 'C:/Users/Administrator/devkit-test/OfficeAce/hdk';

const results = {};

function save(id, data) {
  const dir = join(EVID, id);
  if (!existsSync(dir)) mkdirSync(dir, {recursive:true});
  writeFileSync(join(dir, 'evidence.json'), JSON.stringify(data, null, 2), 'utf8');
}

async function d10_3() {
  const ev = { caseId: 'D10-3', title: '路由准确率+混淆矩阵', steps: [], verdict: 'PASS', summary: '' };
  try {
    // Import tools.mjs to get serviceCatalog function
    const toolsPath = `file://${HDK}/plugins/huaweicloud-core/src/tools.mjs`;
    const tools = await import(toolsPath);
    
    // Find serviceCatalog - it might not be exported, so we need to call it via the tool handler
    // Let's use the MCP server to call huaweicloud_service_catalog
    const { spawn } = await import('node:child_process');
    const MCP_SERVER = `${HDK}/plugins/huaweicloud-core/src/mcp-server.mjs`;
    const p = spawn('node', [MCP_SERVER], {
      stdio: ['pipe', 'pipe', 'pipe'],
      env: { ...process.env, HUAWEICLOUD_HOME: 'C:/Users/Administrator/devkit-test/.hc_test' },
    });
    p.stderr.on('data', () => {});
    
    function send(msg) { const j = JSON.stringify(msg); p.stdin.write(`Content-Length: ${Buffer.byteLength(j)}\r\n\r\n${j}`); }
    function wait(id, timeout=15000) {
      return new Promise((ok, fail) => {
        let buf = Buffer.alloc(0); let done = false;
        const timer = setTimeout(() => { if (!done) { done = true; fail(new Error('timeout')); } }, timeout);
        const handler = (chunk) => {
          buf = Buffer.concat([buf, chunk]);
          while (true) {
            const he = buf.indexOf('\r\n\r\n');
            if (he === -1) break;
            const hdr = buf.subarray(0, he).toString();
            const m = hdr.match(/Content-Length:\s*(\d+)/i);
            if (!m) { buf = buf.subarray(he + 4); continue; }
            const len = Number(m[1]); const bs = he + 4, be = bs + len;
            if (buf.length < be) break;
            const body = buf.subarray(bs, be).toString(); buf = buf.subarray(be);
            try { const r = JSON.parse(body); if (r.id === id && !done) { done = true; clearTimeout(timer); p.stdout.off('data', handler); ok(r); return; } } catch {}
            continue;
          }
        };
        p.stdout.on('data', handler);
      });
    }
    
    // Initialize
    send({ jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2024-11-05' } });
    await wait(1);
    
    // Test cases: intent → expected service (for confusion matrix)
    const testIntents = [
      // English intents
      { intent: 'deploy ecs server', expectService: 'ECS', lang: 'en' },
      { intent: 'create vpc and subnet', expectService: 'VPC', lang: 'en' },
      { intent: 'upload file to obs bucket', expectService: 'OBS', lang: 'en' },
      { intent: 'create functiongraph function', expectService: 'FunctionGraph', lang: 'en' },
      { intent: 'create cce kubernetes cluster', expectService: 'CCE', lang: 'en' },
      { intent: 'create rds mysql database', expectService: 'RDS', lang: 'en' },
      { intent: 'manage iam user permissions', expectService: 'IAM', lang: 'en' },
      { intent: 'encrypt data with kms', expectService: 'KMS', lang: 'en' },
      { intent: 'train model on modelarts', expectService: 'ModelArts', lang: 'en' },
      { intent: 'check billing cost', expectService: 'BSS', lang: 'en' },
      // Chinese intents
      { intent: '创建ECS云服务器', expectService: 'ECS', lang: 'zh' },
      { intent: '配置VPC和子网', expectService: 'VPC', lang: 'zh' },
      { intent: '上传文件到OBS桶', expectService: 'OBS', lang: 'zh' },
      { intent: '创建RDS MySQL数据库', expectService: 'RDS', lang: 'zh' },
      { intent: '管理IAM用户权限', expectService: 'IAM', lang: 'zh' },
      { intent: '查看账单费用', expectService: 'BSS', lang: 'zh' },
      { intent: '领代金券', expectService: 'Incentive Voucher', lang: 'zh' },
      { intent: '部署网站', expectService: 'Sandbox', lang: 'zh' },
    ];
    
    const routingResults = [];
    let correct = 0, total = 0;
    
    for (let i = 0; i < testIntents.length; i++) {
      const tc = testIntents[i];
      const id = i + 100;
      send({ jsonrpc: '2.0', id, method: 'tools/call', params: { name: 'huaweicloud_service_catalog', arguments: { intent: tc.intent } } });
      const r = await wait(id, 15000);
      const content = r.result?.content?.[0]?.text || '';
      let parsed;
      try { parsed = JSON.parse(content); } catch { parsed = { recommendedServices: [] }; }
      
      const routedServices = parsed.recommendedServices || [];
      const isCorrect = routedServices.includes(tc.expectService);
      if (isCorrect) correct++;
      total++;
      
      routingResults.push({
        intent: tc.intent,
        lang: tc.lang,
        expected: tc.expectService,
        routed: routedServices,
        correct: isCorrect,
      });
    }
    
    // Kill server
    try { p.stdin.end(); } catch {} try { p.kill(); } catch {}
    
    const accuracy = correct / total;
    ev.steps.push({ check: 'routing accuracy', correct, total, accuracy: accuracy.toFixed(4), pass: accuracy >= 0.9 });
    
    // Generate confusion matrix (simplified)
    const services = [...new Set(testIntents.map(t => t.expectService))];
    const matrix = {};
    for (const expected of services) {
      matrix[expected] = {};
      for (const actual of services) {
        matrix[expected][actual] = routingResults.filter(r => r.expected === expected && r.routed.includes(actual)).length;
      }
    }
    ev.steps.push({ check: 'confusion matrix generated', services: services.length, pass: true });
    ev.confusionMatrix = matrix;
    ev.routingResults = routingResults;
    
    // Check Chinese and English both work
    const enCorrect = routingResults.filter(r => r.lang === 'en' && r.correct).length;
    const enTotal = routingResults.filter(r => r.lang === 'en').length;
    const zhCorrect = routingResults.filter(r => r.lang === 'zh' && r.correct).length;
    const zhTotal = routingResults.filter(r => r.lang === 'zh').length;
    ev.steps.push({ check: 'English routing', correct: enCorrect, total: enTotal, pass: enCorrect / enTotal >= 0.9 });
    ev.steps.push({ check: 'Chinese routing', correct: zhCorrect, total: zhTotal, pass: zhCorrect / zhTotal >= 0.9 });
    
    ev.verdict = ev.steps.every(s => s.pass) ? 'PASS' : 'FAIL';
    ev.summary = `accuracy=${correct}/${total}=${(accuracy*100).toFixed(1)}%, en=${enCorrect}/${enTotal}, zh=${zhCorrect}/${zhTotal}`;
  } catch (e) {
    ev.verdict = 'FAIL'; ev.error = e.message;
    ev.steps.push({ check: 'execution', pass: false, error: e.message });
  }
  save('D10-3', ev); results['D10-3'] = ev;
  console.log(`[D10-3] ${ev.verdict} - ${ev.summary || ev.error}`);
}

async function main() {
  await d10_3();
  console.log('\n=== Summary ===');
  for (const [id, r] of Object.entries(results)) console.log(`  ${id}: ${r.verdict}`);
  process.exit(0);
}
main().catch(e => { console.error(e); process.exit(1); });
