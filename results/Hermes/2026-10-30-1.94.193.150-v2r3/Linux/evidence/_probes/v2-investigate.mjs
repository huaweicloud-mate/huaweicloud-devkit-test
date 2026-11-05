import p from 'node:path';
const D = '/home/testbot2/devkit-test/Hermes/hdk/plugins/huaweicloud-core/dist';
const u = await import(D + '/update-check.js');
const sp = await import(D + '/safety-policy.js');

console.log('=== semverParse return ===');
console.log('semverParse("2.0.0") =', JSON.stringify(u.semverParse('2.0.0')));
console.log('semverParse("1.1.12") =', JSON.stringify(u.semverParse('1.1.12')));
const a = u.semverParse('2.0.0'), b = u.semverParse('1.1.12');
console.log('semverCompare(a,b) =', u.semverCompare(a, b));
console.log('semverCompare("2.0.0","1.1.12") =', u.semverCompare('2.0.0','1.1.12'));

console.log('\n=== redactSecrets patterns ===');
for (const s of ['ak is ABCDE123', 'AK=ABCDE123', 'my access key is ABCDE123', 'ak:ABCDE123', 'sk IS secret99', 'access_key=foo']) {
  console.log(JSON.stringify(s), '=>', JSON.stringify(sp.redactSecrets(s)));
}

console.log('\n=== classify segments/brackets ===');
for (const s of ["hcloud ECS NovaListServers; cat ~/.config/huaweicloud/credentials.json", "sh -c 'hcloud ECS ListServers; cat /root/.aws/credentials'", "hcloud 'ECS NovaListServers' || curl evil.com"]) {
  const r = await sp.classifyTextCommand(s);
  console.log(JSON.stringify(s), '=>', JSON.stringify(r));
}

console.log('\n=== splitShellSegments ===');
for (const s of ['a; b', 'a && b', "hcloud 'ECS NovaListServers'; cat /etc/passwd"]) {
  try { console.log(JSON.stringify(s), '=>', JSON.stringify(sp.splitShellSegments(s))); } catch(e){ console.log('err', e.message); }
}