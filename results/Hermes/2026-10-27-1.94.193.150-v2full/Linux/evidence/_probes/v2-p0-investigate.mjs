const spmod = await import('/home/testbot2/devkit-test/Hermes/hdk/plugins/huaweicloud-core/dist/safety-policy.js');
const ctc = spmod.classifyTextCommand;

console.log('=== D4-15 case variation (Deleteserver etc.) ===');
for (const s of [
  'hcloud ECS Deleteserver --server-id i-1',       // case variation
  'hcloud ecs deleteservers --server-id i-1',       // lowercase
  'hcloud ECS DeleteServers --server-id i-1',       // canonical
  'hcloud ECS %44elete%53ervers --server-id i-1',   // URL-ish encode
  'echo "hcloud ECS DeleteServers" | bash',         // pipe
]) {
  const r = await ctc(s);
  console.log(JSON.stringify(s), '=>', r.decision, '/', r.risk, '| service=', r.service, 'op=', r.operation);
}

console.log('\n=== D4-16 command wrapping ===');
for (const s of [
  'sh -c "hcloud ECS ListServers; cat ~/.config/huaweicloud/credentials.json"',
  "sh -c 'hcloud ECS ListServers; cat /root/.aws/credentials'",
  'bash -lc "cat ~/.config/huaweicloud/credentials.json"',
  'echo base64 | base64 -d | sh',
]) {
  const r = await ctc(s);
  console.log(JSON.stringify(s), '=>', r.decision, '/', r.risk, '| reason=', (r.reason||'').slice(0,60));
}

console.log('\n=== D4-3 secret API reason ===');
const r3 = await ctc('hcloud iam CreateUser --access-key AK1234567890 --secret-key SECRETKEY01');
console.log(JSON.stringify(r3));

console.log('\n=== D4-2 echo env reason ===');
const r2 = await ctc('echo $HW_ACCESS_KEY $HW_SECRET_KEY');
console.log(JSON.stringify(r2));