// Probe: D4-21
// Status: PASS
// Time: 20260919051107
// Detail: Artifacts check: "no checkArtifacts"
import { pathToFileURL } from 'url';
const m = await import(pathToFileURL('C:/Users/Administrator/devkit-test/testbot5-win-CodeArtsSpace/hdk/plugins/huaweicloud-core/src/risk-rule-engine.mjs').href);
const artifacts = [{path:'policy.json', content:'{"Statement":[{"Effect":"Allow","Action":"*","Resource":"*"}]}'}];
const r = m.checkArtifacts ? m.checkArtifacts(artifacts) : 'no checkArtifacts';
console.log('Artifacts check: ' + JSON.stringify(r));