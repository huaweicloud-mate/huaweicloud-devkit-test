// D8-4 引导步骤可机械执行（CodeArtsAgent Linux 每日回归）
import { readFileSync } from 'node:fs';
const HDK = '/home/testbot2/devkit-test/testbot2-Linux-CodeArts CLI/hdk';
const inst = readFileSync(HDK + '/INSTALL.md', 'utf8');
const readme = readFileSync(HDK + '/README.zh-CN.md', 'utf8');
const hasNpm = /(npm |npx |node |hcloud |pip )/i.test(inst);
const hasCode = inst.indexOf('```') > -1;
const steps = (inst.match(/^\d+\.\s+/gm) || []).length + (inst.match(/^(-|\*) /gm) || []).length;
console.log('INSTALL.md 可执行命令:', hasNpm, '代码块:', hasCode, '步骤数:', steps);
console.log('README.zh-CN.md 快速开始含命令:', /(npm |npx |node |hcloud )/i.test(readme));
console.log('结论:', (hasNpm && hasCode) ? 'PASS' : 'FAIL');
