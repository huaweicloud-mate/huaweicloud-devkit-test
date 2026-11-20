// D9-2: unknown method=-32601(-32601) JSON-RPC 正确；unknown tool 未以 JSON-RPC error 返回 -32602，而是 isError:true + content 内嵌 "MCP error -32602: Tool not_a_tool not found"
console.log("{\"status\":\"SPEC-MISMATCH\",\"why\":\"unknown method=-32601(-32601) JSON-RPC 正确；unknown tool 未以 JSON-RPC error 返回 -32602，而是 isError:true + content 内嵌 \\\"MCP error -32602: Tool not_a_tool not found\\\"\"}");
