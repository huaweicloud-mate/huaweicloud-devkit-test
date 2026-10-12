import { hdk } from './core.mjs';
const h = await hdk();
for (const tool of ['huaweicloud_sandbox_check_user', 'huaweicloud_sandbox_sign_agreement']) {
  try {
    const r = await h.tools.callTool(tool, {});
    console.log(tool, '=>', JSON.stringify(r).slice(0, 400));
  } catch (e) {
    console.log(tool, 'threw =>', String(e).slice(0, 400));
  }
}
