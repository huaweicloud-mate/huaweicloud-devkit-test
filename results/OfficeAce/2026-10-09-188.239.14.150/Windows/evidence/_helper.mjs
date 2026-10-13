// Shared helper: absolute path to hdk source
export const HDK_SRC = 'file:///C:/Users/Administrator/devkit-test/OfficeAce/hdk/plugins/huaweicloud-core/src';
export async function loadSafety() {
  return await import(`${HDK_SRC}/safety-policy.mjs`);
}
export async function loadTools() {
  return await import(`${HDK_SRC}/tools.mjs`);
}
export async function loadMcpProtocol() {
  return await import(`${HDK_SRC}/mcp-protocol.mjs`);
}
export async function loadUpdateCheck() {
  return await import(`${HDK_SRC}/update-check.mjs`);
}
export async function loadDetectFramework() {
  return await import(`${HDK_SRC}/detect-framework.mjs`);
}
export async function loadMcpConfigMerge() {
  return await import(`${HDK_SRC}/mcp-config-merge.mjs`);
}
export async function loadAuth() {
  return await import(`${HDK_SRC}/auth/service.mjs`);
}
export async function loadRiskEngine() {
  return await import(`${HDK_SRC}/risk-rule-engine.mjs`);
}