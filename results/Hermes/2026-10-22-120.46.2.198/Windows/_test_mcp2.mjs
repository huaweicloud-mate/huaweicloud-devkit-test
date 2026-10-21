import { spawn } from 'node:child_process';

const serverPath = 'C:\\Users\\Administrator\\multica_workspaces\\vector-8988c3df7bc9\\task-fe1b399ab162\\hermes-home\\tools\\node-26.7.0-win32-x64\\node_modules\\huaweicloud-devkit\\plugins\\huaweicloud-core\\src\\mcp-server.mjs';
console.log('serverPath:', serverPath);

const child = spawn('node', [serverPath], { stdio: ['pipe','pipe','pipe'] });
let buf = '';
child.stdout.on('data', d => {
  buf += d.toString();
  const lines = buf.split('\\n');
  buf = lines.pop();
  for (const line of lines) {
    if (line.trim()) {
      try {
        const r = JSON.parse(line);
        if (r.id === 2) {
          console.log('tools count:', r.result?.tools?.length);
          console.log('first 5:', r.result?.tools?.slice(0,5).map(t => t.name).join(', '));
          child.kill();
          process.exit(0);
        }
        if (r.id === 1) {
          console.log('init OK:', r.result?.protocolVersion);
        }
      } catch(e) {}
    }
  }
});
child.stderr.on('data', d => { process.stderr.write(d.toString().slice(0,200)); });
child.stdin.write(JSON.stringify({jsonrpc:'2.0',id:1,method:'initialize',params:{protocolVersion:'2024-11-05',capabilities:{},clientInfo:{name:'probe',version:'1.0'}}})+'\\n');
setTimeout(() => {
  child.stdin.write(JSON.stringify({jsonrpc:'2.0',method:'notifications/initialized'})+'\\n');
  setTimeout(() => {
    child.stdin.write(JSON.stringify({jsonrpc:'2.0',id:2,method:'tools/list',params:{}})+'\\n');
  }, 500);
}, 500);
setTimeout(() => { console.log('TIMEOUT'); child.kill(); process.exit(1); }, 15000);
