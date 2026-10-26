// Source-level probe for D1-40
// Tests judgeUpdate with mirror lag (remote version <= local)
import { judgeUpdate } from 'update-check.mjs';
const r = judgeUpdate('1.1.12', { latest: '1.1.11' }, null);
