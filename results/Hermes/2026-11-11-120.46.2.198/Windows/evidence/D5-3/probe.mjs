// D5-3 协议探针（spawn mcp-server JSON-RPC 实测）
import { spawn } from 'node:child_process';
const c = spawn('node', ['C:/Users/Administrator/multica_workspaces/vector-8988c3df7bc9/task-aa791fe63935/hermes-home/tools/node-26.7.0-win32-x64/node_modules/huaweicloud-devkit/plugins/huaweicloud-core/src/mcp-server.mjs'.replace(/\/g,'/')], { stdio:['pipe','pipe','pipe'] });
c.stdin.write(JSON.stringify({jsonrpc:'2.0',id:1,method:'initialize',params:{protocolVersion:'2024-11-05',capabilities:{},clientInfo:{name:'p',version:'1'}}})+'\n');
c.stdout.on('data', d=>console.log(d.toString()));
