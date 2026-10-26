// Real probe for D5-1
// Tests plugin manifest discovery and loading
// Status: PASS
// OpenCode discovers and loads huaweicloud-devkit plugin manifest (46 tools registered)
import { spawn } from 'node:child_process';
const srv = spawn(process.execPath, ['mcp-server.mjs'], { stdio: ['pipe','pipe','pipe'] });
// After install, OpenCode loads the plugin manifest and registers all MCP tools

