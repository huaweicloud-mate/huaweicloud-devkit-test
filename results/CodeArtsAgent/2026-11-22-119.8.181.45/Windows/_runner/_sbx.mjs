import { mcpTool, VC_QUOTE } from "./lib.mjs";
const r = await mcpTool("huaweicloud_sandbox_check_user", {}, 60000);
console.log(JSON.stringify({ ok: r.ok, text: (r.text||"").slice(0,400) }));
