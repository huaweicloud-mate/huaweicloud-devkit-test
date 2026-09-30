// D3-S1 场景-只读查ECS（中文意图「云主机」路由）
import { serviceCatalog } from 'file:///home/testbot3/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src/tools.mjs';
const r = await serviceCatalog({ intent: "帮我查一下我账号在华北北京四有哪些云主机" });
console.log("D3-S1 cloud-host intent:", JSON.stringify(r).slice(0, 300));
console.log("FAIL(check): routeMap ECS 缺「云主机」关键词 -> 返回 Run hcloud --help（miss）");
