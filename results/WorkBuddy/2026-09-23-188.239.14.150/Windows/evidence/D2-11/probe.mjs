// D2-11 - real daily probe (MCP tool call / source import / CLI)
// why: tools.mjs persistCredentials 对非空 securityToken 返回 rejected=true；片段=if (String(securityToken || '')) { return { status: 'error', error: 'Temporary STS credentials cannot be persisted (R3). Use action=temporary.', scope: 'rejected', }
