import { writeFileSync, mkdirSync, readFileSync, existsSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
const SRC = "/home/zhangshuang/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src";
const HERE = new URL(".", import.meta.url).pathname;
function finish(status, why) {
  const ts = new Date(Date.now() + 8 * 3600 * 1000).toISOString().replace(/[-:TZ]/g, "").slice(0, 14);
  writeFileSync(HERE + "stdout.log", JSON.stringify({ status, why, executedAt: ts }, null, 1));
}
import * as mm from "/home/zhangshuang/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src/mcp-config-merge.mjs";
import * as mb from "/home/zhangshuang/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src/mcp-config-backup.mjs";
const cmdR = mm.mergeCommandStyle({}, { mcpPath: "/x/server.mjs", era: "v1" });
const fileR = mm.mergeMcpServersFile({}, { mcpPath: "/x/server.mjs" });
const entry = { command: "node", args: ["node", "/x/server.mjs", "--custom"], env: { MY_VAR: "1" } };
const delta = mm.extractUserDelta(entry, "args");
const applied = mm.applyUserDelta({ command: "node", args: ["node", "/x/server.mjs"] }, delta, "args", "v1");
const cmdOk = cmdR.entry && Array.isArray(cmdR.entry.command) && cmdR.entry.command.includes("node");
const fileOk = fileR.config && fileR.config.mcpServers && fileR.config.mcpServers["huaweicloud-devkit"];
const roundtrip = applied.args && applied.args.includes("--custom");
const ok = cmdOk && fileOk && roundtrip;
finish(ok ? "PASS" : "FAIL", "cmdEntry=" + JSON.stringify(cmdR.entry) + " delta=" + JSON.stringify(delta) + " appliedArgs=" + JSON.stringify(applied.args));
