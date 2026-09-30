// D8-6 中英文文档一致性核对（CodeArtsAgent Linux 每日回归）
import { readFileSync } from 'node:fs';
const HDK = '/home/testbot2/devkit-test/CodeArtsAgent/hdk';
const en = readFileSync(HDK + '/README.md', 'utf8');
const zh = readFileSync(HDK + '/README.zh-CN.md', 'utf8');
const heads = (t) => (t.match(/^#{1,3} .+/gm) || []).length;
const verEn = /beta-v[\d.]+/i.exec(en); const verZh = /beta-v[\d.]+/i.exec(zh);
console.log('EN 标题数:', heads(en), 'ZH 标题数:', heads(zh));
console.log('版本声明:', verEn && verEn[0], '/', verZh && verZh[0]);
console.log('结论:', (heads(en) === heads(zh)) ? 'PASS' : 'FAIL');
