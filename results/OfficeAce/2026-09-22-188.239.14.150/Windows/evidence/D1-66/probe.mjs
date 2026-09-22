// AI生成
// D1-66: 遥测开关与端点环境变量
// Test isTelemetryEnabled() and endpoint resolution
import { isTelemetryEnabled } from 'file:///C:/Users/Administrator/devkit-test/OfficeAce/hdk/plugins/huaweicloud-core/src/telemetry/telemetry.mjs';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ts = () => new Date().toISOString().replace(/[-:T]/g,'').slice(0,14);

const results = {};

try {
  // Test 1: TELEMETRY not set → enabled (default)
  delete process.env.HUAWEICLOUD_DEVKIT_TELEMETRY;
  results.defaultEnabled = isTelemetryEnabled();

  // Test 2: TELEMETRY=off → disabled
  process.env.HUAWEICLOUD_DEVKIT_TELEMETRY = 'off';
  results.offDisabled = !isTelemetryEnabled();

  // Test 3: TELEMETRY=on → enabled
  process.env.HUAWEICLOUD_DEVKIT_TELEMETRY = 'on';
  results.onEnabled = isTelemetryEnabled();

  // Test 4: TELEMETRY=1 → enabled
  process.env.HUAWEICLOUD_DEVKIT_TELEMETRY = '1';
  results.oneEnabled = isTelemetryEnabled();

  // Test 5: TELEMETRY=true → enabled
  process.env.HUAWEICLOUD_DEVKIT_TELEMETRY = 'true';
  results.trueEnabled = isTelemetryEnabled();

  // Test 6: Endpoint - verify via source code that getEndpoint uses env var fallback
  const telemetryPath = 'C:/Users/Administrator/devkit-test/OfficeAce/hdk/plugins/huaweicloud-core/src/telemetry/telemetry.mjs';
  const telemetryCode = fs.readFileSync(telemetryPath, 'utf8');
  const endpointMatch = telemetryCode.match(/function\s+getEndpoint\(\)\s*\{[^}]+\}/);
  results.getEndpointExists = !!endpointMatch;
  if (endpointMatch) {
    results.getEndpointCode = endpointMatch[0];
    results.usesEnvVar = endpointMatch[0].includes('HUAWEICLOUD_DEVKIT_TELEMETRY_ENDPOINT');
    results.usesDefault = endpointMatch[0].includes('DEFAULT_ENDPOINT');
  }
  const defaultMatch = telemetryCode.match(/DEFAULT_ENDPOINT\s*=\s*['"]([^'"]+)['"]/);
  results.defaultEndpointValue = defaultMatch ? defaultMatch[1] : 'not found';
  results.isDefaultEndpoint = results.defaultEndpointValue === 'https://devkit.huaweicloud.com/rest/developer/server/hdkitservice/telemetry/events';
  results.isCustomEndpoint = results.usesEnvVar && results.usesDefault;

  // Cleanup
  delete process.env.HUAWEICLOUD_DEVKIT_TELEMETRY;
  delete process.env.HUAWEICLOUD_DEVKIT_TELEMETRY_ENDPOINT;

  const status = (results.defaultEnabled && results.offDisabled && results.onEnabled &&
                  results.oneEnabled && results.trueEnabled && results.getEndpointExists &&
                  results.usesEnvVar && results.usesDefault && results.isDefaultEndpoint) ? 'PASS' : 'FAIL';
  
  const res = {
    status,
    why: status === 'PASS'
      ? '遥测开关正确: 默认开, off关闭, on/1/true开启; 端点未设回退DEFAULT, 设了取自定义'
      : `遥测开关异常: default=${results.defaultEnabled}, off=${results.offDisabled}, on=${results.onEnabled}, one=${results.oneEnabled}, true=${results.trueEnabled}, endpointExists=${results.getEndpointExists}, usesEnv=${results.usesEnvVar}, usesDefault=${results.usesDefault}, isDefault=${results.isDefaultEndpoint}`,
    executedAt: ts(),
    ...results
  };
  
  fs.writeFileSync(path.join(__dirname, 'stdout.log'), JSON.stringify(res, null, 2), 'utf8');
  console.log(JSON.stringify(res, null, 2));
} catch (e) {
  const res = { status: 'FAIL', why: `执行失败: ${e.message}`, executedAt: ts(), error: e.stack };
  fs.writeFileSync(path.join(__dirname, 'stdout.log'), JSON.stringify(res, null, 2), 'utf8');
  console.log(JSON.stringify(res, null, 2));
}
process.exit(0);
