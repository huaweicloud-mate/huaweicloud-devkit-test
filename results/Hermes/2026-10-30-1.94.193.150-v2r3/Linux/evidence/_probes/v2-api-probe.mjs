// Discover v2 API surface for probe writing. Import dist modules and inspect.
const D = '/home/testbot2/devkit-test/Hermes/hdk/plugins/huaweicloud-core/dist';

async function tryMod(p) { try { return await import(p); } catch (e) { return { __err: e.message }; } }

const safetyPolicy = await tryMod(D + '/safety-policy.js');
const classifyText = await tryMod(D + '/safety/classify-text.js');
const classifyHcloud = await tryMod(D + '/safety/classify-hcloud.js');
const redact = await tryMod(D + '/safety/redact.js');
const riskEngine = await tryMod(D + '/risk-rule-engine.js');
const updateCheck = await tryMod(D + '/update-check.js');
const tools = await tryMod(D + '/tools.js');
const tooldefs = await tryMod(D + '/tool-definitions.js');

console.log('=== safety-policy keys ===', Object.keys(safetyPolicy).filter(k=>!k.startsWith('__')));
console.log('=== classify-text keys ===', Object.keys(classifyText).filter(k=>!k.startsWith('__')));
console.log('=== classify-hcloud keys ===', Object.keys(classifyHcloud).filter(k=>!k.startsWith('__')));
console.log('=== redact keys ===', Object.keys(redact).filter(k=>!k.startsWith('__')));
console.log('=== risk-engine keys ===', Object.keys(riskEngine).filter(k=>!k.startsWith('__')));
console.log('=== update-check keys ===', Object.keys(updateCheck).filter(k=>!k.startsWith('__')));
console.log('=== tools keys ===', Object.keys(tools).filter(k=>!k.startsWith('__')));
console.log('=== tooldefs keys ===', Object.keys(tooldefs).filter(k=>!k.startsWith('__')));

// Probe classifyTextCommand signature
if (classifyText.classifyTextCommand) {
  console.log('\n=== classifyTextCommand arity ===', classifyText.classifyTextCommand.length);
  try {
    const r1 = await classifyText.classifyTextCommand('hcloud ECS NovaListServers');
    console.log('classifyTextCommand("hcloud ECS NovaListServers") =>', JSON.stringify(r1));
  } catch (e) { console.log('classifyTextCommand err', e.message); }
  try {
    const r2 = await classifyText.classifyTextCommand('cat ~/.config/huaweicloud/credentials.json');
    console.log('classifyTextCommand("cat credentials") =>', JSON.stringify(r2));
  } catch (e) { console.log('classifyTextCommand err2', e.message); }
}

if (redact.redactSecrets) {
  console.log('\n=== redactSecrets arity ===', redact.redactSecrets.length);
  try {
    const r = redact.redactSecrets('AK=ABC123DEF456 secret sk=xyz789', {});
    console.log('redactSecrets sample =>', JSON.stringify(r));
  } catch (e) { console.log('redactSecrets err', e.message); }
}

if (tools.TOOL_DEFINITIONS) {
  console.log('\n=== TOOL_DEFINITIONS count ===', tools.TOOL_DEFINITIONS.length);
  console.log('names:', tools.TOOL_DEFINITIONS.map(t=>t.name).slice(0,60).join(','));
}
if (tooldefs.TOOL_DEFINITIONS) {
  console.log('tooldefs TOOL_DEFINITIONS count ===', tooldefs.TOOL_DEFINITIONS.length);
}