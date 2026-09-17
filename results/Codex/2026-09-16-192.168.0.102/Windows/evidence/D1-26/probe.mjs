import { spawn } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const root = process.env.HDK_PLUGIN_ROOT;
if (!root) throw new Error("HDK_PLUGIN_ROOT is required");
const server = join(root, "src", "mcp-server.mjs");
const out = process.env.HDK_EVIDENCE_DIR || ".";
mkdirSync(out, { recursive: true });
const child = spawn(process.execPath, [server], { stdio: ["pipe", "pipe", "pipe"] });
const frames = [];
let stderr = "";
let buffer = Buffer.alloc(0);
child.stderr.setEncoding("utf8");
child.stdout.on("data", (chunk) => {
  buffer = Buffer.concat([buffer, chunk]);
  while (true) {
    const headerEnd = buffer.indexOf("\r\n\r\n");
    if (headerEnd < 0) break;
    const header = buffer.subarray(0, headerEnd).toString("ascii");
    const match = header.match(/Content-Length:\s*(\d+)/i);
    if (!match) throw new Error(`invalid MCP header: ${header}`);
    const bodyStart = headerEnd + 4;
    const bodyEnd = bodyStart + Number(match[1]);
    if (buffer.length < bodyEnd) break;
    frames.push(JSON.parse(buffer.subarray(bodyStart, bodyEnd).toString("utf8")));
    buffer = buffer.subarray(bodyEnd);
  }
});
child.stderr.on("data", (chunk) => {
  stderr += chunk;
});

const waitForResponse = (id) =>
  new Promise((resolve, reject) => {
    const deadline = setTimeout(() => reject(new Error(`timeout waiting for ${id}`)), 30000);
    const poll = () => {
      const hit = frames.find((message) => message.id === id);
      if (hit) {
        clearTimeout(deadline);
        resolve(hit);
      } else setTimeout(poll, 25);
    };
    poll();
  });

const send = (message) => {
  const body = JSON.stringify(message);
  child.stdin.write(`Content-Length: ${Buffer.byteLength(body, "utf8")}\r\n\r\n${body}`);
};
try {
  send({
    jsonrpc: "2.0",
    id: 1,
    method: "initialize",
    params: {
      protocolVersion: "2025-06-18",
      capabilities: {},
      clientInfo: { name: "codex-daily-probe", version: "1.0.0" },
    },
  });
  const initialize = await waitForResponse(1);
  send({ jsonrpc: "2.0", method: "notifications/initialized", params: {} });
  send({ jsonrpc: "2.0", id: 2, method: "tools/list", params: {} });
  const toolResponse = await waitForResponse(2);
  const tools = toolResponse.result?.tools || [];
  const summary = {
    initializeOk: !initialize.error && Boolean(initialize.result?.serverInfo),
    protocolVersion: initialize.result?.protocolVersion || null,
    toolCount: tools.length,
    allSchemasComplete: tools.every((tool) => tool.name && tool.description && tool.inputSchema),
    toolNames: tools.map((tool) => tool.name),
    stderrBytes: Buffer.byteLength(stderr),
  };
  writeFileSync(join(out, "response.json"), `${JSON.stringify({ initialize, tools: toolResponse }, null, 2)}\n`);
  writeFileSync(join(out, "stdout.log"), `${JSON.stringify(summary, null, 2)}\n`);
  console.log(JSON.stringify(summary));
} finally {
  child.kill();
}
