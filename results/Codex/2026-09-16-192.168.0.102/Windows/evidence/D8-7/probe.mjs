import { pathToFileURL } from "node:url";
import { join } from "node:path";
import { writeFileSync, mkdirSync } from "node:fs";

const source = process.env.HDK_SOURCE;
const out = process.env.HDK_EVIDENCE_DIR;
const { callTool } = await import(
  pathToFileURL(join(source, "plugins", "huaweicloud-core", "src", "tools.mjs")).href,
);
const names = [
  "huaweicloud-api-and-sdk",
  "huaweicloud-capability-discovery",
  "huaweicloud-cli-and-auth",
  "huaweicloud-core",
  "huaweicloud-safety",
  "huaweicloud-troubleshooting",
  "huawei-obs",
];
const results = [];
for (const name of names) {
  const result = await callTool("huaweicloud_retrieve_skill", { name });
  results.push({ name, ok: result?.ok === true, hasContent: Boolean(result?.content), error: result?.error || null });
}
mkdirSync(out, { recursive: true });
writeFileSync(join(out, "stdout.json"), JSON.stringify({ results }, null, 2));
console.log(JSON.stringify({ pass: results.filter((r) => r.ok && r.hasContent).length, total: results.length, results }, null, 2));
