// p01-repro-dev.mjs - 在 dev 分支代码上复现 P0-1（hook 规则 Nova 系删除盲区）
// 直接调用 risk-rule-engine.evaluateCommandRisk（与 hook_check_command 相同引擎）
import { evaluateCommandRisk } from "file:///C:/Users/Administrator/devkit-test/hdk/plugins/huaweicloud-core/src/risk-rule-engine.mjs";

const cases = [
    ["hcloud ECS NovaDeleteServer --server_id=x", "删除单台ECS(Nova)"],
    ["hcloud ECS NovaDeleteKeypair --keypair_name=test", "删除密钥对(Nova)"],
    ["hcloud ECS DeleteServerGroup --server_group_id=g", "删除云服务器组"],
    ["hcloud ECS NovaDeleteServerGroup --server_group_id=g", "删除云服务器组(Nova)"],
    ["hcloud ECS ResetServerPassword --server_id=x --new_password=Hello123!@#", "重置密码"],
    ["hcloud ECS DeleteServers --server_ids=test1", "批量删除(对照组)"],
    ["hcloud ECS NovaListServers --limit=1", "只读查询(对照组)"],
];

let p0 = 0;
for (const [cmd, desc] of cases) {
    const r = evaluateCommandRisk(cmd);
    const rules = (r.findings ?? []).map(f => f.ruleId).join(",") || "NO-RULE";
    const blocked = r.decision !== "allow";
    console.log(`${blocked ? "PASS(拦截)" : "--- ALLOW ---"} | ${desc}\n     ${cmd}\n     -> decision=${r.decision} rules=[${rules}]`);
    if (desc.includes("删除") || desc.includes("重置")) {
        if (!blocked) { p0++; console.log("     ^^^ P0-1 盲区复现: 破坏性操作未被规则引擎拦截"); }
    }
}
console.log("---");
console.log(`结论: 破坏性操作盲区数量 = ${p0} 个`);