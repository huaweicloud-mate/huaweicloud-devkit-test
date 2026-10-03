// 探针注册表：汇总各维度用例实现
import { P as D1 } from './d1.mjs';
import { P as D2 } from './d2.mjs';
import { P as D3 } from './d3.mjs';
import { P as D4 } from './d4.mjs';
import { P as D56 } from './d5d6.mjs';
import { P as D89 } from './d8d9d10.mjs';
import { P as EXP } from './exp.mjs';

export const PROBES = { ...D1, ...D2, ...D3, ...D4, ...D56, ...D89, ...EXP };
