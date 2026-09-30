// D3-S5 场景-复合意图分层路由（预览→沙箱 未命中）
import { serviceCatalog } from 'file:///home/testbot3/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src/tools.mjs';
const r = await serviceCatalog({ intent: "先预览沙箱环境，再部署到生产 ECS" });
console.log("D3-S5 layered intent:", JSON.stringify(r).slice(0, 300));
console.log("FAIL(check): 分层意图仅命中 ECS，未命中 Sandbox（预览/沙箱分层关键词缺失）");
