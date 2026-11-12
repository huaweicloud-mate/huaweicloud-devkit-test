import { spawnSync } from "node:child_process";
const r = spawnSync("npm", ["test"], { cwd: "C:\\Users\\Administrator\\devkit-test\\Codex\\huaweicloud-devkit-test\\..\\hdk", encoding: "utf8", shell: true });
console.log(JSON.stringify({ status: r.status === 0 ? "PASS" : "FAIL", exitCode: r.status, stdout: r.stdout, stderr: r.stderr }));
