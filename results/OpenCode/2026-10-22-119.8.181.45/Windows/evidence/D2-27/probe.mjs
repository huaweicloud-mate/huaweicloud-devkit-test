// D2-27 KooCLI version management
const { getKooCliVersion, compareVersion } = await import('koocli-version.mjs');
console.log('version:', getKooCliVersion());
