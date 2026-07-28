const fs = require('fs');
const c = fs.readFileSync('products.js', 'utf8').replace('window.IELEN_PRODUCTS', 'IELEN_PRODUCTS');
eval(c);
const s = {};
IELEN_PRODUCTS.forEach(p => { s[p.section] = (s[p.section] || 0) + 1; });
console.log(JSON.stringify(s, null, 2));
