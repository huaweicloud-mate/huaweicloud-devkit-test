import { spawn } from "node:child_process";
import { writeFileSync } from "node:fs";
const SERVER = "/home/zhangshuang/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src/mcp-server.mjs";
const HERE = new URL(".", import.meta.url).pathname;
function finish(status, why) {
  const ts = new Date(Date.now() + 8 * 3600 * 1000).toISOString().replace(/[-:TZ]/g, "").slice(0, 14);
  writeFileSync(HERE + "stdout.log", JSON.stringify({ status, why, executedAt: ts }, null, 1));
}
const child = spawn(process.execPath, [SERVER], { stdio: ["pipe","pipe","pipe"], env: { ...process.env, HUAWEICLOUD_AGENT_TOOLKIT_MODE: "local" } });
let buf = Buffer.alloc(0); const pending = new Map(); let _id = 1;
function send(o) { const b = JSON.stringify(o); child.stdin.write(Buffer.from("Content-Length: " + Buffer.byteLength(b) + "\r\n\r\n" + b)); return new Promise((r) => pending.set(o.id, r)); }
child.stdout.on("data", (d) => { buf = Buffer.concat([buf, d]); while (true) { const h = buf.indexOf("\r\n\r\n"); if (h < 0) break; const m = /Content-Length:\s*(\d+)/i.exec(buf.slice(0, h).toString()); if (!m) {{ buf = buf.slice(h + 4); continue; }} const n = +m[1]; if (buf.length < h + 4 + n) break; const body = buf.slice(h + 4, h + 4 + n).toString(); buf = buf.slice(h + 4 + n); try { const msg = JSON.parse(body); if (msg.id && pending.has(msg.id)) { pending.get(msg.id)(msg); pending.delete(msg.id); } } catch {} } });
async function init(params) { return send({ jsonrpc: "2.0", id: _id++, method: "initialize", params: params || { protocolVersion: "2024-11-05", capabilities: {}, clientInfo: { name: "probe", version: "1" } } }); }
async function call(name, args) { return send({ jsonrpc: "2.0", id: _id++, method: "tools/call", params: { name, arguments: args || {} } }); }
function ctext(resp) { try { return resp?.result?.content?.[0]?.text || ""; } catch { return ""; } }
await init();

const CASES = [
  ["EXP-E01", "帮我查一下我账号在华北北京四有哪些云主机", ["ECS"]],
  ["EXP-E02", "创建一台 2C4G 的 Ubuntu 云服务器, 规格通用型", ["ECS"]],
  ["EXP-E03", "把本地 dist 目录部署成一个公网静态网站", ["OBS"]],
  ["EXP-E04", "给这台服务器绑定一个弹性公网IP", ["EIP"]],
  ["EXP-E05", "看一下我的云数据库MySQL实例的状态", ["RDS"]],
  ["EXP-E06", "创建一个 Redis 缓存实例用于会话存储", ["DCS"]],
  ["EXP-E07", "给生产环境的服务器配置一个每日备份策略", ["CBR"]],
  ["EXP-E08", "我的ECS启动失败了, 帮我分析原因", null],
  ["EXP-E09", "开设一个 Kubernetes 集群用于微服务部署", ["CCE"]],
  ["EXP-E10", "部署一个函数处理图片自动压缩", ["FunctionGraph"]],
  ["EXP-E11", "查一下我账号这个月的费用情况", ["BSS"]],
  ["EXP-E12", "把应用日志指标推送到云监控告警", ["CES"]],
  ["EXP-E13", "申请HTTPS证书并配置到我的域名", ["ELB"]],
  ["EXP-E14", "我账号下的用户都有哪些权限, 帮我审计一下", ["IAM"]],
  ["EXP-E15", "帮我领一下华为云的代金券", ["Incentive Voucher"]],
];
let hit = 0, miss = 0, na = 0; const rows = [];
for (const [cid, intent, expect] of CASES) {
  const resp = await call("huaweicloud_service_catalog", { intent });
  let rr = {}; try { rr = JSON.parse(ctext(resp)); } catch {}
  let svcs = rr.recommendedServices || [];
  if (!Array.isArray(svcs)) svcs = [];
  let verdict;
  if (expect === null) { verdict = "N/A"; na++; }
  else { verdict = expect.some(s => svcs.includes(s)) ? "HIT" : "MISS"; verdict === "HIT" ? hit++ : miss++; }
  rows.push(cid + "=" + verdict);
}
const denom = hit + miss;
const acc = denom ? (hit / denom * 100) : 0;
const pass = acc >= 90;
finish(pass ? "PASS" : "FAIL", "准确率=" + acc.toFixed(1) + "% (HIT=" + hit + " MISS=" + miss + " N/A=" + na + ") 阈值>=90% rows=" + rows.join(","));
child.kill();
