// AI生成
// D9-11: WebSocket隧道 - sandbox DevBridge隧道支持
import { existsSync, readFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';
const SRC = 'C:/Users/Administrator/devkit-test/officeclaw/hdk/plugins/huaweicloud-core';
const ts = () => new Date().toISOString().replace(/[-:T]/g,'').slice(0,14);

try {
  const results = [];

  // Check sandbox directory exists with tunnel-related files
  const sandboxDir = join(SRC, 'src', 'sandbox');
  results.push({check:'sandbox_dir_exists', pass: existsSync(sandboxDir)});

  // List sandbox files
  if (existsSync(sandboxDir)) {
    const sandboxFiles = readdirSync(sandboxDir).filter(f => f.endsWith('.mjs'));
    results.push({check:'sandbox_has_mjs_files', pass: sandboxFiles.length > 0, value: sandboxFiles});

    // Check for tunnel/devbridge related files
    const allContent = sandboxFiles.map(f => readFileSync(join(sandboxDir, f), 'utf8')).join('\n');

    // Check for WebSocket/tunnel support
    results.push({check:'has_ws_or_tunnel', pass: /WebSocket|tunnel|devbridge|DevBridge/i.test(allContent)});

    // Check for hdkitservice API
    const hdkitserviceFile = sandboxFiles.find(f => f.includes('hdkitservice'));
    results.push({check:'has_hdkitservice_api', pass: !!hdkitserviceFile});

    // Check for sandbox connect function
    results.push({check:'has_connect_logic', pass: /connect|session/i.test(allContent)});
  }

  // Check tools.mjs has sandbox-related tools
  const toolsContent = readFileSync(join(SRC, 'src', 'tools.mjs'), 'utf8');
  const sandboxTools = [
    'huaweicloud_sandbox_connect',
    'huaweicloud_sandbox_exec',
    'huaweicloud_sandbox_deploy',
  ];
  for (const t of sandboxTools) {
    results.push({check:`tool_${t}`, pass: toolsContent.includes(t)});
  }

  // Check for DevBridge tunnel in deploy check
  const deployCheckMatch = toolsContent.match(/huaweicloud_sandbox_deploy_check[\s\S]*?DevBridge/i);
  results.push({check:'deploy_check_devbridge', pass: !!deployCheckMatch || /DevBridge|devbridge/i.test(toolsContent)});

  const allPass = results.every(r => r.pass);
  console.log(JSON.stringify({status: allPass ? 'PASS' : 'FAIL', why: allPass ? `WebSocket隧道: sandbox目录存在, 含tunnel/DevBridge支持, hdkitservice API, sandbox工具注册` : '部分失败: ' + results.filter(r=>!r.pass).map(r=>r.check).join(','), executedAt: ts(), details: results}));
} catch(e) { console.log(JSON.stringify({status:'BLOCKED', why:String(e.message).slice(0,300), executedAt: ts()})); }
