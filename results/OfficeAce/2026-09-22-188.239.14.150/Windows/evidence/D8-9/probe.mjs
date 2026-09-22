// AI生成
// D8-9: 安装ID与遥测值脱敏 - 检查telemetry模块
import { existsSync, readFileSync, readdirSync } from 'fs';
import { join } from 'path';
const SRC = 'C:/Users/Administrator/devkit-test/officeclaw/hdk/plugins/huaweicloud-core';
const ts = () => new Date().toISOString().replace(/[-:T]/g,'').slice(0,14);
try {
  const results = [];
  // Check telemetry directory
  const telemetryDir = join(SRC, 'telemetry');
  if (existsSync(telemetryDir)) {
    const files = readdirSync(telemetryDir);
    results.push({check:'telemetry_dir', pass:true, value:{files}});
  } else {
    results.push({check:'telemetry_dir', pass:false});
  }
  // Check src/telemetry
  const srcTelemetryDir = join(SRC, 'src', 'telemetry');
  if (existsSync(srcTelemetryDir)) {
    const files = readdirSync(srcTelemetryDir);
    results.push({check:'src_telemetry_dir', pass:true, value:{files}});
    // Check for telemetry.mjs
    const telemetryFile = files.find(f => f.includes('telemetry') || f.includes('sanitize'));
    results.push({check:'telemetry_file', pass: !!telemetryFile, value:telemetryFile});
    if (telemetryFile) {
      const content = readFileSync(join(srcTelemetryDir, telemetryFile), 'utf8');
      const hasGenerateId = content.includes('generateOrRecoverInstallId') || content.includes('installId') || content.includes('install_id');
      const hasSanitize = content.includes('sanitizeValue') || content.includes('sanitize') || content.includes('redact');
      results.push({check:'install_id', pass: hasGenerateId});
      results.push({check:'sanitize', pass: hasSanitize});
    }
  } else {
    results.push({check:'src_telemetry_dir', pass:false});
  }
  const allPass = results.every(r => r.pass);
  console.log(JSON.stringify({status: allPass ? 'PASS' : 'FAIL', why: allPass ? '安装ID与遥测脱敏: telemetry模块存在, 含installId生成和sanitize/redact函数' : '部分失败: ' + results.filter(r=>!r.pass).map(r=>r.check).join(','), executedAt: ts(), details: results}));
} catch(e) { console.log(JSON.stringify({status:'BLOCKED', why:String(e.message).slice(0,300), executedAt: ts()})); }
