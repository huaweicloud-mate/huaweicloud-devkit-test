import { mcpTool, VC_QUOTE } from '../../_runner/lib.mjs';
const lo = await mcpTool('huaweicloud_list_operations', { service: 'ModelArts' }, 60000);
const pl = await mcpTool('huaweicloud_plan_cli_command', { vendorConfirmed: VC_QUOTE, args: ['ModelArts','ListNotebooks'], allowWrites: false }, 60000);
console.log(JSON.stringify({ listOk: lo.ok, listLen: (lo.text||'').length, classification: pl.parsed && pl.parsed.classification }, null, 2));
