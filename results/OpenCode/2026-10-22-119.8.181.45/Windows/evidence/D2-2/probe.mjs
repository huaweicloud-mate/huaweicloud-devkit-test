// D2-2 auth status accuracy
const s = getAuthStatus('all');
console.log('type:', typeof s, 'keys:', Object.keys(s||{}).slice(0,5));
