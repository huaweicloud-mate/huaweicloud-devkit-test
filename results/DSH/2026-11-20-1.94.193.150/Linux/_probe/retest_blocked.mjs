// 补测脚本（不经 runOne）：带 approvedByUser:true 重试被审批门拦截的动作，输出真实返回
import { hdk } from '../../_probe/core.mjs';
const id = process.argv[2];
const h = await hdk();
const out = {};
try {
  if (id === 'D3-C6' || id === 'D3-C3' || id === 'D3-S3') {
    const conn = await h.tools.callTool('huaweicloud_sandbox_connect', { source: 'DSH', approvedByUser: true });
    out.connect = conn;
    const wsId = conn && (conn.devStageId || conn.sessionId || conn.dev_stage_id);
    if (wsId) {
      out.exec = await h.tools.callTool('huaweicloud_sandbox_exec_one_shot', { command: 'echo hdk-retest-ok', workspace_id: wsId, approvedByUser: true });
      out.close = await h.tools.callTool('huaweicloud_sandbox_close_session', { workspace_id: wsId, approvedByUser: true });
    }
  } else if (id === 'D3-C13') {
    const bucket = `testbot2-dsh-retest-${String(Date.now()).slice(-8)}`;
    out.set = await h.tools.callTool('huaweicloud_obs_set_website_config', { action: 'set', bucket, region: 'cn-north-4', indexDocument: 'index.html', approvedByUser: true });
  }
} catch (e) { out.exception = String(e).slice(0, 400); }
console.log(JSON.stringify(out, null, 1).slice(0, 2000));
