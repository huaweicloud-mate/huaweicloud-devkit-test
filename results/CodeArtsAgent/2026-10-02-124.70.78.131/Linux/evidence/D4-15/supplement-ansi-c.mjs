import { pathToFileURL } from 'node:url';
const SRC = process.argv[2];
const { classifyTextCommand } = await import(pathToFileURL(SRC + '/safety-policy.mjs').href);
const v = ["hcloud $(echo $'E\\x43S DeleteServer') --id x", "hcloud $(echo ECS DeleteServer) --id x"];
for (const c of v) {
  const r = classifyTextCommand(c);
  console.log(`$ ${c}\n   decision=${r.decision} risk=${r.risk}`);
}
