// D2-27: KooCLI version
import { getKooCliVersion, parseHcloudVersion, compareVersion } from 'C:/Users/Administrator/devkit-test/opencode/hdk/plugins/huaweicloud-core/src/koocli-version.mjs';
console.log(getKooCliVersion());
console.log(parseHcloudVersion('hcloud 7.2.12'));
console.log(compareVersion('7.2.12','7.2.9'));
