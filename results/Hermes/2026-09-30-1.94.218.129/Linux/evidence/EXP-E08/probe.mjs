// EXP-E08 诊断意图路由核对（来源 D10-3 eval harness）
import { serviceCatalog } from 'file:///home/testbot3/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src/tools.mjs';
const r = await serviceCatalog({ intent: "我的ECS启动失败了 帮我分析原因" });
console.log("EXP-E08:", JSON.stringify(r).slice(0, 300));
console.log("NOT_RUN(check): 诊断意图无确定性 routeMap 映射，返回 Run hcloud --help");
