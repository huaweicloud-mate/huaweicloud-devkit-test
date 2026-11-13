import { writeFileSync, mkdirSync, readFileSync, existsSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
const SRC = "/home/zhangshuang/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src";
const HERE = new URL(".", import.meta.url).pathname;
function finish(status, why) {
  const ts = new Date(Date.now() + 8 * 3600 * 1000).toISOString().replace(/[-:TZ]/g, "").slice(0, 14);
  writeFileSync(HERE + "stdout.log", JSON.stringify({ status, why, executedAt: ts }, null, 1));
}
import * as df from "/home/zhangshuang/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src/detect-framework.mjs";
const base = join(tmpdir(), "hdk-d3b5-" + process.pid);
mkdirSync(base, { recursive: true });
const next = join(base, "next-app"); mkdirSync(next); writeFileSync(join(next, "next.config.js"), "module.exports={};"); writeFileSync(join(next, "package.json"), JSON.stringify({ dependencies: { next: "14" } }));
const vite = join(base, "vite-app"); mkdirSync(vite); writeFileSync(join(vite, "vite.config.js"), "export default {};"); writeFileSync(join(vite, "package.json"), JSON.stringify({ dependencies: { react: "18" } }));
const stat = join(base, "static-app"); mkdirSync(stat); writeFileSync(join(stat, "index.html"), "<html></html>");
const mono = join(base, "mono"); mkdirSync(mono); writeFileSync(join(mono, "turbo.json"), "{}");
const dNext = df.detectFramework(next);
const dVite = df.detectFramework(vite);
const dStatic = df.detectFramework(stat);
const dMono = df.detectFramework(mono);
const pass = dNext && dNext.framework === "Next.js" && dVite && String(dVite.framework).startsWith("Vite") && dStatic && dMono && dMono.framework === "Monorepo";
finish(pass ? "PASS" : "FAIL", "next=" + (dNext&&dNext.framework) + " vite=" + (dVite&&dVite.framework) + " static=" + (dStatic&&dStatic.framework) + " mono=" + (dMono&&dMono.framework));
