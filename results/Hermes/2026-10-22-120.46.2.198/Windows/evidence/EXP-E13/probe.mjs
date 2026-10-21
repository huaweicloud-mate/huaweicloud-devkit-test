// probe-EXP-E13.mjs — D10-3 serviceCatalog 路由评测
// 使用 mcp-client-stub 连接 mcp-server，调 huaweicloud_service_catalog(intent=中文意图)
// 源码级断言: serviceCatalog 中文意图命中期望服务 (harness 实测基线 21.4% MISS，未命中即判 FAIL)
import { McpClientStub } from '../../huaweicloud-devkit-test/eval/harness/mock/mcp-client-stub.mjs';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const serverPath = join(__dirname, '..', '..', '..', 'plugins', 'huaweicloud-core', 'src', 'mcp-server.mjs');
const evalCsv = join(__dirname, '..', '..', '..', '..', 'huaweicloud-devkit-test', 'eval', 'prompts', 'eval-set-v1.csv');

const EXPECT = {
  'EXP-E01': ['ECS'], 'EXP-E02': ['ECS'], 'EXP-E03': ['OBS'], 'EXP-E04': ['EIP'],
  'EXP-E05': ['RDS'], 'EXP-E06': ['DCS'], 'EXP-E07': ['CBR'], 'EXP-E08': null,
  'EXP-E09': ['CCE'], 'EXP-E10': ['FunctionGraph'], 'EXP-E11': ['BSS'], 'EXP-E12': ['CES'],
  'EXP-E13': ['ELB'], 'EXP-E14': ['IAM'], 'EXP-E15': ['Incentive Voucher'],
};

const CASE_ID = 'EXP-E13';
const PROMPT = '申请HTTPS证书并配置到我的域名';

const raw = readFileSync(evalCsv, 'utf-8').replace(/^\uFEFF/, '');
const lines = raw.trim().split(/\r?\n/);
const header = lines[0].split(',');
const rows = lines.slice(1).map((l) => {
  const v = l.split(',');
  const o = {};
  header.forEach((h, i) => (o[h.trim()] = (v[i] || '').trim()));
  return o;
});

const client = new McpClientStub({ name: 'eval-harness', version: '1.0' });
await client.connect(serverPath);
await new Promise((r) => setTimeout(r, 500));
await client.initialize();

const resp = await client.toolsCall('huaweicloud_service_catalog', { intent: PROMPT });
const text = resp?.result?.content?.[0]?.text || '';
let rr = {};
try { rr = text ? JSON.parse(text) : {}; } catch { rr = {}; }
const svcs = rr.recommendedServices || [];
const expect = EXPECT[CASE_ID];
let verdict;
if (expect === null) {
  verdict = 'N/A';
} else {
  verdict = expect.some((s) => svcs.includes(s)) ? 'HIT' : 'MISS';
}

const result = {
  caseId: CASE_ID,
  prompt: PROMPT,
  expectedServices: (expect || []).join('/') || '(诊断)',
  actualServices: svcs.join('+') || '(空)',
  verdict,
  status: expect === null ? 'PASS' : (verdict === 'HIT' ? 'PASS' : 'FAIL'),
  why: verdict === 'MISS' ? `serviceCatalog 未命中期望服务: expected ${expect.join('/')}, got ${svcs.join('+')}` : '',
  executedAt: '20261018054000',
};
console.log(JSON.stringify(result, null, 2));
await client.disconnect();
process.exit(0);
