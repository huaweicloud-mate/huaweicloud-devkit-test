import { pathToFileURL } from 'node:url';
const SRC = process.argv[2];
const { classifyTextCommand } = await import(pathToFileURL(SRC + '/safety-policy.mjs').href);
for (const c of ['hcloud kms DecryptData --ciphertext xyz','hcloud kms DecryptData --key-id 1 --ciphertext x','hcloud kms CreateDatakey --key-id 1']) {
  const r = classifyTextCommand(c);
  console.log(`$ ${c}\n   decision=${r.decision} risk=${r.risk}`);
}
