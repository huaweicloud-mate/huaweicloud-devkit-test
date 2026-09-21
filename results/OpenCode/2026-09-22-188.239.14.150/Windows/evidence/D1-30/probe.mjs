// D1-30: semver compare
import { semverCompare } from 'C:/Users/Administrator/devkit-test/opencode/hdk/plugins/huaweicloud-core/src/update-check.mjs';
console.log(semverCompare('1.1.2','1.1.1'));
console.log(semverCompare('1.1.0','1.1.0-next.9'));
console.log(semverCompare('1.1.5','1.1.5'));
