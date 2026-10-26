import { pathToFileURL } from 'node:url';
const { evaluateArtifacts } = await import(pathToFileURL(process.argv[2] + '/risk-rule-engine.mjs').href);
const cases = [
  ['json-broad(对照)', { path: 'policy.json', content: '{"Statement":[{"Effect":"Allow","Action":"*","Resource":"*"}]}' }],
  ['hcl-actions-star', { path: 'iam.tf', content: 'resource "huaweicloud_iam_policy" "adm" { name="x" statement { effect="Allow" actions = ["*"] resources=["*"] } }' }],
  ['tf-admin-full-suffix', { path: 'iam.tf', content: 'data "huaweicloud_iam_policy" "r" { name = "AdministratorFullAccess" }' }],
];
for (const [tag, a] of cases) {
  const r = evaluateArtifacts([a]);
  console.log(`[${tag}] decision=${r.decision} findings=${(r.findings||[]).map(f=>f.ruleId+'/'+f.severity).join(',')}`);
  console.log(`   content=${a.content}`);
}
console.log('=== DONE ===');
