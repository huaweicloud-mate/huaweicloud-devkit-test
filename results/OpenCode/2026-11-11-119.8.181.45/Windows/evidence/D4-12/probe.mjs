// D4-12 supply-chain audit: audit postinstall, lockfile, npm pack file list, SBOM
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
const H='C:/Users/Administrator/devkit-test/OpenCode/hdk';
const post=readFileSync(H+'/bin/dsh-postinstall.cjs','utf-8');
console.log('suspicious=',/https?:\/\/|eval\(|child_process/.test(post));
console.log('lock=',existsSync(H+'/package-lock.json'));
console.log('sbom components=',JSON.parse(spawnSync('npm',['sbom','--sbom-format','cyclonedx','--json'],{encoding:'utf-8',shell:true,cwd:H}).stdout).components.length);
console.log('pack files=',Object.values(JSON.parse(spawnSync('npm',['pack','--json','--dry-run'],{encoding:'utf-8',shell:true,cwd:H}).stdout))[0].files.length);
