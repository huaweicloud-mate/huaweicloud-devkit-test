// D1-68 区域环境变量优先级（契约核对）
import { resolveCredentials } from 'file:///home/testbot3/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src/auth/credentials.mjs';
const r = resolveCredentials({ allowEnv: true });
// 实测来源：fresh-cli/newcases —— credentials.mjs:133 'HW_REGION || HUAWEICLOUD_REGION'（HW_REGION 优先，与用例契约相反）
console.log("D1-68 region-priority:", JSON.stringify({ region: r && r.region }));
console.log("SPEC-MISMATCH: HUAWEICLOUD_REGION 优先于 HW_REGION 的契约未满足（HW_REGION 胜出）");
