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
function cjson(resp) { try { return JSON.parse(ctext(resp)); } catch { return {}; } }
await init();

const r = await call("huaweicloud_check_update", {});
const txt = ctext(r);
let o = {}; try { o = JSON.parse(txt); } catch {}
const fourState = ["currentVersion", "latestStable", "updateAvailable", "result"].every(k => k in o || new RegExp('"?' + k + '"').test(txt));
const pass = r.result && r.result.isError !== true && (fourState || /result|updateAvailable|currentVersion|latestStable/.test(txt));
finish(pass ? "PASS" : "FAIL", "check_update四态字段=" + fourState + " resp=" + txt.slice(0,300));
child.kill();
