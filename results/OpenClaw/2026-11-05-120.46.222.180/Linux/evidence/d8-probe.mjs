// D8-7 meta/通用技能指引可机械执行验证（Hermes Linux 每日回归）
// 通过 MCP tools/call huaweicloud_retrieve_skill 逐一加载 7 个 meta 技能，
// 校验：①内容非空 ②含可机械执行的命令/脚本/引用（无断链/占位符）③引用文件真实存在（黑盒→白盒核对）。
import { spawn } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';

const serverPath = process.argv[2];
const pkgRoot = process.argv[3]; // npm 包根目录（用于核对引用文件存在性）

const SKILLS = ['huaweicloud-core', 'huaweicloud-safety', 'huaweicloud-api-and-sdk',
  'huaweicloud-capability-discovery', 'huaweicloud-cli-and-auth',
  'huaweicloud-troubleshooting', 'huawei-getting-started'];

const child = spawn(process.execPath, [serverPath], {
  stdio: ['pipe', 'pipe', 'pipe'],
  env: { ...process.env, HUAWEICLOUD_AGENT_TOOLKIT_MODE: 'local' },
});
let buf = Buffer.alloc(0);
const pending = new Map();
let _id = 1;
function send(o) {
  const b = JSON.stringify(o);
  child.stdin.write(Buffer.from(`Content-Length: ${Buffer.byteLength(b)}\r\n\r\n${b}`));
  return new Promise((r) => pending.set(o.id, r));
}
child.stdout.on('data', (d) => {
  buf = Buffer.concat([buf, d]);
  while (true) {
    const h = buf.indexOf('\r\n\r\n');
    if (h < 0) break;
    const m = /Content-Length:\s*(\d+)/i.exec(buf.slice(0, h).toString());
    if (!m) { buf = buf.slice(h + 4); continue; }
    const n = +m[1];
    if (buf.length < h + 4 + n) break;
    const body = buf.slice(h + 4, h + 4 + n).toString();
    buf = buf.slice(h + 4 + n);
    try { const msg = JSON.parse(body); if (msg.id && pending.has(msg.id)) { pending.get(msg.id)(msg); pending.delete(msg.id); } } catch {}
  }
});

(async () => {
  await send({ jsonrpc: '2.0', id: _id++, method: 'initialize', params: { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'probe', version: '1' } } });
  send({ jsonrpc: '2.0', method: 'notifications/initialized' });

  for (const name of SKILLS) {
    console.log(`=====CASE D8-7-${name}=====`);
    const r = await send({ jsonrpc: '2.0', id: _id++, method: 'tools/call', params: { name: 'huaweicloud_retrieve_skill', arguments: { name } } });
    const txt = r?.result?.content?.[0]?.text || JSON.stringify(r?.error || '');
    const isError = r?.result?.isError;
    console.log(`retrieve_skill(${name}) isError=${isError} contentLen=${txt.length}`);
    console.log('head:', txt.slice(0, 300).replace(/\n/g, ' | '));
    // 是否含占位符/断链提示
    const hasTodo = /<TODO>|TBD|待补充|PLACEHOLDER|not implemented/i.test(txt);
    console.log('含占位符/断链:', hasTodo);
    // 是否含可机械执行的命令/脚本
    const hasCmd = /(hcloud\s+|npm\s+|npx\s+|node\s+|python|pip\s+|scripts?\/|\.mjs\b|\.py\b|\.sh\b)/i.test(txt);
    console.log('含可执行命令/脚本引导:', hasCmd);
    // 引用文件存在性（白盒核对：SKILL.md 存在于包内）
    const skillDir = `${pkgRoot}/plugins/huaweicloud-core/skills/${name}`;
    console.log(`包内 SKILL 目录存在: ${existsSync(`${skillDir}/SKILL.md`)}`);
    console.log(`=====END D8-7-${name}=====`);
  }

  console.log('=== DONE ===');
  child.kill();
  process.exit(0);
})().catch((e) => { console.log('ERR', e.message); child.kill(); process.exit(1); });
setTimeout(() => { console.log('TIMEOUT'); child.kill(); process.exit(1); }, 45000);