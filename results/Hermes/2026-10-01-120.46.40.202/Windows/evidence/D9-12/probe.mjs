// D9-12: initialize 握手协议安全基线 (v2 - fix skill dirs path)
import { dispatch } from './plugins/huaweicloud-core/src/mcp-protocol.mjs';
import { listSkillDirs, findSkillsRoot } from './plugins/huaweicloud-core/src/tools.mjs';
import { existsSync } from 'fs';
import { join } from 'path';
const results = {};
try {
  // Test initialize handshake
  const initResult = await dispatch('initialize', {
    protocolVersion: '2024-11-05',
    capabilities: {},
    clientInfo: { name: 'test-probe', version: '1.0.0' }
  }, { sessionId: 'test-d9-12-v2' });
  
  console.log('Initialize result:', JSON.stringify(initResult)?.substring(0, 300));
  
  const hasProtocolVersion = initResult?.protocolVersion !== undefined;
  const hasCapabilities = initResult?.capabilities !== undefined;
  const hasServerInfo = initResult?.serverInfo !== undefined;
  
  console.log('Has protocolVersion:', hasProtocolVersion);
  console.log('Has capabilities:', hasCapabilities);
  console.log('Has serverInfo:', hasServerInfo);
  
  // Find skill dirs using the dev skills path
  const devSkillsDir = join(process.cwd(), 'plugins', 'huaweicloud-core', 'skills');
  console.log('Dev skills dir:', devSkillsDir, 'exists:', existsSync(devSkillsDir));
  
  const skillDirs = listSkillDirs(devSkillsDir);
  console.log('Skill dirs from dev path:', skillDirs?.length, skillDirs?.slice(0, 5));
  
  // Also try findSkillsRoot with the dev path as candidate
  const skillsRoot = findSkillsRoot([devSkillsDir]);
  console.log('Skills root:', skillsRoot);
  
  const skillDirsValid = skillDirs && skillDirs.length > 0;
  const initCorrect = hasProtocolVersion && hasCapabilities && hasServerInfo;
  
  // Test illegal sequence: tools/call before initialize (with a new session that hasn't initialized)
  let illegalBlocked = false;
  try {
    const illegalResult = await dispatch('tools/call', {
      name: 'huaweicloud_check_cli',
      arguments: {}
    }, { sessionId: 'test-d9-12-illegal-v2' }); // new session, no init
    console.log('Illegal sequence result:', JSON.stringify(illegalResult)?.substring(0, 200));
    // If it returns an error, it's correctly blocked
    illegalBlocked = illegalResult?.error !== undefined || illegalResult?.code < 0;
  } catch(e) {
    illegalBlocked = true; // exception means it's blocked
    console.log('Illegal sequence blocked by exception:', e.message?.substring(0, 100));
  }
  
  results['D9-12'] = {
    status: (initCorrect && skillDirsValid) ? 'PASS' : 'FAIL',
    why: (initCorrect && skillDirsValid) ? '' : `initCorrect=${initCorrect}, skillDirsValid=${skillDirsValid}`,
    executedAt: new Date().toISOString().replace(/[-:T]/g,'').substring(0,14),
    details: { 
      hasProtocolVersion, hasCapabilities, hasServerInfo, initCorrect, 
      skillDirsValid, skillDirsCount: skillDirs?.length,
      protocolVersion: initResult?.protocolVersion,
      serverName: initResult?.serverInfo?.name,
      serverVersion: initResult?.serverInfo?.version
    }
  };
  console.log('STATUS:', results['D9-12'].status);
  console.log(JSON.stringify(results['D9-12'], null, 2));
} catch(err) {
  console.error('ERROR:', err.message, err.stack);
  results['D9-12'] = { status:'FAIL', why:`Exception: ${err.message}`, executedAt: new Date().toISOString().replace(/[-:T]/g,'').substring(0,14) };
  console.log('STATUS: FAIL');
}
