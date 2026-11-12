import { spawnSync } from "node:child_process";
const r = spawnSync("node", ["eval/harness/run-eval.mjs","C:\\Users\\Administrator\\devkit-test\\Codex\\hdk\\plugins\\huaweicloud-core\\dist\\mcp-server.js"], { cwd: "C:\\Users\\Administrator\\devkit-test\\Codex\\huaweicloud-devkit-test", encoding: "utf8", shell: true });
console.log(JSON.stringify({ status: r.status === 0 ? "PASS" : "FAIL", exitCode: r.status, stdout: r.stdout, stderr: r.stderr }));
