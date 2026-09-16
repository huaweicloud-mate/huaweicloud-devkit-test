import { pathToFileURL } from 'node:url';
import path from 'node:path';

const hdkRoot = '/home/zhangshuang/devkit-test/Hermes/hdk';
const toolsUrl = pathToFileURL(path.join(hdkRoot, 'plugins/huaweicloud-core/src/tools.mjs')).href;
const { callTool } = await import(toolsUrl);

function redact(v) {
  if (v == null) return v;
  if (typeof v === 'string') {
    return v.replace(/(AKIA|ASIA|HUAWEI)[A-Z0-9]{8,}/gi, '$1***REDACTED***')
      .replace(/"?(access[_-]?key|secret[_-]?key|security[_-]?token|token|password)\"?\s*[:=]\s*"[^"\r\n]+"/gi, '"$1":"***REDACTED***"');
  }
  if (Array.isArray(v)) return v.map(redact);
  if (typeof v === 'object') {
    const o = {};
    for (const [k, val] of Object.entries(v)) {
      o[k] = /(^|[_-])(ak|sk|token|secret|password|accessKey|secretKey)($|[_-])/i.test(k) ? '***REDACTED***' : redact(val);
    }
    return o;
  }
  return v;
}

const out = {};

// 1. auth status (redacted)
out.auth_status = redact(await callTool('huaweicloud_auth_status', { target: 'hermes' }));

// 2. list_operations ECS
out.list_operations_ecs = redact(await callTool('huaweicloud_list_operations', { service: 'ECS', timeoutMs: 60000 }));

// 3. run_readonly ECS list
out.run_readonly_ecs = redact(await callTool('huaweicloud_run_readonly_command', { args: ['ECS', 'ListServersDetails', '--cli-region=cn-north-4', '--cli-output=json'], timeoutMs: 60000, maxRetries: 1 }));

// 4. plan a read-only VPC command
out.plan_vpc = redact(await callTool('huaweicloud_plan_cli_command', { args: ['VPC', 'ListVpcs', '--cli-region=cn-north-4'] }));

console.log(JSON.stringify(out, null, 2));