import { sh, hdk } from './core.mjs';
const im = sh(['IMS','ListImages','--cli-region=cn-north-4']);
console.log('exit code:', im.ok, 'status:', im.status, 'text length:', im.text.length);
console.log('text head:', im.text.slice(0, 120));
try {
  const d = JSON.parse(im.text);
  const imgs = d.images || [];
  console.log('total images:', imgs.length);
  const ub = imgs.filter(i => (i.min_disk||0) <= 40 && /ubuntu/i.test(i.name||''));
  console.log('ubuntu<=40 count:', ub.length);
  for (const i of ub.slice(0,5)) console.log('  candidate:', i.id, i.name, 'min_disk', i.min_disk, 'os', i.__os_type, 'vis', i.visibility);
} catch(e){ console.log('parse err:', String(e).slice(0,150)); }
