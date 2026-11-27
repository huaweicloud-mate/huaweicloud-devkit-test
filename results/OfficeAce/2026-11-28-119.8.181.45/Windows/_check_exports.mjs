// Check exports of all modules the runner imports (hdk dist, ESM)
const SRC = 'file:///C:/Users/Administrator/devkit-test/OfficeAce/hdk/plugins/huaweicloud-core/dist/';
const mods = ['safety-policy.js','update-check.js','tools.js','mcp-protocol.js','detect-framework.js','risk-rule-engine.js','preflight.js','icon-library.js','koocli-version.js','mcp-config-backup.js','mcp-config-merge.js','setup-cli.js','auth/credentials.js','auth/guidance.js','auth/service.js','sandbox/session-manager.js','proxy/proxy-config.js','hcloud-cli.js'];
for (const m of mods) {
  try {
    const mod = await import(SRC + m);
    console.log(m, '=> OK', Object.keys(mod).slice(0, 8).join(','));
  } catch (e) {
    console.log(m, '=> ERR', e.message.slice(0, 120));
  }
}
