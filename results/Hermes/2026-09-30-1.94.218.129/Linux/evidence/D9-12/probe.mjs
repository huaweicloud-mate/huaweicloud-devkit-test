// D9-12 initialize 握手协议安全基线（非法时序）
// 协议探针：evan/harness/protocol-probe.mjs 与 root probe-d9-1213.mjs
console.log("D9-12 illegal-timing: initialize 前 tools/list 未返回 -32600（dispatch 无 initialize 状态机）");
console.log("FAIL(check): mcp-protocol.mjs:30-58 dispatch 无条件返回 tools/list");
