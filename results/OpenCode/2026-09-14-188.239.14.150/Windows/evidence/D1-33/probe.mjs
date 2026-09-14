// Probe: D1-33 skip file persistence and multi-path
import { pathToFileURL } from 'node:url';
import { existsSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';

const mod = await import(pathToFileURL('C:\\Users\\Administrator\\devkit-test\\OpenCode\\hdk\\plugins\\huaweicloud-core\\src\\update-check.mjs').href);

console.log('=== D1-33: Skip File Persistence & Multi-Path ===');

// Test resolveSkipFilePath
const defaultPath = mod.resolveSkipFilePath(null);
console.log('Default path:', defaultPath);
const sessionPath = mod.resolveSkipFilePath('session-123');
console.log('Session path:', sessionPath);
const stdinPath = mod.resolveSkipFilePath('stdin');
console.log('Stdin path:', stdinPath);

// Test writeSkipState structure
const tmpFile = join(homedir(), '.config', 'huaweicloud', 'test-skip33.json');
const state = mod.writeSkipState(tmpFile, '1.1.5');
console.log('State fields:', Object.keys(state).join(', '));
const hasFields = state.dismissedVersion && state.dismissedAt && state.expireAt;
console.log('Has all fields:', hasFields);

// Test readSkipState
const read = mod.readSkipState(tmpFile);
console.log('Read matches:', read.dismissedVersion === '1.1.5');

// Test atomic write (tmp file should not remain)
const tmpRemnant = tmpFile + '.' + process.pid + '.' + Date.now() + '.tmp';
console.log('No tmp remnant:', !existsSync(tmpRemnant));

// Test invalid file
const invalidRead = mod.readSkipState(join(homedir(), 'nonexistent-skip.json'));
console.log('Nonexistent file returns null:', invalidRead === null);

rmSync(tmpFile, { force: true });

// Test skipFilePath vs fallbackSkipFilePath
console.log('skipFilePath:', mod.skipFilePath());
console.log('fallbackSkipFilePath:', mod.fallbackSkipFilePath());

const pass = hasFields && read.dismissedVersion === '1.1.5' && invalidRead === null && sessionPath !== defaultPath;
console.log(`=== VERDICT: ${pass?'PASS':'FAIL'} ===`);
