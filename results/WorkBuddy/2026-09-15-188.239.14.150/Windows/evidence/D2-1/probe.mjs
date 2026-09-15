import { readFileSync, existsSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';
// Check three-end config files exist
const credPath = join(homedir(), '.config', 'huaweicloud', 'credentials.json');
const hcloudPath = join(homedir(), '.hcloud', 'config.json');
const obsPath = join(homedir(), '.obsutilconfig');
console.log('credentials.json exists:', existsSync(credPath));
console.log('.hcloud/config.json exists:', existsSync(hcloudPath));
const credExists = existsSync(credPath);
if (credExists) {
  const creds = JSON.parse(readFileSync(credPath, 'utf-8'));
  console.log('cred keys:', Object.keys(creds).join(','));
  console.log('has ak:', !!creds.ak, 'has sk:', !!creds.sk, 'has region:', !!creds.region);
}
// hcloud config may exist if KooCLI configured
if (existsSync(hcloudPath)) {
  const hc = readFileSync(hcloudPath, 'utf-8');
  console.log('hcloud config has ak:', hc.includes('ak='));
}
if (credExists) console.log('PASS: credentials configured');
else console.log('FAIL: no credentials');