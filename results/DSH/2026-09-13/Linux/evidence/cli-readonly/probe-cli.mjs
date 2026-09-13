// DSH/Linux daily test probe — CLI black-box (doctor/status/install-hcloud/version/auth/proxy)
const { spawnSync } = await import('node:child_process');
const results = [];
function run(args, timeout = 30000) {
  const r = spawnSync('huaweicloud-devkit', args, { encoding: 'utf8', timeout, env: { ...process.env, PATH: `${process.env.HOME}/nodejs/bin:${process.env.HOME}/bin:${process.env.PATH}` } });
  return { code: r.status, out: (r.stdout || '').trim(), err: (r.stderr || '').trim() };
}
function check(caseId, name, pass, actual) {
  results.push({ caseId, name, pass: !!pass, actual: String(actual).slice(0, 300) });
}

// ============ D1-3 doctor 健康自检 ============
const doctor = run(['doctor']);
check('D1-3', 'doctor exits 0', doctor.code === 0, `code=${doctor.code}`);
check('D1-3', 'doctor prints self-check output', /hcloud|MCP|skill|auth|proxy|node/i.test(doctor.out + doctor.err), (doctor.out + doctor.err).slice(0, 120));

// ============ D1-4 status ============
const status = run(['status']);
check('D1-4', 'status exits 0', status.code === 0, `code=${status.code}`);
check('D1-4', 'status prints install state', status.out.length > 0, status.out.slice(0, 120));

// ============ D1-6 install-hcloud ============
const ih = run(['install-hcloud']);
check('D1-6', 'install-hcloud exits 0', ih.code === 0, `code=${ih.code}`);
check('D1-6', 'install-hcloud prints KooCLI guidance', /hcloud|KooCLI|curl|install|choco|wget/i.test(ih.out + ih.err), (ih.out + ih.err).slice(0, 120));

// ============ version ============
const ver = run(['version']);
check('D1-version', 'version exits 0 and prints version', ver.code === 0 && /HuaweiCloud DevKit|\d+\.\d+\.\d+/.test(ver.out), ver.out.slice(0, 120));
const ver2 = run(['--version']);
check('D1-version', '--version flag works', ver2.code === 0 && /\d+\.\d+\.\d+/.test(ver2.out), ver2.out.slice(0, 120));

// ============ help ============
const help = run(['--help']);
check('D1-help', 'help exits 0 and lists commands', help.code === 0 && /install|doctor|auth|status/i.test(help.out), help.out.slice(0, 80));

// ============ auth status (D2 read-only) ============
const auth = run(['auth', 'status']);
check('D2-auth', 'auth status exits 0', auth.code === 0, `code=${auth.code}`);
check('D2-auth', 'auth status output non-empty', (auth.out + auth.err).length > 0, (auth.out + auth.err).slice(0, 120));

// ============ proxy show ============
const proxy = run(['proxy', 'show']);
check('D1-proxy', 'proxy show exits 0', proxy.code === 0, `code=${proxy.code}`);

const failed = results.filter(r => !r.pass);
console.log('=== CLI PROBE RESULTS ===');
console.log(`total=${results.length} pass=${results.length - failed.length} fail=${failed.length}`);
for (const r of results) {
  console.log(`${r.pass ? 'PASS' : 'FAIL'}  ${r.caseId}  ${r.name}  => ${r.actual}`);
}
if (failed.length) {
  console.log('\nFAILED CASES:');
  for (const r of failed) console.log(`  ${r.caseId} ${r.name}`);
  process.exit(1);
}
console.log('\nALL CLI ASSERTIONS PASSED');
