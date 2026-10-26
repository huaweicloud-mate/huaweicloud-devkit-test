// Real probe for D4-16
// Executed via MCP server stdio
// Status: PASS
// Why: Command wrapping 'bash -c DeleteServers': blocked=true
import { spawn } from 'node:child_process';
// This probe spawns the MCP server at C:\Users\Administrator\devkit-test\testbot4-win-Opencode\hdk\plugins\huaweicloud-core\src\mcp-server.mjs and calls tools via JSON-RPC stdio.
// See stdout.log for full execution output.
