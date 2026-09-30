// EXP-E01 中文意图「云主机」路由核对（来源 D10-3 eval harness）
import { serviceCatalog } from 'file:///home/testbot3/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src/tools.mjs';
const r = await serviceCatalog({ intent: "帮我查一下我账号在华北北京四有哪些云主机" });
console.log("EXP-E01:", JSON.stringify(r).slice(0, 300));
console.log("FAIL(check): 期望 ECS，实际 Run hcloud --help（routeMap 缺「云主机」）");
