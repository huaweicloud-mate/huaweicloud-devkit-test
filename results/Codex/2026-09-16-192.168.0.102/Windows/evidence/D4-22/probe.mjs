import { pathToFileURL } from "node:url";
import { writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const root = process.env.HDK_SOURCE;
const out = process.env.HDK_EVIDENCE_DIR;
if (!root || !out) throw new Error("HDK_SOURCE and HDK_EVIDENCE_DIR are required");
mkdirSync(out, { recursive: true });
const url = (p) => pathToFileURL(join(root, ...p.split("/"))).href;
const { classifyTextCommand, redactSecrets } = await import(url("plugins/huaweicloud-core/src/safety-policy.mjs"));
const { evaluateCommandRisk, evaluateArtifacts, evaluateDeployPlan } = await import(
  url("plugins/huaweicloud-core/src/risk-rule-engine.mjs"),
);
const { callTool } = await import(url("plugins/huaweicloud-core/src/tools.mjs"));

const cases = [
  ["D4-1 credential file", classifyTextCommand("type C:\\Users\\x\\.huaweicloud\\credentials.json").decision, "deny"],
  ["D4-2 env secret", classifyTextCommand("echo $HW_SECRET_KEY").decision, "deny"],
  ["D4-2 printenv secret", classifyTextCommand("printenv HW_ACCESS_KEY").decision, "deny"],
  ["D4-3 secret API", classifyTextCommand("hcloud DEW ShowSecretVersion --secret_id=x").decision, "deny"],
  ["D4-15 encoded delete", classifyTextCommand("hcloud ECS DeleteServer --server_id=x").decision, "deny"],
  ["D4-16 shell wrapper", classifyTextCommand("cmd /c hcloud ECS DeleteServer --server_id=x").decision, "deny"],
  ["D4-9 public deploy", evaluateDeployPlan({ action: "deploy", public: true, service: "FunctionGraph" }).decision, "deny"],
  ["D4-21 broad IAM", evaluateArtifacts([{ path: "policy.json", content: '{"Version":"1","Statement":[{"Effect":"Allow","Action":"*","Resource":"*"}]}' }]).decision, "deny"],
  ["redact AK", redactSecrets("AK=abc123456789 SK=secret-value"), "AK=<redacted> SK=<redacted>"],
];
const results = cases.map(([name, actual, expected]) => ({ name, actual, expected, pass: actual === expected }));
const services = ["ECS", "VPC", "OBS", "RDS", "GaussDB", "CCE", "FunctionGraph", "IAM", "CTS", "CES", "DDS", "DCS", "SMN", "DMS", "WAF", "CDN", "ModelArts", "DEW", "CBR", "EVS", "EIP", "ELB"];
const planning = [];
for (const service of services) {
  try {
    const result = await callTool("huaweicloud_list_operations", { service, timeoutMs: 5000 });
    planning.push({ service, ok: Boolean(result?.result?.ok), command: result?.command || result?.result?.command, result });
  } catch (error) {
    planning.push({ service, ok: false, error: error.message });
  }
}
const framework = await callTool("huaweicloud_detect_framework", { projectPath: root }).catch((error) => ({ error: error.message }));
const payload = { generatedAt: new Date().toISOString(), security: results, planning, framework };
writeFileSync(join(out, "stdout.json"), JSON.stringify(payload, null, 2));
console.log(JSON.stringify({
  securityPass: results.filter((r) => r.pass).length,
  securityTotal: results.length,
  planningPass: planning.filter((r) => r.ok).length,
  planningTotal: planning.length,
  framework,
}, null, 2));
