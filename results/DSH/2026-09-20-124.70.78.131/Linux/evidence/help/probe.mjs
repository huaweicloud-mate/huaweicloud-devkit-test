import { spawnSync } from 'node:child_process';
const BIN = '/home/testbot2/nodejs/bin/huaweicloud-devkit';
let PASS=0,FAIL=0;const A=(id,l,c,d='')=>{const ok=!!c;ok?PASS++:FAIL++;console.log(`[${ok?'PASS':'FAIL'}] ${id} ${l}${d?' | '+d:''}`);};
for (const args of [['--help'], ['help']]) {
  const r = spawnSync(BIN, args, { encoding:'utf8', timeout:60000 });
  const out = (r.stdout||'')+(r.stderr||'');
  console.log(`\n=== ${BIN} ${args.join(' ')} exit=${r.status} ===`);
  console.log(out.slice(0,600));
  const hasHelp = /usage|help|command|install|doctor|status|auth|proxy|upgrade|命令|用法/i.test(out) && out.trim().length>30;
  const notTodo = !/TODO|not implemented/i.test(out);
  A('D1-69', `${args.join(' ')} 输出帮助文本且非 TODO`, r.status===0 && hasHelp && notTodo);
}
console.log(`\n=== 汇总: PASS=${PASS} FAIL=${FAIL} ===`);
process.exit(FAIL?1:0);
