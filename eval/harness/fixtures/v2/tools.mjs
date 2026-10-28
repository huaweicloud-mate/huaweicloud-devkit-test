/**
 * v2 shim：tools.mjs → v2 dist/tools.js
 * 夹具（d11-*）用到的符号与 v1 同名（callTool / TOOL_DEFINITIONS / classifyRawCommand / listSkillDirs）。
 */
import { load } from './_loader.mjs';

const m = await load('tools.js');

/**
 * v2 vendor gate 桥接：未传 vendorConfirmed 时，14 个 cloud-facing 工具会 throw
 * "Vendor gate: ..."（受管制工具见 v2 的 VENDOR_GATED_TOOLS，含 auth 系列、service_catalog、
 * plan_cli_command、run 系列 command、check_cli、list_regions、sandbox_connect、voucher 系列）。
 * v1 夹具没有 vendorConfirmed 概念，直接 throw 会让夹具崩溃成 HARNESS_ERROR。
 * 这里把 gate 拒绝桥接为「空结果」（一个空对象），夹具读字段得到 undefined，如实 FAIL。
 */
export async function callTool(name, rawArgs = {}, opts = {}) {
  try {
    return await m.callTool(name, rawArgs, opts);
  } catch (e) {
    if (/vendor gate/i.test(String(e?.message || ''))) {
      return {};
    }
    throw e;
  }
}
export const TOOL_DEFINITIONS = m.TOOL_DEFINITIONS;
export const classifyRawCommand = m.classifyRawCommand;
export const listSkillDirs = m.listSkillDirs;
export const verifySkillTree = m.verifySkillTree;
export const SKILLS_ROOT = m.SKILLS_ROOT;
export const VENDOR_GATED_TOOLS = m.VENDOR_GATED_TOOLS;